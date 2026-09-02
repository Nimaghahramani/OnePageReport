import React, { useState } from 'react';
import { PmsRecord, Language, SelectedPmsProgress } from '../../types';
import { normalizeWbsCode } from '../../services/excelParser';
import { CalendarRange, ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface MobilePmsSectionProps {
  pms: PmsRecord;
  lang: Language;
}

const TOP_LEVEL_ORDER = ['1', '2', '3'];
const DETAIL_ORDER = ['2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.9'];

function getVarianceBadge(v: number | null | undefined) {
  if (v === null || v === undefined) {
    return { text: '—', className: 'bg-slate-100 text-slate-500' };
  }
  const text = `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
  if (v >= 0) {
    return { text, className: 'bg-emerald-100 text-emerald-800 border border-emerald-200' };
  }
  if (v >= -3) {
    return { text, className: 'bg-amber-100 text-amber-800 border border-amber-200' };
  }
  return { text, className: 'bg-rose-100 text-rose-800 border border-rose-200' };
}

export const MobilePmsSection: React.FC<MobilePmsSectionProps> = ({ pms, lang }) => {
  const isFa = lang === 'fa';
  const [showDetails, setShowDetails] = useState(false);

  // Extract strict Top-Level Items (1, 2, 3)
  const topLevelMap = new Map<string, SelectedPmsProgress>();
  (pms.topLevelProgress || []).forEach(item => {
    topLevelMap.set(normalizeWbsCode(item.wbsCode), item);
  });

  const topLevelList: SelectedPmsProgress[] = TOP_LEVEL_ORDER.map(code => {
    const found = topLevelMap.get(code);
    if (found) return found;
    return {
      wbsCode: code,
      wbsName: isFa ? `WBS ${code} (یافت نشد)` : `WBS ${code} (N/A)`,
      planned: null,
      actual: null,
      variance: null,
      missing: true
    };
  });

  // Extract strict Detail Items under WBS 2
  const detailMap = new Map<string, SelectedPmsProgress>();
  (pms.detailProgress || []).forEach(item => {
    detailMap.set(normalizeWbsCode(item.wbsCode), item);
  });

  const detailList: SelectedPmsProgress[] = DETAIL_ORDER.map(code => {
    const found = detailMap.get(code);
    if (found) return found;
    return {
      wbsCode: code,
      wbsName: isFa ? `WBS ${code} (یافت نشد)` : `WBS ${code} (N/A)`,
      planned: null,
      actual: null,
      variance: null,
      missing: true
    };
  });

  return (
    <div id="mobile-pms-section" className="mobile-pms-card bg-white border border-slate-200 rounded-xl p-3 shadow-xs mb-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <CalendarRange className="w-3.5 h-3.5 text-blue-700 shrink-0" />
          <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">
            {isFa ? 'پیشرفت ساختار شکست کار (PMS)' : 'PMS WBS PROGRESS'}
          </h2>
        </div>
        <span className="text-[9px] font-mono font-bold text-slate-500">
          Plan / Act / Var
        </span>
      </div>

      {/* Top-Level PMS Items */}
      <div className="space-y-2">
        {topLevelList.map(item => {
          const actVal = item.actual ?? 0;
          const planVal = item.planned ?? 0;
          const badge = getVarianceBadge(item.variance);

          return (
            <div
              key={item.wbsCode}
              className="bg-slate-50/80 border border-slate-200 rounded-lg p-2 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="px-1.5 py-0.5 bg-blue-900 text-white rounded font-mono font-bold text-[8.5px] shrink-0">
                    {item.wbsCode}
                  </span>
                  <span className="text-[10px] font-bold text-slate-900 truncate" title={item.wbsName}>
                    {item.wbsName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[9px] shrink-0">
                  <span className="text-slate-500 font-semibold" title={isFa ? 'برنامه' : 'Plan'}>
                    P: {item.planned !== null ? `${item.planned.toFixed(1)}%` : '—'}
                  </span>
                  <span className="text-blue-950 font-bold" title={isFa ? 'واقعی' : 'Actual'}>
                    A: {item.actual !== null ? `${item.actual.toFixed(1)}%` : '—'}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded font-bold text-[8.5px] ${badge.className}`}>
                    {badge.text}
                  </span>
                </div>
              </div>

              {/* Progress track */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex relative">
                {/* Plan background marker */}
                <div
                  className="bg-slate-400/40 h-full absolute top-0 right-0 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, planVal))}%` }}
                />
                {/* Actual bar */}
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 relative z-1"
                  style={{ width: `${Math.min(100, Math.max(0, actVal))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Expandable Accordion for Selected Detail Items under WBS 2 */}
      <div className="mt-2.5 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-blue-900 transition-colors cursor-pointer border border-slate-200"
        >
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            {isFa ? 'مشاهده جزئیات پیشرفت دیسیپلین‌ها (WBS Details)' : 'View Discipline Details (WBS 2)'}
          </span>
          {showDetails ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
        </button>

        {showDetails && (
          <div className="mt-2 space-y-1.5">
            {detailList.map(item => {
              const actVal = item.actual ?? 0;
              const badge = getVarianceBadge(item.variance);

              return (
                <div
                  key={item.wbsCode}
                  className="bg-slate-50/50 border border-slate-200 rounded-lg p-2 text-[9px]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-1 py-0.2 bg-slate-700 text-white rounded font-mono font-bold text-[7.5px] shrink-0">
                        {item.wbsCode}
                      </span>
                      <span className="font-semibold text-slate-800 truncate" title={item.wbsName}>
                        {item.wbsName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[8.5px] shrink-0">
                      <span className="text-slate-500">P: {item.planned !== null ? `${item.planned}%` : '—'}</span>
                      <span className="text-blue-900 font-bold">A: {item.actual !== null ? `${item.actual}%` : '—'}</span>
                      <span className={`px-1 py-0.2 rounded font-bold text-[8px] ${badge.className}`}>
                        {badge.text}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, actVal))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
