import React, { useState } from 'react';
import { PublishedReport, Language } from '../../types';
import { Send, AlertTriangle, CheckCircle, X, ShieldAlert, ArrowLeft } from 'lucide-react';

interface PublishConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPublish: (publishedBy: string, notes: string) => Promise<void>;
  draftReport: PublishedReport;
  hasBlockingErrors: boolean;
  blockingErrorsCount: number;
  warningsCount: number;
  lang: Language;
}

export const PublishConfirmModal: React.FC<PublishConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmPublish,
  draftReport,
  hasBlockingErrors,
  blockingErrorsCount,
  warningsCount,
  lang
}) => {
  const [publishedBy, setPublishedBy] = useState(draftReport.publishedBy || 'مدیر برنامه‌ریزی و کنترل پروژه');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isFa = lang === 'fa';
  const kpis = draftReport.kpis;

  const handlePublish = async () => {
    if (hasBlockingErrors) return;
    setIsSubmitting(true);
    try {
      await onConfirmPublish(publishedBy, notes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150" dir={isFa ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-4.5 flex items-center justify-between border-b border-blue-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/30 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {isFa ? 'تأیید نهایی و انتشار رسمی گزارش' : 'Confirm & Publish Official Report'}
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">
                {isFa ? `پروژه: ${draftReport.project?.projectNameFa || 'اسکله P1 ماهشهر'}` : 'LOICO Executive Project Reporting'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Warning Banner Required by Prompt */}
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-extrabold block text-amber-950">
                {isFa ? 'توجه مهم قبل از انتشار:' : 'Important Notice:'}
              </span>
              <p className="mt-0.5 font-medium leading-relaxed">
                {isFa
                  ? 'پس از انتشار، این نسخه برای بازدیدکنندگان عمومی قابل مشاهده خواهد بود و داده‌های این گزارش به‌عنوان مرجع رسمی سامانه ثبت می‌گردد.'
                  : 'Upon publishing, this snapshot becomes immediately visible to all public visitors as the official executive dataset.'}
              </p>
            </div>
          </div>

          {/* Validation Status Notice */}
          {hasBlockingErrors ? (
            <div className="bg-rose-50 border border-rose-300 rounded-lg p-3 text-rose-900 flex items-start gap-2 text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  {isFa ? `خطای بحرانی اعتبارسنجی (${blockingErrorsCount} مورد)` : `Critical validation errors (${blockingErrorsCount})`}
                </span>
                <span className="text-[11px]">
                  {isFa ? 'انتشار گزارش تا رفع خطاهای بحرانی مسدود است.' : 'Publication is blocked until critical errors are resolved.'}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-2.5 text-emerald-900 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">
                  {isFa ? 'اعتبارسنجی داده‌ها موفقیت‌آمیز است.' : 'Data validation passed.'}
                </span>
              </div>
              {warningsCount > 0 && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                  {isFa ? `${warningsCount} هشدار غیربحرانی` : `${warningsCount} warnings`}
                </span>
              )}
            </div>
          )}

          {/* KPI Summary Grid Required by Prompt */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
            <h4 className="text-xs font-black text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>{isFa ? 'خلاصه شاخص‌های گزارش آماده انتشار:' : 'Summary of KPIs to be Published:'}</span>
              <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                {draftReport.reportDate}
              </span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-sans">{isFa ? 'پیشرفت برنامه‌ای' : 'Planned Progress'}</span>
                <span className="font-bold text-slate-900">{kpis?.plannedProgress ?? draftReport.pms?.plannedProgress}%</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-sans">{isFa ? 'پیشرفت واقعی' : 'Actual Progress'}</span>
                <span className="font-bold text-blue-900">{kpis?.actualProgress ?? draftReport.pms?.actualProgress}%</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-sans">{isFa ? 'انحراف پیشرفت' : 'Variance'}</span>
                <span className="font-bold text-rose-700">{kpis?.progressVariance ?? draftReport.pms?.progressVariance}%</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-sans">{isFa ? 'زمان سپری‌شده' : 'Elapsed Time'}</span>
                <span className="font-bold text-slate-900">{kpis?.timeElapsedPercentage?.toFixed(1) ?? '31.3'}%</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-sans">{isFa ? 'نصب تجهیزات' : 'Equipment'}</span>
                <span className="font-bold text-teal-800">{kpis?.equipmentInstallationPercentage ?? draftReport.equipment?.installationPercentage}%</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-sans">{isFa ? 'پیشرفت مالی' : 'Financial Progress'}</span>
                <span className="font-bold text-amber-800">{kpis?.financialProgress ?? draftReport.financial?.financialSummary?.financialProgress}%</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-sans">{isFa ? 'تعداد موانع' : 'Key Issues'}</span>
                <span className="font-bold text-slate-900">{draftReport.issues?.length ?? 0} مورد</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-sans">{isFa ? 'فعالیت‌های مهم' : 'Activities'}</span>
                <span className="font-bold text-slate-900">{draftReport.activities?.length ?? 0} مورد</span>
              </div>
            </div>
          </div>

          {/* Publisher & Notes Fields */}
          <div className="grid grid-cols-1 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                {isFa ? 'نام و سمت منتشرکننده (Published By):' : 'Publisher / Position:'}
              </label>
              <input
                type="text"
                value={publishedBy}
                onChange={(e) => setPublishedBy(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                {isFa ? 'یادداشت یا توضیحات نسخه (اختیاری):' : 'Release Notes (Optional):'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={isFa ? 'مثال: گزارش رسمی روزانه منتهی به ۸ شهریور ۱۴۰۵...' : 'Optional publication notes...'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            {isFa ? 'انصراف' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isSubmitting || hasBlockingErrors}
            className="px-6 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? (isFa ? 'در حال انتشار رسمی...' : 'Publishing...') : (isFa ? 'انتشار گزارش' : 'Publish Report')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
