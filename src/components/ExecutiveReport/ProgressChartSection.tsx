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
    <div id="scurve-section" className="progress-chart-card border border-slate-250 rounded bg-white p-2 shadow-2xs flex flex-col justify-between h-full">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <h2 className="text-[10.5px] font-bold text-slate-900 uppercase tracking-tight">
            {isFa ? (
              <>
                منحنی پیشرفت پروژه <span className="ltr-inline text-[9.5px] font-semibold text-slate-500">(Master S-Curve vs Actual)</span>
              </>
            ) : (
              'MASTER S-CURVE VS ACTUAL TREND'
            )}
          </h2>
        </div>
        <span className="scurve-cutoff-label text-[9px] text-slate-500 font-medium">
          {isFa ? (
            <>
              تاریخ داده: <span className="ltr-inline font-bold">{pms.dataDate}</span>
            </>
          ) : (
            `Cut-off: ${pms.dataDate}`
          )}
        </span>
      </div>

      <div className="grid grid-cols-12 gap-2 flex-1 items-stretch">
        {/* Left: Recharts Line / S-Curve Chart */}
        <div className="col-span-6 h-48 min-h-[180px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="var(--chart-grid, #f1f5f9)" />
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: 'var(--chart-axis, #64748b)' }} stroke="var(--chart-axis-line, #e2e8f0)" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: 'var(--chart-axis, #64748b)' }} stroke="var(--chart-axis-line, #e2e8f0)" />
              <Tooltip
                contentStyle={{ backgroundColor: '#061b3a', border: '1px solid rgba(125, 211, 252, 0.4)', borderRadius: '4px', color: '#fff', fontSize: '9.5px', padding: '4px 8px' }}
                itemStyle={{ padding: '0px' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '8.5px', paddingTop: '2px' }}
                iconType="plainline"
              />
              <Line
                type="monotone"
                dataKey={plannedKey}
                name={plannedKey}
                stroke="var(--line-plan, #94a3b8)"
                strokeWidth={1.8}
                strokeDasharray="4 3"
                dot={{ r: 2, fill: 'var(--line-plan, #94a3b8)' }}
                activeDot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey={actualKey}
                name={actualKey}
                stroke="var(--line-actual, #2563eb)"
                strokeWidth={2.2}
                dot={{ r: 2.5, fill: 'var(--line-actual, #2563eb)' }}
                activeDot={{ r: 4 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Right: PMS WBS Progress (Section A: Top-Level 1,2,3 & Section B: Details 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9) */}
        <div className="col-span-6 flex flex-col justify-start text-[8.5px] border-l rtl:border-l-0 rtl:border-r border-slate-200 pl-2 rtl:pl-0 rtl:pr-2 overflow-y-auto max-h-52">
          
          {/* SECTION A: Top-Level PMS Items (1, 2, 3) */}
          <div id="pms-top-level-section" className="pms-top-level-section mb-1.5">
            <div className="pms-header-row bg-slate-100/90 px-1.5 py-0.5 rounded flex items-center justify-between border-b border-slate-200">
              <span className="pms-header-title font-extrabold text-[8.5px] text-slate-800">{isFa ? 'پیشرفت کلان PMS' : 'Top-Level PMS'}</span>
              <span className="pms-header-sub text-[7.5px] text-slate-500 font-mono">Plan / Act / Var</span>
            </div>

            <div className="space-y-1 mt-1">
              {topLevelList.map((item) => {
                const actVal = item.actual ?? 0;
                const badge = getVarianceBadge(item.variance);

                return (
                  <div key={item.wbsCode} className="pms-discipline-row space-y-0.5 bg-slate-50/70 p-1 rounded border border-slate-150">
                    <div className="flex items-center justify-between font-medium text-slate-800">
                      <div className="flex items-center gap-1 min-w-0 max-w-[130px]">
                        <span className="pms-wbs-tag px-1 py-0.2 bg-blue-900 text-white rounded font-mono font-bold text-[7.5px] shrink-0">
                          {item.wbsCode}
                        </span>
                        <span className="pms-wbs-name truncate text-[8px] font-bold text-slate-800" title={item.wbsName}>
                          {item.wbsName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[7.5px] shrink-0">
                        <span className="pms-plan-val text-slate-500">{item.planned !== null ? `${item.planned}%` : '—'}</span>
                        <span className="pms-actual-val font-bold text-blue-900">{item.actual !== null ? `${item.actual}%` : '—'}</span>
                        <span className={`pms-variance-badge px-1 py-0.2 rounded text-[7.5px] font-bold ${badge.className}`}>
                          {badge.text}
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="pms-progress-track w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
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
          <div id="pms-details-section" className="pms-details-section">
            <div className="pms-header-row bg-slate-100/90 px-1.5 py-0.5 rounded flex items-center justify-between border-b border-slate-200">
              <span className="pms-header-title font-extrabold text-[8.5px] text-slate-800">{isFa ? 'جزئیات منتخب WBS 2' : 'Selected WBS 2 Details'}</span>
              <span className="pms-header-sub text-[7.5px] text-slate-500 font-mono">Plan / Act / Var</span>
            </div>

            <div className="space-y-0.5 mt-1">
              {detailList.map((item) => {
                const actVal = item.actual ?? 0;
                const badge = getVarianceBadge(item.variance);

                return (
                  <div key={item.wbsCode} className="pms-detail-row space-y-0.5 py-0.5 px-1 hover:bg-slate-50 rounded">
                    <div className="flex items-center justify-between font-medium text-slate-800">
                      <div className="flex items-center gap-1 min-w-0 max-w-[130px]">
                        <span className="pms-wbs-code text-slate-500 font-mono font-bold text-[7.5px] w-4 text-center shrink-0">
                          {item.wbsCode}
                        </span>
                        <span className="pms-wbs-name truncate text-[7.5px] text-slate-700" title={item.wbsName}>
                          {item.wbsName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[7px] shrink-0">
                        <span className="pms-plan-val text-slate-400">{item.planned !== null ? `${item.planned}%` : '—'}</span>
                        <span className="pms-actual-val font-bold text-blue-900">{item.actual !== null ? `${item.actual}%` : '—'}</span>
                        <span className={`pms-variance-badge px-1 py-0.2 rounded text-[7px] font-bold ${badge.className}`}>
                          {badge.text}
                        </span>
                      </div>
                    </div>
                    {/* Compact Mini Progress Bar */}
                    <div className="pms-progress-track w-full bg-slate-100 h-1 rounded-full overflow-hidden flex">
                      <div
                        className="pms-progress-fill bg-blue-500 h-full rounded-full transition-all duration-300"
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
