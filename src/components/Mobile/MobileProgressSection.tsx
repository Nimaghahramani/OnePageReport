import React from 'react';
import { PmsRecord, Language, MasterSCurveRecord } from '../../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { getPlannedAtDate } from '../../services/scurveEngine';
import { LineChart as LineChartIcon } from 'lucide-react';

interface MobileProgressSectionProps {
  pms: PmsRecord;
  masterSCurve?: MasterSCurveRecord;
  lang: Language;
}

export const MobileProgressSection: React.FC<MobileProgressSectionProps> = ({ pms, masterSCurve, lang }) => {
  const isFa = lang === 'fa';

  const plannedKey = isFa ? 'برنامه‌ای (Plan)' : 'Planned';
  const actualKey = isFa ? 'واقعی (Actual)' : 'Actual';

  // Build combined chart points
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

  // Monotonic validation on Actuals
  let runningMaxActual = 0;
  const currentDataDate = pms?.dataDate || '';

  const chartData = sortedDates.map(item => {
    let finalActual: number | undefined = undefined;

    if (item.fullDate <= currentDataDate && item.actual !== undefined && item.actual !== null && item.actual > 0) {
      if (item.actual >= runningMaxActual) {
        runningMaxActual = item.actual;
        finalActual = Number(item.actual.toFixed(2));
      } else {
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

  // Automatically sample / interval X-axis ticks to prevent clutter on mobile
  const interval = chartData.length > 12 ? Math.ceil(chartData.length / 6) : 0;

  return (
    <div id="mobile-progress-section" className="mobile-progress-card bg-white border border-slate-200 rounded-xl p-3 shadow-xs mb-2.5">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <LineChartIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">
            {isFa ? 'منحنی پیشرفت پروژه (S-Curve)' : 'PROJECT PROGRESS S-CURVE'}
          </h2>
        </div>
        <span className="text-[9px] text-slate-500 font-mono bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
          {isFa ? `Cut-off: ${pms.dataDate}` : `Cut-off: ${pms.dataDate}`}
        </span>
      </div>

      {/* Full-width Responsive Chart Container */}
      <div className="w-full min-w-0 h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              interval={interval}
              tick={{ fontSize: 8, fill: '#64748b' }}
              stroke="#e2e8f0"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 8, fill: '#64748b' }}
              stroke="#e2e8f0"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#061b3a',
                borderColor: 'rgba(125, 211, 252, 0.4)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '10px',
                padding: '4px 8px'
              }}
              itemStyle={{ padding: '0px' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '9px', paddingTop: '4px' }}
              iconType="plainline"
            />
            <Line
              type="monotone"
              dataKey={plannedKey}
              name={plannedKey}
              stroke="#94a3b8"
              strokeWidth={1.8}
              strokeDasharray="4 3"
              dot={{ r: 2, fill: '#94a3b8' }}
              activeDot={{ r: 4 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey={actualKey}
              name={actualKey}
              stroke="#2563eb"
              strokeWidth={2.2}
              dot={{ r: 2.5, fill: '#2563eb' }}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
