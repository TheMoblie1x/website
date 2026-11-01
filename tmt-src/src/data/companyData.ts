/**
 * Firebase access for a company's assessments, attempts, results, branding and candidate invite links.
 * Who may read or write what is enforced by firebase/database.rules.json; this module only shapes the data.
 */
import { Database, get, ref, set, update } from 'firebase/database';
import { db } from '../firebase/client';
import { CandidateAttempt, Organization, Test } from '../types/testforge';
import {
  AnswerKeys,
  AttemptResult,
  InviteBrand,
  attemptForWrite,
  mergeTest,
  normalizeAttempt,
  normalizeTest,
  randomToken,
  splitTest,
  stripUndefined,
} from './transform';

export const DEFAULT_BRAND: Omit<Organization, 'id' | 'slug' | 'name'> = {
  logoUrl: '',
  primaryColor: '#072D59',
  secondaryColor: '#FD6E88',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

export interface CompanySnapshot {
  tests: Test[];
  attempts: CandidateAttempt[];
  results: Record<string, AttemptResult>;
  brand: Organization;
}

function toList<T>(v: unknown): T[] {
  return v && typeof v === 'object' ? (Object.values(v as Record<string, T>) as T[]) : [];
}

export function brandFrom(cid: string, companyName: string, raw: Partial<Organization> | null | undefined): Organization {
  return {
    id: cid,
    slug: raw?.slug || cid,
    name: raw?.name || companyName,
    logoUrl: raw?.logoUrl ?? DEFAULT_BRAND.logoUrl,
    faviconUrl: raw?.faviconUrl,
    primaryColor: raw?.primaryColor || DEFAULT_BRAND.primaryColor,
    secondaryColor: raw?.secondaryColor || DEFAULT_BRAND.secondaryColor,
    fontFamily: raw?.fontFamily || DEFAULT_BRAND.fontFamily,
  };
}

/** Staff load: sanitized tests + answer keys (merged into full tests), attempts, results, branding. */
export async function loadCompany(cid: string, companyName: string): Promise<CompanySnapshot> {
  const [testsSnap, keysSnap, attemptsSnap, resultsSnap, brandSnap] = await Promise.all([
    get(ref(db, `tests/${cid}`)),
    get(ref(db, `answerKeys/${cid}`)),
    get(ref(db, `attempts/${cid}`)),
    get(ref(db, `results/${cid}`)),
    get(ref(db, `companies/${cid}/branding`)),
  ]);
  const keysByTest = (keysSnap.val() || {}) as Record<string, AnswerKeys>;
  const tests = toList<Test>(testsSnap.val()).map((t) => mergeTest(normalizeTest(t), keysByTest[t.id] || {}));
  const attempts = toList<CandidateAttempt>(attemptsSnap.val()).map(normalizeAttempt);
  attempts.sort((a, b) => (b.submittedAt || b.startedAt || '').localeCompare(a.submittedAt || a.startedAt || ''));
  return {
    tests,
    attempts,
    results: (resultsSnap.val() || {}) as Record<string, AttemptResult>,
    brand: brandFrom(cid, companyName, brandSnap.val()),
  };
}

/** Re-reads attempts and results (new submissions arrive while staff have the page open). */
export async function loadAttempts(cid: string): Promise<{ attempts: CandidateAttempt[]; results: Record<string, AttemptResult> }> {
  const [attemptsSnap, resultsSnap] = await Promise.all([get(ref(db, `attempts/${cid}`)), get(ref(db, `results/${cid}`))]);
  const attempts = toList<CandidateAttempt>(attemptsSnap.val()).map(normalizeAttempt);
  attempts.sort((a, b) => (b.submittedAt || b.startedAt || '').localeCompare(a.submittedAt || a.startedAt || ''));
  return { attempts, results: (resultsSnap.val() || {}) as Record<string, AttemptResult> };
}

/** Writes changed/new tests and removes deleted ones, in one atomic multi-path update. */
export async function persistTests(cid: string, previous: Test[], next: Test[]): Promise<void> {
  const prevById = new Map(previous.map((t) => [t.id, JSON.stringify(t)]));
  const updates: Record<string, unknown> = {};
  for (const t of next) {
    if (prevById.get(t.id) === JSON.stringify(t)) continue;
    const { publicTest, keys } = splitTest(t);
    updates[`tests/${cid}/${t.id}`] = stripUndefined(publicTest);
    updates[`answerKeys/${cid}/${t.id}`] = Object.keys(keys).length ? stripUndefined(keys) : null;
  }
  const nextIds = new Set(next.map((t) => t.id));
  for (const id of prevById.keys()) {
    if (!nextIds.has(id)) {
      updates[`tests/${cid}/${id}`] = null;
      updates[`answerKeys/${cid}/${id}`] = null;
    }
  }
  if (Object.keys(updates).length) await update(ref(db), updates);
}

export async function persistBrand(cid: string, brand: Organization): Promise<void> {
  const { id: _id, ...rest } = brand;
  await set(ref(db, `companies/${cid}/branding`), stripUndefined(rest));
}

export async function persistResult(cid: string, attemptId: string, result: AttemptResult): Promise<void> {
  await set(ref(db, `results/${cid}/${attemptId}`), stripUndefined(result));
}

/* ------------------------- candidate invite links ------------------------- */

export interface InviteRecord {
  token: string;
  companyId: string;
  testId: string;
  testTitle: string;
  createdAt: number;
  expiresAt: number;
  single: boolean;
  revoked?: boolean;
  label?: string;
}

export interface InviteSnapshot {
  companyId: string;
  testId: string;
  expiresAt: number;
  single?: boolean;
  claimedBy?: string;
  revoked?: boolean;
  test: Test;
  brand: InviteBrand;
}

export function inviteBrand(b: Organization): InviteBrand {
  return {
    name: b.name,
    logoUrl: b.logoUrl,
    primaryColor: b.primaryColor,
    secondaryColor: b.secondaryColor,
    fontFamily: b.fontFamily,
  };
}

/**
 * Creates an unguessable (128-bit) link for ONE published test. The invite holds a sanitized snapshot of the test
 * (no answers) and the company's branding, so a candidate never reads anything else.
 */
export async function createInvite(input: {
  companyId: string;
  test: Test;
  brand: Organization;
  days: number;
  single: boolean;
  label?: string;
}): Promise<InviteRecord> {
  if (!input.test.isPublished) throw new Error('Publish this assessment before inviting candidates.');
  const token = randomToken();
  const now = Date.now();
  const expiresAt = now + Math.max(1, input.days) * 24 * 60 * 60 * 1000;
  const { publicTest } = splitTest(input.test);
  const label = input.label?.trim() || undefined;
  const rec: InviteRecord = {
    token,
    companyId: input.companyId,
    testId: input.test.id,
    testTitle: input.test.title,
    createdAt: now,
    expiresAt,
    single: input.single,
    label,
  };
  await update(ref(db), {
    [`invites/${token}`]: stripUndefined({
      companyId: input.companyId,
      testId: input.test.id,
      expiresAt,
      single: input.single,
      createdAt: now,
      test: publicTest,
      brand: inviteBrand(input.brand),
    }),
    [`companyInvites/${input.companyId}/${token}`]: stripUndefined({
      testId: input.test.id,
      testTitle: input.test.title,
      createdAt: now,
      expiresAt,
      single: input.single,
      label,
    }),
  });
  return rec;
}

export async function listInvites(companyId: string): Promise<InviteRecord[]> {
  const v = ((await get(ref(db, `companyInvites/${companyId}`))).val() || {}) as Record<string, Omit<InviteRecord, 'token' | 'companyId'>>;
  return Object.entries(v)
    .map(([token, r]) => ({ token, companyId, ...r }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function revokeCandidateInvite(companyId: string, token: string): Promise<void> {
  await update(ref(db), { [`invites/${token}/revoked`]: true, [`companyInvites/${companyId}/${token}/revoked`]: true });
}

export function inviteUrl(token: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}?invite=${token}`;
}

/** Candidate side: read an invite by its token (the token is the only secret). */
export async function readInvite(database: Database, token: string): Promise<InviteSnapshot | null> {
  if (!/^[0-9a-f]{32}$/.test(token)) return null;
  const v = (await get(ref(database, `invites/${token}`))).val();
  if (!v || typeof v !== 'object' || !v.test) return null;
  return { ...v, test: normalizeTest(v.test) } as InviteSnapshot;
}

/** Candidate side: write the attempt (never contains scores; the rules forbid them). */
export async function writeCandidateAttempt(database: Database, companyId: string, attempt: CandidateAttempt): Promise<void> {
  await set(ref(database, `attempts/${companyId}/${attempt.id}`), attemptForWrite(attempt));
}

/** Candidate side: load an attempt this browser started earlier (rules allow a candidate to read only their own). */
export async function readCandidateAttempt(database: Database, companyId: string, attemptId: string): Promise<CandidateAttempt | null> {
  const v = (await get(ref(database, `attempts/${companyId}/${attemptId}`))).val();
  return v ? normalizeAttempt(v as CandidateAttempt) : null;
}

/** Single-use links: the first candidate to claim wins; the rules reject a second claimant. */
export async function claimInvite(database: Database, token: string, uid: string): Promise<void> {
  await set(ref(database, `invites/${token}/claimedBy`), uid);
}
