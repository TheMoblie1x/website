import React from 'react';

/** TakeMyTest logo: a check mark inside a rounded square, plus the wordmark. */
export const BrandMark: React.FC<{
  className?: string;
  /** Hide the wordmark and show only the symbol. */
  symbolOnly?: boolean;
  /** Use light text/symbol for dark backgrounds. */
  onDark?: boolean;
}> = ({ className = '', symbolOnly = false, onDark = false }) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      role="img"
      aria-label="TakeMyTest"
      className="shrink-0"
    >
      <rect width="28" height="28" rx="7" fill={onDark ? '#ffffff' : '#0b1220'} />
      <path
        d="M8 14.5l4 4 8-9"
        stroke={onDark ? '#1558d6' : '#5b96f5'}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    {!symbolOnly && (
      <span
        className={`text-[15px] font-bold tracking-tight ${onDark ? 'text-white' : 'text-ink'}`}
      >
        Take<span className={onDark ? 'text-brand-300' : 'text-brand-600'}>MyTest</span>
      </span>
    )}
  </span>
);
