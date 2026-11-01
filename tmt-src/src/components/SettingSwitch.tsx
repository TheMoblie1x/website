import React from 'react';

/** A labelled on/off setting with a short explanation. Fully keyboard and screen-reader accessible. */
export const SettingSwitch: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}> = ({ label, description, checked, onChange }) => (
  <div className="flex items-start justify-between gap-4 py-3">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      {description && <p className="text-[13px] text-slate-500 mt-0.5 leading-snug">{description}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative shrink-0 mt-0.5 h-6 w-11 rounded-full cursor-pointer transition-colors duration-200 ${
        checked ? 'bg-accent' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);
