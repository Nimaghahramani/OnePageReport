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
    <div className="w-full flex justify-center py-2 px-1">
      {/* 
        A4 Landscape Sheet Container 
        Standard A4 Landscape: 297mm x 210mm (~ 1122px x 794px at 96 DPI)
      */}
      <div
        id={sheetId}
        className="print-canvas w-full max-w-[1140px] bg-white text-slate-900 rounded-lg shadow-sm border border-slate-250 p-3 md:p-3.5 flex flex-col justify-between select-text"
        style={{
          minHeight: '740px'
        }}
      >
        {/* Section 1: Header */}
        <ReportHeader master={master} pms={pms} daily={daily} kpis={kpis} lang={lang} />

        {/* Section 2: Top KPI Cards */}
        <KpiCardsGrid kpis={kpis} lang={lang} />

        {/* Section 3: Executive Summary (3-5 Lines) */}
        <ExecutiveSummaryCard kpis={kpis} lang={lang} />

        {/* Section 4: Middle Row (PMS Progress Chart & Equipment Installation) */}
        <div className="grid grid-cols-12 gap-2 mb-2">
          <div className="col-span-7">
            <ProgressChartSection pms={pms} masterSCurve={masterSCurve} lang={lang} />
          </div>
          <div className="col-span-5">
            <EquipmentSection equipment={equipment} lang={lang} />
          </div>
        </div>

        {/* Section 5: Bottom Row (Financial/IPC & Key Issues & Next Actions) */}
        <div className="grid grid-cols-12 gap-2 flex-1">
          <div className="col-span-5">
            <IpcSection ipc={ipc} daily={daily} lang={lang} />
          </div>
          <div className="col-span-7">
            <IssuesAndActionsSection daily={daily} lang={lang} />
          </div>
        </div>

        {/* Section 6: Footer with Signatures & Source Traceability */}
        <ReportFooter pms={pms} daily={daily} ipc={ipc} equipment={equipment} lang={lang} />
      </div>
    </div>
  );
};
