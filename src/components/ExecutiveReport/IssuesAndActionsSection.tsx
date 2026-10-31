import React from 'react';
import { DailyReportRecord, Language, EXECUTIVE_REPORT_CONFIG } from '../../types';
import { AlertOctagon, ArrowUpRight, CheckCircle2, ChevronRight } from 'lucide-react';

interface IssuesAndActionsSectionProps {
  daily: DailyReportRecord;
  lang: Language;
}

export const IssuesAndActionsSection: React.FC<IssuesAndActionsSectionProps> = ({ daily, lang }) => {
  const isFa = lang === 'fa';

  const issues = (daily.keyIssues || []).filter(
    item => item && (item.issueFa?.trim() || item.issueEn?.trim())
  );
  
  const rawActivities = (daily.importantActivities && daily.importantActivities.length > 0)
    ? daily.importantActivities
    : (daily.workPerformedToday && daily.workPerformedToday.length > 0)
      ? daily.workPerformedToday.map((w, idx) => ({
          id: w.id || `w-${idx}`,
          sequence: idx + 1,
          description: isFa ? w.textFa : (w.textEn || w.textFa),
          sourceFile: '',
          sourceSheet: '',
          sourceRow: 0
        }))
      : [];

  const displayedActivities = rawActivities
    .filter(item => item.description?.trim())
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
    .slice(0, 6);

  const decisions = daily.managementDecisionsRequired || [];

  return (
    <div className="grid grid-cols-12 gap-2 h-full print:grid print:grid-cols-12 print:break-inside-avoid">
      {/* Key Issues & Constraints (7 cols) */}
      <div
        id="issues-section"
        className="key-issues-card relative overflow-hidden col-span-7 border border-rose-300/90 rounded-lg bg-linear-to-br from-rose-50/60 via-white to-orange-50/45 p-2 pt-2.5 shadow-2xs flex flex-col justify-between print:break-inside-avoid print:border-rose-300"
      >
        {/* Top Signature Accent Bar (Rose -> Crimson -> Amber) */}
        <div
          className="absolute top-0 inset-x-0 h-1 bg-linear-to-l from-rose-600 via-rose-500 to-amber-500 pointer-events-none select-none z-10"
          aria-hidden="true"
        />

        <div className="flex items-center justify-between bg-linear-to-l from-rose-100/85 via-rose-50/60 to-amber-50/40 -mx-2 -mt-2 px-2.5 pt-2 pb-1.5 mb-2 border-b border-rose-200/90 rounded-t-lg">
          <div className="flex items-center gap-1.5">
            <span className="p-0.5 rounded bg-rose-100 border border-rose-300/80 text-rose-700 shadow-2xs">
              <AlertOctagon className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-[11.5px] font-extrabold text-rose-950 uppercase tracking-tight">
              {isFa ? 'موانع، مشکلات و ریسک‌های کلیدی پروژه' : 'KEY ISSUES & CONSTRAINTS'}
            </h2>
          </div>
          <span className="issues-active-badge text-[10px] font-extrabold font-tabular tabular-nums text-rose-950 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded shadow-2xs">
            {issues.length} {isFa ? 'مورد فعال' : 'Active Items'}
          </span>
        </div>

        <div className="space-y-1.5 text-[11px] flex-1 flex flex-col justify-center">
          {issues.length === 0 ? (
            <div className="p-3 text-center text-slate-600 font-bold text-[11px] bg-white/80 rounded border border-rose-200">
              {isFa ? 'موردی در گزارش روزانه ثبت نشده است' : 'No issues recorded in daily report'}
            </div>
          ) : (
            issues.map((item, idx) => {
              const isEven = idx % 2 === 1;
              return (
                <div
                  key={item.id || idx}
                  className={`issue-item-card p-1.5 px-2.5 rounded-md flex items-center justify-between gap-2 border shadow-2xs min-w-0 overflow-hidden ${
                    isEven
                      ? 'bg-linear-to-l from-amber-50/90 via-orange-50/45 to-white border-amber-300/85 border-r-3 border-r-amber-500'
                      : 'bg-linear-to-l from-rose-50/90 via-rose-50/45 to-white border-rose-300/85 border-r-3 border-r-rose-500'
                  }`}
                >
                  {/* Clean Issue Presentation: Number + Description */}
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span
                      className={`issue-num px-1.5 py-0.5 rounded font-tabular tabular-nums font-extrabold text-[10.5px] shrink-0 mt-0.2 border ltr-inline ${
                        isEven
                          ? 'text-amber-950 bg-amber-100/95 border-amber-300'
                          : 'text-rose-950 bg-rose-100/95 border-rose-300'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <span className="issue-text font-extrabold text-blue-950 leading-snug text-[11.5px]">
                      {isFa ? item.issueFa : (item.issueEn || item.issueFa)}
                    </span>
                  </div>
                  {item.severity && (
                    <span
                      className={`shrink-0 px-1.5 py-0.5 rounded text-[9.5px] font-extrabold uppercase ${
                        item.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {item.severity}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Activities & Management Decisions (5 cols) */}
      <div
        id="activities-section"
        className="activities-decisions-card relative overflow-hidden col-span-5 border border-teal-300/90 rounded-lg bg-linear-to-br from-teal-50/60 via-white to-blue-50/50 p-2 pt-2.5 shadow-2xs flex flex-col justify-between print:break-inside-avoid print:border-teal-300"
      >
        {/* Top Signature Accent Bar (Blue -> Teal -> Emerald) */}
        <div
          className="absolute top-0 inset-x-0 h-1 bg-linear-to-l from-blue-700 via-teal-600 to-emerald-600 pointer-events-none select-none z-10"
          aria-hidden="true"
        />

        <div className="flex items-center justify-between bg-linear-to-l from-blue-100/80 via-teal-50/60 to-emerald-50/45 -mx-2 -mt-2 px-2.5 pt-2 pb-1.5 mb-2 border-b border-teal-200/90 rounded-t-lg">
          <div className="flex items-center gap-1.5">
            <span className="p-0.5 rounded bg-blue-100 border border-blue-300/80 text-blue-700 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-[11.5px] font-extrabold text-blue-950 uppercase tracking-tight">
              {isFa ? 'فعالیت‌های مهم و تصمیمات مدیریتی' : 'KEY ACTIVITIES & DECISIONS'}
            </h2>
          </div>
          {displayedActivities.length > 0 && (
            <span className="activities-count-badge text-[10px] font-extrabold font-tabular tabular-nums text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 shadow-2xs">
              {displayedActivities.length} {isFa ? 'فعالیت کلیدی' : 'Key Items'}
            </span>
          )}
        </div>

        <div className="space-y-1.5 text-[11px] flex-1 flex flex-col justify-between">
          {/* Completed Work Today */}
          <div>
            <div className="flex items-center justify-between mb-1.5 bg-teal-50/90 border border-teal-200/80 rounded px-2 py-0.5">
              <span className="activities-heading text-[10.5px] font-extrabold text-teal-950 uppercase block">
                {isFa ? 'فعالیت‌های مهم انجام‌شده در ماه اخیر:' : 'Key Work Completed (Past Month):'}
              </span>
            </div>
            {displayedActivities.length > 0 && (
              <ul className="space-y-1 pr-0.5">
                {displayedActivities.map((w, idx) => (
                  <li
                    key={w.id || idx}
                    className="activity-item-card flex items-center gap-1.5 text-slate-900 bg-linear-to-l from-emerald-50/95 via-teal-50/50 to-white p-1 px-2 rounded-md border border-emerald-300/85 border-r-3 border-r-emerald-600 shadow-2xs min-w-0 overflow-hidden"
                  >
                    <span className="activity-check-icon inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-black text-[9px] shrink-0">
                      ✓
                    </span>
                    <span className="activity-text leading-snug text-[11px] font-extrabold text-blue-950 truncate" title={w.description}>{w.description}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Urgent Management Decisions */}
          {decisions.length > 0 && (
            <div className="pt-1 border-t border-teal-200/80">
              <span className="decisions-heading text-[10px] font-extrabold text-blue-950 uppercase block mb-0.5">
                {isFa ? 'اقدامات و تصمیمات مورد نیاز مدیریت:' : 'Required Management Decisions:'}
              </span>
              <ul className="space-y-1">
                {decisions.map((d, idx) => (
                  <li
                    key={d.id || idx}
                    className="decision-item-card flex items-start gap-1.5 text-slate-900 bg-linear-to-l from-blue-50/90 to-white p-1 px-2 rounded-md border border-blue-300/85 border-r-3 border-r-blue-600 shadow-2xs min-w-0 overflow-hidden"
                  >
                    <ArrowUpRight className="decision-arrow-icon w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                    <div className="leading-tight min-w-0">
                      <span className="decision-text font-extrabold text-[11px] text-blue-950">{isFa ? d.titleFa : d.titleEn}</span>
                      {d.targetParty && (
                        <span className="decision-meta text-slate-600 text-[9.5px] font-bold block">
                          {isFa ? `مرجع: ${d.targetParty} ${d.deadline ? `| مهلت: ${d.deadline}` : ''}` : `Target: ${d.targetParty} ${d.deadline ? `| Due: ${d.deadline}` : ''}`}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
