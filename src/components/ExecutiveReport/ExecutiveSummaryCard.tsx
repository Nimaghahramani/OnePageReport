import React from 'react';
import { CalculatedReportKPIs, Language } from '../../types';
import { Sparkles, FileText } from 'lucide-react';

interface ExecutiveSummaryCardProps {
  kpis: CalculatedReportKPIs;
  lang: Language;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({ kpis, lang }) => {
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

  if (lines.length === 0) {
    return null;
  }

  return (
    <div id="executive-summary-section" className="executive-summary-card border border-blue-200 bg-blue-50/50 rounded p-2 shadow-2xs mb-2">
      <div className="flex items-center justify-between border-b border-blue-200/80 pb-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-blue-700" />
          <h2 className="executive-summary-title text-[11px] font-bold text-blue-950 uppercase tracking-tight">
            {isFa ? (
              <>
                خلاصه مدیریتی و تحلیل عملکرد پروژه <span className="ltr-inline text-[9.5px] font-semibold text-blue-800">(Executive Summary)</span>
              </>
            ) : (
              'EXECUTIVE MANAGEMENT SUMMARY'
            )}
          </h2>
        </div>
        <span className="executive-summary-badge text-[8.5px] font-bold text-blue-800 bg-blue-100/80 px-1.5 py-0.2 rounded">
          {isFa ? 'تحلیل مبتنی بر داده‌های معتبر' : 'Data-Driven Synthesis'}
        </span>
      </div>

      <div className="executive-summary-text space-y-1 text-[9.5px] text-slate-800 leading-relaxed font-normal">
        {lines.map((line, idx) => (
          <div key={idx} className="flex items-start gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
            <p className="flex-1 font-medium">{line}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
