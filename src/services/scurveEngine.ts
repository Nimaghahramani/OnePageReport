import * as XLSX from 'xlsx';
import { MasterSCurvePoint, MasterSCurveRecord, ActualProgressPoint, PmsRecord } from '../types';
import {
  parsePersianOrGregorianDate,
  differenceInCalendarDays,
  createDateFromUtcMidnightMs,
  formatToJalali,
  ParsedDateResult
} from '../utils/jalaliDate';

/**
 * Normalizes percentage values from Excel.
 * Excel decimals like 0.95299 -> 95.299%
 * Values already between 1 and 100 are preserved.
 */
export function normalizePercent(value: any): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[%,\s]/g, '');
    if (cleaned === '') return null;
    const n = Number(cleaned);
    if (!Number.isFinite(n)) return null;
    return n <= 1 && n > 0 ? Number((n * 100).toFixed(4)) : Number(n.toFixed(4));
  }
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n <= 1 && n > 0 ? Number((n * 100).toFixed(4)) : Number(n.toFixed(4));
}

/**
 * Persian month map to Gregorian month end / cut-off dates
 */
const PERSIAN_MONTH_MAP: { regex: RegExp; getIsoDate: (yearDigits: number) => string }[] = [
  { regex: /فروردین/i, getIsoDate: (y) => (y === 4 || y === 1404 ? '2025-04-30' : y === 5 || y === 1405 ? '2026-04-30' : '2025-04-30') },
  { regex: /اردیبهشت/i, getIsoDate: (y) => (y === 4 || y === 1404 ? '2025-05-31' : y === 5 || y === 1405 ? '2026-05-31' : '2025-05-31') },
  { regex: /خرداد/i, getIsoDate: (y) => (y === 4 || y === 1404 ? '2025-06-30' : y === 5 || y === 1405 ? '2026-06-30' : '2025-06-30') },
  { regex: /تیر/i, getIsoDate: (y) => (y === 4 || y === 1404 ? '2025-07-31' : y === 5 || y === 1405 ? '2026-07-31' : '2025-07-31') },
  { regex: /مرداد/i, getIsoDate: (y) => (y === 4 || y === 1404 ? '2025-08-31' : y === 5 || y === 1405 ? '2026-08-22' : '2025-08-31') },
  { regex: /شهریور/i, getIsoDate: (y) => (y === 4 || y === 1404 ? '2025-09-30' : y === 5 || y === 1405 ? '2026-09-30' : '2025-09-30') },
  { regex: /مهر/i, getIsoDate: (y) => (y === 4 || y === 1404 ? '2025-10-31' : '2025-10-31') },
  { regex: /آبان/i, getIsoDate: (y) => (y === 4 || y === 1404 ? '2025-11-30' : '2025-11-30') },
  { regex: /آذر/i, getIsoDate: (y) => (y === 4 || y === 1404 ? '2025-12-31' : '2025-12-31') },
  { regex: /دی/i, getIsoDate: (y) => (y === 4 || y === 1404 ? '2026-01-31' : '2026-01-31') },
  { regex: /بهمن/i, getIsoDate: (y) => (y === 4 || y === 1404 ? '2026-02-28' : '2026-02-28') },
  { regex: /اسفند/i, getIsoDate: (y) => (y === 3 || y === 1403 ? '2025-03-31' : y === 4 || y === 1404 ? '2026-03-31' : '2025-03-31') },
];

/**
 * Parses any date value from Excel into a standard ISO-like string (YYYY-MM-DD or YYYY/MM/DD)
 */
