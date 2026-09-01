import React, { useState, useEffect } from 'react';
import { ActiveTab, Language, Theme } from './types';
import { projectDataStore } from './services/dataStore';
import { Navbar } from './components/Navbar';
import { ExecutiveReportView } from './components/ExecutiveReport/ExecutiveReportView';
import { DataUpdateView } from './components/DataUpdate/DataUpdateView';
import { ProjectMasterDataView } from './components/MasterData/ProjectMasterDataView';
import { VersionHistoryView } from './components/VersionHistory/VersionHistoryView';
import { DataValidationPanel } from './components/Validation/DataValidationPanel';
import { PrintPreviewModal } from './components/PrintPreviewModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('report');
  const [lang, setLang] = useState<Language>('fa');
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('loico-ui-theme');
      return (saved === 'loico-blue' || saved === 'light') ? saved : 'light';
    } catch {
      return 'light';
    }
  });
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
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

  const handleDirectPrint = () => {
    window.print();
  };

  const handleResetData = () => {
    if (window.confirm(lang === 'fa' ? 'آیا از بازنشانی داده‌ها به نمونه اولیه اطمینان دارید؟' : 'Reset all datasets to initial demo values?')) {
      projectDataStore.resetToSampleData();
    }
  };

  return (
    <div className={`min-h-screen bg-[#f1f5f9] text-slate-800 flex flex-col ${lang === 'fa' ? 'font-sans' : 'font-sans'}`}>
      {/* Screen Interactive App Container */}
      <div className="app-screen-container flex flex-col flex-1">
        {/* Top Main Navigation */}
        <Navbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          lang={lang}
          onToggleLang={handleToggleLang}
          theme={theme}
          onSelectTheme={setTheme}
          onOpenPrintPreview={() => setIsPrintPreviewOpen(true)}
          onDirectPrint={handleDirectPrint}
          onResetData={handleResetData}
          issues={issues}
        />

        {/* Main View Container */}
        <main className="flex-1 overflow-x-hidden">
          {activeTab === 'report' && (
            <div className="py-4">
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
          )}

          {activeTab === 'update' && (
            <DataUpdateView
              pms={pms}
              daily={daily}
              ipc={ipc}
              equipment={equipment}
              issues={issues}
              lang={lang}
              onNavigateToReport={() => setActiveTab('report')}
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
        </main>
      </div>

      {/* Dedicated Print-Only Root Container (Part 9 of user instructions) */}
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

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
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
  );
}
