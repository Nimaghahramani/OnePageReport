export type Language = 'fa' | 'en';

export type Theme = 'light' | 'loico-blue';

export type ActiveTab = 'report' | 'update' | 'master' | 'history' | 'validation';

export type StatusColor = 'green' | 'amber' | 'red' | 'gray';

export interface ProjectMasterData {
  id: string;
  projectNameFa: string;
  projectNameEn: string;
  clientNameFa: string;
  clientNameEn: string;
  contractorNameFa: string;
  contractorNameEn: string;
  consultantNameFa: string;
  consultantNameEn: string;
  projectManagerFa?: string; // MC / مدیر طرح: شرکت مهندسان مشاور ستیران
  projectManagerEn?: string;
  locationFa: string;
  locationEn: string;
  contractNumber: string;
  contractNotificationDate?: string; // e.g. 1403/12/14
  startDate: string; // e.g. 1403/12/21
  durationDays: number;
  contractDurationText?: string; // e.g. "18 ماه شمسي"
  contractualFinishDate: string;
  forecastFinishDate: string;
  contractualEndDate?: string; // Baseline end date: e.g. 1405/06/21
  approvedExtendedEndDate?: string | null; // Approved extension if any
  temporaryExtendedEndDate?: string; // Default fallback if referenceDate > contractualEndDate: 1405/10/30
  contractValue: number;
  contractCurrency: string;
  contractValueIRR?: number; // e.g. 4653170392630
  contractValueEUR?: number; // e.g. 673167
  contractAmountIRR?: number;
  contractAmountEUR?: number;
  scopeDescriptionFa: string;
  scopeDescriptionEn: string;
  disciplines: DisciplineDefinition[];
  milestones: MilestoneDefinition[];
  majorEquipmentList: MajorEquipmentDefinition[];
  lastUpdated: string;
  updatedBy: string;
  isRealMasterData?: boolean;
}

export interface DisciplineDefinition {
  id: string;
  code: string;
  nameFa: string;
  nameEn: string;
  weight: number; // percentage, e.g. 25
}

export interface MilestoneDefinition {
  id: string;
  titleFa: string;
  titleEn: string;
  contractualDate: string;
  forecastDate: string;
  weight: number;
  status: 'completed' | 'on_track' | 'attention' | 'critical';
}

export interface MajorEquipmentDefinition {
  id: string;
  tag: string;
  nameFa: string;
  nameEn: string;
  disciplineCode: string;
  quantity: number;
  unit: string;
}

export interface MasterSCurvePoint {
  date: string; // YYYY-MM-DD
  planned: number; // 0 - 100
}

export interface ActualProgressPoint {
  dataDate: string; // YYYY-MM-DD
  actual: number;   // Cumulative % e.g. 73.2802
  source: 'INITIAL_SCURVE' | 'PMS';
  notes?: string;
}

export interface MasterSCurveRecord {
  projectId: string;
  version: number;
  sourceFile: string;
  uploadDate: string;
  points: MasterSCurvePoint[];
  initialActualPoints?: ActualProgressPoint[];
  status: 'approved' | 'superseded';
}

export interface SelectedPmsProgress {
  wbsCode: string;
  wbsName: string;
  planned: number | null;
  actual: number | null;
  variance: number | null;
  sourceRow?: number;
  missing?: boolean;
}

export interface DisciplineProgress {
  id: string;
  name: string;
  nameFa: string;
  nameEn?: string;
  code?: string;
  weight?: number;
  planned: number | null;
  actual: number | null;
  variance: number | null;
  sourceRow?: number;
  sourceActivityId?: string;
}

export interface PmsRecord {
  id: string;
  version: number;
  dataDate: string; // YYYY-MM-DD
  uploadDate: string;
  fileName: string;
  source: string;
  plannedProgress: number | null; // Current PMS Plan Progress Cumulative (e.g. 98.4078%)
  actualProgress: number;  // Current PMS Actual Progress Cumulative (e.g. 73.2802%)
  plannedCumulative?: number | null;
  actualCumulative?: number | null;
  actualLastPeriod?: number | null;
  actualThisPeriod?: number | null;
  baselinePlannedAtDataDate?: number | null; // Master S-Curve PLAN (18M) at dataDate
  previousActualProgress: number;
  progressVariance: number | null; // Actual - Planned (e.g. -25.13%)
  scheduleVarianceDays: number | null;
  forecastCompletionDate: string;
  historicalTrend: {
    dataDate: string;
    planned: number | null;
    actual: number;
  }[];
  topLevelProgress?: SelectedPmsProgress[];
  detailProgress?: SelectedPmsProgress[];
  disciplineProgress: DisciplineProgress[];
  criticalActivities: {
    id: string;
    titleFa: string;
    titleEn: string;
    discipline: string;
    totalFloatDays: number;
    status: 'in_progress' | 'delayed' | 'critical';
  }[];
  delayedActivitiesCount: number;
}

