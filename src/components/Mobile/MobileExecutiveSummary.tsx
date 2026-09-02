import React, { useState } from 'react';
import { CalculatedReportKPIs, Language } from '../../types';
import { FileText, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface MobileExecutiveSummaryProps {
  kpis: CalculatedReportKPIs;
  lang: Language;
}

export const MobileExecutiveSummary: React.FC<MobileExecutiveSummaryProps> = ({ kpis, lang }) => {
  const isFa = lang === 'fa';
  const [isExpanded, setIsExpanded] = useState(false);

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

  const initialLimit = 3;
  const hasMore = lines.length > initialLimit;
  const displayedLines = isExpanded ? lines : lines.slice(0, initialLimit);

  return (
    <div id="mobile-executive-summary" className="mobile-summary-card bg-blue-50/60 border border-blue-200 rounded-xl p-3 shadow-xs mb-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-blue-200/70 pb-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-blue-700 shrink-0" />
          <h2 className="text-[11px] font-bold text-blue-950 uppercase tracking-tight">
            {isFa ? 'خلاصه مدیریتی پروژه' : 'EXECUTIVE SUMMARY'}
          </h2>
        </div>
        <span className="text-[9px] font-bold text-blue-800 bg-blue-100/90 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-blue-600" />
          {isFa ? 'تحلیل سیستمی' : 'Executive Insights'}
        </span>
      </div>

      {/* Bullet Items */}
      <ul className="space-y-1.5 text-[9.5px] text-slate-800 leading-relaxed">
        {displayedLines.map((line, idx) => (
          <li key={idx} className="flex items-start gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
            <span className="flex-1 font-medium">{line}</span>
          </li>
        ))}
      </ul>

      {/* Expand / Collapse Toggle if > 3 items */}
      {hasMore && (
        <div className="mt-2 pt-1.5 border-t border-blue-200/50 flex justify-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[9.5px] font-bold text-blue-700 hover:text-blue-900 transition-colors py-0.5 px-2 rounded-lg cursor-pointer"
          >
            <span>{isExpanded ? (isFa ? 'نمایش کمتر' : 'Show Less') : (isFa ? `نمایش بیشتر (${lines.length - initialLimit} مورد دیگر)` : `Show More (+${lines.length - initialLimit})`)}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      )}
    </div>
  );
};
