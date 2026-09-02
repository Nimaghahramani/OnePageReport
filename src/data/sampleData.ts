import {
  ProjectMasterData,
  MasterSCurveRecord,
  PmsRecord,
  DailyReportRecord,
  IpcRecord,
  EquipmentRecord,
  EquipmentProgressItem,
  EquipmentSummary,
  DatasetVersionAudit,
  FinancialSummary,
  EUR_TO_IRR,
  FINANCIAL_CALCULATION_BASE_IRR
} from '../types';

export const initialMasterSCurveRecord: MasterSCurveRecord = {
  projectId: 'master-proj-p1',
  version: 1,
  sourceFile: 'Master_SCurve_Baseline_Approved.xlsx',
  uploadDate: '1403/12/21',
  status: 'approved',
  points: [
    { date: '2025-03-31', planned: 2.04 },
    { date: '2025-04-30', planned: 4.12 },
    { date: '2025-05-31', planned: 7.30 },
    { date: '2025-06-30', planned: 11.50 },
    { date: '2025-07-31', planned: 16.80 },
    { date: '2025-08-31', planned: 23.40 },
    { date: '2025-09-30', planned: 31.20 },
    { date: '2025-10-31', planned: 40.10 },
    { date: '2025-11-30', planned: 50.00 },
    { date: '2025-12-31', planned: 60.50 },
    { date: '2026-01-31', planned: 70.80 },
    { date: '2026-02-28', planned: 79.50 },
    { date: '2026-03-31', planned: 86.40 },
    { date: '2026-04-30', planned: 91.50 },
    { date: '2026-05-31', planned: 95.30 },
    { date: '2026-06-30', planned: 97.80 },
    { date: '2026-07-31', planned: 99.20 },
    { date: '2026-08-22', planned: 99.80 },
    { date: '2026-09-30', planned: 100.00 }
  ],
  initialActualPoints: [
    { dataDate: '2025-03-31', actual: 2.21, source: 'INITIAL_SCURVE' },
    { dataDate: '2025-04-30', actual: 4.01, source: 'INITIAL_SCURVE' },
    { dataDate: '2025-05-31', actual: 6.24, source: 'INITIAL_SCURVE' },
    { dataDate: '2025-06-30', actual: 7.49, source: 'INITIAL_SCURVE' },
    { dataDate: '2025-07-31', actual: 10.73, source: 'INITIAL_SCURVE' },
    { dataDate: '2025-08-31', actual: 16.13, source: 'INITIAL_SCURVE' },
    { dataDate: '2025-09-30', actual: 24.04, source: 'INITIAL_SCURVE' },
    { dataDate: '2025-10-31', actual: 26.76, source: 'INITIAL_SCURVE' },
    { dataDate: '2025-11-30', actual: 44.81, source: 'INITIAL_SCURVE' },
    { dataDate: '2025-12-31', actual: 52.3264, source: 'INITIAL_SCURVE' },
    { dataDate: '2026-01-31', actual: 59.1472, source: 'INITIAL_SCURVE' },
    { dataDate: '2026-02-28', actual: 64.56, source: 'INITIAL_SCURVE' },
    { dataDate: '2026-03-31', actual: 69.98, source: 'INITIAL_SCURVE' },
    { dataDate: '2026-04-30', actual: 69.98, source: 'INITIAL_SCURVE' },
    { dataDate: '2026-05-31', actual: 69.98, source: 'INITIAL_SCURVE' },
    { dataDate: '2026-06-30', actual: 71.00, source: 'INITIAL_SCURVE' },
    { dataDate: '2026-07-31', actual: 71.81, source: 'INITIAL_SCURVE' },
    { dataDate: '2026-08-22', actual: 71.9092, source: 'INITIAL_SCURVE' }
  ]
};

