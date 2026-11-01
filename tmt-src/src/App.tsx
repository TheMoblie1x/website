import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { PreTestBriefing } from './components/PreTestBriefing';
import { TestWorkspace } from './components/TestWorkspace';
import { SubmissionSuccessScreen } from './components/SubmissionSuccessScreen';
import { AdminDashboard } from './components/AdminDashboard';
import {
  getActiveOrganization,
  getAttempts,
  getResults,
  getTests,
  loadCompanyData,
  reloadAttempts,
  saveResult,
  saveTests,
  subscribeSync,
  SyncState,
} from './utils/storage';
import { CandidateAttempt, Test } from './types/testforge';
import { buildResult, isFinished } from './data/grading';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { AccountMenu, LoadingScreen, NoAccessScreen, SignInScreen } from './auth/AuthScreens';
import { ROLE_LABELS } from './auth/roles';
import { PlatformConsole } from './components/PlatformConsole';
import { LandingPage } from './landing/LandingPage';
import { PrivacyPage } from './landing/PrivacyPage';
import { CandidateApp } from './candidate/CandidateApp';
import { LayoutDashboard, GraduationCap } from 'lucide-react';

/** A candidate invite link looks like ?invite=<32 hex characters>. */
function inviteTokenFromUrl(): string | null {
  const t = new URLSearchParams(window.location.search).get('invite');
  return t ? t.trim().toLowerCase() : null;
}

