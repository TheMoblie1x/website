import { emailKey } from '../auth/roles';

export const INTERESTS = ['Hiring team', 'Recruitment agency', 'Education or training', 'Other'] as const;

export const LIMITS = { email: 254, name: 100, company: 100, interest: 40 } as const;

/** Same pattern the database rules enforce, so the form and the server agree. */
export const WAITLIST_EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface WaitlistInput {
  email: string;
  name?: string;
  company?: string;
  interest?: string;
}

export interface WaitlistClean {
  email: string;
  name?: string;
  company?: string;
  interest?: string;
}

export type WaitlistErrors = Partial<Record<'email' | 'name' | 'company' | 'interest', string>>;

export function validateWaitlist(
  input: WaitlistInput
): { ok: true; value: WaitlistClean } | { ok: false; errors: WaitlistErrors } {
  const errors: WaitlistErrors = {};
  const email = (input.email || '').trim().toLowerCase();
  const name = (input.name || '').trim();
  const company = (input.company || '').trim();
  const interest = (input.interest || '').trim();

  if (!email || email.length > LIMITS.email || !WAITLIST_EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (name.length > LIMITS.name) errors.name = `Keep your name under ${LIMITS.name} characters.`;
  if (company.length > LIMITS.company) errors.company = `Keep the company name under ${LIMITS.company} characters.`;
  if (interest && !(INTERESTS as readonly string[]).includes(interest)) errors.interest = 'Choose one of the options.';

  if (Object.keys(errors).length) return { ok: false, errors };

  const value: WaitlistClean = { email };
  if (name) value.name = name;
  if (company) value.company = company;
  if (interest) value.interest = interest;
  return { ok: true, value };
}

export const waitlistKey = (email: string) => emailKey(email);

/**
 * One CSV cell. Quotes are doubled, and values that spreadsheets would treat as a formula
 * (starting with = + - @ or a tab/CR) get a leading apostrophe so they stay plain text.
 */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export interface WaitlistRow {
  email: string;
  name?: string;
  company?: string;
  interest?: string;
  createdAt?: number;
}

export function waitlistToCsv(rows: WaitlistRow[]): string {
  const header = ['Email', 'Name', 'Company', 'Interest', 'Joined (UTC)'].map(csvCell).join(',');
  const lines = rows.map((r) =>
    [
      r.email,
      r.name || '',
      r.company || '',
      r.interest || '',
      r.createdAt ? new Date(r.createdAt).toISOString() : '',
    ]
      .map(csvCell)
      .join(',')
  );
  return [header, ...lines].join('\r\n');
}
