import React from 'react';
import { CalculatedReportKPIs, Language } from '../../types';
import { TrendingUp, TrendingDown, Clock, Activity, Wrench, CreditCard } from 'lucide-react';

interface KpiCardsGridProps {
  kpis: CalculatedReportKPIs;
  lang: Language;
}

export const KpiCardsGrid: React.FC<KpiCardsGridProps> = ({ kpis, lang }) => {
  const isFa = lang === 'fa';

  const planned = kpis.plannedProgress !== null ? `${kpis.plannedProgress.toFixed(2)}%` : 'N/A';
  const actual = kpis.actualProgress !== null ? `${kpis.actualProgress.toFixed(2)}%` : 'N/A';
  const variance = kpis.progressVariance !== null ? kpis.progressVariance : null;
  const isPositiveVariance = variance !== null && variance >= 0;

  return (
    <div id="pms-section" className="grid grid-cols-6 gap-2 mb-2">
      {/* 1. Planned Progress */}
      <div id="kpi-card-planned" className="kpi-card kpi-card-planned bg-white border border-slate-250 rounded p-1.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between text-slate-600 text-[9.5px] font-semibold">
          <span className="kpi-title">{isFa ? 'پیشرفت برنامه‌ای' : 'PLANNED PROGRESS'}</span>
          <Activity className="w-3 h-3 text-slate-400" />
        </div>
        <div className="mt-0.5 flex items-baseline justify-between">
          <span className="kpi-value text-base font-extrabold text-slate-900 tracking-tight">{planned}</span>
          <span className="kpi-sub text-[8.5px] text-slate-400 font-medium">Target</span>
        </div>
        <div className="w-full bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
          <div
            className="bg-slate-600 h-full rounded-full"
            style={{ width: `${Math.min(100, kpis.plannedProgress || 0)}%` }}
          />
        </div>
      </div>

      {/* 2. Actual Progress */}
      <div id="kpi-card-actual" className="kpi-card kpi-card-actual bg-blue-50/70 border border-blue-200 rounded p-1.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between text-blue-900 text-[9.5px] font-bold">
          <span className="kpi-title">{isFa ? 'پیشرفت واقعی' : 'ACTUAL PROGRESS'}</span>
          <TrendingUp className="w-3 h-3 text-blue-600" />
        </div>
        <div className="mt-0.5 flex items-baseline justify-between">
          <span className="kpi-value text-base font-extrabold text-blue-950 tracking-tight">{actual}</span>
          <span className="kpi-sub text-[8.5px] text-blue-700 font-bold">Actual</span>
        </div>
        <div className="w-full bg-blue-200/80 h-1 rounded-full mt-1 overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full"
            style={{ width: `${Math.min(100, kpis.actualProgress || 0)}%` }}
          />
        </div>
      </div>

      {/* 3. Variance */}
      <div id="kpi-card-variance" className={`kpi-card kpi-card-variance rounded p-1.5 flex flex-col justify-between border shadow-2xs ${
        variance === null
          ? 'bg-white border-slate-250'
          : isPositiveVariance
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          : 'bg-rose-50/80 border-rose-200 text-rose-950'
      }`}>
        <div className="flex items-center justify-between text-[9.5px] font-bold">
          <span className={`kpi-title ${isPositiveVariance ? 'text-emerald-900' : 'text-rose-900'}`}>
            {isFa ? 'انحراف پیشرفت' : 'VARIANCE (SV)'}
          </span>
          {isPositiveVariance ? (
            <TrendingUp className="w-3 h-3 text-emerald-600" />
          ) : (
            <TrendingDown className="w-3 h-3 text-rose-600" />
          )}
        </div>
        <div className="mt-0.5 flex items-baseline justify-between">
          <span className={`kpi-value text-base font-extrabold tracking-tight ${
            variance === null ? 'text-slate-900' : isPositiveVariance ? 'text-emerald-800' : 'text-rose-800'
          }`}>
            {variance !== null ? `${variance > 0 ? '+' : ''}${variance.toFixed(2)}%` : 'N/A'}
          </span>
          {kpis.scheduleDelayDays !== null && kpis.scheduleDelayDays !== undefined && (
            <span className={`kpi-delay-badge text-[8.5px] font-bold px-1 rounded ${
              kpis.scheduleDelayDays > 0 ? 'bg-rose-200/70 text-rose-900' : 'bg-emerald-200/70 text-emerald-900'
            }`}>
              {kpis.scheduleDelayDays > 0 ? `-${kpis.scheduleDelayDays}d` : `${kpis.scheduleDelayDays}d`}
            </span>
          )}
        </div>
        {kpis.scheduleDelayDays !== null && kpis.scheduleDelayDays !== undefined ? (
          <div
            className="kpi-delay-text text-[8px] text-slate-500 font-medium truncate mt-0.5"
            title={kpis.plannedAchievementDate ? `تاریخ برنامه برای ${kpis.actualProgress}%: ${kpis.plannedAchievementDate}` : undefined}
          >
            {isFa
              ? (kpis.scheduleDelayDays > 0 ? `${kpis.scheduleDelayDays} روز تأخیر زمانی` : 'مطابق برنامه / بدون تأخیر')
              : (kpis.scheduleDelayDays > 0 ? `${kpis.scheduleDelayDays}d Schedule Delay` : 'On Schedule / Ahead')}
          </div>
        ) : null}
      </div>

      {/* 4. Time Elapsed */}
      <div id="kpi-card-elapsed" className="kpi-card kpi-card-elapsed bg-white border border-slate-250 rounded p-1.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between text-slate-600 text-[9.5px] font-semibold">
          <span className="kpi-title">{isFa ? 'زمان سپری‌شده' : 'TIME ELAPSED'}</span>
          <Clock className="w-3 h-3 text-slate-400" />
        </div>
        <div className="mt-0.5 flex items-baseline justify-between">
          <span className="kpi-value text-base font-extrabold text-slate-900 tracking-tight">
            {kpis.timeElapsedPercentage !== null ? `${kpis.timeElapsedPercentage}%` : 'N/A'}
          </span>
          <span className="kpi-sub text-[8.5px] text-slate-500 font-semibold">
            {kpis.timeElapsedDays !== null ? `${kpis.timeElapsedDays}/${kpis.totalDurationDays}d` : `${kpis.totalDurationDays}d`}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
          <div
            className="bg-amber-600 h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, kpis.timeElapsedPercentage || 0))}%` }}
          />
        </div>
        <div className="kpi-elapsed-meta text-[7.5px] text-slate-500 font-medium truncate mt-0.5 flex items-center justify-between gap-1">
          <span className="truncate">{isFa ? `مرجع: ${kpis.referenceReportDate || 'N/A'}` : `Ref: ${kpis.referenceReportDate || 'N/A'}`}</span>
          <span className="font-semibold text-slate-700 truncate">{isFa ? kpis.effectiveEndLabelFa : kpis.effectiveEndLabelEn}</span>
        </div>
      </div>

      {/* 5. Equipment Installation */}
      <div id="kpi-card-equipment" className="kpi-card kpi-card-equipment bg-white border border-slate-250 rounded p-1.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between text-slate-700 text-[9.5px] font-bold">
          <span className="kpi-title">{isFa ? 'نصب تجهیزات' : 'EQUIPMENT INST.'}</span>
          <Wrench className="w-3 h-3 text-slate-400" />
        </div>
        <div className="mt-0.5 flex items-baseline justify-between">
          <span className="kpi-value text-base font-extrabold text-slate-900 tracking-tight">
            {kpis.equipmentInstallationPercentage !== null ? `${kpis.equipmentInstallationPercentage.toFixed(1)}%` : 'N/A'}
          </span>
          <span className="kpi-sub text-[8.5px] text-slate-500 font-semibold">
            {kpis.equipmentInstalled || 0}/{kpis.equipmentTotal || 0}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
          <div
            className="bg-teal-600 h-full rounded-full"
            style={{ width: `${Math.min(100, kpis.equipmentInstallationPercentage || 0)}%` }}
          />
        </div>
      </div>

      {/* 6. Financial / IPC Status */}
      <div id="kpi-card-financial" className="kpi-card kpi-card-financial bg-white border border-slate-250 rounded p-1.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between text-slate-700 text-[9.5px] font-bold">
          <span className="kpi-title">{isFa ? 'پیشرفت مالی (Financial)' : 'FINANCIAL PROGRESS'}</span>
          <CreditCard className="w-3 h-3 text-slate-400" />
        </div>
        <div className="mt-0.5 flex items-baseline justify-between">
          <span className="kpi-value text-base font-extrabold text-slate-900 tracking-tight">
            {kpis.financialSummary?.financialProgress !== undefined && kpis.financialSummary?.financialProgress !== null
              ? `${kpis.financialSummary.financialProgress.toFixed(1)}%`
              : (kpis.ipcCachedRatio !== null ? `${kpis.ipcCachedRatio}%` : 'N/A')}
          </span>
          <span className="kpi-sub text-[8.5px] text-emerald-700 font-bold">
            {kpis.financialSummary?.collectionRatio !== undefined && kpis.financialSummary?.collectionRatio !== null
              ? `${isFa ? 'وصول' : 'Col'}: ${kpis.financialSummary.collectionRatio.toFixed(1)}%`
              : (isFa ? 'وصولی' : 'Paid')}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full"
            style={{
              width: `${Math.min(
                100,
                kpis.financialSummary?.financialProgress ?? kpis.ipcCachedRatio ?? 0
              )}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};