export interface DailyIssue {
  id: string;
  issueFa: string;
  issueEn?: string | null;
  sourceFile?: string;
  sourceSheet?: string;
  sourceRow?: number;

  severity?: 'critical' | 'high' | 'medium' | null;
  impactFa?: string | null;
  impactEn?: string | null;
  responsiblePartyFa?: string | null;
  responsiblePartyEn?: string | null;
  requiredActionFa?: string | null;
  requiredActionEn?: string | null;
  status?: 'open' | 'in_progress' | 'resolved' | null;
}

export const FINANCIAL_CALCULATION_BASE_IRR = 4230000000000; // 4,230,000,000,000 IRR (Current Approved Financial Calculation Base)
export const EUR_TO_IRR = 556286; // 1 EUR = 556,286 IRR (Contractual Exchange Rate)

/**
 * Consolidated permanent business & presentation rules for the Executive Report.
 * Establishes one source of truth for presentation and calculations.
 */
export const EXECUTIVE_REPORT_CONFIG = {
  issues: {
    maxItems: 3,
    showResponsibleParty: false,
    showEmptyPlaceholder: true,
  },
  activities: {
    maxItems: 4,
    showEmptyPlaceholder: false, // Do NOT show "موردی ثبت نشده است" when empty; collapse/hide
  },
  financial: {
    calculationBaseIRR: FINANCIAL_CALCULATION_BASE_IRR, // 4,230,000,000,000 IRR
    eurToIrrRate: EUR_TO_IRR, // 556,286 IRR/EUR
  },
  pdf: {
    fontFamily: 'Vazirmatn',
    orientation: 'landscape' as const,
  },
  masterDates: {
    defaultStartDate: '1403/12/21',
    contractualEndDate: '1405/06/21',
    temporaryExtendedEndDate: '1405/10/30',
  },
  footer: {
    preparedByFa: 'تهیه‌کننده: نیما قهرمانی',
    preparedByEn: 'Prepared by: Nima Ghahramani',
  }
} as const;

export interface DailyImportantActivity {
  id: string;
  sequence: number;
  description: string;
  sourceFile: string;
  sourceSheet: string;
  sourceRow: number;
}

export interface DailyReportRecord {
  id: string;
  version: number;
  dataDate: string;
  reportDate: string;
  uploadDate: string;
  fileName: string;
  source: string;
  importantActivities: DailyImportantActivity[];
  workPerformedToday?: {
    id: string;
    textFa: string;
    textEn: string;
    discipline: string;
    location?: string;
  }[];
  workOngoing: {
    id: string;
    textFa: string;
    textEn: string;
    discipline: string;
  }[];
  workPlannedTomorrow: {
    id: string;
    textFa: string;
    textEn: string;
    discipline: string;
  }[];
  manpower: {
    direct: number | null;
    indirect: number | null;
    subcontractor: number | null;
    total: number | null;
  };
  machinery: {
    active: number;
    standby: number;
    breakdownCount: number;
    total: number;
  };
  safetyHSE: {
    safeManHours: number | null;
    lostTimeInjuries: number | null;
    incidentsToday: number | null;
  };
  keyIssues: DailyIssue[];
  managementDecisionsRequired: {
    id: string;
    titleFa: string;
    titleEn: string;
    targetParty: string;
    deadline: string;
    priority: 'urgent' | 'high' | 'normal';
  }[];
}

export interface FinancialSettings {
  calculationBaseIRR: number; // e.g. 4230000000000
  eurToIrrRate: number; // e.g. 556286
}

export function eurToIrr(eur: number | null | undefined, rate: number = EUR_TO_IRR): number | null {
  if (eur == null) return null;
  return eur * rate;
}

