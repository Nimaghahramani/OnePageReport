import { PublishedReport } from '../types/publishedReport';

export interface ValidationResult {
  valid: boolean;
  blockingErrors: string[];
  warnings: string[];
  errorsCount: number;
  warningsCount: number;
}

/**
 * Server-side independent validation of a report snapshot payload.
 * Verifies schema completeness, critical finite numbers, PMS progress, and no NaN/null invariants.
 */
export function validatePublishedReportPayload(report: any): ValidationResult {
  const blockingErrors: string[] = [];
  const warnings: string[] = [];

  if (!report || typeof report !== 'object') {
    return {
      valid: false,
      blockingErrors: ['پیکره اطلاعات گزارش نامعتبر یا خالی است.'],
      warnings: [],
      errorsCount: 1,
      warningsCount: 0
    };
  }

  // 1. Report Date Validation
  if (!report.reportDate || typeof report.reportDate !== 'string' || report.reportDate.trim().length === 0) {
    blockingErrors.push('تاریخ گزارش (Report Date) مشخص نشده است.');
  } else {
    const cleanDate = report.reportDate.trim();
    // Verify Persian/Gregorian date formatting basic pattern
    if (!/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(cleanDate)) {
      warnings.push(`فرمت تاریخ گزارش (${cleanDate}) استاندارد YYYY/MM/DD نمی‌باشد.`);
    }
  }

  // 2. Project ID Validation
  if (!report.projectId || typeof report.projectId !== 'string' || report.projectId.trim().length === 0) {
    blockingErrors.push('شناسه پروژه (Project ID) مشخص نشده است.');
  }

  // 3. KPIs Validation
  if (!report.kpis || typeof report.kpis !== 'object') {
    blockingErrors.push('بخش شاخص‌های کلیدی عملکرد (KPIs) در گزارش وجود ندارد.');
  } else {
    const { plannedProgress, actualProgress, variance, timeElapsedPercentage } = report.kpis;

    if (typeof plannedProgress !== 'number' || isNaN(plannedProgress) || !isFinite(plannedProgress)) {
      blockingErrors.push('مقدار درصد پیشرفت برنامه‌ای (Planned Progress) نامعتبر یا NaN است.');
    } else if (plannedProgress < 0 || plannedProgress > 100) {
      warnings.push(`درصد پیشرفت برنامه‌ای (${plannedProgress}%) خارج از بازه متعارف ۰ تا ۱۰۰ است.`);
    }

    if (typeof actualProgress !== 'number' || isNaN(actualProgress) || !isFinite(actualProgress)) {
      blockingErrors.push('مقدار درصد پیشرفت واقعی (Actual Progress) نامعتبر یا NaN است.');
    } else if (actualProgress < 0 || actualProgress > 100) {
      warnings.push(`درصد پیشرفت واقعی (${actualProgress}%) خارج از بازه متعارف ۰ تا ۱۰۰ است.`);
    }

    if (typeof variance !== 'number' || isNaN(variance) || !isFinite(variance)) {
      blockingErrors.push('مقدار انحراف پیشرفت (Variance) نامعتبر یا NaN است.');
    }

    if (typeof timeElapsedPercentage !== 'number' || isNaN(timeElapsedPercentage) || !isFinite(timeElapsedPercentage)) {
      warnings.push('درصد سپری‌شده زمانی (Elapsed Time) نامعتبر است.');
    }
  }

  // 4. PMS Data Validation
  if (!report.pms || typeof report.pms !== 'object') {
    blockingErrors.push('داده‌های ساختار شکست پیشرفت (PMS) ارسال نشده است.');
  } else {
    const pms = report.pms;
    const top = pms.topLevelProgress;
    if (top) {
      if (typeof top.plan !== 'number' || isNaN(top.plan) || !isFinite(top.plan)) {
        blockingErrors.push('پیشرفت برنامه‌ای در ساختار PMS نامعتبر است.');
      }
      if (typeof top.actual !== 'number' || isNaN(top.actual) || !isFinite(top.actual)) {
        blockingErrors.push('پیشرفت واقعی در ساختار PMS نامعتبر است.');
      }
    }
  }

  // 5. Equipment Data Validation (Ensure no NaN or corrupt objects)
  if (report.equipment && typeof report.equipment === 'object') {
    const eq = report.equipment;
    if (eq.totalEquipment !== undefined && (typeof eq.totalEquipment !== 'number' || isNaN(eq.totalEquipment) || !isFinite(eq.totalEquipment))) {
      blockingErrors.push('تعداد کل تجهیزات نامعتبر است.');
    }
    if (eq.installed !== undefined && (typeof eq.installed !== 'number' || isNaN(eq.installed) || !isFinite(eq.installed))) {
      blockingErrors.push('تعداد تجهیزات نصب‌شده نامعتبر است.');
    }
  }

  // 6. S-Curve Data Validation
  if (report.scurve && typeof report.scurve === 'object') {
    if (Array.isArray(report.scurve.points)) {
      const hasInvalidPoint = report.scurve.points.some((p: any) =>
        typeof p.cumPlanned !== 'number' || isNaN(p.cumPlanned) || !isFinite(p.cumPlanned)
      );
      if (hasInvalidPoint) {
        warnings.push('برخی از نقاط منحنی S-Curve دارای مقادیر نامعتبر عددی هستند.');
      }
    }
  }

  const valid = blockingErrors.length === 0;

  return {
    valid,
    blockingErrors,
    warnings,
    errorsCount: blockingErrors.length,
    warningsCount: warnings.length
  };
}
