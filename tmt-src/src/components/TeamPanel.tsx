import React, { useCallback, useEffect, useState } from 'react';
import { canAddSeat } from '../data/limits';
import { Trash2, X } from 'lucide-react';
import { ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, Role } from '../auth/roles';
import {
  MemberRec,
  PendingRec,
  changeRole,
  inviteMember,
  listTeam,
  removeMember,
  revokeInvite,
} from '../firebase/directory';
import { inputClass, primaryBtn } from './Modal';

/** Team members and pending invites for one company. Only owners / platform admins can change anything. */
export const TeamPanel: React.FC<{
  companyId: string;
  canManage: boolean;
  /** The signed-in person, so they cannot remove or demote themselves. */
  currentUid?: string;
  /** Plan seat limit (guard rail, enforced in the app only). */
  seatLimit?: number | null;
}> = ({ companyId, canManage, currentUid, seatLimit }) => {
  const [members, setMembers] = useState<MemberRec[]>([]);
  const [pending, setPending] = useState<PendingRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('manager');
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const t = await listTeam(companyId);
      setMembers(t.members);
      setPending(t.pending);
      setError('');
    } catch {
      setError('Could not load the team. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError((e as Error).message || 'That did not work. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const ownerCount = members.filter((m) => m.role === 'owner').length;

  const invite = (e: React.FormEvent) => {
    e.preventDefault();
    const seats = canAddSeat(seatLimit ? { assessments: 0, candidatesPerMonth: 0, seats: seatLimit } : null, members.length, pending.length);
    if (!seats.ok) {
      setError(seats.message);
      return;
    }
    run(async () => {
      await inviteMember(companyId, email, role);
      setEmail('');
    });
  };

  return (
    <section aria-label="Team" className="space-y-6">
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-ink">People</h3>
        </div>
        {loading ? (
          <p role="status" className="px-6 py-5 text-sm text-slate-500">
            Loading…
          </p>
        ) : members.length === 0 ? (
          <p className="px-6 py-5 text-sm text-slate-500">
            No one has signed in yet. Invite someone below and they will appear here after their first sign-in.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {members.map((m) => {
              const isSelf = m.uid === currentUid;
              const lastOwner = m.role === 'owner' && ownerCount <= 1;
              const locked = !canManage || isSelf || lastOwner;
              return (
                <li key={m.uid} className="px-6 py-3 flex flex-wrap items-center gap-3 justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">
                      {m.name}
                      {isSelf && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}
                    </p>
                    <p className="text-[13px] text-slate-500 truncate">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage ? (
                      <select
                        aria-label={`Role for ${m.name}`}
                        value={m.role}
                        disabled={locked || busy}
                        title={
                          isSelf
                            ? 'You cannot change your own role'
                            : lastOwner
                            ? 'A company needs at least one owner'
                            : undefined
                        }
                        onChange={(e) => run(() => changeRole(companyId, m.uid, e.target.value as Role))}
                        className="px-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded-lg disabled:opacity-60"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-slate-700">{ROLE_LABELS[m.role]}</span>
                    )}
                    {canManage &&
                      (confirmRemove === m.uid ? (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setConfirmRemove(null);
                              run(() => removeMember(companyId, m.uid));
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                          >
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRemove(null)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={locked || busy}
                          onClick={() => setConfirmRemove(m.uid)}
                          aria-label={`Remove ${m.name}`}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {canManage && (
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-ink">Invite someone</h3>
            <p className="text-[13px] text-slate-500 mt-0.5">
              They sign in with this Google account and get the role you choose automatically.
            </p>
          </div>
          <form onSubmit={invite} className="px-6 py-5 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-start">
            <div>
              <label htmlFor="invite-email" className="sr-only">
                Google email address
              </label>
              <input
                id="invite-email"
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="invite-role" className="sr-only">
                Role
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className={inputClass}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={busy} className={primaryBtn}>
              Send invite
            </button>
            <p className="sm:col-span-3 text-[13px] text-slate-500">{ROLE_DESCRIPTIONS[role]}</p>
          </form>

          {pending.length > 0 && (
            <div className="border-t border-slate-200">
              <p className="px-6 pt-4 text-[13px] font-semibold text-slate-700">Waiting for first sign-in</p>
              <ul className="divide-y divide-slate-100">
                {pending.map((p) => (
                  <li key={p.key} className="px-6 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-ink truncate">{p.email}</p>
                      <p className="text-[13px] text-slate-500">{ROLE_LABELS[p.role]}</p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => revokeInvite(companyId, p.key))}
                      aria-label={`Revoke invite for ${p.email}`}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
