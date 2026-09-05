import React, { useState } from 'react';
import { EquipmentRecord, EquipmentProgressItem, Language } from '../../types';
import { initialEquipmentItems } from '../../data/sampleData';
import { Wrench, ChevronDown, ChevronUp, Info, CheckCircle2 } from 'lucide-react';

interface MobileEquipmentSectionProps {
  equipment: EquipmentRecord;
  lang: Language;
}

export const MobileEquipmentSection: React.FC<MobileEquipmentSectionProps> = ({ equipment, lang }) => {
  const isFa = lang === 'fa';
  const [showDetails, setShowDetails] = useState(false);
  const [activeRemark, setActiveRemark] = useState<{ name: string; text: string } | null>(null);

  // Derive items strictly from current equipment record
  const items: EquipmentProgressItem[] =
    equipment?.items && equipment.items.length > 0
      ? equipment.items
      : equipment?.equipmentSummary?.items && equipment.equipmentSummary.items.length > 0
      ? equipment.equipmentSummary.items
      : (equipment?.totalEquipment ? [] : initialEquipmentItems);

  // Calculate totals
  const totalCount =
    equipment?.equipmentSummary?.total ??
    ((items || []).length > 0 ? (items || []).reduce((s, it) => s + (it.total || 0), 0) : (equipment?.totalEquipment ?? 0));

  const completedCount =
    equipment?.equipmentSummary?.completed ??
    ((items || []).length > 0 ? (items || []).reduce((s, it) => s + (it.completed || 0), 0) : (equipment?.installed ?? 0));

  const remainingCount = Math.max(0, totalCount - completedCount);
  const weightedProgress =
    equipment?.equipmentSummary?.weightedProgress ??
    (totalCount > 0 ? Number(((completedCount / totalCount) * 100).toFixed(2)) : (equipment?.installationPercentage ?? 0));

  return (
    <div id="mobile-equipment-section" className="mobile-equipment-card bg-white border border-slate-200 rounded-xl p-3 shadow-xs mb-2.5 relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">
            {isFa ? 'وضعیت نصب تجهیزات کارگاه' : 'EQUIPMENT INSTALLATION'}
          </h2>
        </div>
        <span className="text-[9.5px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full font-mono">
          {weightedProgress}% {isFa ? 'پیشرفت کل' : 'Progress'}
        </span>
      </div>

      {/* 4 Summary Metrics */}
      <div className="grid grid-cols-4 gap-1.5 mb-2 text-center">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
          <span className="text-[8px] text-slate-500 block leading-tight font-medium">{isFa ? 'کل آیتم‌ها' : 'Total'}</span>
          <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">{totalCount}</span>
        </div>
        <div className="bg-teal-50/70 border border-teal-200 rounded-lg p-1.5">
          <span className="text-[8px] text-teal-700 block leading-tight font-medium">{isFa ? 'انجام‌شده' : 'Completed'}</span>
          <span className="text-xs font-bold text-teal-900 font-mono mt-0.5 block">{completedCount}</span>
        </div>
        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-1.5">
          <span className="text-[8px] text-amber-700 block leading-tight font-medium">{isFa ? 'باقیمانده' : 'Remaining'}</span>
          <span className="text-xs font-bold text-amber-900 font-mono mt-0.5 block">{remainingCount}</span>
        </div>
        <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-1.5">
          <span className="text-[8px] text-blue-700 block leading-tight font-medium">{isFa ? 'پیشرفت' : 'Progress'}</span>
          <span className="text-xs font-bold text-blue-900 font-mono mt-0.5 block">{weightedProgress}%</span>
        </div>
      </div>

      {/* Expandable Equipment Details Toggle */}
      <div className="border-t border-slate-100 pt-1.5">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-teal-900 transition-colors cursor-pointer border border-slate-200"
        >
          <span className="flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-teal-600" />
            {isFa ? `مشاهده جزئیات تجهیزات (${items.length} ردیف)` : `View Equipment Details (${items.length} items)`}
          </span>
          {showDetails ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
        </button>

        {showDetails && (
          <div className="mt-2 space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
            {items.map((item, idx) => {
              const itemTotal = Number(item.total) || 0;
              const itemCompleted = Number(item.completed) || 0;
              const itemRemaining = Math.max(0, itemTotal - itemCompleted);
              const progress = itemTotal > 0 ? Number(((itemCompleted / itemTotal) * 100).toFixed(1)) : 0;
              const isComplete = progress >= 100;
              const hasRemarks = Boolean(item.remarks && item.remarks.trim().length > 0);

              return (
                <div
                  key={`${item.sequence}-${idx}`}
                  className={`p-2 rounded-lg border text-[9.5px] transition-colors ${
                    isComplete ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded font-mono font-bold text-[7.5px] shrink-0">
                        #{item.sequence || idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 truncate" title={item.name}>
                        {item.name}
                      </span>
                      {hasRemarks && (
                        <button
                          type="button"
                          onClick={() => setActiveRemark({ name: item.name, text: item.remarks! })}
                          title={item.remarks!}
                          className="text-teal-600 hover:text-teal-800 transition-colors cursor-pointer inline-flex items-center shrink-0"
                        >
                          <Info className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="text-[9px] font-bold font-mono text-teal-800 shrink-0">
                      {progress}%
                    </span>
                  </div>

                  {/* Metrics Row: Done / Total / Remaining */}
                  <div className="flex items-center justify-between text-[8.5px] text-slate-600 font-mono mb-1">
                    <span>
                      {isFa ? 'انجام:' : 'Done:'} <b className="text-teal-900 font-bold">{itemCompleted}</b>
                    </span>
                    <span>
                      {isFa ? 'کل:' : 'Total:'} <b>{itemTotal}</b> {item.unit || ''}
                    </span>
                    <span>
                      {isFa ? 'مانده:' : 'Rem:'} <b className="text-amber-800">{itemRemaining}</b>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isComplete ? 'bg-emerald-500' : progress > 0 ? 'bg-teal-500' : 'bg-slate-300'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Remarks Modal if clicked */}
      {activeRemark && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-xs w-full p-3.5 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
              <h3 className="font-bold text-xs text-slate-900 truncate">{activeRemark.name}</h3>
              <button
                type="button"
                onClick={() => setActiveRemark(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-1.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-[10px] text-slate-700 leading-relaxed">{activeRemark.text}</p>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveRemark(null)}
                className="px-3 py-1 bg-teal-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
              >
                {isFa ? 'بستن' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
