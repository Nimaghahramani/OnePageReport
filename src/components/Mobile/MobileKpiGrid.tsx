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

  const elapsedStr = kpis.timeElapsedPercentage !== null ? `${Math.min(100, Math.max(0, kpis.timeElapsedPercentage))}%` : '—';
  const equipmentStr = kpis.equipmentInstallationPercentage !== null ? `${kpis.equipmentInstallationPercentage.toFixed(1)}%` : '—';
  const financialStr = kpis.financialProgress !== null ? `${kpis.financialProgress.toFixed(2)}%` : '—';

  return (
    <div id="mobile-kpi-grid" className="grid grid-cols-2 gap-2 mb-2.5">
      {/* 1. Planned Progress */}
      <div className="mobile-kpi-card bg-linear-to-br from-indigo-50/75 via-slate-50 to-indigo-50/40 border border-indigo-200/90 rounded-xl p-2.5 flex flex-col justify-between shadow-xs min-h-[84px]">
        <div className="flex items-center justify-between text-indigo-950 text-[10px] font-bold">
          <span className="truncate">{isFa ? 'پیشرفت برنامه‌ای' : 'PLANNED PROGRESS'}</span>
          <Activity className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        </div>
        <div className="my-1 flex items-baseline justify-between">
          <span className="text-lg font-black text-indigo-950 font-mono tracking-tight">{plannedStr}</span>
          <span className="text-[9px] text-indigo-800 bg-indigo-100/80 px-1.5 py-0.2 rounded font-bold">Target</span>
        </div>
        <div className="w-full bg-indigo-200/60 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, kpis.plannedProgress || 0))}%` }}
          />
        </div>
      </div>

      {/* 2. Actual Progress */}
      <div className="mobile-kpi-card bg-linear-to-br from-blue-50/90 via-sky-50/55 to-blue-50/60 border border-blue-300/90 rounded-xl p-2.5 flex flex-col justify-between shadow-xs min-h-[84px]">
        <div className="flex items-center justify-between text-blue-950 text-[10px] font-bold">
          <span className="truncate">{isFa ? 'پیشرفت واقعی' : 'ACTUAL PROGRESS'}</span>
          <TrendingUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        </div>
        <div className="my-1 flex items-baseline justify-between">
          <span className="text-lg font-black text-blue-950 font-mono tracking-tight">{actualStr}</span>
          <span className="text-[9px] text-blue-800 bg-blue-100/90 px-1.5 py-0.2 rounded font-bold">Actual</span>
        </div>
        <div className="w-full bg-blue-200/75 h-1.5 rounded-full overflow-hidden">
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
            ? 'bg-linear-to-br from-emerald-50/90 via-emerald-50/50 to-teal-50/40 border-emerald-300/90'
            : 'bg-linear-to-br from-rose-50/90 via-rose-50/55 to-orange-50/35 border-rose-300/90'
        }`}
      >
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className={`truncate ${isPositiveVariance ? 'text-emerald-950' : 'text-rose-950'}`}>
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
              variance === null ? 'text-slate-900' : isPositiveVariance ? 'text-emerald-900' : 'text-rose-900'
            }`}
          >
            {variance !== null ? `${variance > 0 ? '+' : ''}${variance.toFixed(2)}%` : '—'}
          </span>
          {kpis.scheduleDelayDays !== null && kpis.scheduleDelayDays !== undefined && (
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                kpis.scheduleDelayDays > 0 ? 'bg-rose-200 text-rose-950' : 'bg-emerald-200 text-emerald-950'
              }`}
            >
              {kpis.scheduleDelayDays > 0 ? `-${kpis.scheduleDelayDays}d` : `${kpis.scheduleDelayDays}d`}
            </span>
          )}
        </div>
        <div className={`text-[8px] font-semibold truncate ${isPositiveVariance ? 'text-emerald-900' : 'text-rose-900'}`}>
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
      <div className="mobile-kpi-card bg-linear-to-br from-amber-50/85 via-orange-50/45 to-amber-50/50 border border-amber-300/90 rounded-xl p-2.5 flex flex-col justify-between shadow-xs min-h-[84px]">
        <div className="flex items-center justify-between text-amber-950 text-[10px] font-bold">
          <span className="truncate">{isFa ? 'زمان سپری‌شده' : 'TIME ELAPSED'}</span>
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        </div>
        <div className="my-1 flex items-baseline justify-between">
          <span className="text-lg font-black text-amber-950 font-mono tracking-tight">{elapsedStr}</span>
          <span className="text-[9px] text-amber-900 bg-amber-100/90 px-1.5 py-0.2 rounded font-bold font-mono">
            {kpis.timeElapsedDays !== null ? `${kpis.timeElapsedDays}/${kpis.totalDurationDays}d` : `${kpis.totalDurationDays}d`}
          </span>
        </div>
        <div className="w-full bg-amber-200/75 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-amber-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, kpis.timeElapsedPercentage || 0))}%` }}
          />
        </div>
      </div>

      {/* 5. Equipment Installation */}
      <div className="mobile-kpi-card bg-linear-to-br from-teal-50/85 via-cyan-50/45 to-teal-50/50 border border-teal-300/90 rounded-xl p-2.5 flex flex-col justify-between shadow-xs min-h-[84px]">
        <div className="flex items-center justify-between text-teal-950 text-[10px] font-bold">
          <span className="truncate">{isFa ? 'نصب تجهیزات' : 'EQUIPMENT INST.'}</span>
          <Wrench className="w-3.5 h-3.5 text-teal-600 shrink-0" />
        </div>
        <div className="my-1 flex items-baseline justify-between">
          <span className="text-lg font-black text-teal-950 font-mono tracking-tight">{equipmentStr}</span>
          <span className="text-[9px] text-teal-900 bg-teal-100/90 px-1.5 py-0.2 rounded font-bold font-mono">
            {kpis.equipmentInstalled || 0}/{kpis.equipmentTotal || 0}
          </span>
        </div>
        <div className="w-full bg-teal-200/75 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-teal-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, kpis.equipmentInstallationPercentage || 0))}%` }}
          />
        </div>
      </div>

      {/* 6. Financial Progress */}
      <div className="mobile-kpi-card bg-linear-to-br from-emerald-50/85 via-green-50/45 to-emerald-50/50 border border-emerald-300/90 rounded-xl p-2.5 flex flex-col justify-between shadow-xs min-h-[84px]">
        <div className="flex items-center justify-between text-emerald-950 text-[10px] font-bold">
          <span className="truncate">{isFa ? 'پیشرفت مالی' : 'FINANCIAL PROG.'}</span>
          <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        </div>
        <div className="my-1 flex items-baseline justify-between">
          <span className="text-lg font-black text-emerald-950 font-mono tracking-tight">{financialStr}</span>
          <span className="text-[9px] text-emerald-900 bg-emerald-100/90 px-1.5 py-0.2 rounded font-bold">IPC</span>
        </div>
        <div className="w-full bg-emerald-200/75 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, kpis.financialProgress || 0))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