export const initialProjectMasterData: ProjectMasterData = {
  id: 'master-proj-p1',
  projectNameFa: 'تکمیل وتجهیز اسکله P1 بندر پتروشیمی ماهشهر',
  projectNameEn: 'N/A',
  clientNameFa: 'شركت ملي صنايع پتروشيمي',
  clientNameEn: 'N/A',
  contractorNameFa: 'شرکت نواندیشان فراساحل لیان',
  contractorNameEn: 'N/A',
  consultantNameFa: 'شرکت مهندسين مشاور تدبیر ساحل پارس',
  consultantNameEn: 'N/A',
  projectManagerFa: 'شرکت مهندسان مشاور ستیران',
  projectManagerEn: 'N/A',
  locationFa: 'بندر پتروشیمی ماهشهر',
  locationEn: 'N/A',
  contractNumber: 'N/A',
  contractNotificationDate: '1403/12/14',
  startDate: '1403/12/21',
  durationDays: 550,
  contractDurationText: '18 ماه شمسي',
  contractualFinishDate: '1405/06/21',
  forecastFinishDate: '1405/06/21',
  contractualEndDate: '1405/06/21',
  temporaryExtendedEndDate: '1405/10/30',
  approvedExtendedEndDate: null,
  contractValue: 4653170392630,
  contractCurrency: 'IRR',
  contractValueIRR: 4653170392630,
  contractValueEUR: 673167,
  scopeDescriptionFa: 'تکمیل و تجهیز اسکله P1 بندر پتروشیمی ماهشهر',
  scopeDescriptionEn: 'N/A',
  disciplines: [
    { id: 'd-civil', code: 'CIVIL', nameFa: 'عملیات سیویل و سازه دریایی', nameEn: 'Marine Civil Works', weight: 35 },
    { id: 'd-mech', code: 'MECH', nameFa: 'نصب تجهیزات مکانیکال و پایپینگ', nameEn: 'Mechanical & Piping', weight: 30 },
    { id: 'd-elec', code: 'ELEC', nameFa: 'برق و ابزاردقیق', nameEn: 'Electrical & Instrumentation', weight: 20 },
    { id: 'd-proc', code: 'PROC', nameFa: 'تأمین و تدارکات کالا', nameEn: 'Procurement', weight: 15 }
  ],
  milestones: [
    { id: 'm1', titleFa: 'ابلاغ رسمی قرارداد', titleEn: 'Contract Notification', contractualDate: '1403/12/14', forecastDate: '1403/12/14', weight: 5, status: 'completed' },
    { id: 'm2', titleFa: 'شروع رسمی عملیات اجرایی', titleEn: 'Project Commencement', contractualDate: '1403/12/21', forecastDate: '1403/12/21', weight: 5, status: 'completed' },
    { id: 'm3', titleFa: 'تکمیل عملیات سازه اسکله P1', titleEn: 'P1 Jetty Structure Completion', contractualDate: '1404/08/30', forecastDate: '1404/08/30', weight: 45, status: 'on_track' },
    { id: 'm4', titleFa: 'تجهیز و راه‌اندازی کامل اسکله', titleEn: 'Full Equipping & Commissioning', contractualDate: '1405/06/21', forecastDate: '1405/06/21', weight: 45, status: 'on_track' }
  ],
  majorEquipmentList: [
    { id: 'eq-1', tag: '01-MLA-01', nameFa: 'بازوی بارگیری دریایی (Marine Loading Arm)', nameEn: 'Marine Loading Arm', disciplineCode: 'MECH', quantity: 2, unit: 'Set' },
    { id: 'eq-2', tag: '01-FF-PUMP', nameFa: 'پمپ‌های آتش‌نشانی دریایی', nameEn: 'Marine Firefighting Pumps', disciplineCode: 'MECH', quantity: 4, unit: 'Unit' },
    { id: 'eq-3', tag: '01-FENDER', nameFa: 'فندرهای جاذب ضربه اسکله', nameEn: 'Super Cone Fenders', disciplineCode: 'CIVIL', quantity: 18, unit: 'Set' },
    { id: 'eq-4', tag: '01-BOLLARD', nameFa: 'بولاردهای مهار کشتی (Bollards)', nameEn: 'Mooring Bollards 150T', disciplineCode: 'CIVIL', quantity: 12, unit: 'Unit' }
  ],
  lastUpdated: '1403/12/21',
  updatedBy: 'Lead Planning Engineer',
  isRealMasterData: true
};