export default function App() {
  const token = inviteTokenFromUrl();
  // Candidates never touch the staff sign-in: they use their own session (see firebase/candidateClient.ts).
  if (token) return <CandidateApp token={token} />;
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

/** What signed-out visitors see: the public landing page, the privacy policy, or the staff sign-in screen. */
function PublicSite() {
  const route = () => (window.location.hash === '#sign-in' ? 'signin' : window.location.hash === '#privacy' ? 'privacy' : 'home');
  const [page, setPage] = useState(route);
  // Follow the address bar if someone opens or edits the hash link while the page is already open.
  useEffect(() => {
    const onHash = () => setPage(route());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = (next: 'signin' | 'privacy' | 'home') => {
    setPage(next);
    const hash = next === 'signin' ? '#sign-in' : next === 'privacy' ? '#privacy' : '';
    window.history.replaceState(null, '', window.location.pathname + window.location.search + hash);
    window.scrollTo(0, 0);
  };
  if (page === 'privacy') return <PrivacyPage onBack={() => go('home')} />;
  return page === 'signin' ? (
    <SignInScreen onBack={() => go('home')} />
  ) : (
    <LandingPage onSignIn={() => go('signin')} onPrivacy={() => go('privacy')} />
  );
}

/** Staff must sign in with Google and belong to a company before seeing anything. */
function AuthGate() {
  const { status, isPlatformAdmin, platformView, membership } = useAuth();
  if (status === 'loading') return <LoadingScreen />;
  if (status === 'signedOut') return <PublicSite />;
  if (status === 'noAccess') return <NoAccessScreen />;
  // Platform administrators (super users) get the console; they may also belong to a company.
  if (isPlatformAdmin && (!membership || platformView)) return <PlatformConsole />;
  return <CompanyLoader />;
}

/** Loads the company's data from Firebase before showing the app. */
function CompanyLoader() {
  const { membership } = useAuth();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    loadCompanyData(membership!.companyId, membership!.companyName)
      .then(() => !cancelled && setState('ready'))
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Unknown error');
        setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [membership!.companyId, attempt]);

  if (state === 'loading') return <LoadingScreen />;
  if (state === 'error')
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div role="alert" className="max-w-md bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <h1 className="text-xl font-bold text-ink">We could not load your data</h1>
          <p className="text-sm text-slate-600 mt-2">Check your internet connection and try again. ({error})</p>
          <button
            onClick={() => setAttempt((n) => n + 1)}
            className="mt-5 px-4 py-2 bg-ink text-white rounded-lg text-sm font-semibold cursor-pointer"
          >
            Try again
          </button>
        </div>
      </div>
    );
  return (
    <ThemeProvider initialBrand={getActiveOrganization()}>
      <StaffApp />
    </ThemeProvider>
  );
}

/** Shows whether the last change reached the database. */
function SyncBadge() {
  const [s, setS] = useState<SyncState>({ status: 'idle', message: '' });
  useEffect(() => subscribeSync(setS), []);
  if (s.status === 'error')
    return (
      <span role="alert" className="text-xs bg-red-700 text-white px-2.5 py-1 rounded-md max-w-[40ch] truncate" title={s.message}>
        {s.message}
      </span>
    );
  return (
    <span role="status" className="text-xs text-slate-300">
      {s.status === 'saving' ? 'Saving…' : 'All changes saved'}
    </span>
  );
}

function StaffApp() {
  const { membership, user } = useAuth();
  const role = membership!.role; // AuthGate only renders this once a membership exists

  const [tests, setTests] = useState<Test[]>(() => getTests());
  const [attempts, setAttempts] = useState<CandidateAttempt[]>(() => getAttempts());

  // Active view: 'ADMIN' | 'BRIEFING' | 'TEST' | 'SUBMITTED'. The last three are a staff PREVIEW only.
  const [view, setView] = useState<'ADMIN' | 'BRIEFING' | 'TEST' | 'SUBMITTED'>('ADMIN');
  const [activeTestId, setActiveTestId] = useState<string>(() => tests[0]?.id || '');
  const [activeAttempt, setActiveAttempt] = useState<CandidateAttempt | null>(null);

  const activeTest = tests.find((t) => t.id === activeTestId) || tests[0];

  // Mark finished attempts that have no result yet (objective questions only; written answers wait for an evaluator).
  useEffect(() => {
    let changed = false;
    for (const a of attempts) {
      if (!isFinished(a) || getResults()[a.id]) continue;
      const t = tests.find((x) => x.id === a.testId);
      if (!t) continue;
      saveResult(a.id, buildResult(t, a).result);
      changed = true;
    }
    if (changed) setAttempts(getAttempts());
  }, [attempts, tests]);

  // New submissions arrive while the page is open: refresh every 30 seconds while it is visible.
  useEffect(() => {
    const refresh = () => {
      if (view !== 'ADMIN' || document.hidden) return;
      reloadAttempts().then(() => setAttempts(getAttempts())).catch(() => undefined);
    };
    const id = window.setInterval(refresh, 30000);
    return () => window.clearInterval(id);
  }, [view]);

  const startPreview = (targetTest: Test, name: string, email: string, skipBriefing: boolean) => {
    const initialSectionStates: CandidateAttempt['sectionStates'] = {};
    targetTest.sections.forEach((s, idx) => {
      initialSectionStates[s.id] = {
        sectionId: s.id,
        isUnlocked: targetTest.navigationMode === 'FREE' ? true : idx === 0,
        isCompleted: false,
        timeRemainingSec: s.durationMin * 60,
      };
    });
    // Preview attempts exist only in this tab. They are never written to the database.
    setActiveAttempt({
      id: `preview_${Date.now()}`,
      testId: targetTest.id,
      candidateEmail: email,
      candidateName: name,
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      infractionCount: 0,
      infractions: [],
      sectionStates: initialSectionStates,
      responses: {},
    });
    setView(skipBriefing ? 'TEST' : 'BRIEFING');
  };

  const handleStartFromBriefing = ({ name, email }: { name: string; email: string }) => {
    if (!activeAttempt) {
      startPreview(activeTest, name, email, true);
    } else {
      setActiveAttempt({ ...activeAttempt, candidateName: name, candidateEmail: email });
      setView('TEST');
    }
  };

  const finishPreview = (a: CandidateAttempt, status: 'SUBMITTED' | 'TERMINATED_MALPRACTICE') => {
    const { result } = buildResult(activeTest, { ...a, status });
    setActiveAttempt({
      ...a,
      status,
      submittedAt: new Date().toISOString(),
      totalScore: result.totalScore,
      maxScore: result.maxScore,
      percentageScore: result.percentageScore,
      isPassed: result.isPassed,
      confirmationReceipt: `PREVIEW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    });
    setView('SUBMITTED');
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="bg-ink text-white px-4 py-2 flex items-center justify-between text-sm z-40">
        <span className="text-slate-300 truncate pr-3">
          {membership!.companyName} · {ROLE_LABELS[role]}
        </span>

        <div className="flex items-center gap-1.5">
          <SyncBadge />
          <button
            onClick={() => setView('ADMIN')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              view === 'ADMIN' ? 'bg-white text-ink' : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Admin view</span>
          </button>

          <button
            disabled={!activeTest}
            onClick={() => {
              if (!activeAttempt || activeAttempt.status !== 'IN_PROGRESS') {
                startPreview(activeTest, 'Preview candidate', 'preview@example.com', false);
              } else {
                setView('TEST');
              }
            }}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              view === 'TEST' || view === 'BRIEFING' ? 'bg-white text-ink' : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Preview as candidate</span>
          </button>
          <div className="ml-2">
            <AccountMenu />
          </div>
        </div>
      </div>

      <div className="flex-1">
        {view === 'ADMIN' && (
          <AdminDashboard
            role={role}
            tests={tests}
            onUpdateTests={(newTests) => {
              setTests(newTests);
              saveTests(newTests);
            }}
            attempts={attempts}
            onRefreshAttempts={async () => {
              await reloadAttempts();
              setAttempts(getAttempts());
            }}
            onGraded={() => setAttempts(getAttempts())}
            onLaunchCandidateTest={(tId) => {
              setActiveTestId(tId);
              const target = tests.find((t) => t.id === tId) || tests[0];
              startPreview(target, 'Preview candidate', 'preview@example.com', false);
            }}
            staffEmail={user?.email || ''}
          />
        )}

        {view === 'BRIEFING' && (
          <PreTestBriefing
            test={activeTest}
            defaultCandidateName={activeAttempt?.candidateName || 'Preview candidate'}
            defaultCandidateEmail={activeAttempt?.candidateEmail || 'preview@example.com'}
            onStart={handleStartFromBriefing}
          />
        )}

        {view === 'TEST' && activeAttempt && (
          <TestWorkspace
            test={activeTest}
            attempt={activeAttempt}
            onUpdateAttempt={setActiveAttempt}
            onSubmitAssessment={(a) => finishPreview(a, 'SUBMITTED')}
            onTerminatedMalpractice={(a) => finishPreview(a, 'TERMINATED_MALPRACTICE')}
          />
        )}

        {view === 'SUBMITTED' && activeAttempt && (
          <SubmissionSuccessScreen
            test={activeTest}
            attempt={activeAttempt}
            onRetakeOrExit={() => startPreview(activeTest, 'Preview candidate', 'preview@example.com', false)}
            onGoToAdmin={() => setView('ADMIN')}
          />
        )}
      </div>
    </div>
  );
}
