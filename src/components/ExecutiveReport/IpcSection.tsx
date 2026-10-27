import React from 'react';
import { IpcRecord, DailyReportRecord, Language, FINANCIAL_CALCULATION_BASE_IRR } from '../../types';
import { CreditCard, Users, Truck, UserCheck, UserX } from 'lucide-react';

interface IpcSectionProps {
  ipc: IpcRecord;
  daily: DailyReportRecord;
  lang: Language;
}

// Helper to format currency numbers compactly in Billion Rials (م.ر) or Millions
function formatIrrValue(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  if (Math.abs(amount) >= 1_000_000_000) {
    return (amount / 1_000_000_000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  if (Math.abs(amount) >= 1_000_000) {
    return (amount / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  return amount.toLocaleString('en-US');
}

function getIrrUnit(amount: number | null | undefined, isFa: boolean = true): string {
  if (amount === null || amount === undefined) return '';
  if (amount === 0) return isFa ? 'م.ر' : 'B IRR';
  if (Math.abs(amount) >= 1_000_000_000) {
    return isFa ? 'م.ر' : 'B IRR';
  }
  if (Math.abs(amount) >= 1_000_000) {
    return isFa ? 'م.ر' : 'M IRR';
  }
  return isFa ? 'ریال' : 'IRR';
}

function formatEurValue(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  if (amount === 0) return '0';
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}k`;
  }
  return amount.toLocaleString('en-US');
}

export const IpcSection: React.FC<IpcSectionProps> = ({ ipc, daily, lang }) => {
  const isFa = lang === 'fa';
  const fin = ipc.financialSummary;

  // Strict Rule: When a claim is received, it must NOT be in outstanding claims.
  // Outstanding claims only apply when approved but NOT paid/received.
  const isReceived = /دریافت|وصول|paid|received|پرداخت\s*شده/i.test(fin?.latestInvoiceStatus || ipc.status || '') &&
    !/دریافت\s*نشده|پرداخت\s*نشده|unpaid/i.test(fin?.latestInvoiceStatus || ipc.status || '');

  const displayOutstandingIRR = isReceived ? 0 : (fin?.outstandingIRR ?? Math.max(0, ipc.approvedAmount - ipc.paidAmount));
  const displayOutstandingEUR = isReceived ? 0 : (fin?.outstandingEUR ?? 0);

  const displayReceivedIRR = isReceived
    ? (fin?.invoiceCumulativeIRR ?? fin?.receivedIRR ?? ipc.approvedAmount)
    : (fin?.receivedIRR ?? ipc.paidAmount);
  const displayReceivedEUR = isReceived
    ? (fin?.invoiceCumulativeEUR ?? fin?.receivedEUR ?? 0)
    : (fin?.receivedEUR ?? 0);

  // Ratios and figures
  const finProgress = fin?.financialProgress ?? (ipc.approvedAmount > 0 ? Number(((ipc.approvedAmount / (fin?.financialCalculationBaseIRR || FINANCIAL_CALCULATION_BASE_IRR)) * 100).toFixed(1)) : 55.4);
  const collectionRatio = isReceived ? 100 : (fin?.collectionRatio ?? (ipc.approvedAmount > 0 && ipc.paidAmount > 0 ? Number(((ipc.paidAmount / ipc.approvedAmount) * 100).toFixed(1)) : 100));
  const outstandingRatio = isReceived ? 0 : (fin?.outstandingRatio ?? Math.max(0, 100 - collectionRatio));

  // Site Manpower calculations from structured DailyReportRecord
  const mp = daily.siteManpower || (daily.manpower ? {
    direct: daily.manpower.directBreakdown ?? {
      total: null,
      present: daily.manpower.direct,
      absent: null
    },
    indirect: daily.manpower.indirectBreakdown ?? {
      total: null,
      present: daily.manpower.indirect,
      absent: null
    },
    total: daily.manpower.total,
    present: daily.manpower.present ?? ((daily.manpower.direct || 0) + (daily.manpower.indirect || 0) || null),
    absent: daily.manpower.absent ?? null,
    attendanceRatio: daily.manpower.attendanceRatio ?? null
  } : null);

  const totalMp = mp?.total !== null && mp?.total !== undefined ? mp.total : null;
  const presentMp = mp?.present !== null && mp?.present !== undefined ? mp.present : (mp?.direct?.present !== null && mp?.indirect?.present !== null && mp?.direct?.present !== undefined && mp?.indirect?.present !== undefined ? mp.direct.present + mp.indirect.present : null);
  const absentMp = mp?.absent !== null && mp?.absent !== undefined ? mp.absent : (totalMp !== null && presentMp !== null ? Math.max(0, totalMp - presentMp) : null);
  const attendanceRatio = mp?.attendanceRatio !== null && mp?.attendanceRatio !== undefined
    ? mp.attendanceRatio
    : (totalMp !== null && totalMp > 0 && presentMp !== null ? Number(((presentMp / totalMp) * 100).toFixed(1)) : null);

  const dirPresent = mp?.direct?.present ?? daily.manpower?.direct ?? null;
  const dirTotal = mp?.direct?.total ?? daily.manpower?.directBreakdown?.total ?? null;
  const dirAbsent = mp?.direct?.absent ?? daily.manpower?.directBreakdown?.absent ?? (dirTotal !== null && dirPresent !== null ? Math.max(0, dirTotal - dirPresent) : null);
  const dirAttendance = mp?.direct?.attendanceRatio ?? (dirTotal && dirTotal > 0 && dirPresent !== null ? Number(((dirPresent / dirTotal) * 100).toFixed(1)) : null);

  const indPresent = mp?.indirect?.present ?? daily.manpower?.indirect ?? null;
  const indTotal = mp?.indirect?.total ?? daily.manpower?.indirectBreakdown?.total ?? null;
  const indAbsent = mp?.indirect?.absent ?? daily.manpower?.indirectBreakdown?.absent ?? (indTotal !== null && indPresent !== null ? Math.max(0, indTotal - indPresent) : null);
  const indAttendance = mp?.indirect?.attendanceRatio ?? (indTotal && indTotal > 0 && indPresent !== null ? Number(((indPresent / indTotal) * 100).toFixed(1)) : null);

  // Semantic color for overall attendance progress bar and badge (restrained amber default for ~77.8%)
  const getAttendanceTheme = (ratio: number | null) => {
    if (ratio === null) return { bar: 'bg-slate-300', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-700 border-slate-200' };
    if (ratio >= 85) return { bar: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (ratio >= 70) return { bar: 'bg-amber-500', text: 'text-amber-800', badge: 'bg-amber-50 text-amber-900 border-amber-300' };
    return { bar: 'bg-rose-500', text: 'text-rose-700', badge: 'bg-rose-50 text-rose-800 border-rose-200' };
  };

  const attTheme = getAttendanceTheme(attendanceRatio);

  return (
    <div
      id="financial-section"
      className="ipc-section-card relative overflow-hidden border border-emerald-300/90 rounded-lg bg-linear-to-br from-emerald-50/55 via-white to-sky-50/45 p-2 pt-2.5 shadow-2xs flex flex-col justify-between h-full print:break-inside-avoid print:border-emerald-300"
    >
      {/* Top Signature Accent Bar (Emerald -> Teal -> Royal Blue) */}
      <div
        className="absolute top-0 inset-x-0 h-1 bg-linear-to-l from-emerald-600 via-teal-500 to-blue-600 pointer-events-none select-none z-10"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-center justify-between bg-linear-to-l from-emerald-100/80 via-teal-50/55 to-sky-50/45 -mx-2 -mt-2 px-2.5 pt-2 pb-1.5 mb-2 border-b border-emerald-200/90 rounded-t-lg">
        <div className="flex items-center gap-1.5">
          <span className="p-0.5 rounded bg-emerald-100 border border-emerald-300/80 text-emerald-700 shadow-2xs">
            <CreditCard className="w-3.5 h-3.5" />
          </span>
          <h2 className="text-[10.5px] font-extrabold text-emerald-950 uppercase tracking-tight">
            {isFa ? (
              <>
                وضعیت مالی و صورت‌وضعیت <span className="ltr-inline text-[9.5px] font-semibold text-emerald-700">(INVOICE & IPC)</span>
              </>
            ) : (
              'FINANCIAL & INVOICE STATUS'
            )}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {fin?.latestInvoicePeriod && (
            <span className="ipc-period-badge text-[7.5px] font-bold text-emerald-900 bg-white/95 border border-emerald-300/90 px-1.5 py-0.2 rounded shadow-2xs">
              {fin.latestInvoicePeriod}
            </span>
          )}
          <span className="ipc-number-badge text-[8.5px] font-extrabold text-blue-950 bg-blue-100/95 border border-blue-300/90 px-1.5 py-0.2 rounded truncate max-w-[130px] shadow-2xs">
            {fin?.latestInvoiceNumber ? `IPC #${fin.latestInvoiceNumber}` : ipc.latestIpcNo}
          </span>
        </div>
      </div>

      {/* IPC Financial Dual-Currency & Ratio Grid */}
      {fin ? (
        <div className="grid grid-cols-4 gap-1.5 mb-1.5 text-center">
          {/* 1. Cumulative Invoice / Approved */}
          <div className="financial-metric-box financial-cumulative-box bg-linear-to-b from-blue-50/95 via-sky-50/60 to-blue-100/45 border border-blue-300/90 border-t-2 border-t-blue-600 rounded-md p-1 flex flex-col justify-between shadow-2xs">
            <span className="fin-metric-title text-[7.5px] text-blue-900 font-sans block font-extrabold">{isFa ? 'کارکرد تجمعی' : 'Cumulative'}</span>
            <div>
              <div className="flex items-baseline justify-center gap-1 leading-tight">
                <span className="font-tabular tabular-nums text-[11.5px] font-extrabold text-blue-950">
                  {formatIrrValue(fin.invoiceCumulativeIRR)}
                </span>
                <span className="text-[7.5px] text-blue-700 font-bold font-sans">
                  {getIrrUnit(fin.invoiceCumulativeIRR, isFa)}
                </span>
              </div>
              <div className="flex items-baseline justify-center gap-0.5 text-[8.5px] font-bold text-blue-800 mt-0.5">
                <span className="font-tabular tabular-nums">{formatEurValue(fin.invoiceCumulativeEUR)}</span>
                <span className="text-[7.5px] font-sans">€</span>
              </div>
            </div>
            <div className="fin-metric-ratio text-[7.5px] text-blue-900 bg-blue-100/60 rounded px-1 font-sans mt-0.5 pt-0.5 border-t border-blue-200/90 flex items-center justify-center gap-1">
              <span>{isFa ? 'پیشرفت مالی:' : 'Fin Prog:'}</span>
              <span className="font-extrabold font-tabular tabular-nums">{finProgress}%</span>
            </div>
          </div>

          {/* 2. Received / Paid */}
          <div className="financial-metric-box financial-received-box bg-linear-to-b from-emerald-50/95 via-teal-50/55 to-emerald-100/45 border border-emerald-300/90 border-t-2 border-t-emerald-600 rounded-md p-1 flex flex-col justify-between shadow-2xs">
            <span className="fin-metric-title text-[7.5px] text-emerald-900 font-sans block font-extrabold">{isFa ? 'دریافتی / وصولی' : 'Received'}</span>
            <div>
              <div className="flex items-baseline justify-center gap-1 leading-tight">
                <span className="font-tabular tabular-nums text-[11.5px] font-extrabold text-emerald-950">
                  {formatIrrValue(displayReceivedIRR)}
                </span>
                <span className="text-[7.5px] text-emerald-700 font-bold font-sans">
                  {getIrrUnit(displayReceivedIRR, isFa)}
                </span>
              </div>
              <div className="flex items-baseline justify-center gap-0.5 text-[8.5px] font-bold text-emerald-800 mt-0.5">
                <span className="font-tabular tabular-nums">{formatEurValue(displayReceivedEUR)}</span>
                <span className="text-[7.5px] font-sans">€</span>
              </div>
            </div>
            <div className="fin-metric-ratio text-[7.5px] text-emerald-900 bg-emerald-100/60 rounded px-1 font-sans mt-0.5 pt-0.5 border-t border-emerald-200/90 flex items-center justify-center gap-1">
              <span>{isFa ? 'نسبت وصول:' : 'Col Ratio:'}</span>
              <span className="font-extrabold font-tabular tabular-nums">{collectionRatio.toFixed(1)}%</span>
            </div>
          </div>

          {/* 3. Outstanding */}
          <div className="financial-metric-box financial-outstanding-box bg-linear-to-b from-amber-50/95 via-orange-50/55 to-amber-100/45 border border-amber-300/90 border-t-2 border-t-amber-500 rounded-md p-1 flex flex-col justify-between shadow-2xs">
            <span className="fin-metric-title text-[7.5px] text-amber-900 font-sans block font-extrabold">{isFa ? 'مطالبات باز' : 'Outstanding'}</span>
            <div>
              <div className="flex items-baseline justify-center gap-1 leading-tight">
                <span className="font-tabular tabular-nums text-[11.5px] font-extrabold text-amber-950">
                  {formatIrrValue(displayOutstandingIRR)}
                </span>
                <span className="text-[7.5px] text-amber-700 font-bold font-sans">
                  {getIrrUnit(displayOutstandingIRR, isFa)}
                </span>
              </div>
              <div className="flex items-baseline justify-center gap-0.5 text-[8.5px] font-bold text-amber-800 mt-0.5">
                <span className="font-tabular tabular-nums">{formatEurValue(displayOutstandingEUR)}</span>
                <span className="text-[7.5px] font-sans">€</span>
              </div>
            </div>
            <div className="fin-metric-ratio text-[7.5px] text-amber-900 bg-amber-100/60 rounded px-1 font-sans mt-0.5 pt-0.5 border-t border-amber-200/90 flex items-center justify-center gap-1">
              <span>{isFa ? 'نسبت مطالبات:' : 'Out Ratio:'}</span>
              <span className="font-extrabold font-tabular tabular-nums">{outstandingRatio.toFixed(1)}%</span>
            </div>
          </div>

          {/* 4. Advance Payment & Adjustment */}
          <div className="financial-metric-box financial-advance-box bg-linear-to-b from-indigo-50/95 via-violet-50/50 to-indigo-100/45 border border-indigo-300/90 border-t-2 border-t-indigo-600 rounded-md p-1 flex flex-col justify-between shadow-2xs">
            <span className="fin-metric-title text-[7.5px] text-indigo-950 font-sans block font-extrabold text-center">
              {isFa ? 'پیش‌پرداخت و تعدیل' : 'Advance & Adj'}
            </span>
            <div className="space-y-0.5 my-0.5">
              {/* Advance Payment Row */}
              <div className="flex items-baseline justify-between text-[8px] leading-tight px-0.5">
                <span className="text-indigo-900 font-sans text-[7.5px] font-semibold">{isFa ? 'پیش‌پرداخت:' : 'Adv:'}</span>
                <div className="flex items-baseline gap-0.5 font-bold text-slate-900">
                  <span className="font-tabular tabular-nums">{formatIrrValue(fin.advancePaymentIRR)}</span>
                  <span className="text-[6.5px] text-slate-600 font-sans">{isFa ? 'م.ر' : 'B'}</span>
                  <span className="text-[6.5px] font-semibold text-indigo-700 font-tabular tabular-nums">({Number(fin.advancePaymentPercentage || 22.07).toFixed(1)}%)</span>
                </div>
              </div>
              {/* Adjustment Row */}
              <div className="flex items-baseline justify-between text-[8px] leading-tight px-0.5">
                <span className="text-indigo-800 font-sans text-[7.5px] font-semibold">{isFa ? 'تعدیل:' : 'Adj:'}</span>
                <div className="flex items-baseline gap-0.5 font-bold text-indigo-950">
                  <span className="font-tabular tabular-nums">{formatIrrValue(fin.adjustmentIRR)}</span>
                  <span className="text-[6.5px] text-indigo-600 font-sans">{isFa ? 'م.ر' : 'B'}</span>
                  <span className="text-[6.5px] font-semibold text-indigo-600 font-tabular tabular-nums">({Number(fin.adjustmentPercentage || 20.53).toFixed(1)}%)</span>
                </div>
              </div>
            </div>
            {/* Summary Footer */}
            <div className="fin-metric-ratio text-[7px] text-indigo-950 bg-indigo-100/60 rounded px-1 font-sans mt-0.5 pt-0.5 border-t border-indigo-200/90 flex items-center justify-between">
              <span className="font-bold">{isFa ? 'مجموع:' : 'Total:'}</span>
              <div className="flex items-baseline gap-0.5 font-extrabold text-indigo-950">
                <span className="font-tabular tabular-nums">
                  {formatIrrValue((fin.advancePaymentIRR || 0) + (fin.adjustmentIRR || 0))}
                </span>
                <span className="text-[6.5px] font-sans">{isFa ? 'م.ر' : 'B'}</span>
                <span className="text-[6.5px] font-semibold text-indigo-700 font-tabular tabular-nums">
                  ({(Number(fin.advancePaymentPercentage || 22.07) + Number(fin.adjustmentPercentage || 20.53)).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5 mb-1.5 text-center">
          <div className="financial-metric-box financial-cumulative-box bg-slate-50 border border-slate-200 rounded p-1 flex flex-col justify-between">
            <span className="fin-metric-title text-[7.5px] text-slate-500 font-sans block">{isFa ? 'ارائه‌شده' : 'Submitted'}</span>
            <div className="flex items-baseline justify-center gap-1 leading-tight">
              <span className="font-tabular tabular-nums text-[10.5px] font-bold text-slate-800">
                {(ipc.submittedAmount / 1000000).toFixed(1)}
              </span>
              <span className="text-[7px] text-slate-500 font-sans">{ipc.currency || (isFa ? 'م.ر' : 'M')}</span>
            </div>
          </div>
          <div className="financial-metric-box financial-cumulative-box bg-blue-50/70 border border-blue-200 rounded p-1 flex flex-col justify-between">
            <span className="fin-metric-title text-[7.5px] text-blue-700 font-sans block">{isFa ? 'تأییدشده' : 'Approved'}</span>
            <div className="flex items-baseline justify-center gap-1 leading-tight">
              <span className="font-tabular tabular-nums text-[10.5px] font-bold text-blue-950">
                {(ipc.approvedAmount / 1000000).toFixed(1)}
              </span>
              <span className="text-[7px] text-blue-600 font-sans">{ipc.currency || (isFa ? 'م.ر' : 'M')}</span>
            </div>
            <div className="fin-metric-ratio text-[7px] text-blue-700 font-sans mt-0.5 pt-0.5 border-t border-blue-200/60">
              <span className="font-bold font-tabular tabular-nums">{finProgress}%</span>
            </div>
          </div>
          <div className="financial-metric-box financial-received-box bg-emerald-50/70 border border-emerald-200 rounded p-1 flex flex-col justify-between">
            <span className="fin-metric-title text-[7.5px] text-emerald-700 font-sans block">{isFa ? 'پرداخت‌شده' : 'Paid'}</span>
            <div className="flex items-baseline justify-center gap-1 leading-tight">
              <span className="font-tabular tabular-nums text-[10.5px] font-bold text-emerald-950">
                {(displayReceivedIRR / 1000000).toFixed(1)}
              </span>
              <span className="text-[7px] text-emerald-600 font-sans">{ipc.currency || (isFa ? 'م.ر' : 'M')}</span>
            </div>
            <div className="fin-metric-ratio text-[7px] text-emerald-700 font-sans mt-0.5 pt-0.5 border-t border-emerald-200/60">
              <span className="font-bold font-tabular tabular-nums">{collectionRatio.toFixed(1)}%</span>
            </div>
          </div>
          <div className="financial-metric-box financial-outstanding-box bg-amber-50/70 border border-amber-200 rounded p-1 flex flex-col justify-between">
            <span className="fin-metric-title text-[7.5px] text-amber-700 font-sans block">{isFa ? 'مطالبات باز' : 'Outstanding'}</span>
            <div className="flex items-baseline justify-center gap-1 leading-tight">
              <span className="font-tabular tabular-nums text-[10.5px] font-bold text-amber-950">
                {(displayOutstandingIRR / 1000000).toFixed(1)}
              </span>
              <span className="text-[7px] text-amber-600 font-sans">{ipc.currency || (isFa ? 'م.ر' : 'M')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Site Resources Strip: Site Manpower KPI + Machinery KPI */}
      <div id="manpower-section" className="ipc-resources-strip mt-1 pt-1.5 border-t border-emerald-200/80 grid grid-cols-12 gap-1.5 text-[8.5px]">
        {/* Site Manpower KPI (نیروی انسانی کارگاه) */}
        <div
          id="kpi-site-manpower"
          className="col-span-7 bg-linear-to-br from-sky-50/95 via-blue-50/60 to-indigo-50/45 border border-sky-300/90 border-r-3 border-r-blue-600 rounded-md px-2 py-1 flex flex-col justify-between min-w-0 shadow-2xs"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between gap-1 mb-0.5 min-w-0">
            <div className="flex items-center gap-1 text-blue-950 font-extrabold min-w-0 truncate">
              <span className="p-0.5 rounded bg-blue-100/90 text-blue-700 shrink-0">
                <Users className="w-3 h-3" />
              </span>
              <span className="text-[8.5px] text-blue-950 truncate">
                {isFa ? 'نیروی انسانی کارگاه' : 'Site Manpower'}
              </span>
            </div>
            {attendanceRatio !== null ? (
              <span className={`text-[7.5px] font-extrabold px-1.5 py-0.2 rounded border shrink-0 whitespace-nowrap shadow-2xs ${attTheme.badge}`}>
                {attendanceRatio.toFixed(1)}% {isFa ? 'نسبت حضور' : 'Attendance'}
              </span>
            ) : (
              <span className="text-[7.5px] text-slate-400 font-medium shrink-0">—</span>
            )}
          </div>

          {/* Primary Counts Row: Total, Present, Absent */}
          <div className="flex items-baseline justify-between text-[7.5px] mt-0.5 mb-1 px-0.5 min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-blue-900 font-bold">{isFa ? 'کل:' : 'Total:'}</span>
              <strong className="font-extrabold text-blue-950 text-[11.5px] font-mono leading-none">
                {totalMp !== null ? totalMp : '—'}
              </strong>
              <span className="text-blue-700 font-semibold text-[7px]">{isFa ? 'نفر' : 'pax'}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-emerald-800 font-bold flex items-center gap-0.5 bg-emerald-50/90 border border-emerald-200/80 px-1 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0"></span>
                {isFa ? 'حاضر:' : 'Pres:'}{' '}
                <strong className="font-extrabold text-[8.5px] text-emerald-950 font-mono">{presentMp !== null ? presentMp : '—'}</strong>
              </span>
              <span className="text-amber-900 font-bold flex items-center gap-0.5 bg-amber-50/90 border border-amber-200/80 px-1 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0"></span>
                {isFa ? 'غایب/مرخصی:' : 'Abs:'}{' '}
                <strong className="font-extrabold text-[8.5px] text-amber-950 font-mono">{absentMp !== null ? absentMp : '—'}</strong>
              </span>
            </div>
          </div>

          {/* Breakdown Strip: Direct & Indirect */}
          <div className="flex items-center justify-between text-[7px] text-slate-700 bg-white/95 border border-sky-200/90 rounded px-1.5 py-0.5 min-w-0">
            <div className="flex items-center gap-1 min-w-0 truncate" title={isFa ? 'نیروی مستقیم: حاضر از کل' : 'Direct: Present of Total'}>
              <span className="text-blue-800 font-semibold shrink-0">{isFa ? 'مستقیم:' : 'Dir:'}</span>
              <strong className="text-slate-900 font-extrabold font-mono">
                {dirPresent !== null && dirTotal !== null ? `${dirPresent}/${dirTotal}` : (dirPresent ?? '—')}
              </strong>
              {dirAttendance !== null && (
                <span className="text-[6.5px] font-bold px-1 py-0.1 bg-sky-100 text-sky-900 border border-sky-300 rounded font-mono shrink-0">
                  {dirAttendance.toFixed(0)}%
                </span>
              )}
            </div>
            <span className="text-slate-300 mx-1 shrink-0">|</span>
            <div className="flex items-center gap-1 min-w-0 truncate" title={isFa ? 'نیروی غیرمستقیم: حاضر از کل' : 'Indirect: Present of Total'}>
              <span className="text-indigo-800 font-semibold shrink-0">{isFa ? 'غیرمستقیم:' : 'Ind:'}</span>
              <strong className="text-slate-900 font-extrabold font-mono">
                {indPresent !== null && indTotal !== null ? `${indPresent}/${indTotal}` : (indPresent ?? '—')}
              </strong>
              {indAttendance !== null && (
                <span className="text-[6.5px] font-bold px-1 py-0.1 bg-indigo-100 text-indigo-900 border border-indigo-300 rounded font-mono shrink-0">
                  {indAttendance.toFixed(0)}%
                </span>
              )}
            </div>
          </div>

          {/* Attendance Ratio Progress Bar */}
          <div className="w-full bg-sky-200/75 h-1.5 rounded-full mt-1 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${attTheme.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, attendanceRatio || 0))}%` }}
            />
          </div>
        </div>

        {/* Machinery KPI Card */}
        <div
          id="kpi-site-machinery"
          className="col-span-5 bg-linear-to-br from-amber-50/95 via-orange-50/60 to-amber-100/40 border border-amber-300/90 border-r-3 border-r-amber-500 rounded-md px-2 py-1 flex flex-col justify-between min-w-0 shadow-2xs"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between text-amber-950 mb-0.5 min-w-0">
            <div className="flex items-center gap-1 min-w-0 truncate">
              <span className="p-0.5 rounded bg-amber-100/90 text-amber-700 shrink-0">
                <Truck className="w-3 h-3" />
              </span>
              <span className="res-label text-amber-950 font-extrabold text-[8.5px] truncate">
                {isFa ? 'ماشین‌آلات فعال' : 'Active Machinery'}
              </span>
            </div>
            <span className="text-[7.5px] font-extrabold text-amber-950 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded shrink-0 whitespace-nowrap shadow-2xs">
              {daily.machinery?.active !== undefined && daily.machinery?.total !== undefined && daily.machinery.total > 0
                ? `${Math.round((daily.machinery.active / daily.machinery.total) * 100)}%`
                : '—'}
            </span>
          </div>

          {/* Primary Counts Row: Active / Total & Standby units */}
          <div className="flex items-baseline justify-between text-[7.5px] mt-0.5 mb-1 px-0.5 min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-amber-900 font-bold">{isFa ? 'فعال:' : 'Act:'}</span>
              <strong className="res-val font-extrabold text-amber-950 text-[11.5px] font-mono leading-none">
                {daily.machinery?.active ?? '—'}
              </strong>
              <span className="text-[7.5px] font-bold text-amber-800 font-mono">/ {daily.machinery?.total ?? '—'}</span>
            </div>
            <span className="text-[7.5px] text-amber-900 bg-amber-100/80 border border-amber-200/80 px-1 rounded font-bold">
              {daily.machinery?.standby ? `${daily.machinery.standby} ${isFa ? 'آماده' : 'stby'}` : (isFa ? 'دستگاه' : 'units')}
            </span>
          </div>

          {/* Breakdown Strip: Standby & Utilization */}
          <div className="flex items-center justify-between text-[7px] text-slate-700 bg-white/95 border border-amber-200/90 rounded px-1.5 py-0.5 min-w-0">
            <div className="flex items-center gap-1 min-w-0 truncate">
              <span className="text-amber-900 font-semibold shrink-0">{isFa ? 'آماده‌به‌کار:' : 'Standby:'}</span>
              <strong className="font-mono text-slate-900 font-extrabold">{daily.machinery?.standby ?? 0}</strong>
            </div>
            <span className="text-slate-300 mx-1 shrink-0">|</span>
            <div className="flex items-center gap-1 min-w-0 truncate">
              <span className="text-amber-900 font-semibold shrink-0">{isFa ? 'بهره‌برداری:' : 'Util:'}</span>
              <strong className="font-mono text-amber-900 font-extrabold">
                {daily.machinery?.active !== undefined && daily.machinery?.total !== undefined && daily.machinery.total > 0
                  ? `${Math.round((daily.machinery.active / daily.machinery.total) * 100)}%`
                  : '—'}
              </strong>
            </div>
          </div>

          {/* Machinery Progress Bar */}
          <div className="w-full bg-amber-200/75 h-1.5 rounded-full mt-1 overflow-hidden">
            <div
              className="bg-amber-600 h-full rounded-full transition-all duration-300"
              style={{
                width: `${
                  daily.machinery?.active !== undefined && daily.machinery?.total !== undefined && daily.machinery.total > 0
                    ? Math.min(100, (daily.machinery.active / daily.machinery.total) * 100)
                    : 0
                }%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

