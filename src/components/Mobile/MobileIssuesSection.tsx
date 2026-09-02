import React from 'react';
import { DailyReportRecord, Language } from '../../types';
import { AlertOctagon } from 'lucide-react';

interface MobileIssuesSectionProps {
  daily: DailyReportRecord;
  lang: Language;
}

export const MobileIssuesSection: React.FC<MobileIssuesSectionProps> = ({ daily, lang }) => {
  const isFa = lang === 'fa';
  const issues = (daily.keyIssues || []).slice(0, 5);

  if (issues.length === 0) {
    return null;
  }

  return (
    <div id="mobile-issues-section" className="mobile-issues-card bg-white border border-slate-200 rounded-xl p-3 shadow-xs mb-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">
            {isFa ? 'موانع، مشکلات و ریسک‌های کلیدی پروژه' : 'KEY ISSUES & CONSTRAINTS'}
          </h2>
        </div>
        <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
          {issues.length} {isFa ? 'مورد فعال' : 'Active Items'}
        </span>
      </div>

      {/* Issues List: Clean Issue Presentation (Issue Number + Description ONLY) */}
      <div className="space-y-1.5 text-[9.5px]">
        {issues.map((item, idx) => (
          <div
            key={item.id || idx}
            className="p-2 bg-slate-50/80 border border-slate-200 rounded-lg flex items-start justify-between gap-2"
          >
            <div className="flex items-start gap-1.5 flex-1">
              <span className="text-blue-700 font-mono font-bold text-[9px] shrink-0 mt-0.5">
                #{idx + 1}
              </span>
              <span className="font-semibold text-slate-900 leading-snug">
                {isFa ? item.issueFa : (item.issueEn || item.issueFa)}
              </span>
            </div>
            {item.severity && (
              <span
                className={`shrink-0 px-1.5 py-0.2 rounded text-[8px] font-bold uppercase font-mono ${
                  item.severity === 'critical'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {item.severity}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
