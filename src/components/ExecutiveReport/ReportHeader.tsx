import React from 'react';
import { ProjectMasterData, PmsRecord, DailyReportRecord, Language, CalculatedReportKPIs } from '../../types';
import { LoicoLogo } from '../LoicoLogo';
import { Calendar, Building, FileText, CheckCircle2, AlertTriangle, XCircle, Clock, Coins } from 'lucide-react';

interface ReportHeaderProps {
  master: ProjectMasterData;
  pms: PmsRecord;
  daily: DailyReportRecord;
  kpis: CalculatedReportKPIs;
  lang: Language;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ master, pms, daily, kpis, lang }) => {
  const isFa = lang === 'fa';
  const contractValIRR = master.contractValueIRR || master.contractAmountIRR || master.contractValue || 4653170392630;
  const contractValEUR = master.contractValueEUR || master.contractAmountEUR || 673167;
  const contractNo = daily.contractNumber || master.contractNumber || '125 / 1234 / 3 - 1 ص پ';
  const contractSubject = daily.contractSubject || master.scopeDescriptionFa || (isFa ? 'تکمیل و تجهیز اسکله P1' : 'Completion & Equipping of Jetty P1');

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
    <header id="report-header-card" className="report-header project-header report-project-info border-b border-slate-250 pb-1.5 mb-1.5 bg-slate-50/80 rounded-t px-2.5 pt-1.5 text-slate-900 border border-slate-200 print:break-inside-avoid print:bg-white print:border-slate-300">
      {/* Top Banner (ROW 1: Project title + status + logo + report dates) */}
      <div className="report-header-top-banner flex items-center justify-between gap-2 print:break-inside-avoid">
        <div className="flex items-center gap-2.5">
          <div className="report-header-logo-container flex items-center justify-center p-0.5 rounded-lg shrink-0 print:break-inside-avoid">
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
              <span className="report-subtitle-badge bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase print:bg-blue-100 print:text-blue-900">
                {isFa ? 'گزارش مدیریتی روزانه پروژه' : 'DAILY EXECUTIVE PROJECT REPORT'}
              </span>
              <span className="report-subtitle-divider text-slate-400 font-normal">|</span>
              <span className="report-location-text text-slate-600 font-medium">{isFa ? master.locationFa : master.locationEn}</span>
              <span className="report-subtitle-divider text-slate-400 font-normal">|</span>
              <span className="text-[9px] font-bold text-slate-700 bg-slate-200/80 px-1.5 py-0.2 rounded print:bg-slate-100">
                SCETIRAN & LOICO
              </span>
            </p>
          </div>
        </div>

        {/* Right Metadata Block (Dates) */}
        <div className="report-header-dates-container text-right rtl:text-left flex flex-col items-end rtl:items-start text-[10px] gap-1 print:break-inside-avoid">
          <div className="report-date-row flex items-center gap-1.5 px-2 py-0.5 rounded border border-slate-300 bg-slate-50 flex-wrap justify-end shadow-2xs print:bg-slate-50 print:border-slate-300">
            <span className="report-meta-label text-slate-600 font-bold text-[9.5px]">{isFa ? 'تاریخ گزارش:' : 'Report Date:'}</span>
            <span className="report-meta-date font-black text-rose-700 text-[11px] ltr-inline font-mono">{daily.reportDate}</span>
            {daily.reportDayOfWeek && (
              <span className="report-day-badge text-slate-700 font-semibold text-[9.5px] bg-slate-200/90 px-1.5 py-0.2 rounded border border-slate-300/80">
                {daily.reportDayOfWeek}
              </span>
            )}
            {daily.reportNumber && (
              <span className="report-number-badge text-blue-900 font-black text-[9.5px] bg-blue-100 px-1.5 py-0.2 rounded border border-blue-300">
                {isFa ? `شماره ${daily.reportNumber}` : `#${daily.reportNumber}`}
              </span>
            )}
          </div>
          <div className="report-date-row report-data-date-row flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-blue-200 bg-blue-100/90 print:bg-blue-100 print:border-blue-300">
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

      {/* Contract & Stakeholders Compact Grid (ROW 2: Client + Contractor + Consultant + Contract Scope) */}
      <div className="report-stakeholders-grid grid grid-cols-2 md:grid-cols-4 gap-2 mt-1.5 pt-1 border-t border-slate-200 text-[9.5px] print:break-inside-avoid print:grid print:grid-cols-4">
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

        {/* Contract Subject / Scope */}
        <div className="report-stakeholder-item flex items-center gap-1.5 truncate">
          <FileText className="report-info-icon w-3 h-3 text-purple-600 shrink-0" />
          <span className="report-info-label text-slate-500 shrink-0 font-medium">{isFa ? 'موضوع قرارداد:' : 'Subject:'}</span>
          <span className="report-info-value font-bold text-slate-800 truncate" title={contractSubject}>
            {contractSubject}
          </span>
        </div>
      </div>

      {/* Financial Values & Contract Timeline (ROW 3: Contract No + Start Date + Duration + Value IRR + Value EUR) */}
      <div className="report-contract-values-grid grid grid-cols-2 sm:grid-cols-5 gap-1.5 mt-1 pt-1 border-t border-slate-200/80 text-[9px] print:break-inside-avoid print:grid print:grid-cols-5">
        {/* Contract Number */}
        <div className="report-stakeholder-item flex items-center gap-1.5 truncate">
          <FileText className="report-info-icon w-3 h-3 text-indigo-600 shrink-0" />
          <span className="report-info-label text-slate-500 shrink-0 font-medium">{isFa ? 'شماره قرارداد:' : 'Contract No:'}</span>
          <span className="report-info-value font-bold text-slate-900 truncate font-mono text-[9px]" title={contractNo}>
            {contractNo}
          </span>
        </div>

        {/* Project Start Date */}
        <div className="report-stakeholder-item flex items-center gap-1.5 truncate">
          <Calendar className="report-info-icon w-3 h-3 text-emerald-600 shrink-0" />
          <span className="report-info-label text-slate-500 shrink-0 font-medium">{isFa ? 'تاریخ شروع:' : 'Start Date:'}</span>
          <span className="report-info-value font-bold text-slate-800 truncate ltr-inline font-mono">{master.startDate || '1403/12/21'}</span>
        </div>

        {/* Duration */}
        <div className="report-stakeholder-item flex items-center gap-1.5 truncate">
          <Clock className="report-info-icon w-3 h-3 text-slate-400 shrink-0" />
          <span className="report-info-label text-slate-500 shrink-0 font-medium">{isFa ? 'مدت قرارداد:' : 'Duration:'}</span>
          <span className="report-info-value font-bold text-slate-800 truncate">
            {master.contractDurationText || (master.durationDays ? `${master.durationDays} روز` : '18 ماه شمسی')}
          </span>
        </div>

        {/* Contract Value IRR */}
        <div className="report-contract-badge-irr flex items-center gap-1.5 truncate bg-emerald-50/80 px-1.5 py-0.5 rounded border border-emerald-200">
          <Coins className="report-info-icon w-3 h-3 text-emerald-700 shrink-0" />
          <span className="report-info-label text-emerald-800 shrink-0 font-bold">{isFa ? 'مبلغ ریالی:' : 'IRR Value:'}</span>
          <span className="report-info-value font-extrabold text-emerald-950 font-mono text-[9.5px] truncate" title={`${Number(contractValIRR).toLocaleString()} ${isFa ? 'ریال' : 'IRR'}`}>
            {Number(contractValIRR).toLocaleString()} <span className="text-[8px] font-sans font-semibold text-emerald-800">{isFa ? 'ریال' : 'IRR'}</span>
          </span>
        </div>

        {/* Contract Value EUR */}
        <div className="report-contract-badge-eur flex items-center gap-1.5 truncate bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-200">
          <Coins className="report-info-icon w-3 h-3 text-blue-700 shrink-0" />
          <span className="report-info-label text-blue-800 shrink-0 font-bold">{isFa ? 'مبلغ ارزی:' : 'EUR Value:'}</span>
          <span className="report-info-value font-extrabold text-blue-950 font-mono text-[9.5px] truncate" title={`${Number(contractValEUR).toLocaleString()} EUR`}>
            {Number(contractValEUR).toLocaleString()} <span className="text-[8px] font-sans font-semibold text-blue-800">{isFa ? 'یورو' : 'EUR'}</span>
          </span>
        </div>
      </div>
    </header>
  );
};
