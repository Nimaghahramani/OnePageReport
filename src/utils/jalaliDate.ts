/**
 * Robust Jalali (Solar Hijri) <-> Gregorian Date Conversion and Arithmetic
 * Standard astronomical algorithm (Borkowski / Jalaali-js standard)
 */

export interface ParsedDateResult {
  jy: number;
  jm: number;
  jd: number;
  gy: number;
  gm: number;
  gd: number;
  jalaliString: string; // e.g. "1405/06/07"
  isoString: string;    // e.g. "2026-08-29"
  utcMidnightMs: number;
}

/**
 * Converts Jalali date (jy, jm, jd) to Gregorian date (gy, gm, gd)
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  let gy: number;
  let adjustJy = jy;
  if (adjustJy > 979) {
    gy = 1600;
    adjustJy -= 979;
  } else {
    gy = 621;
  }

  let days =
    365 * adjustJy +
    Math.floor(adjustJy / 33) * 8 +
    Math.floor(((adjustJy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

  gy += 400 * Math.floor(days / 146097);
  days %= 146097;

  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }

  gy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let gd = days + 1;
  const sal_a = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
  ];
  let gm: number;
  for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) {
    gd -= sal_a[gm];
  }
  return { gy, gm, gd };
}

/**
 * Converts Gregorian date (gy, gm, gd) to Jalali date (jy, jm, jd)
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number; jalaliString: string } {
  const g_d_m = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
  ];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd;
  for (let i = 0; i < gm; ++i) days += g_d_m[i];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  const jalaliString = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
  return { jy, jm, jd, jalaliString };
}

/**
 * Parses any date (Persian string '1405/06/07', ISO string '2026-08-29', JS Date, or Excel serial number)
 * into a unified ParsedDateResult.
 */
export function parsePersianOrGregorianDate(val: any): ParsedDateResult | null {
  if (val === null || val === undefined || val === '') return null;

  // 1. JS Date instance
  if (val instanceof Date && !isNaN(val.getTime())) {
    const gy = val.getUTCFullYear();
    const gm = val.getUTCMonth() + 1;
    const gd = val.getUTCDate();
    const { jy, jm, jd, jalaliString } = gregorianToJalali(gy, gm, gd);
    const isoString = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
    return {
      jy,
      jm,
      jd,
      gy,
      gm,
      gd,
      jalaliString,
      isoString,
      utcMidnightMs: Date.UTC(gy, gm - 1, gd)
    };
  }

  // 2. Excel serial number (e.g. 46263)
  if (typeof val === 'number') {
    if (val >= 25000 && val <= 65000) {
      const parsedDate = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(parsedDate.getTime())) {
        return parsePersianOrGregorianDate(parsedDate);
      }
    }
  }

  const str = String(val).trim();
  if (!str) return null;

  // 3. Persian date format (e.g. 1403/12/21, 1405-06-07, 1405.06.07)
  const persianMatch = str.match(/^(13\d{2}|14\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (persianMatch) {
    const jy = parseInt(persianMatch[1], 10);
    const jm = parseInt(persianMatch[2], 10);
    const jd = parseInt(persianMatch[3], 10);
    if (jm >= 1 && jm <= 12 && jd >= 1 && jd <= 31) {
      const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
      const jalaliString = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
      const isoString = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
      return {
        jy,
        jm,
        jd,
        gy,
        gm,
        gd,
        jalaliString,
        isoString,
        utcMidnightMs: Date.UTC(gy, gm - 1, gd)
      };
    }
  }

  // 4. Gregorian ISO format (e.g. 2026-08-29, 2026/08/29)
  const gregMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (gregMatch) {
    const gy = parseInt(gregMatch[1], 10);
    const gm = parseInt(gregMatch[2], 10);
    const gd = parseInt(gregMatch[3], 10);
    if (gy >= 1990 && gy <= 2100 && gm >= 1 && gm <= 12 && gd >= 1 && gd <= 31) {
      const { jy, jm, jd, jalaliString } = gregorianToJalali(gy, gm, gd);
      const isoString = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
      return {
        jy,
        jm,
        jd,
        gy,
        gm,
        gd,
        jalaliString,
        isoString,
        utcMidnightMs: Date.UTC(gy, gm - 1, gd)
      };
    }
  }

  return null;
}

/**
 * Calculates calendar days between two dates (date1 - date2).
 * e.g. differenceInCalendarDays('1405/06/07', '1403/12/21') -> 536
 */
export function differenceInCalendarDays(d1: any, d2: any): number | null {
  const p1 = parsePersianOrGregorianDate(d1);
  const p2 = parsePersianOrGregorianDate(d2);
  if (!p1 || !p2) return null;

  const msDiff = p1.utcMidnightMs - p2.utcMidnightMs;
  return Math.round(msDiff / (1000 * 60 * 60 * 24));
}

/**
 * Compares two dates:
 * Returns:
 * -1 if d1 < d2
 *  0 if d1 == d2
 *  1 if d1 > d2
 */
export function comparePersianOrIsoDates(d1: any, d2: any): number {
  const p1 = parsePersianOrGregorianDate(d1);
  const p2 = parsePersianOrGregorianDate(d2);
  if (!p1 && !p2) return 0;
  if (!p1) return -1;
  if (!p2) return 1;

  if (p1.utcMidnightMs < p2.utcMidnightMs) return -1;
  if (p1.utcMidnightMs > p2.utcMidnightMs) return 1;
  return 0;
}

/**
 * Formats any date into Persian "YYYY/MM/DD" string.
 */
export function formatToJalali(val: any): string {
  const p = parsePersianOrGregorianDate(val);
  return p ? p.jalaliString : String(val || '-');
}

/**
 * Reconstructs a ParsedDateResult from a UTC midnight millisecond timestamp.
 */
export function createDateFromUtcMidnightMs(ms: number): ParsedDateResult {
  const d = new Date(ms);
  const gy = d.getUTCFullYear();
  const gm = d.getUTCMonth() + 1;
  const gd = d.getUTCDate();
  const { jy, jm, jd, jalaliString } = gregorianToJalali(gy, gm, gd);
  const isoString = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
  return {
    jy,
    jm,
    jd,
    gy,
    gm,
    gd,
    jalaliString,
    isoString,
    utcMidnightMs: Date.UTC(gy, gm - 1, gd)
  };
}

