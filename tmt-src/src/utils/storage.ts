/**
 * Synchronous cache over the company's Firebase data, so existing screens keep their simple API.
 *
 *  - `loadCompanyData` fills the cache after sign-in (tests, attempts, results, branding).
 *  - `saveTests` / `saveBrand` update the cache immediately and write through to Firebase in order.
 *  - Sync progress and failures are reported through `subscribeSync` so the UI can show them.
 *
 * Nothing here uses localStorage as a source of truth. Preview attempts made by staff are never written.
 */
import { CandidateAttempt, Organization, Test } from '../types/testforge';
import { loadAttempts, loadCompany, persistBrand, persistResult, persistTests, brandFrom } from '../data/companyData';
import { AttemptResult, withResult } from '../data/transform';

export interface SyncState {
  status: 'idle' | 'saving' | 'error';
  message: string;
}

let cid: string | null = null;
let tests: Test[] = [];
let attempts: CandidateAttempt[] = [];
let results: Record<string, AttemptResult> = {};
let brand: Organization = brandFrom('none', 'Your company', null);
let sync: SyncState = { status: 'idle', message: '' };
let pending = 0;
let chain: Promise<void> = Promise.resolve();
const listeners = new Set<(s: SyncState) => void>();

function setSync(s: SyncState) {
  sync = s;
  listeners.forEach((l) => l(s));
}
export function subscribeSync(l: (s: SyncState) => void): () => void {
  listeners.add(l);
  l(sync);
  return () => listeners.delete(l);
}
export function getSyncState(): SyncState {
  return sync;
}

/** Runs writes one after another; reports the first failure and keeps going so later saves are not lost. */
function enqueue(job: () => Promise<void>) {
  pending++;
  setSync({ status: 'saving', message: '' });
  chain = chain.then(job).then(
    () => {
      pending--;
      if (pending === 0 && sync.status !== 'error') setSync({ status: 'idle', message: '' });
    },
    (e: unknown) => {
      pending--;
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setSync({ status: 'error', message: `Your last change could not be saved (${msg}). Reload the page before continuing.` });
    }
  );
}

export async function loadCompanyData(companyId: string, companyName: string): Promise<void> {
  const snap = await loadCompany(companyId, companyName);
  cid = companyId;
  tests = snap.tests;
  results = snap.results;
  attempts = snap.attempts.map((a) => withResult(a, results[a.id]));
  brand = snap.brand;
  setSync({ status: 'idle', message: '' });
}

/** Pulls new submissions and marks from Firebase. Local results that are not saved yet are kept. */
export async function reloadAttempts(): Promise<void> {
  if (!cid) return;
  const snap = await loadAttempts(cid);
  results = { ...snap.results, ...results };
  attempts = snap.attempts.map((a) => withResult(a, results[a.id]));
}

export function getTests(): Test[] {
  return tests;
}
export function saveTests(next: Test[]) {
  if (!cid) return;
  const previous = tests;
  tests = next;
  const company = cid;
  enqueue(() => persistTests(company, previous, next));
}
export function getTestById(testId: string): Test | undefined {
  return tests.find((t) => t.id === testId);
}

export function getAttempts(): CandidateAttempt[] {
  return attempts;
}
export function getResults(): Record<string, AttemptResult> {
  return results;
}

/** Records a result (auto or manual) and refreshes the attempt shown in lists. */
export function saveResult(attemptId: string, result: AttemptResult) {
  if (!cid) return;
  results = { ...results, [attemptId]: result };
  attempts = attempts.map((a) => (a.id === attemptId ? withResult(a, result) : a));
  const company = cid;
  enqueue(() => persistResult(company, attemptId, result));
}

export function getActiveOrganization(): Organization {
  return brand;
}
export function saveBrand(next: Organization) {
  brand = next;
  if (!cid) return;
  const company = cid;
  enqueue(() => persistBrand(company, next));
}

// Simple DJB2 checksum used to detect whether answers changed between autosaves (not a security control).
export function computePayloadSignature(payload: string): string {
  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash * 33) ^ payload.charCodeAt(i);
  }
  return 'sig_' + (hash >>> 0).toString(16);
}
