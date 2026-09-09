import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Language, ProjectMasterData, DailyReportRecord, CalculatedReportKPIs } from '../types';
import { LoicoLogo } from './LoicoLogo';
import {
  QrCode,
  X,
  Copy,
  Check,
  Share2,
  Download,
  Printer,
  Smartphone,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface ShareQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  master?: ProjectMasterData;
  daily?: DailyReportRecord;
  kpis?: CalculatedReportKPIs;
  lang?: Language;
  customUrl?: string;
}

export const ShareQrModal: React.FC<ShareQrModalProps> = ({
  isOpen,
  onClose,
  master,
  daily,
  kpis,
  lang = 'fa',
  customUrl
}) => {
  const isFa = lang === 'fa';
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [urlOption, setUrlOption] = useState<'current' | 'mobile'>('current');
  const printRef = useRef<HTMLDivElement>(null);

  // Compute shareable URL
  const getShareUrl = (): string => {
    if (customUrl) return customUrl;
    if (typeof window === 'undefined') return '';

    const origin = window.location.origin;
    // Always point to public view root without administrative edit fragments
    const basePath = window.location.pathname.startsWith('/admin') ? '/' : window.location.pathname;
    
    if (urlOption === 'mobile') {
      return `${origin}${basePath}?view=mobile`;
    }
    return `${origin}${basePath}`;
  };

  const shareUrl = getShareUrl();

  // Generate QR Code data URL whenever URL or option changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsGenerating(true);

    // High error-correction level 'H' (30% redundancy) for robust scanning on site/print
    QRCode.toDataURL(shareUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      width: 320,
      color: {
        dark: '#002b5b', // Deep LOICO navy for crisp contrast
        light: '#ffffff'
      }
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, shareUrl, urlOption]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Copy Link to clipboard
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Could not copy to clipboard:', err);
    }
  };

  // Web Share API (WhatsApp, Telegram, SMS, Email on mobile/desktop)
  const handleNativeShare = async () => {
    const title = master?.projectNameFa || 'گزارش روزانه پروژه تکمیل و تجهیز اسکله P1';
    const text = `گزارش مدیریتی روزانه پروژه تکمیل و تجهیز اسکله P1 بندر پتروشیمی ماهشهر - تاریخ: ${daily?.reportDate || 'روزانه'}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // High-Resolution Download with branding label
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;

    // Create a high-res canvas with border & caption for downloading
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const width = 640;
      const height = 760;
      canvas.width = width;
      canvas.height = height;

      if (!ctx) return;

      // Clean White Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Top Header Banner
      ctx.fillStyle = '#002b5b';
      ctx.fillRect(0, 0, width, 68);

      ctx.font = 'bold 22px Vazirmatn, Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('LOICO - گزارش مدیریتی پروژه اسکله P1', width / 2, 42);

      // Draw QR Code
      const qrSize = 480;
      ctx.drawImage(img, (width - qrSize) / 2, 90, qrSize, qrSize);

      // Sub-banner info
      ctx.font = 'bold 18px Vazirmatn, Arial, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      const dateText = daily?.reportDate ? `تاریخ گزارش: ${daily.reportDate} (شماره ${daily.reportNumber || '۱۰۸'})` : 'گزارش رسمی پروژه';
      ctx.fillText(dateText, width / 2, 600);

      ctx.font = '13.5px Vazirmatn, Arial, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(`کارفرما: ${master?.clientNameFa || 'شرکت ملی صنایع پتروشیمی'} | مدیریت طرح: ${master?.projectManagerFa || 'مهندسان مشاور ستیران'}`, width / 2, 626);
      ctx.fillText(`مشاور: ${master?.consultantNameFa || 'مهندسین مشاور تدبیر ساحل پارس'} | پیمانکار: ${master?.contractorNameFa || 'شرکت نواندیشان فراساحل لیان'}`, width / 2, 646);

      ctx.font = '13px Vazirmatn, Arial, sans-serif';
      ctx.fillStyle = '#0284c7';
      ctx.fillText('اسکن با دوربین تلفن همراه جهت مشاهده برخط گزارش', width / 2, 665);

      // Trigger download
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `LOICO_Report_QR_${daily?.reportDate ? daily.reportDate.replace(/\//g, '-') : 'P1'}.png`;
      link.href = pngUrl;
      link.click();
    };

    img.src = qrDataUrl;
  };

  // Direct Print of QR badge card
  const handlePrintBadge = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isFa ? 'rtl' : 'ltr'}" lang="${lang}">
        <head>
          <title>${isFa ? 'کد QR دسترسی به گزارش' : 'Report QR Access Code'}</title>
          <style>
            @page { size: A5 portrait; margin: 15mm; }
            body {
              font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
              text-align: center;
              margin: 0;
              padding: 20px;
              color: #0f172a;
              background: #fff;
            }
            .card {
              border: 2px solid #002b5b;
              border-radius: 16px;
              padding: 24px;
              max-width: 420px;
              margin: 0 auto;
              box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            }
            .title {
              font-size: 16pt;
              font-weight: bold;
              color: #002b5b;
              margin-bottom: 6px;
            }
            .subtitle {
              font-size: 10pt;
              color: #475569;
              margin-bottom: 18px;
            }
            .qr-img {
              width: 260px;
              height: 260px;
              display: block;
              margin: 0 auto 18px;
            }
            .meta {
              font-size: 9.5pt;
              color: #334155;
              border-top: 1px dashed #cbd5e1;
              padding-top: 12px;
              line-height: 1.6;
            }
            .instructions {
              font-size: 8.5pt;
              color: #0369a1;
              margin-top: 10px;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="title">${master?.projectNameFa || 'تکمیل و تجهیز اسکله P1 بندر پتروشیمی ماهشهر'}</div>
            <div class="subtitle">گزارش مدیریتی روزانه پروژه اسکله P1</div>
            <img class="qr-img" src="${qrDataUrl}" alt="Report QR Code" />
            <div class="meta">
              <div><strong>تاریخ گزارش:</strong> ${daily?.reportDate || '-'} | <strong>شماره:</strong> ${daily?.reportNumber || '۱۰۸'}</div>
              <div><strong>کارفرما:</strong> ${master?.clientNameFa || 'شرکت ملی صنایع پتروشیمی'} | <strong>مدیریت طرح:</strong> ${master?.projectManagerFa || 'مهندسان مشاور ستیران'}</div>
              <div><strong>مشاور:</strong> ${master?.consultantNameFa || 'مهندسین مشاور تدبیر ساحل پارس'} | <strong>پیمانکار:</strong> ${master?.contractorNameFa || 'شرکت نواندیشان فراساحل لیان'}</div>
            </div>
            <div class="instructions">
              با دوربین تلفن همراه این کد را اسکن نمایید تا آخرین نسخه گزارش باز شود.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      id="share-qr-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 select-none no-print"
      onClick={onClose}
    >
      <div
        id="share-qr-modal"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-900 select-text"
        dir={isFa ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with LOICO Brand Accent */}
        <div className="bg-linear-to-r from-[#002B5B] to-[#0A4A8F] text-white px-4 sm:px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <QrCode className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                {isFa ? 'اشتراک‌گذاری گزارش با کد QR' : 'Share Report via QR Code'}
              </h2>
              <p className="text-[10px] text-blue-100/90 font-medium">
                {isFa ? 'دسترسی سریع و بدون نیاز به نصب اپلیکیشن برای ذینفعان' : 'Instant mobile stakeholder access without app install'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex flex-col items-center">
          {/* Printable Container Target */}
          <div ref={printRef} className="w-full flex flex-col items-center">
            {/* Project Summary Badge */}
            <div className="w-full bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 mb-3.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <LoicoLogo size={26} id="qr-modal-loico-logo" />
                <div className="min-w-0">
                  <h3 className="text-[11.5px] font-bold text-slate-900 truncate">
                    {isFa ? master?.projectNameFa || 'تکمیل و تجهیز اسکله P1 بندر پتروشیمی ماهشهر' : master?.projectNameEn || 'Jetty P1 Project'}
                  </h3>
                  <div className="flex items-center gap-2 text-[9.5px] text-slate-500 mt-0.5">
                    <span>{isFa ? 'تاریخ گزارش:' : 'Date:'} <strong className="text-rose-700 font-mono font-bold">{daily?.reportDate || '۱۴۰۴/۰۶/۱۷'}</strong></span>
                    <span>|</span>
                    <span>{isFa ? 'شماره:' : 'No:'} <strong className="text-blue-900 font-mono font-bold">{daily?.reportNumber || '۱۰۸'}</strong></span>
                  </div>
                </div>
              </div>

              <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>{isFa ? 'نسخه رسمی' : 'Official'}</span>
              </span>
            </div>

            {/* QR Code Presentation Box */}
            <div className="relative p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-md flex flex-col items-center justify-center mb-3">
              {isGenerating ? (
                <div className="w-[220px] h-[220px] flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-medium">{isFa ? 'در حال ایجاد بارکد...' : 'Generating QR...'}</span>
                </div>
              ) : (
                <img
                  src={qrDataUrl}
                  alt="Shareable Report QR Code"
                  className="w-[220px] h-[220px] object-contain rounded-lg"
                />
              )}

              {/* Scan with phone badge */}
              <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-[#002B5B] bg-blue-50/90 border border-blue-200/80 px-2.5 py-1 rounded-full">
                <Smartphone className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span>{isFa ? 'اسکن با دوربین گوشی (iOS / Android)' : 'Scan with phone camera'}</span>
              </div>
            </div>
          </div>

          {/* URL & View Toggle (Options) */}
          <div className="w-full mb-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-[10.5px]">
              <span className="font-bold text-slate-700">{isFa ? 'پیوند مستقیم گزارش:' : 'Direct Report Link:'}</span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[9.5px]">
                <button
                  type="button"
                  onClick={() => setUrlOption('current')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    urlOption === 'current'
                      ? 'bg-white text-blue-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isFa ? 'استاندارد' : 'Standard'}
                </button>
                <button
                  type="button"
                  onClick={() => setUrlOption('mobile')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    urlOption === 'mobile'
                      ? 'bg-white text-blue-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isFa ? 'حالت موبایل' : 'Mobile Only'}
                </button>
              </div>
            </div>

            {/* Readonly Link Box with One-Click Copy */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-xl">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-[10.5px] font-mono text-slate-700 px-2 py-1 outline-hidden select-all direction-ltr text-left"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{isFa ? 'کپی شد' : 'Copied'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isFa ? 'کپی' : 'Copy'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons Grid: Download Image | Native Share | Print Badge */}
          <div className="w-full grid grid-cols-3 gap-2">
            {/* 1. Download PNG */}
            <button
              type="button"
              onClick={handleDownloadQr}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-slate-800 hover:text-blue-900 transition-all cursor-pointer min-h-[48px]"
              title={isFa ? 'دانلود تصویر با کیفیت برای اسناد و ایمیل' : 'Download high-res PNG'}
            >
              <Download className="w-4 h-4 text-blue-700 shrink-0" />
              <span className="text-[10px] font-bold leading-tight">{isFa ? 'دانلود عکس' : 'Download'}</span>
            </button>

            {/* 2. Direct Share (WhatsApp / Telegram / etc.) */}
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-linear-to-b from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white shadow-xs transition-all cursor-pointer min-h-[48px]"
              title={isFa ? 'ارسال سریع در پیام‌رسان‌ها' : 'Share via Messenger'}
            >
              <Share2 className="w-4 h-4 text-cyan-300 shrink-0" />
              <span className="text-[10px] font-bold leading-tight">{isFa ? 'اشتراک‌گذاری' : 'Share'}</span>
            </button>

            {/* 3. Print QR Card */}
            <button
              type="button"
              onClick={handlePrintBadge}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 transition-all cursor-pointer min-h-[48px]"
              title={isFa ? 'چاپ برگه کارت QR برای کارگاه و جلسات' : 'Print QR Card'}
            >
              <Printer className="w-4 h-4 text-slate-700 shrink-0" />
              <span className="text-[10px] font-bold leading-tight">{isFa ? 'چاپ کارت' : 'Print Card'}</span>
            </button>
          </div>

          {/* Quick External Link Preview */}
          <div className="mt-3 w-full flex items-center justify-center">
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] text-blue-700 hover:text-blue-900 font-medium hover:underline transition-colors"
            >
              <span>{isFa ? 'مشاهده پیش‌نمایش لینک در تب جدید' : 'Open report link in new tab'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
