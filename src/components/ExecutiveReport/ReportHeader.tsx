import React from 'react';
import { ProjectMasterData, PmsRecord, DailyReportRecord, Language, CalculatedReportKPIs } from '../../types';
import { LoicoLogo } from '../LoicoLogo';
import { Calendar, Building, FileText, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ReportHeaderProps {
  master: ProjectMasterData;
  pms: PmsRecord;
  daily: DailyReportRecord;
  kpis: CalculatedReportKPIs;
  lang: Language;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ master, pms, daily, kpis, lang }) => {
  const isFa = lang === 'fa';

  const getStatusBadge = () => {
    switch (kpis.overallStatus) {
      case 'critical':
        return (
          <span className="report-status-badge report-status-critical inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            {isFa ? (
              <span>
                وضعیت: بحرانی <span className="ltr-inline text-[10px] font-semibold">(Critical)</span>
              </span>
            ) : (
              'Status: Critical'
            )}
          </span>
        );
      case 'attention':
        return (
          <span className="report-status-badge report-status-attention inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            {isFa ? (
              <span>
                وضعیت: نیازمند توجه <span className="ltr-inline text-[10px] font-semibold">(Attention)</span>
              </span>
            ) : (
              'Status: Attention'
            )}
          </span>
        );
      case 'normal':
      default:
        return (
          <span className="report-status-badge report-status-normal inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {isFa ? (
              <span>
                وضعیت: مطلوب <span className="ltr-inline text-[10px] font-semibold">(On Track)</span>
              </span>
            ) : (
              'Status: On Track'
            )}
          </span>
        );
    }
  };

  return (
    <header id="report-header-card" className="report-header project-header report-project-info border-b border-slate-250 pb-2 mb-2 bg-slate-50/80 rounded-t px-2.5 pt-1.5 text-slate-900 border border-slate-200">
      {/* Top Banner (ROW 1: Project title + status + logo + report dates) */}
      <div className="report-header-top-banner flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="report-header-logo-container flex items-center justify-center p-0.5 rounded-lg shrink-0">
            <LoicoLogo size={36} id="report-header-loico-logo" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="report-project-title text-sm md:text-base font-bold tracking-tight text-slate-900 leading-tight">
                {isFa ? master.projectNameFa : master.projectNameEn}
              </h1>
              {getStatusBadge()}
            </div>
            <p className="report-project-subtitle text-[10.5px] font-medium text-blue-900 flex items-center gap-1 mt-0.5">
              <span className="report-subtitle-badge bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase">
                {isFa ? 'گزارش مدیریتی روزانه پروژه' : 'DAILY EXECUTIVE PROJECT REPORT'}
              </span>
              <span className="report-subtitle-divider text-slate-400 font-normal">|</span>
              <span className="report-location-text text-slate-600 font-medium">{isFa ? master.locationFa : master.locationEn}</span>
            </p>
          </div>
        </div>

        {/* Right Metadata Block (Dates) */}
        <div className="report-header-dates-container text-right rtl:text-left flex flex-col items-end rtl:items-start text-[10px] gap-1">
          <div className="report-date-row flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-slate-250 bg-slate-100">
            <span className="report-meta-label text-slate-500 font-medium text-[9.5px]">{isFa ? 'تاریخ گزارش:' : 'Report Date:'}</span>
            <span className="report-meta-date font-bold text-slate-800 text-[10.5px] ltr-inline">{daily.reportDate}</span>
          </div>
          <div className="report-date-row report-data-date-row flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-blue-200 bg-blue-100/90">
            <span className="report-data-date-label text-blue-700 font-medium text-[9.5px]">
              {isFa ? (
                <>
                  تاریخ داده <span className="ltr-inline text-[9px] font-semibold">(Data Date)</span>:
                </>
              ) : (
                'Data Date:'
              )}
            </span>
            <span className="report-data-date-badge font-bold text-blue-950 text-[10.5px] ltr-inline">{pms.dataDate}</span>
          </div>
        </div>
      </div>

      {/* Contract & Stakeholders Compact Grid (ROW 2: Client + Contractor + Consultant + Start Date + Duration) */}
      <div className="report-stakeholders-grid grid grid-cols-2 md:grid-cols-5 gap-2 mt-1.5 pt-1.5 border-t border-slate-200 text-[9.5px]">
        {/* Client */}
        <div className="report-stakeholder-item flex items-center gap-1.5 truncate">
          <Building className="report-info-icon w-3 h-3 text-blue-700 shrink-0" />
          <span className="report-info-label text-slate-500 shrink-0 font-medium">{isFa ? 'کارفرما:' : 'Client:'}</span>
          <span className="report-info-value font-bold text-slate-800 truncate" title={isFa ? master.clientNameFa : master.clientNameEn}>
            {isFa ? master.clientNameFa : master.clientNameEn}
          </span>
        </div>

        {/* Contractor */}
        <div className="report-stakeholder-item flex items-center gap-1.5 truncate">
          <Building className="report-info-icon w-3 h-3 text-slate-500 shrink-0" />
          <span className="report-info-label text-slate-500 shrink-0 font-medium">{isFa ? 'پیمانکار:' : 'Contractor:'}</span>
          <span className="report-info-value font-bold text-slate-800 truncate" title={isFa ? master.contractorNameFa : master.contractorNameEn}>
            {isFa ? master.contractorNameFa : master.contractorNameEn}
          </span>
        </div>

        {/* Consultant */}
        <div className="report-stakeholder-item flex items-center gap-1.5 truncate">
          <Building className="report-info-icon w-3 h-3 text-amber-600 shrink-0" />
          <span className="report-info-label text-slate-500 shrink-0 font-medium">{isFa ? 'مهندس مشاور:' : 'Consultant:'}</span>
          <span className="report-info-value font-bold text-slate-800 truncate" title={isFa ? master.consultantNameFa : master.consultantNameEn}>
            {isFa ? master.consultantNameFa : master.consultantNameEn}
          </span>
        </div>

        {/* Project Start Date */}
        <div className="report-stakeholder-item flex items-center gap-1.5 truncate">
          <Calendar className="report-info-icon w-3 h-3 text-emerald-600 shrink-0" />
          <span className="report-info-label text-slate-500 shrink-0 font-medium">{isFa ? 'تاریخ شروع:' : 'Start Date:'}</span>
          <span className="report-info-value font-bold text-slate-800 truncate ltr-inline">{master.startDate || 'N/A'}</span>
        </div>

        {/* Duration / Notification */}
        <div className="report-stakeholder-item flex items-center gap-1.5 truncate justify-end">
          <FileText className="report-info-icon w-3 h-3 text-slate-400 shrink-0" />
          <span className="report-info-label text-slate-500 shrink-0 font-medium">{isFa ? 'مدت قرارداد:' : 'Duration:'}</span>
          <span className="report-info-value font-bold text-slate-800 truncate">
            {master.contractDurationText || (master.durationDays ? `${master.durationDays} روز` : 'N/A')}
          </span>
        </div>
      </div>
    </header>
  );
};
