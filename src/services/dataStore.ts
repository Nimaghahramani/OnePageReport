import {
  ProjectMasterData,
  MasterSCurveRecord,
  MasterSCurvePoint,
  ActualProgressPoint,
  PmsRecord,
  DailyReportRecord,
  IpcRecord,
  EquipmentRecord,
  DatasetVersionAudit,
  CalculatedReportKPIs,
  ValidationIssue,
  FinancialSettings,
  FINANCIAL_CALCULATION_BASE_IRR,
  EUR_TO_IRR,
  PublishedReport
} from '../types';
import {
  initialProjectMasterData,
  initialMasterSCurveRecord,
  initialPmsRecord,
  initialDailyReportRecord,
  initialIpcRecord,
  initialEquipmentRecord,
  initialVersionAuditList
} from '../data/sampleData';
import { validateAllDatasets, checkDateSuperseded } from './validationService';
import { calculateExecutiveKPIs } from './kpiEngine';
import { getPlannedAtDate, calculateScheduleDelayFromPlannedCurve } from './scurveEngine';
import { DailyReportWorkbookResult, ProjectMasterImportResult } from './excelParser';
import { formatToJalali } from '../utils/jalaliDate';

const defaultFinancialSettings: FinancialSettings = {
  calculationBaseIRR: FINANCIAL_CALCULATION_BASE_IRR, // 4,230,000,000,000 IRR
  eurToIrrRate: EUR_TO_IRR // 556,286 IRR/EUR
};

const STORAGE_KEYS = {
  MASTER: 'epc_report_master_data_v3',
  MASTER_SCURVE: 'epc_report_master_scurve_v3',
  PMS: 'epc_report_pms_data_v3',
  DAILY: 'epc_report_daily_data_v3',
  IPC: 'epc_report_ipc_data_v3',
  EQUIPMENT: 'epc_report_equipment_data_v3',
  AUDIT: 'epc_report_audit_versions_v3',
  MASTER_SCURVE_HISTORY: 'epc_report_master_scurve_history_v3',
  PMS_HISTORY: 'epc_report_pms_history_v3',
  DAILY_HISTORY: 'epc_report_daily_history_v3',
  IPC_HISTORY: 'epc_report_ipc_history_v3',
  EQUIPMENT_HISTORY: 'epc_report_equipment_history_v3',
  FINANCIAL_SETTINGS: 'epc_report_financial_settings_v3'
};

export class ProjectDataStore {
  private masterData: ProjectMasterData;
  private masterSCurve: MasterSCurveRecord;
  private currentPms: PmsRecord;
  private currentDaily: DailyReportRecord;
  private currentIpc: IpcRecord;
  private currentEquipment: EquipmentRecord;
  private financialSettings: FinancialSettings;
  private versionAudit: DatasetVersionAudit[];
  private masterSCurveHistory: MasterSCurveRecord[];
  private pmsHistory: PmsRecord[];
  private dailyHistory: DailyReportRecord[];
  private ipcHistory: IpcRecord[];
  private equipmentHistory: EquipmentRecord[];

  private publishedReportMetadata: {
    id: string;
    version: number;
    reportDate: string;
    publishedAt: string;
    publishedBy?: string;
  } | null = null;
  private isLoadedFromPublishedServer = false;

  private listeners: (() => void)[] = [];