export const initialPmsRecord: PmsRecord = {
  id: 'pms-v04',
  version: 4,
  dataDate: '2026-08-28',
  uploadDate: '2026-08-28 16:00',
  fileName: 'Daily_Report_Workbook.xlsx',
  source: 'PMS Official Ingestion & Site Report',
  plannedProgress: 98.41,
  actualProgress: 73.28,
  actualCumulative: 73.2802,
  actualLastPeriod: 73.2723,
  actualThisPeriod: 0.00795,
  baselinePlannedAtDataDate: 78.03,
  previousActualProgress: 73.27,
  progressVariance: -25.13,
  scheduleVarianceDays: -202,
  forecastCompletionDate: '2026-06-30',
  historicalTrend: [
    { dataDate: '2025-03-31', planned: 2.04, actual: 2.21 },
    { dataDate: '2025-04-30', planned: 4.12, actual: 4.01 },
    { dataDate: '2025-05-31', planned: 7.30, actual: 6.24 },
    { dataDate: '2025-06-30', planned: 11.50, actual: 7.49 },
    { dataDate: '2025-07-31', planned: 16.80, actual: 10.73 },
    { dataDate: '2025-08-31', planned: 23.40, actual: 16.13 },
    { dataDate: '2025-09-30', planned: 31.20, actual: 24.04 },
    { dataDate: '2025-10-31', planned: 40.10, actual: 26.76 },
    { dataDate: '2025-11-30', planned: 50.00, actual: 44.81 },
    { dataDate: '2025-12-31', planned: 60.50, actual: 52.33 },
    { dataDate: '2026-01-31', planned: 70.80, actual: 59.15 },
    { dataDate: '2026-02-28', planned: 79.50, actual: 64.56 },
    { dataDate: '2026-03-31', planned: 86.40, actual: 69.98 },
    { dataDate: '2026-04-30', planned: 91.50, actual: 69.98 },
    { dataDate: '2026-05-31', planned: 95.30, actual: 69.98 },
    { dataDate: '2026-06-30', planned: 97.80, actual: 71.00 },
    { dataDate: '2026-07-31', planned: 99.20, actual: 71.81 },
    { dataDate: '2026-08-22', planned: 99.80, actual: 71.91 },
    { dataDate: '2026-08-28', planned: 98.41, actual: 73.28 }
  ],
  topLevelProgress: [
    {
      wbsCode: '1',
      wbsName: 'Engineering / مهندسی',
      planned: 100.0,
      actual: 98.20,
      variance: -1.80
    },
    {
      wbsCode: '2',
      wbsName: 'Procurement / تأمین و تدارکات کالا',
      planned: 98.80,
      actual: 78.50,
      variance: -20.30
    },
    {
      wbsCode: '3',
      wbsName: 'Construction & Installation / عملیات اجرایی و نصب',
      planned: 96.50,
      actual: 68.40,
      variance: -28.10
    }
  ],
  detailProgress: [
    {
      wbsCode: '2.2',
      wbsName: 'Piping Materials & Valves / متریال پایپینگ و شیرآلات',
      planned: 99.0,
      actual: 88.5,
      variance: -10.5
    },
    {
      wbsCode: '2.3',
      wbsName: 'Mechanical Equipment / تجهیزات مکانیکی',
      planned: 98.5,
      actual: 82.0,
      variance: -16.5
    },
    {
      wbsCode: '2.4',
      wbsName: 'Electrical Equipment & Cables / تجهیزات و کابل‌های برق',
      planned: 95.0,
      actual: 74.0,
      variance: -21.0
    },
    {
      wbsCode: '2.5',
      wbsName: 'Instrumentation & Control / ابزار دقیق و کنترل',
      planned: 92.0,
      actual: 69.5,
      variance: -22.5
    },
    {
      wbsCode: '2.6',
      wbsName: 'Structural Steel & Plates / سازه فلزی و پلیت‌ها',
      planned: 100.0,
      actual: 95.0,
      variance: -5.0
    },
    {
      wbsCode: '2.7',
      wbsName: 'Painting & Insulation / عایق و رنگ',
      planned: 88.0,
      actual: 58.0,
      variance: -30.0
    },
    {
      wbsCode: '2.9',
      wbsName: 'Marine & Loading Arms / بازوهای بارگیری و تجهیزات دریایی',
      planned: 97.0,
      actual: 76.5,
      variance: -20.5
    }
  ],
  disciplineProgress: [
    {
      id: 'disc-civil',
      code: 'CIVIL',
      name: 'Civil / سیویل و سازه',
      nameFa: 'سیویل و سازه',
      nameEn: 'Civil & Structure',
      weight: 35,
      planned: 92.0,
      actual: 89.0,
      variance: -3.0
    },
    {
      id: 'disc-proc',
      code: 'PROC',
      name: 'Procurement / تأمین کالا',
      nameFa: 'تأمین کالا',
      nameEn: 'Procurement',
      weight: 30,
      planned: 84.0,
      actual: 78.5,
      variance: -5.5
    },
    {
      id: 'disc-mech',
      code: 'MECH',
      name: 'Mechanical & Piping / مکانیک و پایپینگ',
      nameFa: 'مکانیک و پایپینگ',
      nameEn: 'Mechanical & Piping',
      weight: 20,
      planned: 62.5,
      actual: 51.0,
      variance: -11.5
    },
    {
      id: 'disc-ei',
      code: 'EI',
      name: 'E&I / برق و ابزار دقیق',
      nameFa: 'برق و ابزار دقیق',
      nameEn: 'Electrical & Instrumentation',
      weight: 10,
      planned: 48.0,
      actual: 39.5,
      variance: -8.5
    },
    {
      id: 'disc-comm',
      code: 'COMM',
      name: 'Commissioning / راه‌اندازی',
      nameFa: 'راه‌اندازی',
      nameEn: 'Commissioning',
      weight: 5,
      planned: 12.0,
      actual: 6.0,
      variance: -6.0
    }
  ],
  criticalActivities: [
    { id: 'act-101', titleFa: 'جوشکاری و آزمون غیرمخرب (NDT) خطوط بخار اصلی بویلر', titleEn: 'HP Main Steam Lines Welding & NDT Testing', discipline: 'MECH', totalFloatDays: -18, status: 'critical' },
    { id: 'act-102', titleFa: 'کابل‌کشی و سربندی تابلوهای حفاظت پست ۴۰۰ کیلوولت', titleEn: '400kV Substation Protection Panels Cabling & Termination', discipline: 'ELEC', totalFloatDays: -12, status: 'delayed' },
    { id: 'act-103', titleFa: 'تکمیل سیستم کنترل سوخت گاز (Gas Fuel Skid & Piping)', titleEn: 'Fuel Gas Pressure Regulating Skid Piping & Testing', discipline: 'MECH', totalFloatDays: -8, status: 'in_progress' }
  ],
  delayedActivitiesCount: 14
};

