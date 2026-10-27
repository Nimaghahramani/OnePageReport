import React from 'react';
import { PmsRecord, DailyReportRecord, IpcRecord, EquipmentRecord, Language } from '../../types';
import { Info, UserCheck } from 'lucide-react';

interface ReportFooterProps {
  pms: PmsRecord;
  daily: DailyReportRecord;
  ipc: IpcRecord;
  equipment: EquipmentRecord;
  lang: Language;
}

export const ReportFooter: React.FC<ReportFooterProps> = ({ pms, daily, ipc, equipment, lang }) => {
  const isFa = lang === 'fa';

  return (
    <footer
      id="report-footer"
      className="report-footer relative overflow-hidden mt-2 px-3 pt-2 pb-1.5 rounded-lg bg-linear-to-l from-slate-100/90 via-blue-50/55 to-slate-100/90 border border-blue-900/25 text-[8.5px] text-slate-700 shadow-2xs print:break-inside-avoid print:border-blue-900/35"
    >
      {/* Top Signature Accent Bar (Navy -> Blue -> Teal) */}
      <div
        className="absolute top-0 inset-x-0 h-[3px] bg-linear-to-l from-blue-900 via-blue-600 to-teal-600 pointer-events-none select-none"
        aria-hidden="true"
      />

      <div className="flex items-center justify-between gap-3">
        {/* Source Traceability Strip */}
        <div className="flex items-center gap-2 truncate">
          <span className="report-footer-source-heading font-extrabold text-blue-950 flex items-center gap-1 shrink-0 bg-blue-100/85 px-2 py-0.5 rounded border border-blue-300/85 shadow-2xs">
            <Info className="w-3 h-3 text-blue-700" />
            {isFa ? 'اصالت داده‌ها:' : 'Data Sources:'}
          </span>
          <span className="report-footer-source-item truncate bg-indigo-50/95 px-2 py-0.5 rounded border border-indigo-200/90 shadow-2xs">
            <b className="report-footer-source-label text-indigo-800 font-extrabold">PMS:</b>{' '}
            <span className="report-footer-source-val font-mono font-bold text-indigo-950 ltr-inline">{pms.dataDate}</span>
          </span>
          <span className="report-footer-source-item truncate bg-rose-50/95 px-2 py-0.5 rounded border border-rose-200/90 shadow-2xs">
            <b className="report-footer-source-label text-rose-800 font-extrabold">Daily:</b>{' '}
            <span className="report-footer-source-val font-mono font-bold text-rose-950 ltr-inline">{daily.reportDate}</span>
          </span>
          <span className="report-footer-source-item truncate bg-emerald-50/95 px-2 py-0.5 rounded border border-emerald-200/90 shadow-2xs">
            <b className="report-footer-source-label text-emerald-800 font-extrabold">IPC:</b>{' '}
            <span className="report-footer-source-val font-mono font-bold text-emerald-950">{ipc.latestIpcNo}</span>
          </span>
          <span className="report-footer-source-item truncate bg-teal-50/95 px-2 py-0.5 rounded border border-teal-200/90 shadow-2xs">
            <b className="report-footer-source-label text-teal-800 font-extrabold">Eq:</b>{' '}
            <span className="report-footer-source-val font-mono font-bold text-teal-950 ltr-inline">{equipment.dataDate}</span>
          </span>
        </div>

        {/* Single Prepared By Attribution */}
        <div className="report-footer-attribution flex items-center gap-1.5 shrink-0 bg-linear-to-l from-blue-900 to-blue-800 border border-blue-950 px-2.5 py-0.5 rounded-md text-white font-semibold shadow-2xs">
          <UserCheck className="w-3 h-3 text-cyan-300" />
          <span className="text-[9px] font-extrabold text-white">
            {isFa ? 'تهیه‌کننده: نیما قهرمانی' : 'Prepared by: Nima Ghahramani'}
          </span>
        </div>
      </div>
    </footer>
  );
};

