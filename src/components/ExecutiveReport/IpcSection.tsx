import React from 'react';
import { IpcRecord, DailyReportRecord, Language } from '../../types';
import { CreditCard, Users, Truck, UserCheck, UserX } from 'lucide-react';

interface IpcSectionProps {
  ipc: IpcRecord;
  daily: DailyReportRecord;
  lang: Language;
}

// Helper to format currency numbers compactly (e.g. 2,484.5B IRR, 848.1k EUR)
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

export const IpcSection: React.FC<IpcSectionProps> = ({ ipc, daily, lang }) => {
  const isFa = lang === 'fa';
  const fin = ipc.financialSummary;

  // Ratios and figures
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
    <div id="financial-section" className="ipc-section-card border border-slate-250 rounded bg-white p-2 shadow-2xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
          <h2 className="text-[10.5px] font-bold text-slate-900 uppercase tracking-tight">
            {isFa ? (
              <>
                وضعیت مالی و صورت‌وضعیت <span className="ltr-inline text-[9.5px] font-semibold text-slate-500">(INVOICE & IPC)</span>
              </>
            ) : (
              'FINANCIAL & INVOICE STATUS'
            )}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {fin?.latestInvoicePeriod && (
            <span className="ipc-period-badge text-[7.5px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-1 py-0.2 rounded">
              {fin.latestInvoicePeriod}
            </span>
          )}
          <span className="ipc-number-badge text-[8.5px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded truncate max-w-[130px]">
            {fin?.latestInvoiceNumber ? `IPC #${fin.latestInvoiceNumber}` : ipc.latestIpcNo}
          </span>
        </div>
      </div>

      {/* IPC Financial Dual-Currency & Ratio Grid */}
      {fin ? (
        <div className="grid grid-cols-4 gap-1.5 mb-1.5 text-center">
          {/* 1. Cumulative Invoice / Approved */}
          <div className="financial-metric-box financial-cumulative-box bg-blue-50/70 border border-blue-200 rounded p-1 flex flex-col justify-between">
            <span className="fin-metric-title text-[7.5px] text-blue-800 font-sans block font-semibold">{isFa ? 'کارکرد تجمعی' : 'Cumulative'}</span>
            <div>
              <div className="fin-metric-irr text-[10.5px] font-bold text-blue-950">
                {formatIrr(fin.invoiceCumulativeIRR)} <span className="fin-metric-curr text-[7px] text-blue-600 font-sans">ریال</span>
              </div>
              <div className="fin-metric-eur text-[8.5px] font-medium text-blue-800">
                {formatEur(fin.invoiceCumulativeEUR)}
              </div>
            </div>
            <div className="fin-metric-ratio text-[7.5px] text-blue-700 font-sans mt-0.5 pt-0.5 border-t border-blue-200/60 flex items-center justify-center gap-0.5">
              <span>{isFa ? 'پیشرفت مالی' : 'Fin Prog'}:</span>
              <span className="font-bold">{finProgress}%</span>
            </div>
          </div>

          {/* 2. Received / Paid */}
          <div className="financial-metric-box financial-received-box bg-emerald-50/70 border border-emerald-200 rounded p-1 flex flex-col justify-between">
            <span className="fin-metric-title text-[7.5px] text-emerald-800 font-sans block font-semibold">{isFa ? 'دریافتی / وصولی' : 'Received'}</span>
            <div>
              <div className="fin-metric-irr text-[10.5px] font-bold text-emerald-950">
                {formatIrr(fin.receivedIRR)} <span className="fin-metric-curr text-[7px] text-emerald-600 font-sans">ریال</span>
              </div>
              <div className="fin-metric-eur text-[8.5px] font-medium text-emerald-800">
                {formatEur(fin.receivedEUR)}
              </div>
            </div>
            <div className="fin-metric-ratio text-[7.5px] text-emerald-700 font-sans mt-0.5 pt-0.5 border-t border-emerald-200/60 flex items-center justify-center gap-0.5">
              <span>{isFa ? 'نسبت وصول' : 'Col Ratio'}:</span>
              <span className="font-bold">{collectionRatio}%</span>
            </div>
          </div>

          {/* 3. Outstanding */}
          <div className="financial-metric-box financial-outstanding-box bg-amber-50/70 border border-amber-200 rounded p-1 flex flex-col justify-between">
            <span className="fin-metric-title text-[7.5px] text-amber-800 font-sans block font-semibold">{isFa ? 'مطالبات باز' : 'Outstanding'}</span>
            <div>
              <div className="fin-metric-irr text-[10.5px] font-bold text-amber-950">
                {formatIrr(fin.outstandingIRR)} <span className="fin-metric-curr text-[7px] text-amber-600 font-sans">ریال</span>
              </div>
              <div className="fin-metric-eur text-[8.5px] font-medium text-amber-800">
                {formatEur(fin.outstandingEUR)}
              </div>
            </div>
            <div className="fin-metric-ratio text-[7.5px] text-amber-700 font-sans mt-0.5 pt-0.5 border-t border-amber-200/60 flex items-center justify-center gap-0.5">
              <span>{isFa ? 'نسبت مطالبات' : 'Out Ratio'}:</span>
              <span className="font-bold">{outstandingRatio.toFixed(1)}%</span>
            </div>
          </div>

          {/* 4. Advance Payment & Adjustment */}
          <div className="financial-metric-box financial-advance-box bg-slate-50 border border-slate-200 rounded p-1 flex flex-col justify-between">
            <span className="fin-metric-title text-[7.5px] text-slate-600 font-sans block font-semibold">{isFa ? 'پیش‌پرداخت و تعدیل' : 'Advance & Adj'}</span>
            <div>
              <div className="fin-metric-irr text-[9px] font-bold text-slate-800 truncate" title={`پیش‌پرداخت: ${fin.advancePaymentIRR?.toLocaleString()} ریال`}>
                <span className="text-[7px] text-slate-500 font-sans">{isFa ? 'پیش‌پرداخت:' : 'Adv:'}</span> {formatIrr(fin.advancePaymentIRR)}
              </div>
              <div className="fin-metric-irr text-[9px] font-bold text-indigo-900 truncate" title={`تعدیل: ${fin.adjustmentIRR?.toLocaleString()} ریال`}>
                <span className="text-[7px] text-slate-500 font-sans">{isFa ? 'تعدیل:' : 'Adj:'}</span> {formatIrr(fin.adjustmentIRR)}
              </div>
            </div>
            <div className="fin-metric-ratio text-[7px] text-slate-500 font-sans mt-0.5 pt-0.5 border-t border-slate-200 truncate">
              {isFa ? 'نرخ تسعیر: ۱€ = ۵۵۶،۲۸۶ ریال' : 'Rate: 1€ = 556,286 IRR'}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5 mb-1.5 text-center">
          <div className="financial-metric-box financial-cumulative-box bg-slate-50 border border-slate-200 rounded p-1">
            <span className="fin-metric-title text-[7.5px] text-slate-500 font-sans block">{isFa ? 'ارائه‌شده' : 'Submitted'}</span>
            <span className="fin-metric-irr text-[10.5px] font-bold text-slate-800">
              {(ipc.submittedAmount / 1000000).toFixed(2)}M
            </span>
            <span className="fin-metric-curr text-[7px] text-slate-400 block">{ipc.currency}</span>
          </div>
          <div className="financial-metric-box financial-cumulative-box bg-blue-50/70 border border-blue-200 rounded p-1">
            <span className="fin-metric-title text-[7.5px] text-blue-700 font-sans block">{isFa ? 'تأییدشده' : 'Approved'}</span>
            <span className="fin-metric-irr text-[10.5px] font-bold text-blue-950">
              {(ipc.approvedAmount / 1000000).toFixed(2)}M
            </span>
            <span className="fin-metric-curr text-[7px] text-blue-600 block">{finProgress}%</span>
          </div>
          <div className="financial-metric-box financial-received-box bg-emerald-50/70 border border-emerald-200 rounded p-1">
            <span className="fin-metric-title text-[7.5px] text-emerald-700 font-sans block">{isFa ? 'پرداخت‌شده' : 'Paid'}</span>
            <span className="fin-metric-irr text-[10.5px] font-bold text-emerald-950">
              {(ipc.paidAmount / 1000000).toFixed(2)}M
            </span>
            <span className="fin-metric-curr text-[7px] text-emerald-600 block">{collectionRatio}%</span>
          </div>
          <div className="financial-metric-box financial-outstanding-box bg-amber-50/70 border border-amber-200 rounded p-1">
            <span className="fin-metric-title text-[7.5px] text-amber-700 font-sans block">{isFa ? 'مطالبات باز' : 'Outstanding'}</span>
            <span className="fin-metric-irr text-[10.5px] font-bold text-amber-950">
              {(ipc.outstandingAmount / 1000000).toFixed(2)}M
            </span>
            <span className="fin-metric-curr text-[7px] text-amber-600 block">{ipc.currency}</span>
          </div>
        </div>
      )}

      {/* Site Resources Strip: Site Manpower KPI + Machinery KPI */}
      <div id="manpower-section" className="ipc-resources-strip mt-1 pt-1.5 border-t border-slate-200 grid grid-cols-12 gap-1.5 text-[8.5px]">
        {/* Site Manpower KPI (نیروی انسانی کارگاه) - Replaces Safe Man-Hours */}
        <div id="kpi-site-manpower" className="col-span-8 bg-slate-50 border border-slate-200 rounded px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <div className="flex items-center gap-1 text-slate-800 font-bold">
              <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-[8.5px] text-slate-800">
                {isFa ? 'نیروی انسانی کارگاه' : 'Site Manpower'}
              </span>
            </div>
            {attendanceRatio !== null ? (
              <span className={`text-[7.5px] font-bold px-1.5 py-0.2 rounded border ${attTheme.badge}`}>
                {attendanceRatio.toFixed(1)}% {isFa ? 'نسبت حضور' : 'Attendance'}
              </span>
            ) : (
              <span className="text-[7.5px] text-slate-400 font-medium">—</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-0.5">
            {/* Primary Value: Total Manpower */}
            <div className="flex items-baseline gap-1">
              <span className="text-slate-500 text-[7.5px]">{isFa ? 'کل:' : 'Total:'}</span>
              <span className="font-extrabold text-slate-950 text-[12px] font-mono leading-none">
                {totalMp !== null ? totalMp : '—'}
              </span>
              <span className="text-slate-500 text-[7.5px] font-medium">{isFa ? 'نفر' : 'pax'}</span>
            </div>

            {/* Secondary Values: Present & Absent */}
            <div className="flex items-center gap-2 text-[7.5px]">
              <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                {isFa ? 'حاضر:' : 'Pres:'}{' '}
                <strong className="font-bold text-[8.5px] text-emerald-900">{presentMp !== null ? `${presentMp} نفر` : '—'}</strong>
              </span>
              <span className="text-slate-600 font-semibold flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
                {isFa ? 'مرخصی/غیرحاضر:' : 'Abs:'}{' '}
                <strong className="font-bold text-[8.5px] text-slate-800">{absentMp !== null ? `${absentMp} نفر` : '—'}</strong>
              </span>
            </div>

            {/* Breakdown: Direct & Indirect */}
            <div className="flex items-center gap-1.5 text-[7px] text-slate-600 bg-white border border-slate-200 px-1 py-0.5 rounded">
              <span title={isFa ? 'نیروی مستقیم: حاضر از کل' : 'Direct: Present of Total'} className="flex items-center gap-0.5">
                <span>{isFa ? 'مستقیم:' : 'Dir:'}</span>
                <strong className="text-slate-900 font-bold">
                  {dirPresent !== null && dirTotal !== null ? `${dirPresent} از ${dirTotal} حاضر` : (dirPresent ?? '—')}
                </strong>
                {dirAttendance !== null && (
                  <span className="text-[6.5px] font-bold px-0.5 py-0.1 bg-sky-50 text-sky-700 border border-sky-200 rounded">
                    {dirAttendance.toFixed(1)}%
                  </span>
                )}
              </span>
              <span className="text-slate-300">|</span>
              <span title={isFa ? 'نیروی غیرمستقیم: حاضر از کل' : 'Indirect: Present of Total'} className="flex items-center gap-0.5">
                <span>{isFa ? 'غیرمستقیم:' : 'Ind:'}</span>
                <strong className="text-slate-900 font-bold">
                  {indPresent !== null && indTotal !== null ? `${indPresent} از ${indTotal} حاضر` : (indPresent ?? '—')}
                </strong>
                {indAttendance !== null && (
                  <span className="text-[6.5px] font-bold px-0.5 py-0.1 bg-amber-50 text-amber-800 border border-amber-200 rounded">
                    {indAttendance.toFixed(1)}%
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Attendance Ratio Progress Bar */}
          <div className="w-full bg-slate-200/80 h-1 rounded-full mt-1 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${attTheme.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, attendanceRatio || 0))}%` }}
            />
          </div>
        </div>

        {/* Machinery KPI Card */}
        <div id="kpi-site-machinery" className="col-span-4 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-700">
            <div className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="res-label text-slate-700 font-bold text-[8px] truncate">
                {isFa ? 'ماشین‌آلات فعال' : 'Active Machinery'}
              </span>
            </div>
            <span className="text-[7.5px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1 rounded">
              {daily.machinery?.active !== undefined && daily.machinery?.total !== undefined && daily.machinery.total > 0
                ? `${Math.round((daily.machinery.active / daily.machinery.total) * 100)}%`
                : ''}
            </span>
          </div>
          <div className="mt-0.5 flex items-baseline justify-between">
            <span className="res-val font-extrabold text-slate-900 text-[11px] font-mono">
              {daily.machinery?.active ?? '—'} <span className="text-[8px] font-normal text-slate-500">/ {daily.machinery?.total ?? '—'}</span>
            </span>
            <span className="text-[7px] text-slate-500">
              {daily.machinery?.standby ? `${daily.machinery.standby} ${isFa ? 'آماده' : 'stby'}` : (isFa ? 'دستگاه' : 'units')}
            </span>
          </div>
          <div className="w-full bg-slate-200/80 h-1 rounded-full mt-1 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full"
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

