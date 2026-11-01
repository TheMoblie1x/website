/**
 * Data access for companies, team members, invites, plans and subscriptions.
 * Every write that touches more than one path uses a single atomic multi-path update.
 * Who may do what is enforced by firebase/database.rules.json; this module just shapes the data.
 */
import { get, ref, update, set } from 'firebase/database';
import { db } from './client';
import { emailKey, isRole, Role } from '../auth/roles';

export interface CompanyRec {
  id: string;
  name: string;
  slug?: string;
}
export interface MemberRec {
  uid: string;
  email: string;
  name: string;
  role: Role;
}
export interface PendingRec {
  key: string;
  email: string;
  role: Role;
}
export interface PlanLimits {
  assessments: number;
  candidatesPerMonth: number;
  seats: number;
}
export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  currency: string;
  limits: PlanLimits;
  trialDays?: number;
}
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';
export interface Subscription {
  planId: string;
  status: SubscriptionStatus;
  currentPeriodEnd?: number;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAY = 24 * 60 * 60 * 1000;

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'company'
  );
}

/* ---------------------------- companies ---------------------------- */

export async function listCompanies(): Promise<CompanyRec[]> {
  const snap = await get(ref(db, 'companies'));
  const v = (snap.val() || {}) as Record<string, { name?: string; slug?: string }>;
  return Object.entries(v)
    .map(([id, c]) => ({ id, name: c.name || id, slug: c.slug }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Creates the company, its trial subscription and the first owner's invite in one atomic write. */
export async function createCompany(input: {
  name: string;
  ownerEmail: string;
  plan?: Plan | null;
}): Promise<CompanyRec> {
  const name = input.name.trim();
  const email = input.ownerEmail.trim().toLowerCase();
  if (!name) throw new Error('Enter the company name.');
  if (!EMAIL_RE.test(email)) throw new Error('Enter a valid owner email address.');

  const key = emailKey(email);
  if ((await get(ref(db, `pendingMembers/${key}`))).exists()) {
    throw new Error('That email already has a pending invite. Revoke it first, or use another email.');
  }

  const slug = slugify(name);
  let id = `org_${slug}`;
  if ((await get(ref(db, `companies/${id}`))).exists()) id = `${id}_${Math.random().toString(36).slice(2, 6)}`;

  const plan = input.plan;
  const sub: Subscription = {
    planId: plan?.id || 'trial',
    status: 'trialing',
    currentPeriodEnd: Date.now() + (plan?.trialDays ?? 14) * DAY,
  };
  await update(ref(db), {
    [`companies/${id}`]: { name, slug },
    [`subscriptions/${id}`]: sub,
    [`pendingMembers/${key}`]: { companyId: id, role: 'owner' },
    [`companyPending/${id}/${key}`]: { email, role: 'owner' },
  });
  return { id, name, slug };
}

/* ------------------------------ team ------------------------------- */

export async function listTeam(companyId: string): Promise<{ members: MemberRec[]; pending: PendingRec[] }> {
  const membersSnap = await get(ref(db, `companyMembers/${companyId}`));
  const mv = (membersSnap.val() || {}) as Record<string, { email?: string; name?: string; role?: string }>;
  const members = Object.entries(mv)
    .filter(([, m]) => isRole(m.role))
    .map(([uid, m]) => ({ uid, email: m.email || '', name: m.name || m.email || uid, role: m.role as Role }))
    .sort((a, b) => a.name.localeCompare(b.name));

  let pending: PendingRec[] = [];
  try {
    const p = ((await get(ref(db, `companyPending/${companyId}`))).val() || {}) as Record<string, { email?: string; role?: string }>;
    pending = Object.entries(p)
      .filter(([, v]) => isRole(v.role))
      .map(([key, v]) => ({ key, email: v.email || key, role: v.role as Role }));
  } catch {
    // Only owners and platform admins may see pending invites.
  }
  return { members, pending };
}

export async function inviteMember(companyId: string, emailRaw: string, role: Role): Promise<void> {
  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new Error('Enter a valid email address.');
  const key = emailKey(email);
  if ((await get(ref(db, `pendingMembers/${key}`))).exists()) {
    throw new Error('That email already has a pending invite.');
  }
  await update(ref(db), {
    [`pendingMembers/${key}`]: { companyId, role },
    [`companyPending/${companyId}/${key}`]: { email, role },
  });
}

export async function revokeInvite(companyId: string, key: string): Promise<void> {
  await update(ref(db), { [`pendingMembers/${key}`]: null, [`companyPending/${companyId}/${key}`]: null });
}

export async function changeRole(companyId: string, uid: string, role: Role): Promise<void> {
  await update(ref(db), { [`members/${uid}/role`]: role, [`companyMembers/${companyId}/${uid}/role`]: role });
}

export async function removeMember(companyId: string, uid: string): Promise<void> {
  await update(ref(db), { [`members/${uid}`]: null, [`companyMembers/${companyId}/${uid}`]: null });
}

/* ------------------------ plans & subscriptions --------------------- */

export async function listPlans(): Promise<Plan[]> {
  const v = ((await get(ref(db, 'plans'))).val() || {}) as Record<string, Omit<Plan, 'id'>>;
  return Object.entries(v)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => a.priceMonthly - b.priceMonthly);
}

export async function savePlan(plan: Plan): Promise<void> {
  const { id, ...rest } = plan;
  await set(ref(db, `plans/${id}`), rest);
}

export async function getSubscription(companyId: string): Promise<Subscription | null> {
  const v = (await get(ref(db, `subscriptions/${companyId}`))).val();
  return v && typeof v.planId === 'string' ? (v as Subscription) : null;
}

export async function saveSubscription(companyId: string, sub: Subscription): Promise<void> {
  await set(ref(db, `subscriptions/${companyId}`), sub);
}
