import React from 'react';
import { ProjectMasterData, PmsRecord, DailyReportRecord, Language, CalculatedReportKPIs } from '../../types';
import { LoicoLogo } from '../LoicoLogo';
import { Calendar, Building, FileText, Clock, Coins, QrCode } from 'lucide-react';

interface ReportHeaderProps {
  master: ProjectMasterData;
  pms: PmsRecord;
  daily: DailyReportRecord;
  kpis: CalculatedReportKPIs;
  lang: Language;
  onOpenQrModal?: () => void;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ master, pms, daily, lang, onOpenQrModal }) => {
  const isFa = lang === 'fa';
  const contractValIRR = master.contractValueIRR || master.contractAmountIRR || master.contractValue || 4653170392630;
  const contractValEUR = master.contractValueEUR || master.contractAmountEUR || 673167;
  const contractNo = daily.contractNumber || master.contractNumber || '125 / 1234 / 3 - 1 ص پ';
  const contractSubject = daily.contractSubject || master.scopeDescriptionFa || (isFa ? 'تکمیل و تجهیز اسکله P1' : 'Completion & Equipping of Jetty P1');

  return (
    <header id="report-header-card" className="report-header project-header report-project-info border-b border-slate-250 pb-1.5 mb-1.5 bg-slate-50/80 rounded-t px-2.5 pt-1.5 text-slate-900 border border-slate-200 print:break-inside-avoid print:bg-white print:border-slate-300">
      {/* Top Banner (ROW 1: Project title + logo on right, organized metadata on left) */}
      <div className="report-header-top-banner flex items-center justify-between gap-3 print:break-inside-avoid">
        {/* Right Section (in RTL): Logo + Project Title & Subtitle */}
        <div className="flex items-center gap-2.5">
          <div className="report-header-logo-container flex items-center justify-center p-1 bg-white border border-slate-200 rounded-lg shadow-2xs shrink-0 print:break-inside-avoid">
            <LoicoLogo size={36} id="report-header-loico-logo" />
          </div>
          <div>
            <h1 className="report-project-title text-sm md:text-base font-extrabold tracking-tight text-slate-900 leading-tight">
              {isFa ? master.projectNameFa : master.projectNameEn}
            </h1>
            <div className="report-project-subtitle text-[10.5px] font-medium text-slate-600 flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="report-subtitle-badge bg-blue-50 text-blue-900 border border-blue-200/80 px-2 py-0.5 rounded text-[9.5px] font-bold uppercase print:bg-blue-50 print:text-blue-900">
                {isFa ? 'گزارش مدیریتی روزانه پروژه' : 'DAILY EXECUTIVE PROJECT REPORT'}
              </span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="report-location-text text-slate-600 font-medium text-[10px]">{isFa ? master.locationFa : master.locationEn}</span>
            </div>
          </div>
        </div>

        {/* Left Section (in RTL): Neatly organized unified metadata bar & QR button */}
        <div className="flex items-center gap-2 print:break-inside-avoid">
          {/* Metadata items grouped in a clean, unified container */}
          <div className="flex items-center bg-white border border-slate-300/90 rounded-lg px-2.5 py-1 shadow-2xs divide-x divide-slate-200 rtl:divide-x-reverse text-xs">
            {/* Report Date & Day */}
            <div className="flex items-center gap-1.5 pe-2.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-slate-500 font-medium text-[10px]">{isFa ? 'تاریخ گزارش:' : 'Date:'}</span>
              <span className="font-bold text-rose-700 font-mono text-[11px] ltr-inline">{daily.reportDate}</span>
              {daily.reportDayOfWeek && (
                <span className="text-slate-700 font-semibold bg-slate-100 px-1.5 py-0.2 rounded text-[9px] border border-slate-200">
                  {daily.reportDayOfWeek}
                </span>
              )}
            </div>

            {/* Report Number */}
            {daily.reportNumber && (
              <div className="flex items-center gap-1 px-2.5">
                <span className="text-slate-500 font-medium text-[10px]">{isFa ? 'شماره:' : 'No:'}</span>
                <span className="font-black text-blue-900 font-mono text-[10.5px] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                  {isFa ? `شماره ${daily.reportNumber}` : `#${daily.reportNumber}`}
                </span>
              </div>
            )}

            {/* Data Date */}
            {pms.dataDate && (
              <div className="flex items-center gap-1.5 ps-2.5">
                <span className="text-slate-500 font-medium text-[10px]">
                  {isFa ? (
                    <>
                      تاریخ داده <span className="ltr-inline text-[8.5px] text-slate-400 font-semibold">(Data Date)</span>:
                    </>
                  ) : (
                    'Data Date:'
                  )}
                </span>
                <span className="font-bold text-slate-800 font-mono text-[11px] ltr-inline">
                  {pms.dataDate}
                </span>
              </div>
            )}
          </div>

          {/* QR Code Action Button */}
          {onOpenQrModal && (
            <button
              type="button"
              onClick={onOpenQrModal}
              className="no-print inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-cyan-300 bg-cyan-50/90 hover:bg-cyan-100 text-cyan-950 font-bold text-[9.5px] transition-all cursor-pointer shadow-2xs shrink-0"
              title={isFa ? 'نمایش و دانلود کد QR جهت دسترسی سریع روی موبایل' : 'Share report via QR Code'}
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-700" />
              <span>{isFa ? 'کد QR' : 'QR Code'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Contract & Stakeholders Compact Grid (ROW 2: Client + Project Manager + Consultant + Contractor) */}
      <div className="report-stakeholders-grid grid grid-cols-2 md:grid-cols-4 gap-2 mt-1.5 pt-1 border-t border-slate-200 text-[9.5px] print:break-inside-avoid print:grid print:grid-cols-4">
        {/* 1. Client / کارفرما */}
        <div className="report-stakeholder-item flex items-center gap-1.5 truncate">
          <Building className="report-info-icon w-3 h-3 text-blue-700 shrink-0" />
          <span className="report-info-label text-slate-500 shrink-0 font-medium">{isFa ? 'کارفرما:' : 'Client:'}</span>
          <span className="report-info-value font-bold text-slate-800 truncate" title={isFa ? (master.clientNameFa || 'شرکت ملی صنایع پتروشیمی') : (master.clientNameEn || 'NPC')}>
            {isFa ? (master.clientNameFa || 'شرکت ملی صنایع پتروشیمی') : (master.clientNameEn || 'NPC')}
          </span>
        </div>

        {/* 2. Project Manager (MC) / مدیریت طرح */}
        <div className="report-stakeholder-item flex items-center gap-1.5 truncate">
          <Building className="report-info-icon w-3 h-3 text-indigo-700 shrink-0" />
          <span className="report-info-label text-slate-500 shrink-0 font-medium">{isFa ? 'مدیریت طرح:' : 'Project Manager:'}</span>
          <span className="report-info-value font-bold text-slate-800 truncate" title={isFa ? (master.projectManagerFa || 'مهندسان مشاور ستیران') : (master.projectManagerEn || 'Scetiran')}>
            {isFa ? (master.projectManagerFa || 'مهندسان مشاور ستیران') : (master.projectManagerEn || 'Scetiran')}
          </span>
        </div>

        {/* 3. Consultant / مشاور */}
        <div className="report-stakeholder-item flex items-center gap-1.5 truncate">
          <Building className="report-info-icon w-3 h-3 text-amber-600 shrink-0" />
          <span className="report-info-label text-slate-500 shrink-0 font-medium">{isFa ? 'مشاور:' : 'Consultant:'}</span>
          <span className="report-info-value font-bold text-slate-800 truncate" title={isFa ? (master.consultantNameFa || 'مهندسین مشاور تدبیر ساحل پارس') : (master.consultantNameEn || 'Tadbir Sahel Pars')}>
            {isFa ? (master.consultantNameFa || 'مهندسین مشاور تدبیر ساحل پارس') : (master.consultantNameEn || 'Tadbir Sahel Pars')}
          </span>
        </div>

        {/* 4. Contractor / پیمانکار */}
        <div className="report-stakeholder-item flex items-center gap-1.5 truncate">
          <Building className="report-info-icon w-3 h-3 text-slate-500 shrink-0" />
          <span className="report-info-label text-slate-500 shrink-0 font-medium">{isFa ? 'پیمانکار:' : 'Contractor:'}</span>
          <span className="report-info-value font-bold text-slate-800 truncate" title={isFa ? (master.contractorNameFa || 'شرکت نواندیشان فراساحل لیان') : (master.contractorNameEn || 'Lian')}>
            {isFa ? (master.contractorNameFa || 'شرکت نواندیشان فراساحل لیان') : (master.contractorNameEn || 'Lian')}
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
