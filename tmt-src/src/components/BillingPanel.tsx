import React, { useCallback, useEffect, useState } from 'react';
import {
  Plan,
  Subscription,
  SubscriptionStatus,
  getSubscription,
  listPlans,
  saveSubscription,
} from '../firebase/directory';
import { Field, inputClass, primaryBtn } from './Modal';

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trialing: 'Free trial',
  active: 'Active',
  past_due: 'Payment overdue',
  canceled: 'Canceled',
};

const fmtDate = (ms?: number) =>
  ms ? new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const toInputDate = (ms?: number) => (ms ? new Date(ms).toISOString().slice(0, 10) : '');

export const formatPrice = (p: Pick<Plan, 'priceMonthly' | 'currency'>) =>
  p.priceMonthly === 0
    ? 'Free'
    : new Intl.NumberFormat(undefined, { style: 'currency', currency: p.currency || 'INR', maximumFractionDigits: 0 }).format(
        p.priceMonthly
      ) + ' / month';

/**
 * A company's plan and status. Everyone in the company can see it; only a platform admin can change it.
 * Online payment is not connected yet, so plan changes are made by the platform admin.
 */
export const BillingPanel: React.FC<{ companyId: string; canEdit: boolean }> = ({ companyId, canEdit }) => {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<Subscription>({ planId: 'trial', status: 'trialing' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([getSubscription(companyId), listPlans()]);
      setSub(s);
      setPlans(p);
      if (s) setDraft(s);
      setError('');
    } catch {
      setError('Could not load billing details.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const plan = plans.find((p) => p.id === sub?.planId);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    try {
      await saveSubscription(companyId, draft);
      setSaved(true);
      await load();
    } catch {
      setError('Could not save the subscription.');
    }
  };

  if (loading)
    return (
      <p role="status" className="text-sm text-slate-500">
        Loading…
      </p>
    );

  return (
    <section aria-label="Subscription" className="space-y-6">
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-ink">Current plan</h3>
        {sub ? (
          <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-[13px] text-slate-500">Plan</dt>
              <dd className="font-semibold text-ink">{plan?.name || sub.planId}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-slate-500">Status</dt>
              <dd className="font-semibold text-ink">{STATUS_LABEL[sub.status] || sub.status}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-slate-500">{sub.status === 'trialing' ? 'Trial ends' : 'Renews'}</dt>
              <dd className="font-semibold text-ink tabular-nums">{fmtDate(sub.currentPeriodEnd)}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-slate-500">Price</dt>
              <dd className="font-semibold text-ink">{plan ? formatPrice(plan) : '—'}</dd>
            </div>
            {plan && (
              <>
                <div>
                  <dt className="text-[13px] text-slate-500">Assessments</dt>
                  <dd className="font-semibold text-ink tabular-nums">{plan.limits.assessments}</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-slate-500">Candidates / month</dt>
                  <dd className="font-semibold text-ink tabular-nums">{plan.limits.candidatesPerMonth}</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-slate-500">Team seats</dt>
                  <dd className="font-semibold text-ink tabular-nums">{plan.limits.seats}</dd>
                </div>
              </>
            )}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No subscription has been set up for this company yet.</p>
        )}
        {!canEdit && (
          <p className="mt-5 text-[13px] text-slate-500 border-t border-slate-100 pt-4">
            Online payment is not available yet. To change your plan, contact the TakeMyTest administrator.
          </p>
        )}
      </div>

      {canEdit && (
        <form onSubmit={save} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-ink">Set subscription</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Plan" htmlFor="sub-plan">
              <select
                id="sub-plan"
                className={inputClass}
                value={draft.planId}
                onChange={(e) => setDraft({ ...draft, planId: e.target.value })}
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatPrice(p)})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status" htmlFor="sub-status">
              <select
                id="sub-status"
                className={inputClass}
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as SubscriptionStatus })}
              >
                {(Object.keys(STATUS_LABEL) as SubscriptionStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={draft.status === 'trialing' ? 'Trial ends' : 'Next renewal'} htmlFor="sub-end">
              <input
                id="sub-end"
                type="date"
                className={inputClass}
                value={toInputDate(draft.currentPeriodEnd)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    currentPeriodEnd: e.target.value ? new Date(e.target.value + 'T23:59:59').getTime() : undefined,
                  })
                }
              />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className={primaryBtn}>
              Save subscription
            </button>
            {saved && (
              <p role="status" className="text-sm text-slate-600">
                Saved.
              </p>
            )}
          </div>
        </form>
      )}
    </section>
  );
};
