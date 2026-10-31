import React, { useState } from 'react';
import {
  EquipmentRecord,
  EquipmentProgressItem,
  getEquipmentItemWeightedProgress,
  Language
} from '../../types';
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

  const exactWeightedSum =
    (items || []).length > 0
      ? Number((items || []).reduce((s, it) => s + getEquipmentItemWeightedProgress(it), 0).toFixed(1))
      : null;

  const weightedProgress =
    exactWeightedSum !== null
      ? Math.round(exactWeightedSum)
      : (equipment?.equipmentSummary?.weightedProgress ?? equipment?.installationPercentage ?? 84);

  return (
    <div
      id="equipment-section"
      className="equipment-section-card relative overflow-hidden border border-teal-300/90 rounded-lg bg-linear-to-br from-teal-50/50 via-white to-cyan-50/40 p-2 pt-2.5 shadow-2xs flex flex-col justify-between h-full print:break-inside-avoid print:border-teal-300"
    >
      {/* Top Signature Accent Bar (Teal -> Cyan -> Emerald) */}
      <div
        className="absolute top-0 inset-x-0 h-1 bg-linear-to-l from-teal-600 via-cyan-600 to-emerald-500 pointer-events-none select-none z-10"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-center justify-between bg-linear-to-l from-teal-100/80 via-teal-50/55 to-cyan-50/35 -mx-2 -mt-2 px-2.5 pt-2 pb-1.5 mb-1.5 border-b border-teal-200/90 rounded-t-lg">
        <div className="flex items-center gap-1.5">
          <span className="p-0.5 rounded bg-teal-100 border border-teal-300/80 text-teal-700 shadow-2xs">
            <Wrench className="w-3.5 h-3.5" />
          </span>
          <h2 className="text-[11.5px] font-extrabold text-teal-950 uppercase tracking-tight">
            {isFa ? (
              <>
                وضعیت نصب تجهیزات <span className="ltr-inline text-[10px] font-bold text-teal-700">(Equipment Sheet)</span>
              </>
            ) : (
              'EQUIPMENT INSTALLATION STATUS'
            )}
          </h2>
        </div>
        <span className="equipment-overall-badge text-[10px] text-teal-950 font-extrabold font-tabular tabular-nums bg-teal-100 border border-teal-300 px-2 py-0.5 rounded shadow-2xs">
          <span className="ltr-inline">{weightedProgress}%</span> {isFa ? 'پیشرفت وزنی کل' : 'Weighted Progress'}
        </span>
      </div>

      {/* Top 4 Summary Metrics */}
      <div className="grid grid-cols-4 gap-1.5 mb-1.5 text-center">
        <div className="equipment-metric-box equipment-total-box bg-indigo-50/70 border border-indigo-200/90 rounded p-1 min-w-0 overflow-hidden">
          <span className="equipment-metric-label text-[10.5px] text-indigo-950 font-extrabold block leading-tight truncate">{isFa ? 'کل آیتم‌ها' : 'Total'}</span>
          <span className="equipment-metric-val text-[15px] font-extrabold text-indigo-950 font-tabular tabular-nums tracking-tight ltr-inline leading-tight block mt-0.5">{totalCount}</span>
        </div>
        <div className="equipment-metric-box equipment-installed-box bg-teal-50/90 border border-teal-200/90 rounded p-1 min-w-0 overflow-hidden">
          <span className="equipment-metric-label text-[10.5px] text-teal-950 font-extrabold block leading-tight truncate">{isFa ? 'انجام‌شده' : 'Completed'}</span>
          <span className="equipment-metric-val text-[15px] font-extrabold text-teal-950 font-tabular tabular-nums tracking-tight ltr-inline leading-tight block mt-0.5">{completedCount}</span>
        </div>
        <div className="equipment-metric-box equipment-remaining-box bg-amber-50/90 border border-amber-200/90 rounded p-1 min-w-0 overflow-hidden">
          <span className="equipment-metric-label text-[10.5px] text-amber-950 font-extrabold block leading-tight truncate">{isFa ? 'باقیمانده' : 'Remaining'}</span>
          <span className="equipment-metric-val text-[15px] font-extrabold text-amber-950 font-tabular tabular-nums tracking-tight ltr-inline leading-tight block mt-0.5">{remainingCount}</span>
        </div>
        <div className="equipment-metric-box equipment-progress-box bg-blue-50/90 border border-blue-200/90 rounded p-1 min-w-0 overflow-hidden">
          <span className="equipment-metric-label text-[10.5px] text-blue-950 font-extrabold block leading-tight truncate">{isFa ? 'پیشرفت وزنی' : 'Progress'}</span>
          <span className="equipment-metric-val text-[15px] font-extrabold text-blue-950 font-tabular tabular-nums tracking-tight ltr-inline leading-tight block mt-0.5">{weightedProgress}%</span>
        </div>
      </div>

      {/* Dynamic Equipment Items Table from Equipment Sheet */}
      <div className="border border-slate-200/90 rounded overflow-hidden flex-1 flex flex-col justify-between bg-white/95">
        <table className="equipment-table w-full table-fixed text-right rtl:text-right ltr:text-left border-collapse">
          <thead className="bg-teal-50/95 text-teal-950 font-extrabold border-b-2 border-teal-200/90 select-none text-[10.5px]">
            <tr className="h-5">
              <th className="px-1 py-0.5 text-center w-[6%] col-num whitespace-nowrap">{isFa ? 'ردیف' : 'No'}</th>
              <th className="px-1.5 py-0.5 w-[33.5%] whitespace-nowrap">{isFa ? 'تجهیز / آیتم' : 'Equipment / Item'}</th>
              <th className="px-1 py-0.5 text-center w-[9.5%] whitespace-nowrap">{isFa ? 'واحد' : 'Unit'}</th>
              <th className="px-1 py-0.5 text-center w-[10.5%] col-qty whitespace-nowrap">{isFa ? 'تعداد کل' : 'Total'}</th>
              <th className="px-1 py-0.5 text-center w-[10.5%] col-qty whitespace-nowrap">{isFa ? 'انجام شده' : 'Done'}</th>
              <th className="px-1 py-0.5 text-center w-[10.5%] col-qty whitespace-nowrap">{isFa ? 'باقی مانده' : 'Rem.'}</th>
              <th className="px-1 py-0.5 text-center w-[19.5%] col-percent whitespace-nowrap">{isFa ? 'پیشرفت' : 'Progress'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/75">
            {items.map((item, idx) => {
              const itemTotal = Number(item.total) || 0;
              const itemCompleted = Number(item.completed) || 0;
              const itemRemaining = Math.max(0, itemTotal - itemCompleted);
              const weightedItemProg = getEquipmentItemWeightedProgress(item);
              const isComplete = itemTotal > 0 && itemCompleted >= itemTotal;
              const hasPositiveWeightedProg = weightedItemProg > 0;
              const barFillPct = hasPositiveWeightedProg
                ? Math.min(100, Math.max(18, itemTotal > 0 ? (itemCompleted / itemTotal) * 100 : weightedItemProg))
                : 0;
              const hasRemarks = Boolean(item.remarks && item.remarks.trim().length > 0);

              return (
                <tr
                  key={`${item.sequence}-${idx}`}
                  className={`h-[19.5px] transition-colors ${
                    isComplete && hasPositiveWeightedProg ? 'bg-emerald-50/50' : 'even:bg-slate-50/75 hover:bg-teal-50/35'
                  }`}
                >
                  <td className="px-1 py-0.5 text-center text-slate-700 font-extrabold font-tabular tabular-nums text-[10.5px] col-num whitespace-nowrap">
                    {item.sequence || idx + 1}
                  </td>
                  <td className="px-1.5 py-0.5 font-sans font-extrabold text-blue-950 text-[11px] truncate">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="truncate" title={item.name}>{item.name}</span>
                      {hasRemarks && (
                        <button
                          type="button"
                          onClick={() => setActiveRemark({ name: item.name, text: item.remarks! })}
                          title={item.remarks!}
                          className="text-teal-600 hover:text-teal-800 transition-colors cursor-pointer inline-flex items-center shrink-0"
                        >
                          <Info className="w-3 h-3 shrink-0" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-1 py-0.5 text-center font-sans font-bold text-slate-700 text-[10px] truncate whitespace-nowrap">
                    {item.unit || 'عدد'}
                  </td>
                  <td className="px-1 py-0.5 text-center font-extrabold text-blue-950 text-[11.5px] font-tabular tabular-nums tracking-tight col-qty whitespace-nowrap">
                    <span className="ltr-inline">{itemTotal}</span>
                  </td>
                  <td className={`px-1 py-0.5 text-center font-extrabold text-[11.5px] font-tabular tabular-nums tracking-tight col-qty whitespace-nowrap ${itemCompleted > 0 ? 'text-teal-800' : 'text-slate-400'}`}>
                    <span className="ltr-inline">{itemCompleted}</span>
                  </td>
                  <td className={`px-1 py-0.5 text-center font-extrabold text-[11.5px] font-tabular tabular-nums tracking-tight col-qty whitespace-nowrap ${itemRemaining > 0 ? 'text-amber-800' : 'text-slate-400'}`}>
                    <span className="ltr-inline">{itemRemaining}</span>
                  </td>
                  <td className="px-1 py-0.5 text-center col-percent whitespace-nowrap">
                    <div className="flex items-center gap-1 justify-between px-0.5">
                      <div className="w-6 bg-slate-200 rounded-full h-1.5 overflow-hidden shrink-0">
                        <div
                          className={`h-full rounded-full ${
                            isComplete && hasPositiveWeightedProg
                              ? 'bg-emerald-600'
                              : hasPositiveWeightedProg
                              ? 'bg-teal-600'
                              : 'bg-slate-300'
                          }`}
                          style={{ width: `${barFillPct}%` }}
                        />
                      </div>
                      <span
                        className={`text-[11px] font-extrabold min-w-[38px] text-left font-tabular tabular-nums tracking-tight ltr-inline whitespace-nowrap ${
                          isComplete && hasPositiveWeightedProg
                            ? 'text-emerald-800'
                            : hasPositiveWeightedProg
                            ? 'text-teal-900'
                            : 'text-slate-500'
                        }`}
                      >
                        {weightedItemProg.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-blue-950 text-white font-extrabold border-t border-blue-900 select-none text-[11px]">
            <tr className="h-[21px]">
              <td colSpan={3} className="px-2 py-0.5 text-center font-extrabold tracking-tight whitespace-nowrap">
                {isFa ? 'جمع' : 'Total'}
              </td>
              <td className="px-1 py-0.5 text-center font-tabular tabular-nums text-[12px] col-qty whitespace-nowrap">
                <span className="ltr-inline">{totalCount}</span>
              </td>
              <td className="px-1 py-0.5 text-center font-tabular tabular-nums text-[12px] text-teal-200 col-qty whitespace-nowrap">
                <span className="ltr-inline">{completedCount}</span>
              </td>
              <td className="px-1 py-0.5 text-center font-tabular tabular-nums text-[12px] text-amber-200 col-qty whitespace-nowrap">
                <span className="ltr-inline">{remainingCount}</span>
              </td>
              <td className="px-1 py-0.5 text-center font-tabular tabular-nums text-[12px] text-emerald-300 col-percent whitespace-nowrap">
                <span className="ltr-inline">{weightedProgress}%</span>
              </td>
            </tr>
          </tfoot>
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

