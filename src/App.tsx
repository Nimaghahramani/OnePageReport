import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, Language, Theme } from './types';
import { projectDataStore } from './services/dataStore';
import { AppSidebar, SidebarMenuItemId } from './components/AppSidebar';
import { ExecutiveReportView } from './components/ExecutiveReport/ExecutiveReportView';
import { DataUpdateView } from './components/DataUpdate/DataUpdateView';
import { ProjectMasterDataView } from './components/MasterData/ProjectMasterDataView';
import { VersionHistoryView } from './components/VersionHistory/VersionHistoryView';
import { DataValidationPanel } from './components/Validation/DataValidationPanel';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('report');
  const [activeMenuItem, setActiveMenuItem] = useState<SidebarMenuItemId>('dashboard');
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

  // Subscribe to Project Data Store
  useEffect(() => {
    const unsubscribe = projectDataStore.subscribe(() => {
      setRenderTrigger(t => t + 1);
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
    setLang(l => l === 'fa' ? 'en' : 'fa');
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

  const handleResetData = () => {
    if (window.confirm(lang === 'fa' ? 'آیا از بازنشانی داده‌ها به نمونه اولیه اطمینان دارید؟' : 'Reset all datasets to initial demo values?')) {
      projectDataStore.resetToSampleData();
    }
  };

  // Smooth scroll and menu handler
  const handleSelectMenu = useCallback((itemId: SidebarMenuItemId) => {
    setActiveMenuItem(itemId);

    if (itemId === 'validation') {
      setActiveTab('validation');
      return;
    }

    if (itemId === 'settings') {
      setActiveTab('update');
      return;
    }

    if (itemId === 'master') {
      setActiveTab('master');
      return;
    }

    if (itemId === 'history') {
      setActiveTab('history');
      return;
    }

    // Report section navigation
    if (activeTab !== 'report') {
      setActiveTab('report');
      // Wait for DOM update before scrolling
      setTimeout(() => {
        scrollToSection(itemId);
      }, 100);
    } else {
      scrollToSection(itemId);
    }
  }, [activeTab]);

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
    if (activeTab !== 'report') return;

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
        // Find visible entry with highest ratio or first intersecting
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by intersection ratio or proximity
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
  }, [activeTab]);

  return (
    <div className={`executive-app-shell min-h-screen bg-[#eef2f7] text-slate-800 flex`} dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      {/* Main Content Area */}
      <main className="executive-main-content flex-1 min-w-0 p-2 sm:p-3 md:p-3.5 flex justify-center items-start overflow-y-auto">
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

          {activeTab === 'update' && (
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

          {activeTab === 'master' && (
            <ProjectMasterDataView master={master} lang={lang} />
          )}

          {activeTab === 'history' && (
            <VersionHistoryView auditList={auditList} lang={lang} />
          )}

          {activeTab === 'validation' && (
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

      {/* Right-Side Executive LOICO Sidebar */}
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
      />

      {/* Dedicated Print-Only Root Container (Part 9 & 23 of user instructions) */}
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