export const initialDailyReportRecord: DailyReportRecord = {
  id: 'daily-v189',
  version: 189,
  dataDate: '1405/06/07',
  reportDate: '1405/06/07',
  uploadDate: '1405/06/07 18:00',
  fileName: 'Daily_Site_Report_Day_189.xlsx',
  source: 'Site Supervision & Construction Management Team',
  importantActivities: [
    {
      id: 'act-1',
      sequence: 1,
      description: 'انجام فیتاپ (Fit Up) پایپینگ',
      sourceFile: 'Daily_Report_Workbook.xlsx',
      sourceSheet: 'Construction (1)',
      sourceRow: 5
    },
    {
      id: 'act-2',
      sequence: 2,
      description: 'رنگ ساپورت برق و پایپینگ',
      sourceFile: 'Daily_Report_Workbook.xlsx',
      sourceSheet: 'Construction (1)',
      sourceRow: 6
    },
    {
      id: 'act-3',
      sequence: 3,
      description: 'جابجایی ساپورت سینی برق بین P1,P2',
      sourceFile: 'Daily_Report_Workbook.xlsx',
      sourceSheet: 'Construction (1)',
      sourceRow: 7
    },
    {
      id: 'act-4',
      sequence: 4,
      description: 'آرماتور بندی رویه گذاری جهت بتن ریزی فوم پکیج',
      sourceFile: 'Daily_Report_Workbook.xlsx',
      sourceSheet: 'Construction (1)',
      sourceRow: 8
    },
    {
      id: 'act-5',
      sequence: 5,
      description: 'انجام جوش (WELD) پایپینگ',
      sourceFile: 'Daily_Report_Workbook.xlsx',
      sourceSheet: 'Construction (1)',
      sourceRow: 9
    }
  ],
  workPerformedToday: [],
  workOngoing: [],
  workPlannedTomorrow: [],
  manpower: {
    direct: 39,
    indirect: 38,
    subcontractor: null,
    total: 99,
    present: 77,
    absent: 22,
    attendanceRatio: 77.78,
    directBreakdown: {
      total: 47,
      present: 39,
      absent: 8,
      attendanceRatio: 82.98
    },
    indirectBreakdown: {
      total: 52,
      present: 38,
      absent: 14,
      attendanceRatio: 73.08
    }
  },
  siteManpower: {
    direct: {
      total: 47,
      present: 39,
      absent: 8,
      attendanceRatio: 82.98
    },
    indirect: {
      total: 52,
      present: 38,
      absent: 14,
      attendanceRatio: 73.08
    },
    total: 99,
    present: 77,
    absent: 22,
    attendanceRatio: 77.78
  },
  machinery: {
    active: 38,
    standby: 6,
    breakdownCount: 2,
    total: 46
  },
  safetyHSE: {
    safeManHours: null,
    lostTimeInjuries: 0,
    incidentsToday: 0
  },
  keyIssues: [
    {
      id: 'iss-1',
      issueFa: 'عدم تعیین تکلیف تهیه کسری اقلام برق و ابزار دقیق',
      issueEn: 'Lack of resolution on procurement of E&I item shortages',
      sourceFile: 'Daily_Report_Workbook.xlsx',
      sourceSheet: 'Construction (2)',
      sourceRow: 14,
      severity: null,
      impactFa: null,
      responsiblePartyFa: null,
      requiredActionFa: null
    },
    {
      id: 'iss-2',
      issueFa: 'عدم تعیین تکلیف کسری بازوهای بارگیری جهت خرید و ارسال به سایت',
      issueEn: 'Lack of resolution on shortage of loading arms for procurement and site delivery',
      sourceFile: 'Daily_Report_Workbook.xlsx',
      sourceSheet: 'Construction (2)',
      sourceRow: 15,
      severity: null,
      impactFa: null,
      responsiblePartyFa: null,
      requiredActionFa: null
    },
    {
      id: 'iss-3',
      issueFa: 'تعیین تکلیف مخزن WO جهت انجام',
      issueEn: 'Resolution required for WO tank execution',
      sourceFile: 'Daily_Report_Workbook.xlsx',
      sourceSheet: 'Construction (2)',
      sourceRow: 16,
      severity: null,
      impactFa: null,
      responsiblePartyFa: null,
      requiredActionFa: null
    }
  ],
  managementDecisionsRequired: []
};

