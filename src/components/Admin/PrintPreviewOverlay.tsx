import React, { useState, useEffect, useRef } from 'react';
import {
  ProjectMasterData,
  PmsRecord,
  DailyReportRecord,
  IpcRecord,
  EquipmentRecord,
  CalculatedReportKPIs,
  Language,
  MasterSCurveRecord
} from '../../types';
import { ExecutiveReportView } from '../ExecutiveReport/ExecutiveReportView';
import { exportExecutiveReportToPdf } from '../../services/pdfExportService';
import {
  Printer,
  Download,
  X,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FileCheck,
  Sparkles,
  Layers,
  Settings2,
  Check
} from 'lucide-react';

interface PrintPreviewOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  master: ProjectMasterData;
  pms: PmsRecord;
  daily: DailyReportRecord;
  ipc: IpcRecord;
  equipment: EquipmentRecord;
  kpis: CalculatedReportKPIs;
  masterSCurve?: MasterSCurveRecord;
  lang: Language;
}

export const PrintPreviewOverlay: React.FC<PrintPreviewOverlayProps> = ({
  isOpen,
  onClose,
  master,
  pms,
  daily,
  ipc,
  equipment,
  kpis,
  masterSCurve,
  lang
}) => {
  const isFa = lang === 'fa';
  const [showHeader, setShowHeader] = useState<boolean>(true);
  const [showFooter, setShowFooter] = useState<boolean>(true);
  const [showMarginsGuide, setShowMarginsGuide] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(100);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const stageContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listeners (Escape to close, Ctrl+P to print)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleNativePrint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when overlay is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNativePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await exportExecutiveReportToPdf(
        'a4-print-preview-sheet',
        `Executive_Report_A4_${daily.reportDate ? daily.reportDate.replace(/\//g, '-') : 'P1'}.pdf`,
        'a4'
      );
    } catch (err) {
      console.error('Print preview PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoom(100);
  const handleFitToWidth = () => setZoom(85);

  return (
    <div
      id="print-preview-overlay"
      className="fixed inset-0 z-50 bg-[#0c121e] text-slate-100 flex flex-col no-print select-none overflow-hidden animate-in fade-in duration-200 font-sans"
      dir={isFa ? 'rtl' : 'ltr'}
    >
      {/* 1. TOP DOCKED CONTROL HUD TOOLBAR */}
      <header className="h-16 px-3 sm:px-5 bg-[#0f172a] border-b border-slate-750 flex items-center justify-between gap-2 shrink-0 z-30 shadow-md">
        {/* Left: Identity & Paper Specs */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-900/60 border border-blue-500/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-xs">
            <Printer className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                {isFa ? 'پیش‌نمایش چاپ استاندارد کاغذ A4 افقی' : 'A4 Landscape Paper Print Preview'}
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-950 text-cyan-300 border border-cyan-500/30">
                297 × 210 mm (ISO 216)
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {isFa
                ? 'شبیه‌سازی دقیق صفحه روی کاغذ چاپ واقعی بدون المان‌های گرافیکی مرورگر'
                : 'Exact physical paper layout simulation without UI elements'}
            </p>
          </div>
        </div>

        {/* Center: Layout Toggles (Header, Footer, Margins) & Zoom */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Header Toggle */}
          <button
            type="button"
            onClick={() => setShowHeader(!showHeader)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              showHeader
                ? 'bg-blue-950/80 text-cyan-300 border-cyan-500/40 shadow-2xs'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title={isFa ? 'تغییر وضعیت نمایش سربرگ رسمی پروژه' : 'Toggle Official Header'}
          >
            {showHeader ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{isFa ? 'سربرگ' : 'Header'}</span>
          </button>

          {/* Footer Toggle */}
          <button
            type="button"
            onClick={() => setShowFooter(!showFooter)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              showFooter
                ? 'bg-blue-950/80 text-cyan-300 border-cyan-500/40 shadow-2xs'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title={isFa ? 'تغییر وضعیت نمایش پاورقی، امضاها و مراجع' : 'Toggle Footer & Signatures'}
          >
            {showFooter ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{isFa ? 'امضا و پاورقی' : 'Footer'}</span>
          </button>

          {/* Margins Guide Toggle */}
          <button
            type="button"
            onClick={() => setShowMarginsGuide(!showMarginsGuide)}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              showMarginsGuide
                ? 'bg-slate-800 text-amber-300 border-amber-500/40'
                : 'bg-slate-850 text-slate-400 border-slate-700'
            }`}
            title={isFa ? 'نمایش خطوط راهنمای حاشیه چاپ استاندارد ۵ میلی‌متر' : 'Toggle 5mm Margin Guides'}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isFa ? 'راهنمای کادر' : 'Margin Guides'}</span>
          </button>

          {/* Zoom Group */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title={isFa ? 'کوچک‌نمایی' : 'Zoom Out'}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-1 font-mono font-bold text-[11px] text-slate-200 hover:text-white cursor-pointer"
              title={isFa ? 'تنظیم روی ۱۰۰٪' : 'Reset to 100%'}
            >
              {zoom}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 150}
              className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title={isFa ? 'بزرگ‌نمایی' : 'Zoom In'}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Actions (Print, PDF, Exit) */}
        <div className="flex items-center gap-2">
          {/* Direct Print Button */}
          <button
            type="button"
            onClick={handleNativePrint}
            className="px-3 py-1.5 rounded-lg bg-linear-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer border border-blue-400/40"
            title={isFa ? 'ارسال مستقیم به پرینتر فیزیکی یا PDF ساز سیستم (Ctrl+P)' : 'Direct Print (Ctrl+P)'}
          >
            <Printer className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">{isFa ? 'چاپ مستقیم' : 'Print'}</span>
          </button>

          {/* Export PDF (A4) */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-400/40 disabled:opacity-50"
            title={isFa ? 'تولید فایل PDF مستقل با اندازه A4 افقی' : 'Export A4 PDF'}
          >
            <Download className={`w-3.5 h-3.5 ${isExportingPdf ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">{isExportingPdf ? (isFa ? 'در حال تولید...' : 'Exporting...') : (isFa ? 'فایل PDF' : 'PDF')}</span>
          </button>

          {/* Close / Exit Overlay */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-200 border border-slate-700 hover:border-rose-600/50 transition-colors cursor-pointer"
            title={isFa ? 'خروج از حالت پیش‌نمایش چاپ (Esc)' : 'Exit Print Preview (Esc)'}
            aria-label="Exit Print Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. DRAFTING BOARD STAGE (AUTHENTIC PAPER SIMULATION) */}
      <div
        ref={stageContainerRef}
        className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start bg-[#111827] relative"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        {/* Floating Paper Presentation Card */}
        <div
          className="relative transition-transform duration-150 ease-out origin-top"
          style={{
            transform: `scale(${zoom / 100})`
          }}
        >
          {/* Top Paper Header Info Ribbon */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 mb-2 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isFa ? 'کاغذ A4 افقی (Landscape)' : 'A4 Landscape Paper Sheet'}</span>
            </span>
            <span className="text-slate-500">
              {showHeader ? (isFa ? '✓ همراه با سربرگ' : '✓ With Header') : (isFa ? '✗ بدون سربرگ' : '✗ Without Header')} •{' '}
              {showFooter ? (isFa ? '✓ همراه با پاورقی' : '✓ With Footer') : (isFa ? '✗ بدون پاورقی' : '✗ Without Footer')}
            </span>
          </div>

          {/* The Paper Physical Boundary: ISO 216 A4 Landscape (Aspect 297/210 ≈ 1.414) */}
          <div
            className="relative bg-white text-slate-900 rounded-sm shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] border-2 border-slate-300 overflow-hidden select-text"
            style={{
              width: '1122px', // Standard 96 DPI representation of 297mm
              minHeight: '793px', // Standard 96 DPI representation of 210mm
              boxSizing: 'border-box'
            }}
          >
            {/* Optional 5mm Engineering Margin Guide Outline */}
            {showMarginsGuide && (
              <div
                className="absolute inset-0 pointer-events-none border border-dashed border-amber-400/50 z-20"
                style={{
                  margin: '18px' // ~5mm margin guide
                }}
              >
                <span className="absolute top-1 left-2 text-[8.5px] font-mono text-amber-600 bg-amber-50/90 px-1 rounded border border-amber-300">
                  {isFa ? 'محدوده امن چاپ (5mm Printable Safe Area)' : '5mm Printable Safe Area'}
                </span>
              </div>
            )}

            {/* The Actual Rendered Report with Toggles Applied */}
            <div className="w-full h-full p-2.5">
              <ExecutiveReportView
                sheetId="a4-print-preview-sheet"
                master={master}
                pms={pms}
                daily={daily}
                ipc={ipc}
                equipment={equipment}
                kpis={kpis}
                masterSCurve={masterSCurve}
                lang={lang}
                showHeader={showHeader}
                showFooter={showFooter}
              />
            </div>
          </div>

          {/* Bottom Status bar under paper */}
          <div className="flex items-center justify-between text-[10.5px] text-slate-400 px-3 mt-3">
            <span>{isFa ? 'پروژه تکمیل و تجهیز اسکله P1 بندر پتروشیمی ماهشهر' : 'Jetty P1 Project - Daily Report'}</span>
            <span className="font-mono text-slate-500">
              {daily.reportDate} • {isFa ? `شماره ${daily.reportNumber || '۱۰۸'}` : `#${daily.reportNumber || '108'}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