export function combinedEquivalentIRR(
  irr: number | null | undefined,
  eur: number | null | undefined,
  rate: number = EUR_TO_IRR
): number | null {
  if (irr == null && eur == null) return null;
  return (irr ?? 0) + ((eur ?? 0) * rate);
}

export function calculatePercentage(
  numerator: number | null | undefined,
  denominator: number | null | undefined
): number | null {
  if (
    numerator == null ||
    denominator == null ||
    denominator === 0
  ) return null;
  return (numerator / denominator) * 100;
}

/**
 * Calculates Financial Progress % against the independent approved financial base (4,230,000,000,000 IRR)
 * Formula: [ IRR Amount + (EUR Amount * 556,286) ] / 4,230,000,000,000 * 100
 */
export function calculateFinancialProgress(
  irrAmount: number | null | undefined,
  eurAmount: number | null | undefined,
  calculationBaseIRR: number = FINANCIAL_CALCULATION_BASE_IRR,
  eurToIrrRate: number = EUR_TO_IRR
): number | null {
  if (irrAmount == null && eurAmount == null) return null;
  const totalEquiv = (irrAmount ?? 0) + ((eurAmount ?? 0) * eurToIrrRate);
  if (!calculationBaseIRR || calculationBaseIRR <= 0) return null;
  return (totalEquiv / calculationBaseIRR) * 100;
}

export interface FinancialSummary {
  sourceFile: string;
  sourceSheet: string;
  dataDate: string | null;

  exchangeRateEURtoIRR: number;

  // Actual Contract Amounts from Project Master (NOT to be mixed with financialCalculationBaseIRR)
  contractAmountIRR: number | null;
  contractAmountEUR: number | null;
  contractEUREquivalentIRR: number | null;
  totalContractEquivalentIRR: number | null;

  // Dedicated Fixed Financial Percentage Calculation Base (Independent Business Rule: 4,230,000,000,000 IRR)
  financialCalculationBaseIRR: number;

  advancePaymentIRR: number | null;
  advancePaymentPercentage?: number | null; // Against 4.23T base

  latestInvoiceNumber: number | null;
  latestInvoicePeriod: string | null;
  latestInvoiceStatus: string | null;

  invoiceCumulativeIRR: number | null;
  invoiceCumulativeEUR: number | null;
  invoiceEUREquivalentIRR: number | null;
  totalInvoiceEquivalentIRR: number | null;

  receivedIRR: number | null;
  receivedEUR: number | null;
  receivedEUREquivalentIRR: number | null;
  totalReceivedEquivalentIRR: number | null;

  outstandingIRR: number | null;
  outstandingEUR: number | null;
  outstandingEUREquivalentIRR: number | null;
  totalOutstandingEquivalentIRR: number | null;

  adjustmentIRR: number | null;
  adjustmentPercentage?: number | null; // Against 4.23T base

  // Progress Percentages (Denominator = 4,230,000,000,000 IRR)
  financialProgress: number | null; // (totalInvoiceEquivalentIRR / financialCalculationBaseIRR) * 100
  approvedFinancialProgress?: number | null;
  receivedFinancialProgress?: number | null; // (totalReceivedEquivalentIRR / financialCalculationBaseIRR) * 100

  // Operational Ratios (Denominator = totalInvoiceEquivalentIRR)
  collectionRatio: number | null; // (totalReceivedEquivalentIRR / totalInvoiceEquivalentIRR) * 100
  outstandingRatio: number | null; // (totalOutstandingEquivalentIRR / totalInvoiceEquivalentIRR) * 100

  traceability?: {
    exchangeRateFormula: string;
    financialCalculationBaseSource?: string;
    latestInvoiceSource: string;
    cumulativeIRRSource: string;
    cumulativeEURSource: string;
    receivedIRRSource: string;
    receivedEURSource: string;
    advancePaymentSource: string;
    adjustmentSource: string;
  };

  ipcRows?: Array<{
    invoiceNumber: number;
    period: string;
    status: string;
    grossPeriodAmountIRR?: number | null;
    cumulativeAmountIRR?: number | null;
    grossPeriodAmountEUR?: number | null;
    cumulativeAmountEUR?: number | null;
    paidAmountIRR?: number | null;
    paidAmountEUR?: number | null;
  }>;
}

