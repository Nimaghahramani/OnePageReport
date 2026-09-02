import React, { useState, useEffect } from 'react';
import {
  ProjectMasterData,
  MasterSCurveRecord,
  PmsRecord,
  DailyReportRecord,
  IpcRecord,
  EquipmentRecord,
  Language,
  Theme,
  ValidationIssue,
  PublicationHistoryItem,
  PublishedReport
} from '../../types';
import { projectDataStore } from '../../services/dataStore';
import { publishOfficialReport, fetchPublicationHistory } from '../../services/reportApi';
import { DataUpdateView } from '../DataUpdate/DataUpdateView';
import { DataValidationPanel } from '../Validation/DataValidationPanel';
import { ProjectMasterDataView } from '../MasterData/ProjectMasterDataView';
import { ExecutiveReportView } from '../ExecutiveReport/ExecutiveReportView';
import { PublishConfirmModal } from './PublishConfirmModal';
import {
  Send,
  CheckCircle,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Eye,
  FileSpreadsheet,
  History,
  ArrowRight,
  LogOut,
  Database,
  Calendar,
  Sparkles,
  RefreshCw,
  Sliders
} from 'lucide-react';

interface AdminWorkspaceProps {
  lang: Language;
  theme: Theme;
  onNavigateToPublic: () => void;
  onLogout: () => void;
}

export type AdminTab = 'upload' | 'validation' | 'preview' | 'master' | 'history';

