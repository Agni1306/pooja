import React from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export const ToastBanner: React.FC = () => {
  const { toast, dismissToast } = useAppContext();

  if (!toast) return null;

  const toneStyles = {
    success: 'bg-[#174C3C] text-white border-[#10372B]',
    info: 'bg-[#242D2A] text-white border-[#242D2A]',
    warning: 'bg-[#E99A43] text-[#242D2A] border-[#D4822A]',
  }[toast.tone];

  const Icon =
    toast.tone === 'success'
      ? CheckCircle2
      : toast.tone === 'warning'
      ? AlertTriangle
      : Info;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100%-2.5rem)]"
    >
      <div
        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all duration-200 ${toneStyles}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className="w-4 h-4 shrink-0" />
          <p className="text-sm font-medium leading-snug">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={dismissToast}
          aria-label="Dismiss notification"
          className="p-1 rounded-lg opacity-80 hover:opacity-100 transition-opacity shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
