import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, Language, Theme, PublishedReportMetadata } from './types';
import { projectDataStore } from './services/dataStore';
import { apiClient } from './services/apiClient';
import { AppSidebar, SidebarMenuItemId } from './components/AppSidebar';
import { ExecutiveReportView } from './components/ExecutiveReport/ExecutiveReportView';
import { DataUpdateView } from './components/DataUpdate/DataUpdateView';
import { ProjectMasterDataView } from './components/MasterData/ProjectMasterDataView';
import { VersionHistoryView } from './components/VersionHistory/VersionHistoryView';
import { DataValidationPanel } from './components/Validation/DataValidationPanel';
import { MobileExecutiveView } from './components/Mobile/MobileExecutiveView';
import { MobileBottomNavigation } from './components/Mobile/MobileBottomNavigation';
import { MobileMoreSheet } from './components/Mobile/MobileMoreSheet';
import { AdminHeaderBar } from './components/Admin/AdminHeaderBar';
import { AdminLoginModal } from './components/Admin/AdminLoginModal';
import { PublishModal } from './components/Admin/PublishModal';
import { exportExecutiveReportToPdf } from './services/pdfExportService';
import { FileText } from 'lucide-react';

export default function App() {
  // Routing & Admin State
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.startsWith('/admin') ||
      window.location.hash.startsWith('#/admin')
    );
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishedMeta, setPublishedMeta] = useState<PublishedReportMetadata | null>(null);
  const [isInitialReportLoading, setIsInitialReportLoading] = useState(true);
  const [hasPublishedReport, setHasPublishedReport] = useState<boolean | null>(null);

  // Tab & UI State
  const [activeTab, setActiveTab] = useState<ActiveTab>('report');
  const [activeMenuItem, setActiveMenuItem] = useState<SidebarMenuItemId>('dashboard');
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [lang, setLang] = useState<Language>('fa');
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('loico-ui-theme');
      return saved === 'loico-blue' || saved === 'light' ? saved : 'light';
    } catch {
      return 'light';
    }
  });
  const [, setRenderTrigger] = useState(0);

  // Role-based state separation:
  // 1. isAuthenticatedAdmin: Controls whether Desktop Admin application is rendered vs Public Mobile
  const isAuthenticatedAdmin = isAdminRoute && isAdminAuthenticated;
  // 2. isAdminEditingMode: Controls whether editing controls/tabs (Excel, Master, Validation) are active
  const isAdminEditingMode = isAuthenticatedAdmin && !isPreviewMode;

  // Listen for route changes (e.g. popstate or hashchange)
  useEffect(() => {
    const handleLocationChange = () => {
      const onAdmin =
        window.location.pathname.startsWith('/admin') ||
        window.location.hash.startsWith('#/admin');
      setIsAdminRoute(onAdmin);
      if (!onAdmin) {
        setIsPreviewMode(false);
        setActiveTab('report');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Fetch published report from server and initialize data
  useEffect(() => {
    let isMounted = true;

    async function loadLatestReport() {
      try {
        const report = await apiClient.getLatestReport();
        if (report && isMounted) {
          setHasPublishedReport(true);
          projectDataStore.hydratePublishedReport(report);
          setPublishedMeta({
            id: report.id,
            version: report.version,
            reportDate: report.reportDate,
            publishedAt: report.publishedAt,
            publishedBy: report.publishedBy,
          });
        } else if (isMounted) {
          // No published report available on server yet (HTTP 200 NO_PUBLISHED_REPORT)
          setHasPublishedReport(false);
        }
      } catch (err) {
        console.warn('Could not load latest published report from server, using local fallback:', err);
        if (isMounted) {
          setHasPublishedReport(false);
        }
      } finally {
        if (isMounted) {
          setIsInitialReportLoading(false);
        }
      }
    }

    loadLatestReport();

    return () => {
      isMounted = false;
    };
  }, []);

  // Check Admin authentication status if on /admin
  useEffect(() => {
    let isMounted = true;

    async function verifyAuth() {
      if (isAdminRoute) {
        setIsCheckingAuth(true);
        try {
          const isAuthed = await apiClient.checkAdminAuth();
          if (isMounted) {
            setIsAdminAuthenticated(isAuthed);
          }
        } catch {
          if (isMounted) {
            setIsAdminAuthenticated(false);
          }
        } finally {
          if (isMounted) {
            setIsCheckingAuth(false);
          }
        }
      } else {
        setIsCheckingAuth(false);
      }
    }

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [isAdminRoute]);

  // Periodic lightweight check for newer published versions (every 5 minutes for public viewers)
  useEffect(() => {
    if (isAdminRoute) return; // Admins edit drafts, don't auto-refresh while editing

    const interval = setInterval(async () => {
      try {
        const versionInfo = await apiClient.getReportVersion();
        if (versionInfo.hasReport && versionInfo.version) {
          const currentMeta = projectDataStore.getPublishedMetadata();
          if (!currentMeta || versionInfo.version > currentMeta.version) {
            const newReport = await apiClient.getLatestReport();
            if (newReport) {
              setHasPublishedReport(true);
              projectDataStore.hydratePublishedReport(newReport);
              setPublishedMeta({
                id: newReport.id,
                version: newReport.version,
                reportDate: newReport.reportDate,
                publishedAt: newReport.publishedAt,
                publishedBy: newReport.publishedBy,
              });
            }
          }
        }
      } catch (e) {
        // Silent periodic background check
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAdminRoute]);

  // Subscribe to Project Data Store
  useEffect(() => {
    const unsubscribe = projectDataStore.subscribe(() => {
      setRenderTrigger((t) => t + 1);
    });
    return () => unsubscribe();
  }, []);

  // Update HTML document direction and language attribute
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  }, [lang]);

  // Synchronize data-theme attribute on HTML root and persist to localStorage
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
  const issues = projectDataStore.getValidationIssues();
  const auditList = projectDataStore.getAuditHistory();

  const handleToggleLang = () => {
    setLang((l) => (l === 'fa' ? 'en' : 'fa'));
  };

  const handleDirectPrint = async () => {
    try {
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready;
        const fontReady = document.fonts.check('12px "Vazirmatn"');
        console.log('Direct print font readiness - Vazirmatn:', fontReady);
      }
    } catch {
      // Font readiness fallback
    }
    window.print();
  };

  const handleExportPdf = async () => {
    try {
      await exportExecutiveReportToPdf('print-report-sheet', 'Executive_Daily_Report.pdf');
    } catch (err) {
      console.error('Direct PDF export error:', err);
    }
  };

  const handleResetData = () => {
    if (
      window.confirm(
        lang === 'fa'
          ? 'آیا از بازنشانی داده‌ها به نمونه اولیه اطمینان دارید؟'
          : 'Reset all datasets to initial demo values?'
      )
    ) {
      projectDataStore.resetToSampleData();
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch {
      // ignore
    }
    setIsAdminAuthenticated(false);
    window.location.pathname = '/';
  };

  // Smooth scroll and menu handler for Admin Desktop
  const handleSelectMenu = useCallback(
    (itemId: SidebarMenuItemId) => {
      setActiveMenuItem(itemId);

      if (itemId === 'validation') {
        if (isAdminEditingMode) setActiveTab('validation');
        return;
      }

      if (itemId === 'settings') {
        if (isAdminEditingMode) setActiveTab('update');
        return;
      }

      if (itemId === 'master') {
        if (isAdminEditingMode) setActiveTab('master');
        return;
      }

      if (itemId === 'history') {
        if (isAdminEditingMode) setActiveTab('history');
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
    },
    [activeTab, isAdminEditingMode]
  );

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
      activities: 'activities-section',
    };

    const targetId = sectionMap[itemId] || 'executive-report';
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  // IntersectionObserver to auto-update active menu item when scrolling report in Desktop Admin
  useEffect(() => {
    if (!isAuthenticatedAdmin || activeTab !== 'report') return;

    const sections = [
      { id: 'executive-report', menu: 'dashboard' as SidebarMenuItemId },
      { id: 'executive-summary-section', menu: 'summary' as SidebarMenuItemId },
      { id: 'pms-section', menu: 'pms' as SidebarMenuItemId },
      { id: 'scurve-section', menu: 'scurve' as SidebarMenuItemId },
      { id: 'equipment-section', menu: 'equipment' as SidebarMenuItemId },
      { id: 'financial-section', menu: 'financial' as SidebarMenuItemId },
      { id: 'manpower-section', menu: 'manpower' as SidebarMenuItemId },
      { id: 'issues-section', menu: 'issues' as SidebarMenuItemId },
      { id: 'activities-section', menu: 'activities' as SidebarMenuItemId },
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
        rootMargin: '-5% 0px -40% 0px',
      }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [isAuthenticatedAdmin, activeTab]);

  // =========================================================================
  // ADMIN UN-AUTHENTICATED STATE: Clean dedicated login screen without background leak
  // =========================================================================
  if (isAdminRoute && !isAdminAuthenticated) {
    return (
      <div
        className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-blue-600 selection:text-white"
        dir={lang === 'fa' ? 'rtl' : 'ltr'}
      >
        {isCheckingAuth ? (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="w-9 h-9 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium font-fa text-slate-300">
              {lang === 'fa' ? 'در حال بررسی نشست کاربری مدیریت...' : 'Verifying Admin Session...'}
            </span>
          </div>
        ) : (
          <AdminLoginModal
            isOpen={true}
            onSuccess={() => {
              setIsAdminAuthenticated(true);
            }}
            onCancel={() => {
              window.location.pathname = '/';
            }}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // MAIN APPLICATION SHELL: Strictly Role-Based Presentation
  // =========================================================================
  return (
    <div
      className="executive-app-shell min-h-screen bg-[#eef2f7] text-slate-800 flex flex-col"
      dir={lang === 'fa' ? 'rtl' : 'ltr'}
    >
      {isAuthenticatedAdmin ? (
        /* ========================================================================= */
        /* 1. AUTHENTICATED ADMIN WORKSPACE (ALWAYS DESKTOP / LAPTOP PRESENTATION)    */
        /* ========================================================================= */
        <div className="admin-desktop-application flex flex-col flex-1 min-h-screen">
          {/* Admin Header Bar */}
          <AdminHeaderBar
            publishedMeta={publishedMeta}
            isPreviewMode={isPreviewMode}
            onTogglePreview={() => {
              if (!isPreviewMode) {
                setActiveTab('report');
                setActiveMenuItem('dashboard');
              }
              setIsPreviewMode(!isPreviewMode);
            }}
            onOpenPublishModal={() => setIsPublishModalOpen(true)}
            onLogout={handleLogout}
            lang={lang}
          />

          {/* Non-blocking Warning Banner if Admin opens on narrow phone/tablet display */}
          <div className="admin-viewport-warning xl:hidden bg-amber-500/15 border-b border-amber-500/30 text-amber-900 px-4 py-2 text-xs font-medium text-center flex items-center justify-center gap-2 no-print shrink-0">
            <span>⚠️</span>
            <span>
              {lang === 'fa'
                ? 'برای مدیریت کامل، بررسی داده‌ها و انتشار گزارش، استفاده از لپ‌تاپ یا نمایشگر بزرگ توصیه می‌شود.'
                : 'For full management controls, a desktop or laptop display is recommended.'}
            </span>
          </div>

          {/* Admin Workspace Layout */}
          <div className="flex-1 flex overflow-x-auto overflow-y-hidden min-h-0">
            {/* Main Stage with min-width 1100px to safeguard Desktop layout on small devices */}
            <main className="executive-main-content flex-1 min-w-[1100px] p-2 sm:p-3 md:p-3.5 flex justify-center items-start overflow-y-auto">
              <div className="executive-report-stage w-full max-w-[1500px] p-1.5 sm:p-2 bg-[#dfe6ef] rounded-xl shadow-xs">
                {activeTab === 'report' && (
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
                )}

                {activeTab === 'update' && isAdminEditingMode && (
                  <DataUpdateView
                    pms={pms}
                    daily={daily}
                    ipc={ipc}
                    equipment={equipment}
                    issues={issues}
                    lang={lang}
                    onNavigateToReport={() => {
                      setActiveTab('report');
                      setActiveMenuItem('dashboard');
                    }}
                  />
                )}

                {activeTab === 'master' && isAdminEditingMode && (
                  <ProjectMasterDataView master={master} lang={lang} />
                )}

                {activeTab === 'history' && isAdminEditingMode && (
                  <VersionHistoryView auditList={auditList} lang={lang} />
                )}

                {activeTab === 'validation' && isAdminEditingMode && (
                  <DataValidationPanel
                    issues={issues}
                    kpis={kpis}
                    lang={lang}
                    masterSCurve={masterSCurve}
                    pms={pms}
                  />
                )}
              </div>
            </main>

            {/* Right-Side Executive LOICO Sidebar (Always rendered for Admin) */}
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
              issues={issues}
              isAdminMode={isAdminEditingMode}
            />
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. PUBLIC DASHBOARD (ALWAYS MOBILE EXECUTIVE PRESENTATION)                 */
        /* ========================================================================= */
        <div className="public-mobile-app min-h-screen bg-[#eef2f7] text-slate-800 flex flex-col pb-20">
          {/* Centered Mobile Shell (Phone: 100%, Tablet/Desktop: max-width 440px) */}
          <div className="public-mobile-shell w-full max-w-[440px] mx-auto min-w-0 bg-[#f8fafc] sm:rounded-2xl sm:shadow-xl sm:my-3 overflow-hidden border-slate-200/80 sm:border">
            {isInitialReportLoading ? (
              <div className="p-8 flex flex-col items-center justify-center text-center min-h-[440px] bg-white">
                <div className="w-9 h-9 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-xs font-medium font-fa text-slate-500">
                  {lang === 'fa' ? 'در حال بارگذاری اطلاعات گزارش...' : 'Loading report data...'}
                </span>
              </div>
            ) : hasPublishedReport === false ? (
              <div className="p-8 flex flex-col items-center justify-center text-center min-h-[440px] bg-white m-2 rounded-xl border border-slate-200/80">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2 font-fa">
                  {lang === 'fa' ? 'گزارش منتشرشده‌ای در دسترس نیست.' : 'No published report available.'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-fa">
                  {lang === 'fa'
                    ? 'تاکنون هیچ نسخه رسمی از گزارش روزانه توسط مدیریت پروژه منتشر نشده است. به محض انتشار در این صفحه نمایش داده خواهد شد.'
                    : 'No official report has been published yet. Once published by the project admin, it will appear here automatically.'}
                </p>
              </div>
            ) : (
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
            )}
          </div>

          {/* Public Mobile Bottom Navigation (Aligned to centered 440px shell) */}
          <MobileBottomNavigation
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onOpenMore={() => setIsMoreSheetOpen(true)}
            lang={lang}
            isAdminMode={false}
            onExportPdf={handleExportPdf}
          />

          {/* Public Mobile More Sheet (Safe public actions only) */}
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
            issues={issues}
            isAdminMode={false}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DEDICATED PRINT-ONLY ROOT CONTAINER (A4 LANDSCAPE EXECUTIVE DESKTOP)   */}
      {/* Preserved for both Public and Admin PDF export and direct browser print   */}
      {/* ========================================================================= */}
      <div
        id="print-report-root"
        className="print-only-report"
        data-theme="light"
        dir={lang === 'fa' ? 'rtl' : 'ltr'}
      >
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

      {/* Publish Official Report Modal (Admin only) */}
      {isAuthenticatedAdmin && isPublishModalOpen && (
        <PublishModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          onPublished={(rep) => {
            setPublishedMeta({
              id: rep.id,
              version: rep.version,
              reportDate: rep.reportDate,
              publishedAt: rep.publishedAt,
              publishedBy: rep.publishedBy,
            });
          }}
        />
      )}
    </div>
  );
}
