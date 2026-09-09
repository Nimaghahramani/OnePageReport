import React, { useState, useEffect } from 'react';
import { PublishedReportMetadata } from '../../types';
import {
  Shield,
  Send,
  Eye,
  EyeOff,
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Printer,
  Cloud,
  RefreshCw
} from 'lucide-react';

interface AdminHeaderBarProps {
  publishedMeta: PublishedReportMetadata | null;
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  onOpenPublishModal: () => void;
  onLogout: () => void;
  lang: 'fa' | 'en';
  onOpenQrModal?: () => void;
  onOpenPrintPreview?: () => void;
  lastCloudSync?: Date | null;
  isCloudFetching?: boolean;
  onRefreshCloud?: () => void;
}

function formatTimeString(date: Date, isFa: boolean) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  const time = `${h}:${m}:${s}`;

  let fullDate = '';
  try {
    fullDate = date.toLocaleString(isFa ? 'fa-IR' : 'en-US', {
      hour12: false,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    fullDate = `${date.toLocaleDateString()} ${time}`;
  }

  return { time, fullDate };
}

function getRelativeTimeLabel(date: Date, isFa: boolean): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 45) {
    return isFa ? 'همین الان' : 'Just now';
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return isFa ? `${diffMin} دقیقه پیش` : `${diffMin}m ago`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return isFa ? `${diffHours} ساعت پیش` : `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return isFa ? `${diffDays} روز پیش` : `${diffDays}d ago`;
}

export const AdminHeaderBar: React.FC<AdminHeaderBarProps> = ({
  publishedMeta,
  isPreviewMode,
  onTogglePreview,
  onOpenPublishModal,
  onLogout,
  lang,
  onOpenQrModal,
  onOpenPrintPreview,
  lastCloudSync,
  isCloudFetching = false,
  onRefreshCloud,
}) => {
  const isFa = lang === 'fa';
  const [relativeTime, setRelativeTime] = useState<string>('');

  useEffect(() => {
    if (!lastCloudSync) return;

    const update = () => {
      setRelativeTime(getRelativeTimeLabel(lastCloudSync, isFa));
    };

    update();
    const interval = setInterval(update, 15000);
    return () => clearInterval(interval);
  }, [lastCloudSync, isFa]);

  return (
    <aside
      id="app-header"
      aria-label={isFa ? 'نوار ابزار مدیریت گزارش' : 'Admin Header Bar'}
      className="admin-header-bar bg-slate-900 border-b border-amber-500/30 text-white px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2.5 z-40 select-none shadow-md no-print"
    >
      {/* Left: Mode Badge & Status Cluster (Published + Cloud Fetch) */}
      <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>{isFa ? 'پنل مدیریت و ویرایش گزارش' : 'Admin Management Mode'}</span>
        </div>

        {publishedMeta ? (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300">
            <span className="text-slate-500">|</span>
            <span className="flex items-center gap-1 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isFa ? 'آخرین انتشار:' : 'Published:'}</span>
              <strong className="text-white font-mono">{publishedMeta.reportDate}</strong>
              <span className="text-slate-400 font-mono text-[11px]">({isFa ? `نسخه ${publishedMeta.version}` : `v${publishedMeta.version}`})</span>
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
            <span className="text-slate-500">|</span>
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{isFa ? 'پیش‌نویس محلی (هنوز منتشر نشده)' : 'Local draft (unreleased)'}</span>
          </div>
        )}

        {/* Cloud Sync / Last Updated Timestamp */}
        {lastCloudSync ? (
          <div className="flex items-center gap-2">
            <span className="text-slate-600 hidden md:inline">|</span>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 transition-colors shadow-2xs group"
              title={
                isFa
                  ? `آخرین زمان دریافت موفق اطلاعات پروژه از سرور ابری:\n${formatTimeString(lastCloudSync, isFa).fullDate}`
                  : `Latest project data fetched from cloud:\n${formatTimeString(lastCloudSync, isFa).fullDate}`
              }
            >
              <div className="flex items-center gap-1 text-sky-400">
                <Cloud className="w-3.5 h-3.5 text-sky-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <span className="text-slate-400 font-medium hidden sm:inline">
                {isFa ? 'آخرین بروزرسانی ابری:' : 'Last updated:'}
              </span>
              <span className="text-slate-400 font-medium sm:hidden">
                {isFa ? 'ابر:' : 'Sync:'}
              </span>

              <span className="font-mono text-white font-bold tracking-tight">
                {formatTimeString(lastCloudSync, isFa).time}
              </span>

              {relativeTime && (
                <span className="text-[11px] text-slate-400 font-normal hidden lg:inline">
                  ({relativeTime})
                </span>
              )}

              {onRefreshCloud && (
                <button
                  type="button"
                  onClick={onRefreshCloud}
                  disabled={isCloudFetching}
                  className="p-1 -my-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-sky-300 transition cursor-pointer disabled:opacity-40"
                  title={isFa ? 'دریافت مجدد آخرین داده‌ها از سرور ابری' : 'Fetch latest data from cloud'}
                  aria-label={isFa ? 'دریافت مجدد داده‌ها از سرور ابری' : 'Refresh cloud data'}
                >
                  <RefreshCw className={`w-3 h-3 ${isCloudFetching ? 'animate-spin text-sky-400' : ''}`} />
                </button>
              )}
            </div>
          </div>
        ) : isCloudFetching ? (
          <div className="flex items-center gap-2">
            <span className="text-slate-600 hidden md:inline">|</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-sky-300 shadow-2xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
              <span className="text-slate-300 font-medium">
                {isFa ? 'در حال دریافت اطلاعات از سرور ابری...' : 'Fetching from cloud...'}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Share QR Code Button */}
        {onOpenQrModal && (
          <button
            type="button"
            onClick={onOpenQrModal}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-cyan-100 shadow-2xs"
            title={isFa ? 'تولید بارکد QR جهت اشتراک‌گذاری سریع روی موبایل' : 'Generate Shareable QR Code for Mobile'}
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isFa ? 'کد QR' : 'QR Code'}</span>
          </button>
        )}

        {/* Print Preview Button */}
        {onOpenPrintPreview && (
          <button
            type="button"
            onClick={onOpenPrintPreview}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer bg-slate-800 hover:bg-blue-900/60 border border-slate-700 hover:border-blue-400/50 text-slate-200 hover:text-cyan-200 shadow-2xs"
            title={isFa ? 'پیش‌نمایش چاپ دقیق کاغذ A4 افقی بدون المان‌های رابط کاربری' : 'A4 Landscape Print Preview'}
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isFa ? 'پیش‌نمایش چاپ' : 'Print Preview'}</span>
          </button>
        )}

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
