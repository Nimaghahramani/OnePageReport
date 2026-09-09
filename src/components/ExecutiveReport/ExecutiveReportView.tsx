import React from 'react';
import {
  ProjectMasterData,
  PmsRecord,
  DailyReportRecord,
  IpcRecord,
  EquipmentRecord,
  CalculatedReportKPIs,
  Language,
  MasterSCurveRecord
} from '../../types';
import { ReportHeader } from './ReportHeader';
import { KpiCardsGrid } from './KpiCardsGrid';
import { ExecutiveSummaryCard } from './ExecutiveSummaryCard';
import { ProgressChartSection } from './ProgressChartSection';
import { EquipmentSection } from './EquipmentSection';
import { IpcSection } from './IpcSection';
import { IssuesAndActionsSection } from './IssuesAndActionsSection';
import { ReportFooter } from './ReportFooter';

interface ExecutiveReportViewProps {
  sheetId?: string;
  master: ProjectMasterData;
  pms: PmsRecord;
  daily: DailyReportRecord;
  ipc: IpcRecord;
  equipment: EquipmentRecord;
  kpis: CalculatedReportKPIs;
  masterSCurve?: MasterSCurveRecord;
  lang: Language;
}

export const ExecutiveReportView: React.FC<ExecutiveReportViewProps> = ({
  sheetId = 'executive-report-sheet',
  master,
  pms,
  daily,
  ipc,
  equipment,
  kpis,
  masterSCurve,
  lang
}) => {
  return (
    <div id="executive-report" className="w-full flex justify-center py-2 px-1 print:p-0 print:m-0 print:w-full print:block">
      {/* 
        High-Fidelity Executive Sheet Container:
        Designed at standard density (1140px / 282mm x 195mm).
        In A3 Landscape printing, the parent wrapper scales it geometrically by 1.414 (√2)
        to perfectly occupy the 400mm x 277mm physical printable area without distortion.
      */}
      <div
        id={sheetId}
        className="print-canvas print:break-inside-avoid print:w-full print:flex print:flex-col print:justify-between w-full max-w-[1140px] bg-white text-slate-900 rounded-lg shadow-sm border border-slate-250 p-3 md:p-3.5 flex flex-col justify-between select-text"
        style={{
          minHeight: '740px'
        }}
      >
        {/* Section 1: Header with Client, Contractor, Consultant (Scetiran), Logos and Contract Data */}
        <div className="print:break-inside-avoid">
          <ReportHeader master={master} pms={pms} daily={daily} kpis={kpis} lang={lang} />
        </div>

        {/* Section 2: Top KPI Cards */}
        <div className="print:break-inside-avoid">
          <KpiCardsGrid kpis={kpis} lang={lang} />
        </div>

        {/* Section 3: Executive Summary (3-5 Lines) */}
        <div className="print:break-inside-avoid">
          <ExecutiveSummaryCard kpis={kpis} lang={lang} />
        </div>

        {/* Section 4: Middle Row (PMS Progress Chart & Equipment Installation) */}
        <div className="grid grid-cols-12 gap-2 mb-2 print:break-inside-avoid print:grid print:grid-cols-12">
          <div className="col-span-7 print:break-inside-avoid">
            <ProgressChartSection pms={pms} masterSCurve={masterSCurve} lang={lang} />
          </div>
          <div className="col-span-5 print:break-inside-avoid">
            <EquipmentSection equipment={equipment} lang={lang} />
          </div>
        </div>

        {/* Section 5: Bottom Row (Financial/IPC & Key Issues & Next Actions) */}
        <div className="grid grid-cols-12 gap-2 flex-1 print:break-inside-avoid print:grid print:grid-cols-12">
          <div className="col-span-5 print:break-inside-avoid">
            <IpcSection ipc={ipc} daily={daily} lang={lang} />
          </div>
          <div className="col-span-7 print:break-inside-avoid">
            <IssuesAndActionsSection daily={daily} lang={lang} />
          </div>
        </div>

        {/* Section 6: Footer with Signatures & Source Traceability */}
        <div className="print:break-inside-avoid">
          <ReportFooter pms={pms} daily={daily} ipc={ipc} equipment={equipment} lang={lang} />
        </div>
      </div>
    </div>
  );
};
