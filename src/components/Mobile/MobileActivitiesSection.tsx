import React from 'react';
import { DailyReportRecord, Language } from '../../types';
import { CheckCircle2, ArrowUpRight } from 'lucide-react';

interface MobileActivitiesSectionProps {
  daily: DailyReportRecord;
  lang: Language;
}

export const MobileActivitiesSection: React.FC<MobileActivitiesSectionProps> = ({ daily, lang }) => {
  const isFa = lang === 'fa';

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

  if (displayedActivities.length === 0 && decisions.length === 0) {
    return null;
  }

  return (
    <div id="mobile-activities-section" className="mobile-activities-card bg-white border border-slate-200 rounded-xl p-3 shadow-xs mb-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">
            {isFa ? 'فعالیت‌های مهم و تصمیمات مدیریتی' : 'KEY ACTIVITIES & DECISIONS'}
          </h2>
        </div>
      </div>

      <div className="space-y-2">
        {/* Completed Work Today */}
        {displayedActivities.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8.5px] font-bold text-emerald-800 uppercase block">
                {isFa ? 'فعالیت‌های مهم انجام‌شده (امروز):' : 'Key Work Completed (Today):'}
              </span>
              <span className="text-[8px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                {displayedActivities.length} {isFa ? 'فعالیت' : 'items'}
              </span>
            </div>
            <ul className="space-y-1">
              {displayedActivities.map((w, idx) => (
                <li
                  key={w.id || idx}
                  className="flex items-start gap-1.5 text-slate-800 bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-200/60 text-[9px]"
                >
                  <span className="text-emerald-600 font-bold mt-0.5 text-[8.5px] shrink-0">✓</span>
                  <span className="leading-snug font-medium text-slate-900">{w.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Required Management Decisions */}
        {decisions.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[8.5px] font-bold text-blue-900 uppercase block mb-1">
              {isFa ? 'اقدامات و تصمیمات مورد نیاز مدیریت:' : 'Required Management Decisions:'}
            </span>
            <ul className="space-y-1">
              {decisions.map((d, idx) => (
                <li
                  key={d.id || idx}
                  className="flex items-start gap-1.5 text-slate-900 bg-blue-50/50 p-1.5 rounded-lg border border-blue-200/60 text-[9px]"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <span className="font-bold">{isFa ? d.titleFa : d.titleEn}</span>
                    {d.targetParty && (
                      <span className="text-slate-500 text-[8px] block mt-0.5">
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
  );
};