export const initialFinancialSummary: FinancialSummary = {
  sourceFile: 'Daily_Report_Workbook.xlsx',
  sourceSheet: 'Invoice',
  dataDate: '2026-08-29',
  exchangeRateEURtoIRR: EUR_TO_IRR,

  // Actual Contract Amount in Master Data (remains unchanged)
  contractAmountIRR: 4653170392630,
  contractAmountEUR: 673167,
  contractEUREquivalentIRR: 673167 * EUR_TO_IRR,
  totalContractEquivalentIRR: 4653170392630 + (673167 * EUR_TO_IRR),

  // Dedicated Financial Percentage Calculation Base: 4,230,000,000,000 IRR
  financialCalculationBaseIRR: FINANCIAL_CALCULATION_BASE_IRR,

  advancePaymentIRR: 1154139060582,
  advancePaymentPercentage: Number(((1154139060582 / FINANCIAL_CALCULATION_BASE_IRR) * 100).toFixed(2)), // 27.28%

  latestInvoiceNumber: 16,
  latestInvoicePeriod: 'تیرماه 1405',
  latestInvoiceStatus: 'تایید شده',

  invoiceCumulativeIRR: 2484501777490,
  invoiceCumulativeEUR: 848082.51,
  invoiceEUREquivalentIRR: 848082.51 * EUR_TO_IRR,
  totalInvoiceEquivalentIRR: 2484501777490 + (848082.51 * EUR_TO_IRR),

  receivedIRR: 2439778972025,
  receivedEUR: 510550.41,
  receivedEUREquivalentIRR: 510550.41 * EUR_TO_IRR,
  totalReceivedEquivalentIRR: 2439778972025 + (510550.41 * EUR_TO_IRR),

  outstandingIRR: 44722805465,
  outstandingEUR: 337532.10,
  outstandingEUREquivalentIRR: 337532.10 * EUR_TO_IRR,
  totalOutstandingEquivalentIRR: 44722805465 + (337532.10 * EUR_TO_IRR),

  adjustmentIRR: 1073741658385,
  adjustmentPercentage: Number(((1073741658385 / FINANCIAL_CALCULATION_BASE_IRR) * 100).toFixed(2)), // 25.38%

  // Progress Percentages (against 4,230,000,000,000 IRR)
  financialProgress: Number((((2484501777490 + (848082.51 * EUR_TO_IRR)) / FINANCIAL_CALCULATION_BASE_IRR) * 100).toFixed(2)), // 69.89%
  approvedFinancialProgress: Number((((2484501777490 + (848082.51 * EUR_TO_IRR)) / FINANCIAL_CALCULATION_BASE_IRR) * 100).toFixed(2)), // 69.89%
  receivedFinancialProgress: Number((((2439778972025 + (510550.41 * EUR_TO_IRR)) / FINANCIAL_CALCULATION_BASE_IRR) * 100).toFixed(2)), // 64.39%

  // Operational Ratios (against total invoice equivalent)
  collectionRatio: Number((((2439778972025 + (510550.41 * EUR_TO_IRR)) / (2484501777490 + (848082.51 * EUR_TO_IRR))) * 100).toFixed(2)), // 92.14%
  outstandingRatio: Number((((44722805465 + (337532.10 * EUR_TO_IRR)) / (2484501777490 + (848082.51 * EUR_TO_IRR))) * 100).toFixed(2)), // 7.86%

  traceability: {
    exchangeRateFormula: 'EUR Amount × 556,286 IRR',
    financialCalculationBaseSource: 'مصوب مبنای محاسبات مالی (4,230,000,000,000 IRR)',
    latestInvoiceSource: 'Worksheet "Invoice" Row 16',
    cumulativeIRRSource: 'Worksheet "Invoice" (مبلغ تجمعی ریالی)',
    cumulativeEURSource: 'Worksheet "Invoice" (مبلغ تجمعی ارزی)',
    receivedIRRSource: 'Worksheet "Invoice" (دریافتی ریالی)',
    receivedEURSource: 'Worksheet "Invoice" (دریافتی ارزی)',
    advancePaymentSource: 'Worksheet "Invoice" (مبلغ پیش پرداخت)',
    adjustmentSource: 'Worksheet "Invoice" (تعدیل(ریال))'
  }
};

