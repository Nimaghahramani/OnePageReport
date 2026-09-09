import React, { useState } from 'react';
import { ProjectMasterData, PmsRecord, DailyReportRecord, Language, CalculatedReportKPIs } from '../../types';
import { LoicoLogo } from '../LoicoLogo';
import { Calendar, Building, FileText, Info, ChevronDown, ChevronUp, MapPin, Clock, QrCode } from 'lucide-react';

interface MobileReportHeaderProps {
  master: ProjectMasterData;
  pms: PmsRecord;
  daily: DailyReportRecord;
  kpis: CalculatedReportKPIs;
  lang: Language;
  onOpenQrModal?: () => void;
}

export const MobileReportHeader: React.FC<MobileReportHeaderProps> = ({
  master,
  pms,
  daily,
  lang,
  onOpenQrModal
}) => {
  const isFa = lang === 'fa';
  const [showProjectDetails, setShowProjectDetails] = useState(false);

  const contractValIRR = master.contractValueIRR || master.contractAmountIRR || master.contractValue || 4653170392630;
  const contractValEUR = master.contractValueEUR || master.contractAmountEUR || 673167;

  return (
    <header id="mobile-report-header" className="mobile-report-header bg-white border border-slate-200 rounded-xl p-3 shadow-xs mb-2.5">
      {/* Top Identity Row: Logo + Project Title */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center p-1 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
            <LoicoLogo size={30} id="mobile-header-logo" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[13.5px] font-bold text-slate-900 leading-tight truncate" title={isFa ? master.projectNameFa : master.projectNameEn}>
              {isFa ? master.projectNameFa : master.projectNameEn}
            </h1>
            <p className="text-[9.5px] font-semibold text-blue-900 flex items-center gap-1 mt-0.5 truncate">
              <span className="bg-blue-50 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                {isFa ? 'گزارش مدیریتی روزانه' : 'DAILY REPORT'}
              </span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="text-slate-500 font-medium truncate">{isFa ? master.locationFa : master.locationEn}</span>
            </p>
          </div>
        </div>

        {/* Share QR Code Button */}
        {onOpenQrModal && (
          <button
            type="button"
            onClick={onOpenQrModal}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200/90 text-blue-950 font-bold text-[10px] transition-all cursor-pointer shadow-2xs"
            title={isFa ? 'تولید و اشتراک‌گذاری بارکد QR گزارش' : 'Share QR Code'}
          >
            <QrCode className="w-3.5 h-3.5 text-blue-700" />
            <span>{isFa ? 'کد QR' : 'QR'}</span>
          </button>
        )}
      </div>

      {/* Date Strip: Report Date + PMS Data Date */}
      <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-100 text-[10px]">
        <div className="flex items-center justify-between px-2 py-1 bg-slate-50 border border-slate-250 rounded-lg">
          <span className="text-slate-500 font-medium text-[9px]">{isFa ? 'تاریخ گزارش:' : 'Report Date:'}</span>
          <div className="flex items-center gap-1">
            <span className="font-black text-rose-700 text-[11px] ltr-inline font-mono">{daily.reportDate}</span>
            {daily.reportDayOfWeek && (
              <span className="text-slate-700 font-semibold text-[8.5px] bg-slate-200/90 px-1 py-0.2 rounded">({daily.reportDayOfWeek})</span>
            )}
            {daily.reportNumber && (
              <span className="text-blue-900 font-bold text-[8.5px] bg-blue-100 px-1 py-0.2 rounded border border-blue-200">
                #{daily.reportNumber}
              </span>
            )}
          </div>
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
              <span className="text-slate-500">{isFa ? 'شماره قرارداد:' : 'Contract No:'}</span>
              <span className="font-bold text-slate-900 font-mono text-[9px]">{daily.contractNumber || master.contractNumber || '125/ 1234 / 3 - 1 ص پ'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{isFa ? 'موضوع قرارداد:' : 'Contract Subject:'}</span>
              <span className="font-bold text-slate-800">{daily.contractSubject || master.scopeDescriptionFa || 'تکمیل و تجهیز اسکله P1'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{isFa ? 'شماره گزارش:' : 'Report No:'}</span>
              <span className="font-bold text-blue-900 font-mono">{daily.reportNumber || 526}</span>
            </div>
            <div className="flex items-center justify-between bg-emerald-50/60 -mx-1 px-1 py-0.5 rounded border border-emerald-200/60">
              <span className="text-emerald-800 font-semibold">{isFa ? 'مبلغ ریالی قرارداد:' : 'Contract Value (IRR):'}</span>
              <span className="font-extrabold text-emerald-950 font-mono text-[9.5px]">
                {Number(contractValIRR).toLocaleString()} {isFa ? 'ریال' : 'IRR'}
              </span>
            </div>
            <div className="flex items-center justify-between bg-blue-50/60 -mx-1 px-1 py-0.5 rounded border border-blue-200/60">
              <span className="text-blue-800 font-semibold">{isFa ? 'مبلغ ارزی قرارداد:' : 'Contract Value (EUR):'}</span>
              <span className="font-extrabold text-blue-950 font-mono text-[9.5px]">
                {Number(contractValEUR).toLocaleString()} {isFa ? 'یورو' : 'EUR'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{isFa ? 'کارفرما:' : 'Client:'}</span>
              <span className="font-bold text-slate-800">{isFa ? (master.clientNameFa || 'شرکت ملی صنایع پتروشیمی') : (master.clientNameEn || 'NPC')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{isFa ? 'مدیریت طرح:' : 'Project Manager:'}</span>
              <span className="font-bold text-slate-800">{isFa ? (master.projectManagerFa || 'مهندسان مشاور ستیران') : (master.projectManagerEn || 'Scetiran')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{isFa ? 'مشاور:' : 'Consultant:'}</span>
              <span className="font-bold text-slate-800">{isFa ? (master.consultantNameFa || 'مهندسین مشاور تدبیر ساحل پارس') : (master.consultantNameEn || 'Tadbir Sahel Pars')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{isFa ? 'پیمانکار:' : 'Contractor:'}</span>
              <span className="font-bold text-slate-800">{isFa ? (master.contractorNameFa || 'شرکت نواندیشان فراساحل لیان') : (master.contractorNameEn || 'Lian')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{isFa ? 'تاریخ شروع:' : 'Start Date:'}</span>
              <span className="font-bold text-slate-800 ltr-inline font-mono">{master.startDate || master.contractStartDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{isFa ? 'مدت قرارداد:' : 'Duration:'}</span>
              <span className="font-bold text-slate-800">{master.contractDurationText || (master.durationDays ? `${master.durationDays} روز` : `${master.contractDurationDays} روز`)}</span>
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
