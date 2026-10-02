import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { ToastNotification } from '../types';

interface ToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-12 left-0 right-0 max-w-[400px] mx-auto z-50 px-4 pointer-events-none space-y-2">
      {toasts.map((t) => {
        let bgClass = 'bg-slate-900 border-slate-700 text-slate-100';
        let Icon = Info;

        if (t.type === 'success') {
          bgClass = 'bg-emerald-950 border-emerald-500/60 text-emerald-100';
          Icon = CheckCircle2;
        } else if (t.type === 'danger') {
          bgClass = 'bg-red-950 border-red-500 text-red-100';
          Icon = AlertOctagon;
        } else if (t.type === 'warning') {
          bgClass = 'bg-amber-950 border-amber-500 text-amber-100';
          Icon = AlertTriangle;
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto border rounded-xl p-2.5 shadow-2xl flex items-center justify-between gap-2 text-xs font-semibold animate-fadeIn ${bgClass}`}
            onClick={() => onDismiss(t.id)}
          >
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 shrink-0" />
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-xs opacity-70 hover:opacity-100 px-1"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};
