import React, { useState } from 'react';
import { EquipmentRecord, EquipmentProgressItem, Language } from '../../types';
import { initialEquipmentItems } from '../../data/sampleData';
import { Wrench, Info } from 'lucide-react';

interface EquipmentSectionProps {
  equipment: EquipmentRecord;
  lang: Language;
}

export const EquipmentSection: React.FC<EquipmentSectionProps> = ({ equipment, lang }) => {
  const isFa = lang === 'fa';
  const [activeRemark, setActiveRemark] = useState<{ name: string; text: string } | null>(null);

  // Derive items strictly from current equipment record
  const items: EquipmentProgressItem[] =
    equipment.items && equipment.items.length > 0
      ? equipment.items
      : equipment.equipmentSummary?.items && equipment.equipmentSummary.items.length > 0
      ? equipment.equipmentSummary.items
      : (equipment.totalEquipment ? [] : initialEquipmentItems);

  // Calculate totals
  const totalCount =
    equipment.equipmentSummary?.total ??
    (items.length > 0 ? items.reduce((s, it) => s + (it.total || 0), 0) : (equipment.totalEquipment ?? 0));

  const completedCount =
    equipment.equipmentSummary?.completed ??
    (items.length > 0 ? items.reduce((s, it) => s + (it.completed || 0), 0) : (equipment.installed ?? 0));

  const remainingCount = Math.max(0, totalCount - completedCount);
  const weightedProgress =
    equipment.equipmentSummary?.weightedProgress ??
    (totalCount > 0 ? Number(((completedCount / totalCount) * 100).toFixed(2)) : (equipment.installationPercentage ?? 0));

  return (
    <div id="equipment-section" className="equipment-section-card border border-slate-250 rounded bg-white p-2 shadow-2xs flex flex-col justify-between h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
        <div className="flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-teal-600" />
          <h2 className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">
            {isFa ? (
              <>
                وضعیت نصب تجهیزات <span className="ltr-inline text-[9px] font-semibold text-slate-500">(Equipment Sheet)</span>
              </>
            ) : (
              'EQUIPMENT INSTALLATION STATUS'
            )}
          </h2>
        </div>
        <span className="equipment-overall-badge text-[8.5px] text-teal-800 font-bold bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded">
          <span className="ltr-inline">{weightedProgress}%</span> {isFa ? 'پیشرفت کل' : 'Progress'}
        </span>
      </div>

      {/* Top 4 Summary Metrics */}
      <div className="grid grid-cols-4 gap-1 mb-1.5 text-center">
        <div className="equipment-metric-box equipment-total-box bg-slate-50 border border-slate-200 rounded p-0.5">
          <span className="equipment-metric-label text-[7.5px] text-slate-500 block leading-tight">{isFa ? 'کل آیتم‌ها' : 'Total'}</span>
          <span className="equipment-metric-val text-[11px] font-bold text-slate-800">{totalCount}</span>
        </div>
        <div className="equipment-metric-box equipment-installed-box bg-teal-50/70 border border-teal-200 rounded p-0.5">
          <span className="equipment-metric-label text-[7.5px] text-teal-700 block leading-tight">{isFa ? 'انجام‌شده' : 'Completed'}</span>
          <span className="equipment-metric-val text-[11px] font-bold text-teal-900">{completedCount}</span>
        </div>
        <div className="equipment-metric-box equipment-remaining-box bg-amber-50/70 border border-amber-200 rounded p-0.5">
          <span className="equipment-metric-label text-[7.5px] text-amber-700 block leading-tight">{isFa ? 'باقیمانده' : 'Remaining'}</span>
          <span className="equipment-metric-val text-[11px] font-bold text-amber-900">{remainingCount}</span>
        </div>
        <div className="equipment-metric-box equipment-progress-box bg-blue-50/70 border border-blue-200 rounded p-0.5">
          <span className="equipment-metric-label text-[7.5px] text-blue-700 block leading-tight">{isFa ? 'پیشرفت کل' : 'Progress'}</span>
          <span className="equipment-metric-val text-[11px] font-bold text-blue-900">{weightedProgress}%</span>
        </div>
      </div>

      {/* Dynamic Equipment Items Table from Equipment Sheet */}
      <div className="border border-slate-200 rounded overflow-hidden text-[7.5px] flex-1 flex flex-col justify-start">
        <table className="equipment-table w-full text-right rtl:text-right ltr:text-left border-collapse">
          <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 select-none">
            <tr className="h-4">
              <th className="px-1 py-0.5 text-center w-5">{isFa ? '#' : 'No'}</th>
              <th className="px-1 py-0.5">{isFa ? 'تجهیز / شرح آیتم' : 'Equipment / Item'}</th>
              <th className="px-0.5 py-0.5 text-center w-7">{isFa ? 'واحد' : 'Unit'}</th>
              <th className="px-0.5 py-0.5 text-center w-8">{isFa ? 'کل' : 'Total'}</th>
              <th className="px-0.5 py-0.5 text-center w-8">{isFa ? 'انجام' : 'Done'}</th>
              <th className="px-0.5 py-0.5 text-center w-8">{isFa ? 'مانده' : 'Rem.'}</th>
              <th className="px-1 py-0.5 text-center w-14">{isFa ? 'پیشرفت' : 'Progress'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => {
              const itemTotal = Number(item.total) || 0;
              const itemCompleted = Number(item.completed) || 0;
              const itemRemaining = Math.max(0, itemTotal - itemCompleted);
              const progress = itemTotal > 0 ? Number(((itemCompleted / itemTotal) * 100).toFixed(1)) : 0;
              const isComplete = progress >= 100;
              const hasRemarks = Boolean(item.remarks && item.remarks.trim().length > 0);

              return (
                <tr
                  key={`${item.sequence}-${idx}`}
                  className={`h-3.5 hover:bg-slate-50/90 transition-colors ${
                    isComplete ? 'bg-emerald-50/20' : ''
                  }`}
                >
                  <td className="px-1 py-0.2 text-center text-slate-400 font-mono text-[7px]">
                    {item.sequence || idx + 1}
                  </td>
                  <td className="px-1 py-0.2 font-sans font-medium text-slate-800 truncate max-w-[100px]">
                    <div className="flex items-center gap-1">
                      <span className="truncate" title={item.name}>{item.name}</span>
                      {hasRemarks && (
                        <button
                          type="button"
                          onClick={() => setActiveRemark({ name: item.name, text: item.remarks! })}
                          title={item.remarks!}
                          className="text-teal-600 hover:text-teal-800 transition-colors cursor-pointer inline-flex items-center"
                        >
                          <Info className="w-2.5 h-2.5 shrink-0" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-0.5 py-0.2 text-center font-sans text-slate-500 text-[7px] truncate max-w-[28px]">
                    {item.unit || 'عدد'}
                  </td>
                  <td className="px-0.5 py-0.2 text-center font-bold text-slate-700">{itemTotal}</td>
                  <td className={`px-0.5 py-0.2 text-center font-black ${itemCompleted > 0 ? 'text-teal-700' : 'text-slate-400'}`}>
                    {itemCompleted}
                  </td>
                  <td className="px-0.5 py-0.2 text-center text-slate-500">{itemRemaining}</td>
                  <td className="px-1 py-0.2 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <div className="w-6 bg-slate-200 rounded-full h-1 overflow-hidden shrink-0">
                        <div
                          className={`h-full rounded-full ${
                            isComplete ? 'bg-emerald-500' : progress > 0 ? 'bg-teal-500' : 'bg-slate-300'
                          }`}
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                      <span
                        className={`text-[7px] font-bold min-w-[22px] text-right ${
                          isComplete ? 'text-emerald-700' : progress > 0 ? 'text-teal-800' : 'text-slate-400'
                        }`}
                      >
                        {progress}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Remarks modal popover */}
      {activeRemark && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs rounded flex items-center justify-center p-2 z-20">
          <div className="bg-white rounded border border-teal-300 p-2 shadow-lg max-w-[90%] text-right text-[8.5px]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1 font-bold text-slate-900">
              <span className="text-teal-800">{activeRemark.name}</span>
              <button
                type="button"
                onClick={() => setActiveRemark(null)}
                className="text-slate-400 hover:text-rose-600 font-bold px-1 text-xs"
              >
                ✕
              </button>
            </div>
            <p className="text-slate-700 font-sans leading-relaxed">{activeRemark.text}</p>
          </div>
        </div>
      )}
    </div>
  );
};

