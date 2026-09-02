import {
  PublishedReport,
  PublicationHistoryItem,
  ProjectMasterData,
  MasterSCurveRecord,
  PmsRecord,
  DailyReportRecord,
  IpcRecord,
  EquipmentRecord,
  CalculatedReportKPIs
} from '../types';
import {
  initialProjectMasterData,
  initialMasterSCurveRecord,
  initialPmsRecord,
  initialDailyReportRecord,
  initialIpcRecord,
  initialEquipmentRecord
} from '../data/sampleData';
import { calculateExecutiveKPIs } from './kpiEngine';

/**
 * Creates a normalized PublishedReport snapshot from dataset records.
 */
export function buildPublishedReportSnapshot(params: {
  projectId?: string;
  version?: number;
  reportDate?: string;
  publishedBy?: string;
  master: ProjectMasterData;
  masterSCurve: MasterSCurveRecord;
  pms: PmsRecord;
  daily: DailyReportRecord;
  ipc: IpcRecord;
  equipment: EquipmentRecord;
  kpis?: CalculatedReportKPIs;
  sourceFiles?: string[];
  validationStatus?: 'valid' | 'warning' | 'error';
  notes?: string;
}): PublishedReport {
  const projectId = params.projectId || params.master.id || 'P1-MAHSHAHR';
  const reportDate = params.reportDate || params.daily.reportDate || '1405/06/08';
  const version = params.version || 1;
  const publishedAt = new Date().toISOString();
  const publishedBy = params.publishedBy || 'مدیر برنامه‌ریزی و کنترل پروژه';

  const kpis = params.kpis || calculateExecutiveKPIs(
    params.master,
    params.pms,
    params.daily,
    params.ipc,
    params.equipment,
    params.masterSCurve
  );

  // Filter issues according to executive rule (max 3, no contractor assignment)
  const issues = (params.daily.keyIssues || []).slice(0, 3).map(issue => ({
    id: issue.id,
    issueFa: issue.issueFa,
    issueEn: issue.issueEn ?? null,
    sourceFile: issue.sourceFile,
    sourceSheet: issue.sourceSheet,
    sourceRow: issue.sourceRow
  }));

  // Filter activities according to executive rule (max 4)
  const activities = (params.daily.importantActivities || []).slice(0, 4);

  const cleanDateForId = reportDate.replace(/[\/\\]/g, '-');
  const id = `pub-${projectId}-${cleanDateForId}-v${version}`;

  return {
    id,
    projectId,
    version,
    reportDate,
    publishedAt,
    publishedBy,
    project: params.master,
    kpis,
    pms: params.pms,
    scurve: params.masterSCurve,
    equipment: params.equipment,
    financial: params.ipc,
    daily: params.daily,
    issues,
    activities,
    executiveSummary: {
      linesFa: kpis.executiveSummaryLinesFa || [],
      linesEn: kpis.executiveSummaryLinesEn || []
    },
    metadata: {
      sourceFiles: params.sourceFiles || [
        params.daily.fileName,
        params.pms.fileName,
        params.equipment.fileName,
        params.ipc.fileName
      ].filter(Boolean),
      validationStatus: params.validationStatus || 'valid',
      schemaVersion: '1.0.0',
      notes: params.notes || 'Official Executive Snapshot'
    }
  };
}

/**
 * Creates the initial seed PublishedReport (Rev 1 for 1405/06/08).
 */
export function getInitialPublishedReportSeed(): PublishedReport {
  return buildPublishedReportSnapshot({
    projectId: 'P1-MAHSHAHR',
    version: 1,
    reportDate: '1405/06/08',
    publishedBy: 'دفتر مدیریت پروژه (PMO)',
    master: initialProjectMasterData,
    masterSCurve: initialMasterSCurveRecord,
    pms: initialPmsRecord,
    daily: initialDailyReportRecord,
    ipc: initialIpcRecord,
    equipment: initialEquipmentRecord,
    validationStatus: 'valid',
    notes: 'نسخه رسمی پایه گزارش مدیریتی روزانه پروژه اسکله P1'
  });
}

/**
 * Extracts a history summary item from a PublishedReport.
 */
export function extractHistoryItem(report: PublishedReport, status: 'published' | 'superseded' = 'published'): PublicationHistoryItem {
  return {
    id: report.id,
    projectId: report.projectId,
    reportDate: report.reportDate,
    version: report.version,
    publishedAt: report.publishedAt,
    publishedBy: report.publishedBy,
    status,
    summary: {
      plannedProgress: report.kpis?.plannedProgress ?? report.pms?.plannedProgress ?? null,
      actualProgress: report.kpis?.actualProgress ?? report.pms?.actualProgress ?? null,
      variance: report.kpis?.progressVariance ?? report.pms?.progressVariance ?? null,
      elapsedPercentage: report.kpis?.timeElapsedPercentage ?? null,
      equipmentPercentage: report.kpis?.equipmentInstallationPercentage ?? report.equipment?.installationPercentage ?? null,
      financialProgress: report.kpis?.financialProgress ?? report.financial?.financialSummary?.financialProgress ?? null,
      issuesCount: report.issues?.length ?? 0,
      activitiesCount: report.activities?.length ?? 0
    }
  };
}
