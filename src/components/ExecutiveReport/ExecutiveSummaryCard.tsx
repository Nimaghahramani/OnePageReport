import React from 'react';
import { CalculatedReportKPIs, DailyReportRecord, ConstructionProgressItem, Language } from '../../types';
import { FileText, TrendingUp, Layers } from 'lucide-react';

interface ExecutiveSummaryCardProps {
  kpis: CalculatedReportKPIs;
  daily?: DailyReportRecord;
  lang: Language;
}

const DEFAULT_CONSTRUCTION_ITEMS: ConstructionProgressItem[] = [
  {
    id: 1,
    activity: 'انجام فیت‌اپ (Fit Up) پایپینگ',
    activityEn: 'Piping Fit-Up (Fit Up)',
    unit: 'ID',
    total: 14585,
    completed: 7333,
    remaining: 7252,
    progressPercent: 50.28,
    sourceSheet: 'Construction (2)',
    sourceRow: 14
  },
  {
    id: 2,
    activity: 'انجام جوش (WELD) پایپینگ',
    activityEn: 'Piping Welding (WELD)',
    unit: 'ID',
    total: 13479,
    completed: 5859,
    remaining: 7620,
    progressPercent: 43.47,
    sourceSheet: 'Construction (2)',
    sourceRow: 20
  },
  {
    id: 3,
    activity: 'عملیات Cabling',
    activityEn: 'Cabling Works',
    unit: 'M',
    total: 36165,
    completed: 0,
    remaining: 36165,
    progressPercent: 0,
    sourceSheet: 'Construction (2)',
    sourceRow: 26
  },
  {
    id: 4,
    activity: 'عملیات هیدروتست پایپینگ',
    activityEn: 'Piping Hydrotest',
    unit: 'IM',
    total: 12638,
    completed: 900,
    remaining: 11738,
    progressPercent: 7.12,
    sourceSheet: 'Construction (2)',
    sourceRow: 27
  }
];

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({ kpis, daily, lang }) => {
  const isFa = lang === 'fa';
  const rawLines = isFa ? (kpis.executiveSummaryLinesFa || []) : (kpis.executiveSummaryLinesEn || []);
  const lines = rawLines.filter(
    (line) =>
      typeof line === 'string' &&
      line.trim().length > 0 &&
      !line.includes('undefined') &&
      !line.includes('NaN') &&
      !line.includes('null') &&
      !line.includes('N/A%')
  );

  const constructionItems: ConstructionProgressItem[] =
    daily?.constructionItems && daily.constructionItems.length > 0
      ? daily.constructionItems
      : DEFAULT_CONSTRUCTION_ITEMS;

  if (lines.length === 0 && constructionItems.length === 0) {
    return null;
  }

  return (
    <div
      id="executive-summary-section"
      className="executive-summary-card relative overflow-hidden border border-blue-300/90 bg-linear-to-r from-blue-50/65 via-indigo-50/40 to-blue-50/65 rounded-lg p-2 pt-2.5 shadow-2xs mb-2 print:break-inside-avoid print:border-blue-300"
    >
      {/* Top Signature Accent Bar (Indigo -> Blue -> Sky) */}
      <div
        className="absolute top-0 inset-x-0 h-1 bg-linear-to-l from-indigo-700 via-blue-600 to-sky-500 pointer-events-none select-none z-10"
        aria-hidden="true"
      />

      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-blue-200/80 pb-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="p-0.5 rounded bg-blue-100/90 text-blue-700 border border-blue-200/80">
            <FileText className="w-4 h-4" />
          </span>
          <h2 className="executive-summary-title text-[12px] font-extrabold text-blue-950 uppercase tracking-tight">
            {isFa ? (
              <>
                خلاصه مدیریتی و احجام اجرایی کارگاه{' '}
                <span className="ltr-inline text-[10.5px] font-bold text-blue-700">(Executive Summary & Construction Data)</span>
              </>
            ) : (
              'EXECUTIVE MANAGEMENT SUMMARY & CONSTRUCTION DATA'
            )}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9.5px] font-tabular tabular-nums font-extrabold text-indigo-950 bg-indigo-100/90 border border-indigo-200/80 px-2 py-0.5 rounded">
            {isFa ? 'برگه مرجع: Construction (2)' : 'Ref Sheet: Construction (2)'}
          </span>
          <span className="executive-summary-badge text-[10px] font-extrabold text-blue-950 bg-blue-100/90 border border-blue-200/80 px-2 py-0.5 rounded">
            {isFa ? 'تحلیل داده‌های پروژه' : 'Data-Driven Synthesis'}
          </span>
        </div>
      </div>

      {/* Card Body: 2-Column Split (Executive Bullets + Construction Quantities Table) */}
      <div className="grid grid-cols-12 gap-2.5 print:grid print:grid-cols-12 print:gap-2 items-stretch">
        {/* Column 1: Executive Management Bullets */}
        <div className="col-span-12 lg:col-span-5 print:col-span-5 space-y-1.5 text-[11.5px] text-slate-900 leading-relaxed bg-white/95 border border-blue-200/90 rounded-md p-2.5 flex flex-col justify-center min-w-0 overflow-hidden">
          {lines.map((line, idx) => (
            <div key={idx} className="flex items-start gap-2 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
              <p className="flex-1 font-extrabold text-blue-950 leading-snug">{line}</p>
            </div>
          ))}
        </div>

        {/* Column 2: Construction (2) Specified Items Table - Full Visibility with Zero Scrollbars */}
        <div className="col-span-12 lg:col-span-7 print:col-span-7 bg-white/95 border border-indigo-200/90 rounded-md p-2 shadow-2xs flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-1 mb-1.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-700 shrink-0" />
              <h3 className="text-[11.5px] font-extrabold text-blue-950">
                {isFa ? 'احجام و پیشرفت فعالیت‌های اجرایی کارگاه' : 'Key Construction Progress & Quantities'}
              </h3>
            </div>
            <span className="text-[9.5px] font-tabular tabular-nums font-extrabold text-indigo-950 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
              {isFa ? 'برگه Construction (2)' : 'Construction (2)'}
            </span>
          </div>

          <div className="w-full overflow-hidden">
            <table className="construction-table w-full table-fixed text-right rtl:text-right ltr:text-left border-collapse rounded overflow-hidden">
              <thead>
                <tr className="border-b-2 border-indigo-200/90 text-blue-950 font-extrabold bg-indigo-50/90 text-[11px]">
                  <th className="py-1.5 px-2 w-[35%] whitespace-nowrap">{isFa ? 'شرح فعالیت' : 'Activity'}</th>
                  <th className="py-1.5 px-1 text-center w-[10%] whitespace-nowrap">{isFa ? 'واحد' : 'Unit'}</th>
                  <th className="py-1.5 px-1.5 text-center w-[13.5%] whitespace-nowrap">{isFa ? 'کل' : 'Total'}</th>
                  <th className="py-1.5 px-1.5 text-center w-[14%] text-emerald-900 whitespace-nowrap">{isFa ? 'اقدام‌شده' : 'Done'}</th>
                  <th className="py-1.5 px-1.5 text-center w-[14%] text-amber-900 whitespace-nowrap">{isFa ? 'باقیمانده' : 'Remain'}</th>
                  <th className="py-1.5 px-1.5 text-center w-[13.5%] whitespace-nowrap">{isFa ? 'پیشرفت' : 'Progress'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {constructionItems.map((item, idx) => {
                  const pct =
                    item.progressPercent !== null && item.progressPercent !== undefined
                      ? item.progressPercent
                      : item.total > 0
                      ? Number(((item.completed / item.total) * 100).toFixed(1))
                      : 0;

                  const displayPct = pct % 1 === 0 ? `${pct}%` : `${pct.toFixed(1)}%`;

                  let badgeStyle = 'bg-slate-100 text-slate-800 border-slate-300 font-extrabold';
                  if (pct >= 40) {
                    badgeStyle = 'bg-emerald-100/90 text-emerald-950 border-emerald-300 font-extrabold';
                  } else if (pct > 0) {
                    badgeStyle = 'bg-blue-100/90 text-blue-950 border-blue-300 font-extrabold';
                  }

                  return (
                    <tr key={item.id || idx} className="even:bg-slate-50/80 hover:bg-blue-50/40">
                      <td className="py-1.5 px-2 font-sans text-blue-950 font-extrabold text-[11.5px] truncate" title={isFa ? item.activity : item.activityEn || item.activity}>
                        {isFa ? item.activity : item.activityEn || item.activity}
                      </td>
                      <td className="py-1.5 px-1 text-center font-extrabold text-slate-700 text-[10.5px] whitespace-nowrap">
                        {item.unit}
                      </td>
                      <td className="py-1.5 px-1.5 text-center font-extrabold text-blue-950 text-[13px] font-tabular tabular-nums tracking-tight whitespace-nowrap col-qty">
                        <span className="ltr-inline">{item.total.toLocaleString('en-US')}</span>
                      </td>
                      <td className="py-1.5 px-1.5 text-center font-extrabold text-emerald-800 text-[13px] font-tabular tabular-nums tracking-tight whitespace-nowrap col-qty">
                        <span className="ltr-inline">{item.completed.toLocaleString('en-US')}</span>
                      </td>
                      <td className="py-1.5 px-1.5 text-center font-extrabold text-amber-800 text-[13px] font-tabular tabular-nums tracking-tight whitespace-nowrap col-qty">
                        <span className="ltr-inline">{item.remaining.toLocaleString('en-US')}</span>
                      </td>
                      <td className="py-1.5 px-1.5 text-center whitespace-nowrap col-percent">
                        <span
                          className={`inline-flex items-center justify-center min-w-[54px] px-1.5 py-0.5 rounded border text-[11.5px] font-tabular tabular-nums tracking-tight ltr-inline whitespace-nowrap ${badgeStyle}`}
                        >
                          {displayPct}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
