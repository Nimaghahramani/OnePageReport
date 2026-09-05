import React from 'react';
import { PublishedReportMetadata } from '../../types';
import {
  Shield,
  Send,
  Eye,
  EyeOff,
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AdminHeaderBarProps {
  publishedMeta: PublishedReportMetadata | null;
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  onOpenPublishModal: () => void;
  onLogout: () => void;
  lang: 'fa' | 'en';
}

export const AdminHeaderBar: React.FC<AdminHeaderBarProps> = ({
  publishedMeta,
  isPreviewMode,
  onTogglePreview,
  onOpenPublishModal,
  onLogout,
  lang,
}) => {
  const isFa = lang === 'fa';

  return (
    <aside
      aria-label={isFa ? 'نوار ابزار مدیریت گزارش' : 'Admin Header Bar'}
      className="bg-slate-900 border-b border-amber-500/30 text-white px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2.5 z-40 select-none shadow-md no-print"
    >
      {/* Left: Mode Badge & Published Status */}
      <div className="flex items-center flex-wrap gap-2.5">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>{isFa ? 'پنل مدیریت و ویرایش گزارش' : 'Admin Management Mode'}</span>
        </div>

        {publishedMeta ? (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300">
            <span className="text-slate-400">|</span>
            <span className="flex items-center gap-1 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>آخرین انتشار:</span>
              <strong className="text-white font-mono">{publishedMeta.reportDate}</strong>
              <span className="text-slate-400">(نسخه {publishedMeta.version})</span>
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
            <span className="text-slate-500">|</span>
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>گزارش رسمی هنوز در سرور منتشر نشده است (پیش‌نویس محلی)</span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Toggle Public Preview */}
        <button
          type="button"
          onClick={onTogglePreview}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
            isPreviewMode
              ? 'bg-blue-600 border-blue-400 text-white shadow-xs'
              : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-200'
          }`}
          title={isFa ? 'مشاهده داشبورد دقیقاً همان‌گونه که عموم می‌بینند' : 'Preview Public View'}
        >
          {isPreviewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{isPreviewMode ? (isFa ? 'خروج از پیش‌نمایش' : 'Exit Preview') : (isFa ? 'پیش‌نمایش عمومی' : 'Public Preview')}</span>
        </button>

        {/* Publish Official Report */}
        <button
          type="button"
          onClick={onOpenPublishModal}
          className="px-3.5 py-1.5 rounded-lg bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition cursor-pointer border border-emerald-400/40"
          title={isFa ? 'اعتبارسنجی و انتشار قطعی بر روی سرور برای همه کاربران' : 'Publish Report to Public'}
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isFa ? 'انتشار گزارش رسمی' : 'Publish Official Report'}</span>
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700 hover:border-rose-700/50 text-slate-400 transition cursor-pointer"
          title={isFa ? 'خروج از حساب مدیریت' : 'Logout'}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
