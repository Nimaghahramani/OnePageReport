import React, { useState, useRef } from 'react';
import { Language } from '../../types';
import {
  parseWorkbook,
  parseDailyReportWorkbook,
  parseExcelOrCsv,
  ParsedSheetData,
  DailyReportWorkbookResult,
  SYSTEM_FIELDS,
  autoSuggestMapping
} from '../../services/excelParser';
import { projectDataStore } from '../../services/dataStore';
import {
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Table,
  X,
  CheckCircle2,
  AlertTriangle,
  Users,
  TrendingUp,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';

interface FileUploadMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetType: 'pms' | 'daily' | 'ipc' | 'equipment' | 'daily_workbook';
  onApplyData: (mappedData: any, fileName: string) => void;
  lang: Language;
}

export const FileUploadMapperModal: React.FC<FileUploadMapperModalProps> = ({
  isOpen,
  onClose,
  datasetType,
  onApplyData,
  lang
}) => {
  const [fileData, setFileData] = useState<ParsedSheetData | null>(null);
  const [workbookResult, setWorkbookResult] = useState<DailyReportWorkbookResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFa = lang === 'fa';

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const wb = await parseWorkbook(file);
      const sheetNames = wb.SheetNames;

      // Check if this is a Multi-Sheet Daily Report workbook
      const isMultiSheet = sheetNames.length > 1;
      const hasManpower = sheetNames.some(s => /manpower|نیروی\s*انسانی/i.test(s));
      const hasConstruction = sheetNames.some(s => /construction|ساخت/i.test(s));
      const hasPms = sheetNames.some(s => /pms|پیشرفت/i.test(s));

      if (datasetType === 'daily_workbook' || isMultiSheet || (hasManpower && hasConstruction) || (hasManpower && hasPms)) {
        // Run Multi-Sheet Workbook Parser
        const master = projectDataStore.getMasterData();
        const pms = projectDataStore.getPms();
        const masterSCurve = projectDataStore.getMasterSCurve();
        const result = await parseDailyReportWorkbook(file, master, pms, masterSCurve);
        setWorkbookResult(result);
      } else {
        // Run single-sheet column mapper
        const parsed = await parseExcelOrCsv(file);
        setFileData(parsed);
        const mappedType = datasetType === 'daily_workbook' ? 'daily' : datasetType;
        const suggested = autoSuggestMapping(mappedType, parsed.headers);
        setColumnMapping(suggested);
      }
    } catch (err: any) {
      setErrorMsg(isFa ? `خطا در پردازش فایل اکسل: ${err.message}` : `Failed to parse Excel file: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmWorkbookImport = () => {
    if (!workbookResult) return;
    projectDataStore.applyDailyReportWorkbook(workbookResult);
    onClose();
  };

  const handleMappingChange = (sysKey: string, headerName: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [sysKey]: headerName
    }));
  };

  const handleConfirmSingleSheetImport = () => {
    if (!fileData) return;

    const sampleRow = fileData.rows[0] || {};
    const mappedResult: any = {};

    Object.entries(columnMapping).forEach(([sysKey, headerCol]) => {
      if (headerCol && sampleRow[headerCol] !== undefined) {
        let val = sampleRow[headerCol];
        if (typeof val === 'string' && !isNaN(Number(val.replace(/,/g, '')))) {
          val = Number(val.replace(/,/g, ''));
        }
        mappedResult[sysKey] = val;
      }
    });

    onApplyData(mappedResult, fileData.fileName);
    onClose();
  };

  const getDatasetTitle = () => {
    switch (datasetType) {
      case 'daily_workbook': return isFa ? 'فایل جامع گزارش روزانه چندبرگه‌ای (Daily Report Multi-Sheet)' : 'Daily Report Multi-Sheet Workbook';
      case 'pms': return isFa ? 'فایل پیشرفت PMS (S-Curve & Progress)' : 'PMS Progress Update File';
      case 'daily': return isFa ? 'گزارش روزانه کارگاه (Site Daily Report)' : 'Site Daily Report File';
      case 'ipc': return isFa ? 'صورت‌وضعیت مالی و پرداختی (IPC Statement)' : 'IPC Financial Statement File';
      case 'equipment': return isFa ? 'لاگ نصب تجهیزات (Equipment Installation Log)' : 'Equipment Installation Log';
    }
  };

  const systemFields = SYSTEM_FIELDS[datasetType === 'daily_workbook' ? 'daily' : datasetType] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 no-print">
      <div className="bg-white border border-slate-250 rounded-lg max-w-3xl w-full text-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="font-extrabold text-xs md:text-sm text-slate-900">{getDatasetTitle()}</h3>
              <p className="text-[10.5px] text-slate-500">
                {isFa
                  ? 'موتور پردازش و اعتبارسنجی خودکار برگه‌های اکسل (MANPOWER، Construction و PMS)'
                  : 'Automated Multi-Sheet Excel Parser (MANPOWER-MACHINARY, Construction & PMS)'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {/* File Upload Zone */}
          {!fileData && !workbookResult && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 rounded-lg p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {isFa ? 'فایل اکسل (.xlsx, .xls) را اینجا رها کنید یا کلیک کنید' : 'Click or Drag & Drop Excel (.xlsx, .xls) File'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  {isFa
                    ? 'پشتیبانی کامل از فایل چندبرگه‌ای گزارش روزانه (MANPOWER-MACHINARY, Construction (2), PMS)'
                    : 'Full Multi-Sheet Workbook Support with automated cross-sheet extraction'}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {isProcessing && (
            <div className="p-4 text-center text-xs text-slate-600 font-medium">
              {isFa ? 'در حال پردازش و استخراج داده‌های برگه‌ها...' : 'Processing workbook sheets...'}
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 rounded text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* 8. MULTI-SHEET IMPORT PREVIEW */}
          {workbookResult && (
            <div className="space-y-3">
              {/* File & Detection Summary */}
              <div className="flex items-center justify-between p-2.5 bg-blue-50/80 rounded border border-blue-250 text-xs">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-700" />
                  <span className="font-bold text-slate-900">{workbookResult.fileName}</span>
                  <span className="text-blue-700 font-medium text-[11px]">
                    ({workbookResult.sheetNamesFound.allSheetNames.length} {isFa ? 'برگه شناسایی‌شده' : 'sheets detected'})
                  </span>
                </div>
                <button
                  onClick={() => setWorkbookResult(null)}
                  className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  {isFa ? 'انتخاب فایل دیگر' : 'Change File'}
                </button>
              </div>

              {/* Sheet Detection Tags */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                  <div className="text-[10px] text-slate-500 font-medium">1. Manpower:</div>
                  <div className="font-bold text-slate-800 truncate">
                    {workbookResult.sheetNamesFound.manpowerSheetName || 'MANPOWER-MACHINARY'}
                  </div>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                  <div className="text-[10px] text-slate-500 font-medium">2. Issues:</div>
                  <div className="font-bold text-slate-800 truncate">
                    {workbookResult.sheetNamesFound.constructionSheetName || 'Construction (2)'}
                  </div>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                  <div className="text-[10px] text-slate-500 font-medium">3. PMS Sheet:</div>
                  <div className="font-bold text-slate-800 truncate">
                    {workbookResult.sheetNamesFound.pmsSheetName || 'PMS'}
                  </div>
                </div>
                <div className="p-2 bg-teal-50/80 border border-teal-250 rounded text-xs">
                  <div className="text-[10px] text-teal-700 font-medium">4. Equipment Sheet:</div>
                  <div className="font-bold text-teal-950 truncate">
                    {workbookResult.sheetNamesFound.equipmentSheetName || 'Equipment'}
                  </div>
                </div>
              </div>

              {/* 6 Required Import Preview KPI Cards */}
              <div className="border border-slate-250 rounded-lg p-3 bg-white space-y-2.5 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {isFa ? 'پیش‌نمایش داده‌های استخراج‌شده (Import Preview Summary)' : 'Import Preview Key Metrics'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Live Parsed Result</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {/* 1. PMS Data Date */}
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-600" />
                      {isFa ? 'تاریخ داده (Data Date)' : 'PMS Data Date'}
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-900 mt-1">
                      {workbookResult.pmsDataDate}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">Cell AB2</span>
                  </div>

                  {/* 2. PMS Root Activity */}
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex flex-col justify-between col-span-1 sm:col-span-3">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-600" />
                      {isFa ? 'فعالیت اصلی ریشه (Root Activity ID = 0)' : 'Root Activity (ID = 0)'}
                    </span>
                    <span className="text-xs font-bold text-slate-900 mt-1 truncate">
                      {workbookResult.pmsRootActivity}
                    </span>
                    <span className="text-[9px] text-indigo-600 font-medium">
                      {isFa ? 'سطر ۴ برگه PMS' : 'PMS Row 4 Root Node'}
                    </span>
                  </div>

                  {/* 3. Actual Last Period */}
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500">
                      {isFa ? 'واقعی دوره قبل (Last)' : 'Actual Last Period'}
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-800 mt-1">
                      {workbookResult.actualLastPeriod !== null ? `${workbookResult.actualLastPeriod}%` : 'N/A'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">Col T (Last Period)</span>
                  </div>

                  {/* 4. Actual This Period */}
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500">
                      {isFa ? 'واقعی این دوره (This)' : 'Actual This Period'}
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-800 mt-1">
                      {workbookResult.actualThisPeriod !== null ? `${workbookResult.actualThisPeriod}%` : 'N/A'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">Col U (This Period)</span>
                  </div>

                  {/* 5. Actual Cumulative */}
                  <div className="bg-blue-50/80 p-2.5 rounded border border-blue-300 flex flex-col justify-between">
                    <span className="text-[10px] text-blue-800 font-bold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-blue-600" />
                      {isFa ? 'پیشرفت واقعی تجمعی' : 'Actual Cumulative'}
                    </span>
                    <span className="text-sm font-black font-mono text-blue-950 mt-1">
                      {workbookResult.actualCumulative !== null ? `${workbookResult.actualCumulative}%` : `${workbookResult.actualProgress}%`}
                    </span>
                    <span className="text-[9px] text-blue-700 font-mono">Col V (Row 4)</span>
                  </div>

                  {/* 6. PMS Plan Progress Cumulative (Current KPI Driver) */}
                  <div className="bg-blue-50/80 p-2.5 rounded border border-blue-300 flex flex-col justify-between">
                    <span className="text-[10px] text-blue-900 font-bold flex items-center gap-1">
                      {isFa ? 'پیشرفت برنامه‌ای جاری (PMS Plan)' : 'Current PMS Plan (Plan KPI)'}
                    </span>
                    <span className="text-sm font-black font-mono text-blue-950 mt-1">
                      {workbookResult.pmsFilePlannedCumulative !== null ? `${workbookResult.pmsFilePlannedCumulative}%` : 'N/A'}
                    </span>
                    <span className="text-[9px] text-blue-700 font-mono truncate">
                      {isFa ? 'Col S4 (مأخذ شاخص پیشرفت برنامه‌ای)' : 'Col S4 (Source for Planned KPI)'}
                    </span>
                  </div>

                  {/* 7. Progress Variance & Master S-Curve Baseline Reference */}
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex flex-col justify-between col-span-2 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-700 font-bold">
                        {isFa ? 'انحراف پیشرفت جاری و خط مبنای مصوب' : 'Current Progress Variance & Baseline'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-mono">PMS Variance</span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[10px] text-slate-500">{isFa ? 'انحراف (واقعی - برنامه):' : 'Variance (Act - Plan):'}</span>
                        <span className={`text-xs font-black font-mono px-1.5 py-0.5 rounded ${
                          workbookResult.dashboardVariance !== null
                            ? (workbookResult.dashboardVariance >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')
                            : 'text-slate-500'
                        }`}>
                          {workbookResult.dashboardVariance !== null ? `${workbookResult.dashboardVariance >= 0 ? '+' : ''}${workbookResult.dashboardVariance}%` : 'N/A'}
                        </span>
                      </div>
                      {workbookResult.masterScurvePlanned !== null && (
                        <div className="flex items-baseline gap-1">
                          <span className="text-[10px] text-slate-500">{isFa ? 'مبنای مصوب ۱۸ ماهه:' : '18M Baseline:'}</span>
                          <span className="text-xs font-bold font-mono text-slate-800">
                            {workbookResult.masterScurvePlanned}%
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500">
                      {isFa 
                        ? 'پیشرفت برنامه‌ای جاری مستقیماً از ستون S4 (برنامه PMS) خوانده شده و خط مبنای مصوب Master S-Curve جهت مرجع نگهداری می‌شود.'
                        : 'Current Planned Progress is read from Col S4 (PMS Plan) with Master S-Curve serving as schedule baseline.'}
                    </span>
                  </div>
                </div>

                {/* Manpower Breakdown Strip */}
                <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-xs">
                  {/* Direct Manpower */}
                  <div className="bg-slate-50 p-2 rounded border border-slate-200 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500">
                      {isFa ? 'نیروی مستقیم (Direct)' : 'Direct Present'}
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-900 mt-0.5">
                      {workbookResult.directPresent !== null ? `${workbookResult.directPresent} نفر` : 'N/A'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">Column N (Row 39)</span>
                  </div>

                  {/* Indirect Manpower */}
                  <div className="bg-slate-50 p-2 rounded border border-slate-200 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500">
                      {isFa ? 'نیروی غیرمستقیم (Indirect)' : 'Indirect Present'}
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-900 mt-0.5">
                      {workbookResult.indirectPresent !== null ? `${workbookResult.indirectPresent} نفر` : 'N/A'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">Column I (Row 39)</span>
                  </div>

                  {/* Total Active Manpower */}
                  <div className="bg-emerald-50/90 p-2 rounded border border-emerald-300 flex flex-col justify-between">
                    <span className="text-[10px] text-emerald-800 font-bold">
                      {isFa ? 'مجموع حاضرین کارگاه (Active)' : 'Total Active Manpower'}
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-950 mt-0.5">
                      {workbookResult.totalPresent !== null ? `${workbookResult.totalPresent} نفر` : 'N/A'}
                    </span>
                    <span className="text-[9px] text-emerald-700 font-mono">Direct (39) + Indirect (39)</span>
                  </div>
                </div>
              </div>

              {/* Selected PMS WBS Progress Detected (Section A: Top-Level 1,2,3 & Section B: Detail 2.2-2.9) */}
              {((workbookResult.topLevelProgress && workbookResult.topLevelProgress.length > 0) || (workbookResult.disciplineProgress && workbookResult.disciplineProgress.length > 0)) && (
                <div className="border border-slate-250 rounded-lg overflow-hidden space-y-2 p-2 bg-white">
                  <div className="bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-800 border border-slate-200 rounded flex items-center justify-between">
                    <span>{isFa ? 'پیشرفت ساختار شکست منتخب PMS (سطح کلان ۱ و جزئیات WBS 2)' : 'Selected PMS WBS Progress (Top-Level & WBS 2 Details)'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      WBS: 1, 2, 3 | 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9
                    </span>
                  </div>

                  {/* Top Level 1, 2, 3 */}
                  <div className="border border-slate-200 rounded overflow-hidden">
                    <div className="bg-blue-50/80 px-2.5 py-1 text-[11px] font-extrabold text-blue-900 border-b border-blue-200 flex justify-between">
                      <span>{isFa ? '۱. اقلام کلان PMS (سطح ۱)' : '1. Top-Level PMS Items (Level 1)'}</span>
                      <span className="font-mono text-[10px]">WBS 1, 2, 3</span>
                    </div>
                    <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                      <thead className="bg-slate-100/80 text-[10px] text-slate-600 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="py-1 px-2.5 w-16">WBS</th>
                          <th className="py-1 px-2.5">{isFa ? 'شرح فعالیت' : 'Description'}</th>
                          <th className="py-1 px-2.5 text-center">{isFa ? 'برنامه تجمعی' : 'Plan (Cum)'}</th>
                          <th className="py-1 px-2.5 text-center">{isFa ? 'واقعی تجمعی' : 'Actual (Cum)'}</th>
                          <th className="py-1 px-2.5 text-center">{isFa ? 'انحراف' : 'Variance'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {(workbookResult.topLevelProgress || []).map((item) => {
                          const v = item.variance;
                          let varClass = 'bg-slate-100 text-slate-600';
                          if (v !== null && v !== undefined) {
                            if (v >= 0) varClass = 'bg-emerald-100 text-emerald-800';
                            else if (v >= -3) varClass = 'bg-amber-100 text-amber-800';
                            else varClass = 'bg-rose-100 text-rose-800';
                          }
                          return (
                            <tr key={item.wbsCode} className="hover:bg-slate-50 font-medium">
                              <td className="py-1 px-2.5 font-mono font-bold text-blue-900 text-[11px]">{item.wbsCode}</td>
                              <td className="py-1 px-2.5 text-slate-800 text-[11px] font-semibold">{item.wbsName}</td>
                              <td className="py-1 px-2.5 text-center font-mono text-[11px] text-slate-600">
                                {item.planned !== null ? `${item.planned}%` : '—'}
                              </td>
                              <td className="py-1 px-2.5 text-center font-mono text-[11px] font-bold text-blue-900">
                                {item.actual !== null ? `${item.actual}%` : '—'}
                              </td>
                              <td className="py-1 px-2.5 text-center font-mono text-[11px]">
                                <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${varClass}`}>
                                  {v !== null ? `${v > 0 ? '+' : ''}${v}%` : '—'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Detail 2.2 to 2.9 */}
                  <div className="border border-slate-200 rounded overflow-hidden">
                    <div className="bg-slate-100/90 px-2.5 py-1 text-[11px] font-bold text-slate-800 border-b border-slate-200 flex justify-between">
                      <span>{isFa ? '۲. جزئیات منتخب WBS 2 (تأمین)' : '2. Selected Details under WBS 2'}</span>
                      <span className="font-mono text-[10px] text-slate-500">2.2 – 2.9</span>
                    </div>
                    <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                      <thead className="bg-slate-50 text-[10px] text-slate-600 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="py-1 px-2.5 w-16">WBS</th>
                          <th className="py-1 px-2.5">{isFa ? 'شرح فعالیت' : 'Description'}</th>
                          <th className="py-1 px-2.5 text-center">{isFa ? 'برنامه تجمعی' : 'Plan (Cum)'}</th>
                          <th className="py-1 px-2.5 text-center">{isFa ? 'واقعی تجمعی' : 'Actual (Cum)'}</th>
                          <th className="py-1 px-2.5 text-center">{isFa ? 'انحراف' : 'Variance'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {(workbookResult.detailProgress || []).map((item) => {
                          const v = item.variance;
                          let varClass = 'bg-slate-100 text-slate-600';
                          if (v !== null && v !== undefined) {
                            if (v >= 0) varClass = 'bg-emerald-100 text-emerald-800';
                            else if (v >= -3) varClass = 'bg-amber-100 text-amber-800';
                            else varClass = 'bg-rose-100 text-rose-800';
                          }
                          return (
                            <tr key={item.wbsCode} className="hover:bg-slate-50">
                              <td className="py-1 px-2.5 font-mono font-bold text-slate-700 text-[11px]">{item.wbsCode}</td>
                              <td className="py-1 px-2.5 text-slate-700 text-[11px]">{item.wbsName}</td>
                              <td className="py-1 px-2.5 text-center font-mono text-[11px] text-slate-500">
                                {item.planned !== null ? `${item.planned}%` : '—'}
                              </td>
                              <td className="py-1 px-2.5 text-center font-mono text-[11px] font-bold text-blue-900">
                                {item.actual !== null ? `${item.actual}%` : '—'}
                              </td>
                              <td className="py-1 px-2.5 text-center font-mono text-[11px]">
                                <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${varClass}`}>
                                  {v !== null ? `${v > 0 ? '+' : ''}${v}%` : '—'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Detected Key Issues from Construction (2) */}
              <div className="border border-slate-250 rounded-lg overflow-hidden bg-white">
                <div className="bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 border-b border-slate-200 flex items-center justify-between">
                  <span>{isFa ? 'مشکلات و موانع استخراج‌شده از برگه Construction (2)' : 'Issues Extracted from Construction (2)'}</span>
                  <span className="text-[10px] text-slate-600 font-mono font-bold">
                    {isFa ? `تعداد موانع شناسایی‌شده: ${workbookResult.keyIssues.length}` : `Issues Detected: ${workbookResult.keyIssues.length}`}
                  </span>
                </div>
                {workbookResult.keyIssues.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500">
                    {isFa ? 'هیچ مانع یا مشکلی در این برگه ثبت نشده است.' : 'No issues detected in this sheet.'}
                  </div>
                ) : (
                  <div className="max-h-44 overflow-y-auto divide-y divide-slate-150 p-2 space-y-1.5 text-xs">
                    {workbookResult.keyIssues.map((iss, idx) => (
                      <div key={iss.id || idx} className="p-2 bg-slate-50/80 rounded border border-slate-200 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-1.5 flex-1">
                            <span className="font-mono font-bold text-slate-400 text-[11px]">#{idx + 1}</span>
                            <span className="font-bold text-slate-900 text-[11px] leading-snug">
                              {iss.issueFa}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono pt-0.5">
                          <span>{isFa ? 'برگه مرجع:' : 'Sheet:'} {iss.sourceSheet || 'Construction (2)'}</span>
                          <span>{isFa ? 'سطر اکسل:' : 'Row:'} {iss.sourceRow || '—'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detected Financial / Invoice Summary */}
              {workbookResult.financialSummary && (
                <div className="border border-slate-250 rounded-lg overflow-hidden bg-white">
                  <div className="bg-blue-50/80 px-3 py-1.5 text-xs font-bold text-blue-950 border-b border-blue-200 flex items-center justify-between">
                    <span>{isFa ? 'اطلاعات مالی و صورت‌وضعیت استخراج‌شده از برگه Invoice' : 'Financial & Invoice Data from Invoice Sheet'}</span>
                    <span className="text-[10px] text-blue-800 font-mono font-bold">
                      {workbookResult.financialSummary.latestInvoiceNumber ? `IPC #${workbookResult.financialSummary.latestInvoiceNumber}` : 'Invoice Data'}
                    </span>
                  </div>
                  <div className="p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">{isFa ? 'پیشرفت مالی' : 'Financial Progress'}</span>
                      <span className="text-sm font-bold text-blue-950 font-mono">{workbookResult.financialSummary.financialProgress}%</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">{isFa ? 'نسبت وصول' : 'Collection Ratio'}</span>
                      <span className="text-sm font-bold text-emerald-950 font-mono">{workbookResult.financialSummary.collectionRatio}%</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">{isFa ? 'کارکرد تجمعی' : 'Cumulative Invoice'}</span>
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {(workbookResult.financialSummary.invoiceCumulativeIRR / 1_000_000_000).toFixed(1)}B ریال
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono block">
                        {(workbookResult.financialSummary.invoiceCumulativeEUR / 1_000).toFixed(1)}k €
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">{isFa ? 'دریافتی کل' : 'Total Received'}</span>
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {(workbookResult.financialSummary.receivedIRR / 1_000_000_000).toFixed(1)}B ریال
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono block">
                        {(workbookResult.financialSummary.receivedEUR / 1_000).toFixed(1)}k €
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Detected Equipment Summary & Items from Equipment Sheet */}
              {workbookResult.equipmentSummary && (
                <div className="border border-slate-250 rounded-lg overflow-hidden bg-white">
                  <div className="bg-teal-50/90 px-3 py-1.5 text-xs font-bold text-teal-950 border-b border-teal-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                      {isFa ? 'پیش‌نمایش وضعیت نصب تجهیزات (برگه Equipment)' : 'Equipment Installation Progress (Equipment Sheet)'}
                    </span>
                    <span className="text-[10px] text-teal-800 font-mono font-bold">
                      {isFa
                        ? `${workbookResult.equipmentSummary.completed} از ${workbookResult.equipmentSummary.total} (${workbookResult.equipmentSummary.weightedProgress}%)`
                        : `${workbookResult.equipmentSummary.completed}/${workbookResult.equipmentSummary.total} (${workbookResult.equipmentSummary.weightedProgress}%)`}
                    </span>
                  </div>
                  <div className="p-2.5 space-y-2">
                    <div className="grid grid-cols-4 gap-2 text-xs text-center">
                      <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                        <span className="text-[9.5px] text-slate-500 block">{isFa ? 'کل آیتم‌ها' : 'Total Items'}</span>
                        <span className="text-xs font-bold font-mono text-slate-900">{workbookResult.equipmentSummary.total}</span>
                      </div>
                      <div className="bg-teal-50/70 p-1.5 rounded border border-teal-200">
                        <span className="text-[9.5px] text-teal-700 block">{isFa ? 'انجام‌شده' : 'Completed'}</span>
                        <span className="text-xs font-bold font-mono text-teal-900">{workbookResult.equipmentSummary.completed}</span>
                      </div>
                      <div className="bg-amber-50/70 p-1.5 rounded border border-amber-200">
                        <span className="text-[9.5px] text-amber-700 block">{isFa ? 'باقیمانده' : 'Remaining'}</span>
                        <span className="text-xs font-bold font-mono text-amber-900">{workbookResult.equipmentSummary.remaining}</span>
                      </div>
                      <div className="bg-blue-50/70 p-1.5 rounded border border-blue-200">
                        <span className="text-[9.5px] text-blue-700 block">{isFa ? 'پیشرفت کل' : 'Progress'}</span>
                        <span className="text-xs font-bold font-mono text-blue-900">{workbookResult.equipmentSummary.weightedProgress}%</span>
                      </div>
                    </div>

                    {/* Table of items */}
                    <div className="border border-slate-200 rounded overflow-hidden max-h-36 overflow-y-auto text-[10px]">
                      <table className="w-full text-right rtl:text-right ltr:text-left">
                        <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                          <tr>
                            <th className="py-0.5 px-2 w-8 text-center">#</th>
                            <th className="py-0.5 px-2">{isFa ? 'تجهیز' : 'Equipment'}</th>
                            <th className="py-0.5 px-1 text-center">{isFa ? 'واحد' : 'Unit'}</th>
                            <th className="py-0.5 px-1 text-center">{isFa ? 'کل' : 'Total'}</th>
                            <th className="py-0.5 px-1 text-center">{isFa ? 'انجام' : 'Done'}</th>
                            <th className="py-0.5 px-1 text-center">{isFa ? 'مانده' : 'Rem.'}</th>
                            <th className="py-0.5 px-1 text-center">{isFa ? 'پیشرفت' : '%'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {workbookResult.equipmentSummary.items.map((it, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-0.5 px-2 text-center text-slate-400 font-mono">{it.sequence || idx + 1}</td>
                              <td className="py-0.5 px-2 font-sans font-medium text-slate-800">{it.name}</td>
                              <td className="py-0.5 px-1 text-center font-sans text-slate-500">{it.unit}</td>
                              <td className="py-0.5 px-1 text-center text-slate-700">{it.total}</td>
                              <td className="py-0.5 px-1 text-center font-bold text-teal-800">{it.completed}</td>
                              <td className="py-0.5 px-1 text-center text-slate-500">{it.remaining}</td>
                              <td className="py-0.5 px-1 text-center font-bold text-slate-900">{it.progressPercent}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Detected Important Activities from Daily Report */}
              <div className="border border-slate-250 rounded-lg overflow-hidden bg-white">
                <div className="bg-emerald-50/80 px-3 py-1.5 text-xs font-bold text-emerald-950 border-b border-emerald-200 flex items-center justify-between">
                  <span>{isFa ? 'فعالیت‌های مهم انجام‌شده استخراج‌شده از گزارش روزانه' : 'Important Activities Extracted from Daily Report'}</span>
                  <span className="text-[10px] text-emerald-800 font-mono font-bold">
                    {isFa ? `تعداد فعالیت‌ها: ${workbookResult.importantActivities?.length || 0}` : `Activities Detected: ${workbookResult.importantActivities?.length || 0}`}
                  </span>
                </div>
                {(!workbookResult.importantActivities || workbookResult.importantActivities.length === 0) ? (
                  <div className="p-3 text-center text-xs text-slate-500">
                    {isFa ? 'فعالیت مهمی در فایل اکسل شناسایی نشد.' : 'No important activities detected in this workbook.'}
                  </div>
                ) : (
                  <div className="max-h-44 overflow-y-auto divide-y divide-slate-150 p-2 space-y-1.5 text-xs">
                    {workbookResult.importantActivities.map((act, idx) => (
                      <div key={act.id || idx} className="p-2 bg-slate-50/80 rounded border border-slate-200 space-y-1">
                        <div className="flex items-start gap-1.5">
                          <span className="font-mono font-bold text-emerald-600 text-[11px] shrink-0 mt-0.5">#{act.sequence || idx + 1}</span>
                          <span className="font-bold text-slate-900 text-[11px] leading-snug">
                            {act.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono pt-0.5">
                          <span>{isFa ? 'برگه مرجع:' : 'Sheet:'} {act.sourceSheet}</span>
                          <span>{isFa ? 'سطر اکسل:' : 'Row:'} {act.sourceRow}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Single Sheet Column Mapping fallback */}
          {fileData && !workbookResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-250 text-xs">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900">{fileData.fileName}</span>
                  <span className="text-slate-500 font-mono">({fileData.rows.length} {isFa ? 'سطر داده' : 'rows'})</span>
                </div>
                <button
                  onClick={() => {
                    setFileData(null);
                    setColumnMapping({});
                  }}
                  className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  {isFa ? 'انتخاب فایل دیگر' : 'Change File'}
                </button>
              </div>

              <div className="border border-slate-250 rounded-lg p-3 bg-white space-y-2 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                  <Table className="w-3.5 h-3.5 text-blue-600" />
                  {isFa ? 'تطبیق فیلدهای سامانه با ستون‌های فایل (Source Column → System Field)' : 'Map System Fields to File Headers'}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {systemFields.map(field => {
                    const currentMapped = columnMapping[field.key] || '';
                    const isMatched = Boolean(currentMapped);

                    return (
                      <div key={field.key} className="bg-slate-50 p-2 rounded border border-slate-200 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-800">
                            {isFa ? field.labelFa : field.labelEn}
                          </span>
                          {isMatched ? (
                            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                              <Check className="w-3 h-3" /> {isFa ? 'منطبق شد' : 'Mapped'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-medium">{isFa ? 'تطبیق‌نیافته' : 'Unmapped'}</span>
                          )}
                        </div>

                        <select
                          value={currentMapped}
                          onChange={(e) => handleMappingChange(field.key, e.target.value)}
                          className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 focus:outline-hidden focus:border-blue-600 font-mono"
                        >
                          <option value="">{isFa ? '-- انتخاب ستون متناظر در فایل --' : '-- Select File Column --'}</option>
                          {fileData.headers.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 border-t border-slate-200 flex items-center justify-between bg-slate-50/80">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
          >
            {isFa ? 'انصراف' : 'Cancel'}
          </button>

          {workbookResult && (
            <button
              onClick={handleConfirmWorkbookImport}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-1.5 rounded transition shadow-xs cursor-pointer"
            >
              <span>{isFa ? 'تأیید پیش‌نمایش و اعمال گزارش جامع' : 'Confirm & Apply Workbook Updates'}</span>
              <Check className="w-3.5 h-3.5" />
            </button>
          )}

          {fileData && !workbookResult && (
            <button
              onClick={handleConfirmSingleSheetImport}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded transition shadow-xs cursor-pointer"
            >
              <span>{isFa ? 'تأیید انطباق و ذخیره نسخه جدید' : 'Confirm & Apply Version Update'}</span>
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
