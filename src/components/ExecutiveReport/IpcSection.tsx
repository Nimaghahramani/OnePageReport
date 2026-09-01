import React from 'react';
import { IpcRecord, DailyReportRecord, Language } from '../../types';
import { CreditCard, Users, ShieldCheck, Truck, Coins, ArrowUpRight } from 'lucide-react';

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

  return (
    <div id="ipc-section-card" className="ipc-section-card border border-slate-250 rounded bg-white p-2 shadow-2xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
          <h2 className="text-[10.5px] font-extrabold text-slate-900 uppercase tracking-tight">
            {isFa ? (
              <>
                وضعیت مالی و صورت‌وضعیت <span className="ltr-inline text-[9.5px] font-mono text-slate-500 font-bold">(INVOICE & IPC)</span>
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
        <div className="grid grid-cols-4 gap-1.5 mb-1.5 text-center font-mono">
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
              <span className="font-bold font-mono">{finProgress}%</span>
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
              <span className="font-bold font-mono">{collectionRatio}%</span>
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
              <span className="font-bold font-mono">{outstandingRatio.toFixed(1)}%</span>
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
        <div className="grid grid-cols-4 gap-1.5 mb-1.5 text-center font-mono">
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

      {/* Site Resources Compact Strip */}
      <div className="ipc-resources-strip mt-1 pt-1.5 border-t border-slate-200 grid grid-cols-3 gap-1.5 text-[8.5px]">
        <div className="resource-metric-box flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-1.5 py-1">
          <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <div className="truncate">
            <span className="res-label text-slate-500 text-[7.5px] block">{isFa ? 'نیروی انسانی کل' : 'Total Manpower'}</span>
            <span className="res-val font-bold font-mono text-slate-800 text-[10px]">
              {daily.manpower.total} <span className="res-sub text-[7.5px] font-normal text-slate-500">({daily.manpower.direct} {isFa ? 'مستقیم' : 'Dir'})</span>
            </span>
          </div>
        </div>

        <div className="resource-metric-box flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-1.5 py-1">
          <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <div className="truncate">
            <span className="res-label text-slate-500 text-[7.5px] block">{isFa ? 'ماشین‌آلات فعال' : 'Machinery Active'}</span>
            <span className="res-val font-bold font-mono text-slate-800 text-[10px]">
              {daily.machinery.active} / {daily.machinery.total}
            </span>
          </div>
        </div>

        <div className="resource-metric-box flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-1.5 py-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <div className="truncate">
            <span className="res-label text-slate-500 text-[7.5px] block">{isFa ? 'ساعت کار بدون حادثه' : 'Safe Man-Hours'}</span>
            <span className="res-val font-bold font-mono text-emerald-800 text-[10px]">
              {daily.safetyHSE?.safeManHours !== null && daily.safetyHSE?.safeManHours !== undefined
                ? `${(daily.safetyHSE.safeManHours / 1000000).toFixed(2)}M`
                : 'N/A'}{' '}
              <span className="res-sub text-[7px] font-normal text-emerald-600">
                LTI: {daily.safetyHSE?.lostTimeInjuries ?? '0'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
