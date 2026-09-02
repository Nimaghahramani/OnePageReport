import React, { useState } from 'react';
import { adminLogin } from '../../services/reportApi';
import { Language } from '../../types';
import { Lock, KeyRound, AlertCircle, X, ShieldCheck, ArrowRight } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang: Language;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lang
}) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isFa = lang === 'fa';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError(isFa ? 'لطفاً کلمه عبور را وارد نمایید.' : 'Please enter admin password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await adminLogin(password);
    setIsLoading(false);

    if (res.success && res.data?.authenticated) {
      onSuccess();
      onClose();
    } else {
      setError(res.error?.message || (isFa ? 'کلمه عبور نادرست است.' : 'Invalid administrator credentials.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150" dir={isFa ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4.5 flex items-center justify-between border-b border-blue-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {isFa ? 'ورود به پنل مدیریت و انتشار گزارش' : 'Admin Workspace Login'}
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">
                {isFa ? 'مدیریت و انتشار گزارش روزانه پروژه اسکله P1' : 'LOICO Executive Daily Reporting Engine'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 flex items-start gap-2 animate-in shake duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>{isFa ? 'کلمه عبور مدیریت (Admin Password)' : 'Administrator Password'}</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isFa ? 'کلمه عبور مدیریت را وارد نمایید...' : 'Enter admin password...'}
                autoFocus
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono tracking-wider"
              />
              <div className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-slate-400 pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              {isFa ? 'انصراف' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <span>{isFa ? 'در حال ورود...' : 'Signing in...'}</span>
              ) : (
                <>
                  <span>{isFa ? 'ورود به پنل' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
