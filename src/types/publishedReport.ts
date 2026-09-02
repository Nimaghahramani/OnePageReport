import {
  ProjectMasterData,
  MasterSCurveRecord,
  PmsRecord,
  DailyReportRecord,
  IpcRecord,
  EquipmentRecord,
  DailyIssue,
  DailyImportantActivity,
  CalculatedReportKPIs
} from './index';

export interface PublishedReportMetadata {
  sourceFiles?: string[];
  validationStatus: 'valid' | 'warning' | 'error';
  schemaVersion: string;
  contentHash?: string;
  notes?: string;
}

export interface PublishedReport {
  id: string; // e.g. "pub-P1-MAHSHAHR-1405-06-08-v1"
  projectId: string; // "P1-MAHSHAHR"
  version: number; // 1, 2, 3...
  reportDate: string; // e.g. "1405/06/08" (Persian report date)
  publishedAt: string; // ISO string e.g. "2026-08-29T14:30:00.000Z"
  publishedBy: string; // e.g. "مدیر برنامه‌ریزی و کنترل پروژه"

  project: ProjectMasterData;
  kpis: CalculatedReportKPIs;
  pms: PmsRecord;
  scurve: MasterSCurveRecord;
  equipment: EquipmentRecord;
  financial: IpcRecord;
  daily: DailyReportRecord;
  issues: DailyIssue[];
  activities: DailyImportantActivity[];
  executiveSummary: {
    linesFa: string[];
    linesEn: string[];
  };
  metadata: PublishedReportMetadata;
}

export interface PublicationHistorySummary {
  plannedProgress: number | null;
  actualProgress: number | null;
  variance: number | null;
  elapsedPercentage: number | null;
  equipmentPercentage: number | null;
  financialProgress: number | null;
  issuesCount: number;
  activitiesCount: number;
}

export interface PublicationHistoryItem {
  id: string;
  projectId: string;
  reportDate: string;
  version: number;
  publishedAt: string;
  publishedBy: string;
  status: 'published' | 'superseded';
  summary: PublicationHistorySummary;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface AdminAuthResponse {
  authenticated: boolean;
  token?: string;
  user?: {
    username: string;
    role: string;
  };
}
