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
    <div id="pms-section" className="grid grid-cols-6 gap-2 mb-2 print:grid print:grid-cols-6 print:break-inside-avoid">
      {/* 1. Planned Progress (Indigo / Slate Executive Theme) */}
      <div
        id="kpi-card-planned"
        className="kpi-card kpi-card-planned bg-linear-to-br from-indigo-50/75 via-slate-50 to-indigo-50/40 border border-indigo-200/90 rounded-lg p-1.5 flex flex-col justify-between shadow-2xs print:break-inside-avoid"
      >
        <div className="flex items-center justify-between text-indigo-950 text-[9.5px] font-bold">
          <span className="kpi-title truncate">{isFa ? 'پیشرفت برنامه‌ای' : 'PLANNED PROGRESS'}</span>
          <span className="p-0.5 rounded bg-indigo-100/80 text-indigo-700 shrink-0">
            <Activity className="w-3 h-3" />
          </span>
        </div>
        <div className="mt-0.5 flex items-baseline justify-between">
          <span className="kpi-value text-base font-extrabold text-indigo-950 tracking-tight ltr-inline">{planned}</span>
          <span className="kpi-sub text-[8px] text-indigo-800 bg-indigo-100/80 border border-indigo-200/80 px-1.5 py-0.2 rounded font-bold">
            Target
          </span>
        </div>
        <div className="w-full bg-indigo-200/60 h-1.5 rounded-full mt-1 overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full"
            style={{ width: `${Math.min(100, kpis.plannedProgress || 0)}%` }}
          />
        </div>
        <div className="text-[7.5px] text-indigo-800/80 font-semibold truncate mt-0.5">
          {isFa ? 'برنامه مبنا (Baseline Plan)' : 'Baseline Schedule Target'}
        </div>
      </div>

      {/* 2. Actual Progress (Royal / Sky Blue Theme) */}
      <div
        id="kpi-card-actual"
        className="kpi-card kpi-card-actual bg-linear-to-br from-blue-50/90 via-sky-50/55 to-blue-50/60 border border-blue-300/90 rounded-lg p-1.5 flex flex-col justify-between shadow-2xs print:break-inside-avoid"
      >
        <div className="flex items-center justify-between text-blue-950 text-[9.5px] font-bold">
          <span className="kpi-title truncate">{isFa ? 'پیشرفت واقعی' : 'ACTUAL PROGRESS'}</span>
          <span className="p-0.5 rounded bg-blue-100/90 text-blue-700 shrink-0">
            <TrendingUp className="w-3 h-3" />
          </span>
        </div>
        <div className="mt-0.5 flex items-baseline justify-between">
          <span className="kpi-value text-base font-extrabold text-blue-950 tracking-tight ltr-inline">{actual}</span>
          <span className="kpi-sub text-[8px] text-blue-800 bg-blue-100/90 border border-blue-200/80 px-1.5 py-0.2 rounded font-bold">
            Actual
          </span>
        </div>
        <div className="w-full bg-blue-200/75 h-1.5 rounded-full mt-1 overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full"
            style={{ width: `${Math.min(100, kpis.actualProgress || 0)}%` }}
          />
        </div>
        <div className="text-[7.5px] text-blue-800/85 font-semibold truncate mt-0.5">
          {isFa ? 'عملکرد تجمعی محقق‌شده' : 'Cumulative Realized Progress'}
        </div>
      </div>

      {/* 3. Variance (Rose Alert / Emerald Ahead Theme) */}
      <div
        id="kpi-card-variance"
        className={`kpi-card kpi-card-variance rounded-lg p-1.5 flex flex-col justify-between border shadow-2xs print:break-inside-avoid ${
          variance === null
            ? 'bg-slate-50 border-slate-300'
            : isPositiveVariance
            ? 'bg-linear-to-br from-emerald-50/90 via-emerald-50/50 to-teal-50/40 border-emerald-300/90 text-emerald-950'
            : 'bg-linear-to-br from-rose-50/90 via-rose-50/55 to-orange-50/35 border-rose-300/90 text-rose-950'
        }`}
      >
        <div className="flex items-center justify-between text-[9.5px] font-bold">
          <span className={`kpi-title truncate ${isPositiveVariance ? 'text-emerald-950' : 'text-rose-950'}`}>
            {isFa ? 'انحراف پیشرفت' : 'VARIANCE (SV)'}
          </span>
          <span
            className={`p-0.5 rounded shrink-0 ${
              isPositiveVariance ? 'bg-emerald-100/90 text-emerald-700' : 'bg-rose-100/90 text-rose-700'
            }`}
          >
            {isPositiveVariance ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          </span>
        </div>
        <div className="mt-0.5 flex items-baseline justify-between">
          <span
            className={`kpi-value text-base font-extrabold tracking-tight ltr-inline ${
              variance === null ? 'text-slate-900' : isPositiveVariance ? 'text-emerald-900' : 'text-rose-900'
            }`}
          >
            {variance !== null ? `${variance > 0 ? '+' : ''}${variance.toFixed(2)}%` : 'N/A'}
          </span>
          {kpis.scheduleDelayDays !== null && kpis.scheduleDelayDays !== undefined && (
            <span
              className={`kpi-delay-badge text-[8px] font-extrabold px-1.5 py-0.2 rounded border ltr-inline ${
                kpis.scheduleDelayDays > 0
                  ? 'bg-rose-200/80 text-rose-950 border-rose-300'
                  : 'bg-emerald-200/80 text-emerald-950 border-emerald-300'
              }`}
            >
              {kpis.scheduleDelayDays > 0 ? `-${kpis.scheduleDelayDays}d` : `${kpis.scheduleDelayDays}d`}
            </span>
          )}
        </div>
        <div
          className={`w-full h-1.5 rounded-full mt-1 overflow-hidden ${
            isPositiveVariance ? 'bg-emerald-200/70' : 'bg-rose-200/75'
          }`}
        >
          <div
            className={`h-full rounded-full ${isPositiveVariance ? 'bg-emerald-600' : 'bg-rose-600'}`}
            style={{ width: `${Math.min(100, Math.max(8, Math.abs(variance || 0)))}%` }}
          />
        </div>
        <div
          className={`kpi-delay-text text-[7.5px] font-semibold truncate mt-0.5 ${
            isPositiveVariance ? 'text-emerald-900' : 'text-rose-900'
          }`}
          title={kpis.plannedAchievementDate ? `تاریخ برنامه برای ${kpis.actualProgress}%: ${kpis.plannedAchievementDate}` : undefined}
        >
          {kpis.scheduleDelayDays !== null && kpis.scheduleDelayDays !== undefined
            ? isFa
              ? kpis.scheduleDelayDays > 0
                ? `${kpis.scheduleDelayDays} روز تأخیر زمانی`
                : 'مطابق برنامه / بدون تأخیر'
              : kpis.scheduleDelayDays > 0
              ? `${kpis.scheduleDelayDays}d Schedule Delay`
              : 'On Schedule / Ahead'
            : isFa
            ? 'انحراف نسبت به برنامه'
            : 'Schedule Variance'}
        </div>
      </div>

      {/* 4. Time Elapsed (Warm Amber / Orange Executive Theme) */}
      <div
        id="kpi-card-elapsed"
        className="kpi-card kpi-card-elapsed bg-linear-to-br from-amber-50/85 via-orange-50/45 to-amber-50/50 border border-amber-300/90 rounded-lg p-1.5 flex flex-col justify-between shadow-2xs print:break-inside-avoid"
      >
        <div className="flex items-center justify-between text-amber-950 text-[9.5px] font-bold">
          <span className="kpi-title truncate">{isFa ? 'زمان سپری‌شده' : 'TIME ELAPSED'}</span>
          <span className="p-0.5 rounded bg-amber-100/90 text-amber-700 shrink-0">
            <Clock className="w-3 h-3" />
          </span>
        </div>
        <div className="mt-0.5 flex items-baseline justify-between">
          <span className="kpi-value text-base font-extrabold text-amber-950 tracking-tight ltr-inline">
            {kpis.timeElapsedPercentage !== null ? `${Math.min(100, Math.max(0, kpis.timeElapsedPercentage))}%` : 'N/A'}
          </span>
          <span className="kpi-sub text-[8px] text-amber-900 bg-amber-100/90 border border-amber-200/90 px-1 py-0.2 rounded font-bold ltr-inline">
            {kpis.timeElapsedDays !== null ? `${kpis.timeElapsedDays}/${kpis.totalDurationDays}d` : `${kpis.totalDurationDays}d`}
          </span>
        </div>
        <div className="w-full bg-amber-200/75 h-1.5 rounded-full mt-1 overflow-hidden">
          <div
            className="bg-amber-600 h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, kpis.timeElapsedPercentage || 0))}%` }}
          />
        </div>
        <div className="kpi-elapsed-meta text-[7.5px] text-amber-900 font-semibold truncate mt-0.5 flex items-center justify-between">
          <span className="truncate">{isFa ? kpis.effectiveEndLabelFa : kpis.effectiveEndLabelEn}</span>
        </div>
      </div>

      {/* 5. Equipment Installation (Teal / Cyan Engineering Theme) */}
      <div
        id="kpi-card-equipment"
        className="kpi-card kpi-card-equipment bg-linear-to-br from-teal-50/85 via-cyan-50/45 to-teal-50/50 border border-teal-300/90 rounded-lg p-1.5 flex flex-col justify-between shadow-2xs print:break-inside-avoid"
      >
        <div className="flex items-center justify-between text-teal-950 text-[9.5px] font-bold">
          <span className="kpi-title truncate">{isFa ? 'نصب تجهیزات' : 'EQUIPMENT INST.'}</span>
          <span className="p-0.5 rounded bg-teal-100/90 text-teal-700 shrink-0">
            <Wrench className="w-3 h-3" />
          </span>
        </div>
        <div className="mt-0.5 flex items-baseline justify-between">
          <span className="kpi-value text-base font-extrabold text-teal-950 tracking-tight ltr-inline">
            {kpis.equipmentInstallationPercentage !== null ? `${kpis.equipmentInstallationPercentage.toFixed(1)}%` : 'N/A'}
          </span>
          <span className="kpi-sub text-[8px] text-teal-900 bg-teal-100/90 border border-teal-200/90 px-1.5 py-0.2 rounded font-bold ltr-inline">
            {kpis.equipmentInstalled || 0}/{kpis.equipmentTotal || 0}
          </span>
        </div>
        <div className="w-full bg-teal-200/75 h-1.5 rounded-full mt-1 overflow-hidden">
          <div
            className="bg-teal-600 h-full rounded-full"
            style={{ width: `${Math.min(100, kpis.equipmentInstallationPercentage || 0)}%` }}
          />
        </div>
        <div className="text-[7.5px] text-teal-900 font-semibold truncate mt-0.5">
          {isFa
            ? `${kpis.equipmentInstalled || 0} از ${kpis.equipmentTotal || 0} قلم تجهیز منصوبه`
            : `${kpis.equipmentInstalled || 0} of ${kpis.equipmentTotal || 0} Units Installed`}
        </div>
      </div>

      {/* 6. Financial / IPC Status (Emerald / Green Financial Theme) */}
      <div
        id="kpi-card-financial"
        className="kpi-card kpi-card-financial bg-linear-to-br from-emerald-50/85 via-green-50/45 to-emerald-50/50 border border-emerald-300/90 rounded-lg p-1.5 flex flex-col justify-between shadow-2xs print:break-inside-avoid"
      >
        <div className="flex items-center justify-between text-emerald-950 text-[9.5px] font-bold">
          <span className="kpi-title truncate">{isFa ? 'پیشرفت مالی (Financial)' : 'FINANCIAL PROGRESS'}</span>
          <span className="p-0.5 rounded bg-emerald-100/90 text-emerald-700 shrink-0">
            <CreditCard className="w-3 h-3" />
          </span>
        </div>
        <div className="mt-0.5 flex items-baseline justify-between">
          <span className="kpi-value text-base font-extrabold text-emerald-950 tracking-tight ltr-inline">
            {kpis.financialSummary?.financialProgress !== undefined && kpis.financialSummary?.financialProgress !== null
              ? `${kpis.financialSummary.financialProgress.toFixed(2)}%`
              : kpis.ipcCachedRatio !== null
              ? `${kpis.ipcCachedRatio}%`
              : 'N/A'}
          </span>
          <span className="kpi-sub text-[8px] text-emerald-900 bg-emerald-100/90 border border-emerald-200/90 px-1 py-0.2 rounded font-bold whitespace-nowrap">
            {kpis.financialSummary?.collectionRatio !== undefined && kpis.financialSummary?.collectionRatio !== null
              ? `${isFa ? 'وصول' : 'Col'}: ${kpis.financialSummary.collectionRatio.toFixed(1)}%`
              : isFa
              ? 'وصولی'
              : 'Paid'}
          </span>
        </div>
        <div className="w-full bg-emerald-200/75 h-1.5 rounded-full mt-1 overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full"
            style={{
              width: `${Math.min(100, kpis.financialSummary?.financialProgress ?? kpis.ipcCachedRatio ?? 0)}%`
            }}
          />
        </div>
        <div className="text-[7.5px] text-emerald-900 font-semibold truncate mt-0.5">
          {isFa ? 'مبتنی بر آخرین صورت‌وضعیت تأییدی' : 'Based on Latest Certified IPC'}
        </div>
      </div>
    </div>
  );
};