export function parseDateValue(val: any): string | null {
  if (val === null || val === undefined || val === '') return null;

  // JS Date object (when cellDates: true)
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      return val.toISOString().split('T')[0];
    }
  }

  // Excel serial number
  if (typeof val === 'number') {
    if (val >= 25569 && val <= 60000) {
      try {
        const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
        if (!isNaN(jsDate.getTime())) {
          return jsDate.toISOString().split('T')[0];
        }
      } catch {
        // ignore
      }
    }
  }

  const s = String(val).trim();
  if (!s) return null;

  // Persian month name check (e.g. "اسفند03", "فروردین 04", "مرداد 05", "1404/05")
  for (const item of PERSIAN_MONTH_MAP) {
    if (item.regex.test(s)) {
      const yearDigitsMatch = s.match(/\d+/);
      const yearNum = yearDigitsMatch ? parseInt(yearDigitsMatch[0], 10) : 4;
      return item.getIsoDate(yearNum);
    }
  }

  // ISO date format YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = s.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(isoMatch[3], 10)).padStart(2, '0');

    // Persian year format (e.g. 1403/12/29 or 1404/05/31)
    if (y >= 1400 && y <= 1410) {
      const pYear = y;
      const pMonth = parseInt(m, 10);
      if (pYear === 1403 && pMonth === 12) return '2025-03-31';
      if (pYear === 1404) {
        const gMonths = ['2025-04-30', '2025-05-31', '2025-06-30', '2025-07-31', '2025-08-31', '2025-09-30', '2025-10-31', '2025-11-30', '2025-12-31', '2026-01-31', '2026-02-28', '2026-03-31'];
        return gMonths[pMonth - 1] || `${y}-${m}-${d}`;
      }
      if (pYear === 1405) {
        const gMonths = ['2026-04-30', '2026-05-31', '2026-06-30', '2026-07-31', '2026-08-22', '2026-09-30'];
        return gMonths[pMonth - 1] || `${y}-${m}-${d}`;
      }
    }
    return `${y}-${m}-${d}`;
  }

  // Day/Month/Year or Month/Day/Year
  const dmyMatch = s.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);
    const m = String(p2 <= 12 ? p2 : p1).padStart(2, '0');
    const d = String(p2 <= 12 ? p1 : p2).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Standard Date parsing attempt
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1990 && parsed.getFullYear() < 2100) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Calculates planned progress at any given target date using the approved Master S-Curve.
 * 
 * Rules:
 * 1. If exact date exists: returns exact Planned value.
 * 2. If date falls between two S-Curve dates: performs linear interpolation:
 *    P = P1 + ((Date - Date1) / (Date2 - Date1)) * (P2 - P1)
 * 3. If target date is outside Master S-Curve range or points are empty: returns null.
 */
export function getPlannedAtDate(
  pointsOrRecord: MasterSCurvePoint[] | MasterSCurveRecord | undefined | null,
  targetDate: string
): number | null {
  if (!pointsOrRecord || !targetDate) {
    return null;
  }

  const rawPoints: MasterSCurvePoint[] = Array.isArray(pointsOrRecord)
    ? pointsOrRecord
    : (pointsOrRecord && Array.isArray((pointsOrRecord as MasterSCurveRecord).points)
        ? (pointsOrRecord as MasterSCurveRecord).points
        : []);

  if (!rawPoints || rawPoints.length === 0) {
    return null;
  }

  // Normalize target date string (e.g. YYYY-MM-DD)
  const normTargetDate = targetDate.trim();
  const targetTime = new Date(normTargetDate).getTime();
  if (isNaN(targetTime)) {
    return null;
  }

  // Sort points chronologically
  const sorted = [...rawPoints]
    .filter(p => p && p.date && !isNaN(new Date(p.date).getTime()) && typeof p.planned === 'number')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sorted.length === 0) {
    return null;
  }

  // 1. Check exact match
  const exact = sorted.find(p => p.date === normTargetDate);
  if (exact !== undefined) {
    return Number(exact.planned.toFixed(2));
  }

  const firstTime = new Date(sorted[0].date).getTime();
  const lastTime = new Date(sorted[sorted.length - 1].date).getTime();

  // 3. Outside range -> return null
  if (targetTime < firstTime || targetTime > lastTime) {
    return null;
  }

  // 2. Linear Interpolation between two bounding points
  for (let i = 0; i < sorted.length - 1; i++) {
    const p1 = sorted[i];
    const p2 = sorted[i + 1];
    const t1 = new Date(p1.date).getTime();
    const t2 = new Date(p2.date).getTime();

    if (targetTime >= t1 && targetTime <= t2) {
      if (t2 === t1) {
        return Number(p1.planned.toFixed(2));
      }
      const fraction = (targetTime - t1) / (t2 - t1);
      const interpolated = p1.planned + fraction * (p2.planned - p1.planned);
      return Number(interpolated.toFixed(2));
    }
  }

  return null;
}

