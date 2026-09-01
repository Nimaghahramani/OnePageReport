import React, { useState } from 'react';
import {
  ProjectMasterData,
  PmsRecord,
  DailyReportRecord,
  IpcRecord,
  EquipmentRecord,
  CalculatedReportKPIs,
  Language,
  MasterSCurveRecord
} from '../types';
import { ExecutiveReportView } from './ExecutiveReport/ExecutiveReportView';
import { exportExecutiveReportToPdf } from '../services/pdfExportService';
import { Printer, X, ZoomIn, ZoomOut, Maximize2, Download, CheckCircle2, Loader2 } from 'lucide-react';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  master: ProjectMasterData;
  pms: PmsRecord;
  daily: DailyReportRecord;
  ipc: IpcRecord;
  equipment: EquipmentRecord;
  kpis: CalculatedReportKPIs;
  masterSCurve?: MasterSCurveRecord;
  lang: Language;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  master,
  pms,
  daily,
  ipc,
  equipment,
  kpis,
  masterSCurve,
  lang
}) => {
  const [scale, setScale] = useState<number>(0.88);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const isFa = lang === 'fa';

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDirectPdfDownload = async () => {
    setIsExportingPdf(true);
    try {
      const fileName = `Executive_Daily_Report_${pms.dataDate || 'Current'}.pdf`;
      const res = await exportExecutiveReportToPdf('print-report-sheet', fileName);
      if (res.success) {
        setPdfSuccess(true);
        setTimeout(() => setPdfSuccess(false), 3000);
      } else {
        alert(isFa ? `خطا در ایجاد PDF: ${res.error}` : `PDF Export Failed: ${res.error}`);
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/70 backdrop-blur-xs overflow-hidden print-preview-ui">
      {/* Top Toolbar (Hidden on print) */}
      <div className="bg-white border-b border-slate-250 px-4 py-2.5 flex items-center justify-between text-slate-800 shrink-0 shadow-2xs no-print">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Printer className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs text-slate-900">
              {isFa ? 'پیش‌نمایش چاپ استاندارد A4 افقی (Landscape)' : 'A4 Landscape Print Preview'}
            </h3>
          </div>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">
            297mm × 210mm (Exact 1-Page Constraint)
          </span>
        </div>

        {/* Zoom & Action Controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 rounded border border-slate-250 p-0.5 text-xs">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-slate-700 font-bold text-xs">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(s => Math.min(1.4, s + 0.1))}
              className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setScale(0.88)}
              className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 border-l border-slate-250 ml-1 pl-1.5 transition-colors cursor-pointer"
              title="Fit Screen"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {/* Direct PDF Download Button */}
          <button
            onClick={handleDirectPdfDownload}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-1.5 rounded transition shadow-2xs cursor-pointer"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : pdfSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>
              {isExportingPdf
                ? (isFa ? 'در حال تولید PDF...' : 'Generating PDF...')
                : pdfSuccess
                ? (isFa ? 'دانلود شد!' : 'Downloaded!')
                : (isFa ? 'دانلود مستقیم PDF' : 'Download PDF')}
            </span>
          </button>

          {/* System Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded transition shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isFa ? 'ارسال به چاپ مرورگر (Print)' : 'Browser Print'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Stage Container */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900/30">
        <div
          data-theme="light"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease'
          }}
          className="shadow-2xl rounded"
        >
          <ExecutiveReportView
            master={master}
            pms={pms}
            daily={daily}
            ipc={ipc}
            equipment={equipment}
            kpis={kpis}
            masterSCurve={masterSCurve}
            lang={lang}
          />
        </div>
      </div>
    </div>
  );
};
