import type { PublishedReport } from '../src/types/index.js';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    reportDate: string;
    plannedProgress: number | null;
    actualProgress: number | null;
    progressVariance: number | null;
    manpower: {
      total: number;
      present: number;
      absent: number;
      attendanceRatio: number;
      direct: { total: number; present: number; absent: number; attendanceRatio: number };
      indirect: { total: number; present: number; absent: number; attendanceRatio: number };
    };
    equipmentInstalled: number | null;
    equipmentTotal: number | null;
    equipmentPercentage: number | null;
    financialProgress: number | null;
    keyIssuesCount: number;
    keyActivitiesCount: number;
  };
}

/**
 * Server-side validation of a report before publication
 */
export function validateReportForPublication(report: Partial<PublishedReport>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Report Date Validation
  const reportDate = report.reportDate || report.daily?.reportDate || report.pms?.dataDate;
  if (!reportDate || typeof reportDate !== 'string' || reportDate.trim() === '') {
    errors.push('تاریخ گزارش (Report Date) نامعتبر یا خالی است.');
  }

  // 2. PMS Progress Validation
  const planned = report.pms?.plannedProgress ?? report.kpis?.plannedProgress ?? null;
  const actual = report.pms?.actualProgress ?? report.kpis?.actualProgress ?? null;

  if (planned === null || !Number.isFinite(planned) || Number.isNaN(planned)) {
    errors.push('درصد پیشرفت برنامه‌ای (Planned Progress) نامعتبر است یا عدد متناهی نیست.');
  } else if (planned < 0 || planned > 100) {
    warnings.push(`درصد پیشرفت برنامه‌ای (${planned}%) خارج از بازه استاندارد ۰ تا ۱۰۰ است.`);
  }

  if (actual === null || !Number.isFinite(actual) || Number.isNaN(actual)) {
    errors.push('درصد پیشرفت واقعی (Actual Progress) نامعتبر است یا عدد متناهی نیست.');
  } else if (actual < 0 || actual > 100) {
    warnings.push(`درصد پیشرفت واقعی (${actual}%) خارج از بازه استاندارد ۰ تا ۱۰۰ است.`);
  }

  // 3. Manpower Model Validation (Section S)
  const manpower = report.kpis?.siteManpower || report.daily?.siteManpower;
  const directTotal = manpower?.direct?.total ?? 0;
  const directPresent = manpower?.direct?.present ?? 0;
  const directAbsent = manpower?.direct?.absent ?? 0;

  const indirectTotal = manpower?.indirect?.total ?? 0;
  const indirectPresent = manpower?.indirect?.present ?? 0;
  const indirectAbsent = manpower?.indirect?.absent ?? 0;

  const total = manpower?.total ?? (directTotal + indirectTotal);
  const present = manpower?.present ?? (directPresent + indirectPresent);
  const absent = manpower?.absent ?? (directAbsent + indirectAbsent);

  if (!Number.isFinite(total) || total < 0) {
    errors.push('تعداد کل نیروی انسانی نامعتبر است.');
  }
  if (!Number.isFinite(present) || present < 0) {
    errors.push('تعداد نیروی انسانی حاضر نامعتبر است.');
  }
  if (!Number.isFinite(absent) || absent < 0) {
    errors.push('تعداد نیروی انسانی غایب نامعتبر است.');
  }

  // Mathematical balance check: Total should equal Present + Absent
  if (total > 0 && Math.abs(total - (present + absent)) > 1) {
    warnings.push(
      `مجموع نیروی انسانی (${total}) با جمع حاضر (${present}) و غایب (${absent}) همخوانی ندارد.`
    );
  }

  const attendanceRatio = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0;
  const directRatio = directTotal > 0 ? Number(((directPresent / directTotal) * 100).toFixed(1)) : 0;
  const indirectRatio = indirectTotal > 0 ? Number(((indirectPresent / indirectTotal) * 100).toFixed(1)) : 0;

  // 4. Equipment Validation
  const eqTotal = report.equipment?.totalEquipment ?? report.kpis?.equipmentTotal ?? null;
  const eqInstalled = report.equipment?.installed ?? report.kpis?.equipmentInstalled ?? null;
  const eqPercentage = report.equipment?.installationPercentage ?? report.kpis?.equipmentInstallationPercentage ?? null;

  if (eqTotal !== null && (!Number.isFinite(eqTotal) || eqTotal < 0)) {
    errors.push('تعداد کل تجهیزات نامعتبر است.');
  }
  if (eqInstalled !== null && (!Number.isFinite(eqInstalled) || eqInstalled < 0)) {
    errors.push('تعداد تجهیزات نصب شده نامعتبر است.');
  }

  // 5. Financial Validation
  const finProgress = report.kpis?.financialProgress ?? report.ipc?.financialSummary?.financialProgress ?? null;

  // 6. Issues & Activities
  const issuesCount = report.daily?.keyIssues?.length ?? 0;
  const activitiesCount = report.daily?.importantActivities?.length ?? 0;

  // 7. Check for NaN / Undefined in root object
  const checkNaN = (obj: any, path: string) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'number' && Number.isNaN(val)) {
        errors.push(`فیلد عددی نامعتبر (NaN) در مسیر ${path}.${key} یافت شد.`);
      }
    }
  };

  if (report.pms) checkNaN(report.pms, 'pms');
  if (report.kpis) checkNaN(report.kpis, 'kpis');
  if (report.equipment) checkNaN(report.equipment, 'equipment');

  const variance = planned !== null && actual !== null ? Number((actual - planned).toFixed(2)) : null;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      reportDate: reportDate || 'نامشخص',
      plannedProgress: planned,
      actualProgress: actual,
      progressVariance: variance,
      manpower: {
        total,
        present,
        absent,
        attendanceRatio,
        direct: {
          total: directTotal,
          present: directPresent,
          absent: directAbsent,
          attendanceRatio: directRatio,
        },
        indirect: {
          total: indirectTotal,
          present: indirectPresent,
          absent: indirectAbsent,
          attendanceRatio: indirectRatio,
        },
      },
      equipmentInstalled: eqInstalled,
      equipmentTotal: eqTotal,
      equipmentPercentage: eqPercentage,
      financialProgress: finProgress,
      keyIssuesCount: issuesCount,
      keyActivitiesCount: activitiesCount,
    },
  };
}
