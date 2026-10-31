import React from 'react';
import { PmsRecord, Language, MasterSCurveRecord, SelectedPmsProgress } from '../../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { getPlannedAtDate } from '../../services/scurveEngine';
import { normalizeWbsCode } from '../../services/excelParser';

interface ProgressChartSectionProps {
  pms: PmsRecord;
  masterSCurve?: MasterSCurveRecord;
  lang: Language;
}

const TOP_LEVEL_ORDER = ['1', '2', '3'];
const DETAIL_ORDER = ['2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.9'];

function getVarianceBadge(v: number | null | undefined) {
  if (v === null || v === undefined) {
    return { text: '—', className: 'bg-slate-100 text-slate-500' };
  }
  const text = `${v > 0 ? '+' : ''}${v}%`;
  if (v >= 0) {
    return { text, className: 'bg-emerald-100 text-emerald-800' };
  }
  if (v >= -3) {
    return { text, className: 'bg-amber-100 text-amber-800' };
  }
  return { text, className: 'bg-rose-100 text-rose-800' };
}

export const ProgressChartSection: React.FC<ProgressChartSectionProps> = ({ pms, masterSCurve, lang }) => {
  const isFa = lang === 'fa';

  const plannedKey = isFa ? 'برنامه‌ای (Plan)' : 'Planned';
  const actualKey = isFa ? 'واقعی (Actual)' : 'Actual';

  // Build combined chart points
  // 1. Collect all dates from Master S-Curve and PMS history
  const dateMap = new Map<string, { fullDate: string; planned?: number | null; actual?: number | null }>();

  // Add Master S-Curve points as Planned baseline
  if (masterSCurve && Array.isArray(masterSCurve.points) && masterSCurve.points.length > 0) {
    masterSCurve.points.forEach(pt => {
      if (pt && pt.date) {
        dateMap.set(pt.date, {
          fullDate: pt.date,
          planned: typeof pt.planned === 'number' ? pt.planned : null,
          actual: null
        });
      }
    });
  }

  // Add Master S-Curve initialActualPoints if present
  if (masterSCurve && Array.isArray(masterSCurve.initialActualPoints)) {
    masterSCurve.initialActualPoints.forEach(pt => {
      if (pt && pt.dataDate) {
        const existing = dateMap.get(pt.dataDate);
        if (existing) {
          existing.actual = pt.actual;
        } else {
          const plannedVal = masterSCurve ? getPlannedAtDate(masterSCurve.points, pt.dataDate) : null;
          dateMap.set(pt.dataDate, {
            fullDate: pt.dataDate,
            planned: plannedVal,
            actual: pt.actual
          });
        }
      }
    });
  }

  // Add PMS Actual Historical observations
  const actualTrend = Array.isArray(pms?.historicalTrend) ? pms.historicalTrend : [];
  actualTrend.forEach(item => {
    if (!item || !item.dataDate) return;
    const existing = dateMap.get(item.dataDate);
    if (existing) {
      existing.actual = item.actual;
    } else {
      const plannedVal = masterSCurve ? getPlannedAtDate(masterSCurve.points, item.dataDate) : null;
      dateMap.set(item.dataDate, {
        fullDate: item.dataDate,
        planned: plannedVal,
        actual: item.actual
      });
    }
  });

  // Ensure current PMS date is represented
  if (pms?.dataDate) {
    const existing = dateMap.get(pms.dataDate);
    const currAct = pms.actualCumulative !== null && pms.actualCumulative !== undefined ? pms.actualCumulative : pms.actualProgress;
    if (existing) {
      existing.actual = currAct;
    } else {
      const plannedVal = masterSCurve ? getPlannedAtDate(masterSCurve.points, pms.dataDate) : null;
      dateMap.set(pms.dataDate, {
        fullDate: pms.dataDate,
        planned: plannedVal,
        actual: currAct
      });
    }
  }

  // Sort dates chronologically
  const sortedDates = Array.from(dateMap.values()).sort((a, b) => a.fullDate.localeCompare(b.fullDate));

  // Monotonic validation on Actuals: ensure no artificial drops in historical series
  let runningMaxActual = 0;
  const currentDataDate = pms?.dataDate || '';

  const chartData = sortedDates.map(item => {
    let finalActual: number | undefined = undefined;

    // Only assign actual for dates up to the current PMS Data Date
    if (item.fullDate <= currentDataDate && item.actual !== undefined && item.actual !== null && item.actual > 0) {
      if (item.actual >= runningMaxActual) {
        runningMaxActual = item.actual;
        finalActual = Number(item.actual.toFixed(2));
      } else {
        // Enforce monotonicity
        finalActual = Number(runningMaxActual.toFixed(2));
      }
    }

    return {
      name: item.fullDate.length >= 5 ? item.fullDate.substring(5) : item.fullDate,
      fullDate: item.fullDate,
      [plannedKey]: item.planned !== undefined && item.planned !== null ? Number(item.planned.toFixed(2)) : undefined,
      [actualKey]: finalActual
    };
  });

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

  // Extract strict Detail Items under WBS 2 (2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9)
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
    <div
      id="scurve-section"
      className="progress-chart-card relative overflow-hidden border border-indigo-300/90 rounded-lg bg-linear-to-br from-blue-50/50 via-white to-indigo-50/40 p-2 pt-2.5 shadow-2xs flex flex-col justify-between h-full print:break-inside-avoid print:border-indigo-300"
    >
      {/* Top Signature Accent Bar (Blue -> Indigo -> Cyan) */}
      <div
        className="absolute top-0 inset-x-0 h-1 bg-linear-to-l from-blue-700 via-indigo-600 to-sky-500 pointer-events-none select-none z-10"
        aria-hidden="true"
      />

      {/* Title */}
      <div className="flex items-center justify-between bg-linear-to-l from-blue-100/80 via-indigo-50/50 to-sky-50/35 -mx-2 -mt-2 px-2.5 pt-2 pb-1.5 mb-2 border-b border-indigo-200/80 rounded-t-lg">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <h2 className="text-[11.5px] font-extrabold text-blue-950 uppercase tracking-tight">
            {isFa ? (
              <>
                منحنی پیشرفت پروژه <span className="ltr-inline text-[10px] font-bold text-blue-700">(Master S-Curve vs Actual)</span>
              </>
            ) : (
              'MASTER S-CURVE VS ACTUAL TREND'
            )}
          </h2>
        </div>
        <span className="scurve-cutoff-label text-[10px] text-blue-950 bg-blue-100/90 border border-blue-300/80 px-2 py-0.5 rounded font-extrabold shadow-2xs">
          {isFa ? (
            <>
              تاریخ داده: <span className="ltr-inline font-extrabold font-tabular tabular-nums">{pms.dataDate}</span>
            </>
          ) : (
            `Cut-off: ${pms.dataDate}`
          )}
        </span>
      </div>

      <div className="grid grid-cols-12 gap-2 flex-1 items-stretch">
        {/* Left: Recharts Line / S-Curve Chart */}
        <div className="col-span-6 h-full min-h-[250px] relative bg-white/90 rounded-md border border-blue-200/80 p-1.5 flex flex-col justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 6, right: 10, left: -14, bottom: 2 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="var(--chart-grid, #e2e8f0)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10.5, fontWeight: 800, fill: 'var(--chart-axis, #1e293b)' }}
                stroke="var(--chart-axis-line, #cbd5e1)"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10.5, fontWeight: 800, fill: 'var(--chart-axis, #1e293b)' }}
                stroke="var(--chart-axis-line, #cbd5e1)"
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#061b3a', border: '1px solid rgba(125, 211, 252, 0.4)', borderRadius: '4px', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 8px' }}
                itemStyle={{ padding: '0px' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '10.5px', fontWeight: 800, paddingTop: '2px' }}
                iconType="plainline"
              />
              <Line
                type="monotone"
                dataKey={plannedKey}
                name={plannedKey}
                stroke="var(--line-plan, #64748b)"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={{ r: 2.2, fill: 'var(--line-plan, #64748b)' }}
                activeDot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey={actualKey}
                name={actualKey}
                stroke="var(--line-actual, #2563eb)"
                strokeWidth={2.5}
                dot={{ r: 2.6, fill: 'var(--line-actual, #2563eb)' }}
                activeDot={{ r: 4.5 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Right: PMS WBS Progress (Section A: Top-Level 1,2,3 & Section B: Details 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9) */}
        <div className="col-span-6 flex flex-col justify-between border-l rtl:border-l-0 rtl:border-r border-indigo-200/80 pl-2 rtl:pl-0 rtl:pr-2 overflow-hidden min-w-0">
          
          {/* SECTION A: Top-Level PMS Items (1, 2, 3) */}
          <div id="pms-top-level-section" className="pms-top-level-section mb-1.5 overflow-hidden">
            <div className="pms-header-row bg-indigo-100/85 px-2 py-1 rounded flex items-center justify-between border border-indigo-200/90">
              <span className="pms-header-title font-extrabold text-[10.5px] text-blue-950">{isFa ? 'پیشرفت کلان PMS' : 'Top-Level PMS'}</span>
              <span className="pms-header-sub text-[9.5px] text-indigo-900 font-tabular tabular-nums font-extrabold ltr-inline">Plan / Act / Var</span>
            </div>

            <div className="space-y-1 mt-1">
              {topLevelList.map((item) => {
                const actVal = item.actual ?? 0;
                const badge = getVarianceBadge(item.variance);

                return (
                  <div key={item.wbsCode} className="pms-discipline-row space-y-0.5 bg-blue-50/55 px-1.5 py-1 rounded border border-blue-200/85 overflow-hidden">
                    <div className="flex items-center justify-between gap-1 text-slate-900 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="pms-wbs-tag px-1.5 py-0.2 bg-blue-900 text-white rounded font-tabular tabular-nums font-extrabold text-[10px] shrink-0">
                          {item.wbsCode}
                        </span>
                        <span className="pms-wbs-name truncate text-[11px] font-extrabold text-blue-950" title={item.wbsName}>
                          {item.wbsName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-tabular tabular-nums shrink-0 whitespace-nowrap">
                        <span className="pms-plan-val text-[10.5px] font-bold text-slate-600 ltr-inline">
                          {item.planned !== null ? `${item.planned}%` : '—'}
                        </span>
                        <span className="pms-actual-val text-[12px] font-extrabold text-blue-950 tracking-tight ltr-inline">
                          {item.actual !== null ? `${item.actual}%` : '—'}
                        </span>
                        <span className={`pms-variance-badge px-1 py-0.2 rounded text-[10.5px] font-extrabold tracking-tight ltr-inline min-w-[48px] text-center ${badge.className}`}>
                          {badge.text}
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="pms-progress-track w-full bg-blue-200/70 h-1.5 rounded-full overflow-hidden flex">
                      <div
                        className="pms-progress-fill bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, actVal))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION B: Selected Details under WBS 2 (2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9) */}
          <div id="pms-details-section" className="pms-details-section overflow-hidden">
            <div className="pms-header-row bg-slate-100/95 px-2 py-1 rounded flex items-center justify-between border border-slate-300/80">
              <span className="pms-header-title font-extrabold text-[10.5px] text-blue-950">{isFa ? 'جزئیات منتخب WBS 2' : 'Selected WBS 2 Details'}</span>
              <span className="pms-header-sub text-[9.5px] text-slate-700 font-tabular tabular-nums font-extrabold ltr-inline">Plan / Act / Var</span>
            </div>

            <div className="divide-y divide-slate-200/70 mt-0.5 border border-slate-200/80 rounded bg-white/95 overflow-hidden">
              {detailList.map((item) => {
                const actVal = item.actual ?? 0;
                const badge = getVarianceBadge(item.variance);

                return (
                  <div key={item.wbsCode} className="pms-detail-row space-y-0.5 py-0.5 px-1.5 even:bg-slate-50/75 hover:bg-blue-50/35 overflow-hidden">
                    <div className="flex items-center justify-between gap-1 text-slate-900 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="pms-wbs-code text-indigo-900 font-tabular tabular-nums font-extrabold text-[10.5px] w-6 text-center shrink-0 ltr-inline">
                          {item.wbsCode}
                        </span>
                        <span className="pms-wbs-name truncate text-[10.5px] font-extrabold text-blue-950" title={item.wbsName}>
                          {item.wbsName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-tabular tabular-nums shrink-0 whitespace-nowrap">
                        <span className="pms-plan-val text-[10px] font-bold text-slate-600 ltr-inline">
                          {item.planned !== null ? `${item.planned}%` : '—'}
                        </span>
                        <span className="pms-actual-val text-[11.5px] font-extrabold text-blue-950 tracking-tight ltr-inline">
                          {item.actual !== null ? `${item.actual}%` : '—'}
                        </span>
                        <span className={`pms-variance-badge px-1 py-0.1 rounded text-[10px] font-extrabold tracking-tight ltr-inline min-w-[48px] text-center ${badge.className}`}>
                          {badge.text}
                        </span>
                      </div>
                    </div>
                    {/* Compact Mini Progress Bar */}
                    <div className="pms-progress-track w-full bg-slate-200/80 h-1 rounded-full overflow-hidden flex">
                      <div
                        className="pms-progress-fill bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, actVal))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
