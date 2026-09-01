import React, { useState, useEffect } from 'react';
import { ProjectMasterData, Language, MasterSCurveRecord } from '../../types';
import { projectDataStore } from '../../services/dataStore';
import { ProjectMasterImportModal } from './ProjectMasterImportModal';
import { MasterSCurveImportModal } from './MasterSCurveImportModal';
import { Building2, Save, Plus, Trash2, Calendar, FileText, CheckCircle, UploadCloud, FileSpreadsheet, ShieldCheck, TrendingUp, Layers } from 'lucide-react';

interface ProjectMasterDataViewProps {
  master: ProjectMasterData;
  lang: Language;
}

export const ProjectMasterDataView: React.FC<ProjectMasterDataViewProps> = ({ master, lang }) => {
  const [formData, setFormData] = useState<ProjectMasterData>({ ...master });
  const [masterSCurve, setMasterSCurve] = useState<MasterSCurveRecord>(projectDataStore.getMasterSCurve());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSCurveModalOpen, setIsSCurveModalOpen] = useState(false);

  const isFa = lang === 'fa';

  useEffect(() => {
    setFormData({ ...master });
    const unsubscribe = projectDataStore.subscribe(() => {
      setMasterSCurve(projectDataStore.getMasterSCurve());
    });
    return unsubscribe;
  }, [master]);

  const handleChange = (field: keyof ProjectMasterData, val: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleDisciplineWeightChange = (index: number, weight: number) => {
    const updated = [...formData.disciplines];
    updated[index] = { ...updated[index], weight };
    setFormData(prev => ({ ...prev, disciplines: updated }));
  };

  const handleAddMilestone = () => {
    const newM = {
      id: `m-${Date.now()}`,
      titleFa: 'فعالیت جدید قرارداد',
      titleEn: 'New Milestone',
      contractualDate: '1404/06/30',
      forecastDate: '1404/06/30',
      weight: 5,
      status: 'on_track' as const
    };
    setFormData(prev => ({ ...prev, milestones: [...prev.milestones, newM] }));
  };

  const handleRemoveMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    projectDataStore.updateMasterData(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const totalWeight = formData.disciplines.reduce((sum, d) => sum + (Number(d.weight) || 0), 0);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Top Header with Master Data Import Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-250 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              {isFa ? 'اطلاعات پایه و محدوده کاری پروژه (Project Scope & Master Data)' : 'Project Master Data & Scope Definition'}
            </h2>
            {formData.isRealMasterData && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                {isFa ? 'داده‌های واقعی فایل اکسل پایه' : 'Verified Master Data'}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            {isFa
              ? 'ثبت و پیکربندی مشخصات پایه قرارداد، طرفین، تاریخ ابلاغ و شروع، دیسیپلین‌ها و مبالغ ریالی و ارزی'
              : 'Configure baseline contracts, stakeholders, commencement dates, disciplines, and financial values'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1 rounded text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{isFa ? 'اطلاعات پایه با موفقیت ذخیره شد.' : 'Master data saved.'}</span>
            </div>
          )}

          {/* Master Excel Upload Button */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isFa ? 'ورود اطلاعات پایه از اکسل (Master Data Import)' : 'Master Data Excel Import'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: General & Contractual Parameters */}
        <div className="bg-white border border-slate-250 rounded-lg p-3.5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold text-blue-700 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              {isFa ? '۱. مشخصات کلی قرارداد و طرفین پروژه (برگه "اسکله")' : '1. Contract & Stakeholders Identification'}
            </h3>
            <span className="text-[10.5px] font-mono text-slate-500">
              Validated Cell Mappings: D1/B6, N9, N10, N11, N12, V9, V10, V11, N13, N15
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isFa ? 'نام پروژه (D1 / B6):' : 'Project Name (Fa):'}
              </label>
              <input
                type="text"
                value={formData.projectNameFa}
                onChange={e => handleChange('projectNameFa', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-bold focus:bg-white focus:border-blue-600 outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isFa ? 'نام کارفرما (N9):' : 'Client Name:'}
              </label>
              <input
                type="text"
                value={formData.clientNameFa}
                onChange={e => handleChange('clientNameFa', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:bg-white focus:border-blue-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isFa ? 'پیمانکار اصلی (N12):' : 'Contractor Name:'}
              </label>
              <input
                type="text"
                value={formData.contractorNameFa}
                onChange={e => handleChange('contractorNameFa', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:bg-white focus:border-blue-600 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isFa ? 'مهندس مشاور (N11):' : 'Consultant / Engineer:'}
              </label>
              <input
                type="text"
                value={formData.consultantNameFa}
                onChange={e => handleChange('consultantNameFa', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:bg-white focus:border-blue-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isFa ? 'مدیر طرح / نظارت عالیه (N10):' : 'Project Management Consultant / PM:'}
              </label>
              <input
                type="text"
                value={formData.projectManagerFa || 'شرکت مهندسان مشاور ستیران'}
                onChange={e => handleChange('projectManagerFa', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:bg-white focus:border-blue-600 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isFa ? 'محل اجرای پروژه (Location):' : 'Project Location:'}
              </label>
              <input
                type="text"
                value={formData.locationFa || 'بندر پتروشیمی ماهشهر'}
                onChange={e => handleChange('locationFa', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:bg-white focus:border-blue-600 outline-hidden"
              />
            </div>
          </div>

          {/* Dates & Financials Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-200">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isFa ? 'تاریخ ابلاغ قرارداد (V9):' : 'Notification Date (V9):'}
              </label>
              <input
                type="text"
                value={formData.contractNotificationDate || '1403/12/14'}
                onChange={e => handleChange('contractNotificationDate', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isFa ? 'تاریخ شروع رسمی (V10):' : 'Start Date (V10):'}
              </label>
              <input
                type="text"
                value={formData.startDate || '1403/12/21'}
                onChange={e => handleChange('startDate', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isFa ? 'مدت قرارداد (V11):' : 'Contract Duration (V11):'}
              </label>
              <input
                type="text"
                value={formData.contractDurationText || '18 ماه شمسي'}
                onChange={e => handleChange('contractDurationText', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isFa ? 'شماره قرارداد (Contract No):' : 'Contract Number:'}
              </label>
              <input
                type="text"
                value={formData.contractNumber || 'N/A'}
                onChange={e => handleChange('contractNumber', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
              />
            </div>
          </div>

          {/* Currency Amounts & Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isFa ? 'مبلغ ریالی قرارداد (N13):' : 'Contract Value IRR (N13):'}
              </label>
              <input
                type="number"
                value={formData.contractValueIRR || 4653170392630}
                onChange={e => handleChange('contractValueIRR', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isFa ? 'مبلغ ارزی قرارداد یورو (N15):' : 'Contract Value EUR (N15):'}
              </label>
              <input
                type="number"
                value={formData.contractValueEUR || 673167}
                onChange={e => handleChange('contractValueEUR', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isFa ? 'شرح و محدوده موضوع قرارداد (B10):' : 'Scope Description (B10):'}
            </label>
            <textarea
              rows={2}
              value={formData.scopeDescriptionFa}
              onChange={e => handleChange('scopeDescriptionFa', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:bg-white focus:border-blue-600 outline-hidden leading-relaxed"
            />
          </div>
        </div>

        {/* Section 2: Disciplines & Weights */}
        <div className="bg-white border border-slate-250 rounded-lg p-3.5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold text-blue-700 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              {isFa ? '۲. ساختار دیسیپلین‌ها و اوزان فیزیکی (PMS Discipline Weights)' : '2. Discipline Weights Breakdown'}
            </h3>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
              Math.abs(totalWeight - 100) < 0.1 ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-300'
            }`}>
              {isFa ? `مجموع اوزان: ${totalWeight}%` : `Total Weight: ${totalWeight}%`}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
            {formData.disciplines.map((d, idx) => (
              <div key={d.id} className="bg-slate-50 p-2.5 rounded border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">{isFa ? d.nameFa : d.nameEn}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Code: {d.code}</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={d.weight}
                    onChange={e => handleDisciplineWeightChange(idx, parseFloat(e.target.value) || 0)}
                    className="w-14 bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-center font-bold"
                  />
                  <span className="text-slate-500 text-xs">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Major Milestones */}
        <div className="bg-white border border-slate-250 rounded-lg p-3.5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold text-blue-700">
              {isFa ? '۳. مایلستون‌ها و نقاط عطف کلیدی قرارداد (Key Milestones)' : '3. Key Contractual Milestones'}
            </h3>
            <button
              type="button"
              onClick={handleAddMilestone}
              className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-blue-700 text-xs px-2.5 py-1 rounded border border-slate-250 cursor-pointer shadow-2xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isFa ? 'افزودن مایلستون' : 'Add Milestone'}</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {formData.milestones.map((m, idx) => (
              <div key={m.id} className="grid grid-cols-12 gap-2 bg-slate-50 p-2 rounded border border-slate-200 items-center">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={isFa ? m.titleFa : m.titleEn}
                    onChange={e => {
                      const updated = [...formData.milestones];
                      if (isFa) updated[idx].titleFa = e.target.value;
                      else updated[idx].titleEn = e.target.value;
                      setFormData(prev => ({ ...prev, milestones: updated }));
                    }}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 font-medium"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    value={m.contractualDate}
                    onChange={e => {
                      const updated = [...formData.milestones];
                      updated[idx].contractualDate = e.target.value;
                      setFormData(prev => ({ ...prev, milestones: updated }));
                    }}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono"
                  />
                </div>
                <div className="col-span-3">
                  <select
                    value={m.status}
                    onChange={e => {
                      const updated = [...formData.milestones];
                      updated[idx].status = e.target.value as any;
                      setFormData(prev => ({ ...prev, milestones: updated }));
                    }}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 text-xs"
                  >
                    <option value="completed">{isFa ? 'تکمیل‌شده (Completed)' : 'Completed'}</option>
                    <option value="on_track">{isFa ? 'مطابق برنامه (On Track)' : 'On Track'}</option>
                    <option value="attention">{isFa ? 'نیازمند توجه (Attention)' : 'Attention'}</option>
                    <option value="critical">{isFa ? 'بحرانی / تأخیری (Critical)' : 'Critical'}</option>
                  </select>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveMilestone(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Master S-Curve Baseline Definition */}
        <div className="bg-white border border-slate-250 rounded-lg p-3.5 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <div>
                <h3 className="text-xs font-bold text-blue-700">
                  {isFa ? '۴. منحنی پیشرفت برنامه‌ای مصوب مرجع (Master S-Curve Baseline)' : '4. Approved Master S-Curve Baseline'}
                </h3>
                <p className="text-[10.5px] text-slate-500">
                  {isFa
                    ? 'منحنی مستقل زمان‌بندی پروژه که مبنای محاسبه پیشرفت برنامه‌ای و انحراف داشبورد در کلیه تاریخ‌ها قرار می‌گیرد.'
                    : 'Independent approved planned curve used for exact lookup and linear interpolation across all report dates.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-250 font-bold font-mono">
                {masterSCurve?.points?.length || 0} {isFa ? 'نقطه مصوب' : 'Approved Points'}
              </span>
              <button
                type="button"
                onClick={() => setIsSCurveModalOpen(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded shadow-xs transition cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{isFa ? 'ورود منحنی S-Curve مصوب (Import)' : 'Import Master S-Curve'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 block">{isFa ? 'فایل مرجع منحنی مصوب:' : 'Source File:'}</span>
              <span className="font-bold text-slate-800 font-mono text-[11.5px] truncate block mt-0.5">
                {masterSCurve?.sourceFile || 'Master_SCurve_Baseline.xlsx'}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 block">{isFa ? 'نسخه و تاریخ ثبت:' : 'Version & Date:'}</span>
              <span className="font-bold text-slate-800 font-mono text-[11.5px] block mt-0.5">
                Rev {masterSCurve?.version || 1} — {masterSCurve?.uploadDate || '1403/12/21'}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 block">{isFa ? 'بازه پیشرفت برنامه‌ای:' : 'Planned Range:'}</span>
              <span className="font-bold text-blue-900 font-mono text-[11.5px] block mt-0.5">
                {masterSCurve?.points?.[0]?.planned}% → {masterSCurve?.points?.[masterSCurve?.points.length - 1]?.planned}%
              </span>
            </div>
          </div>

          {/* Mini Table of Master S-Curve Points */}
          <div className="border border-slate-200 rounded overflow-hidden">
            <div className="max-h-40 overflow-y-auto">
              <table className="w-full text-xs text-right divide-y divide-slate-200">
                <thead className="bg-slate-50 text-[10.5px] text-slate-600 font-bold sticky top-0">
                  <tr>
                    <th className="px-3 py-1 w-10 text-center">#</th>
                    <th className="px-3 py-1">{isFa ? 'تاریخ کات‌آف (Date)' : 'Date'}</th>
                    <th className="px-3 py-1">{isFa ? 'پیشرفت برنامه‌ای مصوب (Planned %)' : 'Planned Progress %'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {(masterSCurve?.points || []).map((pt, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-3 py-1 text-center text-slate-400 font-sans">{idx + 1}</td>
                      <td className="px-3 py-1 text-slate-800">{pt.date}</td>
                      <td className="px-3 py-1 text-blue-900 font-bold">{pt.planned}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-md shadow-xs transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isFa ? 'ذخیره و به‌روزرسانی اطلاعات پایه پروژه' : 'Save Project Master Data'}</span>
          </button>
        </div>
      </form>

      {/* Master Data Excel Import Modal */}
      <ProjectMasterImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        lang={lang}
      />

      {/* Master S-Curve Import Modal */}
      <MasterSCurveImportModal
        isOpen={isSCurveModalOpen}
        onClose={() => setIsSCurveModalOpen(false)}
        lang={lang}
      />
    </div>
  );
};

