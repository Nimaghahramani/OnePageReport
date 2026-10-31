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
  const uid = React.useId().replace(/:/g, '');
  const themeGradId = `persian-theme-grad-${uid}`;
  const hBorderPatternId = `persian-h-border-${uid}`;
  const vBorderPatternId = `persian-v-border-${uid}`;
  const girihWatermarkId = `persian-girih-watermark-${uid}`;

  const isFa = lang === 'fa';
  const contractValIRR = master.contractValueIRR || master.contractAmountIRR || master.contractValue || 4653170392630;
  const contractValEUR = master.contractValueEUR || master.contractAmountEUR || 673167;
  const contractNo = daily.contractNumber || master.contractNumber || '125 / 1234 / 3 - 1 ص پ';
  const contractSubject = daily.contractSubject || master.scopeDescriptionFa || (isFa ? 'تکمیل و تجهیز اسکله P1' : 'Completion & Equipping of Jetty P1');

  return (
    <header
      id="report-header-card"
      className="report-header project-header report-project-info mb-2 rounded-lg border border-blue-900/25 bg-linear-to-l from-slate-50 via-blue-50/40 to-slate-50 px-3 pt-2.5 pb-2 text-slate-900 shadow-2xs relative overflow-hidden print:break-inside-avoid print:border-blue-900/35"
    >
      {/* Top Signature Theme Gradient Bar (Navy -> Blue -> Teal) */}
      <div
        className="report-header-geometric-border absolute top-0 inset-x-0 h-1 bg-linear-to-l from-blue-900 via-blue-600 to-teal-600 pointer-events-none select-none z-10"
        aria-hidden="true"
      />

      {/* Subtle SVG-Based Persian Geometric Border & Girih Watermark Background */}
      <div
        className="report-header-watermark absolute inset-0 pointer-events-none select-none overflow-hidden z-0"
        aria-hidden="true"
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 1200 136"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Multi-stop gradient using the existing report & KPI theme colors */}
            <linearGradient id={themeGradId} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="22%" stopColor="#4f46e5" />
              <stop offset="45%" stopColor="#0284c7" />
              <stop offset="68%" stopColor="#0d9488" />
              <stop offset="85%" stopColor="#059669" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            {/* Horizontal Persian Geometric Border Band (حاشیه گره‌چینی و زنجیره خاتم افقی) */}
            <pattern
              id={hBorderPatternId}
              x="0"
              y="0"
              width="32"
              height="12"
              patternUnits="userSpaceOnUse"
            >
              <g fill="none" stroke={`url(#${themeGradId})`} strokeWidth="0.95" opacity="0.22">
                {/* Outer border rails */}
                <line x1="0" y1="1.2" x2="32" y2="1.2" strokeWidth="0.65" />
                <line x1="0" y1="10.8" x2="32" y2="10.8" strokeWidth="0.65" />
                {/* Interlocking Persian Khatam lozenge & 8-point star chain */}
                <polygon
                  points="16,1.8 23,6 16,10.2 9,6"
                  fill="#0284c7"
                  fillOpacity="0.14"
                  stroke="#1e3a8a"
                />
                <polygon
                  points="16,3.4 20.2,6 16,8.6 11.8,6"
                  fill="#0d9488"
                  fillOpacity="0.18"
                  stroke="#0d9488"
                  strokeWidth="0.7"
                />
                {/* Connecting geometric braid (زنجیره سلیمانی) */}
                <path d="M0,6 L4.5,2.2 L9,6 L4.5,9.8 Z" fill="#4f46e5" fillOpacity="0.10" />
                <path d="M23,6 L27.5,2.2 L32,6 L27.5,9.8 Z" fill="#4f46e5" fillOpacity="0.10" />
                <circle cx="16" cy="6" r="1.1" fill="#d97706" fillOpacity="0.45" stroke="none" />
                <circle cx="0" cy="6" r="1" fill="#0d9488" fillOpacity="0.4" stroke="none" />
                <circle cx="32" cy="6" r="1" fill="#0d9488" fillOpacity="0.4" stroke="none" />
              </g>
            </pattern>

            {/* Vertical Persian Geometric Border Band (حاشیه گره‌چینی عمودی) */}
            <pattern
              id={vBorderPatternId}
              x="0"
              y="0"
              width="12"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              <g fill="none" stroke={`url(#${themeGradId})`} strokeWidth="0.9" opacity="0.22">
                <line x1="1.2" y1="0" x2="1.2" y2="28" strokeWidth="0.65" />
                <line x1="10.8" y1="0" x2="10.8" y2="28" strokeWidth="0.65" />
                <polygon
                  points="6,6 10.2,14 6,22 1.8,14"
                  fill="#0284c7"
                  fillOpacity="0.14"
                  stroke="#1e3a8a"
                />
                <path d="M6,0 L9.5,3 L6,6 L2.5,3 Z" fill="#0d9488" fillOpacity="0.12" />
                <path d="M6,22 L9.5,25 L6,28 L2.5,25 Z" fill="#0d9488" fillOpacity="0.12" />
                <circle cx="6" cy="14" r="1.1" fill="#d97706" fillOpacity="0.45" stroke="none" />
              </g>
            </pattern>

            {/* Subtle Interior Girih Star-and-Cross Watermark Lattice */}
            <pattern
              id={girihWatermarkId}
              x="0"
              y="0"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <g stroke={`url(#${themeGradId})`} strokeWidth="0.7" fill="none" opacity="0.065">
                {/* Octagonal Girih Frame */}
                <polygon points="30,3 47,13 57,30 47,47 30,57 13,47 3,30 13,13" />
                {/* 8-Pointed Khatam Star (شمسه هشت‌پر) */}
                <polygon points="30,9 36,24 51,30 36,36 30,51 24,36 9,30 24,24" fill="#0284c7" fillOpacity="0.15" />
                <polygon points="15,15 30,21 45,15 39,30 45,45 30,39 15,45 21,30" stroke="#0d9488" />
                {/* Central Rosette */}
                <circle cx="30" cy="30" r="4.5" stroke="#d97706" strokeWidth="0.65" />
                {/* Corner Interlocks */}
                <path d="M0,13 L13,13 L13,0 M47,0 L47,13 L60,13 M60,47 L47,47 L47,60 M13,60 L13,47 L0,47" />
              </g>
            </pattern>
          </defs>

          {/* 1. Interior Subtle Girih Lattice Watermark */}
          <rect x="12" y="12" width="1176" height="112" fill={`url(#${girihWatermarkId})`} />

          {/* 2. Continuous Perimeter Persian Geometric Border Frame (Top, Bottom, Left, Right) */}
          {/* Top Geometric Border Strip (just below the 4px gradient bar) */}
          <rect x="14" y="3" width="1172" height="11" fill={`url(#${hBorderPatternId})`} />
          {/* Bottom Geometric Border Strip */}
          <rect x="14" y="123" width="1172" height="11" fill={`url(#${hBorderPatternId})`} />
          {/* Left Geometric Border Strip */}
          <rect x="2" y="14" width="11" height="108" fill={`url(#${vBorderPatternId})`} />
          {/* Right Geometric Border Strip */}
          <rect x="1187" y="14" width="11" height="108" fill={`url(#${vBorderPatternId})`} />

          {/* Inner Hairline Frame */}
          <rect
            x="13"
            y="14"
            width="1174"
            height="109"
            rx="4"
            fill="none"
            stroke={`url(#${themeGradId})`}
            strokeWidth="0.75"
            strokeOpacity="0.22"
          />

          {/* 3. Four Corner Persian Khatam Rosettes (گلجام چهارگوشه) */}
          {[
            { cx: 8, cy: 9 },
            { cx: 1192, cy: 9 },
            { cx: 8, cy: 128 },
            { cx: 1192, cy: 128 },
          ].map((corner, idx) => (
            <g key={idx} transform={`translate(${corner.cx}, ${corner.cy})`} opacity="0.26">
              <rect x="-6" y="-6" width="12" height="12" rx="2" fill="#eff6ff" stroke="#1e3a8a" strokeWidth="0.85" />
              <polygon points="0,-5 1.8,-1.8 5,0 1.8,1.8 0,5 -1.8,1.8 -5,0 -1.8,-1.8" fill="#0d9488" fillOpacity="0.35" stroke="#0284c7" strokeWidth="0.65" />
              <circle cx="0" cy="0" r="1.4" fill="#d97706" />
            </g>
          ))}

          {/* 4. Twin Ornamental Shamseh Medallion Watermarks (Left & Right Flanks) */}
          <g transform="translate(155, 68)" opacity="0.075" stroke={`url(#${themeGradId})`} fill="none">
            <circle cx="0" cy="0" r="58" strokeWidth="0.95" strokeDasharray="3 2" />
            <circle cx="0" cy="0" r="46" strokeWidth="1.1" stroke="#1e3a8a" />
            <circle cx="0" cy="0" r="32" strokeWidth="0.85" stroke="#0d9488" />
            <polygon
              points="0,-46 13,-13 46,0 13,13 0,46 -13,13 -46,0 -13,-13"
              strokeWidth="1.1"
              fill="#0284c7"
              fillOpacity="0.12"
            />
            <polygon
              points="-32,-32 0,-18 32,-32 18,0 32,32 0,18 -32,32 -18,0"
              strokeWidth="1"
              stroke="#059669"
            />
            <circle cx="0" cy="0" r="9" strokeWidth="1.1" fill="#d97706" fillOpacity="0.2" />
          </g>

          <g transform="translate(1045, 68)" opacity="0.075" stroke={`url(#${themeGradId})`} fill="none">
            <circle cx="0" cy="0" r="58" strokeWidth="0.95" strokeDasharray="3 2" />
            <circle cx="0" cy="0" r="46" strokeWidth="1.1" stroke="#1e3a8a" />
            <circle cx="0" cy="0" r="32" strokeWidth="0.85" stroke="#0d9488" />
            <polygon
              points="0,-46 13,-13 46,0 13,13 0,46 -13,13 -46,0 -13,-13"
              strokeWidth="1.1"
              fill="#0284c7"
              fillOpacity="0.12"
            />
            <polygon
              points="-32,-32 0,-18 32,-32 18,0 32,32 0,18 -32,32 -18,0"
              strokeWidth="1"
              stroke="#4f46e5"
            />
            <circle cx="0" cy="0" r="9" strokeWidth="1.1" fill="#d97706" fillOpacity="0.2" />
          </g>
        </svg>
      </div>

      {/* Top Banner (ROW 1: Project title + logo on right, organized single-line metadata on left) */}
      <div className="report-header-top-banner relative z-10 flex items-center justify-between gap-3 pt-0.5 print:break-inside-avoid">
        {/* Right Section (in RTL): Logo + Project Title & Subtitle */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="report-header-logo-container flex items-center justify-center p-1 bg-white border border-blue-200/90 rounded-lg shadow-2xs shrink-0 print:break-inside-avoid">
            <LoicoLogo size={40} id={`report-header-loico-logo-${uid}`} />
          </div>
          <div className="min-w-0">
            <h1 className="report-project-title text-[16px] md:text-[17.5px] font-extrabold tracking-tight text-slate-900 leading-snug whitespace-nowrap truncate">
              {isFa ? master.projectNameFa : master.projectNameEn}
            </h1>
            <div className="report-project-subtitle text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
              <span className="report-subtitle-badge bg-blue-900 text-white border border-blue-800 px-2 py-0.5 rounded text-[10.5px] font-extrabold uppercase tracking-wide shadow-2xs print:bg-blue-900 print:text-white">
                {isFa ? 'گزارش مدیریتی روزانه پروژه' : 'DAILY EXECUTIVE PROJECT REPORT'}
              </span>
              <span className="report-subtitle-divider text-slate-300 font-normal">|</span>
              <span className="report-location-text text-slate-800 font-extrabold text-[11px] bg-white/90 border border-slate-200/90 px-2 py-0.5 rounded">
                {isFa ? master.locationFa : master.locationEn}
              </span>
            </div>
          </div>
        </div>

        {/* Left Section (in RTL): Neatly organized single-line metadata bar & QR button */}
        <div className="flex items-center gap-1.5 shrink-0 print:break-inside-avoid">
          {/* Metadata items grouped in a clean, unified container with zero line wrapping */}
          <div className="report-date-row flex items-center gap-1.5 bg-white/95 border border-slate-300/90 rounded-lg p-1 shadow-2xs whitespace-nowrap">
            {/* 1. Report Date & Day */}
            <div className="flex items-center gap-1.5 bg-rose-50/80 border border-rose-200/80 rounded-md px-2 py-0.5 whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="report-meta-label text-rose-950 font-bold text-[11px] whitespace-nowrap">
                {isFa ? 'تاریخ گزارش:' : 'Date:'}
              </span>
              <span className="report-meta-date font-extrabold text-rose-700 font-tabular tabular-nums tracking-tight text-[13px] ltr-inline whitespace-nowrap">
                {daily.reportDate}
              </span>
              {daily.reportDayOfWeek && (
                <span className="text-rose-950 font-extrabold bg-white px-1.5 py-0.5 rounded text-[10px] border border-rose-200 whitespace-nowrap">
                  {daily.reportDayOfWeek}
                </span>
              )}
            </div>

            {/* 2. Report Number */}
            {daily.reportNumber && (
              <div className="flex items-center gap-1 bg-blue-50/90 border border-blue-200/90 rounded-md px-2 py-0.5 whitespace-nowrap">
                <span className="report-meta-label text-blue-900 font-bold text-[11px] whitespace-nowrap">
                  {isFa ? 'شماره:' : 'No:'}
                </span>
                <span className="font-extrabold text-blue-950 font-tabular tabular-nums tracking-tight text-[13px] ltr-inline whitespace-nowrap">
                  {daily.reportNumber}
                </span>
              </div>
            )}

            {/* 3. Data Date */}
            {pms.dataDate && (
              <div className="flex items-center gap-1.5 bg-indigo-50/80 border border-indigo-200/80 rounded-md px-2 py-0.5 whitespace-nowrap">
                <span className="report-data-date-label text-indigo-950 font-bold text-[11px] whitespace-nowrap">
                  {isFa ? (
                    <>
                      تاریخ داده <span className="ltr-inline text-[9.5px] text-indigo-700 font-extrabold">(Data Date)</span>:
                    </>
                  ) : (
                    'Data Date:'
                  )}
                </span>
                <span className="report-data-date-badge font-extrabold text-indigo-950 font-tabular tabular-nums tracking-tight text-[12.5px] ltr-inline whitespace-nowrap">
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
              className="no-print inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-cyan-400/80 bg-cyan-50 hover:bg-cyan-100 text-cyan-950 font-extrabold text-[11px] transition-all cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
              title={isFa ? 'نمایش و دانلود کد QR جهت دسترسی سریع روی موبایل' : 'Share report via QR Code'}
            >
              <QrCode className="w-4 h-4 text-cyan-700 shrink-0" />
              <span>{isFa ? 'کد QR' : 'QR Code'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Contract & Stakeholders Compact Grid (ROW 2: Client + Project Manager + Consultant + Contractor) */}
      <div className="report-stakeholders-grid relative z-10 grid grid-cols-2 md:grid-cols-4 gap-1.5 mt-1.5 pt-1.5 border-t border-slate-200/90 text-[11px] print:break-inside-avoid print:grid print:grid-cols-4">
        {/* 1. Client / کارفرما */}
        <div className="report-stakeholder-item flex items-center gap-1.5 min-w-0 truncate bg-blue-50/75 border border-blue-200/85 rounded px-2 py-1">
          <Building className="report-info-icon w-3.5 h-3.5 text-blue-700 shrink-0" />
          <span className="report-info-label text-blue-900 shrink-0 font-bold text-[11px]">{isFa ? 'کارفرما:' : 'Client:'}</span>
          <span className="report-info-value font-extrabold text-blue-950 text-[11.5px] truncate" title={isFa ? (master.clientNameFa || 'شرکت ملی صنایع پتروشیمی') : (master.clientNameEn || 'NPC')}>
            {isFa ? (master.clientNameFa || 'شرکت ملی صنایع پتروشیمی') : (master.clientNameEn || 'NPC')}
          </span>
        </div>

        {/* 2. Project Manager (MC) / مدیریت طرح */}
        <div className="report-stakeholder-item flex items-center gap-1.5 min-w-0 truncate bg-indigo-50/75 border border-indigo-200/85 rounded px-2 py-1">
          <Building className="report-info-icon w-3.5 h-3.5 text-indigo-700 shrink-0" />
          <span className="report-info-label text-indigo-900 shrink-0 font-bold text-[11px]">{isFa ? 'مدیریت طرح:' : 'Project Manager:'}</span>
          <span className="report-info-value font-extrabold text-blue-950 text-[11.5px] truncate" title={isFa ? (master.projectManagerFa || 'مهندسان مشاور ستیران') : (master.projectManagerEn || 'Scetiran')}>
            {isFa ? (master.projectManagerFa || 'مهندسان مشاور ستیران') : (master.projectManagerEn || 'Scetiran')}
          </span>
        </div>

        {/* 3. Consultant / مشاور */}
        <div className="report-stakeholder-item flex items-center gap-1.5 min-w-0 truncate bg-amber-50/75 border border-amber-200/85 rounded px-2 py-1">
          <Building className="report-info-icon w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="report-info-label text-amber-900 shrink-0 font-bold text-[11px]">{isFa ? 'مشاور:' : 'Consultant:'}</span>
          <span className="report-info-value font-extrabold text-blue-950 text-[11.5px] truncate" title={isFa ? (master.consultantNameFa || 'مهندسین مشاور تدبیر ساحل پارس') : (master.consultantNameEn || 'Tadbir Sahel Pars')}>
            {isFa ? (master.consultantNameFa || 'مهندسین مشاور تدبیر ساحل پارس') : (master.consultantNameEn || 'Tadbir Sahel Pars')}
          </span>
        </div>

        {/* 4. Contractor / پیمانکار */}
        <div className="report-stakeholder-item flex items-center gap-1.5 min-w-0 truncate bg-teal-50/75 border border-teal-200/85 rounded px-2 py-1">
          <Building className="report-info-icon w-3.5 h-3.5 text-teal-700 shrink-0" />
          <span className="report-info-label text-teal-900 shrink-0 font-bold text-[11px]">{isFa ? 'پیمانکار:' : 'Contractor:'}</span>
          <span className="report-info-value font-extrabold text-blue-950 text-[11.5px] truncate" title={isFa ? (master.contractorNameFa || 'شرکت نواندیشان فراساحل لیان') : (master.contractorNameEn || 'Lian')}>
            {isFa ? (master.contractorNameFa || 'شرکت نواندیشان فراساحل لیان') : (master.contractorNameEn || 'Lian')}
          </span>
        </div>
      </div>

      {/* Financial Values & Contract Timeline (ROW 3: Proportional 12-Col Grid so full IRR amount & Contract No never clip) */}
      <div className="report-contract-values-grid relative z-10 grid grid-cols-2 sm:grid-cols-12 gap-1.5 mt-1 pt-1 border-t border-slate-200/80 text-[10.5px] print:break-inside-avoid print:grid print:grid-cols-12">
        {/* Contract Number (3 cols) */}
        <div className="report-stakeholder-item sm:col-span-3 print:col-span-3 flex items-center gap-1.5 bg-white/95 border border-slate-200/90 rounded px-2 py-1 min-w-0 whitespace-nowrap overflow-hidden">
          <FileText className="report-info-icon w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="report-info-label text-slate-600 shrink-0 font-bold text-[10.5px]">{isFa ? 'شماره قرارداد:' : 'Contract No:'}</span>
          <span className="report-info-value font-extrabold text-blue-950 font-tabular tabular-nums tracking-tight text-[11.5px] truncate" title={contractNo}>
            {contractNo}
          </span>
        </div>

        {/* Project Start Date (2 cols) */}
        <div className="report-stakeholder-item sm:col-span-2 print:col-span-2 flex items-center gap-1.5 bg-white/95 border border-slate-200/90 rounded px-2 py-1 min-w-0 whitespace-nowrap overflow-hidden">
          <Calendar className="report-info-icon w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="report-info-label text-slate-600 shrink-0 font-bold text-[10.5px]">{isFa ? 'تاریخ شروع:' : 'Start Date:'}</span>
          <span className="report-info-value font-extrabold text-blue-950 ltr-inline font-tabular tabular-nums tracking-tight text-[12px]">{master.startDate || '1403/12/21'}</span>
        </div>

        {/* Duration (2 cols) */}
        <div className="report-stakeholder-item sm:col-span-2 print:col-span-2 flex items-center gap-1.5 bg-white/95 border border-slate-200/90 rounded px-2 py-1 min-w-0 whitespace-nowrap overflow-hidden">
          <Clock className="report-info-icon w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="report-info-label text-slate-600 shrink-0 font-bold text-[10.5px]">{isFa ? 'مدت قرارداد:' : 'Duration:'}</span>
          <span className="report-info-value font-extrabold text-blue-950 text-[11.5px] whitespace-nowrap truncate">
            {master.contractDurationText || (master.durationDays ? `${master.durationDays} روز` : '18 ماه شمسی')}
          </span>
        </div>

        {/* Contract Value IRR (3 cols - wide enough to show full 4,653,170,392,630 ریال without truncation) */}
        <div className="report-contract-badge-irr sm:col-span-3 print:col-span-3 flex items-center justify-between gap-1 bg-emerald-50/95 px-2 py-1 rounded border border-emerald-300/90 min-w-0 whitespace-nowrap overflow-hidden">
          <div className="flex items-center gap-1 shrink-0">
            <Coins className="report-info-icon w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="report-info-label text-emerald-950 font-extrabold text-[10.5px]">{isFa ? 'مبلغ ریالی:' : 'IRR Value:'}</span>
          </div>
          <span className="report-info-value font-extrabold text-emerald-950 font-tabular tabular-nums tracking-tight text-[12px] whitespace-nowrap" title={`${Number(contractValIRR).toLocaleString()} ${isFa ? 'ریال' : 'IRR'}`}>
            <span className="ltr-inline">{Number(contractValIRR).toLocaleString('en-US')}</span>{' '}
            <span className="text-[9.5px] font-sans font-extrabold text-emerald-800">{isFa ? 'ریال' : 'IRR'}</span>
          </span>
        </div>

        {/* Contract Value EUR (2 cols) */}
        <div className="report-contract-badge-eur sm:col-span-2 print:col-span-2 flex items-center justify-between gap-1 bg-blue-50/95 px-2 py-1 rounded border border-blue-300/90 min-w-0 whitespace-nowrap overflow-hidden">
          <div className="flex items-center gap-1 shrink-0">
            <Coins className="report-info-icon w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span className="report-info-label text-blue-950 font-extrabold text-[10.5px]">{isFa ? 'مبلغ ارزی:' : 'EUR Value:'}</span>
          </div>
          <span className="report-info-value font-extrabold text-blue-950 font-tabular tabular-nums tracking-tight text-[12px] whitespace-nowrap" title={`${Number(contractValEUR).toLocaleString()} EUR`}>
            <span className="ltr-inline">{Number(contractValEUR).toLocaleString('en-US')}</span>{' '}
            <span className="text-[9.5px] font-sans font-extrabold text-blue-800">{isFa ? 'یورو' : 'EUR'}</span>
          </span>
        </div>
      </div>
    </header>
  );
};