export interface ScheduleDelayCalculationResult {
  scheduleDelayDays: number | null;
  scheduleVarianceDays: number | null;
  plannedAchievementDate: string | null; // Jalali YYYY/MM/DD
  plannedAchievementIsoDate: string | null; // ISO YYYY-MM-DD
  delayCalculationSource: 'PMS_PLANNED_CURVE' | 'MASTER_SCURVE_FALLBACK' | null;
  p1Point: { date: string; jalaliDate: string; planned: number } | null;
  p2Point: { date: string; jalaliDate: string; planned: number } | null;
  currentActual: number | null;
  currentPlan: number | null;
  referenceReportDate: string | null;
  ratio: number | null;
}

/**
 * Calculates Schedule Delay Days (روز تأخیر زمانی) by finding the horizontal
 * time difference on the Planned Progress Curve for the current Actual Progress.
 * 
 * Strict Rules:
 * 1. Reference date: Daily Report Date (NOT system/browser/upload date)
 * 2. Current Actual: Root Activity ID = 0 Actual Cumulative % (e.g. 73.2802%)
 * 3. Finds plannedAchievementDate where PlannedProgress(date) ≈ CurrentActual
 * 4. Linear interpolation between bounding planned points:
 *    ratio = (currentActual - progress1) / (progress2 - progress1)
 *    plannedAchievementDate = date1 + ratio * (date2 - date1)
 *    scheduleDelayDays = differenceInCalendarDays(dailyReportDate, plannedAchievementDate)
 * 5. Priority 1: PMS Planned dated history; Priority 2: Master S-Curve Planned
 * 6. If Actual >= Planned -> delay = 0 (no negative delay days)
 * 7. If insufficient points -> returns null (hides delay card without guessing)
 */