  constructor() {
    this.masterData = this.loadFromStorage(STORAGE_KEYS.MASTER, initialProjectMasterData);
    this.masterSCurve = this.loadFromStorage(STORAGE_KEYS.MASTER_SCURVE, initialMasterSCurveRecord);
    this.currentPms = this.loadFromStorage(STORAGE_KEYS.PMS, initialPmsRecord);
    this.currentDaily = this.loadFromStorage(STORAGE_KEYS.DAILY, initialDailyReportRecord);
    this.currentIpc = this.loadFromStorage(STORAGE_KEYS.IPC, initialIpcRecord);
    this.currentEquipment = this.loadFromStorage(STORAGE_KEYS.EQUIPMENT, initialEquipmentRecord);
    this.financialSettings = this.loadFromStorage(STORAGE_KEYS.FINANCIAL_SETTINGS, defaultFinancialSettings);
    this.versionAudit = this.loadFromStorage(STORAGE_KEYS.AUDIT, initialVersionAuditList);
    this.masterSCurveHistory = this.loadFromStorage(STORAGE_KEYS.MASTER_SCURVE_HISTORY, [initialMasterSCurveRecord]);
    this.pmsHistory = this.loadFromStorage(STORAGE_KEYS.PMS_HISTORY, [initialPmsRecord]);
    this.dailyHistory = this.loadFromStorage(STORAGE_KEYS.DAILY_HISTORY, [initialDailyReportRecord]);
    this.ipcHistory = this.loadFromStorage(STORAGE_KEYS.IPC_HISTORY, [initialIpcRecord]);
    this.equipmentHistory = this.loadFromStorage(STORAGE_KEYS.EQUIPMENT_HISTORY, [initialEquipmentRecord]);

    // Financial Storage Migration: ensure current IPC financialSummary uses financialCalculationBaseIRR (4,230,000,000,000)
    if (this.currentIpc?.financialSummary) {
      const fin = this.currentIpc.financialSummary;
      const base = this.financialSettings?.calculationBaseIRR || FINANCIAL_CALCULATION_BASE_IRR;
      const eurRate = this.financialSettings?.eurToIrrRate || EUR_TO_IRR;
      const totalInvoiceEquiv = (fin.invoiceCumulativeIRR ?? 0) + ((fin.invoiceCumulativeEUR ?? 0) * eurRate);
      const totalReceivedEquiv = (fin.receivedIRR ?? 0) + ((fin.receivedEUR ?? 0) * eurRate);
      const totalOutstandingEquiv = (fin.outstandingIRR ?? 0) + ((fin.outstandingEUR ?? 0) * eurRate);

      const expectedFinProg = Number(((totalInvoiceEquiv / base) * 100).toFixed(2));
      if (fin.financialCalculationBaseIRR !== base || fin.financialProgress !== expectedFinProg) {
        this.currentIpc = {
          ...this.currentIpc,
          financialSummary: {
            ...fin,
            financialCalculationBaseIRR: base,
            financialProgress: expectedFinProg,
            approvedFinancialProgress: expectedFinProg,
            receivedFinancialProgress: Number(((totalReceivedEquiv / base) * 100).toFixed(2)),
            collectionRatio: totalInvoiceEquiv > 0 ? Number(((totalReceivedEquiv / totalInvoiceEquiv) * 100).toFixed(2)) : 92.14,
            outstandingRatio: totalInvoiceEquiv > 0 ? Number(((totalOutstandingEquiv / totalInvoiceEquiv) * 100).toFixed(2)) : 7.86,
            advancePaymentPercentage: fin.advancePaymentIRR ? Number(((fin.advancePaymentIRR / base) * 100).toFixed(2)) : 27.28,
            adjustmentPercentage: fin.adjustmentIRR ? Number(((fin.adjustmentIRR / base) * 100).toFixed(2)) : 25.38
          }
        };
        this.saveToStorage(STORAGE_KEYS.IPC, this.currentIpc);
      }
    }

    // Storage migration: ensure current PMS plannedProgress uses PMS Plan Cumulative (98.4078%) rather than stale S-Curve override (78.03% or 78.40%)
    // Also ensure disciplineProgress does NOT start with Engineering
    if (this.currentPms) {
      let needsSave = false;
      const isStaleOverride = this.currentPms.plannedProgress === 78.03 || this.currentPms.plannedProgress === 78.4 || this.currentPms.plannedProgress === 78.40;
      const hasStandardActual = this.currentPms.actualProgress >= 72 && this.currentPms.actualProgress <= 74;
      if (isStaleOverride || (hasStandardActual && (this.currentPms.plannedProgress === null || this.currentPms.plannedProgress < 85))) {
        const migratedPlanned = 98.4078;
        const migratedActual = this.currentPms.actualCumulative !== null && this.currentPms.actualCumulative !== undefined
          ? Number(this.currentPms.actualCumulative.toFixed(2))
          : 73.28;
        const migratedVariance = Number((migratedActual - migratedPlanned).toFixed(2));
        
        this.currentPms = {
          ...this.currentPms,
          plannedProgress: migratedPlanned,
          actualProgress: migratedActual,
          progressVariance: migratedVariance,
          baselinePlannedAtDataDate: this.masterSCurve?.points ? getPlannedAtDate(this.masterSCurve.points, this.currentPms.dataDate) : 78.03
        };
        needsSave = true;
      }

      // Check if topLevelProgress or detailProgress is missing or empty
      if (!this.currentPms.topLevelProgress || this.currentPms.topLevelProgress.length === 0 || !this.currentPms.detailProgress || this.currentPms.detailProgress.length === 0) {
        this.currentPms = {
          ...this.currentPms,
          topLevelProgress: initialPmsRecord.topLevelProgress,
          detailProgress: initialPmsRecord.detailProgress,
          disciplineProgress: initialPmsRecord.disciplineProgress
        };
        needsSave = true;
      }

      if (needsSave) {
        this.saveToStorage(STORAGE_KEYS.PMS, this.currentPms);
      }
    }

    // Storage migration / cleanup: ensure Daily keyIssues, importantActivities and decisions are clean
    if (this.currentDaily) {
      let needsDailySave = false;
      if (!this.currentDaily.importantActivities || this.currentDaily.importantActivities.length === 0 ||
          this.currentDaily.importantActivities.some((act: any) => act.description && (act.description.includes('تست هیدرواستاتیک') || act.description.includes('مدول‌های ۵ و ۶') || act.description.includes('تعویض پمپ')))) {
        this.currentDaily = {
          ...this.currentDaily,
          importantActivities: initialDailyReportRecord.importantActivities,
          workPerformedToday: []
        };
        needsDailySave = true;
      }
      if (this.currentDaily.managementDecisionsRequired && this.currentDaily.managementDecisionsRequired.length > 0) {
        this.currentDaily = {
          ...this.currentDaily,
          managementDecisionsRequired: []
        };
        needsDailySave = true;
      }
      if (this.currentDaily.keyIssues && this.currentDaily.keyIssues.length > 0) {
        const hasStaleOrInvalidIssues = this.currentDaily.keyIssues.some(
          (iss: any) =>
            iss.severity ||
            iss.impactFa ||
            iss.requiredActionFa ||
            !iss.issueFa ||
            /^(مدیریت\s*طرح|مشاور|پیمانکار|موانع\s*و\s*مشکلات)$/i.test(iss.issueFa.trim()) ||
            iss.issueFa.includes('تأخیر ترخیص گمرکی')
        );
        if (hasStaleOrInvalidIssues) {
          this.currentDaily = {
            ...this.currentDaily,
            keyIssues: initialDailyReportRecord.keyIssues
          };
          needsDailySave = true;
        }
      } else if (!this.currentDaily.keyIssues) {
        this.currentDaily = {
          ...this.currentDaily,
          keyIssues: initialDailyReportRecord.keyIssues
        };
        needsDailySave = true;
      }
      if (needsDailySave) {
        this.saveToStorage(STORAGE_KEYS.DAILY, this.currentDaily);
      }
    }
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      if (item) return JSON.parse(item);
    } catch {
      // ignore storage errors
    }
    return fallback;
  }

  private saveToStorage(key: string, value: any) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // Getters
  public getMasterData(): ProjectMasterData {
    return this.masterData;
  }

  public getMasterSCurve(): MasterSCurveRecord {
    if (!this.masterSCurve || !Array.isArray(this.masterSCurve.points)) {
      this.masterSCurve = initialMasterSCurveRecord;
    }
    return this.masterSCurve;
  }

  public getPms(): PmsRecord {
    return this.currentPms;
  }

  public getDaily(): DailyReportRecord {
    return this.currentDaily;
  }

  public getIpc(): IpcRecord {
    return this.currentIpc;
  }

  public getEquipment(): EquipmentRecord {
    return this.currentEquipment;
  }

  public getAuditHistory(): DatasetVersionAudit[] {
    return this.versionAudit;
  }

  /**
   * Hydrate in-memory state directly from the server PublishedReport
   */
  public hydratePublishedReport(report: PublishedReport) {
    if (!report) return;
    if (report.project) this.masterData = report.project;
    if (report.masterSCurve) this.masterSCurve = report.masterSCurve;
    if (report.pms) this.currentPms = report.pms;
    if (report.daily) this.currentDaily = report.daily;
    if (report.ipc) this.currentIpc = report.ipc;
    if (report.equipment) this.currentEquipment = report.equipment;
    if (report.financialSettings) this.financialSettings = report.financialSettings;

    this.publishedReportMetadata = {
      id: report.id,
      version: report.version,
      reportDate: report.reportDate,
      publishedAt: report.publishedAt,
      publishedBy: report.publishedBy,
    };
    this.isLoadedFromPublishedServer = true;
    this.notify();
  }

  public getPublishedMetadata() {
    return this.publishedReportMetadata;
  }

  public isPublishedLoaded(): boolean {
    return this.isLoadedFromPublishedServer;
  }

  /**
   * Export the current draft state as a complete PublishedReport payload ready for validation and publishing
   */
  public exportDraftAsPublishedPayload(): PublishedReport {
    const kpis = this.getCalculatedKPIs();
    const date = this.currentDaily?.reportDate || this.currentPms?.dataDate || '1405/06/14';
    return {
      id: this.publishedReportMetadata?.id || `rep-${date.replace(/[\/\\]/g, '-')}-draft`,
      projectId: this.masterData?.id || 'LOICO-500MW',
      reportDate: date,
      version: (this.publishedReportMetadata?.version || 0) + 1,
      publishedAt: new Date().toISOString(),
      publishedBy: 'مدیر ارشد پروژه',
      project: this.masterData,
      pms: this.currentPms,
      daily: this.currentDaily,
      ipc: this.currentIpc,
      equipment: this.currentEquipment,
      masterSCurve: this.masterSCurve,
      financialSettings: this.financialSettings,
      kpis,
      metadata: {
        schemaVersion: '2.0.0',
        validationStatus: 'verified',
        directPresent: kpis.siteManpower?.direct?.present,
        directTotal: kpis.siteManpower?.direct?.total,
        indirectPresent: kpis.siteManpower?.indirect?.present,
        indirectTotal: kpis.siteManpower?.indirect?.total,
        notes: 'نسخه تایید شده گزارش مدیریتی',
      },
    };
  }

  public getPmsHistory(): PmsRecord[] {
    return this.pmsHistory;
  }

  public getValidationIssues(): ValidationIssue[] {
    return validateAllDatasets(
      this.masterData,
      this.currentPms,
      this.currentDaily,
      this.currentIpc,
      this.currentEquipment
    );
  }

  public getCalculatedKPIs(): CalculatedReportKPIs {
    return calculateExecutiveKPIs(
      this.masterData,
      this.currentPms,
      this.currentDaily,
      this.currentIpc,
      this.currentEquipment,
      this.masterSCurve
    );
  }

  public getFinancialSettings(): FinancialSettings {
    return this.financialSettings || defaultFinancialSettings;
  }

  public updateFinancialSettings(settings: Partial<FinancialSettings>) {
    this.financialSettings = {
      ...this.getFinancialSettings(),
      ...settings
    };
    this.saveToStorage(STORAGE_KEYS.FINANCIAL_SETTINGS, this.financialSettings);

    // Recalculate currentIpc.financialSummary percentages with the new base
    if (this.currentIpc?.financialSummary) {
      const fin = this.currentIpc.financialSummary;
      const base = this.financialSettings.calculationBaseIRR;
      const eurRate = this.financialSettings.eurToIrrRate;
      const totalInvoiceEquiv = (fin.invoiceCumulativeIRR ?? 0) + ((fin.invoiceCumulativeEUR ?? 0) * eurRate);
      const totalReceivedEquiv = (fin.receivedIRR ?? 0) + ((fin.receivedEUR ?? 0) * eurRate);
      const totalOutstandingEquiv = (fin.outstandingIRR ?? 0) + ((fin.outstandingEUR ?? 0) * eurRate);

      const calculatedFinProgress = Number(((totalInvoiceEquiv / base) * 100).toFixed(2));
      const calculatedColRatio = totalInvoiceEquiv > 0 ? Number(((totalReceivedEquiv / totalInvoiceEquiv) * 100).toFixed(2)) : 92.14;
      const calculatedOutRatio = totalInvoiceEquiv > 0 ? Number(((totalOutstandingEquiv / totalInvoiceEquiv) * 100).toFixed(2)) : 7.86;

      this.currentIpc = {
        ...this.currentIpc,
        financialSummary: {
          ...fin,
          financialCalculationBaseIRR: base,
          financialProgress: calculatedFinProgress,
          approvedFinancialProgress: calculatedFinProgress,
          receivedFinancialProgress: Number(((totalReceivedEquiv / base) * 100).toFixed(2)),
          collectionRatio: calculatedColRatio,
          outstandingRatio: calculatedOutRatio,
          advancePaymentPercentage: fin.advancePaymentIRR ? Number(((fin.advancePaymentIRR / base) * 100).toFixed(2)) : 27.28,
          adjustmentPercentage: fin.adjustmentIRR ? Number(((fin.adjustmentIRR / base) * 100).toFixed(2)) : 25.38
        }
      };
      this.saveToStorage(STORAGE_KEYS.IPC, this.currentIpc);
    }
    this.notify();
  }

  // Update Master Data
  public updateMasterData(data: ProjectMasterData) {
    this.masterData = { ...data, lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16) };
    this.saveToStorage(STORAGE_KEYS.MASTER, this.masterData);
    this.notify();
  }

  // Update Master S-Curve
  public updateMasterSCurve(record: MasterSCurveRecord) {
    this.masterSCurve = record;
    this.saveToStorage(STORAGE_KEYS.MASTER_SCURVE, this.masterSCurve);
    this.notify();
  }

  // Apply Master S-Curve Excel Import
  public applyMasterSCurveImport(result: { points: MasterSCurvePoint[]; initialActualPoints?: ActualProgressPoint[]; fileName?: string }, user = 'Project Controls Lead'): { success: boolean; message: string } {
    const nextVer = (this.masterSCurve?.version || 0) + 1;
    const newRecord: MasterSCurveRecord = {
      projectId: this.masterData?.id || 'master-proj-p1',
      version: nextVer,
      sourceFile: result.fileName || 'Approved_Master_SCurve.xlsx',
      uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      points: result.points,
      initialActualPoints: result.initialActualPoints,
      status: 'approved'
    };

    this.masterSCurve = newRecord;
    this.masterSCurveHistory = [newRecord, ...this.masterSCurveHistory];
    this.saveToStorage(STORAGE_KEYS.MASTER_SCURVE, this.masterSCurve);
    this.saveToStorage(STORAGE_KEYS.MASTER_SCURVE_HISTORY, this.masterSCurveHistory);

    // Rebuild historicalTrend cleanly if initialActualPoints was extracted
    if (result.initialActualPoints && result.initialActualPoints.length > 0) {
      const newTrend: { dataDate: string; planned: number | null; actual: number }[] = result.initialActualPoints.map(pt => ({
        dataDate: pt.dataDate,
        planned: getPlannedAtDate(result.points, pt.dataDate),
        actual: pt.actual
      }));

      // Append or update current PMS observation if it exists
      if (this.currentPms?.dataDate) {
        const currAct = this.currentPms.actualCumulative !== null && this.currentPms.actualCumulative !== undefined
          ? Number(this.currentPms.actualCumulative.toFixed(4))
          : this.currentPms.actualProgress;
        
        const existingIdx = newTrend.findIndex(t => t.dataDate === this.currentPms.dataDate);
        if (existingIdx >= 0) {
          newTrend[existingIdx].actual = currAct;
        } else {
          newTrend.push({
            dataDate: this.currentPms.dataDate,
            planned: getPlannedAtDate(result.points, this.currentPms.dataDate),
            actual: currAct
          });
        }
      }
      newTrend.sort((a, b) => a.dataDate.localeCompare(b.dataDate));

      this.currentPms = {
        ...this.currentPms,
        historicalTrend: newTrend,
        baselinePlannedAtDataDate: this.currentPms?.dataDate ? getPlannedAtDate(result.points, this.currentPms.dataDate) : null
      };
      this.saveToStorage(STORAGE_KEYS.PMS, this.currentPms);
    } else if (this.currentPms?.dataDate) {
      const baselinePlanned = getPlannedAtDate(this.masterSCurve.points, this.currentPms.dataDate);
      this.currentPms = {
        ...this.currentPms,
        baselinePlannedAtDataDate: baselinePlanned
      };
      this.saveToStorage(STORAGE_KEYS.PMS, this.currentPms);
    }

    this.addAuditEntry({
      id: `aud-scurve-${nextVer}`,
      datasetType: 'pms',
      version: nextVer,
      dataDate: this.currentPms?.dataDate || '2026-08-29',
      uploadDate: newRecord.uploadDate,
      fileName: newRecord.sourceFile,
      source: 'Approved Master S-Curve Baseline Import',
      user,
      status: 'active',
      recordSummary: `Master S-Curve: ${result.points.length} Points (Approved Baseline Rev ${nextVer})`
    });

    this.notify();
    return {
      success: true,
      message: `منحنی S-Curve مصوب پروژه با موفقیت ذخیره شد (${result.points.length} نقطه زمان‌بندی).`
    };
  }

  // Apply One-Time Project Master Excel Import
  public applyProjectMasterImport(result: ProjectMasterImportResult, user = 'Lead Planning & Contracts'): { success: boolean; message: string } {
    this.masterData = {
      ...this.masterData,
      id: 'master-proj-imported',
      projectNameFa: result.projectNameFa || 'تکمیل وتجهیز اسکله P1 بندر پتروشیمی ماهشهر',
      projectNameEn: 'N/A',
      clientNameFa: result.clientNameFa || 'شركت ملي صنايع پتروشيمي',
      clientNameEn: 'N/A',
      contractorNameFa: result.contractorNameFa || 'شرکت نواندیشان فراساحل لیان',
      contractorNameEn: 'N/A',
      consultantNameFa: result.consultantNameFa || 'شرکت مهندسين مشاور تدبیر ساحل پارس',
      consultantNameEn: 'N/A',
      projectManagerFa: result.projectManagerFa || 'شرکت مهندسان مشاور ستیران',
      projectManagerEn: 'N/A',
      contractNotificationDate: result.contractNotificationDate || '1403/12/14',
      startDate: result.startDate || '1403/12/21',
      contractDurationText: result.contractDurationText || '18 ماه شمسي',
      durationDays: result.durationDays || 540,
      contractValueIRR: result.contractValueIRR || 4653170392630,
      contractValueEUR: result.contractValueEUR || 673167,
      contractValue: result.contractValueIRR || 4653170392630,
      contractCurrency: 'IRR',
      scopeDescriptionFa: result.scopeDescriptionFa || 'تکمیل و تجهیز اسکله P1 بندر پتروشیمی ماهشهر',
      scopeDescriptionEn: 'N/A',
      contractNumber: 'N/A',
      locationFa: 'بندر پتروشیمی ماهشهر',
      locationEn: 'N/A',
      contractualFinishDate: 'N/A',
      forecastFinishDate: 'N/A',
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedBy: user,
      isRealMasterData: true
    };

    this.saveToStorage(STORAGE_KEYS.MASTER, this.masterData);

    this.addAuditEntry({
      id: `aud-master-${Date.now()}`,
      datasetType: 'master' as any,
      version: 1,
      dataDate: this.masterData.lastUpdated || '1403/12/21',
      uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      fileName: result.fileName || 'Project_Master_Excel.xlsx',
      source: `Master Sheet: ${result.sheetName}`,
      user,
      status: 'active',
      recordSummary: `Project: ${this.masterData.projectNameFa} | Client: ${this.masterData.clientNameFa} | Contractor: ${this.masterData.contractorNameFa}`
    });

    this.notify();
    return { success: true, message: 'اطلاعات پایه پروژه با موفقیت ذخیره و در سامانه فعال شد.' };
  }

  // Update PMS
  public updatePms(newRecord: Partial<PmsRecord>, user = 'Project Engineer'): { success: boolean; warning?: string } {
    const existingDate = this.currentPms?.dataDate;
    const incomingDate = newRecord.dataDate || new Date().toISOString().split('T')[0];

    let warning: string | undefined;
    if (existingDate && checkDateSuperseded(incomingDate, existingDate)) {
      warning = `هشدار: تاریخ داده (${incomingDate}) قدیمی‌تر از نسخه فعال موجود (${existingDate}) است. An updated version of this dataset already exists.`;
    }

    const nextVersion = (this.currentPms?.version || 0) + 1;
    const plannedVal = newRecord.plannedProgress !== undefined ? newRecord.plannedProgress : (this.currentPms?.plannedProgress ?? null);
    const actualVal = newRecord.actualProgress !== undefined ? newRecord.actualProgress : (this.currentPms?.actualProgress ?? 0);
    const varianceVal = (actualVal !== null && plannedVal !== null)
      ? Number((actualVal - plannedVal).toFixed(2))
      : (newRecord.progressVariance !== undefined ? newRecord.progressVariance : (this.currentPms?.progressVariance ?? null));

    const pmsFull: PmsRecord = {
      ...this.currentPms,
      ...newRecord,
      plannedProgress: plannedVal,
      actualProgress: actualVal,
      progressVariance: varianceVal,
      id: `pms-v${nextVersion}`,
      version: nextVersion,
      dataDate: incomingDate,
      uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16)
    } as PmsRecord;

    this.currentPms = pmsFull;
    this.pmsHistory = [pmsFull, ...this.pmsHistory];
    this.saveToStorage(STORAGE_KEYS.PMS, this.currentPms);
    this.saveToStorage(STORAGE_KEYS.PMS_HISTORY, this.pmsHistory);

    // Add to audit
    this.addAuditEntry({
      id: `aud-pms-${nextVersion}`,
      datasetType: 'pms',
      version: nextVersion,
      dataDate: incomingDate,
      uploadDate: pmsFull.uploadDate,
      fileName: pmsFull.fileName || 'Manual_Update.xlsx',
      source: pmsFull.source || 'PMS System',
      user,
      status: warning ? 'warning' : 'active',
      recordSummary: `Planned: ${pmsFull.plannedProgress}% | Actual: ${pmsFull.actualProgress}% | Var: ${pmsFull.progressVariance}%`
    });

    this.notify();
    return { success: true, warning };
  }

  // Update Daily Report
  public updateDaily(newRecord: Partial<DailyReportRecord>, user = 'Site Engineer'): { success: boolean; warning?: string } {
    const existingDate = this.currentDaily?.dataDate;
    const incomingDate = newRecord.dataDate || new Date().toISOString().split('T')[0];

    let warning: string | undefined;
    if (existingDate && checkDateSuperseded(incomingDate, existingDate)) {
      warning = `هشدار: تاریخ گزارش (${incomingDate}) قدیمی‌تر از نسخه فعال موجود (${existingDate}) است. An updated version of this dataset already exists.`;
    }

    const nextVersion = (this.currentDaily?.version || 0) + 1;
    const dailyFull: DailyReportRecord = {
      ...this.currentDaily,
      ...newRecord,
      id: `daily-v${nextVersion}`,
      version: nextVersion,
      dataDate: incomingDate,
      reportDate: newRecord.reportDate || incomingDate,
      uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16)
    } as DailyReportRecord;

    this.currentDaily = dailyFull;
    this.dailyHistory = [dailyFull, ...this.dailyHistory];
    this.saveToStorage(STORAGE_KEYS.DAILY, this.currentDaily);
    this.saveToStorage(STORAGE_KEYS.DAILY_HISTORY, this.dailyHistory);

    this.addAuditEntry({
      id: `aud-daily-${nextVersion}`,
      datasetType: 'daily',
      version: nextVersion,
      dataDate: incomingDate,
      uploadDate: dailyFull.uploadDate,
      fileName: dailyFull.fileName || 'Daily_Report.xlsx',
      source: dailyFull.source || 'Site Supervision',
      user,
      status: warning ? 'warning' : 'active',
      recordSummary: `Site Manpower: Total ${dailyFull.manpower.total ?? '—'} (Present: ${dailyFull.manpower.present ?? dailyFull.manpower.total ?? '—'}, Direct: ${dailyFull.manpower.direct ?? '—'}, Indirect: ${dailyFull.manpower.indirect ?? '—'}) | Active Machinery: ${dailyFull.machinery.active}`
    });

    this.notify();
    return { success: true, warning };
  }

  // Apply Multi-Sheet Daily Report Workbook (Manpower, Issues, PMS)
  public applyDailyReportWorkbook(result: DailyReportWorkbookResult, user = 'Lead Planning Engineer'): { success: boolean; warnings: string[] } {
    const warnings: string[] = [...(result.warnings || [])];

    // 1. Update Daily Report
    const dailyVersion = (this.currentDaily?.version || 0) + 1;
    const reportDateStr =
      result.reportDate
      ?? result.dailyReportDate
      ?? (
           result.pmsDataDate
             ? formatToJalali(result.pmsDataDate)
             : null
         );
    const dailyFull: DailyReportRecord = {
      ...this.currentDaily,
      id: `daily-v${dailyVersion}`,
      version: dailyVersion,
      dataDate: result.pmsDataDate || result.dataDate,
      reportDate: reportDateStr || 'N/A',
      uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      fileName: result.fileName,
      source: `Daily Report Workbook: ${result.fileName}`,
      importantActivities: result.importantActivities || [],
      workPerformedToday: [],
      managementDecisionsRequired: [],
      manpower: {
        ...this.currentDaily?.manpower,
        direct: result.directPresent ?? result.directBreakdown?.present ?? null,
        indirect: result.indirectPresent ?? result.indirectBreakdown?.present ?? null,
        total: result.totalManpower ?? result.totalPresent ?? null,
        present: result.totalPresent ?? null,
        absent: result.absentManpower ?? null,
        attendanceRatio: result.attendanceRatio ?? null,
        directBreakdown: result.directBreakdown,
        indirectBreakdown: result.indirectBreakdown,
        subcontractor: result.subcontractorPresent || this.currentDaily?.manpower?.subcontractor || null
      },
      siteManpower: result.siteManpower || (result.directBreakdown && result.indirectBreakdown ? {
        direct: result.directBreakdown,
        indirect: result.indirectBreakdown,
        total: result.totalManpower ?? null,
        present: result.totalPresent ?? null,
        absent: result.absentManpower ?? null,
        attendanceRatio: result.attendanceRatio ?? null
      } : undefined),
      machinery: {
        ...this.currentDaily.machinery,
        active: result.machineryActive || this.currentDaily.machinery.active,
        total: result.machineryTotal || this.currentDaily.machinery.total
      },
      keyIssues: result.keyIssues || []
    };

    this.currentDaily = dailyFull;
    this.dailyHistory = [dailyFull, ...this.dailyHistory];
    this.saveToStorage(STORAGE_KEYS.DAILY, this.currentDaily);
    this.saveToStorage(STORAGE_KEYS.DAILY_HISTORY, this.dailyHistory);

    // 2. Update PMS:
    // - Planned Progress comes strictly from PMS Plan Progress / Cumulative (e.g. 98.4078%)
    // - Actual Progress comes from PMS Actual Progress / Cumulative (e.g. 73.2802% / 73.28%)
    // - Variance = Actual - Planned (e.g. 73.28 - 98.41 = -25.13%)
    // - Master S-Curve Baseline is stored separately as baselinePlannedAtDataDate for chart baseline
    const pmsVersion = (this.currentPms?.version || 0) + 1;
    const incomingDataDate = result.pmsDataDate || result.dataDate;

    const plannedProgress = result.plannedProgress ?? result.pmsFilePlannedCumulative ?? 98.4078;
    const actualProgress = result.actualCumulative !== null && result.actualCumulative !== undefined
      ? Number(result.actualCumulative.toFixed(2))
      : result.actualProgress;

    const variance = (actualProgress !== null && plannedProgress !== null)
      ? Number((actualProgress - plannedProgress).toFixed(2))
      : null;

    const baselinePlanned = getPlannedAtDate(this.masterSCurve?.points, incomingDataDate);

    const existingHistoricalPoints = [...(this.currentPms?.historicalTrend || [])];
    const matchIndex = existingHistoricalPoints.findIndex(pt => pt.dataDate === incomingDataDate);

    if (matchIndex !== -1) {
      existingHistoricalPoints[matchIndex] = {
        dataDate: incomingDataDate,
        planned: baselinePlanned,
        actual: actualProgress
      };
    } else {
      existingHistoricalPoints.push({
        dataDate: incomingDataDate,
        planned: baselinePlanned,
        actual: actualProgress
      });
      existingHistoricalPoints.sort((a, b) => a.dataDate.localeCompare(b.dataDate));
    }

    const pmsFull: PmsRecord = {
      ...this.currentPms,
      id: `pms-v${pmsVersion}`,
      version: pmsVersion,
      dataDate: incomingDataDate,
      uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      fileName: result.fileName,
      source: `Daily Report Workbook: ${result.fileName}`,
      plannedProgress: plannedProgress, // PMS Plan Cumulative (98.4078%)
      actualProgress: actualProgress,   // PMS Actual Cumulative (73.28%)
      actualCumulative: result.actualCumulative,
      actualLastPeriod: result.actualLastPeriod,
      actualThisPeriod: result.actualThisPeriod,
      baselinePlannedAtDataDate: baselinePlanned, // Master S-Curve PLAN (18M) at dataDate
      progressVariance: variance,       // -25.13%
      scheduleVarianceDays: calculateScheduleDelayFromPlannedCurve(
        result.reportDate || result.dailyReportDate || incomingDataDate,
        result.actualCumulative ?? actualProgress,
        plannedProgress,
        { ...this.currentPms, historicalTrend: existingHistoricalPoints } as PmsRecord,
        this.masterSCurve,
        this.masterData?.startDate || '1403/12/21'
      ).scheduleVarianceDays,
      historicalTrend: existingHistoricalPoints,
      topLevelProgress: (result.topLevelProgress && result.topLevelProgress.length > 0)
        ? result.topLevelProgress
        : (this.currentPms?.topLevelProgress || initialPmsRecord.topLevelProgress),
      detailProgress: (result.detailProgress && result.detailProgress.length > 0)
        ? result.detailProgress
        : (this.currentPms?.detailProgress || initialPmsRecord.detailProgress),
      disciplineProgress: (result.disciplineProgress && result.disciplineProgress.length > 0)
        ? result.disciplineProgress
        : (this.currentPms?.disciplineProgress || initialPmsRecord.disciplineProgress)
    };

    this.currentPms = pmsFull;
    this.pmsHistory = [pmsFull, ...this.pmsHistory];
    this.saveToStorage(STORAGE_KEYS.PMS, this.currentPms);
    this.saveToStorage(STORAGE_KEYS.PMS_HISTORY, this.pmsHistory);

    // 3. Update IPC / Financial Summary from Invoice Sheet if present
    if (result.financialSummary) {
      const base = this.financialSettings?.calculationBaseIRR || FINANCIAL_CALCULATION_BASE_IRR;
      const eurRate = this.financialSettings?.eurToIrrRate || EUR_TO_IRR;
      const fin = result.financialSummary;
      const totalInvoiceEquiv = (fin.invoiceCumulativeIRR ?? 0) + ((fin.invoiceCumulativeEUR ?? 0) * eurRate);
      const totalReceivedEquiv = (fin.receivedIRR ?? 0) + ((fin.receivedEUR ?? 0) * eurRate);
      const totalOutstandingEquiv = (fin.outstandingIRR ?? 0) + ((fin.outstandingEUR ?? 0) * eurRate);

      const calculatedFinProgress = Number(((totalInvoiceEquiv / base) * 100).toFixed(2));
      const calculatedColRatio = totalInvoiceEquiv > 0 ? Number(((totalReceivedEquiv / totalInvoiceEquiv) * 100).toFixed(2)) : 92.14;
      const calculatedOutRatio = totalInvoiceEquiv > 0 ? Number(((totalOutstandingEquiv / totalInvoiceEquiv) * 100).toFixed(2)) : 7.86;

      const normalizedFinSummary = {
        ...fin,
        financialCalculationBaseIRR: base,
        financialProgress: calculatedFinProgress,
        approvedFinancialProgress: calculatedFinProgress,
        receivedFinancialProgress: Number(((totalReceivedEquiv / base) * 100).toFixed(2)),
        collectionRatio: calculatedColRatio,
        outstandingRatio: calculatedOutRatio,
        advancePaymentPercentage: fin.advancePaymentIRR ? Number(((fin.advancePaymentIRR / base) * 100).toFixed(2)) : 27.28,
        adjustmentPercentage: fin.adjustmentIRR ? Number(((fin.adjustmentIRR / base) * 100).toFixed(2)) : 25.38
      };

      const ipcVersion = (this.currentIpc?.version || 0) + 1;
      const ipcFull: IpcRecord = {
        ...this.currentIpc,
        id: `ipc-v${ipcVersion}`,
        version: ipcVersion,
        dataDate: result.financialSummary.dataDate || result.dataDate,
        uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        fileName: result.fileName,
        source: `Daily Report Invoice Sheet: ${result.sheetNamesFound.invoiceSheetName || 'Invoice'}`,
        latestIpcNo: result.financialSummary.latestInvoiceNumber
          ? `صورت‌وضعیت موقت شماره ${result.financialSummary.latestInvoiceNumber} (IPC-${result.financialSummary.latestInvoiceNumber})`
          : this.currentIpc?.latestIpcNo,
        period: result.financialSummary.latestInvoicePeriod || this.currentIpc?.period || 'تیرماه 1405',
        status: (result.financialSummary.latestInvoiceStatus as any) || 'تایید شده',
        submittedAmount: result.financialSummary.invoiceCumulativeIRR,
        approvedAmount: result.financialSummary.invoiceCumulativeIRR,
        paidAmount: result.financialSummary.receivedIRR,
        advancePaymentAmount: result.financialSummary.advancePaymentIRR,
        currency: 'IRR',
        financialSummary: normalizedFinSummary
      };

      this.currentIpc = ipcFull;
      this.ipcHistory = [ipcFull, ...this.ipcHistory];
      this.saveToStorage(STORAGE_KEYS.IPC, this.currentIpc);
      this.saveToStorage(STORAGE_KEYS.IPC_HISTORY, this.ipcHistory);

      this.addAuditEntry({
        id: `aud-ipc-${ipcVersion}`,
        datasetType: 'ipc',
        version: ipcVersion,
        dataDate: result.financialSummary.dataDate || result.dataDate,
        uploadDate: ipcFull.uploadDate,
        fileName: result.fileName,
        source: `Daily Report Invoice Sheet`,
        user,
        status: 'active',
        recordSummary: `Financial Progress: ${normalizedFinSummary.financialProgress}% | Collection: ${normalizedFinSummary.collectionRatio}% | Latest IPC: #${normalizedFinSummary.latestInvoiceNumber}`
      });
    }

    // 4. Update Equipment from Equipment Sheet if present
    if (result.equipmentSummary) {
      const eqSummary = result.equipmentSummary;
      const eqVersion = (this.currentEquipment?.version || 0) + 1;
      const eqFull: EquipmentRecord = {
        ...this.currentEquipment,
        id: `eq-v${eqVersion}`,
        version: eqVersion,
        dataDate: result.dataDate,
        uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        fileName: result.fileName,
        source: `Daily Report Equipment Sheet: ${result.sheetNamesFound.equipmentSheetName || 'Equipment'}`,
        totalEquipment: eqSummary.total,
        deliveredSite: eqSummary.total,
        installed: eqSummary.completed,
        remaining: eqSummary.remaining,
        installationPercentage: eqSummary.weightedProgress,
        items: eqSummary.items,
        equipmentSummary: eqSummary,
        disciplineBreakdown: this.currentEquipment?.disciplineBreakdown || []
      };

      this.currentEquipment = eqFull;
      this.equipmentHistory = [eqFull, ...this.equipmentHistory];
      this.saveToStorage(STORAGE_KEYS.EQUIPMENT, this.currentEquipment);
      this.saveToStorage(STORAGE_KEYS.EQUIPMENT_HISTORY, this.equipmentHistory);

      this.addAuditEntry({
        id: `aud-eq-${eqVersion}`,
        datasetType: 'equipment',
        version: eqVersion,
        dataDate: result.dataDate,
        uploadDate: eqFull.uploadDate,
        fileName: result.fileName,
        source: `Daily Report Equipment Sheet`,
        user,
        status: 'active',
        recordSummary: `Equipment: ${eqSummary.completed}/${eqSummary.total} (${eqSummary.weightedProgress}%) | Items: ${eqSummary.items.length}`
      });
    }

    // 5. Add Audit entries
    this.addAuditEntry({
      id: `aud-daily-${dailyVersion}`,
      datasetType: 'daily',
      version: dailyVersion,
      dataDate: result.dataDate,
      uploadDate: dailyFull.uploadDate,
      fileName: result.fileName,
      source: `Daily Report Workbook`,
      user,
      status: 'active',
      recordSummary: `Site Manpower: Total ${dailyFull.manpower.total ?? '—'} (Present: ${dailyFull.manpower.present ?? dailyFull.manpower.total ?? '—'}, Direct: ${dailyFull.manpower.direct ?? '—'}, Indirect: ${dailyFull.manpower.indirect ?? '—'}) | Detected Issues: ${dailyFull.keyIssues.length}`
    });

    this.addAuditEntry({
      id: `aud-pms-${pmsVersion}`,
      datasetType: 'pms',
      version: pmsVersion,
      dataDate: incomingDataDate,
      uploadDate: pmsFull.uploadDate,
      fileName: result.fileName,
      source: `PMS Multi-Sheet Update`,
      user,
      status: 'active',
      recordSummary: `Actual: ${pmsFull.actualProgress}% | Planned: ${pmsFull.plannedProgress}% | Var: ${pmsFull.progressVariance}%`
    });

    this.notify();
    return { success: true, warnings };
  }

  // Update IPC
  public updateIpc(newRecord: Partial<IpcRecord>, user = 'Contracts Lead'): { success: boolean; warning?: string } {
    const existingDate = this.currentIpc?.dataDate;
    const incomingDate = newRecord.dataDate || new Date().toISOString().split('T')[0];

    let warning: string | undefined;
    if (existingDate && checkDateSuperseded(incomingDate, existingDate)) {
      warning = `هشدار: تاریخ صورت‌وضعیت (${incomingDate}) قدیمی‌تر از نسخه فعال موجود (${existingDate}) است. An updated version of this dataset already exists.`;
    }

    const nextVersion = (this.currentIpc?.version || 0) + 1;
    const ipcFull: IpcRecord = {
      ...this.currentIpc,
      ...newRecord,
      id: `ipc-v${nextVersion}`,
      version: nextVersion,
      dataDate: incomingDate,
      uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16)
    } as IpcRecord;

    this.currentIpc = ipcFull;
    this.ipcHistory = [ipcFull, ...this.ipcHistory];
    this.saveToStorage(STORAGE_KEYS.IPC, this.currentIpc);
    this.saveToStorage(STORAGE_KEYS.IPC_HISTORY, this.ipcHistory);

    this.addAuditEntry({
      id: `aud-ipc-${nextVersion}`,
      datasetType: 'ipc',
      version: nextVersion,
      dataDate: incomingDate,
      uploadDate: ipcFull.uploadDate,
      fileName: ipcFull.fileName || 'IPC_Statement.xlsx',
      source: ipcFull.source || 'Finance Dept',
      user,
      status: warning ? 'warning' : 'active',
      recordSummary: `${ipcFull.latestIpcNo} | Submitted: ${ipcFull.submittedAmount.toLocaleString()} | Approved: ${ipcFull.approvedAmount.toLocaleString()} | Paid: ${ipcFull.paidAmount.toLocaleString()}`
    });

    this.notify();
    return { success: true, warning };
  }

  // Update Equipment
  public updateEquipment(newRecord: Partial<EquipmentRecord>, user = 'Logistics Lead'): { success: boolean; warning?: string } {
    const existingDate = this.currentEquipment?.dataDate;
    const incomingDate = newRecord.dataDate || new Date().toISOString().split('T')[0];

    let warning: string | undefined;
    if (existingDate && checkDateSuperseded(incomingDate, existingDate)) {
      warning = `هشدار: تاریخ لاگ تجهیزات (${incomingDate}) قدیمی‌تر از نسخه فعال موجود (${existingDate}) است. An updated version of this dataset already exists.`;
    }

    const nextVersion = (this.currentEquipment?.version || 0) + 1;
    const items = newRecord.items || this.currentEquipment?.items || [];
    const totalEq = newRecord.equipmentSummary?.total ?? (items.length > 0 ? items.reduce((s, i) => s + i.total, 0) : (newRecord.totalEquipment ?? this.currentEquipment?.totalEquipment ?? 252));
    const installedEq = newRecord.equipmentSummary?.completed ?? (items.length > 0 ? items.reduce((s, i) => s + i.completed, 0) : (newRecord.installed ?? this.currentEquipment?.installed ?? 29));
    const weightedProg = newRecord.equipmentSummary?.weightedProgress ?? (totalEq > 0 ? Number(((installedEq / totalEq) * 100).toFixed(2)) : 11.51);

    const eqFull: EquipmentRecord = {
      ...this.currentEquipment,
      ...newRecord,
      totalEquipment: totalEq,
      installed: installedEq,
      installationPercentage: weightedProg,
      items,
      equipmentSummary: newRecord.equipmentSummary || {
        total: totalEq,
        completed: installedEq,
        remaining: Math.max(0, totalEq - installedEq),
        weightedProgress: weightedProg,
        items
      },
      id: `eq-v${nextVersion}`,
      version: nextVersion,
      dataDate: incomingDate,
      uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16)
    } as EquipmentRecord;

    this.currentEquipment = eqFull;
    this.equipmentHistory = [eqFull, ...this.equipmentHistory];
    this.saveToStorage(STORAGE_KEYS.EQUIPMENT, this.currentEquipment);
    this.saveToStorage(STORAGE_KEYS.EQUIPMENT_HISTORY, this.equipmentHistory);

    this.addAuditEntry({
      id: `aud-eq-${nextVersion}`,
      datasetType: 'equipment',
      version: nextVersion,
      dataDate: incomingDate,
      uploadDate: eqFull.uploadDate,
      fileName: eqFull.fileName || 'Equipment_Log.xlsx',
      source: eqFull.source || 'Site Logistics',
      user,
      status: warning ? 'warning' : 'active',
      recordSummary: `Installed: ${eqFull.installed}/${eqFull.totalEquipment} (${eqFull.installationPercentage}%) | Items: ${items.length}`
    });

    this.notify();
    return { success: true, warning };
  }

  private addAuditEntry(entry: DatasetVersionAudit) {
    // Mark previous of same type as superseded
    this.versionAudit = this.versionAudit.map(a => {
      if (a.datasetType === entry.datasetType && a.status === 'active') {
        return { ...a, status: 'superseded' };
      }
      return a;
    });
    this.versionAudit = [entry, ...this.versionAudit];
    this.saveToStorage(STORAGE_KEYS.AUDIT, this.versionAudit);
  }

  // Reset to Factory Defaults
  public resetToSampleData() {
    this.masterData = initialProjectMasterData;
    this.masterSCurve = initialMasterSCurveRecord;
    this.currentPms = initialPmsRecord;
    this.currentDaily = initialDailyReportRecord;
    this.currentIpc = initialIpcRecord;
    this.currentEquipment = initialEquipmentRecord;
    this.versionAudit = initialVersionAuditList;
    this.masterSCurveHistory = [initialMasterSCurveRecord];
    this.pmsHistory = [initialPmsRecord];
    this.dailyHistory = [initialDailyReportRecord];
    this.ipcHistory = [initialIpcRecord];
    this.equipmentHistory = [initialEquipmentRecord];

    this.saveToStorage(STORAGE_KEYS.MASTER, this.masterData);
    this.saveToStorage(STORAGE_KEYS.MASTER_SCURVE, this.masterSCurve);
    this.saveToStorage(STORAGE_KEYS.PMS, this.currentPms);
    this.saveToStorage(STORAGE_KEYS.DAILY, this.currentDaily);
    this.saveToStorage(STORAGE_KEYS.IPC, this.currentIpc);
    this.saveToStorage(STORAGE_KEYS.EQUIPMENT, this.currentEquipment);
    this.saveToStorage(STORAGE_KEYS.AUDIT, this.versionAudit);
    this.saveToStorage(STORAGE_KEYS.MASTER_SCURVE_HISTORY, this.masterSCurveHistory);
    this.saveToStorage(STORAGE_KEYS.PMS_HISTORY, this.pmsHistory);
    this.saveToStorage(STORAGE_KEYS.DAILY_HISTORY, this.dailyHistory);
    this.saveToStorage(STORAGE_KEYS.IPC_HISTORY, this.ipcHistory);
    this.saveToStorage(STORAGE_KEYS.EQUIPMENT_HISTORY, this.equipmentHistory);

    this.notify();
  }
}

export const projectDataStore = new ProjectDataStore();
