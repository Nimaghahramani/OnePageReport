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
    <div id="executive-summary-section" className="executive-summary-card border border-blue-200 bg-blue-50/50 rounded p-2 shadow-2xs mb-2 print:break-inside-avoid print:bg-blue-50/70 print:border-blue-200">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-blue-200/80 pb-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-blue-700" />
          <h2 className="executive-summary-title text-[11px] font-bold text-blue-950 uppercase tracking-tight">
            {isFa ? (
              <>
                خلاصه مدیریتی و احجام اجرایی کارگاه <span className="ltr-inline text-[9.5px] font-semibold text-blue-800">(Executive Summary & Construction Data)</span>
              </>
            ) : (
              'EXECUTIVE MANAGEMENT SUMMARY & CONSTRUCTION DATA'
            )}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-mono font-semibold text-blue-800 bg-blue-100/90 px-1.5 py-0.2 rounded">
            {isFa ? 'برگه مرجع: Construction (2)' : 'Ref Sheet: Construction (2)'}
          </span>
          <span className="executive-summary-badge text-[8.5px] font-bold text-blue-800 bg-blue-100/80 px-1.5 py-0.2 rounded">
            {isFa ? 'تحلیل داده‌های پروژه' : 'Data-Driven Synthesis'}
          </span>
        </div>
      </div>

      {/* Card Body: 2-Column Split (Executive Bullets + Construction Quantities Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 print:grid print:grid-cols-12 print:gap-2 items-start">
        {/* Column 1: Executive Management Bullets */}
        <div className="lg:col-span-5 print:col-span-5 space-y-1.5 text-[9.5px] text-slate-800 leading-relaxed font-normal">
          {lines.map((line, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
              <p className="flex-1 font-medium">{line}</p>
            </div>
          ))}
        </div>

        {/* Column 2: Construction (2) Specified Items Table - Full Visibility with Zero Scrollbars */}
        <div className="lg:col-span-7 print:col-span-7 bg-white/95 border border-blue-200/90 rounded-md p-2 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-200/90 pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <h3 className="text-[10px] font-bold text-slate-900">
                {isFa ? 'احجام و پیشرفت فعالیت‌های اجرایی کارگاه' : 'Key Construction Progress & Quantities'}
              </h3>
            </div>
            <span className="text-[8.5px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
              {isFa ? 'برگه Construction (2)' : 'Construction (2)'}
            </span>
          </div>

          <div className="w-full overflow-x-auto lg:overflow-visible">
            <table className="w-full text-right rtl:text-right ltr:text-left border-collapse text-[9px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50/90">
                  <th className="py-1 px-1.5 whitespace-nowrap">{isFa ? 'شرح فعالیت' : 'Activity'}</th>
                  <th className="py-1 px-1.5 text-center w-10 whitespace-nowrap">{isFa ? 'واحد' : 'Unit'}</th>
                  <th className="py-1 px-1.5 text-center w-16 whitespace-nowrap">{isFa ? 'کل' : 'Total'}</th>
                  <th className="py-1 px-1.5 text-center w-16 text-emerald-800 whitespace-nowrap">{isFa ? 'اقدام‌شده' : 'Done'}</th>
                  <th className="py-1 px-1.5 text-center w-16 text-slate-600 whitespace-nowrap">{isFa ? 'باقیمانده' : 'Remain'}</th>
                  <th className="py-1 px-1.5 text-center w-16 whitespace-nowrap">{isFa ? 'پیشرفت' : 'Progress'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {constructionItems.map((item, idx) => {
                  const pct =
                    item.progressPercent !== null && item.progressPercent !== undefined
                      ? item.progressPercent
                      : (item.total > 0 ? Number(((item.completed / item.total) * 100).toFixed(1)) : 0);

                  const displayPct = pct % 1 === 0 ? `${pct}%` : `${pct.toFixed(1)}%`;

                  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (pct >= 40) {
                    badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
                  } else if (pct > 0) {
                    badgeStyle = 'bg-blue-50 text-blue-800 border-blue-200 font-bold';
                  }

                  return (
                    <tr key={item.id || idx} className="hover:bg-blue-50/40">
                      <td className="py-1 px-1.5 font-sans text-slate-900 font-bold text-[9px] whitespace-nowrap">
                        {isFa ? item.activity : (item.activityEn || item.activity)}
                      </td>
                      <td className="py-1 px-1.5 text-center font-bold text-slate-600 whitespace-nowrap">{item.unit}</td>
                      <td className="py-1 px-1.5 text-center text-slate-700 whitespace-nowrap">
                        {item.total.toLocaleString(isFa ? 'fa-IR' : 'en-US')}
                      </td>
                      <td className="py-1 px-1.5 text-center font-bold text-emerald-700 whitespace-nowrap">
                        {item.completed.toLocaleString(isFa ? 'fa-IR' : 'en-US')}
                      </td>
                      <td className="py-1 px-1.5 text-center text-slate-600 whitespace-nowrap">
                        {item.remaining.toLocaleString(isFa ? 'fa-IR' : 'en-US')}
                      </td>
                      <td className="py-1 px-1.5 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center min-w-[46px] px-1.5 py-0.5 rounded border text-[8.5px] font-bold font-mono tracking-tight whitespace-nowrap ${badgeStyle}`}>
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
