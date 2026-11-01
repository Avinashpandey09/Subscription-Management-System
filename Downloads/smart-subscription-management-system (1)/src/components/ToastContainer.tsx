import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let borderColor = 'border-blue-500/30';
        let iconColor = 'text-blue-400';
        let bgStyle = 'bg-slate-900/95';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          borderColor = 'border-emerald-500/40';
          iconColor = 'text-emerald-400';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          borderColor = 'border-rose-500/40';
          iconColor = 'text-rose-400';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          borderColor = 'border-amber-500/40';
          iconColor = 'text-amber-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${borderColor} ${bgStyle} backdrop-blur-md shadow-2xl text-slate-100 transition-all duration-300 transform translate-y-0`}
          >
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-slate-100">{toast.title}</div>
              <div className="text-slate-300 text-xs mt-0.5 leading-relaxed">{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 -mr-1 -mt-1 rounded-md"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
