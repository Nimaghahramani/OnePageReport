import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, Language, Theme, PublishedReport } from './types';
import { projectDataStore } from './services/dataStore';
import { fetchLatestPublishedReport, checkAdminAuth, adminLogout } from './services/reportApi';
import { AppSidebar, SidebarMenuItemId } from './components/AppSidebar';
import { ExecutiveReportView } from './components/ExecutiveReport/ExecutiveReportView';
import { ProjectMasterDataView } from './components/MasterData/ProjectMasterDataView';
import { VersionHistoryView } from './components/VersionHistory/VersionHistoryView';
import { MobileExecutiveView } from './components/Mobile/MobileExecutiveView';
import { MobileBottomNavigation } from './components/Mobile/MobileBottomNavigation';
import { MobileMoreSheet } from './components/Mobile/MobileMoreSheet';
import { AdminWorkspace } from './components/Admin/AdminWorkspace';
import { AdminLoginModal } from './components/Admin/AdminLoginModal';
import { ShieldCheck, Lock, RefreshCw, AlertTriangle, FileQuestion, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('report');
  const [activeMenuItem, setActiveMenuItem] = useState<SidebarMenuItemId>('dashboard');
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Public Report Loading & Error State
  const [reportState, setReportState] = useState<'loading' | 'success' | 'not_found' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [latestPublishedMeta, setLatestPublishedMeta] = useState<{
    reportDate: string;
    version: number;
    publishedAt: string;
    publishedBy: string;
  } | null>(null);

  const [lang, setLang] = useState<Language>('fa');
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('loico-ui-theme');
      return (saved === 'loico-blue' || saved === 'light') ? saved : 'light';
    } catch {
      return 'light';
    }
  });
  const [, setRenderTrigger] = useState(0);

  // 1. Initial hydration: Load latest published snapshot from server API
  const loadPublishedData = async () => {
    setReportState('loading');
    setErrorMessage('');
    try {
      const res = await fetchLatestPublishedReport();
      if (res.success && res.data) {
        const pub: PublishedReport = res.data;
        projectDataStore.hydrateFromPublishedReport(pub);
        setLatestPublishedMeta({
          reportDate: pub.reportDate,
          version: pub.version,
          publishedAt: pub.publishedAt,
          publishedBy: pub.publishedBy
        });
        setReportState('success');
      } else {
        if (res.error?.code === 'NOT_FOUND') {
          setReportState('not_found');
          setErrorMessage(res.error.message || 'گزارش منتشرشده‌ای در دسترس نیست.');
        } else {
          setReportState('error');
          setErrorMessage(res.error?.message || 'دریافت آخرین گزارش با خطا مواجه شد.');
        }
      }
    } catch (err: any) {
      setReportState('error');
      setErrorMessage('دریافت آخرین گزارش با خطا مواجه شد.');
    }
  };

  useEffect(() => {
    loadPublishedData();
    // Check if admin is currently authenticated
    checkAdminAuth().then(auth => setIsAdminLoggedIn(auth));
  }, []);

  // 2. Subscribe to Project Data Store
  useEffect(() => {
    const unsubscribe = projectDataStore.subscribe(() => {
      setRenderTrigger(t => t + 1);
    });
    return () => unsubscribe();
  }, []);

  // 3. Update HTML document direction and language attribute
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  }, [lang]);

  // 4. Synchronize data-theme attribute on HTML root and persist to localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('loico-ui-theme', theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const master = projectDataStore.getMasterData();
  const masterSCurve = projectDataStore.getMasterSCurve();
  const pms = projectDataStore.getPms();
  const daily = projectDataStore.getDaily();
  const ipc = projectDataStore.getIpc();
  const equipment = projectDataStore.getEquipment();
  const kpis = projectDataStore.getCalculatedKPIs();
  const auditList = projectDataStore.getAuditHistory();

  const handleToggleLang = () => {
    setLang(l => l === 'fa' ? 'en' : 'fa');
  };

  const handleDirectPrint = async () => {
    try {
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready;
      }
    } catch {
      // Font readiness fallback
    }
    window.print();
  };

  const handleResetData = () => {
    // Only available if running in explicit development mode
    if (import.meta.env.DEV) {
      if (window.confirm(lang === 'fa' ? 'آیا از بازنشانی داده‌ها در محیط توسعه اطمینان دارید؟' : 'Reset development data?')) {
        projectDataStore.resetToSampleData();
      }
    }
  };

  const handleAdminLogout = () => {
    adminLogout();
    setIsAdminLoggedIn(false);
    setIsAdminMode(false);
    loadPublishedData();
  };

  const handleOpenAdmin = () => {
    if (isAdminLoggedIn) {
      setIsAdminMode(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setIsAdminMode(true);
  };

  // Smooth scroll and menu handler
  const handleSelectMenu = useCallback((itemId: SidebarMenuItemId) => {
    setActiveMenuItem(itemId);

    if (itemId === 'admin') {
      handleOpenAdmin();
      return;
    }

    // Report section navigation
    if (activeTab !== 'report') {
      setActiveTab('report');
      setTimeout(() => {
        scrollToSection(itemId);
      }, 100);
    } else {
      scrollToSection(itemId);
    }
  }, [activeTab, isAdminLoggedIn]);

  const scrollToSection = (itemId: SidebarMenuItemId) => {
    const sectionMap: Record<string, string> = {
      dashboard: 'executive-report',
      summary: 'executive-summary-section',
      pms: 'pms-section',
      scurve: 'scurve-section',
      equipment: 'equipment-section',
      financial: 'financial-section',
      manpower: 'manpower-section',
      issues: 'issues-section',
      activities: 'activities-section'
    };

    const targetId = sectionMap[itemId] || 'executive-report';
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // IntersectionObserver to auto-update active menu item when scrolling report
  useEffect(() => {
    if (activeTab !== 'report' || isAdminMode || reportState !== 'success') return;

    const sections = [
      { id: 'executive-report', menu: 'dashboard' as SidebarMenuItemId },
      { id: 'executive-summary-section', menu: 'summary' as SidebarMenuItemId },
      { id: 'pms-section', menu: 'pms' as SidebarMenuItemId },
      { id: 'scurve-section', menu: 'scurve' as SidebarMenuItemId },
      { id: 'equipment-section', menu: 'equipment' as SidebarMenuItemId },
      { id: 'financial-section', menu: 'financial' as SidebarMenuItemId },
      { id: 'manpower-section', menu: 'manpower' as SidebarMenuItemId },
      { id: 'issues-section', menu: 'issues' as SidebarMenuItemId },
      { id: 'activities-section', menu: 'activities' as SidebarMenuItemId }
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          const topEntry = visibleEntries.reduce((prev, curr) =>
            curr.intersectionRatio > prev.intersectionRatio ? curr : prev
          );
          const match = sections.find((s) => s.id === topEntry.target.id);
          if (match) {
            setActiveMenuItem(match.menu);
          }
        }
      },
      {
        threshold: 0.35,
        rootMargin: '-5% 0px -40% 0px'
      }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [activeTab, isAdminMode, reportState]);

  // IF ADMIN MODE IS ACTIVE, RENDER ADMIN WORKSPACE
  if (isAdminMode) {
    return (
      <>
        <AdminWorkspace
          lang={lang}
          theme={theme}
          onNavigateToPublic={() => {
            setIsAdminMode(false);
            loadPublishedData();
          }}
          onLogout={handleAdminLogout}
        />
        {/* Dedicated Print Container */}
        <div id="print-report-root" className="print-only-report" data-theme="light" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
          <ExecutiveReportView
            sheetId="print-report-sheet"
            master={master}
            pms={pms}
            daily={daily}
            ipc={ipc}
            equipment={equipment}
            kpis={kpis}
            masterSCurve={masterSCurve}
            lang={lang}
          />
        </div>
      </>
    );
  }

  // PUBLIC VIEW MODE
  const isFa = lang === 'fa';

  return (
    <div className={`executive-app-shell min-h-screen bg-[#eef2f7] text-slate-800 flex`} dir={isFa ? 'rtl' : 'ltr'}>
      {/* Main Content Area */}
      <main className="executive-main-content flex-1 min-w-0 p-2 sm:p-3 md:p-3.5 flex justify-center items-start overflow-y-auto">
        <div className="executive-report-stage w-full max-w-[1500px] p-1.5 sm:p-2 bg-[#dfe6ef] rounded-xl shadow-xs space-y-2">
          {/* Public Official Report Status Header Strip */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-lg px-3.5 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs no-print">
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${reportState === 'success' ? 'bg-emerald-400 animate-pulse' : reportState === 'loading' ? 'bg-amber-400 animate-ping' : 'bg-rose-400'} shrink-0`}></div>
              <div className="text-xs">
                <span className="font-extrabold text-white">
                  {isFa ? 'سامانه رسمی گزارش روزانه مدیریتی LOICO' : 'LOICO Official Executive Daily Report'}
                </span>
                {reportState === 'success' && (
                  <>
                    <span className="text-slate-300 text-[11px] mx-1.5 hidden sm:inline">|</span>
                    <span className="text-blue-200 text-[11px] font-medium font-mono">
                      {isFa ? `تاریخ گزارش: ${latestPublishedMeta?.reportDate || daily?.reportDate || '۱۴۰۵/۰۶/۰۸'}` : `Report Date: ${latestPublishedMeta?.reportDate || daily?.reportDate || '1405/06/08'}`}
                    </span>
                    <span className="bg-blue-800/80 text-blue-200 text-[9.5px] px-2 py-0.5 rounded font-mono font-bold mx-2 border border-blue-400/30">
                      Rev {latestPublishedMeta?.version || 1}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={loadPublishedData}
                disabled={reportState === 'loading'}
                className="text-slate-300 hover:text-white p-1 rounded transition cursor-pointer flex items-center gap-1 text-[11px]"
                title={isFa ? 'به‌روزرسانی آخرین گزارش' : 'Refresh report'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reportState === 'loading' ? 'animate-spin text-blue-400' : ''}`} />
                <span className="hidden md:inline">{isFa ? 'تازه‌سازی' : 'Refresh'}</span>
              </button>

              <button
                onClick={handleOpenAdmin}
                className="flex items-center gap-1.5 bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-[11px] font-bold px-3 py-1 rounded-md border border-blue-400/30 transition cursor-pointer"
                title={isFa ? 'ورود به پنل مدیریت و انتشار' : 'Admin Login'}
              >
                {isAdminLoggedIn ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isFa ? 'میز کار مدیر' : 'Admin'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isFa ? 'ورود مدیر' : 'Admin'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 1. LOADING STATE */}
          {reportState === 'loading' && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-3 my-8">
              <div className="flex justify-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {isFa ? 'در حال بارگذاری آخرین گزارش منتشرشده...' : 'Loading latest published executive report...'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {isFa ? 'دریافت نسخه رسمی و معتبر گزارش روزانه از فضای ابری سرور' : 'Fetching authorized official daily snapshot from secure cloud storage'}
              </p>
            </div>
          )}

          {/* 2. NOT FOUND STATE */}
          {reportState === 'not_found' && (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-xs space-y-4 my-8 max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                <FileQuestion className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isFa ? 'گزارش منتشرشده‌ای در دسترس نیست.' : 'No published report is currently available.'}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {isFa
                    ? 'هنوز نسخه رسمی از گزارش روزانه مدیریتی منتشر نشده است. مدیران پروژه می‌توانند از طریق ورود به میز کار مدیریت، فایل‌های اکسل را بارگذاری و اولین گزارش را منتشر نمایند.'
                    : 'No official snapshot has been published yet. Project controls administrators can sign in to upload workbooks and publish the initial report.'}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={loadPublishedData}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isFa ? 'تازه‌سازی' : 'Refresh'}</span>
                </button>
                <button
                  onClick={handleOpenAdmin}
                  className="w-full sm:w-auto px-5 py-2 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isFa ? 'ورود مدیر جهت انتشار گزارش' : 'Admin Login to Publish'}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>
            </div>
          )}

          {/* 3. ERROR STATE */}
          {reportState === 'error' && (
            <div className="bg-white rounded-xl border border-rose-200 p-10 text-center shadow-xs space-y-4 my-8 max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900">
                  {isFa ? 'دریافت آخرین گزارش با خطا مواجه شد.' : 'Failed to load executive report.'}
                </h3>
                <p className="text-xs text-rose-700 mt-1.5">
                  {errorMessage || (isFa ? 'خطا در ارتباط با سرور جهت دریافت نسخه رسمی گزارش.' : 'Error connecting to report service.')}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={loadPublishedData}
                  className="px-5 py-2 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isFa ? 'تلاش مجدد' : 'Retry'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. SUCCESS STATE: RENDER ACTIVE VIEW */}
          {reportState === 'success' && activeTab === 'report' && (
            <>
              {/* Desktop & Tablet Report View (>= 768px) */}
              <div className="hidden md:block w-full">
                <ExecutiveReportView
                  master={master}
                  pms={pms}
                  daily={daily}
                  ipc={ipc}
                  equipment={equipment}
                  kpis={kpis}
                  masterSCurve={masterSCurve}
                  lang={lang}
                />
              </div>

              {/* Mobile Adaptive Executive View (< 768px) */}
              <div className="block md:hidden w-full">
                <MobileExecutiveView
                  master={master}
                  pms={pms}
                  daily={daily}
                  ipc={ipc}
                  equipment={equipment}
                  kpis={kpis}
                  masterSCurve={masterSCurve}
                  lang={lang}
                />
              </div>
            </>
          )}

          {reportState === 'success' && activeTab === 'master' && (
            <ProjectMasterDataView master={master} lang={lang} />
          )}

          {reportState === 'success' && activeTab === 'history' && (
            <VersionHistoryView auditList={auditList} lang={lang} />
          )}
        </div>
      </main>

      {/* Right-Side Executive LOICO Sidebar (>= 768px) */}
      <AppSidebar
        activeItem={activeMenuItem}
        activeTab={activeTab}
        onSelectMenu={handleSelectMenu}
        lang={lang}
        onToggleLang={handleToggleLang}
        theme={theme}
        onSelectTheme={setTheme}
        onDirectPrint={handleDirectPrint}
        onResetData={handleResetData}
        onOpenAdminLogin={handleOpenAdmin}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Mobile Bottom Navigation (< 768px) */}
      <div className="block md:hidden">
        <MobileBottomNavigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenMore={() => setIsMoreSheetOpen(true)}
          lang={lang}
        />
        <MobileMoreSheet
          isOpen={isMoreSheetOpen}
          onClose={() => setIsMoreSheetOpen(false)}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          lang={lang}
          onToggleLang={handleToggleLang}
          theme={theme}
          onSelectTheme={setTheme}
          onDirectPrint={handleDirectPrint}
          onResetData={handleResetData}
          onOpenAdminLogin={handleOpenAdmin}
          isAdminLoggedIn={isAdminLoggedIn}
        />
      </div>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
        lang={lang}
      />

      {/* Dedicated Print-Only Root Container */}
      <div id="print-report-root" className="print-only-report" data-theme="light" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
        <ExecutiveReportView
          sheetId="print-report-sheet"
          master={master}
          pms={pms}
          daily={daily}
          ipc={ipc}
          equipment={equipment}
          kpis={kpis}
          masterSCurve={masterSCurve}
          lang={lang}
        />
      </div>
    </div>
  );
}
