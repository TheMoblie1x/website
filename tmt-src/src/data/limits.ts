import { Plan, PlanLimits, Subscription } from '../firebase/directory';
import { CandidateAttempt } from '../types/testforge';

export interface LimitCheck {
  ok: boolean;
  message: string;
}

/**
 * Plan limits are enforced in the app (these checks) but NOT by the database: Realtime Database rules cannot count
 * records, so a determined user calling the database directly could exceed them. Real enforcement needs a
 * server-side counter or function (paid Firebase plan). Treat this as a guard rail, not a security control.
 */
export function monthStart(now: Date): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
}

export function candidatesThisMonth(attempts: CandidateAttempt[], now: Date): number {
  const from = monthStart(now);
  return attempts.filter((a) => a.candidateUid && a.startedAt && Date.parse(a.startedAt) >= from).length;
}

export function canAddAssessment(limits: PlanLimits | null, currentCount: number): LimitCheck {
  if (!limits) return { ok: true, message: '' };
  if (currentCount >= limits.assessments)
    return { ok: false, message: `Your plan allows ${limits.assessments} assessments and you have ${currentCount}. Upgrade to add more.` };
  return { ok: true, message: '' };
}

export function canInviteCandidates(limits: PlanLimits | null, startedThisMonth: number): LimitCheck {
  if (!limits) return { ok: true, message: '' };
  if (startedThisMonth >= limits.candidatesPerMonth)
    return { ok: false, message: `Your plan allows ${limits.candidatesPerMonth} candidates a month and ${startedThisMonth} have started. Upgrade to invite more.` };
  return { ok: true, message: '' };
}

export function canAddSeat(limits: PlanLimits | null, members: number, pendingInvites: number): LimitCheck {
  if (!limits) return { ok: true, message: '' };
  const used = members + pendingInvites;
  if (used >= limits.seats)
    return { ok: false, message: `Your plan includes ${limits.seats} seats and ${used} are used or invited. Upgrade to add more people.` };
  return { ok: true, message: '' };
}

/** A canceled subscription cannot invite candidates. */
export function subscriptionAllows(sub: Subscription | null): LimitCheck {
  if (sub && sub.status === 'canceled') return { ok: false, message: 'This subscription is canceled. Contact support to reactivate it.' };
  return { ok: true, message: '' };
}

export type { Plan, PlanLimits, Subscription };
