import {
  ProjectMasterData,
  PmsRecord,
  DailyReportRecord,
  IpcRecord,
  EquipmentRecord,
  ValidationIssue
} from '../types';
import { comparePersianOrIsoDates } from '../utils/jalaliDate';

export function validateAllDatasets(
  master: ProjectMasterData | null,
  pms: PmsRecord | null,
  daily: DailyReportRecord | null,
  ipc: IpcRecord | null,
  equipment: EquipmentRecord | null
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Master Data Validation
  if (!master) {
    issues.push({
      id: 'v-m-1',
      type: 'error',
      dataset: 'master',
      field: 'ProjectMasterData',
      messageFa: 'اطلاعات پایه پروژه (Master Data) هنوز تعریف نشده است.',
      messageEn: 'Project Master Data has not been defined yet.',
      source: 'Project Setup',
      isBlocking: true
    });
  } else {
    if (!master.projectNameFa && !master.projectNameEn) {
      issues.push({
        id: 'v-m-2',
        type: 'error',
        dataset: 'master',
        field: 'projectName',
        messageFa: 'نام پروژه مشخص نشده است.',
        messageEn: 'Project Name is missing.',
        source: 'Project Setup',
        isBlocking: true
      });
    }
    if (master.contractValue <= 0) {
      issues.push({
        id: 'v-m-3',
        type: 'warning',
        dataset: 'master',
        field: 'contractValue',
        messageFa: 'مبلغ کل قرارداد صفر یا نامعتبر ثبت شده است.',
        messageEn: 'Contract Value is zero or invalid.',
        source: 'Project Setup'
      });
    }
    const disciplineWeightSum = master.disciplines.reduce((acc, d) => acc + d.weight, 0);
    if (Math.abs(disciplineWeightSum - 100) > 0.5) {
      issues.push({
        id: 'v-m-4',
        type: 'warning',
        dataset: 'master',
        field: 'disciplines',
        messageFa: `مجموع اوزان دیسیپلین‌ها (${disciplineWeightSum}%) با ۱۰۰٪ تطابق ندارد.`,
        messageEn: `Sum of discipline weights (${disciplineWeightSum}%) does not equal 100%.`,
        source: 'Project Setup'
      });
    }
  }

  // PMS Validation
  if (!pms) {
    issues.push({
      id: 'v-p-1',
      type: 'warning',
      dataset: 'pms',
      field: 'PmsRecord',
      messageFa: 'فایل آپدیت PMS دریافت نشده است (No PMS data).',
      messageEn: 'PMS update dataset is missing.',
      source: 'PMS Update',
      isBlocking: false
    });
  } else {
    if (pms.plannedProgress < 0 || pms.plannedProgress > 100) {
      issues.push({
        id: 'v-p-2',
        type: 'error',
        dataset: 'pms',
        field: 'plannedProgress',
        messageFa: `درصد پیشرفت برنامه‌ای (${pms.plannedProgress}%) خارج از بازه مجاز ۰ تا ۱۰۰ است.`,
        messageEn: `Planned progress (${pms.plannedProgress}%) is out of valid range 0-100%.`,
        source: pms.source,
        dataDate: pms.dataDate,
        isBlocking: true
      });
    }
    if (pms.actualProgress < 0 || pms.actualProgress > 100) {
      issues.push({
        id: 'v-p-3',
        type: 'error',
        dataset: 'pms',
        field: 'actualProgress',
        messageFa: `درصد پیشرفت واقعی (${pms.actualProgress}%) خارج از بازه مجاز ۰ تا ۱۰۰ است.`,
        messageEn: `Actual progress (${pms.actualProgress}%) is out of valid range 0-100%.`,
        source: pms.source,
        dataDate: pms.dataDate,
        isBlocking: true
      });
    }
    if (pms.actualProgress < pms.previousActualProgress) {
      issues.push({
        id: 'v-p-4',
        type: 'warning',
        dataset: 'pms',
        field: 'actualProgress',
        messageFa: `پیشرفت واقعی جاری (${pms.actualProgress}%) از پیشرفت دوره قبل (${pms.previousActualProgress}%) کمتر است (افت پیشرفت).`,
        messageEn: `Current actual progress (${pms.actualProgress}%) is less than previous period (${pms.previousActualProgress}%).`,
        source: pms.source,
        dataDate: pms.dataDate
      });
    }
    if (pms.plannedProgress - pms.actualProgress > 10) {
      issues.push({
        id: 'v-p-5',
        type: 'warning',
        dataset: 'pms',
        field: 'progressVariance',
        messageFa: `انحراف منفی قابل توجه (${pms.progressVariance}%) نسبت به برنامه ثبت شده است.`,
        messageEn: `Significant negative variance (${pms.progressVariance}%) detected.`,
        source: pms.source,
        dataDate: pms.dataDate
      });
    }
  }

  // Equipment Validation
  if (!equipment) {
    issues.push({
      id: 'v-e-1',
      type: 'info',
      dataset: 'equipment',
      field: 'EquipmentRecord',
      messageFa: 'اطلاعات وضعیت تجهیزات موجود نیست.',
      messageEn: 'Equipment status dataset is missing.',
      source: 'Equipment Log'
    });
  } else {
    if (equipment.installed > equipment.totalEquipment) {
      issues.push({
        id: 'v-e-2',
        type: 'error',
        dataset: 'equipment',
        field: 'installed',
        messageFa: `تعداد تجهیزات نصب‌شده (${equipment.installed}) از کل تجهیزات (${equipment.totalEquipment}) بیشتر است!`,
        messageEn: `Installed equipment (${equipment.installed}) exceeds total equipment (${equipment.totalEquipment})!`,
        source: equipment.source,
        dataDate: equipment.dataDate,
        isBlocking: true
      });
    }
    if (equipment.deliveredSite !== undefined && equipment.installed > equipment.deliveredSite) {
      issues.push({
        id: 'v-e-3',
        type: 'warning',
        dataset: 'equipment',
        field: 'installed',
        messageFa: `تعداد نصب‌شده (${equipment.installed}) از تعداد تحویل‌شده به کارگاه (${equipment.deliveredSite}) بیشتر ثبت شده است.`,
        messageEn: `Installed equipment (${equipment.installed}) exceeds delivered items (${equipment.deliveredSite}).`,
        source: equipment.source,
        dataDate: equipment.dataDate
      });
    }
    if (equipment.items && equipment.items.length > 0) {
      for (const it of equipment.items) {
        if (it.completed > it.total) {
          issues.push({
            id: `v-e-item-${it.sequence}`,
            type: 'warning',
            dataset: 'equipment',
            field: it.name,
            messageFa: `تعداد انجام‌شده تجهیز «${it.name}» (${it.completed}) از تعداد کل (${it.total}) بیشتر است.`,
            messageEn: `Completed count for item "${it.name}" (${it.completed}) exceeds total count (${it.total}).`,
            source: it.sourceFile || 'Equipment Sheet',
            dataDate: equipment.dataDate
          });
        }
      }
    }
  }

  // IPC Validation
  if (ipc) {
    if (ipc.approvedAmount > ipc.submittedAmount) {
      issues.push({
        id: 'v-i-1',
        type: 'warning',
        dataset: 'ipc',
        field: 'approvedAmount',
        messageFa: `مبلغ تأییدشده صورت‌وضعیت (${ipc.approvedAmount.toLocaleString()}) از مبلغ ارائه‌شده (${ipc.submittedAmount.toLocaleString()}) بیشتر است.`,
        messageEn: `Approved IPC amount (${ipc.approvedAmount.toLocaleString()}) exceeds submitted amount.`,
        source: ipc.source,
        dataDate: ipc.dataDate
      });
    }
    if (ipc.paidAmount > ipc.approvedAmount) {
      issues.push({
        id: 'v-i-2',
        type: 'warning',
        dataset: 'ipc',
        field: 'paidAmount',
        messageFa: `مبلغ پرداخت‌شده (${ipc.paidAmount.toLocaleString()}) از مبلغ تأییدشده (${ipc.approvedAmount.toLocaleString()}) بیشتر است.`,
        messageEn: `Paid amount exceeds approved amount.`,
        source: ipc.source,
        dataDate: ipc.dataDate
      });
    }
  }

  // Daily Report Validation
  if (daily) {
    if (daily.manpower.total <= 0) {
      issues.push({
        id: 'v-d-1',
        type: 'warning',
        dataset: 'daily',
        field: 'manpower',
        messageFa: 'تعداد کل نیروی انسانی در گزارش روزانه صفر یا خالی ثبت شده است.',
        messageEn: 'Total manpower in daily report is zero or missing.',
        source: daily.source,
        dataDate: daily.dataDate
      });
    }

    if (daily.reportDate && daily.reportDate !== 'N/A' && master?.startDate) {
      const cmpStart = comparePersianOrIsoDates(daily.reportDate, master.startDate);
      if (cmpStart < 0) {
        issues.push({
          id: 'v-d-date-before-start',
          type: 'error',
          dataset: 'daily',
          field: 'reportDate',
          messageFa: `تاریخ گزارش (${daily.reportDate}) قبل از تاریخ شروع پروژه (${master.startDate}) است؛ منبع تاریخ گزارش بررسی شود.`,
          messageEn: `Report Date (${daily.reportDate}) precedes Project Start Date (${master.startDate}). Check Report Date source.`,
          source: daily.source || 'Daily Report',
          dataDate: daily.reportDate,
          isBlocking: true
        });
      }
    }

    if (daily.reportDate && daily.reportDate !== 'N/A' && master?.contractNotificationDate) {
      if (daily.reportDate === master.contractNotificationDate) {
        issues.push({
          id: 'v-d-date-equals-notification',
          type: 'warning',
          dataset: 'daily',
          field: 'reportDate',
          messageFa: `تاریخ گزارش (${daily.reportDate}) با تاریخ ابلاغ قرارداد یکسان است؛ منبع تاریخ گزارش بررسی شود.`,
          messageEn: `Report Date (${daily.reportDate}) matches Contract Notification Date. Check Report Date source.`,
          source: daily.source || 'Daily Report',
          dataDate: daily.reportDate
        });
      }
    }
  }

  return issues;
}

export function checkDateSuperseded(newDate: string, existingDate: string): boolean {
  if (!newDate || !existingDate) return false;
  return new Date(newDate) < new Date(existingDate);
}
