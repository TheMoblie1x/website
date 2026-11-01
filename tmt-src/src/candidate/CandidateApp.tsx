import React, { useCallback, useEffect, useRef, useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { candidateAuth, candidateDb } from '../firebase/candidateClient';
import {
  InviteSnapshot,
  claimInvite,
  readCandidateAttempt,
  readInvite,
  writeCandidateAttempt,
} from '../data/companyData';
import { INVITE_PROBLEM_TEXT, InviteProblem, inviteProblem, randomToken } from '../data/transform';
import { CandidateAttempt, Organization } from '../types/testforge';
import { ThemeProvider } from '../components/ThemeProvider';
import { PreTestBriefing } from '../components/PreTestBriefing';
import { TestWorkspace, SaveStatus } from '../components/TestWorkspace';
import { CandidateReceiptScreen } from './CandidateReceiptScreen';

type Phase =
  | { kind: 'loading' }
  | { kind: 'problem'; text: string }
  | { kind: 'ready'; invite: InviteSnapshot; uid: string; resume: CandidateAttempt | null };

const attemptKey = (token: string) => `tmt_attempt_${token}`;
const rememberAttempt = (token: string, id: string) => {
  try {
    localStorage.setItem(attemptKey(token), id);
  } catch {
    /* storage can be blocked; resuming just will not work */
  }
};
const recallAttempt = (token: string): string | null => {
  try {
    return localStorage.getItem(attemptKey(token));
  } catch {
    return null;
  }
};

function brandOf(invite: InviteSnapshot): Organization {
  return {
    id: invite.companyId,
    slug: invite.companyId,
    name: invite.brand?.name || 'Assessment',
    logoUrl: invite.brand?.logoUrl || '',
    primaryColor: invite.brand?.primaryColor || '#072D59',
    secondaryColor: invite.brand?.secondaryColor || '#FD6E88',
    fontFamily: invite.brand?.fontFamily || "'Plus Jakarta Sans', sans-serif",
  };
}

export const CandidateApp: React.FC<{ token: string }> = ({ token }) => {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    // A malformed link cannot be valid: say so without contacting the server.
    if (!/^[0-9a-f]{32}$/.test(token)) {
      setPhase({ kind: 'problem', text: INVITE_PROBLEM_TEXT.NOT_FOUND });
      return;
    }
    (async () => {
      try {
        const cred = await signInAnonymously(candidateAuth);
        const invite = await readInvite(candidateDb, token);
        const problem = inviteProblem(invite, Date.now(), cred.user.uid);
        if (cancelled) return;

        // A candidate who reloads must resume their own attempt, even if the link has since expired.
        const remembered = recallAttempt(token);
        let resume: CandidateAttempt | null = null;
        if (invite && remembered) {
          try {
            resume = await readCandidateAttempt(candidateDb, invite.companyId, remembered);
          } catch {
            resume = null;
          }
        }
        if (resume && resume.candidateUid !== cred.user.uid) resume = null;
        if (cancelled) return;

        if (problem && !resume) {
          setPhase({ kind: 'problem', text: INVITE_PROBLEM_TEXT[problem as InviteProblem] });
          return;
        }
        if (!invite) return;
        setPhase({ kind: 'ready', invite, uid: cred.user.uid, resume });
      } catch (e) {
        if (!cancelled)
          setPhase({
            kind: 'problem',
            text: 'We could not open this assessment. Check your internet connection and try again.',
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (phase.kind === 'loading')
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600" role="status">
        Opening your assessment…
      </div>
    );
  if (phase.kind === 'problem')
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div role="alert" className="max-w-md bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <h1 className="text-xl font-bold text-ink">This link can’t be used</h1>
          <p className="text-sm text-slate-600 mt-2">{phase.text}</p>
        </div>
      </div>
    );
  return (
    <ThemeProvider initialBrand={brandOf(phase.invite)} persist={false}>
      <CandidateFlow token={token} invite={phase.invite} uid={phase.uid} resume={phase.resume} />
    </ThemeProvider>
  );
};

const CandidateFlow: React.FC<{ token: string; invite: InviteSnapshot; uid: string; resume: CandidateAttempt | null }> = ({
  token,
  invite,
  uid,
  resume,
}) => {
  const test = invite.test;
  const [attempt, setAttempt] = useState<CandidateAttempt | null>(resume);
  const [view, setView] = useState<'BRIEFING' | 'TEST' | 'DONE'>(
    resume ? (resume.status === 'IN_PROGRESS' ? 'TEST' : 'DONE') : 'BRIEFING'
  );
  const [save, setSave] = useState<SaveStatus>('saved');
  const [startError, setStartError] = useState('');
  const latest = useRef<CandidateAttempt | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const writing = useRef<Promise<void>>(Promise.resolve());

  const flush = useCallback(async (): Promise<boolean> => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    const a = latest.current;
    if (!a) return true;
    setSave('saving');
    writing.current = writing.current.then(async () => {
      try {
        await writeCandidateAttempt(candidateDb, invite.companyId, a);
        setSave(latest.current === a ? 'saved' : 'saving');
      } catch {
        setSave('error');
        throw new Error('write failed');
      }
    });
    try {
      await writing.current;
      return true;
    } catch {
      writing.current = Promise.resolve();
      return false;
    }
  }, [invite.companyId]);

  /** Progress is written to the server at most every ~2 seconds. */
  const schedule = useCallback(
    (a: CandidateAttempt) => {
      latest.current = a;
      if (timer.current === undefined) timer.current = window.setTimeout(() => void flush(), 2000);
    },
    [flush]
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const start = async ({ name, email }: { name: string; email: string }) => {
    setStartError('');
    const sectionStates: CandidateAttempt['sectionStates'] = {};
    test.sections.forEach((s, i) => {
      sectionStates[s.id] = {
        sectionId: s.id,
        isUnlocked: test.navigationMode === 'FREE' ? true : i === 0,
        isCompleted: false,
        timeRemainingSec: s.durationMin * 60,
      };
    });
    const a: CandidateAttempt = {
      id: `att_${randomToken(8)}`,
      testId: test.id,
      candidateEmail: email,
      candidateName: name,
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      infractionCount: 0,
      infractions: [],
      sectionStates,
      responses: {},
      candidateUid: uid,
      inviteToken: token,
    };
    try {
      if (invite.single) await claimInvite(candidateDb, token, uid);
      await writeCandidateAttempt(candidateDb, invite.companyId, a);
    } catch {
      setStartError(
        invite.single
          ? 'This link may already have been used, or you are offline. Check your connection, or ask the organiser for a new link.'
          : 'We could not start your test. Check your internet connection and try again.'
      );
      return;
    }
    rememberAttempt(token, a.id);
    latest.current = a;
    setAttempt(a);
    setView('TEST');
  };

  const finish = async (final: CandidateAttempt) => {
    latest.current = final;
    setAttempt(final);
    const ok = await flush();
    if (!ok) {
      // Keep the candidate on the test with a visible error rather than showing a receipt that was never saved.
      setAttempt({ ...final, status: 'IN_PROGRESS' });
      latest.current = { ...final, status: 'IN_PROGRESS' };
      setSave('error');
      return;
    }
    setView('DONE');
  };

  const receipt = () => `TMT-${randomToken(3).toUpperCase()}-${new Date().getFullYear()}`;

  const handleSubmit = (a: CandidateAttempt) =>
    finish({ ...a, status: 'SUBMITTED', submittedAt: new Date().toISOString(), confirmationReceipt: receipt() });
  const handleTerminated = (a: CandidateAttempt) =>
    finish({ ...a, status: 'TERMINATED_MALPRACTICE', submittedAt: new Date().toISOString(), confirmationReceipt: receipt() });

  if (view === 'BRIEFING')
    return (
      <>
        <PreTestBriefing test={test} defaultCandidateName="" defaultCandidateEmail="" onStart={start} />
        {startError && (
          <div role="alert" className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-700 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg max-w-[90vw]">
            {startError}
          </div>
        )}
      </>
    );
  if (view === 'DONE' && attempt) return <CandidateReceiptScreen attempt={attempt} />;
  if (view === 'TEST' && attempt)
    return (
      <TestWorkspace
        test={test}
        attempt={attempt}
        saveStatus={save}
        onRetrySave={() => void flush()}
        onUpdateAttempt={(a) => {
          setAttempt(a);
          schedule(a);
        }}
        onSubmitAssessment={handleSubmit}
        onTerminatedMalpractice={handleTerminated}
      />
    );
  return null;
};
