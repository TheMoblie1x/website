import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/** Accessible dialog: Escape closes, focus moves in, backdrop click closes, scroll-safe on phones. */
export const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}> = ({ title, onClose, children, footer, wide }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 p-0 sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-white w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-xl shadow-xl outline-none`}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 -mr-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto space-y-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const Field: React.FC<{
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}> = ({ label, hint, error, htmlFor, children }) => (
  <div>
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-800 mb-1.5">
      {label}
    </label>
    {children}
    {error ? (
      <p role="alert" className="text-[13px] text-red-600 mt-1.5">
        {error}
      </p>
    ) : (
      hint && <p className="text-[13px] text-slate-500 mt-1.5">{hint}</p>
    )}
  </div>
);

export const inputClass =
  'w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-ink placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';
export const primaryBtn =
  'px-4 py-2.5 bg-cta hover:bg-cta-hover active:bg-cta-press text-ink font-semibold text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
export const secondaryBtn =
  'px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-lg transition-colors cursor-pointer';
