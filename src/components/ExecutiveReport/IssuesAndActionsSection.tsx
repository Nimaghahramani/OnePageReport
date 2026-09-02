import React from 'react';
import { DailyReportRecord, Language, EXECUTIVE_REPORT_CONFIG } from '../../types';
import { AlertOctagon, ArrowUpRight, CheckCircle2, ChevronRight } from 'lucide-react';

interface IssuesAndActionsSectionProps {
  daily: DailyReportRecord;
  lang: Language;
}

export const IssuesAndActionsSection: React.FC<IssuesAndActionsSectionProps> = ({ daily, lang }) => {
  const isFa = lang === 'fa';

  const issues = (daily.keyIssues || []).slice(0, 3);
  
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
    .slice(0, 4);

  const decisions = daily.managementDecisionsRequired || [];

  return (
    <div className="grid grid-cols-12 gap-2 h-full">
      {/* Key Issues & Constraints (7 cols) */}
      <div id="issues-section" className="key-issues-card col-span-7 border border-slate-250 rounded bg-white p-2 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1.5">
          <div className="flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            <h2 className="text-[10.5px] font-bold text-slate-900 uppercase tracking-tight">
              {isFa ? 'موانع، مشکلات و ریسک‌های کلیدی پروژه' : 'KEY ISSUES & CONSTRAINTS'}
            </h2>
          </div>
          <span className="issues-active-badge text-[8px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
            {issues.length} {isFa ? 'مورد فعال' : 'Active Items'}
          </span>
        </div>

        <div className="space-y-1.5 text-[8.5px] flex-1">
          {issues.length === 0 ? (
            <div className="p-3 text-center text-slate-500 font-medium text-[8.5px] bg-slate-50 rounded border border-slate-200">
              {isFa ? 'موردی در گزارش روزانه ثبت نشده است' : 'No issues recorded in daily report'}
            </div>
          ) : (
            issues.map((item, idx) => (
              <div key={item.id || idx} className="issue-item-card p-1.5 bg-slate-50/80 border border-slate-200 rounded flex items-center justify-between gap-1.5">
                {/* Clean Issue Presentation: Number + Description ONLY */}
                <div className="flex items-start gap-1 flex-1">
                  <span className="issue-num text-blue-600/90 font-bold text-[8.5px] shrink-0 mt-0.5">#{idx + 1}</span>
                  <span className="issue-text font-semibold text-slate-900 leading-snug text-[8.5px]">
                    {isFa ? item.issueFa : (item.issueEn || item.issueFa)}
                  </span>
                </div>
                {item.severity && (
                  <span className={`shrink-0 px-1 py-0.2 rounded text-[7.5px] font-bold uppercase ${
                    item.severity === 'critical'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {item.severity}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Activities & Management Decisions (5 cols) */}
      <div id="activities-section" className="activities-decisions-card col-span-5 border border-slate-250 rounded bg-white p-2 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <h2 className="text-[10.5px] font-bold text-slate-900 uppercase tracking-tight">
              {isFa ? 'فعالیت‌های مهم و تصمیمات مدیریتی' : 'KEY ACTIVITIES & DECISIONS'}
            </h2>
          </div>
        </div>

        <div className="space-y-1.5 text-[8.5px] flex-1 flex flex-col justify-between">
          {/* Completed Work Today */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="activities-heading text-[8px] font-bold text-emerald-800 uppercase block">
                {isFa ? 'فعالیت‌های مهم انجام‌شده (TODAY):' : 'Key Work Completed (TODAY):'}
              </span>
              {displayedActivities.length > 0 && (
                <span className="activities-count-badge text-[7.5px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  {displayedActivities.length} {isFa ? 'فعالیت' : 'items'}
                </span>
              )}
            </div>
            {displayedActivities.length > 0 && (
              <ul className="space-y-0.75 pr-0.5">
                {displayedActivities.map((w, idx) => (
                  <li key={w.id || idx} className="activity-item-card flex items-start gap-1 text-slate-800 bg-emerald-50/40 p-1 rounded border border-emerald-200/50">
                    <span className="activity-check-icon text-emerald-600 font-bold mt-0.5 text-[8px] shrink-0">✓</span>
                    <span className="activity-text leading-tight text-[8px] font-medium text-slate-900">{w.description}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Urgent Management Decisions */}
          {decisions.length > 0 && (
            <div className="pt-1 border-t border-slate-200">
              <span className="decisions-heading text-[8px] font-bold text-blue-900 uppercase block mb-0.5">
                {isFa ? 'اقدامات و تصمیمات مورد نیاز مدیریت:' : 'Required Management Decisions:'}
              </span>
              <ul className="space-y-1">
                {decisions.map((d, idx) => (
                  <li key={d.id || idx} className="decision-item-card flex items-start gap-1 text-slate-900 bg-blue-50/40 p-1 rounded border border-blue-200/50">
                    <ArrowUpRight className="decision-arrow-icon w-3 h-3 text-blue-700 shrink-0 mt-0.5" />
                    <div className="leading-tight">
                      <span className="decision-text font-semibold">{isFa ? d.titleFa : d.titleEn}</span>
                      {d.targetParty && (
                        <span className="decision-meta text-slate-500 text-[7.5px] block">
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
