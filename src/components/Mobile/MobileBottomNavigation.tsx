import React, { useState } from 'react';
import { ActiveTab, Language } from '../../types';
import { LayoutDashboard, FileText, UploadCloud, Menu, Layers, CalendarRange, LineChart, Wrench, CreditCard, AlertOctagon, Download } from 'lucide-react';

interface MobileBottomNavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenMore: () => void;
  lang: Language;
  isAdminMode?: boolean;
  onExportPdf?: () => void;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenMore,
  lang,
  isAdminMode = false,
  onExportPdf,
}) => {
  const isFa = lang === 'fa';
  const [showSectionJump, setShowSectionJump] = useState(false);

  const handleHomeClick = () => {
    if (activeTab !== 'report') {
      onSelectTab('report');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowSectionJump(false);
  };

  const handleJumpToSection = (sectionId: string) => {
    if (activeTab !== 'report') {
      onSelectTab('report');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setShowSectionJump(false);
  };

  const sections = [
    { id: 'mobile-kpi-grid', titleFa: 'شاخص‌های کلیدی (KPIs)', titleEn: 'Key KPIs', icon: LayoutDashboard },
    { id: 'mobile-executive-summary', titleFa: 'خلاصه مدیریتی', titleEn: 'Summary', icon: FileText },
    { id: 'mobile-progress-section', titleFa: 'منحنی پیشرفت (S-Curve)', titleEn: 'S-Curve', icon: LineChart },
    { id: 'mobile-pms-section', titleFa: 'ساختار شکست (PMS)', titleEn: 'PMS Progress', icon: CalendarRange },
    { id: 'mobile-equipment-section', titleFa: 'نصب تجهیزات', titleEn: 'Equipment', icon: Wrench },
    { id: 'mobile-financial-section', titleFa: 'مالی و صورت‌وضعیت', titleEn: 'Financial & IPC', icon: CreditCard },
    { id: 'mobile-issues-section', titleFa: 'موانع و فعالیت‌ها', titleEn: 'Issues & Activities', icon: AlertOctagon }
  ];

  return (
    <>
      {/* Quick Section Jump Floating Sheet */}
      {showSectionJump && (
        <div className="fixed inset-0 z-45 flex items-end justify-center bg-black/50 backdrop-blur-2xs">
          <div className="absolute inset-0" onClick={() => setShowSectionJump(false)} />
          <div className="relative w-full max-w-[440px] bg-white rounded-t-2xl p-4 shadow-2xl border-t border-slate-200 z-50 mb-[62px] max-h-80 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
              <span className="text-xs font-bold text-slate-900">{isFa ? 'پرش به بخش‌های گزارش' : 'Jump to Section'}</span>
              <button
                type="button"
                onClick={() => setShowSectionJump(false)}
                className="text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleJumpToSection(s.id)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-100 text-slate-800 text-[10.5px] font-medium text-right rtl:text-right ltr:text-left transition-colors cursor-pointer"
                  >
                    <Icon className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{isFa ? s.titleFa : s.titleEn}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar - Aligned to Centered Shell */}
      <nav
        id="mobile-bottom-nav"
        className="mobile-bottom-navigation public-mobile-bottom-nav fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] h-[62px] bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg z-40 flex items-center justify-around px-2 select-none no-print sm:rounded-t-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label={isFa ? 'ناوبری موبایل' : 'Mobile Bottom Navigation'}
      >
        {/* 1. Home / Dashboard */}
        <button
          type="button"
          onClick={handleHomeClick}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'report' && !showSectionJump
              ? 'text-blue-900 font-bold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className={`p-1 rounded-lg transition-all ${activeTab === 'report' && !showSectionJump ? 'bg-blue-100/80 text-blue-900' : ''}`}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-[10px] leading-none tracking-tight">{isFa ? 'خانه' : 'Home'}</span>
        </button>

        {/* 2. Report Sections Jump */}
        <button
          type="button"
          onClick={() => setShowSectionJump(!showSectionJump)}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
            showSectionJump ? 'text-blue-900 font-bold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className={`p-1 rounded-lg transition-all ${showSectionJump ? 'bg-blue-100/80 text-blue-900' : ''}`}>
            <Layers className="w-5 h-5" />
          </div>
          <span className="text-[10px] leading-none tracking-tight">{isFa ? 'بخش‌ها' : 'Sections'}</span>
        </button>

        {/* 3. Data / Import (Admin) or PDF Export (Public) */}
        {isAdminMode ? (
          <button
            type="button"
            onClick={() => {
              setShowSectionJump(false);
              onSelectTab('update');
            }}
            className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'update'
                ? 'text-blue-900 font-bold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${activeTab === 'update' ? 'bg-blue-100/80 text-blue-900' : ''}`}>
              <UploadCloud className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-none tracking-tight">{isFa ? 'داده‌ها' : 'Data'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowSectionJump(false);
              if (onExportPdf) onExportPdf();
            }}
            className="flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-blue-900 transition-colors cursor-pointer"
          >
            <div className="p-1 rounded-lg">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[10px] leading-none tracking-tight">{isFa ? 'خروجی PDF' : 'PDF'}</span>
          </button>
        )}

        {/* 4. More Menu Sheet */}
        <button
          type="button"
          onClick={() => {
            setShowSectionJump(false);
            onOpenMore();
          }}
          className="flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <div className="p-1 rounded-lg">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] leading-none tracking-tight">{isFa ? 'منو' : 'Menu'}</span>
        </button>
      </nav>
    </>
  );
};