export const initialIpcRecord: IpcRecord = {
  id: 'ipc-no16',
  version: 16,
  dataDate: '2026-08-29',
  uploadDate: '2026-08-29 17:00',
  fileName: 'Daily_Report_Workbook.xlsx',
  source: 'Worksheet: Invoice (Daily Report Workbook)',
  latestIpcNo: 'صورت‌وضعیت موقت شماره ۱۶ (IPC-16)',
  ipcPeriod: 'تیرماه 1405',
  submittedAmount: 2484501777490,
  approvedAmount: 2484501777490,
  paidAmount: 2439778972025,
  outstandingAmount: 44722805465,
  retainedAmount: 124225088874,
  cumulativeSubmitted: 2484501777490,
  cumulativeApproved: 2484501777490,
  cumulativePaid: 2439778972025,
  submissionDate: '1405/04/31',
  approvalDate: '1405/05/15',
  paymentStatus: 'partially_paid',
  currency: 'IRR / EUR',
  financialSummary: initialFinancialSummary
};

export const initialEquipmentItems: EquipmentProgressItem[] = [
  {
    sequence: 1,
    name: 'Fender',
    unit: 'عدد',
    total: 10,
    completed: 2,
    remaining: 8,
    progressPercent: 20,
    remarks: '2 فندر در قسمت دلفین غربی اسکله نصب شده است',
    sourceRow: 2,
    sourceFile: 'Daily_Report_Workbook.xlsx',
    sourceSheet: 'Equipment'
  },
  {
    sequence: 2,
    name: 'Fender Frame',
    unit: 'عدد',
    total: 8,
    completed: 0,
    remaining: 8,
    progressPercent: 0,
    remarks: null,
    sourceRow: 3,
    sourceFile: 'Daily_Report_Workbook.xlsx',
    sourceSheet: 'Equipment'
  },
  {
    sequence: 3,
    name: 'Frontal Frame',
    unit: 'عدد',
    total: 9,
    completed: 1,
    remaining: 8,
    progressPercent: 11.11,
    remarks: 'یک عدد فرانتال روی دلفین غربی نصب شده است',
    sourceRow: 4,
    sourceFile: 'Daily_Report_Workbook.xlsx',
    sourceSheet: 'Equipment'
  },
  {
    sequence: 4,
    name: 'طبقات پایپ رک',
    unit: 'طبقه',
    total: 2,
    completed: 2,
    remaining: 0,
    progressPercent: 100,
    remarks: null,
    sourceRow: 5,
    sourceFile: 'Daily_Report_Workbook.xlsx',
    sourceSheet: 'Equipment'
  },
  {
    sequence: 5,
    name: 'WalkWay',
    unit: 'عدد',
    total: 170,
    completed: 0,
    remaining: 170,
    progressPercent: 0,
    remarks: null,
    sourceRow: 6,
    sourceFile: 'Daily_Report_Workbook.xlsx',
    sourceSheet: 'Equipment'
  },
  {
    sequence: 6,
    name: 'Foam tower',
    unit: 'عدد',
    total: 4,
    completed: 4,
    remaining: 0,
    progressPercent: 100,
    remarks: null,
    sourceRow: 7,
    sourceFile: 'Daily_Report_Workbook.xlsx',
    sourceSheet: 'Equipment'
  },
  {
    sequence: 7,
    name: 'Lighting Tower',
    unit: 'عدد',
    total: 5,
    completed: 5,
    remaining: 0,
    progressPercent: 100,
    remarks: null,
    sourceRow: 8,
    sourceFile: 'Daily_Report_Workbook.xlsx',
    sourceSheet: 'Equipment'
  },
  {
    sequence: 8,
    name: 'Lighting Pole',
    unit: 'عدد',
    total: 5,
    completed: 0,
    remaining: 5,
    progressPercent: 0,
    remarks: null,
    sourceRow: 9,
    sourceFile: 'Daily_Report_Workbook.xlsx',
    sourceSheet: 'Equipment'
  },
  {
    sequence: 9,
    name: 'Loading Arm',
    unit: 'عدد',
    total: 8,
    completed: 8,
    remaining: 0,
    progressPercent: 100,
    remarks: null,
    sourceRow: 10,
    sourceFile: 'Daily_Report_Workbook.xlsx',
    sourceSheet: 'Equipment'
  },
  {
    sequence: 10,
    name: 'Quick Release',
    unit: 'عدد',
    total: 7,
    completed: 7,
    remaining: 0,
    progressPercent: 100,
    remarks: null,
    sourceRow: 11,
    sourceFile: 'Daily_Report_Workbook.xlsx',
    sourceSheet: 'Equipment'
  },
  {
    sequence: 11,
    name: 'Control Valve',
    unit: 'عدد',
    total: 10,
    completed: 0,
    remaining: 10,
    progressPercent: 0,
    remarks: null,
    sourceRow: 12,
    sourceFile: 'Daily_Report_Workbook.xlsx',
    sourceSheet: 'Equipment'
  },
  {
    sequence: 12,
    name: 'ESDV',
    unit: 'عدد',
    total: 14,
    completed: 0,
    remaining: 14,
    progressPercent: 0,
    remarks: null,
    sourceRow: 13,
    sourceFile: 'Daily_Report_Workbook.xlsx',
    sourceSheet: 'Equipment'
  }
];

