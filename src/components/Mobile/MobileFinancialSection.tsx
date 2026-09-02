import React from 'react';
import { IpcRecord, DailyReportRecord, Language } from '../../types';
import { CreditCard, Users, Truck } from 'lucide-react';

interface MobileFinancialSectionProps {
  ipc: IpcRecord;
  daily: DailyReportRecord;
  lang: Language;
}

function formatIrr(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  if (Math.abs(amount) >= 1_000_000_000_000) {
    return `${(amount / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (Math.abs(amount) >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  return amount.toLocaleString();
}

function formatEur(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)}M €`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}k €`;
  }
  return `${amount.toLocaleString()} €`;
}

export const MobileFinancialSection: React.FC<MobileFinancialSectionProps> = ({ ipc, daily, lang }) => {
  const isFa = lang === 'fa';
  const fin = ipc.financialSummary;

  const finProgress = fin?.financialProgress ?? (ipc.approvedAmount > 0 ? Number(((ipc.approvedAmount / 4230000000000) * 100).toFixed(1)) : 69.9);
  const collectionRatio = fin?.collectionRatio ?? (ipc.approvedAmount > 0 && ipc.paidAmount > 0 ? Number(((ipc.paidAmount / ipc.approvedAmount) * 100).toFixed(1)) : 92.1);
  const outstandingRatio = fin?.outstandingRatio ?? (100 - collectionRatio);

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
  const presentMp = mp?.present !== null && mp?.present !== undefined ? mp.present : null;
  const absentMp = mp?.absent !== null && mp?.absent !== undefined ? mp.absent : (totalMp !== null && presentMp !== null ? Math.max(0, totalMp - presentMp) : null);
  const attendanceRatio = mp?.attendanceRatio !== null && mp?.attendanceRatio !== undefined
    ? mp.attendanceRatio
    : (totalMp !== null && totalMp > 0 && presentMp !== null ? Number(((presentMp / totalMp) * 100).toFixed(1)) : null);

  const dirPresent = mp?.direct?.present ?? daily.manpower?.direct ?? null;
  const dirTotal = mp?.direct?.total ?? daily.manpower?.directBreakdown?.total ?? null;
  const indPresent = mp?.indirect?.present ?? daily.manpower?.indirect ?? null;
  const indTotal = mp?.indirect?.total ?? daily.manpower?.indirectBreakdown?.total ?? null;

  const getAttendanceTheme = (ratio: number | null) => {
    if (ratio === null) return { bar: 'bg-slate-300', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-700 border-slate-200' };
    if (ratio >= 85) return { bar: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (ratio >= 70) return { bar: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-800 border-amber-200' };
    return { bar: 'bg-rose-500', text: 'text-rose-700', badge: 'bg-rose-50 text-rose-800 border-rose-200' };
  };

  const attTheme = getAttendanceTheme(attendanceRatio);

  return (
    <div id="mobile-financial-section" className="mobile-financial-card bg-white border border-slate-200 rounded-xl p-3 shadow-xs mb-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">
            {isFa ? 'وضعیت مالی و صورت‌وضعیت‌ها' : 'FINANCIAL & IPC STATUS'}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {fin?.latestInvoicePeriod && (
            <span className="text-[8px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
              {fin.latestInvoicePeriod}
            </span>
          )}
          <span className="text-[9px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-mono truncate max-w-[120px]">
            {fin?.latestInvoiceNumber ? `IPC #${fin.latestInvoiceNumber}` : ipc.latestIpcNo}
          </span>
        </div>
      </div>

      {/* Primary Financial Metric Cards (2x2 Grid) */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* 1. Cumulative */}
        <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-2 flex flex-col justify-between">
          <span className="text-[8.5px] text-blue-800 font-semibold">{isFa ? 'کارکرد تجمعی' : 'Cumulative'}</span>
          <div className="my-1">
            <div className="text-[12px] font-bold text-blue-950 font-mono">
              {formatIrr(fin?.invoiceCumulativeIRR || ipc.approvedAmount)} <span className="text-[7.5px] font-sans text-blue-700">ریال</span>
            </div>
            <div className="text-[9.5px] font-medium text-blue-800 font-mono">
              {formatEur(fin?.invoiceCumulativeEUR || (ipc.approvedAmount / 556286))}
            </div>
          </div>
          <div className="text-[8px] text-blue-700 pt-1 border-t border-blue-200/50 flex items-center justify-between">
            <span>{isFa ? 'پیشرفت مالی:' : 'Prog:'}</span>
            <span className="font-bold font-mono">{finProgress}%</span>
          </div>
        </div>

        {/* 2. Received */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-2 flex flex-col justify-between">
          <span className="text-[8.5px] text-emerald-800 font-semibold">{isFa ? 'دریافتی / وصولی' : 'Received'}</span>
          <div className="my-1">
            <div className="text-[12px] font-bold text-emerald-950 font-mono">
              {formatIrr(fin?.receivedIRR || ipc.paidAmount)} <span className="text-[7.5px] font-sans text-emerald-700">ریال</span>
            </div>
            <div className="text-[9.5px] font-medium text-emerald-800 font-mono">
              {formatEur(fin?.receivedEUR || (ipc.paidAmount / 556286))}
            </div>
          </div>
          <div className="text-[8px] text-emerald-700 pt-1 border-t border-emerald-200/50 flex items-center justify-between">
            <span>{isFa ? 'نسبت وصول:' : 'Col Ratio:'}</span>
            <span className="font-bold font-mono">{collectionRatio}%</span>
          </div>
        </div>

        {/* 3. Outstanding */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-2 flex flex-col justify-between">
          <span className="text-[8.5px] text-amber-800 font-semibold">{isFa ? 'مطالبات باز' : 'Outstanding'}</span>
          <div className="my-1">
            <div className="text-[12px] font-bold text-amber-950 font-mono">
              {formatIrr(fin?.outstandingIRR || Math.max(0, ipc.approvedAmount - ipc.paidAmount))} <span className="text-[7.5px] font-sans text-amber-700">ریال</span>
            </div>
            <div className="text-[9.5px] font-medium text-amber-800 font-mono">
              {formatEur(fin?.outstandingEUR || Math.max(0, (ipc.approvedAmount - ipc.paidAmount) / 556286))}
            </div>
          </div>
          <div className="text-[8px] text-amber-700 pt-1 border-t border-amber-200/50 flex items-center justify-between">
            <span>{isFa ? 'نسبت مطالبات:' : 'Out Ratio:'}</span>
            <span className="font-bold font-mono">{outstandingRatio.toFixed(1)}%</span>
          </div>
        </div>

        {/* 4. Advance & Adjustment */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex flex-col justify-between">
          <span className="text-[8.5px] text-slate-700 font-semibold">{isFa ? 'پیش‌پرداخت و تعدیل' : 'Advance & Adj'}</span>
          <div className="my-1 space-y-0.5">
            <div className="text-[9.5px] font-bold text-slate-800 font-mono flex items-center justify-between">
              <span className="text-[7.5px] text-slate-500 font-sans">{isFa ? 'پیش‌پرداخت:' : 'Adv:'}</span>
              <span>{formatIrr(fin?.advancePaymentIRR || 0)}</span>
            </div>
            <div className="text-[9.5px] font-bold text-indigo-900 font-mono flex items-center justify-between">
              <span className="text-[7.5px] text-slate-500 font-sans">{isFa ? 'تعدیل:' : 'Adj:'}</span>
              <span>{formatIrr(fin?.adjustmentIRR || 0)}</span>
            </div>
          </div>
          <div className="text-[7.5px] text-slate-500 pt-1 border-t border-slate-200/70 truncate">
            {isFa ? 'نرخ تسعیر: ۱€ = ۵۵۶،۲۸۶ ریال' : 'Rate: 1€ = 556,286 IRR'}
          </div>
        </div>
      </div>

      {/* Operational Site Metrics: Site Manpower KPI Card & Machinery */}
      <div className="mt-2 pt-2 border-t border-slate-100 space-y-2">
        {/* Site Manpower Card */}
        <div id="mobile-kpi-site-manpower" className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold">
              <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-[9.5px] text-slate-800">
                {isFa ? 'نیروی انسانی کارگاه' : 'Site Manpower'}
              </span>
            </div>
            {attendanceRatio !== null ? (
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${attTheme.badge}`}>
                {attendanceRatio}% {isFa ? 'نسبت حضور' : 'Attendance'}
              </span>
            ) : (
              <span className="text-[8px] text-slate-400 font-medium">—</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-baseline gap-1">
              <span className="text-slate-500 text-[8px]">{isFa ? 'کل:' : 'Total:'}</span>
              <span className="font-extrabold text-slate-950 text-[14px] font-mono leading-none">
                {totalMp !== null ? totalMp : '—'}
              </span>
              <span className="text-slate-400 text-[7.5px]">{isFa ? 'نفر' : 'pax'}</span>
            </div>

            <div className="flex items-center gap-2 text-[8px]">
              <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                {isFa ? 'حاضر:' : 'Pres:'}{' '}
                <strong className="font-bold text-[9px] text-emerald-900">{presentMp !== null ? presentMp : '—'}</strong>
              </span>
              <span className="text-rose-700 font-semibold flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                {isFa ? 'غایب:' : 'Abs:'}{' '}
                <strong className="font-bold text-[9px] text-rose-900">{absentMp !== null ? absentMp : '—'}</strong>
              </span>
            </div>
          </div>

          {/* Breakdown chips */}
          <div className="grid grid-cols-2 gap-1.5 text-[8px] text-slate-600 bg-white border border-slate-200 p-1 rounded mb-1.5">
            <div className="flex items-center justify-between">
              <span>{isFa ? 'مستقیم (حاضر/کل):' : 'Direct (Pres/Tot):'}</span>
              <strong className="text-slate-900 font-bold font-mono">
                {dirPresent !== null ? (dirTotal !== null ? `${dirPresent} / ${dirTotal}` : dirPresent) : '—'}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span>{isFa ? 'غیرمستقیم (حاضر/کل):' : 'Indirect (Pres/Tot):'}</span>
              <strong className="text-slate-900 font-bold font-mono">
                {indPresent !== null ? (indTotal !== null ? `${indPresent} / ${indTotal}` : indPresent) : '—'}
              </strong>
            </div>
          </div>

          {/* Attendance progress bar */}
          <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${attTheme.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, attendanceRatio || 0))}%` }}
            />
          </div>
        </div>

        {/* Machinery Row */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between text-[9px]">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-semibold text-slate-800">{isFa ? 'ماشین‌آلات کارگاه' : 'Site Machinery'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 font-mono text-[11px]">
              {daily.machinery?.active ?? '—'} <span className="text-[8px] font-normal text-slate-500">/ {daily.machinery?.total ?? '—'}</span>
            </span>
            {daily.machinery?.active !== undefined && daily.machinery?.total !== undefined && daily.machinery.total > 0 && (
              <span className="text-[7.5px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1 rounded">
                {Math.round((daily.machinery.active / daily.machinery.total) * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

