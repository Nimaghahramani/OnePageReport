import React, { useState, useRef } from 'react';
import { ProjectMasterImportResult, parseProjectMasterWorkbook, downloadSampleExcel } from '../../services/excelParser';
import { projectDataStore } from '../../services/dataStore';
import { Language } from '../../types';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Building,
  Calendar,
  DollarSign,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface ProjectMasterImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  lang: Language;
}

export const ProjectMasterImportModal: React.FC<ProjectMasterImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lang
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ProjectMasterImportResult | null>(null);
  const [isApplied, setIsApplied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFa = lang === 'fa';

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError(null);
    setLoading(true);
    setImportResult(null);
    setIsApplied(false);

    try {
      const res = await parseProjectMasterWorkbook(selected);
      setImportResult(res);
    } catch (err: any) {
      console.error('Master Excel Parse Error:', err);
      setError(err.message || 'خطا در تحلیل ساختار فایل اکسل اطلاعات پایه پروژه');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmApply = () => {
    if (!importResult) return;
    projectDataStore.applyProjectMasterImport(importResult, 'Contract & Planning Admin');
    setIsApplied(true);
    if (onSuccess) {
      onSuccess();
    }
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-250 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                {isFa ? 'ورود اطلاعات پایه پروژه از اکسل (Project Master Excel Import)' : 'Import Project Master Data from Excel'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isFa ? 'نگاشت سلولی قطعی برگه "اسکله" (نام، کارفرما، مشاور، پیمانکار، تاریخ شروع و مبالغ ریالی/ارزی)' : 'Cell-mapped ingestion from sheet "اسکله"'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* Instructions & Template Download */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 flex items-center justify-between gap-3 text-blue-900">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs block">
                  {isFa ? 'دستورالعمل ورود اطلاعات پایه (Master Data):' : 'Master Data Import Protocol:'}
                </span>
                <p className="text-[11px] text-blue-800 leading-relaxed mt-0.5">
                  {isFa
                    ? 'این داده‌ها به عنوان هویت اصلی و پایه پروژه ذخیره می‌شوند. فایل‌های گزارش روزانه و PMS بعدی به هیچ وجه این اطلاعات را بازنویسی نخواهند کرد.'
                    : 'These master fields establish permanent project identity. Subsequent Daily Reports and PMS uploads will never overwrite them.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => downloadSampleExcel('master_project')}
              className="shrink-0 flex items-center gap-1.5 bg-white hover:bg-blue-100 text-blue-800 font-bold px-3 py-1.5 rounded border border-blue-300 shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isFa ? 'دانلود قالب اکسل اسکله' : 'Download Template'}</span>
            </button>
          </div>

          {/* Upload Area */}
          {!importResult && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.xlsm"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 rounded-full bg-blue-100 group-hover:bg-blue-200 text-blue-700 flex items-center justify-center transition shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {isFa ? 'جهت انتخاب فایل اکسل اطلاعات پایه کلیک کنید یا فایل را اینجا رها نمایید' : 'Click to select or drag & drop Project Master Excel file'}
                </span>
                <span className="text-[10.5px] text-slate-500 font-mono mt-0.5 block">
                  {isFa ? 'پشتیبانی از فرمت‌های xlsx, xls - برگه هدف: "اسکله"' : 'Supported: .xlsx, .xls - Target Sheet: "اسکله"'}
                </span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="py-8 text-center space-y-2">
              <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <span className="text-xs font-bold text-slate-700 block">
                {isFa ? 'در حال استخراج و تحلیل سلول‌های برگه "اسکله"...' : 'Parsing target sheet "اسکله"...'}
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">{isFa ? 'خطا در تحلیل فایل اکسل:' : 'Excel Ingestion Error:'}</span>
                <p className="text-[11px] mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Success Applied Banner */}
          {isApplied && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold text-xs">
                {isFa ? 'اطلاعات پایه پروژه با موفقیت در سامانه ذخیره و فعال گردید.' : 'Project Master Data applied successfully.'}
              </span>
            </div>
          )}

          {/* Import Preview Card */}
          {importResult && !isApplied && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-100 px-3 py-2 rounded-lg border border-slate-250">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{isFa ? 'پیش‌نمایش استخراج داده‌ها (Import Preview):' : 'Import Preview:'}</span>
                  <span className="bg-blue-100 text-blue-900 font-mono px-2 py-0.5 rounded text-[10.5px] font-bold border border-blue-200">
                    Sheet: {importResult.sheetName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImportResult(null);
                    setFile(null);
                  }}
                  className="text-slate-500 hover:text-rose-600 font-medium text-[11px] underline cursor-pointer"
                >
                  {isFa ? 'انتخاب فایل دیگر' : 'Change File'}
                </button>
              </div>

              {/* Data Extraction Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                
                {/* Project Name */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-[10.5px] text-slate-500 mb-1">
                    <span>{isFa ? 'نام پروژه (D1 / B6):' : 'Project Name (D1 / B6):'}</span>
                    <span className="font-mono text-emerald-700 font-bold">Cell D1/B6</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs block leading-tight">
                    {importResult.projectNameFa}
                  </span>
                </div>

                {/* Client */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-[10.5px] text-slate-500 mb-1">
                    <span>{isFa ? 'کارفرما (N9):' : 'Client (N9):'}</span>
                    <span className="font-mono text-emerald-700 font-bold">Cell N9</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs block">
                    {importResult.clientNameFa}
                  </span>
                </div>

                {/* Consultant */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-[10.5px] text-slate-500 mb-1">
                    <span>{isFa ? 'مهندس مشاور (N11):' : 'Consultant (N11):'}</span>
                    <span className="font-mono text-emerald-700 font-bold">Cell N11</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs block">
                    {importResult.consultantNameFa}
                  </span>
                </div>

                {/* Contractor */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-[10.5px] text-slate-500 mb-1">
                    <span>{isFa ? 'پیمانکار (N12):' : 'Contractor (N12):'}</span>
                    <span className="font-mono text-emerald-700 font-bold">Cell N12</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs block">
                    {importResult.contractorNameFa}
                  </span>
                </div>

                {/* Project Manager / MC */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-[10.5px] text-slate-500 mb-1">
                    <span>{isFa ? 'مدیر طرح / نظارت عالیه (N10):' : 'Project Manager / MC (N10):'}</span>
                    <span className="font-mono text-emerald-700 font-bold">Cell N10</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs block">
                    {importResult.projectManagerFa}
                  </span>
                </div>

                {/* Start & Notification Dates */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-[10.5px] text-slate-500 mb-1">
                    <span>{isFa ? 'تاریخ شروع و ابلاغ (V9, V10):' : 'Dates (V9, V10):'}</span>
                    <span className="font-mono text-emerald-700 font-bold">Cells V9 / V10</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono font-bold text-slate-900">
                    <span>شروع: {importResult.startDate}</span>
                    <span className="text-slate-300">|</span>
                    <span>ابلاغ: {importResult.contractNotificationDate}</span>
                  </div>
                </div>

                {/* Contract Duration */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-[10.5px] text-slate-500 mb-1">
                    <span>{isFa ? 'مدت قرارداد (V11):' : 'Duration (V11):'}</span>
                    <span className="font-mono text-emerald-700 font-bold">Cell V11</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs block font-mono">
                    {importResult.contractDurationText} ({importResult.durationDays} روز)
                  </span>
                </div>

                {/* Contract Amounts */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-[10.5px] text-slate-500 mb-1">
                    <span>{isFa ? 'مبالغ ارزی و ریالی (N13, N15):' : 'Values (N13, N15):'}</span>
                    <span className="font-mono text-emerald-700 font-bold">Cells N13 / N15</span>
                  </div>
                  <div className="flex items-center justify-between font-mono font-bold text-slate-900 text-[11px]">
                    <span>{Number(importResult.contractValueIRR).toLocaleString()} IRR</span>
                    <span className="text-blue-700 font-black">{Number(importResult.contractValueEUR).toLocaleString()} EUR</span>
                  </div>
                </div>

              </div>

              {/* Project Scope */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between text-[10.5px] text-slate-500 mb-1">
                  <span>{isFa ? 'موضوع و محدوده پروژه (B10):' : 'Project Scope (B10):'}</span>
                  <span className="font-mono text-emerald-700 font-bold">Cell B10</span>
                </div>
                <p className="text-slate-800 text-[11px] leading-relaxed">
                  {importResult.scopeDescriptionFa}
                </p>
              </div>

              {/* Validation Footnote */}
              <div className="p-2.5 bg-slate-100 border border-slate-250 rounded text-[10px] text-slate-600 flex items-center justify-between">
                <span>
                  {isFa
                    ? 'فیلدهای فاقد مقدار در فایل اکسل (شماره قرارداد، نام‌های انگلیسی) مطابق استاندارد N/A در نظر گرفته شدند.'
                    : 'Non-existent fields in source Excel (Contract Number, English names) are assigned N/A.'}
                </span>
                <span className="font-bold text-emerald-800 font-mono">Status: Validated</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded cursor-pointer"
          >
            {isFa ? 'انصراف' : 'Cancel'}
          </button>

          {importResult && !isApplied && (
            <button
              type="button"
              onClick={handleConfirmApply}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2 rounded-lg shadow-xs transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isFa ? 'تأیید و اعمال در سامانه (Confirm & Apply Master Data)' : 'Confirm & Apply Master Data'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
