import React, { useState } from 'react';
import { ProjectMasterData, PmsRecord, DailyReportRecord, Language, CalculatedReportKPIs } from '../../types';
import { LoicoLogo } from '../LoicoLogo';
import { Calendar, Building, FileText, CheckCircle2, AlertTriangle, XCircle, Info, ChevronDown, ChevronUp, MapPin, Clock } from 'lucide-react';

interface MobileReportHeaderProps {
  master: ProjectMasterData;
  pms: PmsRecord;
  daily: DailyReportRecord;
  kpis: CalculatedReportKPIs;
  lang: Language;
}

export const MobileReportHeader: React.FC<MobileReportHeaderProps> = ({
  master,
  pms,
  daily,
  kpis,
  lang
}) => {
  const isFa = lang === 'fa';
  const [showProjectDetails, setShowProjectDetails] = useState(false);

  const getStatusBadge = () => {
    switch (kpis.overallStatus) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3 h-3 text-red-600 shrink-0" />
            <span>{isFa ? 'بحرانی' : 'Critical'}</span>
          </span>
        );
      case 'attention':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
            <span>{isFa ? 'نیازمند توجه' : 'Attention'}</span>
          </span>
        );
      case 'normal':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>{isFa ? 'مطلوب' : 'On Track'}</span>
          </span>
        );
    }
  };

  return (
    <header id="mobile-report-header" className="mobile-report-header bg-white border border-slate-200 rounded-xl p-3 shadow-xs mb-2.5">
      {/* Top Identity Row: Logo + Project Title & Status */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center p-1 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
            <LoicoLogo size={30} id="mobile-header-logo" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-[13.5px] font-bold text-slate-900 leading-tight truncate" title={isFa ? master.projectNameFa : master.projectNameEn}>
                {isFa ? master.projectNameFa : master.projectNameEn}
              </h1>
              {getStatusBadge()}
            </div>
            <p className="text-[9.5px] font-semibold text-blue-900 flex items-center gap-1 mt-0.5 truncate">
              <span className="bg-blue-50 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                {isFa ? 'گزارش مدیریتی روزانه' : 'DAILY REPORT'}
              </span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="text-slate-500 font-medium truncate">{isFa ? master.locationFa : master.locationEn}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Date Strip: Report Date + PMS Data Date */}
      <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-100 text-[10px]">
        <div className="flex items-center justify-between px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-slate-500 font-medium text-[9px]">{isFa ? 'تاریخ گزارش:' : 'Report Date:'}</span>
          <span className="font-bold text-slate-900 text-[10.5px] ltr-inline font-mono">{daily.reportDate}</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1 bg-blue-50/80 border border-blue-200 rounded-lg">
          <span className="text-blue-700 font-medium text-[9px]">{isFa ? 'تاریخ داده:' : 'Data Date:'}</span>
          <span className="font-bold text-blue-950 text-[10.5px] ltr-inline font-mono">{pms.dataDate}</span>
        </div>
      </div>

      {/* Project Details Expandable Toggle */}
      <div className="mt-2 pt-1.5 border-t border-slate-100 flex flex-col">
        <button
          type="button"
          onClick={() => setShowProjectDetails(!showProjectDetails)}
          className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-medium text-slate-600 bg-slate-50/60 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5 text-blue-900 font-semibold">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            {isFa ? 'اطلاعات و مشخصات پروژه' : 'Project Specifications'}
          </span>
          {showProjectDetails ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>

        {showProjectDetails && (
          <div className="mt-2 space-y-1.5 p-2 bg-slate-50/80 border border-slate-200 rounded-lg text-[9.5px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{isFa ? 'کارفرما:' : 'Client:'}</span>
              <span className="font-bold text-slate-800">{isFa ? master.clientNameFa : master.clientNameEn}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{isFa ? 'پیمانکار:' : 'Contractor:'}</span>
              <span className="font-bold text-slate-800">{isFa ? master.contractorNameFa : master.contractorNameEn}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{isFa ? 'مهندس مشاور:' : 'Consultant:'}</span>
              <span className="font-bold text-slate-800">{isFa ? master.consultantNameFa : master.consultantNameEn}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{isFa ? 'تاریخ شروع:' : 'Start Date:'}</span>
              <span className="font-bold text-slate-800 ltr-inline font-mono">{master.contractStartDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{isFa ? 'مدت قرارداد:' : 'Duration:'}</span>
              <span className="font-bold text-slate-800">{isFa ? `${master.contractDurationDays} روز` : `${master.contractDurationDays} Days`}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{isFa ? 'موقعیت:' : 'Location:'}</span>
              <span className="font-bold text-slate-800">{isFa ? master.locationFa : master.locationEn}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