export function calculateScheduleDelayFromPlannedCurve(
  dailyReportDateStr: string | null | undefined,
  currentActualProgress: number | null | undefined,
  currentPlannedProgress: number | null | undefined,
  pms: PmsRecord | null | undefined,
  masterSCurve: MasterSCurveRecord | null | undefined,
  projectStartDateStr?: string | null
): ScheduleDelayCalculationResult {
  const emptyResult: ScheduleDelayCalculationResult = {
    scheduleDelayDays: null,
    scheduleVarianceDays: null,
    plannedAchievementDate: null,
    plannedAchievementIsoDate: null,
    delayCalculationSource: null,
    p1Point: null,
    p2Point: null,
    currentActual: currentActualProgress ?? null,
    currentPlan: currentPlannedProgress ?? null,
    referenceReportDate: dailyReportDateStr ?? null,
    ratio: null
  };

  if (currentActualProgress === null || currentActualProgress === undefined || !Number.isFinite(currentActualProgress)) {
    return emptyResult;
  }

  const parsedReportDate = parsePersianOrGregorianDate(dailyReportDateStr);
  if (!parsedReportDate) {
    return emptyResult;
  }

  // 1. Gather curve points from Priority 1 (PMS Historical Trend) or Priority 2 (Master S-Curve)
  interface CurvePoint {
    dateStr: string;
    parsed: ParsedDateResult;
    planned: number;
  }

  let curvePoints: CurvePoint[] = [];
  let source: 'PMS_PLANNED_CURVE' | 'MASTER_SCURVE_FALLBACK' | null = null;

  if (pms && Array.isArray(pms.historicalTrend) && pms.historicalTrend.length > 0) {
    const validPmsPoints: CurvePoint[] = [];
    for (const pt of pms.historicalTrend) {
      if (typeof pt.planned === 'number' && Number.isFinite(pt.planned) && pt.dataDate) {
        const parsed = parsePersianOrGregorianDate(pt.dataDate);
        if (parsed) {
          validPmsPoints.push({
            dateStr: pt.dataDate,
            parsed,
            planned: pt.planned
          });
        }
      }
    }

    if (validPmsPoints.length >= 2) {
      validPmsPoints.sort((a, b) => a.parsed.utcMidnightMs - b.parsed.utcMidnightMs);
      curvePoints = validPmsPoints;
      source = 'PMS_PLANNED_CURVE';
    }
  }

  if (curvePoints.length < 2 && masterSCurve && Array.isArray(masterSCurve.points) && masterSCurve.points.length > 0) {
    const validMasterPoints: CurvePoint[] = [];
    for (const pt of masterSCurve.points) {
      if (typeof pt.planned === 'number' && Number.isFinite(pt.planned) && pt.date) {
        const parsed = parsePersianOrGregorianDate(pt.date);
        if (parsed) {
          validMasterPoints.push({
            dateStr: pt.date,
            parsed,
            planned: pt.planned
          });
        }
      }
    }

    if (validMasterPoints.length >= 2) {
      validMasterPoints.sort((a, b) => a.parsed.utcMidnightMs - b.parsed.utcMidnightMs);
      curvePoints = validMasterPoints;
      source = 'MASTER_SCURVE_FALLBACK';
    }
  }

  if (curvePoints.length < 2 || !source) {
    return emptyResult;
  }

  // 2. Special case: If Actual >= Plan at reference date, schedule delay is 0
  if (currentPlannedProgress !== null && currentPlannedProgress !== undefined && currentActualProgress >= currentPlannedProgress) {
    return {
      scheduleDelayDays: 0,
      scheduleVarianceDays: 0,
      plannedAchievementDate: parsedReportDate.jalaliString,
      plannedAchievementIsoDate: parsedReportDate.isoString,
      delayCalculationSource: source,
      p1Point: null,
      p2Point: null,
      currentActual: currentActualProgress,
      currentPlan: currentPlannedProgress,
      referenceReportDate: parsedReportDate.jalaliString,
      ratio: 0
    };
  }

  // 3. Find bounding points P1 and P2
  let p1: CurvePoint | null = null;
  let p2: CurvePoint | null = null;
  let ratio = 0;
  let achievementUtcMs: number | null = null;

  if (currentActualProgress <= curvePoints[0].planned) {
    // Before or at first point
    const parsedStart = parsePersianOrGregorianDate(projectStartDateStr || '1403/12/21');
    if (parsedStart && parsedStart.utcMidnightMs < curvePoints[0].parsed.utcMidnightMs && curvePoints[0].planned > 0) {
      p1 = {
        dateStr: parsedStart.jalaliString,
        parsed: parsedStart,
        planned: 0
      };
      p2 = curvePoints[0];
      ratio = currentActualProgress / p2.planned;
      achievementUtcMs = p1.parsed.utcMidnightMs + ratio * (p2.parsed.utcMidnightMs - p1.parsed.utcMidnightMs);
    } else {
      p1 = curvePoints[0];
      p2 = curvePoints[1];
      ratio = 0;
      achievementUtcMs = p1.parsed.utcMidnightMs;
    }
  } else if (currentActualProgress >= curvePoints[curvePoints.length - 1].planned) {
    // At or beyond last point
    p1 = curvePoints[curvePoints.length - 2];
    p2 = curvePoints[curvePoints.length - 1];
    ratio = 1;
    achievementUtcMs = p2.parsed.utcMidnightMs;
  } else {
    // Normal interval search
    for (let i = 0; i < curvePoints.length - 1; i++) {
      const ptA = curvePoints[i];
      const ptB = curvePoints[i + 1];
      if (currentActualProgress >= ptA.planned && currentActualProgress <= ptB.planned) {
        p1 = ptA;
        p2 = ptB;
        break;
      }
    }

    if (!p1 || !p2) {
      // Fallback to closest pair
      p1 = curvePoints[0];
      p2 = curvePoints[curvePoints.length - 1];
    }

    const progressDiff = p2.planned - p1.planned;
    if (progressDiff > 0) {
      ratio = (currentActualProgress - p1.planned) / progressDiff;
      achievementUtcMs = p1.parsed.utcMidnightMs + ratio * (p2.parsed.utcMidnightMs - p1.parsed.utcMidnightMs);
    } else {
      ratio = 0;
      achievementUtcMs = p1.parsed.utcMidnightMs;
    }
  }

  if (achievementUtcMs === null || isNaN(achievementUtcMs)) {
    return emptyResult;
  }

  const achievementDate = createDateFromUtcMidnightMs(Math.round(achievementUtcMs));
  const diffDays = differenceInCalendarDays(parsedReportDate.jalaliString, achievementDate.jalaliString);

  if (diffDays === null) {
    return emptyResult;
  }

  // Delay days: If diffDays > 0, project achieved this progress diffDays ago -> delay = diffDays
  // If diffDays <= 0, project is ahead/on schedule -> delay = 0
  const scheduleDelayDays = Math.max(0, diffDays);
  const scheduleVarianceDays = -diffDays;

  return {
    scheduleDelayDays,
    scheduleVarianceDays,
    plannedAchievementDate: achievementDate.jalaliString,
    plannedAchievementIsoDate: achievementDate.isoString,
    delayCalculationSource: source,
    p1Point: p1 ? { date: p1.dateStr, jalaliDate: p1.parsed.jalaliString, planned: p1.planned } : null,
    p2Point: p2 ? { date: p2.dateStr, jalaliDate: p2.parsed.jalaliString, planned: p2.planned } : null,
    currentActual: currentActualProgress,
    currentPlan: currentPlannedProgress ?? null,
    referenceReportDate: parsedReportDate.jalaliString,
    ratio: Number(ratio.toFixed(4))
  };
}

