import React from 'react';

/**
 * TakeMyTest logo: a check mark inside a rounded square, plus the wordmark.
 * Light surfaces: navy square, pink check, "Take" navy + "MyTest" crimson.
 * Dark surfaces (`onDark`): seal-blue square, navy check, white + pink wordmark.
 */
export const BrandMark: React.FC<{
  className?: string;
  /** Hide the wordmark and show only the symbol. */
  symbolOnly?: boolean;
  /** Use the version designed for dark backgrounds. */
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
      <rect width="28" height="28" rx="7" fill={onDark ? '#DBF2FC' : '#072D59'} />
      <path
        d="M8 14.5l4 4 8-9"
        stroke={onDark ? '#072D59' : '#FD6E88'}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    {!symbolOnly && (
      <span className={`text-[15px] font-bold tracking-tight ${onDark ? 'text-white' : 'text-ink'}`}>
        Take<span className={onDark ? 'text-cta' : 'text-cta-text'}>MyTest</span>
      </span>
    )}
  </span>
);
