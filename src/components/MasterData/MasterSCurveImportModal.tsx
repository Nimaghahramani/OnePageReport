import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { MasterSCurvePoint, Language } from '../../types';
import { projectDataStore } from '../../services/dataStore';
import { parseMasterSCurveWorkbook, MasterSCurveParseResult } from '../../services/scurveEngine';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  TrendingUp,
  Calendar,
  Layers,
  Plus,
  Trash2,
  Table,
  Check,
  AlertTriangle
} from 'lucide-react';

interface MasterSCurveImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const MasterSCurveImportModal: React.FC<MasterSCurveImportModalProps> = ({
  isOpen,
  onClose,
  lang
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<MasterSCurveParseResult | null>(null);
  const [editedPoints, setEditedPoints] = useState<MasterSCurvePoint[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFa = lang === 'fa';

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      
      const res = parseMasterSCurveWorkbook(wb, selectedFile.name);
      
      if (!res.points || res.points.length === 0) {
        throw new Error('Master S-Curve parsing failed. No points extracted.');
      }

      setParseResult(res);
      setEditedPoints(res.points);
    } catch (err: any) {
      setErrorMsg(isFa ? `خطا در پردازش فایل Master S-Curve: ${err.message}` : `Master S-Curve parsing failed: ${err.message}`);
      setParseResult(null);
      setEditedPoints([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePointChange = (index: number, field: keyof MasterSCurvePoint, val: any) => {
    const next = [...editedPoints];
    next[index] = {
      ...next[index],
      [field]: field === 'planned' ? Number(val) : val
    };
    setEditedPoints(next);
  };

  const handleAddPoint = () => {
    const today = new Date().toISOString().split('T')[0];
    setEditedPoints(prev => [
      ...prev,
      { date: today, planned: prev.length > 0 ? prev[prev.length - 1].planned : 0 }
    ]);
  };

  const handleRemovePoint = (index: number) => {
    setEditedPoints(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmImport = () => {
    if (editedPoints.length === 0) {
      setErrorMsg(isFa ? 'Master S-Curve parsing failed. حداقل یک نقطه معتبر الزامی است.' : 'Master S-Curve parsing failed. At least one point is required.');
      return;
    }

    const sorted = [...editedPoints].sort((a, b) => a.date.localeCompare(b.date));
    const res = projectDataStore.applyMasterSCurveImport({
      points: sorted,
      initialActualPoints: parseResult?.initialActualPoints,
      fileName: file?.name || 'Scurve.xlsx'
    });

    // Verification check: points in store > 0
    const verified = projectDataStore.getMasterSCurve();
    if (!verified.points || verified.points.length === 0) {
      setErrorMsg(isFa ? 'خطا در ذخیره‌سازی داده‌های S-Curve در سیستم.' : 'Failed to persist Master S-Curve into data store.');
      return;
    }

    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setErrorMsg(res.message || 'Import failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 no-print">
      <div className="bg-white border border-slate-250 rounded-lg max-w-3xl w-full text-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="font-extrabold text-xs md:text-sm text-slate-900">
                {isFa ? 'ورود و ثبت منحنی S-Curve مصوب پروژه (Master S-Curve PLAN 18M)' : 'Import Master S-Curve Baseline (PLAN 18M)'}
              </h3>
              <p className="text-[10.5px] text-slate-500">
                {isFa
                  ? 'شناسایی خودکار برگه S-Curve و استخراج برنامه مصوب Overall / PLAN (18M) / CUM'
                  : 'Automatic S-Curve worksheet detection & Overall / PLAN (18M) / CUM extraction'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {!editedPoints.length && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 rounded-lg p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {isFa ? 'فایل Scurve.xlsx را انتخاب یا رها کنید' : 'Select or drop Scurve.xlsx file'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  {isFa
                    ? 'برگه هدف: S-Curve | برنامه مرجع: Overall -> PLAN (18M) -> CUM'
                    : 'Target Sheet: S-Curve | Plan: Overall -> PLAN (18M) -> CUM'}
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
            <div className="p-4 text-center text-xs text-slate-600 font-medium flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>{isFa ? 'در حال خواندن و استخراج نقاط PLAN (18M) CUM...' : 'Extracting PLAN (18M) CUM curve points...'}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 rounded text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* MANDATORY IMPORT PREVIEW SECTION */}
          {parseResult && editedPoints.length > 0 && (
            <div className="space-y-3">
              {/* Top Detection Metadata */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-950 border-b border-blue-200/80 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-blue-700" />
                    {isFa ? 'مشخصات استخراج Master S-Curve (Import Preview)' : 'Master S-Curve Import Preview'}
                  </span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold hover:underline cursor-pointer"
                  >
                    {isFa ? 'تغییر فایل' : 'Change File'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-white/80 p-2 rounded border border-blue-100">
                    <div className="text-[10px] text-slate-500 font-medium">{isFa ? 'فایل مبدأ (Source):' : 'Source File:'}</div>
                    <div className="font-bold text-slate-900 truncate font-mono mt-0.5">{parseResult.sourceFile}</div>
                  </div>
                  <div className="bg-white/80 p-2 rounded border border-blue-100">
                    <div className="text-[10px] text-slate-500 font-medium">{isFa ? 'برگه شناسایی‌شده (Sheet):' : 'Detected Sheet:'}</div>
                    <div className="font-bold text-blue-900 font-mono mt-0.5">{parseResult.sheetName}</div>
                  </div>
                  <div className="bg-white/80 p-2 rounded border border-blue-100 col-span-2">
                    <div className="text-[10px] text-slate-500 font-medium">{isFa ? 'برنامه مبنا (Approved Plan):' : 'Detected Plan:'}</div>
                    <div className="font-bold text-emerald-800 font-mono mt-0.5">{parseResult.planName}</div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-500">{isFa ? 'تعداد نقاط برنامه‌ای:' : 'Planned Points:'}</div>
                    <div className="text-sm font-black font-mono text-slate-900 mt-0.5">{editedPoints.length} {isFa ? 'نقطه' : 'pts'}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-500">{isFa ? 'اولین تاریخ و پیشرفت:' : 'First Date & Plan:'}</div>
                    <div className="text-[11.5px] font-bold font-mono text-slate-800 mt-0.5 truncate">
                      {editedPoints[0]?.date} ({editedPoints[0]?.planned}%)
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-500">{isFa ? 'آخرین تاریخ برنامه:' : 'Last Date:'}</div>
                    <div className="text-[11.5px] font-bold font-mono text-slate-800 mt-0.5 truncate">
                      {editedPoints[editedPoints.length - 1]?.date}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded border border-emerald-300 bg-emerald-50/40">
                    <div className="text-[10px] text-emerald-800 font-medium">{isFa ? 'پیشرفت نهایی برنامه:' : 'Final Planned:'}</div>
                    <div className="text-sm font-black font-mono text-emerald-950 mt-0.5">
                      {editedPoints[editedPoints.length - 1]?.planned}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Last 5 Points Preview Box */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>{isFa ? 'پیش‌نمایش ۵ نقطه پایانی منحنی پیشرفت (Last 5 Extracted Points):' : 'Last 5 Extracted Points Preview:'}</span>
                  <span className="text-[10px] text-slate-500 font-mono font-normal">PLAN (18M) CUM</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 font-mono text-xs text-center">
                  {editedPoints.slice(-5).map((pt, i) => (
                    <div key={i} className="bg-white p-1.5 rounded border border-slate-200 text-[10.5px]">
                      <div className="text-slate-500 text-[9.5px] truncate">{pt.date}</div>
                      <div className="font-bold text-blue-900 mt-0.5">{pt.planned}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editable Full Table */}
              <div className="border border-slate-250 rounded-lg overflow-hidden bg-white">
                <div className="px-3 py-2 bg-slate-100/90 border-b border-slate-250 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    {isFa ? 'جدول کامل نقاط برنامه‌ای مصوب' : 'Full Approved Master Planned Points Table'}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPoint}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold rounded border border-blue-300 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    {isFa ? 'افزودن نقطه' : 'Add Point'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs text-right divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-[11px] text-slate-600 font-bold sticky top-0">
                      <tr>
                        <th className="px-3 py-1.5 w-12 text-center">#</th>
                        <th className="px-3 py-1.5">{isFa ? 'تاریخ کات‌آف (Date)' : 'Cut-off Date'}</th>
                        <th className="px-3 py-1.5">{isFa ? 'پیشرفت برنامه‌ای مصوب (PLAN 18M %)' : 'Planned Progress %'}</th>
                        <th className="px-3 py-1.5 w-16 text-center">{isFa ? 'حذف' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {editedPoints.map((pt, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="px-3 py-1 text-center text-slate-400 font-sans text-[11px]">{idx + 1}</td>
                          <td className="px-3 py-1">
                            <input
                              type="text"
                              value={pt.date}
                              onChange={e => handlePointChange(idx, 'date', e.target.value)}
                              className="w-full px-2 py-0.5 border border-slate-250 rounded text-xs text-slate-800 font-mono"
                              placeholder="YYYY-MM-DD"
                            />
                          </td>
                          <td className="px-3 py-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={pt.planned}
                                onChange={e => handlePointChange(idx, 'planned', e.target.value)}
                                className="w-24 px-2 py-0.5 border border-slate-250 rounded text-xs text-slate-800 font-mono font-bold"
                              />
                              <span className="text-slate-500 font-sans">%</span>
                            </div>
                          </td>
                          <td className="px-3 py-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePoint(idx)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded border border-slate-300 hover:bg-slate-100 transition cursor-pointer"
          >
            {isFa ? 'انصراف' : 'Cancel'}
          </button>

          {editedPoints.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isFa ? 'تایید و ثبت منحنی S-Curve مصوب پروژه' : 'Confirm & Save Master S-Curve'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
