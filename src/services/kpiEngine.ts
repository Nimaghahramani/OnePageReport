import {
  ProjectMasterData,
  MasterSCurveRecord,
  PmsRecord,
  DailyReportRecord,
  IpcRecord,
  EquipmentRecord,
  CalculatedReportKPIs,
  SiteManpowerKPI,
  FINANCIAL_CALCULATION_BASE_IRR
} from '../types';
import { getPlannedAtDate, calculateScheduleDelayFromPlannedCurve } from './scurveEngine';
import {
  parsePersianOrGregorianDate,
  differenceInCalendarDays,
  formatToJalali
} from '../utils/jalaliDate';

/**
 * Validates whether a value is a valid finite numeric value.
 * Treats undefined, null, NaN, '', 'N/A', 'undefined', 'null' as missing.
 */
export function isValidNumericValue(value: unknown): boolean {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    value === 'N/A' ||
    value === 'undefined' ||
    value === 'null'
  ) {
    return false;
  }

  const n = Number(value);
  return Number.isFinite(n);
}

/**
 * Normalizes percentage values without arbitrary multiplication.
 * E.g., 0.0625 -> 6.25, 6.25 -> 6.25, -0.94 -> -94, -94 -> -94.
 */
export function normalizePercent(value: number): number | null {
  if (!Number.isFinite(value)) return null;

  return Math.abs(value) <= 1 && Math.abs(value) > 0
    ? Number((value * 100).toFixed(2))
    : value;
}

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

  // 5. Site Resources & Manpower
  const activeManpower = daily ? (daily.siteManpower?.total ?? daily.manpower?.total ?? null) : null;
  const activeMachinery = daily ? daily.machinery.active : null;

  let siteManpower: SiteManpowerKPI | null = null;
  if (daily) {
    if (daily.siteManpower) {
      siteManpower = daily.siteManpower;
    } else if (daily.manpower) {
      const dirTotal = daily.manpower.directBreakdown?.total ?? null;
      const dirPresent = daily.manpower.directBreakdown?.present ?? daily.manpower.direct ?? null;
      const dirAbsent = daily.manpower.directBreakdown?.absent ?? (dirTotal !== null && dirPresent !== null ? Math.max(0, dirTotal - dirPresent) : null);

      const indTotal = daily.manpower.indirectBreakdown?.total ?? null;
      const indPresent = daily.manpower.indirectBreakdown?.present ?? daily.manpower.indirect ?? null;
      const indAbsent = daily.manpower.indirectBreakdown?.absent ?? (indTotal !== null && indPresent !== null ? Math.max(0, indTotal - indPresent) : null);

      const total = daily.manpower.total ?? ((dirTotal || 0) + (indTotal || 0) || null);
      const present = daily.manpower.present ?? ((dirPresent || 0) + (indPresent || 0) || null);
      const absent = daily.manpower.absent ?? (total !== null && present !== null ? Math.max(0, total - present) : null);
      const attendanceRatio = daily.manpower.attendanceRatio ?? (total && total > 0 && present !== null ? Number(((present / total) * 100).toFixed(1)) : null);

      siteManpower = {
        direct: {
          total: dirTotal,
          present: dirPresent,
          absent: dirAbsent,
          attendanceRatio: (dirTotal && dirTotal > 0 && dirPresent !== null) ? Number(((dirPresent / dirTotal) * 100).toFixed(2)) : null
        },
        indirect: {
          total: indTotal,
          present: indPresent,
          absent: indAbsent,
          attendanceRatio: (indTotal && indTotal > 0 && indPresent !== null) ? Number(((indPresent / indTotal) * 100).toFixed(2)) : null
        },
        total,
        present,
        absent,
        attendanceRatio
      };
    }
  }

  // 6. Generate Factual Executive Summary (3-5 Lines)
  const summaryFa: string[] = [];
  const summaryEn: string[] = [];

  // Line 1: Progress & Variance
  if (isValidNumericValue(actualProgress) && isValidNumericValue(plannedProgress) && isValidNumericValue(progressVariance)) {
    const numActual = Number(actualProgress);
    const numPlanned = Number(plannedProgress);
    const numVar = Number(progressVariance);
    const varTextFa = numVar >= 0 ? `+${numVar}% جلوتر از برنامه` : `${Math.abs(numVar)}% انحراف منفی`;
    const varTextEn = numVar >= 0 ? `+${numVar}% ahead of plan` : `${Math.abs(numVar)}% negative variance`;
    summaryFa.push(
      `پیشرفت تجمعی واقعی پروژه به ${numActual}% رسید در حالی که برنامه زمان‌بندی مصوب ${numPlanned}% بوده است (${varTextFa}).`
    );
    summaryEn.push(
      `Cumulative actual progress reached ${numActual}% versus planned target of ${numPlanned}% (${varTextEn}).`
    );
  } else {
    summaryFa.push('اطلاعات کافی جهت تحلیل مقایسه‌ای پیشرفت برنامه‌ای و واقعی ثبت نشده است.');
    summaryEn.push('Insufficient data to evaluate planned vs actual progress variance.');
  }

  // Line 2: Critical discipline / Lag (Source-Safe, No Fabricated Weight, No undefined%)
  if (pms && Array.isArray(pms.disciplineProgress) && pms.disciplineProgress.length > 0) {
    const validDisciplines = pms.disciplineProgress.filter((d) => {
      const v = d.variance !== undefined ? d.variance : (isValidNumericValue(d.actual) && isValidNumericValue(d.planned) ? Number(d.actual) - Number(d.planned) : null);
      return isValidNumericValue(v);
    });

    if (validDisciplines.length > 0) {
      const worstDiscipline = [...validDisciplines].sort((a, b) => {
        const varA = isValidNumericValue(a.variance) ? Number(a.variance) : (Number(a.actual || 0) - Number(a.planned || 0));
        const varB = isValidNumericValue(b.variance) ? Number(b.variance) : (Number(b.actual || 0) - Number(b.planned || 0));
        return varA - varB;
      })[0];

      const disciplineName = worstDiscipline?.nameFa || worstDiscipline?.name || null;
      const disciplineNameEn = worstDiscipline?.nameEn || worstDiscipline?.name || disciplineName;

      const rawVariance = worstDiscipline?.variance !== undefined
        ? worstDiscipline.variance
        : (isValidNumericValue(worstDiscipline?.actual) && isValidNumericValue(worstDiscipline?.planned)
            ? Number(worstDiscipline.actual) - Number(worstDiscipline.planned)
            : undefined);

      const rawWeight = worstDiscipline?.weight;

      const hasValidVariance = isValidNumericValue(rawVariance);
      const hasValidWeight = isValidNumericValue(rawWeight);

      if (disciplineName && hasValidVariance) {
        const numVar = Number(rawVariance);
        const normVar = normalizePercent(numVar);
        
        if (normVar !== null && normVar < 0) {
          const formattedVariance = normVar % 1 === 0 ? normVar.toString() : normVar.toFixed(1);
          const varianceTextFa = `${formattedVariance} واحد درصد`;
          const varianceTextEn = `${formattedVariance} percentage points`;

          if (hasValidWeight) {
            const numWeight = Number(rawWeight);
            const normWeight = normalizePercent(numWeight);
            const weightFormatted = normWeight !== null ? (normWeight % 1 === 0 ? normWeight.toString() : normWeight.toFixed(2)) : '';
            
            summaryFa.push(
              `بیشترین انحراف پیشرفت مربوط به دیسیپلین ${disciplineName} با انحراف ${varianceTextFa} و وزن ${weightFormatted}% از کل پروژه است.`
            );
            summaryEn.push(
              `Major progress delay is focused in ${disciplineNameEn} with ${varianceTextEn} variance and weight of ${weightFormatted}% of total project.`
            );
          } else {
            summaryFa.push(
              `بیشترین انحراف پیشرفت مربوط به دیسیپلین ${disciplineName} با انحراف ${varianceTextFa} است.`
            );
            summaryEn.push(
              `Major progress delay is focused in ${disciplineNameEn} with ${varianceTextEn} variance.`
            );
          }
        }
      }
    }
  }

  // Line 3: Equipment & Installation
  if (equipment && isValidNumericValue(equipmentTotal) && isValidNumericValue(equipmentInstalled)) {
    const numTotal = Number(equipmentTotal);
    const numInstalled = Number(equipmentInstalled);
    const numPerc = isValidNumericValue(equipment.installationPercentage)
      ? Number(equipment.installationPercentage)
      : (numTotal > 0 ? Number(((numInstalled / numTotal) * 100).toFixed(1)) : null);
    const percText = numPerc !== null ? ` (${numPerc}%)` : '';
    const acceptedPart = isValidNumericValue(equipment.accepted) ? ` و ${equipment.accepted} آیتم تایید نهایی شده است` : '';
    const acceptedPartEn = isValidNumericValue(equipment.accepted) ? `, with ${equipment.accepted} accepted` : '';
    summaryFa.push(
      `در بخش نصب تجهیزات، از مجموع ${numTotal} آیتم، تعداد ${numInstalled} آیتم${percText}${acceptedPart} نصب شده است.`
    );
    summaryEn.push(
      `In equipment installation, ${numInstalled} out of ${numTotal} units${percText}${acceptedPartEn} are installed.`
    );
  }

  // Line 4: Dual-Currency Financial Status
  if (finSummary && (isValidNumericValue(finSummary.financialProgress) || isValidNumericValue(finSummary.collectionRatio))) {
    const finProg = isValidNumericValue(finSummary.financialProgress) ? `${finSummary.financialProgress}%` : null;
    const colRatio = isValidNumericValue(finSummary.collectionRatio) ? `${finSummary.collectionRatio}%` : null;
    const ipcLabelFa = finSummary.latestInvoiceNumber ? `IPC-${finSummary.latestInvoiceNumber}` : (ipc?.latestIpcNo || 'جاری');
    const ipcLabelEn = finSummary.latestInvoiceNumber ? `IPC #${finSummary.latestInvoiceNumber}` : (ipc?.latestIpcNo || 'latest IPC');

    if (finProg && colRatio) {
      summaryFa.push(
        `وضعیت مالی: در آخرین صورت‌وضعیت (${ipcLabelFa})، پیشرفت مالی تجمعی به ${finProg} و نسبت وصول مطالبات به ${colRatio} رسیده است.`
      );
      summaryEn.push(
        `Financial status: Cumulative financial progress is ${finProg} with a collection ratio of ${colRatio} for ${ipcLabelEn}.`
      );
    } else if (finProg) {
      summaryFa.push(
        `وضعیت مالی: در آخرین صورت‌وضعیت (${ipcLabelFa})، پیشرفت مالی تجمعی به ${finProg} رسیده است.`
      );
      summaryEn.push(
        `Financial status: Cumulative financial progress is ${finProg} for ${ipcLabelEn}.`
      );
    } else if (colRatio) {
      summaryFa.push(
        `وضعیت مالی: در آخرین صورت‌وضعیت (${ipcLabelFa})، نسبت وصول مطالبات به ${colRatio} رسیده است.`
      );
      summaryEn.push(
        `Financial status: Collection ratio reached ${colRatio} for ${ipcLabelEn}.`
      );
    }
  } else if (ipc && isValidNumericValue(ipcApproved) && isValidNumericValue(ipcPaid)) {
    const numPaid = Number(ipcPaid);
    const numApproved = Number(ipcApproved);
    const numOutstanding = isValidNumericValue(ipcOutstanding) ? Number(ipcOutstanding) : Math.max(0, numApproved - numPaid);
    const ratio = isValidNumericValue(ipcCachedRatio) ? `${ipcCachedRatio}%` : `${((numPaid / numApproved) * 100).toFixed(1)}%`;
    const curr = ipc.currency || 'ریال';
    summaryFa.push(
      `وضعیت مالی: در آخرین صورت‌وضعیت (${ipc.latestIpcNo || 'جاری'})، مبلغ ${numPaid.toLocaleString()} ${curr} معادل ${ratio} از مبلغ تاییدشده پرداخت و ${numOutstanding.toLocaleString()} ${curr} مطالبات باز مانده است.`
    );
    summaryEn.push(
      `Financial status: For ${ipc.latestIpcNo || 'latest IPC'}, ${numPaid.toLocaleString()} ${curr} (${ratio} of approved) is disbursed with ${numOutstanding.toLocaleString()} ${curr} outstanding.`
    );
  }

  // Line 5: Key Issues Summary
  if (daily && Array.isArray(daily.keyIssues) && daily.keyIssues.length > 0) {
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
    siteManpower,
    activeMachinery,
    executiveSummaryLinesFa: summaryFa.slice(0, 5),
    executiveSummaryLinesEn: summaryEn.slice(0, 5)
  };
}
