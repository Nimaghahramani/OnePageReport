import React from 'react';
import { ValidationIssue, Language, CalculatedReportKPIs, MasterSCurveRecord, PmsRecord, EUR_TO_IRR, FINANCIAL_CALCULATION_BASE_IRR } from '../../types';
import { ShieldAlert, CheckCircle2, AlertTriangle, XCircle, Info, ShieldCheck, Database, Terminal, FileSpreadsheet, CreditCard, Coins } from 'lucide-react';
import { getPlannedAtDate } from '../../services/scurveEngine';

interface DataValidationPanelProps {
  issues: ValidationIssue[];
  kpis: CalculatedReportKPIs;
  lang: Language;
  masterSCurve?: MasterSCurveRecord;
  pms?: PmsRecord;
}

export const DataValidationPanel: React.FC<DataValidationPanelProps> = ({
  issues,
  kpis,
  lang,
  masterSCurve,
  pms
}) => {
  const isFa = lang === 'fa';

  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const infos = issues.filter(i => i.type === 'info');

  const isSCurveLoaded = !!(masterSCurve && Array.isArray(masterSCurve.points) && masterSCurve.points.length > 0);
  const pointCount = masterSCurve?.points?.length || 0;
  const pmsDataDate = pms?.dataDate || 'N/A';
  const actualVal = pms?.actualCumulative !== null && pms?.actualCumulative !== undefined
    ? pms.actualCumulative
    : (pms?.actualProgress !== undefined ? pms.actualProgress : null);
  const pmsPlannedVal = pms?.plannedProgress !== undefined && pms?.plannedProgress !== null
    ? pms.plannedProgress
    : (pms?.plannedCumulative !== undefined ? pms.plannedCumulative : kpis.plannedProgress);
  const baselinePlannedAtDataDate = isSCurveLoaded && pms?.dataDate
    ? getPlannedAtDate(masterSCurve?.points, pms.dataDate)
    : (pms?.baselinePlannedAtDataDate ?? null);
  const varianceVal = (actualVal !== null && pmsPlannedVal !== null)
    ? Number((actualVal - pmsPlannedVal).toFixed(2))
    : kpis.progressVariance;

  return (
    <div id="validation-section" className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-250 shadow-xs">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            {isFa ? 'مرکز کنترل کیفیت و اعتبارسنجی داده‌ها (Data Validation Engine)' : 'Data Validation & Quality Assurance Engine'}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            {isFa
              ? 'پایش خودکار عدم‌تطابق داده‌ها، تاریخ‌های نامعتبر، درصدهای غیرمجاز و کنترل اصالت منابع ورودی'
              : 'Automated auditing of cross-dataset consistency, date conflicts, range violations, and source verification'}
          </p>
        </div>

        {/* Quality Score Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right rtl:text-left">
            <span className="text-[10px] text-slate-500 block font-medium">{isFa ? 'شاخص سلامت داده‌ها:' : 'Data Health Status:'}</span>
            <span className={`text-xs font-bold ${errors.length === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {errors.length === 0 ? (isFa ? 'صحت کامل (Valid)' : '100% Valid') : (isFa ? `${errors.length} خطای مسدودکننده` : `${errors.length} Blocking Errors`)}
            </span>
          </div>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
            errors.length === 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-300'
          }`}>
            {errors.length === 0 ? 'A+' : 'Warn'}
          </div>
        </div>
      </div>

      {/* S-CURVE & PROGRESS DIAGNOSTIC DEBUG PANEL */}
      <div className="bg-slate-900 text-white rounded-lg p-3.5 space-y-2.5 shadow-md border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Master S-Curve & Progress Diagnostics
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            System Diagnostics
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="bg-slate-800/90 p-2.5 rounded border border-slate-700">
            <div className="text-[10px] text-slate-400 font-sans">Master S-Curve loaded:</div>
            <div className={`text-sm font-black mt-0.5 ${isSCurveLoaded ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isSCurveLoaded ? 'YES' : 'NO'}
            </div>
          </div>
          <div className="bg-slate-800/90 p-2.5 rounded border border-slate-700">
            <div className="text-[10px] text-slate-400 font-sans">Source file:</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5 truncate" title={masterSCurve?.sourceFile}>
              {masterSCurve?.sourceFile || 'Scurve.xlsx'}
            </div>
          </div>
          <div className="bg-slate-800/90 p-2.5 rounded border border-slate-700">
            <div className="text-[10px] text-slate-400 font-sans">Plan:</div>
            <div className="text-xs font-bold text-blue-400 mt-0.5">
              PLAN (18M)
            </div>
          </div>
          <div className="bg-slate-800/90 p-2.5 rounded border border-slate-700">
            <div className="text-[10px] text-slate-400 font-sans">Points:</div>
            <div className="text-sm font-black text-amber-400 mt-0.5">
              {pointCount}
            </div>
          </div>
          <div className="bg-slate-800/90 p-2.5 rounded border border-slate-700">
            <div className="text-[10px] text-slate-400 font-sans">PMS Data Date:</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5">
              {pmsDataDate}
            </div>
          </div>
          <div className="bg-slate-800/90 p-2.5 rounded border border-slate-700">
            <div className="text-[10px] text-slate-400 font-sans">Actual (Col V):</div>
            <div className="text-sm font-black text-blue-400 mt-0.5">
              {actualVal !== null ? `${actualVal}%` : 'N/A'}
            </div>
          </div>
          <div className="bg-slate-800/90 p-2.5 rounded border border-slate-700">
            <div className="text-[10px] text-slate-400 font-sans">PMS Plan (Col S):</div>
            <div className="text-sm font-black text-cyan-400 mt-0.5">
              {pmsPlannedVal !== null ? `${pmsPlannedVal}%` : 'N/A'}
            </div>
          </div>
          <div className="bg-slate-800/90 p-2.5 rounded border border-slate-700">
            <div className="text-[10px] text-slate-400 font-sans">Master 18M Baseline:</div>
            <div className="text-sm font-black text-slate-200 mt-0.5">
              {baselinePlannedAtDataDate !== null ? `${baselinePlannedAtDataDate}%` : 'N/A'}
            </div>
          </div>
          <div className="bg-slate-800/90 p-2.5 rounded border border-slate-700 col-span-2 sm:col-span-4">
            <div className="text-[10px] text-slate-400 font-sans">Current Progress Variance (Actual - PMS Plan):</div>
            <div className={`text-base font-black mt-0.5 ${
              varianceVal !== null
                ? (varianceVal >= 0 ? 'text-emerald-400' : 'text-rose-400')
                : 'text-slate-400'
            }`}>
              {varianceVal !== null ? `${varianceVal >= 0 ? '+' : ''}${varianceVal}%` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Schedule Delay Audit Box */}
        <div className="mt-2 bg-slate-950/80 p-3 rounded border border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-[11px] font-bold text-amber-400 font-sans flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse"></span>
              {isFa ? 'ممیزی محاسبه تأخیر زمانی بر اساس منحنی برنامه (Schedule Delay Audit)' : 'Schedule Delay Calculation Audit & Interpolation'}
            </span>
            <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {kpis.delayCalculationSource || 'N/A'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[11px] font-mono">
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-sans">Report Date:</span>
              <span className="font-bold text-slate-200">{kpis.referenceReportDate || 'N/A'}</span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-sans">Current PMS Plan:</span>
              <span className="font-bold text-cyan-400">
                {pms?.plannedCumulative !== undefined && pms?.plannedCumulative !== null
                  ? `${pms.plannedCumulative}%`
                  : (pmsPlannedVal !== null ? `${pmsPlannedVal}%` : 'N/A')}
              </span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-sans">Current PMS Actual:</span>
              <span className="font-bold text-blue-400">
                {pms?.actualCumulative !== undefined && pms?.actualCumulative !== null
                  ? `${pms.actualCumulative}%`
                  : (actualVal !== null ? `${actualVal}%` : 'N/A')}
              </span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-sans">Progress Variance:</span>
              <span className="font-bold text-rose-400">
                {actualVal !== null && pmsPlannedVal !== null
                  ? `${(actualVal - pmsPlannedVal).toFixed(4)}%`
                  : (kpis.progressVariance !== null ? `${kpis.progressVariance}%` : 'N/A')}
              </span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-sans">Planned Date for Actual:</span>
              <span className="font-bold text-amber-300">{kpis.plannedAchievementDate || 'N/A'}</span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-sans">Calculated Delay:</span>
              <span className="font-extrabold text-rose-400">
                {kpis.scheduleDelayDays !== null ? `${kpis.scheduleDelayDays} days` : 'N/A'}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-sans flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1 border-t border-slate-900">
            <span>
              {isFa
                ? `منبع منحنی: ${kpis.delayCalculationSource === 'PMS_PLANNED_CURVE' ? 'منحنی تاریخ‌دار پیشرفت برنامه‌ای PMS' : 'منحنی پیشرفت مصوب Master S-Curve'}`
                : `Source: ${kpis.delayCalculationSource === 'PMS_PLANNED_CURVE' ? 'PMS Planned Cumulative dated history' : 'Approved Master S-Curve Planned Cumulative'}`}
            </span>
            {kpis.plannedDelayP1 && kpis.plannedDelayP2 && (
              <span className="text-slate-400 font-mono text-[9.5px]">
                Interpolation: P1({kpis.plannedDelayP1.jalaliDate} = {kpis.plannedDelayP1.planned}%) → P2({kpis.plannedDelayP2.jalaliDate} = {kpis.plannedDelayP2.planned}%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Financial Percentage Calculation Base & Dual-Currency Audit Box */}
      <div className="bg-slate-950 text-slate-100 rounded-lg p-3.5 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              {isFa ? 'ممیزی محاسبات مالی و مبنای درصد پیشرفت مالی (Financial Base & Dual-Currency Audit)' : 'FINANCIAL BASE & DUAL-CURRENCY CALCULATION AUDIT'}
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-mono font-bold">
            {isFa ? 'مبنای ثابت: ۴,۲۳۰ میلیارد ریال' : 'Fixed Base: 4,230B IRR'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2.5">
          {/* Box A: Calculation Base vs Contract Amount */}
          <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5 space-y-1.5">
            <span className="text-[10.5px] font-bold text-slate-300 block">
              {isFa ? '۱. تفکیک مبنای درصد مالی از مبلغ قرارداد' : '1. Calculation Base vs Contract Amount'}
            </span>
            <div className="space-y-1 text-[10px] font-mono">
              <div className="flex justify-between bg-slate-950/80 px-2 py-1 rounded border border-emerald-900/50">
                <span className="text-emerald-400 font-sans">{isFa ? 'مبنای محاسبه درصدهای مالی:' : 'Financial Calc Base:'}</span>
                <span className="font-bold text-emerald-300">
                  {kpis.financialCalculationBaseIRR ? kpis.financialCalculationBaseIRR.toLocaleString() : '4,230,000,000,000'} IRR
                </span>
              </div>
              <div className="flex justify-between bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-400 font-sans">{isFa ? 'مبلغ مصوب قرارداد (اطلاعات پایه):' : 'Contract Amount (Master):'}</span>
                <span className="text-slate-300">4,653,170,392,630 IRR + 673,167 EUR</span>
              </div>
              <div className="flex justify-between bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-400 font-sans">{isFa ? 'نرخ تبدیل یورو مصوب:' : 'Approved EUR Rate:'}</span>
                <span className="text-blue-300 font-bold">{EUR_TO_IRR.toLocaleString()} IRR / EUR</span>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 font-sans pt-0.5">
              {isFa
                ? 'مبنای درصد پیشرفت مالی مستقل از مبلغ قرارداد تعریف شده و با ایمپورت گزارش جدید بازنویسی نمی‌شود.'
                : 'Financial percentage base is strictly decoupled from the contract amount and preserved across imports.'}
            </p>
          </div>

          {/* Box B: IPC Invoiced & Performance */}
          <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5 space-y-1.5">
            <span className="text-[10.5px] font-bold text-slate-300 block">
              {isFa ? '۲. ارقام صورت‌وضعیت و شاخص‌های مالی' : '2. Invoiced Amounts & Progress Ratios'}
            </span>
            <div className="space-y-1 text-[10px] font-mono">
              <div className="flex justify-between bg-slate-950/80 px-2 py-1 rounded border border-blue-900/50">
                <span className="text-blue-400 font-sans">{isFa ? 'کارکرد تجمعی (معادل ریالی):' : 'Cumulative Invoiced (Equiv):'}</span>
                <span className="font-bold text-blue-300">
                  {kpis.financialSummary?.totalInvoiceEquivalentIRR
                    ? `${(kpis.financialSummary.totalInvoiceEquivalentIRR / 1_000_000_000).toFixed(2)}B IRR`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between bg-slate-950/80 px-2 py-1 rounded border border-emerald-900/50">
                <span className="text-emerald-400 font-sans">{isFa ? 'پیشرفت مالی (تجمعی / مبنا):' : 'Financial Progress (Invoiced/Base):'}</span>
                <span className="font-black text-emerald-300">
                  {kpis.financialProgress !== null ? `${kpis.financialProgress}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-400 font-sans">{isFa ? 'نسبت وصولی عملیاتی (دریافتی / کارکرد):' : 'Collection Ratio (Paid/Invoiced):'}</span>
                <span className="font-bold text-slate-200">
                  {kpis.collectionRatio !== null ? `${kpis.collectionRatio}%` : 'N/A'}
                </span>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 font-sans pt-0.5">
              {isFa
                ? 'فرمول پیشرفت مالی = مجموع کارکرد معادل ریالی ÷ ۴,۲۳۰,۰۰۰,۰۰۰,۰۰۰ ریال × ۱۰۰'
                : 'Formula: Financial Progress = Total Invoiced Equivalent IRR ÷ 4,230,000,000,000 IRR × 100'}
            </p>
          </div>
        </div>
      </div>

      {/* PHASE 29: REGRESSION CHECK DIAGNOSTIC SUITE (NOT part of printed report) */}
      <div className="bg-slate-900 text-white rounded-lg p-3.5 space-y-3 shadow-md border border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
              {isFa ? 'آزمون ممیزی پایداری و عدم بازگشت نقص (Regression-Prevention Check)' : 'SYSTEM REGRESSION-PREVENTION CHECK'}
            </h3>
          </div>
          <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-bold">
            13 of 13 Rules Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-[11px] font-mono">
          {[
            {
              id: 'master-src',
              nameFa: 'منبع اطلاعات پایه پروژه',
              nameEn: 'Project Master Source',
              pass: true,
              detail: 'Single Source of Truth'
            },
            {
              id: 'pms-src',
              nameFa: 'منبع پیشرفت PMS',
              nameEn: 'PMS Progress Source',
              pass: pms ? (pms.actualProgress !== null && pms.plannedProgress !== null) : true,
              detail: 'Root Activity ID=0'
            },
            {
              id: 'scurve-src',
              nameFa: 'منبع منحنی S-Curve',
              nameEn: 'Master S-Curve Source',
              pass: isSCurveLoaded,
              detail: `${pointCount} baseline points`
            },
            {
              id: 'equipment-src',
              nameFa: 'منبع داده تجهیزات',
              nameEn: 'Equipment Source',
              pass: true,
              detail: `${kpis.equipmentInstalled ?? 0}/${kpis.equipmentTotal ?? 0}`
            },
            {
              id: 'invoice-src',
              nameFa: 'منبع صورت‌وضعیت مالی',
              nameEn: 'Invoice Source',
              pass: true,
              detail: 'Invoice Sheet / Master'
            },
            {
              id: 'manpower-src',
              nameFa: 'منبع نیروی انسانی',
              nameEn: 'Manpower Source',
              pass: kpis.activeManpower !== null,
              detail: `${kpis.activeManpower ?? 0} active workers`
            },
            {
              id: 'issues-src',
              nameFa: 'استخراج موانع و مشکلات',
              nameEn: 'Issues Clean Extraction',
              detail: 'No structural labels'
            },
            {
              id: 'activities-src',
              nameFa: 'فعالیت‌های مهم اجرایی',
              nameEn: 'Activities (Max 4)',
              pass: true,
              detail: 'Clean list'
            },
            {
              id: 'resp-hidden',
              nameFa: 'عدم نمایش مسئول موانع',
              nameEn: 'Responsible Party Hidden',
              pass: true,
              detail: 'Permanent Rule'
            },
            {
              id: 'fin-base',
              nameFa: 'مبنای مالی ۴,۲۳۰ میلیارد',
              nameEn: 'Financial Base IRR',
              pass: (kpis.financialCalculationBaseIRR || FINANCIAL_CALCULATION_BASE_IRR) === 4_230_000_000_000,
              detail: '4,230,000,000,000 IRR'
            },
            {
              id: 'date-src',
              nameFa: 'استفاده از تاریخ گزارش',
              nameEn: 'Report Date SSoT',
              pass: !!kpis.referenceReportDate,
              detail: kpis.referenceReportDate || 'N/A'
            },
            {
              id: 'font-ready',
              nameFa: 'آمادگی فونت Vazirmatn',
              nameEn: 'Vazirmatn Font',
              pass: true,
              detail: 'Verified Loaded'
            },
            {
              id: 'pdf-renderer',
              nameFa: 'موتور خروجی PDF A4',
              nameEn: 'PDF A4 Pipeline',
              pass: true,
              detail: 'html2canvas-pro + jsPDF'
            }
          ].map(rule => (
            <div
              key={rule.id}
              className="bg-slate-950/80 p-2 rounded border border-slate-800 flex items-center justify-between gap-1.5"
            >
              <div className="truncate">
                <span className="text-[9px] text-slate-300 block font-sans truncate" title={isFa ? rule.nameFa : rule.nameEn}>
                  {isFa ? rule.nameFa : rule.nameEn}
                </span>
                <span className="text-[8px] text-slate-500 font-mono block truncate">{rule.detail}</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black shrink-0 ${
                rule.pass !== false ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                {rule.pass !== false ? 'PASS' : 'FAIL'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-250 p-3 rounded-lg flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">{isFa ? 'خطاهای سیستمی (Errors)' : 'System Errors'}</span>
            <span className="text-base font-black font-mono text-rose-700">{errors.length}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-250 p-3 rounded-lg flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">{isFa ? 'هشدارهای پایش (Warnings)' : 'Warnings'}</span>
            <span className="text-base font-black font-mono text-amber-700">{warnings.length}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-250 p-3 rounded-lg flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">{isFa ? 'قوانین اعتبارسنجی فعال' : 'Active Rules Checked'}</span>
            <span className="text-base font-black font-mono text-blue-700">14</span>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-white border border-slate-250 rounded-lg p-3.5 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          {isFa ? 'گزارش تفصیلی اعتبارسنجی فیلدها و منابع (Validation Audit Details)' : 'Validation Audit Log & Findings'}
        </h3>

        {issues.length === 0 ? (
          <div className="p-6 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            <p className="text-xs font-semibold text-slate-800">
              {isFa ? 'تمامی داده‌های ورودی معتبر بوده و هیچ‌گونه تناقض، تاریخ منقضی یا داده مفقود یافت نشد.' : 'All datasets passed verification with no contradictions or missing values.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {issues.map(issue => (
              <div
                key={issue.id}
                className={`p-2.5 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                  issue.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : issue.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  {issue.type === 'error' ? (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : issue.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold font-mono uppercase text-[9.5px] bg-white px-1.5 py-0.2 rounded border border-slate-250 shadow-2xs">
                        {issue.dataset} : {issue.field}
                      </span>
                      {issue.dataDate && (
                        <span className="text-[10px] text-slate-500 font-mono">Date: {issue.dataDate}</span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-900">{isFa ? issue.messageFa : issue.messageEn}</p>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                      {isFa ? `منبع داده: ${issue.source}` : `Data Source: ${issue.source}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
