import React from 'react';
import { PmsRecord, DailyReportRecord, IpcRecord, EquipmentRecord, Language } from '../../types';
import { Info, UserCheck } from 'lucide-react';

interface MobileReportFooterProps {
  pms: PmsRecord;
  daily: DailyReportRecord;
  ipc: IpcRecord;
  equipment: EquipmentRecord;
  lang: Language;
}

export const MobileReportFooter: React.FC<MobileReportFooterProps> = ({
  pms,
  daily,
  ipc,
  equipment,
  lang
}) => {
  const isFa = lang === 'fa';

  return (
    <footer id="mobile-report-footer" className="mobile-report-footer mt-3 pt-2.5 border-t border-slate-200 text-[9px] text-slate-500 pb-2">
      {/* Source Traceability Strip */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 mb-2">
        <div className="flex items-center gap-1 font-bold text-slate-700 mb-1 text-[9.5px]">
          <Info className="w-3 h-3 text-blue-600 shrink-0" />
          <span>{isFa ? 'اصالت و زنجیره داده‌ها:' : 'Data Sources:'}</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[8.5px] font-mono">
          <div className="truncate">
            <span className="text-slate-500 font-sans font-medium">PMS: </span>
            <span className="text-slate-800 font-bold">{pms.dataDate}</span>
          </div>
          <div className="truncate">
            <span className="text-slate-500 font-sans font-medium">Daily: </span>
            <span className="text-slate-800 font-bold">{daily.reportDate}</span>
          </div>
          <div className="truncate">
            <span className="text-slate-500 font-sans font-medium">IPC: </span>
            <span className="text-slate-800 font-bold">{ipc.latestIpcNo}</span>
          </div>
          <div className="truncate">
            <span className="text-slate-500 font-sans font-medium">Eq: </span>
            <span className="text-slate-800 font-bold">{equipment.dataDate}</span>
          </div>
        </div>
      </div>

      {/* Prepared by Attribution */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium">
        <div className="flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-blue-700" />
          <span className="font-bold text-[9.5px]">
            {isFa ? 'تهیه‌کننده: نیما قهرمانی' : 'Prepared by: Nima Ghahramani'}
          </span>
        </div>
        <span className="text-[8px] text-slate-400 font-mono">
          LOICO CCPP 500MW
        </span>
      </div>
    </footer>
  );
};