export const AdminWorkspace: React.FC<AdminWorkspaceProps> = ({
  lang,
  theme,
  onNavigateToPublic,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('upload');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishSuccessBanner, setPublishSuccessBanner] = useState<{
    reportDate: string;
    version: number;
    publishedAt: string;
  } | null>(null);
  const [historyList, setHistoryList] = useState<PublicationHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Subscribe to store updates for draft changes
  useEffect(() => {
    const unsub = projectDataStore.subscribe(() => {
      setRenderTrigger(t => t + 1);
    });
    return () => unsub();
  }, []);

  // Fetch publication history
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    const res = await fetchPublicationHistory();
    if (res.success && res.data) {
      setHistoryList(res.data);
    }
    setIsLoadingHistory(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const isFa = lang === 'fa';

  const master = projectDataStore.getMasterData();
  const masterSCurve = projectDataStore.getMasterSCurve();
  const pms = projectDataStore.getPms();
  const daily = projectDataStore.getDaily();
  const ipc = projectDataStore.getIpc();
  const equipment = projectDataStore.getEquipment();
  const kpis = projectDataStore.getCalculatedKPIs();
  const issues = projectDataStore.getValidationIssues();

  const blockingErrors = issues.filter(i => i.type === 'error' && i.isBlocking);
  const warnings = issues.filter(i => i.type === 'warning');
  const hasBlockingErrors = blockingErrors.length > 0;

  // Prepare draft snapshot
  const draftSnapshot: PublishedReport = projectDataStore.exportPublishedSnapshot(
    'مدیر برنامه‌ریزی و کنترل پروژه',
    'پیش‌نویس آماده انتشار',
    (historyList.length > 0 ? (historyList[0].version || 1) + 1 : 1)
  );

  const handleConfirmPublish = async (publishedBy: string, notes: string) => {
    const snapshotToPublish = {
      ...draftSnapshot,
      publishedBy,
      metadata: {
        ...draftSnapshot.metadata,
        notes,
        validationStatus: (hasBlockingErrors ? 'error' : warnings.length > 0 ? 'warning' : 'valid') as any
      }
    };

    const res = await publishOfficialReport(snapshotToPublish);
    if (res.success && res.data?.report) {
      const pub = res.data.report;
      setPublishSuccessBanner({
        reportDate: pub.reportDate,
        version: pub.version,
        publishedAt: pub.publishedAt
      });
      if (res.data.history) {
        setHistoryList(res.data.history);
      }
      setActiveTab('history');
    } else {
      alert(res.error?.message || (isFa ? 'خطا در انتشار گزارش' : 'Publication failed'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans" dir={isFa ? 'rtl' : 'ltr'}>
      {/* Top Admin Navigation Bar */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo and Workspace Title */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-xs tracking-wider shadow-sm">
                LOICO
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xs sm:text-sm font-black text-white">
                    {isFa ? 'میز کار مدیریت و انتشار گزارش روزانه (Admin Workspace)' : 'LOICO Admin Publishing Workspace'}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-900/60 text-blue-300 border border-blue-500/40 uppercase">
                    Admin Mode
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {master?.projectNameFa || 'تکمیل و تجهیز اسکله P1 بندر پتروشیمی ماهشهر'}
                </p>
              </div>
            </div>

            {/* Quick Publish CTA button for mobile */}
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="sm:hidden flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black px-3 py-1.5 rounded-lg shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isFa ? 'انتشار' : 'Publish'}</span>
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onNavigateToPublic}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
              title={isFa ? 'مشاهده داشبورد عمومی همانند بازدیدکنندگان' : 'View Public Dashboard'}
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>{isFa ? 'داشبورد عمومی' : 'Public View'}</span>
            </button>

            <button
              onClick={() => setIsPublishModalOpen(true)}
              disabled={hasBlockingErrors}
              className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-1.5 rounded-lg transition cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isFa ? 'انتشار رسمی گزارش' : 'Publish Report'}</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-900/50 hover:text-rose-200 text-slate-400 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
              title={isFa ? 'خروج از پنل مدیریت' : 'Sign Out'}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isFa ? 'خروج' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Success Publish Notification Banner */}
      {publishSuccessBanner && (
        <div className="bg-emerald-950/90 border-b border-emerald-600/40 text-emerald-200 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-600/40 flex items-center justify-center text-emerald-300">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-black text-white block">
                  {isFa ? 'گزارش با موفقیت به‌صورت رسمی منتشر شد.' : 'Report successfully published!'}
                </span>
                <span className="text-[11px] text-emerald-300">
                  {isFa
                    ? `تاریخ گزارش: ${publishSuccessBanner.reportDate} | نسخه: Rev ${publishSuccessBanner.version} | زمان انتشار: ${new Date(publishSuccessBanner.publishedAt).toLocaleTimeString('fa-IR')}`
                    : `Report Date: ${publishSuccessBanner.reportDate} (Rev ${publishSuccessBanner.version})`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onNavigateToPublic}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-1.5 rounded-md flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>{isFa ? 'مشاهده در داشبورد عمومی' : 'Open Public Dashboard'}</span>
                <ArrowRight className="w-3 h-3 rtl:rotate-180" />
              </button>
              <button
                onClick={() => setPublishSuccessBanner(null)}
                className="text-emerald-400 hover:text-white text-xs px-2 py-1 font-bold cursor-pointer"
              >
                {isFa ? 'بستن' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step Navigation Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isFa ? '۱. ورود و بارگذاری فایل‌ها' : '1. Upload Sources'}</span>
          </button>

          <button
            onClick={() => setActiveTab('validation')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer relative ${
              activeTab === 'validation'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isFa ? '۲. اعتبارسنجی داده‌ها' : '2. Validation'}</span>
            {hasBlockingErrors && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
            {!hasBlockingErrors && warnings.length > 0 && (
              <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                {warnings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{isFa ? '۳. پیش‌نمایش پیش‌نویس' : '3. Draft Preview'}</span>
          </button>

          <button
            onClick={() => setActiveTab('master')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'master'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{isFa ? 'اطلاعات پایه (Master)' : 'Master Data'}</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{isFa ? 'تاریخچه انتشارات' : 'Publication History'}</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
              {historyList.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Workspace Stage */}
      <main className="flex-1 p-3 sm:p-5 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* TAB 1: SOURCE INGESTION */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                    {isFa ? 'ورود و پردازش فایل‌های منابع روزانه' : 'Source Files Processing Engine'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isFa
                      ? 'فایل‌های اکسل گزارش روزانه، PMS، وضعیت مالی صورت‌وضعیت و لاگ تجهیزات را بارگذاری کنید. تغییرات تا زمان کلیک روی «انتشار رسمی گزارش» فقط در محیط پیش‌نویس ادمین باقی می‌ماند.'
                      : 'Upload daily source workbooks. Changes remain isolated in Draft state until you explicitly click "Publish Report".'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('validation')}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-2 shadow-sm"
                  >
                    <span>{isFa ? 'مرحله بعد: اعتبارسنجی' : 'Next: Validate'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>

              {/* Data Update Ingestion View */}
              <div className="bg-slate-950 p-2 sm:p-4 rounded-xl border border-slate-800">
                <DataUpdateView
                  pms={pms}
                  daily={daily}
                  ipc={ipc}
                  equipment={equipment}
                  issues={issues}
                  lang={lang}
                  onNavigateToReport={() => setActiveTab('preview')}
                />
              </div>
            </div>
          )}

          {/* TAB 2: VALIDATION */}
          {activeTab === 'validation' && (
            <div className="space-y-4">
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    {isFa ? 'اعتبارسنجی و بررسی داده‌های پیش‌نویس' : 'Data Integrity & Validation Engine'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isFa
                      ? 'بررسی صحت تاریخ داده‌ها، هماهنگی پیشرفت برنامه‌ای/واقعی، انحرافات و فرمت‌های محاسباتی قبل از انتشار.'
                      : 'Validation checks for data dates, PMS progress consistency, variance, and financial calculations.'}
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('preview')}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-2 shadow-sm shrink-0"
                >
                  <span>{isFa ? 'مرحله بعد: پیش‌نمایش گزارش' : 'Next: Preview Draft'}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>

              <div className="bg-slate-950 p-2 sm:p-4 rounded-xl border border-slate-800">
                <DataValidationPanel
                  issues={issues}
                  kpis={kpis}
                  lang={lang}
                  masterSCurve={masterSCurve}
                  pms={pms}
                />
              </div>
            </div>
          )}

          {/* TAB 3: DRAFT PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Draft Notice Banner */}
              <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border border-amber-600/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-200">
                      {isFa ? 'پیش‌نمایش پیش‌نویس گزارش مدیریتی (Draft Preview)' : 'Draft Report Live Preview'}
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      {isFa
                        ? 'این گزارش هنوز منتشر نشده و فقط در پنل مدیریت قابل مشاهده است. پس از اطمینان از صحت محاسبات، روی «انتشار رسمی گزارش» کلیک کنید.'
                        : 'This snapshot is only visible in admin preview. Click "Publish Report" to push to public.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPublishModalOpen(true)}
                  disabled={hasBlockingErrors}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-5 py-2 rounded-lg transition cursor-pointer flex items-center gap-2 shadow-sm shrink-0 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isFa ? 'انتشار رسمی این گزارش' : 'Publish This Report'}</span>
                </button>
              </div>

              {/* Live Preview Container (Renders identical ExecutiveReportView in light stage) */}
              <div className="bg-[#dfe6ef] p-2 sm:p-3 rounded-xl border border-slate-300 text-slate-800 shadow-sm">
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
            </div>
          )}

          {/* TAB 4: MASTER DATA */}
          {activeTab === 'master' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-2 sm:p-4 rounded-xl border border-slate-800">
                <ProjectMasterDataView master={master} lang={lang} />
              </div>
            </div>
          )}

          {/* TAB 5: PUBLICATION HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-400" />
                    {isFa ? 'تاریخچه نسخه‌های منتشرشده گزارش' : 'Official Publication History Archive'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isFa
                      ? 'بایگانی غیرقابل تغییر (Immutable) از تمام نسخه‌های روزانه منتشرشده رسمی با جزئیات کامل شاخص‌ها و منتشرکننده.'
                      : 'Immutable archive of all officially published daily snapshots.'}
                  </p>
                </div>

                <button
                  onClick={loadHistory}
                  className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition cursor-pointer"
                  title={isFa ? 'به‌روزرسانی تاریخچه' : 'Refresh history'}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* History Table */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs" dir={isFa ? 'rtl' : 'ltr'}>
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold text-[11px]">
                      <tr>
                        <th className="py-3 px-4">{isFa ? 'تاریخ گزارش' : 'Report Date'}</th>
                        <th className="py-3 px-4">{isFa ? 'نسخه' : 'Version'}</th>
                        <th className="py-3 px-4">{isFa ? 'زمان انتشار' : 'Published At'}</th>
                        <th className="py-3 px-4">{isFa ? 'منتشرکننده' : 'Published By'}</th>
                        <th className="py-3 px-4">{isFa ? 'پیشرفت برنامه‌ای / واقعی' : 'Plan / Actual'}</th>
                        <th className="py-3 px-4">{isFa ? 'انحراف' : 'Variance'}</th>
                        <th className="py-3 px-4">{isFa ? 'تجهیزات / مالی' : 'Eq / Fin'}</th>
                        <th className="py-3 px-4">{isFa ? 'وضعیت' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      {historyList.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-900/50 transition">
                          <td className="py-3 px-4 font-bold text-white font-sans">
                            {item.reportDate}
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                              Rev {item.version}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {new Date(item.publishedAt).toLocaleString(isFa ? 'fa-IR' : 'en-US')}
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-300">
                            {item.publishedBy || 'مدیریت پروژه'}
                          </td>
                          <td className="py-3 px-4 text-slate-200">
                            {item.summary?.plannedProgress ?? '-'}% / {item.summary?.actualProgress ?? '-'}%
                          </td>
                          <td className="py-3 px-4">
                            <span className={item.summary?.variance !== null && (item.summary?.variance ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {item.summary?.variance !== null ? `${item.summary?.variance}%` : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {item.summary?.equipmentPercentage ?? '-'}% / {item.summary?.financialProgress ?? '-'}%
                          </td>
                          <td className="py-3 px-4">
                            {item.status === 'published' ? (
                              <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-600/40 px-2 py-0.5 rounded text-[10px] font-bold font-sans">
                                {isFa ? 'نسخه فعال رسمی' : 'Active Public'}
                              </span>
                            ) : (
                              <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] font-sans">
                                {isFa ? 'بایگانی‌شده' : 'Archived'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Publish Modal */}
      {isPublishModalOpen && (
        <PublishConfirmModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          onConfirmPublish={handleConfirmPublish}
          draftReport={draftSnapshot}
          hasBlockingErrors={hasBlockingErrors}
          blockingErrorsCount={blockingErrors.length}
          warningsCount={warnings.length}
          lang={lang}
        />
      )}
    </div>
  );
};
