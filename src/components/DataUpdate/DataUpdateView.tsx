import React, { useState } from 'react';
import {
  PmsRecord,
  DailyReportRecord,
  IpcRecord,
  EquipmentRecord,
  Language,
  ValidationIssue
} from '../../types';
import { projectDataStore } from '../../services/dataStore';
import { downloadSampleExcel } from '../../services/excelParser';
import { FileUploadMapperModal } from './FileUploadMapperModal';
import { ManualDataEditorModal } from './ManualDataEditorModal';
import {
  Upload,
  FileSpreadsheet,
  Edit3,
  Download,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';

interface DataUpdateViewProps {
  pms: PmsRecord;
  daily: DailyReportRecord;
  ipc: IpcRecord;
  equipment: EquipmentRecord;
  issues: ValidationIssue[];
  lang: Language;
  onNavigateToReport: () => void;
}

export const DataUpdateView: React.FC<DataUpdateViewProps> = ({
  pms,
  daily,
  ipc,
  equipment,
  issues,
  lang,
  onNavigateToReport
}) => {
  const [activeUploadType, setActiveUploadType] = useState<'pms' | 'daily' | 'ipc' | 'equipment' | 'daily_workbook' | null>(null);
  const [activeEditType, setActiveEditType] = useState<'pms' | 'daily' | 'ipc' | 'equipment' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'warning'; text: string } | null>(null);

  const isFa = lang === 'fa';

  const handleApplyUploadedData = (mappedData: any, fileName: string) => {
    if (!activeUploadType) return;

    let res: { success: boolean; warning?: string } = { success: false };

    if (activeUploadType === 'pms') {
      res = projectDataStore.updatePms({ ...mappedData, fileName, source: `Excel: ${fileName}` });
    } else if (activeUploadType === 'daily') {
      res = projectDataStore.updateDaily({ ...mappedData, fileName, source: `Excel: ${fileName}` });
    } else if (activeUploadType === 'ipc') {
      res = projectDataStore.updateIpc({ ...mappedData, fileName, source: `Excel: ${fileName}` });
    } else if (activeUploadType === 'equipment') {
      res = projectDataStore.updateEquipment({ ...mappedData, fileName, source: `Excel: ${fileName}` });
    }

    if (res.warning) {
      setFeedbackMessage({ type: 'warning', text: res.warning });
    } else {
      setFeedbackMessage({
        type: 'success',
        text: isFa ? `داده‌های ${activeUploadType.toUpperCase()} با موفقیت به‌روزرسانی و منتشر شد.` : `Dataset ${activeUploadType.toUpperCase()} updated successfully.`
      });
    }
  };

  const handleApplyManualData = (updatedData: any) => {
    if (!activeEditType) return;

    let res: { success: boolean; warning?: string } = { success: false };

    if (activeEditType === 'pms') {
      res = projectDataStore.updatePms(updatedData);
    } else if (activeEditType === 'daily') {
      res = projectDataStore.updateDaily(updatedData);
    } else if (activeEditType === 'ipc') {
      res = projectDataStore.updateIpc(updatedData);
    } else if (activeEditType === 'equipment') {
      res = projectDataStore.updateEquipment(updatedData);
    }

    if (res.warning) {
      setFeedbackMessage({ type: 'warning', text: res.warning });
    } else {
      setFeedbackMessage({
        type: 'success',
        text: isFa ? `تغییرات با موفقیت ذخیره شد.` : `Data successfully saved.`
      });
    }
  };

  return (
    <div id="settings-section" className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-250 shadow-xs">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            {isFa ? 'مرکز دریافت و به‌روزرسانی داده‌های پروژه (Daily Data Ingestion)' : 'Daily Project Data Ingestion & Updates'}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            {isFa
              ? 'دریافت، اعتبارسنجی و نگاشت هوشمند ۴ منبع اصلی داده (PMS، گزارش روزانه، صورت‌وضعیت، لاگ تجهیزات)'
              : 'Ingest, validate, and update the 4 key operational data streams for the executive report'}
          </p>
        </div>

        <button
          onClick={onNavigateToReport}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded transition cursor-pointer shadow-xs"
        >
          <span>{isFa ? 'مشاهده گزارش مدیریتی تک‌صفحه‌ای' : 'View Executive Report'}</span>
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </div>

      {/* Global Alerts / Feedback */}
      {feedbackMessage && (
        <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
          feedbackMessage.type === 'warning'
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-emerald-50 border-emerald-300 text-emerald-900'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="font-semibold">{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-bold hover:underline ml-2 rtl:mr-2"
          >
            {isFa ? 'بستن' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Multi-Sheet Master Daily Report Ingestion Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-lg p-4 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/30 text-blue-200 border border-blue-400/30 uppercase tracking-wider">
              {isFa ? 'ورودی فایل جامع اکسل' : 'Multi-Sheet Workbook Ingestion'}
            </span>
            <h3 className="text-xs md:text-sm font-black text-white">
              {isFa ? 'دریافت یکپارچه گزارش روزانه (MANPOWER / Construction / PMS)' : 'Direct Daily Report Multi-Sheet Workbook Parser'}
            </h3>
          </div>
          <p className="text-[11px] text-slate-300 max-w-2xl leading-relaxed">
            {isFa
              ? 'خواندن خودکار نیروی انسانی فعال (جمع ۷۸ نفر)، استخراج موانع از برگه Construction (2) و به‌روزرسانی پیشرفت واقعی (~۷۳.۲۸٪) از PMS با پیش‌نمایش قبل از اعمال.'
              : 'Automated multi-sheet extractor for active manpower (78 total), key obstacles from Construction (2), and actual progress (~73.28%) from PMS.'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={() => setActiveUploadType('daily_workbook')}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-2 rounded transition cursor-pointer shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isFa ? 'آپلود فایل اکسل چندبرگه‌ای' : 'Upload Multi-Sheet Excel'}</span>
          </button>
          <button
            onClick={() => downloadSampleExcel('daily_workbook')}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 cursor-pointer shadow-2xs"
            title={isFa ? 'دانلود قالب اکسل نمونه چندبرگه‌ای' : 'Download Sample Multi-Sheet Workbook'}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Cards Grid for Data Streams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* 1. PMS UPDATE CARD */}
        <div className="bg-white border border-slate-250 rounded-lg p-3.5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <h3 className="font-bold text-xs md:text-sm text-slate-900">
                  {isFa ? '۱. آپدیت برنامه زمان‌بندی و PMS' : '1. PMS & Progress Update'}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Rev {pms.version}
              </span>
            </div>

            {/* Current Snapshot */}
            <div className="space-y-1.5 text-xs text-slate-700 mb-3 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isFa ? 'تاریخ داده (Data Date):' : 'Data Date:'}</span>
                <span className="font-bold text-slate-900">{pms.dataDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isFa ? 'پیشرفت برنامه‌ای / واقعی:' : 'Plan / Actual:'}</span>
                <span className="font-bold text-blue-900">{pms.plannedProgress}% / {pms.actualProgress}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isFa ? 'انحراف پیشرفت:' : 'Variance:'}</span>
                <span className={`font-bold ${pms.progressVariance !== null && pms.progressVariance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {pms.progressVariance !== null ? `${pms.progressVariance}%` : 'N/A'} {pms.scheduleVarianceDays !== null ? `(${pms.scheduleVarianceDays}d)` : ''}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500 font-sans">{isFa ? 'فایل مبدأ:' : 'File:'}</span>
                <span className="text-slate-600 truncate max-w-[180px] font-sans">{pms.fileName}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setActiveUploadType('pms')}
              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 rounded transition cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isFa ? 'آپلود فایل PMS' : 'Upload PMS Excel'}</span>
            </button>
            <button
              onClick={() => setActiveEditType('pms')}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-250 cursor-pointer shadow-2xs"
              title={isFa ? 'ویرایش مستقیم' : 'Direct Edit'}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => downloadSampleExcel('pms')}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-250 cursor-pointer shadow-2xs"
              title={isFa ? 'دانلود قالب اکسل نمونه' : 'Download Sample Template'}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. DAILY REPORT CARD */}
        <div className="bg-white border border-slate-250 rounded-lg p-3.5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <h3 className="font-bold text-xs md:text-sm text-slate-900">
                  {isFa ? '۲. گزارش روزانه کارگاه (Daily Report)' : '2. Daily Site Report'}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Day {daily.version}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700 mb-3 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isFa ? 'تاریخ گزارش:' : 'Report Date:'}</span>
                <span className="font-bold text-slate-900">{daily.reportDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isFa ? 'نیروی انسانی کل:' : 'Total Manpower:'}</span>
                <span className="font-bold text-emerald-800">{daily.manpower.total} نفر ({daily.manpower.direct} مستقیم)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isFa ? 'ماشین‌آلات فعال:' : 'Active Machinery:'}</span>
                <span className="font-bold text-slate-900">{daily.machinery.active} / {daily.machinery.total}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500 font-sans">{isFa ? 'تعداد موانع فعال:' : 'Key Constraints:'}</span>
                <span className="text-rose-700 font-bold">{daily.keyIssues.length} مورد</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setActiveUploadType('daily')}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 rounded transition cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isFa ? 'آپلود فایل گزارش روزانه' : 'Upload Daily Excel'}</span>
            </button>
            <button
              onClick={() => setActiveEditType('daily')}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-250 cursor-pointer shadow-2xs"
              title={isFa ? 'ویرایش مستقیم' : 'Direct Edit'}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => downloadSampleExcel('daily')}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-250 cursor-pointer shadow-2xs"
              title={isFa ? 'دانلود قالب اکسل نمونه' : 'Download Sample Template'}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. IPC / PAYMENT STATUS CARD */}
        <div className="bg-white border border-slate-250 rounded-lg p-3.5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                <h3 className="font-bold text-xs md:text-sm text-slate-900">
                  {isFa ? '۳. وضعیت صورت‌وضعیت‌ها (IPC Status)' : '3. IPC & Financial Status'}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                IPC #{ipc.version}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700 mb-3 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isFa ? 'آخرین صورت‌وضعیت:' : 'Latest IPC:'}</span>
                <span className="font-bold text-slate-900 truncate max-w-[170px]">{ipc.latestIpcNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isFa ? 'ارائه‌شده / تأییدشده:' : 'Submitted / Approved:'}</span>
                <span className="font-bold text-slate-900">
                  {(ipc.submittedAmount / 1000000).toFixed(2)}M / {(ipc.approvedAmount / 1000000).toFixed(2)}M {ipc.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isFa ? 'پرداخت‌شده / مطالبات:' : 'Paid / Outstanding:'}</span>
                <span className="font-bold text-emerald-700">
                  {(ipc.paidAmount / 1000000).toFixed(2)}M / <span className="text-amber-800">{(ipc.outstandingAmount / 1000000).toFixed(2)}M</span>
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500 font-sans">{isFa ? 'تاریخ تأیید:' : 'Approval Date:'}</span>
                <span className="text-slate-600">{ipc.approvalDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setActiveUploadType('ipc')}
              className="flex-1 flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-1.5 rounded transition cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isFa ? 'آپلود فایل صورت‌وضعیت' : 'Upload IPC Excel'}</span>
            </button>
            <button
              onClick={() => setActiveEditType('ipc')}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-250 cursor-pointer shadow-2xs"
              title={isFa ? 'ویرایش مستقیم' : 'Direct Edit'}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => downloadSampleExcel('ipc')}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-250 cursor-pointer shadow-2xs"
              title={isFa ? 'دانلود قالب اکسل نمونه' : 'Download Sample Template'}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4. EQUIPMENT INSTALLATION CARD */}
        <div className="bg-white border border-slate-250 rounded-lg p-3.5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                <h3 className="font-bold text-xs md:text-sm text-slate-900">
                  {isFa ? '۴. وضعیت نصب تجهیزات (Equipment Log)' : '4. Equipment Installation Status'}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Log #{equipment.version}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700 mb-3 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isFa ? 'تاریخ لاگ تجهیزات:' : 'Log Date:'}</span>
                <span className="font-bold text-slate-900">{equipment.dataDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isFa ? 'کل تجهیزات / تحویل کارگاه:' : 'Total / Delivered:'}</span>
                <span className="font-bold text-slate-900">{equipment.totalEquipment} / {equipment.deliveredSite}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isFa ? 'نصب‌شده / تایید نهایی:' : 'Installed / Accepted:'}</span>
                <span className="font-bold text-teal-800">
                  {equipment.installed} ({equipment.installationPercentage}%) / {equipment.accepted}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500 font-sans">{isFa ? 'تجهیزات باقی‌مانده:' : 'Remaining:'}</span>
                <span className="text-slate-600">{equipment.notInstalled} آیتم</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setActiveUploadType('equipment')}
              className="flex-1 flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-1.5 rounded transition cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isFa ? 'آپلود فایل وضعیت تجهیزات' : 'Upload Equipment Excel'}</span>
            </button>
            <button
              onClick={() => setActiveEditType('equipment')}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-250 cursor-pointer shadow-2xs"
              title={isFa ? 'ویرایش مستقیم' : 'Direct Edit'}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => downloadSampleExcel('equipment')}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-250 cursor-pointer shadow-2xs"
              title={isFa ? 'دانلود قالب اکسل نمونه' : 'Download Sample Template'}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {activeUploadType && (
        <FileUploadMapperModal
          isOpen={Boolean(activeUploadType)}
          onClose={() => setActiveUploadType(null)}
          datasetType={activeUploadType}
          onApplyData={handleApplyUploadedData}
          lang={lang}
        />
      )}

      {/* Manual Edit Modal */}
      {activeEditType && (
        <ManualDataEditorModal
          isOpen={Boolean(activeEditType)}
          onClose={() => setActiveEditType(null)}
          datasetType={activeEditType}
          currentData={
            activeEditType === 'pms' ? pms :
            activeEditType === 'daily' ? daily :
            activeEditType === 'ipc' ? ipc : equipment
          }
          onSave={handleApplyManualData}
          lang={lang}
        />
      )}
    </div>
  );
};
