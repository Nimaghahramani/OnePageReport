import React from 'react';
import { CalculatedReportKPIs, Language } from '../../types';
import { TrendingUp, TrendingDown, Clock, Activity, Wrench, CreditCard } from 'lucide-react';

interface MobileKpiGridProps {
  kpis: CalculatedReportKPIs;
  lang: Language;
}

export const MobileKpiGrid: React.FC<MobileKpiGridProps> = ({ kpis, lang }) => {
  const isFa = lang === 'fa';

  const plannedStr = kpis.plannedProgress !== null ? `${kpis.plannedProgress.toFixed(2)}%` : '—';
  const actualStr = kpis.actualProgress !== null ? `${kpis.actualProgress.toFixed(2)}%` : '—';
  const variance = kpis.progressVariance !== null ? kpis.progressVariance : null;
  const isPositiveVariance = variance !== null && variance >= 0;

  const elapsedStr = kpis.timeElapsedPercentage !== null ? `${kpis.timeElapsedPercentage}%` : '—';
  const equipmentStr = kpis.equipmentInstallationPercentage !== null ? `${kpis.equipmentInstallationPercentage.toFixed(1)}%` : '—';
  const financialStr = kpis.financialProgress !== null ? `${kpis.financialProgress.toFixed(1)}%` : '—';

  return (
    <div id="mobile-kpi-grid" className="grid grid-cols-2 gap-2 mb-2.5">
      {/* 1. Planned Progress */}
      <div className="mobile-kpi-card bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between shadow-xs min-h-[84px]">
        <div className="flex items-center justify-between text-slate-500 text-[10px] font-semibold">
          <span className="truncate">{isFa ? 'پیشرفت برنامه‌ای' : 'PLANNED PROGRESS'}</span>
          <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>
        <div className="my-1 flex items-baseline justify-between">
          <span className="text-lg font-black text-slate-900 font-mono tracking-tight">{plannedStr}</span>
          <span className="text-[9px] text-slate-400 font-bold">Target</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-slate-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, kpis.plannedProgress || 0))}%` }}
          />
        </div>
      </div>

      {/* 2. Actual Progress */}
      <div className="mobile-kpi-card bg-blue-50/60 border border-blue-200 rounded-xl p-2.5 flex flex-col justify-between shadow-xs min-h-[84px]">
        <div className="flex items-center justify-between text-blue-900 text-[10px] font-bold">
          <span className="truncate">{isFa ? 'پیشرفت واقعی' : 'ACTUAL PROGRESS'}</span>
          <TrendingUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        </div>
        <div className="my-1 flex items-baseline justify-between">
          <span className="text-lg font-black text-blue-950 font-mono tracking-tight">{actualStr}</span>
          <span className="text-[9px] text-blue-700 font-bold">Actual</span>
        </div>
        <div className="w-full bg-blue-200/70 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, kpis.actualProgress || 0))}%` }}
          />
        </div>
      </div>

      {/* 3. Variance */}
      <div
        className={`mobile-kpi-card rounded-xl p-2.5 flex flex-col justify-between border shadow-xs min-h-[84px] ${
          variance === null
            ? 'bg-white border-slate-200'
            : isPositiveVariance
            ? 'bg-emerald-50/70 border-emerald-200'
            : 'bg-rose-50/80 border-rose-200'
        }`}
      >
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className={`truncate ${isPositiveVariance ? 'text-emerald-900' : 'text-rose-900'}`}>
            {isFa ? 'انحراف پیشرفت' : 'VARIANCE (SV)'}
          </span>
          {isPositiveVariance ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          )}
        </div>
        <div className="my-1 flex items-baseline justify-between">
          <span
            className={`text-lg font-black font-mono tracking-tight ${
              variance === null ? 'text-slate-900' : isPositiveVariance ? 'text-emerald-800' : 'text-rose-800'
            }`}
          >
            {variance !== null ? `${variance > 0 ? '+' : ''}${variance.toFixed(2)}%` : '—'}
          </span>
          {kpis.scheduleDelayDays !== null && kpis.scheduleDelayDays !== undefined && (
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                kpis.scheduleDelayDays > 0 ? 'bg-rose-200 text-rose-900' : 'bg-emerald-200 text-emerald-900'
              }`}
            >
              {kpis.scheduleDelayDays > 0 ? `-${kpis.scheduleDelayDays}d` : `${kpis.scheduleDelayDays}d`}
            </span>
          )}
        </div>
        <div className="text-[8px] font-medium text-slate-500 truncate">
          {kpis.scheduleDelayDays !== null && kpis.scheduleDelayDays !== undefined ? (
            isFa ? (
              kpis.scheduleDelayDays > 0 ? `${kpis.scheduleDelayDays} روز تأخیر زمانی` : 'مطابق برنامه زمان‌بندی'
            ) : (
              kpis.scheduleDelayDays > 0 ? `${kpis.scheduleDelayDays}d Schedule Delay` : 'On Schedule'
            )
          ) : (
            isFa ? 'انحراف از برنامه زمان‌بندی' : 'Schedule Variance'
          )}
        </div>
      </div>

      {/* 4. Elapsed Time */}
      <div className="mobile-kpi-card bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between shadow-xs min-h-[84px]">
        <div className="flex items-center justify-between text-slate-600 text-[10px] font-semibold">
          <span className="truncate">{isFa ? 'زمان سپری‌شده' : 'TIME ELAPSED'}</span>
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>
        <div className="my-1 flex items-baseline justify-between">
          <span className="text-lg font-black text-slate-900 font-mono tracking-tight">{elapsedStr}</span>
          <span className="text-[9px] text-slate-500 font-bold font-mono">
            {kpis.timeElapsedDays !== null ? `${kpis.timeElapsedDays}/${kpis.totalDurationDays}d` : `${kpis.totalDurationDays}d`}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-amber-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, kpis.timeElapsedPercentage || 0))}%` }}
          />
        </div>
      </div>

      {/* 5. Equipment Installation */}
      <div className="mobile-kpi-card bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between shadow-xs min-h-[84px]">
        <div className="flex items-center justify-between text-teal-800 text-[10px] font-bold">
          <span className="truncate">{isFa ? 'نصب تجهیزات' : 'EQUIPMENT INST.'}</span>
          <Wrench className="w-3.5 h-3.5 text-teal-600 shrink-0" />
        </div>
        <div className="my-1 flex items-baseline justify-between">
          <span className="text-lg font-black text-teal-950 font-mono tracking-tight">{equipmentStr}</span>
          <span className="text-[9px] text-teal-700 font-bold font-mono">
            {kpis.equipmentInstalled || 0}/{kpis.equipmentTotal || 0}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-teal-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, kpis.equipmentInstallationPercentage || 0))}%` }}
          />
        </div>
      </div>

      {/* 6. Financial Progress */}
      <div className="mobile-kpi-card bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between shadow-xs min-h-[84px]">
        <div className="flex items-center justify-between text-emerald-800 text-[10px] font-bold">
          <span className="truncate">{isFa ? 'پیشرفت مالی' : 'FINANCIAL PROG.'}</span>
          <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        </div>
        <div className="my-1 flex items-baseline justify-between">
          <span className="text-lg font-black text-emerald-950 font-mono tracking-tight">{financialStr}</span>
          <span className="text-[9px] text-emerald-700 font-bold">IPC</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, kpis.financialProgress || 0))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