export interface MasterSCurveParseResult {
  sourceFile: string;
  sheetName: string;
  planName: string;
  points: MasterSCurvePoint[];
  initialActualPoints: ActualProgressPoint[];
  totalPoints: number;
  minDate: string;
  maxDate: string;
  minPlanned: number;
  maxPlanned: number;
  firstPoint: MasterSCurvePoint;
  lastPoint: MasterSCurvePoint;
  last5Points: MasterSCurvePoint[];
  warnings: string[];
}

/**
 * Dedicated Parser for Scurve.xlsx
 * Target worksheet: "S-Curve" (trim() and toLowerCase() check).
 * Approved Master Plan: Overall -> PLAN (18M) -> CUM (Row 30)
 * Initial Actual: Overall -> ACTUAL -> CUM (Row 34)
 * Anchor-based extraction across date header columns.
 */
export function parseMasterSCurveWorkbook(
  workbook: XLSX.WorkBook,
  sourceFileName = 'Scurve.xlsx'
): MasterSCurveParseResult {
  const warnings: string[] = [];

  // 1. Locate worksheet: target is "S-Curve" (normalized with trim())
  const exactSheetName = workbook.SheetNames.find(
    s => s.trim().toLowerCase() === 's-curve'
  ) || workbook.SheetNames.find(
    s => s.trim().toLowerCase().replace(/[\s\-_]/g, '') === 'scurve'
  ) || workbook.SheetNames.find(
    s => /s[\s\-_]*curve|scurve|plan\s*\(?18m\)?/i.test(s.trim())
  ) || workbook.SheetNames[0];

  if (!exactSheetName || !workbook.Sheets[exactSheetName]) {
    throw new Error('برگه S-Curve در فایل اکسل یافت نشد (Target sheet "S-Curve" not found).');
  }

  const worksheet = workbook.Sheets[exactSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

  if (!rows || rows.length < 2) {
    throw new Error(`برگه ${exactSheetName} خالی است یا فاقد سطرهای اطلاعاتی می‌باشد.`);
  }

  // 2. Scan header rows (rows 0 to 40) to map Column Index -> Date
  // In Scurve.xlsx, the month header is typically on Row 28 (index 27) or rows 0-30
  const colDateMap = new Map<number, string>();
  let headerRowIndex = -1;

  for (let r = 0; r < Math.min(40, rows.length); r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;

    let matchedDatesInRow = 0;
    const tempMap = new Map<number, string>();

    for (let c = 0; c < row.length; c++) {
      const cellVal = row[c];
      const parsedDate = parseDateValue(cellVal);
      if (parsedDate) {
        matchedDatesInRow++;
        tempMap.set(c, parsedDate);
      }
    }

    // If this row has 3 or more date/month headers, use it as our canonical header row
    if (matchedDatesInRow >= 3 && matchedDatesInRow > colDateMap.size) {
      colDateMap.clear();
      tempMap.forEach((v, k) => colDateMap.set(k, v));
      headerRowIndex = r;
    }
  }

  // Fallback: scan top 15 rows if headerRowIndex wasn't found
  if (colDateMap.size === 0) {
    for (let r = 0; r < Math.min(15, rows.length); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      for (let c = 0; c < row.length; c++) {
        if (colDateMap.has(c)) continue;
        const cellVal = row[c];
        const parsedDate = parseDateValue(cellVal);
        if (parsedDate) {
          colDateMap.set(c, parsedDate);
        }
      }
    }
  }

  // 3. Locate Master Planned Row (Overall -> PLAN (18M) -> CUM)
  // And Initial Actual Row (Overall -> ACTUAL -> CUM)
  let plannedRowIndex = -1;
  let actualRowIndex = -1;
  const detectedPlanName = 'Overall / PLAN (18M) / CUM';

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;

    const labelRowText = row.slice(0, 10).map(v => String(v || '').trim()).join(' ').toLowerCase();

    // Check for PLAN (18M) CUM
    const isPlan18m = (labelRowText.includes('18m') || labelRowText.includes('18 m') || labelRowText.includes('۱۸')) && !labelRowText.includes('14m');
    const isCum = labelRowText.includes('cum') || labelRowText.includes('cumulative') || labelRowText.includes('تجمعی') || labelRowText.includes('تجمعي');
    const isPeriod = labelRowText.includes('period') || labelRowText.includes('دوره‌ای') || labelRowText.includes('دوره ای');

    if (isPlan18m && isCum && !isPeriod && plannedRowIndex === -1) {
      plannedRowIndex = r;
    }

    // Check for ACTUAL CUM (Row 34 in Scurve.xlsx)
    const isActual = labelRowText.includes('actual') || labelRowText.includes('واقعی');
    if (isActual && isCum && !isPeriod && actualRowIndex === -1) {
      actualRowIndex = r;
    }
  }

  // Row Index fallbacks based on standard Scurve.xlsx layout:
  // Row 30 (0-index 29): Overall / PLAN (18M) / CUM
  // Row 34 (0-index 33): Overall / ACTUAL / CUM
  if (plannedRowIndex === -1 && rows.length >= 30) {
    if (rows[29] && rows[29].some((v: any) => typeof v === 'number' && v > 0)) {
      plannedRowIndex = 29;
    }
  }

  if (actualRowIndex === -1 && rows.length >= 34) {
    if (rows[33] && rows[33].some((v: any) => typeof v === 'number' && v > 0)) {
      actualRowIndex = 33;
    }
  }

  // Strategy B for Planned: Row following "PLAN (18M)"
  if (plannedRowIndex === -1) {
    for (let r = 0; r < rows.length - 1; r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      const text = row.slice(0, 8).map(v => String(v || '').trim()).join(' ').toLowerCase();
      if ((text.includes('plan (18m)') || text.includes('plan 18m') || text.includes('18m')) && !text.includes('14m')) {
        for (let nextR = r; nextR <= Math.min(rows.length - 1, r + 3); nextR++) {
          const nextText = rows[nextR].slice(0, 8).map(v => String(v || '').trim()).join(' ').toLowerCase();
          if (nextText.includes('cum') || nextText.includes('تجمعی')) {
            plannedRowIndex = nextR;
            break;
          }
        }
        if (plannedRowIndex !== -1) break;
      }
    }
  }

  // 4. Extract Planned Points from plannedRowIndex
  const rawPlannedExtracted: MasterSCurvePoint[] = [];
  const rawActualExtracted: ActualProgressPoint[] = [];

  if (colDateMap.size > 0) {
    const sortedCols = Array.from(colDateMap.keys()).sort((a, b) => a - b);

    // Read Planned
    if (plannedRowIndex !== -1) {
      const pRow = rows[plannedRowIndex];
      for (const colIdx of sortedCols) {
        const dateStr = colDateMap.get(colIdx);
        if (!dateStr) continue;
        const cellVal = pRow[colIdx];
        const normPlanned = normalizePercent(cellVal);
        if (normPlanned !== null) {
          rawPlannedExtracted.push({
            date: dateStr,
            planned: Number(normPlanned.toFixed(2))
          });
        }
      }
    }

    // Read Initial Actual
    if (actualRowIndex !== -1) {
      const aRow = rows[actualRowIndex];
      for (const colIdx of sortedCols) {
        const dateStr = colDateMap.get(colIdx);
        if (!dateStr) continue;
        const cellVal = aRow[colIdx];
        const normActual = normalizePercent(cellVal);
        if (normActual !== null && normActual > 0) {
          rawActualExtracted.push({
            dataDate: dateStr,
            actual: Number(normActual.toFixed(4)),
            source: 'INITIAL_SCURVE'
          });
        }
      }
    }
  }

  // Deduplicate and sort Planned points
  const uniquePlanned = new Map<string, number>();
  for (const pt of rawPlannedExtracted) {
    uniquePlanned.set(pt.date, pt.planned);
  }

  const finalPoints: MasterSCurvePoint[] = Array.from(uniquePlanned.entries())
    .map(([date, planned]) => ({ date, planned }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (finalPoints.length === 0) {
    throw new Error('Master S-Curve parsing failed. No valid PLAN (18M) CUM points found in worksheet.');
  }

  // Deduplicate, sort and monotonically validate Initial Actual points
  const uniqueActual = new Map<string, number>();
  for (const pt of rawActualExtracted) {
    uniqueActual.set(pt.dataDate, pt.actual);
  }

  const sortedActual: ActualProgressPoint[] = Array.from(uniqueActual.entries())
    .map(([dataDate, actual]) => ({ dataDate, actual, source: 'INITIAL_SCURVE' as const }))
    .sort((a, b) => new Date(a.dataDate).getTime() - new Date(b.dataDate).getTime());

  // Monotonic validation on Initial Actual (Actual Cumulative must not decrease)
  const validatedActual: ActualProgressPoint[] = [];
  let highestActual = 0;
  for (const pt of sortedActual) {
    if (pt.actual >= highestActual) {
      validatedActual.push(pt);
      highestActual = pt.actual;
    } else {
      warnings.push(`هشدار: نقطه پیشرفت واقعی در تاریخ ${pt.dataDate} (${pt.actual}%) از مقدار قبلی (${highestActual}%) کمتر بود و جهت حفظ یکنواختی تصحیح شد.`);
    }
  }

  const minDate = finalPoints[0].date;
  const maxDate = finalPoints[finalPoints.length - 1].date;
  const minPlanned = finalPoints[0].planned;
  const maxPlanned = finalPoints[finalPoints.length - 1].planned;

  return {
    sourceFile: sourceFileName,
    sheetName: exactSheetName,
    planName: detectedPlanName,
    points: finalPoints,
    initialActualPoints: validatedActual,
    totalPoints: finalPoints.length,
    minDate,
    maxDate,
    minPlanned,
    maxPlanned,
    firstPoint: finalPoints[0],
    lastPoint: finalPoints[finalPoints.length - 1],
    last5Points: finalPoints.slice(-5),
    warnings
  };
}

/**
 * Backward compatibility parser for single worksheet
 */
export function parseMasterSCurveWorksheet(
  worksheet: XLSX.WorkSheet,
  sheetName: string
): MasterSCurveParseResult {
  const wb: XLSX.WorkBook = {
    SheetNames: [sheetName],
    Sheets: { [sheetName]: worksheet }
  };
  return parseMasterSCurveWorkbook(wb, `${sheetName}.xlsx`);
}
