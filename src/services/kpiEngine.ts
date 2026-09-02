import {
  ProjectMasterData,
  MasterSCurveRecord,
  PmsRecord,
  DailyReportRecord,
  IpcRecord,
  EquipmentRecord,
  CalculatedReportKPIs,
  FINANCIAL_CALCULATION_BASE_IRR
} from '../types';
import { getPlannedAtDate, calculateScheduleDelayFromPlannedCurve } from './scurveEngine';
import {
  parsePersianOrGregorianDate,
  differenceInCalendarDays,
  formatToJalali
} from '../utils/jalaliDate';

export function calculateExecutiveKPIs(
  master: ProjectMasterData | null,
  pms: PmsRecord | null,
  daily: DailyReportRecord | null,
  ipc: IpcRecord | null,
  equipment: EquipmentRecord | null,
  masterSCurve?: MasterSCurveRecord | null
): CalculatedReportKPIs {
  // 1. Time Elapsed Calculation
  // Priority: 1. Daily Report Date (daily.reportDate), 2. PMS Data Date (converted to Jalali), 3. Never system/browser date
  const rawReportDate = (daily?.reportDate && daily.reportDate !== 'N/A')
    ? daily.reportDate
    : (pms?.dataDate ? formatToJalali(pms.dataDate) : null);
  const parsedReportDate = parsePersianOrGregorianDate(rawReportDate);

  const rawStartDate = master?.startDate || '1403/12/21';
  const parsedStartDate = parsePersianOrGregorianDate(rawStartDate);

  const rawContractualEndDate = master?.contractualEndDate || master?.contractualFinishDate || '1405/06/21';
  const parsedContractualEndDate = parsePersianOrGregorianDate(rawContractualEndDate) || parsePersianOrGregorianDate('1405/06/21');

  const rawTemporaryEndDate = master?.temporaryExtendedEndDate || '1405/10/30';
  const parsedTemporaryEndDate = parsePersianOrGregorianDate(rawTemporaryEndDate) || parsePersianOrGregorianDate('1405/10/30');

  const rawApprovedExtendedEndDate = master?.approvedExtendedEndDate || null;
  const parsedApprovedExtendedEndDate = rawApprovedExtendedEndDate ? parsePersianOrGregorianDate(rawApprovedExtendedEndDate) : null;

  let effectiveEndDateParsed = parsedContractualEndDate;
  let effectiveEndType: 'contractual' | 'temporary_extended' | 'approved_extended' | null = 'contractual';

  if (parsedApprovedExtendedEndDate) {
    effectiveEndDateParsed = parsedApprovedExtendedEndDate;
    effectiveEndType = 'approved_extended';
  } else if (parsedReportDate && parsedContractualEndDate && parsedReportDate.utcMidnightMs > parsedContractualEndDate.utcMidnightMs) {
    // If Daily Report Date passes contractual end date and no approved extension exists -> Temporary Extension 1405/10/30
    effectiveEndDateParsed = parsedTemporaryEndDate;
    effectiveEndType = 'temporary_extended';
  } else {
    effectiveEndDateParsed = parsedContractualEndDate;
    effectiveEndType = 'contractual';
  }

  let timeElapsedDays: number | null = null;
  let totalDurationDays = master?.durationDays || 550;
  let timeElapsedPercentage: number | null = null;
  const referenceReportDate = parsedReportDate ? parsedReportDate.jalaliString : null;
  const effectiveEndDate = effectiveEndDateParsed ? effectiveEndDateParsed.jalaliString : null;

  let effectiveEndLabelFa = '';
  let effectiveEndLabelEn = '';

  if (effectiveEndType === 'approved_extended' && effectiveEndDate) {
    effectiveEndLabelFa = `پایان مصوب تمدیدی: ${effectiveEndDate}`;
    effectiveEndLabelEn = `Approved Extension: ${effectiveEndDate}`;
  } else if (effectiveEndType === 'temporary_extended' && effectiveEndDate) {
    effectiveEndLabelFa = `پایان موقت تمدیدی: ${effectiveEndDate}`;
    effectiveEndLabelEn = `Temp Extension: ${effectiveEndDate}`;
  } else if (effectiveEndDate) {
    effectiveEndLabelFa = `پایان مبنا: ${effectiveEndDate}`;
    effectiveEndLabelEn = `Baseline Finish: ${effectiveEndDate}`;
  }

  // Calculate Total Duration Days from Date Difference: Effective End - Project Start
  if (parsedStartDate && effectiveEndDateParsed) {
    const total = differenceInCalendarDays(effectiveEndDateParsed.jalaliString, parsedStartDate.jalaliString);
    if (total !== null && total > 0) {
      totalDurationDays = total;
    }
  }

  // Calculate Elapsed Days from Date Difference: Daily Report Date - Project Start
  if (parsedStartDate && parsedReportDate && totalDurationDays > 0) {
    const elapsed = differenceInCalendarDays(parsedReportDate.jalaliString, parsedStartDate.jalaliString);
    if (elapsed !== null && elapsed >= 0) {
      timeElapsedDays = elapsed;
      timeElapsedPercentage = Number(((timeElapsedDays / totalDurationDays) * 100).toFixed(1));
    }
  }

  // 2. PMS Progress & Variance:
  // - Planned Progress KPI comes directly from PMS Plan Progress / Cumulative (Root Activity ID = 0, e.g. 98.4078% -> 98.41%)
  // - Actual Progress KPI comes directly from PMS Actual Progress / Cumulative (Root Activity ID = 0, e.g. 73.2802% -> 73.28%)
  // - Variance = Actual - Planned (e.g. 73.28 - 98.41 = -25.13%)
  // - Master S-Curve Baseline remains as baseline reference / chart curve
  let plannedProgress: number | null = null;
  if (pms) {
    if (pms.plannedProgress !== undefined && pms.plannedProgress !== null) {
      plannedProgress = pms.plannedProgress;
    } else if (pms.plannedCumulative !== undefined && pms.plannedCumulative !== null) {
      plannedProgress = pms.plannedCumulative;
    } else if (masterSCurve?.points && masterSCurve.points.length > 0 && pms.dataDate) {
      plannedProgress = getPlannedAtDate(masterSCurve.points, pms.dataDate);
    }
  }

  const actualProgress = pms
    ? (pms.actualCumulative !== null && pms.actualCumulative !== undefined
        ? Number(pms.actualCumulative.toFixed(2))
        : (pms.actualProgress !== undefined && pms.actualProgress !== null ? Number(pms.actualProgress.toFixed(2)) : null))
    : null;

  const progressVariance = (actualProgress !== null && plannedProgress !== null)
    ? Number((actualProgress - plannedProgress).toFixed(2))
    : (pms?.progressVariance ?? null);

  // Horizontal Schedule Delay Calculation on PMS Planned Cumulative / Master S-Curve
  const rawActualCumulative = pms?.actualCumulative ?? (pms?.actualProgress !== undefined ? pms.actualProgress : null);
  const rawPlannedCumulative = pms?.plannedCumulative ?? (pms?.plannedProgress !== undefined ? pms.plannedProgress : plannedProgress);

  const delayCalc = calculateScheduleDelayFromPlannedCurve(
    referenceReportDate || rawReportDate,
    rawActualCumulative,
    rawPlannedCumulative,
    pms,
    masterSCurve,
    master?.startDate || '1403/12/21'
  );

  const scheduleDelayDays = delayCalc.scheduleDelayDays;
  const scheduleVarianceDays = delayCalc.scheduleVarianceDays;
  const plannedAchievementDate = delayCalc.plannedAchievementDate;
  const plannedAchievementIsoDate = delayCalc.plannedAchievementIsoDate;
  const delayCalculationSource = delayCalc.delayCalculationSource;
  const plannedDelayP1 = delayCalc.p1Point;
  const plannedDelayP2 = delayCalc.p2Point;

  // Overall Status Indicator
  let overallStatus: 'normal' | 'attention' | 'critical' = 'normal';
  let overallStatusTextFa = 'وضعیت مطلوب و نرمال (On Track)';
  let overallStatusTextEn = 'On Track / Normal';

  if (progressVariance !== null) {
    if (progressVariance < -10 || (scheduleDelayDays !== null && scheduleDelayDays > 25)) {
      overallStatus = 'critical';
      overallStatusTextFa = 'بحرانی و نیازمند اقدام فوری (Critical)';
      overallStatusTextEn = 'Critical / Action Required';
    } else if (progressVariance < -3 || (scheduleDelayDays !== null && scheduleDelayDays > 10)) {
      overallStatus = 'attention';
      overallStatusTextFa = 'نیازمند پایش و کنترل ویژه (Attention)';
      overallStatusTextEn = 'Needs Attention / Delayed';
    }
  }

  // 3. Equipment Installation
  const equipmentTotal = equipment ? equipment.totalEquipment : null;
  const equipmentInstalled = equipment ? equipment.installed : null;
  const equipmentRemaining = (equipmentTotal !== null && equipmentInstalled !== null)
    ? Math.max(0, equipmentTotal - equipmentInstalled)
    : null;
  const equipmentInstallationPercentage = equipment ? equipment.installationPercentage : null;

  // 4. IPC & Financial Status
  const finSummary = ipc?.financialSummary;
  const ipcSubmitted = ipc ? ipc.submittedAmount : null;
  const ipcApproved = ipc ? ipc.approvedAmount : null;
  const ipcPaid = ipc ? ipc.paidAmount : null;
  const ipcOutstanding = (ipcApproved !== null && ipcPaid !== null)
    ? Math.max(0, ipcApproved - ipcPaid)
    : null;
  const ipcCachedRatio = (ipcApproved !== null && ipcApproved > 0 && ipcPaid !== null)
    ? Number(((ipcPaid / ipcApproved) * 100).toFixed(1))
    : null;

  // 5. Site Resources
  const activeManpower = daily ? daily.manpower.total : null;
  const activeMachinery = daily ? daily.machinery.active : null;

  // 6. Generate Factual Executive Summary (3-5 Lines)
  const summaryFa: string[] = [];
  const summaryEn: string[] = [];

  // Line 1: Progress & Variance
  if (actualProgress !== null && plannedProgress !== null && progressVariance !== null) {
    const varTextFa = progressVariance >= 0 ? `+${progressVariance}% جلوتر از برنامه` : `${Math.abs(progressVariance)}% انحراف منفی`;
    const varTextEn = progressVariance >= 0 ? `+${progressVariance}% ahead of plan` : `${Math.abs(progressVariance)}% negative variance`;
    summaryFa.push(
      `پیشرفت تجمعی واقعی پروژه به ${actualProgress}% رسید در حالی که برنامه زمان‌بندی مصوب ${plannedProgress}% بوده است (${varTextFa}).`
    );
    summaryEn.push(
      `Cumulative actual progress reached ${actualProgress}% versus planned target of ${plannedProgress}% (${varTextEn}).`
    );
  } else {
    summaryFa.push('اطلاعات کافی جهت تحلیل مقایسه‌ای پیشرفت برنامه‌ای و واقعی ثبت نشده است.');
    summaryEn.push('Insufficient data to evaluate planned vs actual progress variance.');
  }

  // Line 2: Critical discipline / Lag
  if (pms && pms.disciplineProgress.length > 0) {
    const worstDiscipline = [...pms.disciplineProgress].sort((a, b) => a.variance - b.variance)[0];
    if (worstDiscipline && worstDiscipline.variance < 0) {
      summaryFa.push(
        `بیشترین انحراف پیشرفت مربوط به دیسیپلین ${worstDiscipline.nameFa} با انحراف ${worstDiscipline.variance}% و وزن ${worstDiscipline.weight}% از کل کار است.`
      );
      summaryEn.push(
        `Major progress delay is focused in ${worstDiscipline.nameEn} with ${worstDiscipline.variance}% variance (Weight: ${worstDiscipline.weight}%).`
      );
    }
  }

  // Line 3: Equipment & Installation
  if (equipment && equipmentTotal !== null && equipmentInstalled !== null) {
    const acceptedPart = equipment.accepted !== undefined ? ` و ${equipment.accepted} آیتم تایید نهایی شده است` : '';
    const acceptedPartEn = equipment.accepted !== undefined ? `, with ${equipment.accepted} accepted` : '';
    summaryFa.push(
      `در بخش نصب تجهیزات، از مجموع ${equipmentTotal} آیتم، تعداد ${equipmentInstalled} آیتم (${equipment.installationPercentage}%)${acceptedPart} نصب شده است.`
    );
    summaryEn.push(
      `In equipment installation, ${equipmentInstalled} out of ${equipmentTotal} units (${equipment.installationPercentage}%)${acceptedPartEn} are installed.`
    );
  }

  // Line 4: Dual-Currency Financial Status
  if (finSummary) {
    const finProg = finSummary.financialProgress !== null ? `${finSummary.financialProgress}%` : '-';
    const colRatio = finSummary.collectionRatio !== null ? `${finSummary.collectionRatio}%` : '-';
    summaryFa.push(
      `وضعیت مالی: در آخرین صورت‌وضعیت (${finSummary.latestInvoiceNumber ? `IPC-${finSummary.latestInvoiceNumber}` : ipc?.latestIpcNo || 'جاری'})، پیشرفت مالی تجمعی به ${finProg} و نسبت وصول مطالبات به ${colRatio} رسیده است.`
    );
    summaryEn.push(
      `Financial status: Cumulative financial progress is ${finProg} with a collection ratio of ${colRatio} for ${finSummary.latestInvoiceNumber ? `IPC #${finSummary.latestInvoiceNumber}` : ipc?.latestIpcNo || 'latest IPC'}.`
    );
  } else if (ipc && ipcApproved !== null && ipcPaid !== null && ipcOutstanding !== null) {
    summaryFa.push(
      `وضعیت مالی: در آخرین صورت‌وضعیت (${ipc.latestIpcNo})، مبلغ ${ipcPaid.toLocaleString()} ${ipc.currency} معادل ${ipcCachedRatio}% از مبلغ تاییدشده پرداخت و ${ipcOutstanding.toLocaleString()} ${ipc.currency} مطالبات باز مانده است.`
    );
    summaryEn.push(
      `Financial status: For ${ipc.latestIpcNo}, ${ipcPaid.toLocaleString()} ${ipc.currency} (${ipcCachedRatio}% of approved) is disbursed with ${ipcOutstanding.toLocaleString()} ${ipc.currency} outstanding.`
    );
  }

  // Line 5: Key Issues Summary
  if (daily && daily.keyIssues && daily.keyIssues.length > 0) {
    summaryFa.push(
      `در گزارش روزانه ${daily.keyIssues.length} مانع/مشکل ثبت شده است.`
    );
    summaryEn.push(
      `${daily.keyIssues.length} issue(s)/constraint(s) recorded in Daily Report.`
    );
  }

  return {
    timeElapsedDays,
    totalDurationDays,
    timeElapsedPercentage,
    referenceReportDate,
    effectiveEndDate,
    effectiveEndType,
    effectiveEndLabelFa,
    effectiveEndLabelEn,
    plannedProgress,
    actualProgress,
    progressVariance,
    scheduleVarianceDays,
    scheduleDelayDays,
    plannedAchievementDate,
    plannedAchievementIsoDate,
    delayCalculationSource,
    plannedDelayP1,
    plannedDelayP2,
    overallStatus,
    overallStatusTextFa,
    overallStatusTextEn,
    equipmentTotal,
    equipmentInstalled,
    equipmentRemaining,
    equipmentInstallationPercentage,
    ipcSubmitted,
    ipcApproved,
    ipcPaid,
    ipcOutstanding,
    ipcCachedRatio,
    financialProgress: finSummary?.financialProgress ?? (ipcApproved ? Number(((ipcApproved / FINANCIAL_CALCULATION_BASE_IRR) * 100).toFixed(1)) : null),
    financialCalculationBaseIRR: finSummary?.financialCalculationBaseIRR ?? FINANCIAL_CALCULATION_BASE_IRR,
    collectionRatio: finSummary?.collectionRatio ?? ipcCachedRatio,
    outstandingRatio: finSummary?.outstandingRatio ?? (ipcCachedRatio !== null ? Number((100 - ipcCachedRatio).toFixed(1)) : null),
    financialSummary: finSummary,
    activeManpower,
    activeMachinery,
    executiveSummaryLinesFa: summaryFa.slice(0, 5),
    executiveSummaryLinesEn: summaryEn.slice(0, 5)
  };
}
