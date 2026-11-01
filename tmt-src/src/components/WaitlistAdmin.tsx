import React, { useCallback, useEffect, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { WaitlistEntry, listWaitlist, removeWaitlistEntry } from '../firebase/waitlist';
import { waitlistToCsv } from '../landing/waitlistLogic';
import { secondaryBtn } from './Modal';

const fmt = (ms?: number) =>
  ms ? new Date(ms).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/** Platform administrators only: everyone who joined the public waitlist. */
export const WaitlistAdmin: React.FC = () => {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await listWaitlist());
      setError('');
    } catch {
      setError('Could not load the waitlist.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const download = () => {
    const blob = new Blob(['﻿' + waitlistToCsv(entries)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `takemytest-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const remove = async (key: string) => {
    setConfirmKey(null);
    try {
      await removeWaitlistEntry(key);
      await load();
    } catch {
      setError('Could not remove that entry.');
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Waitlist</h1>
          <p className="text-sm text-slate-600 mt-1">
            {loading ? 'Loading…' : `${entries.length} ${entries.length === 1 ? 'person has' : 'people have'} joined from the landing page.`}
          </p>
        </div>
        <button
          type="button"
          onClick={download}
          disabled={!entries.length}
          className={`${secondaryBtn} flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Download className="w-4 h-4 text-slate-500" />
          Download CSV
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[13px] text-slate-500 border-b border-slate-200">
              <th className="px-6 py-3 font-semibold">Email</th>
              <th className="px-6 py-3 font-semibold">Name</th>
              <th className="px-6 py-3 font-semibold">Company</th>
              <th className="px-6 py-3 font-semibold">Using it as</th>
              <th className="px-6 py-3 font-semibold">Joined</th>
              <th className="px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((e) => (
              <tr key={e.key}>
                <td className="px-6 py-3 font-semibold text-ink break-all">{e.email}</td>
                <td className="px-6 py-3">{e.name || '—'}</td>
                <td className="px-6 py-3">{e.company || '—'}</td>
                <td className="px-6 py-3">{e.interest || '—'}</td>
                <td className="px-6 py-3 text-slate-600 tabular-nums whitespace-nowrap">{fmt(e.createdAt)}</td>
                <td className="px-6 py-3 text-right whitespace-nowrap">
                  {confirmKey === e.key ? (
                    <>
                      <button
                        type="button"
                        onClick={() => remove(e.key)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmKey(null)}
                        className="ml-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmKey(e.key)}
                      aria-label={`Remove ${e.email}`}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && !entries.length && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-slate-500">
                  No one has joined yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
