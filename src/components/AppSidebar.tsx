import React, { useState } from 'react';
import { ActiveTab, Language, Theme, ValidationIssue } from '../types';
import { LoicoLogo } from './LoicoLogo';
import { exportExecutiveReportToPdf } from '../services/pdfExportService';
import {
  LayoutDashboard,
  FileText,
  CalendarRange,
  LineChart,
  Wrench,
  Receipt,
  Users,
  TriangleAlert,
  ClipboardCheck,
  UploadCloud,
  Building2,
  History,
  ShieldCheck,
  Download,
  Printer,
  Sun,
  Palette,
  RotateCcw
} from 'lucide-react';

export type SidebarMenuItemId =
  | 'dashboard'
  | 'summary'
  | 'pms'
  | 'scurve'
  | 'equipment'
  | 'financial'
  | 'manpower'
  | 'issues'
  | 'activities'
  | 'settings'
  | 'master'
  | 'history'
  | 'validation';

interface AppSidebarProps {
  activeItem: SidebarMenuItemId;
  activeTab: ActiveTab;
  onSelectMenu: (itemId: SidebarMenuItemId) => void;
  lang: Language;
  onToggleLang: () => void;
  theme: Theme;
  onSelectTheme: (theme: Theme) => void;
  onDirectPrint: () => void;
  onResetData: () => void;
  issues: ValidationIssue[];
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeItem,
  onSelectMenu,
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

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await exportExecutiveReportToPdf('print-report-sheet', 'Executive_Daily_Report.pdf');
    } catch (err) {
      console.error('Direct PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleToggleTheme = () => {
    onSelectTheme(theme === 'loico-blue' ? 'light' : 'loico-blue');
  };

  // 1. Report Content Sections
  const reportMenuItems: {
    id: SidebarMenuItemId;
    titleFa: string;
    titleEn: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'dashboard',
      titleFa: 'داشبورد گزارش',
      titleEn: 'Executive Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'summary',
      titleFa: 'خلاصه مدیریتی پروژه',
      titleEn: 'Executive Summary',
      icon: FileText
    },
    {
      id: 'pms',
      titleFa: 'برنامه زمان‌بندی (PMS)',
      titleEn: 'PMS Progress Schedule',
      icon: CalendarRange
    },
    {
      id: 'scurve',
      titleFa: 'منحنی پیشرفت (S-Curve)',
      titleEn: 'Progress S-Curve Chart',
      icon: LineChart
    },
    {
      id: 'equipment',
      titleFa: 'تجهیزات و نصب',
      titleEn: 'Equipment & Installation',
      icon: Wrench
    },
    {
      id: 'financial',
      titleFa: 'مالی و صورت‌وضعیت',
      titleEn: 'Finance & IPC',
      icon: Receipt
    },
    {
      id: 'manpower',
      titleFa: 'منابع انسانی و کارگاه',
      titleEn: 'Manpower & Site Resources',
      icon: Users
    },
    {
      id: 'issues',
      titleFa: 'موانع و مشکلات کلیدی',
      titleEn: 'Key Issues & Constraints',
      icon: TriangleAlert
    },
    {
      id: 'activities',
      titleFa: 'فعالیت‌های مهم و تصمیمات',
      titleEn: 'Key Activities & Decisions',
      icon: ClipboardCheck
    }
  ];

  // 2. System Management Tools (Direct in the same sidebar)
  const systemToolItems: {
    id: SidebarMenuItemId;
    titleFa: string;
    titleEn: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    {
      id: 'settings',
      titleFa: 'ورود اطلاعات اکسل',
      titleEn: 'Excel Data Import',
      icon: UploadCloud
    },
    {
      id: 'master',
      titleFa: 'داده‌های پایه پروژه',
      titleEn: 'Master Data Setup',
      icon: Building2
    },
    {
      id: 'history',
      titleFa: 'سوابق و تاریخچه تغییرات',
      titleEn: 'Audit & Version History',
      icon: History
    },
    {
      id: 'validation',
      titleFa: 'اعتبارسنجی و خطایابی داده‌ها',
      titleEn: 'Data Validation Diagnostics',
      icon: ShieldCheck,
      badge: warningCount
    }
  ];

  return (
    <aside
      id="app-sidebar"
      className="app-sidebar no-print transition-all select-none flex flex-col shrink-0"
      aria-label={isFa ? 'ناوبری سامانه گزارش مدیریتی' : 'Executive Navigation Sidebar'}
    >
      {/* 1. LOICO Logo Section (84px height) */}
      <div className="sidebar-logo flex flex-col items-center justify-center shrink-0 h-[84px]">
        <button
          type="button"
          onClick={() => onSelectMenu('dashboard')}
          className="flex flex-col items-center justify-center gap-1 group cursor-pointer focus:outline-hidden"
          title={isFa ? 'داشبورد گزارش مدیریتی LOICO' : 'LOICO Executive Dashboard'}
        >
          <LoicoLogo size={32} id="sidebar-loico-logo" />
          <div className="text-center">
            <span className="font-extrabold text-[10.5px] text-white tracking-wider leading-none block">
              LOICO
            </span>
            <span className="text-[7.5px] text-[#B9CFF1] font-mono block mt-0.5 opacity-85">
              CCPP 500MW
            </span>
          </div>
        </button>
      </div>

      {/* 2. Unified Navigation Scroll Area */}
      <nav className="sidebar-nav flex-1 overflow-y-auto overflow-x-hidden py-1 space-y-1">
        {/* Report Section Anchors */}
        {reportMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          const tooltip = isFa ? item.titleFa : item.titleEn;

          return (
            <div key={item.id} className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={() => onSelectMenu(item.id)}
                className={`sidebar-item flex items-center justify-center transition-all cursor-pointer focus:outline-hidden ${
                  isActive ? 'active' : ''
                }`}
                title={tooltip}
                aria-label={tooltip}
              >
                <div className="sidebar-icon-wrap flex items-center justify-center shrink-0">
                  <Icon className="w-[19px] h-[19px]" />
                </div>
              </button>

              {/* Floating Tooltip to the Left of the Right Sidebar */}
              <div className="sidebar-tooltip-popup pointer-events-none absolute right-[100%] top-1/2 -translate-y-1/2 mr-2 px-2.5 py-1 bg-[#061A3A] border border-cyan-500/40 text-white text-[10.5px] font-medium rounded-md shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
                {tooltip}
              </div>
            </div>
          );
        })}

        {/* Subtle Separator */}
        <div className="my-1.5 mx-3 border-t border-white/8" />

        {/* System Management Tools */}
        {systemToolItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          const tooltip = isFa ? item.titleFa : item.titleEn;

          return (
            <div key={item.id} className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={() => onSelectMenu(item.id)}
                className={`sidebar-item flex items-center justify-center transition-all cursor-pointer relative focus:outline-hidden ${
                  isActive ? 'active' : ''
                }`}
                title={tooltip}
                aria-label={tooltip}
              >
                <div className="sidebar-icon-wrap flex items-center justify-center shrink-0">
                  <Icon className="w-[19px] h-[19px]" />
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`absolute top-1.5 right-2 px-1 rounded-full text-[7.5px] font-bold ${
                    isActive ? 'bg-rose-500 text-white' : 'bg-rose-900 text-rose-200 border border-rose-600/60'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>

              {/* Floating Tooltip to the Left of the Right Sidebar */}
              <div className="sidebar-tooltip-popup pointer-events-none absolute right-[100%] top-1/2 -translate-y-1/2 mr-2 px-2.5 py-1 bg-[#061A3A] border border-cyan-500/40 text-white text-[10.5px] font-medium rounded-md shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
                {tooltip}
              </div>
            </div>
          );
        })}
      </nav>

      {/* 3. Bottom Actions: Direct PDF & Direct Print */}
      <div className="sidebar-bottom p-2 border-t border-white/8 space-y-1.5 shrink-0">
        {/* PDF Export Button (Direct single-click A4 Landscape download) */}
        <div className="relative group">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className={`w-full h-[38px] flex items-center justify-center gap-1 rounded-lg text-white font-bold text-[10px] transition shadow-xs cursor-pointer disabled:opacity-50 ${
              isExportingPdf
                ? 'bg-blue-800'
                : 'bg-linear-to-r from-[#0D4CA8] to-[#0A63D8] hover:from-[#0A63D8] hover:to-[#0D4CA8] border border-blue-400/40'
            }`}
            title={isFa ? 'خروجی مستقیم فایل PDF استاندارد A4' : 'Direct Export A4 PDF'}
            aria-label="Export PDF"
          >
            <Download className={`w-4 h-4 shrink-0 ${isExportingPdf ? 'animate-bounce' : ''}`} />
            <span className="font-sans font-bold">{isExportingPdf ? (isFa ? '...' : '...') : 'PDF'}</span>
          </button>
          <div className="sidebar-tooltip-popup pointer-events-none absolute right-[100%] top-1/2 -translate-y-1/2 mr-2 px-2.5 py-1 bg-[#061A3A] border border-cyan-500/40 text-white text-[10.5px] font-medium rounded-md shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
            {isFa ? 'خروجی مستقیم فایل PDF استاندارد A4 Landscape' : 'Direct Export A4 Landscape PDF'}
          </div>
        </div>

        {/* Print Button (Direct single-click native browser print) */}
        <div className="relative group">
          <button
            type="button"
            onClick={onDirectPrint}
            className="w-full h-[34px] flex items-center justify-center gap-1 rounded-lg bg-transparent hover:bg-white/7 text-[#D9E5F5] hover:text-white border border-white/12 font-semibold text-[10px] transition cursor-pointer"
            title={isFa ? 'چاپ مستقیم گزارش' : 'Direct Print'}
            aria-label="Direct Print Report"
          >
            <Printer className="w-3.5 h-3.5 shrink-0 text-[#B9CFF1]" />
            <span>{isFa ? 'چاپ' : 'Print'}</span>
          </button>
          <div className="sidebar-tooltip-popup pointer-events-none absolute right-[100%] top-1/2 -translate-y-1/2 mr-2 px-2.5 py-1 bg-[#061A3A] border border-cyan-500/40 text-white text-[10.5px] font-medium rounded-md shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
            {isFa ? 'چاپ مستقیم گزارش (پنجره چاپ مرورگر)' : 'Direct Print Report (Native Print Dialog)'}
          </div>
        </div>

        {/* Utility Controls Row: Theme, Language, Reset */}
        <div className="flex items-center justify-around pt-1 border-t border-white/5">
          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={handleToggleTheme}
            className="p-1 rounded hover:bg-white/8 text-[#B9CFF1] hover:text-white transition cursor-pointer"
            title={isFa ? (theme === 'loico-blue' ? 'تغییر به تم روشن' : 'تغییر به تم آبی مدیریتی') : 'Toggle Theme'}
            aria-label="Toggle Theme"
          >
            {theme === 'loico-blue' ? (
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={onToggleLang}
            className="px-1 py-0.5 rounded hover:bg-white/8 text-[#B9CFF1] hover:text-white text-[10px] font-mono font-bold transition cursor-pointer"
            title={isFa ? 'Switch to English' : 'تغییر به فارسی'}
            aria-label="Toggle Language"
          >
            {isFa ? 'EN' : 'فا'}
          </button>

          {/* Reset Demo Data */}
          <button
            type="button"
            onClick={onResetData}
            className="p-1 rounded hover:bg-white/8 text-[#B9CFF1] hover:text-rose-300 transition cursor-pointer"
            title={isFa ? 'بازنشانی داده‌ها' : 'Reset Demo Data'}
            aria-label="Reset Data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
