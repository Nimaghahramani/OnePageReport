import React from 'react';
import { DatasetVersionAudit, Language } from '../../types';
import { History, ShieldCheck, FileText, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface VersionHistoryViewProps {
  auditList: DatasetVersionAudit[];
  lang: Language;
}

export const VersionHistoryView: React.FC<VersionHistoryViewProps> = ({ auditList, lang }) => {
  const isFa = lang === 'fa';

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'pms': return <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200">PMS Update</span>;
      case 'daily': return <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">Daily Report</span>;
      case 'ipc': return <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200">IPC Financial</span>;
      case 'equipment': return <span className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded text-[10px] font-bold border border-teal-200">Equipment Log</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] border border-slate-200">{type}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {isFa ? 'نسخه فعال (Active)' : 'Active'}
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            {isFa ? 'هشدار تاریخ (Older Date)' : 'Older Date'}
          </span>
        );
      case 'superseded':
      default:
        return (
          <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200">
            {isFa ? 'بایگانی‌شده (Superseded)' : 'Superseded'}
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-250 shadow-xs">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            {isFa ? 'تاریخچه نسخه‌ها و ممیزی داده‌های ورودی (Version Audit Log)' : 'Dataset Version History & Ingestion Audit'}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            {isFa
              ? 'ثبت و ردیابی کامل تمام نسخه‌های آپلودشده با تاریخ داده، منبع، کاربر و وضعیت اعتبار'
              : 'Complete trace of uploaded datasets, cut-off dates, users, source files, and validation states'}
          </p>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white border border-slate-250 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left rtl:text-right">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-250 text-[11px]">
              <tr>
                <th className="p-2.5">{isFa ? 'نوع داده' : 'Dataset Type'}</th>
                <th className="p-2.5">{isFa ? 'نسخه' : 'Rev'}</th>
                <th className="p-2.5">{isFa ? 'تاریخ داده (Data Date)' : 'Data Date'}</th>
                <th className="p-2.5">{isFa ? 'تاریخ ثبت' : 'Upload Timestamp'}</th>
                <th className="p-2.5">{isFa ? 'فایل / منبع' : 'File / Source'}</th>
                <th className="p-2.5">{isFa ? 'کاربر ثبت‌کننده' : 'User / Author'}</th>
                <th className="p-2.5">{isFa ? 'خلاصه شاخص‌ها' : 'Summary'}</th>
                <th className="p-2.5 text-center">{isFa ? 'وضعیت' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 font-mono text-[11px]">
              {auditList.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-2.5 font-sans">{getTypeBadge(entry.datasetType)}</td>
                  <td className="p-2.5 font-bold text-slate-900">v{entry.version}</td>
                  <td className="p-2.5 font-bold text-blue-700">{entry.dataDate}</td>
                  <td className="p-2.5 text-slate-500 font-sans">{entry.uploadDate}</td>
                  <td className="p-2.5 font-sans text-slate-700 max-w-[170px] truncate" title={entry.fileName}>
                    {entry.fileName}
                  </td>
                  <td className="p-2.5 font-sans text-slate-700">{entry.user}</td>
                  <td className="p-2.5 font-sans text-slate-600 max-w-[220px] truncate" title={entry.recordSummary}>
                    {entry.recordSummary}
                  </td>
                  <td className="p-2.5 font-sans text-center">{getStatusBadge(entry.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