export const initialEquipmentSummary: EquipmentSummary = {
  total: 252,
  completed: 29,
  remaining: 223,
  weightedProgress: 11.51,
  items: initialEquipmentItems,
  sourceFile: 'Daily_Report_Workbook.xlsx',
  sourceSheet: 'Equipment'
};

export const initialEquipmentRecord: EquipmentRecord = {
  id: 'eq-daily-v189',
  version: 189,
  dataDate: '1405/06/07',
  uploadDate: '1405/06/07 18:00',
  fileName: 'Daily_Report_Workbook.xlsx',
  source: 'Worksheet: Equipment (Daily Report Workbook)',
  totalEquipment: 252,
  deliveredSite: 252,
  availableAtSite: 252,
  installed: 29,
  remaining: 223,
  inspected: 29,
  accepted: 29,
  pendingPunch: 0,
  notInstalled: 223,
  installationPercentage: 11.51,
  equipmentSummary: initialEquipmentSummary,
  items: initialEquipmentItems
};

export const initialVersionAuditList: DatasetVersionAudit[] = [
  {
    id: 'aud-pms-4',
    datasetType: 'pms',
    version: 4,
    dataDate: '2026-08-31',
    uploadDate: '2026-08-31 09:15',
    fileName: 'PMS_Weekly_Rev04_20260831.xlsx',
    source: 'Primavera P6 Primavera Export',
    user: 'Eng. Alavi (Planning Lead)',
    status: 'active',
    recordSummary: 'Planned: 78.4% | Actual: 72.15% | Var: -6.25%'
  },
  {
    id: 'aud-pms-3',
    datasetType: 'pms',
    version: 3,
    dataDate: '2026-08-24',
    uploadDate: '2026-08-24 10:00',
    fileName: 'PMS_Weekly_Rev03_20260824.xlsx',
    source: 'Primavera P6 Primavera Export',
    user: 'Eng. Alavi (Planning Lead)',
    status: 'superseded',
    recordSummary: 'Planned: 77.2% | Actual: 71.40% | Var: -5.80%'
  },
  {
    id: 'aud-daily-189',
    datasetType: 'daily',
    version: 189,
    dataDate: '2026-08-31',
    uploadDate: '2026-08-31 18:00',
    fileName: 'Daily_Site_Report_Day_189.xlsx',
    source: 'Site Construction Team',
    user: 'Eng. Moradi (Site Manager)',
    status: 'active',
    recordSummary: 'Manpower: 622 | Machinery: 38 Active | Safe Hours: 1.84M'
  },
  {
    id: 'aud-ipc-14',
    datasetType: 'ipc',
    version: 14,
    dataDate: '2026-08-31',
    uploadDate: '2026-08-31 11:20',
    fileName: 'IPC_Summary_Statement_No14.xlsx',
    source: 'Contracts & Financial Dept',
    user: 'M. Hosseini (Finance Lead)',
    status: 'active',
    recordSummary: 'IPC #14: Submitted €4.85M | Approved €4.23M | Paid €2.80M'
  },
  {
    id: 'aud-eq-189',
    datasetType: 'equipment',
    version: 189,
    dataDate: '1405/06/07',
    uploadDate: '1405/06/07 18:00',
    fileName: 'Daily_Report_Workbook.xlsx',
    source: 'Worksheet: Equipment',
    user: 'Eng. Moradi (Site Manager)',
    status: 'active',
    recordSummary: 'Items: 12 | Installed: 29/252 (11.51%) | Remaining: 223'
  }
];
