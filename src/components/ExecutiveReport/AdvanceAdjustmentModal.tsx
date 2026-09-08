import React from 'react';
import { FinancialSummary, Language, FINANCIAL_CALCULATION_BASE_IRR } from '../../types';
import { X, CheckCircle2, DollarSign, FileText, ArrowDownCircle } from 'lucide-react';

interface AdvanceAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fin: FinancialSummary;
  lang: Language;
}

export const AdvanceAdjustmentModal: React.FC<AdvanceAdjustmentModalProps> = ({
  isOpen,
  onClose,
  fin,
  lang
}) => {
  if (!isOpen) return null;

  const isFa = lang === 'fa';
  const base = fin.financialCalculationBaseIRR || FINANCIAL_CALCULATION_BASE_IRR;

  const advanceItems = fin.advancePaymentItems && fin.advancePaymentItems.length > 0
    ? fin.advancePaymentItems
    : [
        { id: 1, itemNo: 1, month: 'اسفند 1403', amountIRR: 425188605151 },
        { id: 2, itemNo: 2, month: 'اردیبهشت 1404', amountIRR: 318891453863 },
        { id: 3, itemNo: 3, month: 'بهمن 1404', amountIRR: 328805197613 },
        { id: 4, itemNo: 'خرید کالا', month: 'پیش پرداخت خرید کالا', amountIRR: 81253803955 }
      ];

  const adjustmentItems = fin.adjustmentItems && fin.adjustmentItems.length > 0
    ? fin.adjustmentItems
    : [
        { id: 1, itemNo: 1, invoiceTitle: 'صورت‌وضعیت تعدیل شماره ۱', amountIRR: 1320883200, status: 'دریافت شده' },
        { id: 2, itemNo: 2, invoiceTitle: 'صورت‌وضعیت تعدیل شماره ۲', amountIRR: 20685139277, status: 'دریافت شده' },
        { id: 3, itemNo: 3, invoiceTitle: 'صورت‌وضعیت تعدیل شماره ۳', amountIRR: 113053361792, status: 'دریافت شده' },
        { id: 4, itemNo: 4, invoiceTitle: 'صورت‌وضعیت تعدیل شماره ۴', amountIRR: 68367784684, status: 'دریافت شده' },
        { id: 5, itemNo: 5, invoiceTitle: 'صورت‌وضعیت تعدیل شماره ۵', amountIRR: 44742284930, status: 'دریافت شده' },
        { id: 6, itemNo: 6, invoiceTitle: 'صورت‌وضعیت تعدیل شماره ۶', amountIRR: 73436625759, status: 'دریافت شده' },
        { id: 7, itemNo: 7, invoiceTitle: 'صورت‌وضعیت تعدیل شماره ۷ (مربوط به ص.و ۷)', amountIRR: 63468733002, status: 'دریافت شده' },
        { id: 8, itemNo: 8, invoiceTitle: 'صورت‌وضعیت تعدیل شماره ۷ (مربوط به ص.و ۸)', amountIRR: 305066913260, status: 'دریافت شده' },
        { id: 9, itemNo: 9, invoiceTitle: 'صورت‌وضعیت تعدیل شماره ۸ (مربوط به ص.و ۹)', amountIRR: 107307098559, status: 'دریافت شده' },
        { id: 10, itemNo: 10, invoiceTitle: 'صورت‌وضعیت تعدیل شماره ۹ (مربوط به ص.و ۱۰)', amountIRR: 127998410400, status: 'دریافت شده' },
        { id: 11, itemNo: 11, invoiceTitle: 'صورت‌وضعیت تعدیل شماره ۹ (مربوط به ص.و ۱۱)', amountIRR: 148294423522, status: 'تأیید شده' }
      ];

  const totalAdv = fin.advancePaymentIRR || advanceItems.reduce((acc, it) => acc + it.amountIRR, 0);
  const totalAdj = fin.adjustmentIRR || adjustmentItems.reduce((acc, it) => acc + it.amountIRR, 0);
  const adjReceived = fin.adjustmentReceivedIRR || adjustmentItems.filter(it => it.status.includes('دریافت')).reduce((acc, it) => acc + it.amountIRR, 0);
  const adjApproved = fin.adjustmentApprovedIRR || adjustmentItems.filter(it => !it.status.includes('دریافت')).reduce((acc, it) => acc + it.amountIRR, 0);

  const advPercentage = Number(((totalAdv / base) * 100).toFixed(2));
  const adjPercentage = Number(((totalAdj / base) * 100).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200" dir={isFa ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/30 text-blue-300 border border-blue-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-sans">
                {isFa ? 'ریز اقلام و مستندات پیش‌پرداخت و صورت‌وضعیت‌های تعدیل' : 'Advance Payment & Price Adjustment Invoices Breakdown'}
              </h2>
              <p className="text-[11px] text-slate-300 font-sans">
                {isFa ? 'مبنای محاسبه درصدهای مالی: ۵,۲۳۰ میلیارد ریال (مبلغ کل قرارداد)' : 'Financial Percentage Calculation Base: 5,230,000,000,000 IRR (Total Contract Base)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isFa ? 'بستن' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 font-sans block font-medium">{isFa ? 'مجموع پیش‌پرداخت' : 'Total Advance Payment'}</span>
            <span className="text-sm font-black text-slate-900 font-mono block mt-0.5">
              {(totalAdv / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })} <span className="text-[10px] font-normal text-slate-500">م.ر</span>
            </span>
            <span className="text-[10px] text-emerald-600 font-bold font-mono block mt-0.5">
              {advPercentage}% {isFa ? 'از کل قرارداد' : 'of Contract'}
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 font-sans block font-medium">{isFa ? 'مجموع تعدیل' : 'Total Adjustment'}</span>
            <span className="text-sm font-black text-indigo-900 font-mono block mt-0.5">
              {(totalAdj / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })} <span className="text-[10px] font-normal text-slate-500">م.ر</span>
            </span>
            <span className="text-[10px] text-indigo-600 font-bold font-mono block mt-0.5">
              {adjPercentage}% {isFa ? 'از کل قرارداد' : 'of Contract'}
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 font-sans block font-medium">{isFa ? 'تعدیل دریافت شده' : 'Adjustment Received'}</span>
            <span className="text-sm font-black text-emerald-800 font-mono block mt-0.5">
              {(adjReceived / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })} <span className="text-[10px] font-normal text-slate-500">م.ر</span>
            </span>
            <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
              {isFa ? '۹ صورت‌وضعیت اول' : 'Invoices 1 to 9 (Part)'}
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 font-sans block font-medium">{isFa ? 'تعدیل در انتظار پرداخت' : 'Adjustment Pending'}</span>
            <span className="text-sm font-black text-amber-800 font-mono block mt-0.5">
              {(adjApproved / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })} <span className="text-[10px] font-normal text-slate-500">م.ر</span>
            </span>
            <span className="text-[10px] text-amber-600 font-sans block mt-0.5">
              {isFa ? 'ص.و ۹ (مربوط به ۱۱) تأییدشده' : 'Invoice 9 (Rel 11) Approved'}
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-5 overflow-y-auto max-h-[calc(92vh-220px)]">
          {/* Section 1: Advance Payments Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 font-sans">
                  {isFa ? 'جدول اقساط پیش‌پرداخت (۴ فقره)' : 'Advance Payment Installments (4 Items)'}
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {isFa ? `جمع کل: ${totalAdv.toLocaleString()} ریال` : `Total: ${totalAdv.toLocaleString()} IRR`}
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-3 text-center w-12">#</th>
                    <th className="py-2 px-3">{isFa ? 'ردیف / مرحله قسط' : 'Installment'}</th>
                    <th className="py-2 px-3">{isFa ? 'شرح و موعد پرداخت' : 'Description / Period'}</th>
                    <th className="py-2 px-3 text-left font-mono">{isFa ? 'مبلغ قسط (ریال)' : 'Amount (IRR)'}</th>
                    <th className="py-2 px-3 text-center">{isFa ? 'درصد از کل قرارداد' : '% of Base'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11.5px]">
                  {advanceItems.map((item, idx) => {
                    const itemPct = Number(((item.amountIRR / base) * 100).toFixed(2));
                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-500 font-sans">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800 font-sans">
                          {typeof item.itemNo === 'number' ? `${isFa ? 'قسط شماره' : 'Installment'} ${item.itemNo}` : item.itemNo}
                        </td>
                        <td className="py-2 px-3 text-slate-700 font-sans">{item.month}</td>
                        <td className="py-2 px-3 text-left font-bold text-slate-900">
                          {item.amountIRR.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-center text-emerald-700 font-semibold">
                          {itemPct}%
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300">
                    <td colSpan={3} className="py-2 px-3 text-slate-900 font-sans font-bold">
                      {isFa ? 'مجموع کل پیش‌پرداخت (ریال):' : 'Total Advance Payment (IRR):'}
                    </td>
                    <td className="py-2 px-3 text-left font-black text-blue-900 text-xs">
                      {totalAdv.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center font-black text-emerald-800 text-xs">
                      {advPercentage}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Adjustment Invoices Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 font-sans">
                  {isFa ? 'جدول صورت‌وضعیت‌های تعدیل (۱۱ صورت‌وضعیت)' : 'Price Adjustment Invoices (11 Invoices)'}
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {isFa ? `جمع کل: ${totalAdj.toLocaleString()} ریال` : `Total: ${totalAdj.toLocaleString()} IRR`}
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-3 text-center w-12">#</th>
                    <th className="py-2 px-3">{isFa ? 'عنوان صورت‌وضعیت تعدیل' : 'Adjustment Invoice'}</th>
                    <th className="py-2 px-3 text-center">{isFa ? 'وضعیت تسویه' : 'Status'}</th>
                    <th className="py-2 px-3 text-left font-mono">{isFa ? 'مبلغ تعدیل (ریال)' : 'Amount (IRR)'}</th>
                    <th className="py-2 px-3 text-center">{isFa ? 'درصد از کل قرارداد' : '% of Base'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11.5px]">
                  {adjustmentItems.map((item, idx) => {
                    const itemPct = Number(((item.amountIRR / base) * 100).toFixed(2));
                    const isReceived = item.status.includes('دریافت');
                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-500 font-sans">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800 font-sans">
                          {item.invoiceTitle}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                            isReceived
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-left font-bold text-slate-900">
                          {item.amountIRR.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-center text-indigo-700 font-semibold">
                          {itemPct}%
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300">
                    <td colSpan={3} className="py-2 px-3 text-slate-900 font-sans font-bold">
                      {isFa ? 'مجموع کل صورت‌وضعیت‌های تعدیل (ریال):' : 'Total Price Adjustment (IRR):'}
                    </td>
                    <td className="py-2 px-3 text-left font-black text-indigo-900 text-xs">
                      {totalAdj.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center font-black text-indigo-800 text-xs">
                      {adjPercentage}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-600 font-sans flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              {isFa
                ? 'ارقام فوق مستقیماً از شیت صورت‌وضعیت گزارش روزانه پروژه (Invoice Sheet) استخراج شده است.'
                : 'Figures extracted directly from the Project Daily Report Invoice Sheet.'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold font-sans transition-colors"
          >
            {isFa ? 'بستن پنجره' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
