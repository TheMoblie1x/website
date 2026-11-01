import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Building2, CreditCard, ListChecks, Plus } from 'lucide-react';
import { AccountMenu } from '../auth/AuthScreens';
import { useAuth } from '../auth/AuthProvider';
import { BrandMark } from './BrandMark';
import { BillingPanel, formatPrice } from './BillingPanel';
import { TeamPanel } from './TeamPanel';
import { WaitlistAdmin } from './WaitlistAdmin';
import { Field, Modal, inputClass, primaryBtn, secondaryBtn } from './Modal';
import {
  CompanyRec,
  Plan,
  createCompany,
  listCompanies,
  listPlans,
  savePlan,
  slugify,
} from '../firebase/directory';

type Tab = 'COMPANIES' | 'PLANS' | 'WAITLIST';

/** Home screen for platform administrators ("super users"). */
export const PlatformConsole: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('COMPANIES');
  const [companies, setCompanies] = useState<CompanyRec[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<CompanyRec | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [planEdit, setPlanEdit] = useState<Plan | 'new' | null>(null);
  const [detailTab, setDetailTab] = useState<'TEAM' | 'SUBSCRIPTION'>('TEAM');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([listCompanies(), listPlans()]);
      setCompanies(c);
      setPlans(p);
      setError('');
    } catch {
      setError('Could not load data. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tabBtn = (t: Tab, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => {
        setTab(t);
        setSelected(null);
      }}
      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
        tab === t ? 'bg-accent-soft text-accent' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-4 min-w-0">
          <BrandMark />
          <span className="hidden sm:block text-xs text-slate-500 pl-4 border-l border-slate-200">Platform console</span>
          <nav className="flex items-center gap-1 ml-2" aria-label="Platform sections">
            {tabBtn('COMPANIES', 'Companies', <Building2 className="w-3.5 h-3.5" />)}
            {tabBtn('PLANS', 'Plans', <CreditCard className="w-3.5 h-3.5" />)}
            {tabBtn('WAITLIST', 'Waitlist', <ListChecks className="w-3.5 h-3.5" />)}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <AccountMenu />
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {tab === 'COMPANIES' && !selected && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-ink">Companies</h1>
                <p className="text-sm text-slate-600 mt-1">
                  Add a company, invite its owner, and manage its team and subscription.
                </p>
              </div>
              <button type="button" onClick={() => setAddOpen(true)} className={`${primaryBtn} flex items-center gap-2`}>
                <Plus className="w-4 h-4" />
                Add company
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl">
              {loading ? (
                <p role="status" className="px-6 py-5 text-sm text-slate-500">
                  Loading…
                </p>
              ) : companies.length === 0 ? (
                <p className="px-6 py-8 text-sm text-slate-500">No companies yet. Add the first one.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {companies.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(c);
                          setDetailTab('TEAM');
                        }}
                        className="w-full text-left px-6 py-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-4"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-ink truncate">{c.name}</span>
                          <span className="block text-[13px] text-slate-500 font-mono truncate">{c.id}</span>
                        </span>
                        <span className="text-sm font-semibold text-accent shrink-0">Manage</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {tab === 'COMPANIES' && selected && (
          <>
            <div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-sm font-semibold text-slate-600 hover:text-ink flex items-center gap-1.5 cursor-pointer mb-3"
              >
                <ArrowLeft className="w-4 h-4" />
                All companies
              </button>
              <h1 className="text-2xl font-bold tracking-tight text-ink">{selected.name}</h1>
            </div>
            <div className="flex gap-1 border-b border-slate-200" role="tablist">
              {(['TEAM', 'SUBSCRIPTION'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={detailTab === t}
                  onClick={() => setDetailTab(t)}
                  className={`px-4 py-2.5 text-sm font-semibold -mb-px border-b-2 cursor-pointer ${
                    detailTab === t ? 'border-accent text-accent' : 'border-transparent text-slate-600 hover:text-ink'
                  }`}
                >
                  {t === 'TEAM' ? 'Team' : 'Subscription'}
                </button>
              ))}
            </div>
            {detailTab === 'TEAM' ? (
              <TeamPanel companyId={selected.id} canManage currentUid={user?.uid} />
            ) : (
              <BillingPanel companyId={selected.id} canEdit />
            )}
          </>
        )}

        {tab === 'WAITLIST' && <WaitlistAdmin />}

        {tab === 'PLANS' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-ink">Plans</h1>
                <p className="text-sm text-slate-600 mt-1">The plans you can assign to companies, with their limits.</p>
              </div>
              <button type="button" onClick={() => setPlanEdit('new')} className={`${primaryBtn} flex items-center gap-2`}>
                <Plus className="w-4 h-4" />
                Add plan
              </button>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[13px] text-slate-500 border-b border-slate-200">
                    <th className="px-6 py-3 font-semibold">Plan</th>
                    <th className="px-6 py-3 font-semibold">Price</th>
                    <th className="px-6 py-3 font-semibold">Assessments</th>
                    <th className="px-6 py-3 font-semibold">Candidates / month</th>
                    <th className="px-6 py-3 font-semibold">Seats</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {plans.map((p) => (
                    <tr key={p.id}>
                      <td className="px-6 py-3 font-semibold text-ink">{p.name}</td>
                      <td className="px-6 py-3">{formatPrice(p)}</td>
                      <td className="px-6 py-3">{p.limits.assessments}</td>
                      <td className="px-6 py-3">{p.limits.candidatesPerMonth}</td>
                      <td className="px-6 py-3">{p.limits.seats}</td>
                      <td className="px-6 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setPlanEdit(p)}
                          className="text-sm font-semibold text-accent hover:text-accent-hover cursor-pointer"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!plans.length && (
                    <tr>
                      <td colSpan={6} className="px-6 py-6 text-slate-500">
                        No plans yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {addOpen && (
        <AddCompanyModal
          plans={plans}
          onClose={() => setAddOpen(false)}
          onCreated={(c) => {
            setAddOpen(false);
            load();
            setSelected(c);
            setDetailTab('TEAM');
          }}
        />
      )}
      {planEdit && (
        <PlanModal
          plan={planEdit === 'new' ? null : planEdit}
          onClose={() => setPlanEdit(null)}
          onSaved={() => {
            setPlanEdit(null);
            load();
          }}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */

const AddCompanyModal: React.FC<{
  plans: Plan[];
  onClose: () => void;
  onCreated: (c: CompanyRec) => void;
}> = ({ plans, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [planId, setPlanId] = useState(plans.find((p) => p.id === 'trial')?.id || plans[0]?.id || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const c = await createCompany({ name, ownerEmail, plan: plans.find((p) => p.id === planId) || null });
      onCreated(c);
    } catch (e) {
      setError((e as Error).message || 'Could not create the company.');
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Add company"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={primaryBtn} disabled={busy} onClick={submit}>
            {busy ? 'Creating…' : 'Create company'}
          </button>
        </>
      }
    >
      <Field label="Company name" htmlFor="co-name" hint={name ? `ID: org_${slugify(name)}` : undefined}>
        <input id="co-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field
        label="Owner's Google email"
        htmlFor="co-owner"
        hint="They become the company owner when they first sign in with this Google account."
      >
        <input
          id="co-owner"
          type="email"
          className={inputClass}
          value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
          placeholder="owner@gmail.com"
        />
      </Field>
      {plans.length > 0 && (
        <Field label="Starting plan" htmlFor="co-plan">
          <select id="co-plan" className={inputClass} value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({formatPrice(p)})
              </option>
            ))}
          </select>
        </Field>
      )}
      {error && (
        <p role="alert" className="text-[13px] text-red-600">
          {error}
        </p>
      )}
    </Modal>
  );
};

const PlanModal: React.FC<{ plan: Plan | null; onClose: () => void; onSaved: () => void }> = ({
  plan,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState(plan?.name || '');
  const [price, setPrice] = useState(plan?.priceMonthly ?? 0);
  const [currency, setCurrency] = useState(plan?.currency || 'INR');
  const [assessments, setAssessments] = useState(plan?.limits.assessments ?? 5);
  const [candidates, setCandidates] = useState(plan?.limits.candidatesPerMonth ?? 100);
  const [seats, setSeats] = useState(plan?.limits.seats ?? 3);
  const [trialDays, setTrialDays] = useState(plan?.trialDays ?? 0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return setError('Give the plan a name.');
    if (price < 0 || assessments < 1 || candidates < 1 || seats < 1) return setError('Limits must be at least 1 and the price cannot be negative.');
    setBusy(true);
    try {
      await savePlan({
        id: plan?.id || slugify(name),
        name: name.trim(),
        priceMonthly: price,
        currency: currency.trim().toUpperCase() || 'INR',
        limits: { assessments, candidatesPerMonth: candidates, seats },
        trialDays: trialDays > 0 ? trialDays : undefined,
      } as Plan);
      onSaved();
    } catch {
      setError('Could not save the plan.');
      setBusy(false);
    }
  };

  const num = (setter: (n: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => setter(Number(e.target.value));

  return (
    <Modal
      title={plan ? 'Edit plan' : 'Add plan'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={primaryBtn} disabled={busy} onClick={save}>
            Save plan
          </button>
        </>
      }
    >
      <Field label="Plan name" htmlFor="pl-name">
        <input id="pl-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Price per month" htmlFor="pl-price" hint="0 means free.">
          <input id="pl-price" type="number" min={0} className={inputClass} value={price} onChange={num(setPrice)} />
        </Field>
        <Field label="Currency" htmlFor="pl-cur" hint="e.g. INR, USD">
          <input id="pl-cur" className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)} maxLength={3} />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Assessments" htmlFor="pl-ass">
          <input id="pl-ass" type="number" min={1} className={inputClass} value={assessments} onChange={num(setAssessments)} />
        </Field>
        <Field label="Candidates / month" htmlFor="pl-cand">
          <input id="pl-cand" type="number" min={1} className={inputClass} value={candidates} onChange={num(setCandidates)} />
        </Field>
        <Field label="Team seats" htmlFor="pl-seats">
          <input id="pl-seats" type="number" min={1} className={inputClass} value={seats} onChange={num(setSeats)} />
        </Field>
      </div>
      <Field label="Trial length (days)" htmlFor="pl-trial" hint="Leave 0 for no trial.">
        <input id="pl-trial" type="number" min={0} className={inputClass} value={trialDays} onChange={num(setTrialDays)} />
      </Field>
      {error && (
        <p role="alert" className="text-[13px] text-red-600">
          {error}
        </p>
      )}
    </Modal>
  );
};
