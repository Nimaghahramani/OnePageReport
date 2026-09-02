import React, { useState } from 'react';
import { ActiveTab, Language, Theme, ValidationIssue } from '../../types';
import { exportExecutiveReportToPdf } from '../../services/pdfExportService';
import {
  UploadCloud,
  Building2,
  History,
  ShieldCheck,
  Download,
  Printer,
  Palette,
  RotateCcw,
  Languages,
  X,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Layers
} from 'lucide-react';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  lang: Language;
  onToggleLang: () => void;
  theme: Theme;
  onSelectTheme: (theme: Theme) => void;
  onDirectPrint: () => void;
  onResetData: () => void;
  issues: ValidationIssue[];
}

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  lang,
  onToggleLang,
  theme,
  onSelectTheme,
  onDirectPrint,
  onResetData,
  issues
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const isFa = lang === 'fa';
  const warningCount = issues.filter(i => i.type === 'error' || i.type === 'warning').length;

  if (!isOpen) return null;

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await exportExecutiveReportToPdf('print-report-sheet', 'Executive_Daily_Report.pdf');
    } catch (err) {
      console.error('Direct PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
      onClose();
    }
  };

  const handleToggleTheme = () => {
    onSelectTheme(theme === 'loico-blue' ? 'light' : 'loico-blue');
  };

  const navItems = [
    {
      id: 'update' as ActiveTab,
      titleFa: 'ورود و بارگذاری اطلاعات اکسل',
      titleEn: 'Excel Data Import',
      descFa: 'بارگذاری فایل‌های اکسل روزانه، PMS، تجهیزات و صورت‌وضعیت',
      descEn: 'Upload Daily Report, PMS, Equipment and IPC spreadsheets',
      icon: UploadCloud,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      id: 'master' as ActiveTab,
      titleFa: 'داده‌های پایه پروژه (Master Data)',
      titleEn: 'Project Master Data',
      descFa: 'مشخصات قرارداد، ارکان پروژه، تاریخ‌ها و احجام کلان',
      descEn: 'Contract specs, stakeholders, baseline dates & scope',
      icon: Building2,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    },
    {
      id: 'validation' as ActiveTab,
      titleFa: 'اعتبارسنجی و خطایابی داده‌ها',
      titleEn: 'Data Validation Diagnostics',
      descFa: 'بررسی عدم انطباق‌ها، کنترل محاسبات و لاگ‌های خطا',
      descEn: 'Audit discrepancies, calculation checks and error logs',
      icon: ShieldCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      badge: warningCount
    },
    {
      id: 'history' as ActiveTab,
      titleFa: 'سوابق و تاریخچه تغییرات',
      titleEn: 'Audit & Version History',
      descFa: 'ثبت و ردیابی ویرایش‌ها و نسخه‌های بارگذاری‌شده',
      descEn: 'Track updates and revision snapshots',
      icon: History,
      color: 'text-slate-600 bg-slate-50 border-slate-200'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-Up Bottom Sheet Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl shadow-2xl border-t border-slate-200 p-4 max-h-[85vh] overflow-y-auto z-10 flex flex-col">
        {/* Handle indicator */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              {isFa ? 'منوی مدیریت سامانه و ابزارها' : 'Management & Tools Menu'}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {isFa ? 'گزارش مدیریتی پروژه نیروگاه ۵۰۰ مگاوات LOICO' : 'LOICO 500MW CCPP Executive Portal'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Navigation Views */}
        <div className="space-y-1.5 mb-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-right rtl:text-right ltr:text-left min-h-[48px] ${
                  isActive
                    ? 'bg-blue-50/90 border-blue-400 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-900 truncate">
                        {isFa ? item.titleFa : item.titleEn}
                      </span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[8.5px] font-bold font-mono">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-500 truncate mt-0.5">
                      {isFa ? item.descFa : item.descEn}
                    </p>
                  </div>
                </div>
                {isFa ? (
                  <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Action Grid (PDF, Print, Theme, Lang, Reset) */}
        <div className="pt-2.5 border-t border-slate-200">
          <span className="text-[10px] font-bold text-slate-700 block mb-2">
            {isFa ? 'اقدامات سریع و خروجی‌ها' : 'Quick Actions & Outputs'}
          </span>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {/* 1. PDF Export */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center justify-center gap-2 p-2.5 bg-blue-900 text-white hover:bg-blue-950 rounded-xl font-bold transition-colors cursor-pointer min-h-[44px]"
            >
              <Download className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{isExportingPdf ? (isFa ? 'در حال تولید...' : 'Generating...') : (isFa ? 'خروجی PDF (A4)' : 'Export PDF (A4)')}</span>
            </button>

            {/* 2. Direct Print */}
            <button
              type="button"
              onClick={() => {
                onClose();
                setTimeout(() => onDirectPrint(), 150);
              }}
              className="flex items-center justify-center gap-2 p-2.5 bg-slate-800 text-white hover:bg-slate-900 rounded-xl font-bold transition-colors cursor-pointer min-h-[44px]"
            >
              <Printer className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isFa ? 'چاپ گزارش (A4)' : 'Print Report (A4)'}</span>
            </button>

            {/* 3. Theme Toggle */}
            <button
              type="button"
              onClick={handleToggleTheme}
              className="flex items-center justify-center gap-2 p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-medium transition-colors cursor-pointer border border-slate-200 min-h-[44px]"
            >
              <Palette className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{isFa ? (theme === 'loico-blue' ? 'پوسته روشن' : 'پوسته آبی LOICO') : (theme === 'loico-blue' ? 'Light Theme' : 'LOICO Blue Theme')}</span>
            </button>

            {/* 4. Language Toggle */}
            <button
              type="button"
              onClick={onToggleLang}
              className="flex items-center justify-center gap-2 p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-medium transition-colors cursor-pointer border border-slate-200 min-h-[44px]"
            >
              <Languages className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{isFa ? 'تغییر به English' : 'Switch to فارسی'}</span>
            </button>
          </div>

          {/* Reset Demo Data */}
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                onResetData();
              }}
              className="flex items-center gap-1.5 text-[9.5px] text-slate-500 hover:text-rose-700 transition-colors py-1 px-2 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>{isFa ? 'بازنشانی داده‌ها به حالت اولیه' : 'Reset to sample data'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
