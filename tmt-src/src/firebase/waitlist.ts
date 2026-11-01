import { get, ref, remove, serverTimestamp, set } from 'firebase/database';
import { db } from './client';
import { WaitlistInput, WaitlistRow, validateWaitlist, waitlistKey } from '../landing/waitlistLogic';

export type JoinResult = 'joined' | 'duplicate';

/**
 * Adds someone to the public waitlist. Works without signing in.
 * The database rules only allow creating an entry that does not exist yet, so a repeat sign-up
 * (or any attempt to overwrite) is rejected with PERMISSION_DENIED, which we report as "duplicate".
 */
export async function joinWaitlist(input: WaitlistInput): Promise<JoinResult> {
  const v = validateWaitlist(input);
  if (!v.ok) throw new Error(Object.values(v.errors)[0] || 'Check the form and try again.');
  try {
    await set(ref(db, `waitlist/${waitlistKey(v.value.email)}`), { ...v.value, createdAt: serverTimestamp() });
    return 'joined';
  } catch (e) {
    const code = (e as { code?: string; message?: string }).code || (e as Error).message || '';
    if (/permission[_ -]?denied/i.test(code)) return 'duplicate';
    throw e;
  }
}

export interface WaitlistEntry extends WaitlistRow {
  key: string;
}

/** Platform administrators only. Newest first. */
export async function listWaitlist(): Promise<WaitlistEntry[]> {
  const v = ((await get(ref(db, 'waitlist'))).val() || {}) as Record<string, Omit<WaitlistEntry, 'key'>>;
  return Object.entries(v)
    .map(([key, e]) => ({ key, ...e }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function removeWaitlistEntry(key: string): Promise<void> {
  await remove(ref(db, `waitlist/${key}`));
}
