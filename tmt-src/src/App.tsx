import React, { useState, useEffect } from 'react';
import { ThemeProvider, useBrand } from './components/ThemeProvider';
import { PreTestBriefing } from './components/PreTestBriefing';
import { TestWorkspace } from './components/TestWorkspace';
import { SubmissionSuccessScreen } from './components/SubmissionSuccessScreen';
import { AdminDashboard } from './components/AdminDashboard';
import {
  getTests,
  saveTests,
  getAttempts,
  saveAttempt,
  getTestById,
} from './utils/storage';
import { CandidateAttempt, Test, RoomSweepAudit, EmailNotification } from './types/testforge';
import { evaluateAttempt } from './utils/scoring';
import { sendSubmissionSummaryEmail, getSentEmails } from './utils/emailService';
import { MockEmailViewerModal } from './components/MockEmailViewerModal';
import { LayoutDashboard, GraduationCap, Mail, ExternalLink } from 'lucide-react';

export default function App() {
  return (
    <ThemeProvider>
      <MainAppContent />
    </ThemeProvider>
  );
}

function MainAppContent() {
  const { brand } = useBrand();

  const [tests, setTests] = useState<Test[]>(() => getTests());
  const [attempts, setAttempts] = useState<CandidateAttempt[]>(() => getAttempts());

  // Active view: 'ADMIN' | 'BRIEFING' | 'TEST' | 'SUBMITTED'
  const [view, setView] = useState<'ADMIN' | 'BRIEFING' | 'TEST' | 'SUBMITTED'>('ADMIN');
  const [activeTestId, setActiveTestId] = useState<string>(() => tests[0]?.id || '');
  const [activeAttempt, setActiveAttempt] = useState<CandidateAttempt | null>(null);

  // Mock Email Notification State
  const [latestEmail, setLatestEmail] = useState<EmailNotification | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailToast, setEmailToast] = useState<{ message: string; receipt: string } | null>(null);

  // Check URL query parameters for ?autostart=1
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('autostart') === '1' && tests[0]) {
        initiateNewAttempt(tests[0], 'Test Candidate', 'candidate@example.com', true);
      }
    }
  }, []);

  const activeTest = tests.find((t) => t.id === activeTestId) || tests[0];

  const initiateNewAttempt = (
    targetTest: Test,
    candidateName: string,
    candidateEmail: string,
    skipBriefing = false,
    roomSweep?: RoomSweepAudit
  ) => {
    const attemptId = `att_${Date.now()}`;
    const initialSectionStates: Record<string, any> = {};

    targetTest.sections.forEach((s, idx) => {
      initialSectionStates[s.id] = {
        sectionId: s.id,
        isUnlocked: targetTest.navigationMode === 'FREE' ? true : idx === 0,
        isCompleted: false,
        timeRemainingSec: s.durationMin * 60,
      };
    });

    const newAttempt: CandidateAttempt = {
      id: attemptId,
      testId: targetTest.id,
      candidateEmail,
      candidateName,
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      infractionCount: 0,
      infractions: [],
      sectionStates: initialSectionStates,
      responses: {},
      roomSweep,
    };

    setActiveAttempt(newAttempt);
    saveAttempt(newAttempt);
    setAttempts(getAttempts());

    if (skipBriefing) {
      setView('TEST');
    } else {
      setView('BRIEFING');
    }
  };

  const handleStartFromBriefing = ({
    name,
    email,
    roomSweep,
  }: {
    name: string;
    email: string;
    roomSweep?: RoomSweepAudit;
  }) => {
    if (!activeAttempt) {
      initiateNewAttempt(activeTest, name, email, true, roomSweep);
    } else {
      const updated = {
        ...activeAttempt,
        candidateName: name,
        candidateEmail: email,
        roomSweep: roomSweep || activeAttempt.roomSweep,
      };
      setActiveAttempt(updated);
      saveAttempt(updated);
      setView('TEST');
    }
  };

  const handleUpdateAttempt = (updated: CandidateAttempt) => {
    setActiveAttempt(updated);
    saveAttempt(updated);
    setAttempts(getAttempts());
  };

  const handleSubmitFinal = (attemptToSubmit: CandidateAttempt) => {
    const evaluated = evaluateAttempt(activeTest, attemptToSubmit);
    const receipt = `TF-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`;

    const finalizedAttempt: CandidateAttempt = {
      ...attemptToSubmit,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      totalScore: evaluated.totalScore,
      maxScore: evaluated.maxScore,
      percentageScore: evaluated.percentage,
      isPassed: evaluated.isPassed,
      confirmationReceipt: receipt,
    };

    setActiveAttempt(finalizedAttempt);
    saveAttempt(finalizedAttempt);
    setAttempts(getAttempts());

    // Trigger Mock Email Notification Service
    const sentEmail = sendSubmissionSummaryEmail(activeTest, finalizedAttempt, brand.name);
    setLatestEmail(sentEmail);
    setEmailToast({
      message: `Official summary report dispatched to ${finalizedAttempt.candidateEmail}`,
      receipt,
    });
    setTimeout(() => setEmailToast(null), 10000);

    setView('SUBMITTED');
  };

  const handleTerminatedMalpractice = (attemptTerminated: CandidateAttempt) => {
    const evaluated = evaluateAttempt(activeTest, attemptTerminated);
    const receipt = `TF-MALPRACTICE-${Date.now().toString().slice(-4)}`;

    const terminatedAttempt: CandidateAttempt = {
      ...attemptTerminated,
      status: 'TERMINATED_MALPRACTICE',
      submittedAt: new Date().toISOString(),
      totalScore: evaluated.totalScore,
      maxScore: evaluated.maxScore,
      percentageScore: evaluated.percentage,
      isPassed: false,
      confirmationReceipt: receipt,
    };

    setActiveAttempt(terminatedAttempt);
    saveAttempt(terminatedAttempt);
    setAttempts(getAttempts());

    // Trigger Mock Email Notification Service for Disqualification Statement
    const sentEmail = sendSubmissionSummaryEmail(activeTest, terminatedAttempt, brand.name);
    setLatestEmail(sentEmail);
    setEmailToast({
      message: `Disqualification statement dispatched to ${terminatedAttempt.candidateEmail}`,
      receipt,
    });
    setTimeout(() => setEmailToast(null), 10000);

    setView('SUBMITTED');
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Floating Demo Role Switcher Bar */}
      <div className="bg-ink text-white px-4 py-2 flex items-center justify-between text-sm z-40">
        <span className="text-slate-300">Preview mode</span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setView('ADMIN')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              view === 'ADMIN'
                ? 'bg-white text-ink'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Admin view</span>
          </button>

          <button
            onClick={() => {
              if (!activeAttempt || activeAttempt.status !== 'IN_PROGRESS') {
                initiateNewAttempt(activeTest, 'Jordan Lee', 'jordan.lee@example.edu', false);
              } else {
                setView('TEST');
              }
            }}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              view === 'TEST' || view === 'BRIEFING'
                ? 'bg-white text-ink'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Candidate view</span>
          </button>
        </div>
      </div>

      {/* Main Content Router */}
      <div className="flex-1">
        {view === 'ADMIN' && (
          <AdminDashboard
            tests={tests}
            onUpdateTests={(newTests) => {
              setTests(newTests);
              saveTests(newTests);
            }}
            attempts={attempts}
            onUpdateAttempts={(newAttempts) => {
              setAttempts(newAttempts);
            }}
            onLaunchCandidateTest={(tId) => {
              setActiveTestId(tId);
              const target = tests.find((t) => t.id === tId) || tests[0];
              initiateNewAttempt(target, 'Jordan Lee', 'jordan.lee@example.edu', false);
            }}
          />
        )}

        {view === 'BRIEFING' && (
          <PreTestBriefing
            test={activeTest}
            defaultCandidateName={activeAttempt?.candidateName || 'Jordan Lee'}
            defaultCandidateEmail={activeAttempt?.candidateEmail || 'jordan.lee@example.edu'}
            initialRoomSweep={activeAttempt?.roomSweep}
            onStart={handleStartFromBriefing}
          />
        )}

        {view === 'TEST' && activeAttempt && (
          <TestWorkspace
            test={activeTest}
            attempt={activeAttempt}
            onUpdateAttempt={handleUpdateAttempt}
            onSubmitAssessment={handleSubmitFinal}
            onTerminatedMalpractice={handleTerminatedMalpractice}
          />
        )}

        {view === 'SUBMITTED' && activeAttempt && (
          <SubmissionSuccessScreen
            test={activeTest}
            attempt={activeAttempt}
            onRetakeOrExit={() => {
              initiateNewAttempt(activeTest, 'Jordan Lee', 'jordan.lee@example.edu', false);
            }}
            onGoToAdmin={() => setView('ADMIN')}
            onViewEmailReport={() => setIsEmailModalOpen(true)}
          />
        )}
      </div>

      {/* Floating Mock Email Dispatch Notification Toast */}
      {emailToast && (
        <aside
          aria-label="Email notification"
          className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 max-w-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 text-white">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white leading-snug truncate">
                {emailToast.message}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Receipt: {emailToast.receipt} • Status: Delivered
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1"
          >
            <span>View Email</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </aside>
      )}

      {/* Mock Email Viewer Modal */}
      <MockEmailViewerModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        initialEmail={latestEmail || undefined}
        allEmails={getSentEmails()}
      />
    </div>
  );
}
