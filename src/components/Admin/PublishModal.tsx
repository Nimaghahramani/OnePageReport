import React, { useState } from 'react';
import { PublishedReport, ValidationIssue } from '../../types';
import { apiClient } from '../../services/apiClient';
import { projectDataStore } from '../../services/dataStore';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Loader2,
  Calendar,
  FileCheck,
  ShieldAlert,
  ExternalLink
} from 'lucide-react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublished: (report: PublishedReport) => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  onPublished,
}) => {
  const [publisherName, setPublisherName] = useState('مدیر ارشد پروژه');
  const [releaseNotes, setReleaseNotes] = useState('نسخه تایید شده گزارش روزانه مدیریتی');
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<PublishedReport | null>(null);

  if (!isOpen) return null;

  const currentDaily = projectDataStore.getDaily();
  const currentPms = projectDataStore.getPms();
  const kpis = projectDataStore.getCalculatedKPIs();
  const issues = projectDataStore.getValidationIssues();
  const errors = issues.filter((i) => i.type === 'error');
  const warnings = issues.filter((i) => i.type === 'warning');

  // Manpower checks
  const directPresent = kpis.siteManpower?.direct?.present || 0;
  const directAbsent = kpis.siteManpower?.direct?.absent || 0;
  const directTotal = kpis.siteManpower?.direct?.total || 0;
  const isDirectBalanced = directTotal === directPresent + directAbsent;

  const indirectPresent = kpis.siteManpower?.indirect?.present || 0;
  const indirectAbsent = kpis.siteManpower?.indirect?.absent || 0;
  const indirectTotal = kpis.siteManpower?.indirect?.total || 0;
  const isIndirectBalanced = indirectTotal === indirectPresent + indirectAbsent;

  const reportDate = currentDaily?.reportDate || currentPms?.dataDate || '1405/06/14';

  const handlePublish = async () => {
    setErrorMsg(null);
    setIsPublishing(true);

    try {
      // 1. Build payload from current dataStore draft
      const draftPayload = projectDataStore.exportDraftAsPublishedPayload();
      draftPayload.publishedBy = publisherName.trim() || 'مدیر ارشد پروژه';
      draftPayload.metadata = {
        ...draftPayload.metadata,
        notes: releaseNotes.trim()
      };

      // 2. Publish to backend
      const result = await apiClient.publishReport(draftPayload);
      if (result.success && result.report) {
        setPublishSuccess(result.report);
        projectDataStore.hydratePublishedReport(result.report);
        onPublished(result.report);
      } else {
        setErrorMsg('پاسخ معتبر از سرور دریافت نشد.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'خطا در انتشار گزارش بر روی سرور مرکزی.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in select-none">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-linear-to-b from-blue-950/70 to-transparent border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">انتشار رسمی گزارش در سامانه مرکزی</h2>
              <p className="text-xs text-slate-400">
                Centralized Publish to Public Executive Dashboard
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {publishSuccess ? (
            <div className="p-5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-center space-y-3 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-emerald-300">
                گزارش با موفقیت در بستر مرکزی منتشر شد
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                نسخه {publishSuccess.version} مورخ {publishSuccess.reportDate} ثبت گردید و هم‌اکنون برای کلیه کاربران عمومی و ذینفعان در سراسر دستگاه‌ها قابل مشاهده است.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>مشاهده داشبورد عمومی</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  بستن پنجره
                </button>
              </div>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 bg-rose-950/60 border border-rose-600/50 rounded-xl flex items-center gap-2.5 text-rose-300 text-xs animate-in fade-in">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Pre-Publish Checklist */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5">
                <span className="text-xs font-bold text-slate-300 block">
                  چک‌لیست اعتبارسنجی پیش از انتشار (Pre-Publish Audit)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px]">
                  {/* Manpower Direct */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">تطابق کل نیروی مستقیم:</span>
                    <span className={`font-mono font-bold flex items-center gap-1 ${isDirectBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isDirectBalanced ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {directTotal} = {directPresent} + {directAbsent}
                    </span>
                  </div>

                  {/* Manpower Indirect */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">تطابق کل نیروی غیرمستقیم:</span>
                    <span className={`font-mono font-bold flex items-center gap-1 ${isIndirectBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isIndirectBalanced ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {indirectTotal} = {indirectPresent} + {indirectAbsent}
                    </span>
                  </div>

                  {/* Actual Progress */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">پیشرفت واقعی کل پروژه:</span>
                    <span className="font-mono font-bold text-cyan-400">
                      %{kpis.actualProgress?.toFixed(2) || '0.00'}
                    </span>
                  </div>

                  {/* Program Progress */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">پیشرفت برنامه‌ای مصوب:</span>
                    <span className="font-mono font-bold text-slate-300">
                      %{kpis.plannedProgress?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>

                {/* Validation status summary */}
                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">وضعیت خطاهای اعتبارسنجی:</span>
                  {errors.length > 0 ? (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {errors.length} خطای سیستمی شناسایی شد
                    </span>
                  ) : warnings.length > 0 ? (
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      بدون خطای بحرانی ({warnings.length} هشدار جزیی)
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      کلیه داده‌ها تایید شده و آماده انتشار
                    </span>
                  )}
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    تاریخ رسمی گزارش:
                  </label>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="font-mono font-bold">{reportDate}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    نام و عنوان منتشرکننده:
                  </label>
                  <input
                    type="text"
                    value={publisherName}
                    onChange={(e) => setPublisherName(e.target.value)}
                    placeholder="مثال: مدیر ارشد کنترل پروژه"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl p-2 text-white placeholder-slate-500 outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    توضیحات و یادداشت انتشار:
                  </label>
                  <textarea
                    rows={2}
                    value={releaseNotes}
                    onChange={(e) => setReleaseNotes(e.target.value)}
                    placeholder="توضیحات مربوط به این ویرایش..."
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl p-2 text-white placeholder-slate-500 outline-hidden transition resize-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!publishSuccess && (
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPublishing}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              انصراف
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing || errors.length > 0}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-900/30 flex items-center gap-2 cursor-pointer"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال ذخیره و انتشار...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>تایید و انتشار قطعی گزارش عمومی</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
