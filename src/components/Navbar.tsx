import React, { useState, useRef, useEffect } from 'react';
import { ActiveTab, Language, Theme, ValidationIssue } from '../types';
import { LoicoLogo } from './LoicoLogo';
import {
  FileText,
  UploadCloud,
  Building2,
  History,
  ShieldCheck,
  Printer,
  Eye,
  Languages,
  RotateCcw,
  Sun,
  Palette,
  Check
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  lang: Language;
  onToggleLang: () => void;
  theme: Theme;
  onSelectTheme: (theme: Theme) => void;
  onOpenPrintPreview: () => void;
  onDirectPrint: () => void;
  onResetData: () => void;
  issues: ValidationIssue[];
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  lang,
  onToggleLang,
  theme,
  onSelectTheme,
  onOpenPrintPreview,
  onDirectPrint,
  onResetData,
  issues
}) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const isFa = lang === 'fa';
  const warningCount = issues.filter(i => i.type === 'error' || i.type === 'warning').length;

  // Close theme dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    if (isThemeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isThemeMenuOpen]);

  const tabs: { id: ActiveTab; labelFa: string; labelEn: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'report',
      labelFa: 'گزارش تک‌صفحه‌ای A4',
      labelEn: '1-Page Executive Report',
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: 'update',
      labelFa: 'ورود و آپدیت داده‌ها',
      labelEn: 'Data Ingestion & Updates',
      icon: <UploadCloud className="w-4 h-4" />
    },
    {
      id: 'master',
      labelFa: 'اطلاعات پایه و Scope',
      labelEn: 'Project Master Data',
      icon: <Building2 className="w-4 h-4" />
    },
    {
      id: 'history',
      labelFa: 'تاریخچه نسخه‌ها',
      labelEn: 'Version History',
      icon: <History className="w-4 h-4" />
    },
    {
      id: 'validation',
      labelFa: 'کنترل صحت داده‌ها',
      labelEn: 'Data Quality & QA',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: warningCount
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-250 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-13">
          {/* Logo & System Brand */}
          <div className="flex items-center gap-2.5">
            <LoicoLogo size={36} id="navbar-loico-logo" />
            <div>
              <h1 className="font-extrabold text-xs md:text-sm text-slate-900 tracking-tight leading-none">
                {isFa ? 'سامانه گزارش مدیریتی روزانه پروژه' : 'Executive Daily Project Report System'}
              </h1>
              <span className="text-[9.5px] text-blue-700 font-semibold font-mono block mt-0.5">
                {isFa ? 'داشبورد کنترل پروژه تک‌صفحه‌ای A4 Landscape' : 'Single-Page A4 Landscape PM Dashboard'}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-250">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition relative cursor-pointer ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {tab.icon}
                  <span>{isFa ? tab.labelFa : tab.labelEn}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      isActive ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-rose-100 text-rose-700 border border-rose-200'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5">
            {/* Theme Selector Popover */}
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-250 text-xs font-bold transition cursor-pointer shadow-2xs"
                title={isFa ? 'انتخاب ظاهر و تم سامانه' : 'Select Theme'}
              >
                {theme === 'loico-blue' ? (
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span className="hidden sm:inline">
                  {isFa ? (theme === 'loico-blue' ? 'آبی مدیریتی' : 'روشن') : (theme === 'loico-blue' ? 'LOICO Blue' : 'Light')}
                </span>
              </button>

              {isThemeMenuOpen && (
                <div
                  className="theme-popover-menu absolute left-0 rtl:left-auto rtl:right-0 mt-1.5 w-64 bg-white border border-slate-250 rounded-lg shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                  role="menu"
                >
                  <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-200/60 mb-1">
                    {isFa ? 'ظاهر و تم سامانه' : 'UI Appearance Theme'}
                  </div>

                  {/* Option 1: Light Theme */}
                  <button
                    onClick={() => {
                      onSelectTheme('light');
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full flex items-start gap-2.5 p-2 rounded-md text-right rtl:text-right ltr:text-left transition cursor-pointer ${
                      theme === 'light'
                        ? 'bg-blue-50 text-blue-900 border border-blue-200'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                      <Sun className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs">
                          {isFa ? 'روشن' : 'Executive Light'}
                        </span>
                        {theme === 'light' && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        {isFa ? 'مناسب گزارش و کار روزمره' : 'Optimal for daily reporting & standard workflow'}
                      </span>
                    </div>
                  </button>

                  {/* Option 2: LOICO Executive Blue */}
                  <button
                    onClick={() => {
                      onSelectTheme('loico-blue');
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full flex items-start gap-2.5 p-2 rounded-md text-right rtl:text-right ltr:text-left transition cursor-pointer mt-1 ${
                      theme === 'loico-blue'
                        ? 'bg-blue-950/80 text-white border border-cyan-400/50'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="w-6 h-6 rounded bg-blue-900 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5 shadow-2xs">
                      <Palette className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs">
                          {isFa ? 'آبی مدیریتی' : 'LOICO Executive Blue'}
                        </span>
                        {theme === 'loico-blue' && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                        {isFa ? 'مناسب نمایش مدیریتی و Presentation' : 'Executive presentations & high-contrast display'}
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-250 text-xs font-bold transition cursor-pointer shadow-2xs"
              title={isFa ? 'تغییر زبان به انگلیسی' : 'Switch to Persian'}
            >
              <Languages className="w-3.5 h-3.5 text-blue-600" />
              <span>{isFa ? 'EN' : 'فا'}</span>
            </button>

            {/* Print Preview Button */}
            <button
              onClick={onOpenPrintPreview}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-250 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">{isFa ? 'پیش‌نمایش چاپ' : 'Print Preview'}</span>
            </button>

            {/* Direct Print Button */}
            <button
              onClick={onDirectPrint}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isFa ? 'چاپ / PDF' : 'Print / PDF'}</span>
            </button>

            {/* Reset Demo Data */}
            <button
              onClick={onResetData}
              className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-250 transition cursor-pointer shadow-2xs"
              title={isFa ? 'بازنشانی به داده‌های اولیه دمو' : 'Reset to Demo Data'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Sub Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto py-1.5 gap-1 border-t border-slate-200">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs whitespace-nowrap ${
                  isActive ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                <span>{isFa ? tab.labelFa : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
