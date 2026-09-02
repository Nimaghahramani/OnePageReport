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
import { MobileReportHeader } from './MobileReportHeader';
import { MobileKpiGrid } from './MobileKpiGrid';
import { MobileExecutiveSummary } from './MobileExecutiveSummary';
import { MobileProgressSection } from './MobileProgressSection';
import { MobilePmsSection } from './MobilePmsSection';
import { MobileEquipmentSection } from './MobileEquipmentSection';
import { MobileFinancialSection } from './MobileFinancialSection';
import { MobileIssuesSection } from './MobileIssuesSection';
import { MobileActivitiesSection } from './MobileActivitiesSection';
import { MobileReportFooter } from './MobileReportFooter';

interface MobileExecutiveViewProps {
  master: ProjectMasterData;
  pms: PmsRecord;
  daily: DailyReportRecord;
  ipc: IpcRecord;
  equipment: EquipmentRecord;
  kpis: CalculatedReportKPIs;
  masterSCurve?: MasterSCurveRecord;
  lang: Language;
}

export const MobileExecutiveView: React.FC<MobileExecutiveViewProps> = ({
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
    <div
      id="mobile-executive-view"
      className="mobile-executive-view w-full max-w-full px-2 sm:px-3 pt-2 pb-6 min-w-0"
      dir={lang === 'fa' ? 'rtl' : 'ltr'}
      lang={lang}
    >
      {/* 1. Mobile Header & Project Identity */}
      <MobileReportHeader
        master={master}
        pms={pms}
        daily={daily}
        kpis={kpis}
        lang={lang}
      />

      {/* 2. 2-Column KPI Grid */}
      <MobileKpiGrid kpis={kpis} lang={lang} />

      {/* 3. Executive Summary */}
      <MobileExecutiveSummary kpis={kpis} lang={lang} />

      {/* 4. Progress / S-Curve Chart (Full Width) */}
      <MobileProgressSection
        pms={pms}
        masterSCurve={masterSCurve}
        lang={lang}
      />

      {/* 5. PMS Progress (Below S-Curve) */}
      <MobilePmsSection pms={pms} lang={lang} />

      {/* 6. Equipment Status & Expandable Details */}
      <MobileEquipmentSection equipment={equipment} lang={lang} />

      {/* 7. Financial Status & IPC */}
      <MobileFinancialSection ipc={ipc} daily={daily} lang={lang} />

      {/* 8. Issues & Constraints */}
      <MobileIssuesSection daily={daily} lang={lang} />

      {/* 9. Key Activities & Decisions */}
      <MobileActivitiesSection daily={daily} lang={lang} />

      {/* 10. Report Footer */}
      <MobileReportFooter
        pms={pms}
        daily={daily}
        ipc={ipc}
        equipment={equipment}
        lang={lang}
      />
    </div>
  );
};
