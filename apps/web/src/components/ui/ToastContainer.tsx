'use client';

import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />,
  };

  const borderMap = {
    success: 'border-emerald-500/30 bg-slate-900/95 shadow-emerald-500/10',
    error: 'border-rose-500/30 bg-slate-900/95 shadow-rose-500/10',
    warning: 'border-amber-500/30 bg-slate-900/95 shadow-amber-500/10',
    info: 'border-indigo-500/30 bg-slate-900/95 shadow-indigo-500/10',
  };

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-200 animate-fade-in',
            borderMap[toast.type]
          )}
        >
          {iconMap[toast.type]}
          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className="text-sm font-semibold text-slate-100">{toast.title}</h4>
            )}
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed break-words">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
