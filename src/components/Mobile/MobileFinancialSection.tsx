import React from 'react';
import { IpcRecord, DailyReportRecord, Language } from '../../types';
import { CreditCard, Users, ShieldCheck, Truck, Coins, ArrowUpRight } from 'lucide-react';

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

  const manpower = daily.manpowerDaily;
  const hse = daily.safetyHSE;

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

      {/* Operational Site Metrics (Manpower, Machinery, HSE) */}
      {(manpower || hse) && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <div className="grid grid-cols-3 gap-1.5 text-center text-[9px]">
            {/* Manpower */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-center gap-1 text-slate-600 mb-0.5">
                <Users className="w-3 h-3 text-slate-500" />
                <span className="text-[8px] font-semibold">{isFa ? 'نیروی انسانی' : 'Manpower'}</span>
              </div>
              <span className="font-bold text-slate-900 font-mono text-[11px]">
                {manpower?.totalPresent ?? (manpower ? `${(manpower.directLabor || 0) + (manpower.indirectLabor || 0)}` : '—')}
              </span>
              <span className="text-[7.5px] text-slate-400">{isFa ? 'نفر در کارگاه' : 'Persons on site'}</span>
            </div>

            {/* Machinery */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-center gap-1 text-slate-600 mb-0.5">
                <Truck className="w-3 h-3 text-slate-500" />
                <span className="text-[8px] font-semibold">{isFa ? 'ماشین‌آلات' : 'Machinery'}</span>
              </div>
              <span className="font-bold text-slate-900 font-mono text-[11px]">
                {daily.machineryAndEquipment?.totalActiveMachinery ?? (daily.machineryAndEquipment?.items?.length || '—')}
              </span>
              <span className="text-[7.5px] text-slate-400">{isFa ? 'دستگاه فعال' : 'Active units'}</span>
            </div>

            {/* HSE Safe Man-Hours */}
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-center gap-1 text-emerald-800 mb-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span className="text-[8px] font-semibold">{isFa ? 'ساعات ایمن' : 'Safe Hours'}</span>
              </div>
              <span className="font-bold text-emerald-950 font-mono text-[11px]">
                {hse?.safeManHoursCumulative ? formatIrr(hse.safeManHoursCumulative) : (hse?.incidentFreeDays ? `${hse.incidentFreeDays}d` : '—')}
              </span>
              <span className="text-[7.5px] text-emerald-700">{isFa ? 'بدون حادثه' : 'LTI Free'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
