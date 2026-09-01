import React, { useState } from 'react';
import {
  PmsRecord,
  DailyReportRecord,
  IpcRecord,
  EquipmentRecord,
  Language
} from '../../types';
import { Edit3, Check, X } from 'lucide-react';

interface ManualDataEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetType: 'pms' | 'daily' | 'ipc' | 'equipment';
  currentData: any;
  onSave: (updated: any) => void;
  lang: Language;
}

export const ManualDataEditorModal: React.FC<ManualDataEditorModalProps> = ({
  isOpen,
  onClose,
  datasetType,
  currentData,
  onSave,
  lang
}) => {
  const [formData, setFormData] = useState<any>({ ...currentData });
  const isFa = lang === 'fa';

  if (!isOpen) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent: string, child: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [parent]: {
        ...(prev[parent] || {}),
        [child]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 no-print">
      <div className="bg-white border border-slate-250 rounded-lg max-w-2xl w-full text-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-amber-600" />
            <h3 className="font-extrabold text-xs md:text-sm text-slate-900">
              {isFa ? `ویرایش مستقیم داده‌های ${datasetType.toUpperCase()}` : `Direct Data Editor: ${datasetType.toUpperCase()}`}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          {/* Common Field: Data Date */}
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'تاریخ داده (Data Date):' : 'Data Date:'}</label>
              <input
                type="date"
                value={formData.dataDate || ''}
                onChange={e => handleChange('dataDate', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:border-blue-600 outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'منبع داده (Data Source):' : 'Source:'}</label>
              <input
                type="text"
                value={formData.source || ''}
                onChange={e => handleChange('source', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:border-blue-600 outline-hidden"
              />
            </div>
          </div>

          {/* PMS Specific Fields */}
          {datasetType === 'pms' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'پیشرفت برنامه‌ای (Planned %):' : 'Planned Progress %:'}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.plannedProgress || 0}
                  onChange={e => handleChange('plannedProgress', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'پیشرفت واقعی (Actual %):' : 'Actual Progress %:'}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.actualProgress || 0}
                  onChange={e => handleChange('actualProgress', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'پیشرفت دوره قبل (Previous %):' : 'Previous Actual %:'}</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.previousActualProgress || 0}
                  onChange={e => handleChange('previousActualProgress', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'انحراف زمانی (روز):' : 'Schedule Variance (Days):'}</label>
                <input
                  type="number"
                  value={formData.scheduleVarianceDays || 0}
                  onChange={e => handleChange('scheduleVarianceDays', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Daily Report Specific Fields */}
          {datasetType === 'daily' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'نیروی مستقیم:' : 'Direct Manpower:'}</label>
                  <input
                    type="number"
                    value={formData.manpower?.direct || 0}
                    onChange={e => {
                      const dir = parseInt(e.target.value) || 0;
                      const ind = formData.manpower?.indirect || 0;
                      const sub = formData.manpower?.subcontractor || 0;
                      setFormData((prev: any) => ({
                        ...prev,
                        manpower: { direct: dir, indirect: ind, subcontractor: sub, total: dir + ind + sub }
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'نیروی غیرمستقیم:' : 'Indirect:'}</label>
                  <input
                    type="number"
                    value={formData.manpower?.indirect || 0}
                    onChange={e => {
                      const ind = parseInt(e.target.value) || 0;
                      const dir = formData.manpower?.direct || 0;
                      const sub = formData.manpower?.subcontractor || 0;
                      setFormData((prev: any) => ({
                        ...prev,
                        manpower: { direct: dir, indirect: ind, subcontractor: sub, total: dir + ind + sub }
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'پیمانکار دست‌دوم:' : 'Subcontractor:'}</label>
                  <input
                    type="number"
                    value={formData.manpower?.subcontractor || 0}
                    onChange={e => {
                      const sub = parseInt(e.target.value) || 0;
                      const dir = formData.manpower?.direct || 0;
                      const ind = formData.manpower?.indirect || 0;
                      setFormData((prev: any) => ({
                        ...prev,
                        manpower: { direct: dir, indirect: ind, subcontractor: sub, total: dir + ind + sub }
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'ماشین‌آلات فعال:' : 'Active Machinery:'}</label>
                  <input
                    type="number"
                    value={formData.machinery?.active || 0}
                    onChange={e => handleNestedChange('machinery', 'active', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'ساعت کار ایمن بدون حادثه:' : 'Safe Man-Hours:'}</label>
                  <input
                    type="number"
                    value={formData.safetyHSE?.safeManHours || 0}
                    onChange={e => handleNestedChange('safetyHSE', 'safeManHours', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* IPC Specific Fields */}
          {datasetType === 'ipc' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'عنوان / شماره صورت‌وضعیت:' : 'IPC Number:'}</label>
                  <input
                    type="text"
                    value={formData.latestIpcNo || ''}
                    onChange={e => handleChange('latestIpcNo', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:bg-white focus:border-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'واحد پولی:' : 'Currency:'}</label>
                  <input
                    type="text"
                    value={formData.currency || 'EUR'}
                    onChange={e => handleChange('currency', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'مبلغ ارائه‌شده:' : 'Submitted:'}</label>
                  <input
                    type="number"
                    value={formData.submittedAmount || 0}
                    onChange={e => handleChange('submittedAmount', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'مبلغ تأییدشده:' : 'Approved:'}</label>
                  <input
                    type="number"
                    value={formData.approvedAmount || 0}
                    onChange={e => {
                      const app = parseFloat(e.target.value) || 0;
                      const paid = formData.paidAmount || 0;
                      handleChange('approvedAmount', app);
                      handleChange('outstandingAmount', Math.max(0, app - paid));
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'مبلغ پرداخت‌شده:' : 'Paid:'}</label>
                  <input
                    type="number"
                    value={formData.paidAmount || 0}
                    onChange={e => {
                      const paid = parseFloat(e.target.value) || 0;
                      const app = formData.approvedAmount || 0;
                      handleChange('paidAmount', paid);
                      handleChange('outstandingAmount', Math.max(0, app - paid));
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Equipment Specific Fields */}
          {datasetType === 'equipment' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'کل تجهیزات:' : 'Total Equipment:'}</label>
                <input
                  type="number"
                  value={formData.totalEquipment || 0}
                  onChange={e => {
                    const tot = parseInt(e.target.value) || 0;
                    const inst = formData.installed || 0;
                    handleChange('totalEquipment', tot);
                    handleChange('installationPercentage', tot > 0 ? Number(((inst / tot) * 100).toFixed(2)) : 0);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'تحویل به سایت:' : 'Delivered Site:'}</label>
                <input
                  type="number"
                  value={formData.deliveredSite || 0}
                  onChange={e => handleChange('deliveredSite', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'نصب‌شده:' : 'Installed:'}</label>
                <input
                  type="number"
                  value={formData.installed || 0}
                  onChange={e => {
                    const inst = parseInt(e.target.value) || 0;
                    const tot = formData.totalEquipment || 0;
                    handleChange('installed', inst);
                    handleChange('installationPercentage', tot > 0 ? Number(((inst / tot) * 100).toFixed(2)) : 0);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{isFa ? 'تأیید نهایی:' : 'Accepted:'}</label>
                <input
                  type="number"
                  value={formData.accepted || 0}
                  onChange={e => handleChange('accepted', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono focus:bg-white focus:border-blue-600 outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              {isFa ? 'انصراف' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded text-xs shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isFa ? 'ثبت و انتشار نسخه جدید' : 'Save & Publish Version'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
