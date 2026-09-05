import React, { useState } from 'react';
import { LoicoLogo } from '../LoicoLogo';
import { Lock, ShieldAlert, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface AdminLoginModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('لطفاً رمز عبور مدیریت را وارد نمایید.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.login(password);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.message || 'رمز عبور وارد شده صحیح نمی‌باشد.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'خطا در ارتباط با سرور.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top brand header */}
        <div className="p-6 pb-4 bg-linear-to-b from-blue-950/60 to-transparent border-b border-slate-800 text-center">
          <div className="flex justify-center mb-3">
            <LoicoLogo size={44} id="admin-login-logo" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            ورود به بخش مدیریت و انتشار گزارش
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            LOICO CCPP 500MW Executive Daily Reporting System
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-600/50 rounded-xl flex items-center gap-2.5 text-rose-300 text-xs animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 text-right">
              رمز عبور امنیتی مدیریت (Admin Password)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                placeholder="رمز عبور را وارد کنید..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2.5 px-4 pr-10 text-sm text-white placeholder-slate-500 transition outline-hidden"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 text-right">
              دسترسی به بارگذاری اکسل، تنظیمات پایه و انتشار گزارش عمومی نیازمند مجوز مدیریت است.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>بازگشت به داشبورد عمومی</span>
              </button>
            ) : (
              <a
                href="/"
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>بازگشت به داشبورد عمومی</span>
              </a>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال اعتبارسنجی...</span>
                </>
              ) : (
                <span>ورود به پنل مدیریت</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