export interface IpcRecord {
  id: string;
  version: number;
  dataDate: string;
  uploadDate: string;
  fileName: string;
  source: string;
  latestIpcNo: string;
  ipcPeriod: string;
  period?: string;
  status?: string;
  submittedAmount: number;
  approvedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  retainedAmount: number;
  advancePaymentAmount?: number | null;
  cumulativeSubmitted: number;
  cumulativeApproved: number;
  cumulativePaid: number;
  submissionDate: string;
  approvalDate: string;
  paymentStatus: 'paid' | 'partially_paid' | 'under_review' | 'submitted';
  currency: string;
  financialSummary?: FinancialSummary;
}

export interface EquipmentProgressItem {
  sequence: number;
  name: string;
  unit: string;
  total: number;
  completed: number;
  remaining: number;
  progressPercent: number;
  remarks: string | null;
  sourceRow: number;
  sourceFile?: string;
  sourceSheet?: string;
}

export interface EquipmentSummary {
  total: number;
  completed: number;
  remaining: number;
  weightedProgress: number;
  items: EquipmentProgressItem[];
  sourceFile?: string;
  sourceSheet?: string;
}

export interface EquipmentRecord {
  id: string;
  version: number;
  dataDate: string;
  uploadDate: string;
  fileName: string;
  source: string;
  totalEquipment: number;
  installed: number;
  remaining: number;
  deliveredSite?: number;
  availableAtSite?: number;
  inspected?: number;
  accepted?: number;
  pendingPunch?: number;
  notInstalled?: number;
  installationPercentage: number;
  equipmentSummary?: EquipmentSummary;
  items?: EquipmentProgressItem[];
  disciplineBreakdown?: {
    disciplineCode: string;
    disciplineNameFa: string;
    disciplineNameEn: string;
    total: number;
    delivered: number;
    installed: number;
    accepted: number;
    percentage: number;
  }[];
}

export interface ValidationIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  dataset: 'master' | 'pms' | 'daily' | 'ipc' | 'equipment';
  field: string;
  messageFa: string;
  messageEn: string;
  source: string;
  dataDate?: string;
  isBlocking?: boolean;
}

export interface DatasetVersionAudit {
  id: string;
  datasetType: 'pms' | 'daily' | 'ipc' | 'equipment';
  version: number;
  dataDate: string;
  uploadDate: string;
  fileName: string;
  source: string;
  user: string;
  status: 'active' | 'superseded' | 'warning';
  recordSummary: string;
}

export interface CalculatedReportKPIs {
  timeElapsedDays: number | null;
  totalDurationDays: number;
  timeElapsedPercentage: number | null;
  referenceReportDate: string | null;
  effectiveEndDate: string | null;
  effectiveEndType: 'contractual' | 'temporary_extended' | 'approved_extended' | null;
  effectiveEndLabelFa: string;
  effectiveEndLabelEn: string;
  plannedProgress: number | null;
  actualProgress: number | null;
  progressVariance: number | null;
  scheduleVarianceDays: number | null;
  scheduleDelayDays: number | null;
  plannedAchievementDate: string | null;
  plannedAchievementIsoDate: string | null;
  delayCalculationSource: 'PMS_PLANNED_CURVE' | 'MASTER_SCURVE_FALLBACK' | null;
  plannedDelayP1?: { date: string; jalaliDate: string; planned: number } | null;
  plannedDelayP2?: { date: string; jalaliDate: string; planned: number } | null;
  overallStatus: 'normal' | 'attention' | 'critical';
  overallStatusTextFa: string;
  overallStatusTextEn: string;
  equipmentTotal: number | null;
  equipmentInstalled: number | null;
  equipmentRemaining: number | null;
  equipmentInstallationPercentage: number | null;
  ipcSubmitted: number | null;
  ipcApproved: number | null;
  ipcPaid: number | null;
  ipcOutstanding: number | null;
  ipcCachedRatio: number | null;
  financialProgress: number | null;
  financialCalculationBaseIRR?: number;
  collectionRatio: number | null;
  outstandingRatio: number | null;
  financialSummary: FinancialSummary | null;
  activeManpower: number | null;
  activeMachinery: number | null;
  executiveSummaryLinesFa: string[];
  executiveSummaryLinesEn: string[];
}

export interface ColumnMappingConfig {
  datasetType: 'pms' | 'daily' | 'ipc' | 'equipment';
  mapping: Record<string, string>; // systemField -> fileColumnHeader
}

export * from './publishedReport';
