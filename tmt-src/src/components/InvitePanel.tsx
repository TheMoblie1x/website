import React, { useCallback, useEffect, useState } from 'react';
import { Copy, Link2, Trash2 } from 'lucide-react';
import { Test } from '../types/testforge';
import { InviteRecord, createInvite, inviteUrl, listInvites, revokeCandidateInvite } from '../data/companyData';
import { useBrand } from './ThemeProvider';

const fmt = (ms: number) => new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Candidate links for one assessment. Only published assessments can be shared. Each link is an unguessable token;
 * opening it needs no account. The branding at the time of creation is copied into the link.
 */
export const InvitePanel: React.FC<{
  companyId: string;
  test: Test;
  canInvite: boolean;
  /** Plan or subscription reason that stops new links ('' when allowed). */
  blockedReason: string;
}> = ({ companyId, test, canInvite, blockedReason }) => {
  const { brand } = useBrand();
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState(7);
  const [single, setSingle] = useState(false);
  const [label, setLabel] = useState('');
  const [copied, setCopied] = useState('');

  const load = useCallback(async () => {
    try {
      setInvites((await listInvites(companyId)).filter((i) => i.testId === test.id));
      setLoadError('');
    } catch {
      setLoadError('Could not load the links. Check your connection and try again.');
    }
  }, [companyId, test.id]);
  useEffect(() => {
    void load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const rec = await createInvite({ companyId, test, brand, days, single, label });
      setLabel('');
      await copy(rec.token);
      await load();
    } catch (err) {
      const m = (err as Error).message || '';
      setError(
        m.toLowerCase().includes('permission')
          ? 'The database refused the link. Wait a moment for your last change to finish saving, make sure the assessment is published, and try again.'
          : m || 'Could not create the link.'
      );
    } finally {
      setBusy(false);
    }
  };

  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrl(token));
      setCopied(token);
      window.setTimeout(() => setCopied((c) => (c === token ? '' : c)), 3000);
    } catch {
      setError('Could not copy automatically. Select the link and copy it.');
    }
  };

  const revoke = async (token: string) => {
    setBusy(true);
    try {
      await revokeCandidateInvite(companyId, token);
      await load();
    } catch {
      setError('Could not revoke the link.');
    } finally {
      setBusy(false);
    }
  };

  const now = Date.now();
  const unpublished = !test.isPublished;

  return (
    <section aria-label="Candidate links" className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
        <Link2 className="w-4 h-4" aria-hidden="true" /> Candidate links
      </h3>
      <p className="text-[13px] text-slate-500 mt-0.5">
        Send a link to a candidate. They open it, enter their name and email, and take the test. No account is needed.
      </p>

      {canInvite && (
        <form onSubmit={create} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-slate-700">
            Note (optional)
            <input
              value={label}
              maxLength={60}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. October batch"
              className="block mt-1 w-48 px-3 py-2 text-sm border border-slate-300 rounded-lg font-normal"
            />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Valid for
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="block mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg font-normal">
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 pb-2.5">
            <input type="checkbox" checked={single} onChange={(e) => setSingle(e.target.checked)} />
            One candidate only
          </label>
          <button
            type="submit"
            disabled={busy || unpublished || !!blockedReason}
            className="px-4 py-2 bg-cta hover:bg-cta-hover text-ink font-semibold text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Create and copy link
          </button>
        </form>
      )}
      {!canInvite && <p className="text-[13px] text-slate-500 mt-3">Your role cannot create candidate links.</p>}
      {unpublished && <p role="status" className="text-[13px] text-amber-700 mt-2">Publish this assessment first. Only published assessments can be sent to candidates.</p>}
      {blockedReason && <p role="status" className="text-[13px] text-amber-700 mt-2">{blockedReason}</p>}
      {error && <p role="alert" className="text-[13px] text-red-600 mt-2">{error}</p>}
      {loadError && <p role="alert" className="text-[13px] text-red-600 mt-2">{loadError}</p>}

      {invites.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100 border border-slate-200 rounded-lg">
          {invites.map((i) => {
            const state = i.revoked ? 'Revoked' : i.expiresAt <= now ? 'Expired' : 'Active';
            return (
              <li key={i.token} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="text-ink font-medium truncate">
                    {i.label || 'Link'} · <span className={state === 'Active' ? 'text-emerald-700' : 'text-slate-500'}>{state}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Created {fmt(i.createdAt)} · expires {fmt(i.expiresAt)}
                    {i.single ? ' · one candidate' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {state === 'Active' && (
                    <button type="button" onClick={() => copy(i.token)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" /> {copied === i.token ? 'Copied' : 'Copy link'}
                    </button>
                  )}
                  {canInvite && state === 'Active' && (
                    <button type="button" disabled={busy} onClick={() => revoke(i.token)} aria-label="Revoke link" className="px-3 py-1.5 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Revoke
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
