import html2canvasPro from 'html2canvas-pro';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Ensures that the 'Noto Sans Arabic' font is loaded and registered in the document font set
 * before rendering high-fidelity canvas snapshots for PDF generation.
 */
export async function ensureNotoSansArabicFontLoaded(): Promise<boolean> {
  if (typeof document === 'undefined' || !document.fonts) {
    return true;
  }

  // 1. Wait for document font engine
  await document.fonts.ready;

  // 2. Diagnostic logging
  console.log('Document fonts status:', document.fonts.status);
  const isAvailable = document.fonts.check('12px "Noto Sans Arabic"');
  console.log('Noto Sans Arabic check (12px):', isAvailable);

  // 3. Check if Noto Sans Arabic is already verified
  if (isAvailable || document.fonts.check('bold 14px "Noto Sans Arabic"')) {
    return true;
  }

  // 4. Explicitly construct and add FontFace instances if not yet active
  try {
    const regularFont = new FontFace(
      'Noto Sans Arabic',
      'url(/fonts/NotoSansArabic-Regular.woff2) format("woff2")',
      { weight: '400', style: 'normal' }
    );
    const mediumFont = new FontFace(
      'Noto Sans Arabic',
      'url(/fonts/NotoSansArabic-Medium.woff2) format("woff2")',
      { weight: '500', style: 'normal' }
    );
    const semiBoldFont = new FontFace(
      'Noto Sans Arabic',
      'url(/fonts/NotoSansArabic-SemiBold.woff2) format("woff2")',
      { weight: '600', style: 'normal' }
    );
    const boldFont = new FontFace(
      'Noto Sans Arabic',
      'url(/fonts/NotoSansArabic-Bold.woff2) format("woff2")',
      { weight: '700', style: 'normal' }
    );

    const loadedFonts = await Promise.all([
      regularFont.load(),
      mediumFont.load(),
      semiBoldFont.load(),
      boldFont.load()
    ]);

    loadedFonts.forEach((f) => document.fonts.add(f));
    await document.fonts.ready;

    const checked = document.fonts.check('12px "Noto Sans Arabic"');
    console.log('Noto Sans Arabic verified after explicit load:', checked);
    return checked;
  } catch (err) {
    console.warn('FontFace explicit loading notice:', err);
    return document.fonts.check('12px "Noto Sans Arabic"');
  }
}

export async function exportExecutiveReportToPdf(
  elementId = 'print-report-sheet',
  fileName = 'Executive_Daily_Report.pdf'
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Locate the dedicated target report container element
    let element = document.getElementById(elementId);
    if (!element) {
      element = document.getElementById('print-report-root');
    }
    if (!element) {
      element = document.getElementById('executive-report-sheet');
    }
    if (!element) {
      throw new Error('گزارش جهت خروجی PDF یافت نشد (Report element not found).');
    }

    // 2. CRITICAL: Wait for font engine & verify Noto Sans Arabic before snapshotting
    await document.fonts.ready;
    const fontReady = await ensureNotoSansArabicFontLoaded();
    
    console.log('Pre-export document.fonts.status:', document.fonts.status);
    console.log('Pre-export Noto Sans Arabic check:', document.fonts.check('12px "Noto Sans Arabic"'));

    if (!fontReady && !document.fonts.check('12px "Noto Sans Arabic"')) {
      throw new Error('فونت گزارش هنوز بارگذاری نشده است (Noto Sans Arabic font not ready).');
    }

    // 3. Render DOM to image data URL with high resolution (scale: 3 / pixelRatio: 3)
    let imgDataUrl = '';
    let canvasWidth = 1140 * 3;
    let canvasHeight = 740 * 3;

    try {
      // html2canvas-pro natively supports oklch, oklab, color(display-p3), and modern Tailwind CSS
      const canvas = await html2canvasPro(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: element.scrollWidth || 1140,
        windowHeight: element.scrollHeight || 740,
        ignoreElements: (el) => el.classList?.contains('no-print')
      });
      imgDataUrl = canvas.toDataURL('image/png');
      canvasWidth = canvas.width;
      canvasHeight = canvas.height;
    } catch (renderError: any) {
      console.warn('html2canvas-pro capture fallback triggered:', renderError);
      // Fallback to htmlToImage if canvas renderer encounters an edge-case
      imgDataUrl = await htmlToImage.toPng(element, {
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        filter: (node: HTMLElement) => !node.classList?.contains('no-print'),
        width: element.offsetWidth || 1140,
        height: element.offsetHeight || 740
      });
      canvasWidth = (element.offsetWidth || 1140) * 3;
      canvasHeight = (element.offsetHeight || 740) * 3;
    }

    if (!imgDataUrl || imgDataUrl.length < 50) {
      throw new Error('امکان تبدیل ساختار صفحه به تصویر جهت صدور PDF میسر نشد.');
    }

    // 4. Create A4 Landscape jsPDF document
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // A4 Landscape is 297mm x 210mm
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 5;
    const printableWidth = pageWidth - margin * 2; // 287mm
    const printableHeight = pageHeight - margin * 2; // 200mm

    const aspectRatio = canvasWidth / (canvasHeight || 1);

    let targetWidth = printableWidth;
    let targetHeight = targetWidth / aspectRatio;

    if (targetHeight > printableHeight) {
      targetHeight = printableHeight;
      targetWidth = targetHeight * aspectRatio;
    }

    // Center horizontally and vertically within printable bounds
    const posX = margin + (printableWidth - targetWidth) / 2;
    const posY = margin + (printableHeight - targetHeight) / 2;

    pdf.addImage(imgDataUrl, 'PNG', posX, posY, targetWidth, targetHeight, undefined, 'FAST');
    pdf.save(fileName);

    return { success: true };
  } catch (err: any) {
    console.error('PDF export error:', err);
    return {
      success: false,
      error: err?.message || 'خطا در صدور فایل PDF رخ داد.'
    };
  }
}
