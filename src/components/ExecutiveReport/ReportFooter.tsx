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
    <footer id="report-footer" className="report-footer mt-2 pt-1.5 border-t border-slate-250 text-[8.5px] text-slate-500">
      <div className="flex items-center justify-between gap-3">
        {/* Source Traceability Strip */}
        <div className="flex items-center gap-3 truncate">
          <span className="report-footer-source-heading font-bold text-slate-700 flex items-center gap-1 shrink-0">
            <Info className="w-2.5 h-2.5 text-blue-600" />
            {isFa ? 'اصالت داده‌ها:' : 'Data Sources:'}
          </span>
          <span className="report-footer-source-item truncate">
            <b className="report-footer-source-label text-slate-600">PMS:</b> <span className="report-footer-source-val">{pms.dataDate}</span>
          </span>
          <span className="report-footer-source-item truncate">
            <b className="report-footer-source-label text-slate-600">Daily:</b> <span className="report-footer-source-val">{daily.reportDate}</span>
          </span>
          <span className="report-footer-source-item truncate">
            <b className="report-footer-source-label text-slate-600">IPC:</b> <span className="report-footer-source-val">{ipc.latestIpcNo}</span>
          </span>
          <span className="report-footer-source-item truncate">
            <b className="report-footer-source-label text-slate-600">Eq:</b> <span className="report-footer-source-val">{equipment.dataDate}</span>
          </span>
        </div>

        {/* Single Prepared By Attribution */}
        <div className="report-footer-attribution flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-800 font-medium">
          <UserCheck className="w-3 h-3 text-slate-600" />
          <span className="text-[9px] font-bold">
            {isFa ? 'تهیه‌کننده: نیما قهرمانی' : 'Prepared by: Nima Ghahramani'}
          </span>
        </div>
      </div>
    </footer>
  );
};

