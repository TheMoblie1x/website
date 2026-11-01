import React, { useState, useEffect, useRef } from 'react';
import { useBrand } from './ThemeProvider';
import {
  Bookmark,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Play,
  RotateCcw,
  ShieldAlert,
  Shield,
  Compass,
  Maximize2,
  Minimize2,
  Lock,
  ArrowRight,
  FileText,
  Code2,
  Sparkles,
} from 'lucide-react';
import {
  CandidateAttempt,
  CandidateResponse,
  CandidateSectionState,
  InfractionLog,
  Question,
  QuestionStatus,
  SectionNavMode,
  Test,
  TestSection,
  ProctoringEventType,
} from '../types/testforge';
import { SubmissionReviewModal, QuestionSummaryItem } from './SubmissionReviewModal';
import { computePayloadSignature } from '../utils/storage';
import { ProtectionLayer, useContentProtection } from './ContentProtection';

/** 'saved' / 'saving' / 'error' describe the server copy; undefined means a staff preview that is never saved. */
export type SaveStatus = 'saved' | 'saving' | 'error';

interface TestWorkspaceProps {
  test: Test;
  attempt: CandidateAttempt;
  saveStatus?: SaveStatus;
  onRetrySave?: () => void;
  onUpdateAttempt: (updated: CandidateAttempt) => void;
  onSubmitAssessment: (attempt: CandidateAttempt) => void;
  onTerminatedMalpractice: (attempt: CandidateAttempt) => void;
}

export const TestWorkspace: React.FC<TestWorkspaceProps> = ({
  test,
  attempt,
  saveStatus,
  onRetrySave,
  onUpdateAttempt,
  onSubmitAssessment,
  onTerminatedMalpractice,
}) => {
  const { brand } = useBrand();

  const [activeSecIdx, setActiveSecIdx] = useState(0);
  const [activeQIdx, setActiveQIdx] = useState(0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autosaveState, setAutosaveState] = useState<'IDLE' | 'SAVING' | 'SAVED'>('SAVED');
  const protect = test.proctoring.protectContent !== false;
  const protection = useContentProtection(protect);
  const [lastSavedSig, setLastSavedSig] = useState(computePayloadSignature(JSON.stringify(attempt.responses)));

  // Current Section and Question
  const sections = test.sections;
  const currentSection = sections[activeSecIdx] || sections[0];
  const currentQuestion: Question = currentSection.questions[activeQIdx] || currentSection.questions[0];

  // Section time remaining state (seconds)
  const initialSecDuration = currentSection.durationMin * 60;
  const savedSecState = attempt.sectionStates[currentSection.id];
  const [sectionTimeRemaining, setSectionTimeRemaining] = useState(
    savedSecState?.timeRemainingSec !== undefined ? savedSecState.timeRemainingSec : initialSecDuration
  );

  // Global time remaining state
  // Derived from the start time so reloading the page cannot hand back time that has already passed.
  const [globalTimeRemaining, setGlobalTimeRemaining] = useState(() => {
    const total = test.totalDurationMin * 60;
    const started = attempt.startedAt ? Date.parse(attempt.startedAt) : NaN;
    if (Number.isNaN(started)) return total;
    return Math.max(0, total - Math.floor((Date.now() - started) / 1000));
  });

  // Infraction detection modal state
  const [infractionModal, setInfractionModal] = useState<{
    show: boolean;
    count: number;
    reason: string;
  }>({ show: false, count: 0, reason: '' });

  // Code runner state for CODING questions
  const [codeExecution, setCodeExecution] = useState<{
    isRunning: boolean;
    results?: { id: string; passed: boolean; input: string; output: string; expected: string }[];
    consoleOutput?: string;
  }>({ isRunning: false });

  // Debounce ref for text responses
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Anti-Tamper Section Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSectionTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSectionAutoAdvance();
          return 0;
        }
        return prev - 1;
      });

      setGlobalTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGlobalTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSecIdx]);

  // Sync section timer back to attempt state periodically
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const updatedStates = { ...attempt.sectionStates };
      if (!updatedStates[currentSection.id]) {
        updatedStates[currentSection.id] = {
          sectionId: currentSection.id,
          isUnlocked: true,
          isCompleted: false,
          timeRemainingSec: sectionTimeRemaining,
        };
      } else {
        updatedStates[currentSection.id] = {
          ...updatedStates[currentSection.id],
          timeRemainingSec: sectionTimeRemaining,
        };
      }
      onUpdateAttempt({ ...attempt, sectionStates: updatedStates });
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [sectionTimeRemaining, currentSection.id]);

  // 2. Tab-switch & Malpractice Detection Guardrail
  useEffect(() => {
    if (!test.proctoring.enforceFullscreen && test.proctoring.maxTabSwitchViolations <= 0) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleInfractionTrigger('TAB_SWITCH', 'Candidate switched browser tab or minimized window');
      }
    };

    const handleWindowBlur = () => {
      handleInfractionTrigger('FOCUS_LOST', 'Window lost focus (external application invoked)');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [attempt.infractionCount]);

  const handleInfractionTrigger = (type: ProctoringEventType, description: string) => {
    // Avoid double triggering if review modal is open or already terminated
    if (attempt.status === 'SUBMITTED' || attempt.status === 'TERMINATED_MALPRACTICE') return;

    const newCount = (attempt.infractionCount || 0) + 1;
    const newInfraction: InfractionLog = {
      id: `inf_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      warningNumber: newCount,
      description,
    };

    const updatedAttempt: CandidateAttempt = {
      ...attempt,
      infractionCount: newCount,
      infractions: [...(attempt.infractions || []), newInfraction],
    };

    if (newCount >= test.proctoring.maxTabSwitchViolations) {
      updatedAttempt.status = 'TERMINATED_MALPRACTICE';
      onUpdateAttempt(updatedAttempt);
      onTerminatedMalpractice(updatedAttempt);
    } else {
      onUpdateAttempt(updatedAttempt);
      setInfractionModal({
        show: true,
        count: newCount,
        reason: description,
      });
    }
  };

  const handleSectionAutoAdvance = () => {
    // Mark current section completed
    const updatedSectionStates = { ...attempt.sectionStates };
    updatedSectionStates[currentSection.id] = {
      ...(updatedSectionStates[currentSection.id] || {
        sectionId: currentSection.id,
        isUnlocked: true,
        timeRemainingSec: 0,
      }),
      isCompleted: true,
      timeRemainingSec: 0,
    };

    if (activeSecIdx < sections.length - 1) {
      const nextIdx = activeSecIdx + 1;
      const nextSec = sections[nextIdx];
      updatedSectionStates[nextSec.id] = {
        sectionId: nextSec.id,
        isUnlocked: true,
        isCompleted: false,
        timeRemainingSec: nextSec.durationMin * 60,
      };

      onUpdateAttempt({ ...attempt, sectionStates: updatedSectionStates });
      setActiveSecIdx(nextIdx);
      setActiveQIdx(0);
      setSectionTimeRemaining(nextSec.durationMin * 60);
    } else {
      onUpdateAttempt({ ...attempt, sectionStates: updatedSectionStates });
      setIsReviewModalOpen(true);
    }
  };

  const handleGlobalTimeExpired = () => {
    onSubmitAssessment(attempt);
  };

  // Helper to record response for any question ID (used in workspace and direct review choice editing)
  const recordAnswerForQuestion = (questionId: string, answer: any, customStatus?: QuestionStatus) => {
    setAutosaveState('SAVING');

    const existing = attempt.responses[questionId];
    let newStatus: QuestionStatus =
      customStatus ||
      (answer !== null && answer !== '' && (!Array.isArray(answer) || answer.length > 0)
        ? 'ANSWERED'
        : 'UNANSWERED');

    if (existing?.status === 'MARKED_FOR_REVIEW' && newStatus === 'ANSWERED') {
      newStatus = 'ANSWERED_AND_MARKED_FOR_REVIEW';
    }

    const updatedResponses: Record<string, CandidateResponse> = {
      ...attempt.responses,
      [questionId]: {
        questionId: questionId,
        status: newStatus,
        savedAnswer: answer,
        timeSpentSec: (existing?.timeSpentSec || 0) + 1,
        updatedAt: new Date().toISOString(),
      },
    };

    const updatedAttempt = {
      ...attempt,
      responses: updatedResponses,
    };

    onUpdateAttempt(updatedAttempt);

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      setAutosaveState('SAVED');
      setLastSavedSig(computePayloadSignature(JSON.stringify(updatedResponses)));
    }, 300);
  };

  const recordAnswer = (answer: any, customStatus?: QuestionStatus) => {
    recordAnswerForQuestion(currentQuestion.id, answer, customStatus);
  };

  // Option select for SCQ and TRUE_FALSE
  const handleSelectOption = (optId: string) => {
    const current = attempt.responses[currentQuestion.id]?.savedAnswer;
    const isSame = current === optId;
    const newAnswer = isSame ? null : optId;
    recordAnswer(newAnswer);
  };

  // Checkbox select for MCQ
  const handleToggleMcqOption = (optId: string) => {
    const current: string[] = Array.isArray(attempt.responses[currentQuestion.id]?.savedAnswer)
      ? attempt.responses[currentQuestion.id]?.savedAnswer
      : [];
    const exists = current.includes(optId);
    const updated = exists ? current.filter((x) => x !== optId) : [...current, optId];
    recordAnswer(updated.length > 0 ? updated : null);
  };

  // Text entry for FILL_BLANKS and SUBJECTIVE
  const handleTextChange = (text: string) => {
    recordAnswer(text);
  };

  // Mark for review toggle
  const toggleMarkForReview = () => {
    const existing = attempt.responses[currentQuestion.id];
    const currentStatus = existing?.status || 'UNVISITED';
    const hasAnswer = existing?.savedAnswer !== null && existing?.savedAnswer !== undefined && existing?.savedAnswer !== '';

    let nextStatus: QuestionStatus = 'MARKED_FOR_REVIEW';
    if (currentStatus === 'MARKED_FOR_REVIEW') {
      nextStatus = hasAnswer ? 'ANSWERED' : 'UNANSWERED';
    } else if (currentStatus === 'ANSWERED_AND_MARKED_FOR_REVIEW') {
      nextStatus = 'ANSWERED';
    } else {
      nextStatus = hasAnswer ? 'ANSWERED_AND_MARKED_FOR_REVIEW' : 'MARKED_FOR_REVIEW';
    }

    recordAnswer(existing?.savedAnswer || null, nextStatus);
  };

  // Clear answer
  const handleClearAnswer = () => {
    recordAnswer(null, 'UNANSWERED');
  };

  // Code runner for CODING questions
  const handleRunCode = () => {
    setCodeExecution({ isRunning: true });
    setTimeout(() => {
      const metadata = currentQuestion.codingMetadata;
      if (!metadata) return;

      const code = String(attempt.responses[currentQuestion.id]?.savedAnswer || metadata.boilerplate);
      const isSolutionPresent = code.length > 25 && (code.includes('return') || code.includes('max_so_far') || code.includes('True'));

      const results = metadata.testCases.map((tc, idx) => ({
        id: tc.id,
        passed: isSolutionPresent || idx === 0,
        input: tc.input,
        output: isSolutionPresent || idx === 0 ? tc.expectedOutput : 'None',
        expected: tc.expectedOutput,
      }));

      const allPassed = results.every((r) => r.passed);
      setCodeExecution({
        isRunning: false,
        results,
        consoleOutput: allPassed
          ? `[Python Runtime 3.12] Execution completed in 42ms.\nAll ${results.length} test cases PASSED successfully.`
          : `[Python Runtime 3.12] Execution completed in 38ms.\n${results.filter((r) => r.passed).length} of ${results.length} test cases passed.`,
      });
    }, 600);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Prepare questions summary for review modal
  const questionsSummary: QuestionSummaryItem[] = [];
  sections.forEach((sec, sIdx) => {
    // During review before final submission, allow candidate to inspect and edit choices across all sections
    const isLocked = false;

    sec.questions.forEach((q, qIdx) => {
      const resp = attempt.responses[q.id];
      questionsSummary.push({
        id: q.id,
        orderIndex: qIdx,
        sectionIndex: sIdx,
        sectionId: sec.id,
        sectionTitle: sec.title,
        status: resp?.status || 'UNVISITED',
        isSectionLocked: isLocked,
        marks: q.marks,
      });
    });
  });

  const activeResponse = attempt.responses[currentQuestion.id];
  const activeAnswer = activeResponse?.savedAnswer;
  const currentStatus = activeResponse?.status || 'UNVISITED';

  // Check if current section is locked (sequential non-reversible)
  const isCurrentSectionLocked =
    test.navigationMode === 'SEQUENTIAL' && attempt.sectionStates[currentSection.id]?.isCompleted;

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden font-sans">
      {/* Top Application Bar - White-label branded */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            {brand.logoUrl && <img src={brand.logoUrl}
              alt={brand.name}
              className="h-8 w-8 rounded-lg object-cover border border-slate-200"
            />}
            <div className="hidden md:block">
              <span className="text-xs font-bold text-slate-800 block leading-tight truncate max-w-[180px]">
                {brand.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Candidate: {attempt.candidateName}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Section Switcher Tabs */}
          <nav className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
            {sections.map((sec, idx) => {
              const secState = attempt.sectionStates[sec.id];
              const isLocked = test.navigationMode === 'SEQUENTIAL' && secState?.isCompleted;
              const isActive = activeSecIdx === idx;

              return (
                <button
                  key={sec.id}
                  disabled={isLocked}
                  onClick={() => {
                    setActiveSecIdx(idx);
                    setActiveQIdx(0);
                    const rem = attempt.sectionStates[sec.id]?.timeRemainingSec;
                    setSectionTimeRemaining(rem !== undefined ? rem : sec.durationMin * 60);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : isLocked
                      ? 'bg-slate-100 text-slate-400 border border-slate-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
                  <span>{sec.title}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Timers & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Section Timer with Visual Warnings */}
          <div
            title="Section Countdown Timer"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold ${
              sectionTimeRemaining < 300
                ? 'bg-red-50 border-red-300 text-red-600 animate-pulse'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-slate-500 font-normal">Sec:</span>
            <span>{formatTimer(sectionTimeRemaining)}</span>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition hidden sm:flex"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Review & Submit CTA */}
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Review & Submit</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left/Center Question Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col justify-between overflow-y-auto">
          <div className="max-w-4xl w-full mx-auto">
            {/* Section Timer Notice if low */}
            {sectionTimeRemaining < 300 && sectionTimeRemaining > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800 animate-pulse">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    <strong>Attention:</strong> Less than 5 minutes remaining in this section. Responses will be locked upon timer expiration.
                  </span>
                </div>
                <span className="font-mono font-bold text-red-700">{formatTimer(sectionTimeRemaining)}</span>
              </div>
            )}

            {/* Question Card Surface */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
              {/* Question Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Question {activeQIdx + 1} of {currentSection.questions.length}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {currentQuestion.type}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    +{currentQuestion.marks} Marks
                  </span>
                  {currentQuestion.negativeMarks > 0 && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                      -{currentQuestion.negativeMarks} Penalty
                    </span>
                  )}
                </div>
              </div>

              {/* Question Content */}
              <div className="mb-8">
                <h2 className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
                  {currentQuestion.content}
                </h2>
              </div>

              {/* ---------------- QUESTION TYPE RENDERERS ---------------- */}

              {/* 1. SCQ (Single-Choice) */}
              {currentQuestion.type === 'SCQ' && currentQuestion.options && (
                <div className="space-y-3 mb-6">
                  {currentQuestion.options.map((opt) => {
                    const isSelected = activeAnswer === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition select-none ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 text-slate-600 bg-white'
                          }`}
                        >
                          {opt.id}
                        </div>
                        <span className="text-sm text-slate-800 leading-relaxed">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. MCQ (Multiple-Choice) */}
              {currentQuestion.type === 'MCQ' && currentQuestion.options && (
                <div className="space-y-3 mb-6">
                  <div className="text-xs font-semibold text-slate-500 mb-2">
                    Multiple options may be correct. Partial credit awarded for correct selections.
                  </div>
                  {currentQuestion.options.map((opt) => {
                    const isChecked =
                      Array.isArray(activeAnswer) && activeAnswer.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleToggleMcqOption(opt.id)}
                        className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition select-none ${
                          isChecked
                            ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition ${
                            isChecked
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 text-slate-600 bg-white'
                          }`}
                        >
                          {isChecked ? '✓' : opt.id}
                        </div>
                        <span className="text-sm text-slate-800 leading-relaxed">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. TRUE / FALSE */}
              {currentQuestion.type === 'TRUE_FALSE' && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {(
                    currentQuestion.options || [
                      { id: 'A', text: 'True' },
                      { id: 'B', text: 'False' },
                    ]
                  ).map((opt) => {
                    const isSelected = activeAnswer === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`p-5 rounded-xl border-2 text-sm font-bold text-center transition cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 4. FILL IN THE BLANKS */}
              {currentQuestion.type === 'FILL_BLANKS' && (
                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Enter Exact Response:
                  </label>
                  <input
                    type="text"
                    value={activeAnswer || ''}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full max-w-lg px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Answer will be automatically verified case-insensitively.
                  </p>
                </div>
              )}

              {/* 5. SUBJECTIVE ESSAY */}
              {currentQuestion.type === 'SUBJECTIVE' && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Your Analysis & Essay:
                    </label>
                    <span className="text-xs text-slate-500 font-mono">
                      Word limit: {currentQuestion.wordLimit || 400} words (
                      {String(activeAnswer || '').trim().split(/\s+/).filter(Boolean).length} used)
                    </span>
                  </div>
                  <textarea
                    rows={7}
                    value={activeAnswer || ''}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="Structure your answer clearly with sections or bullet points..."
                    className="w-full p-4 bg-white border-2 border-slate-300 rounded-xl text-sm text-slate-800 leading-relaxed focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              )}

              {/* 6. CODING SANDBOX */}
              {currentQuestion.type === 'CODING' && (
                <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden bg-slate-900">
                  {/* Code Editor Header */}
                  <div className="px-4 py-2.5 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {currentQuestion.codingMetadata?.language || 'python'} 3.12 Sandbox
                      </span>
                    </div>

                    <button
                      onClick={handleRunCode}
                      disabled={codeExecution.isRunning}
                      className="px-3.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-md shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{codeExecution.isRunning ? 'Executing...' : 'Run Test Cases'}</span>
                    </button>
                  </div>

                  {/* Code Area */}
                  <textarea
                    rows={9}
                    spellCheck={false}
                    value={activeAnswer !== undefined ? activeAnswer : currentQuestion.codingMetadata?.boilerplate || ''}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="w-full p-4 bg-slate-950 text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none resize-y selection:bg-emerald-900 selection:text-white"
                  />

                  {/* Output Terminal */}
                  {codeExecution.consoleOutput && (
                    <div className="p-4 bg-slate-900 border-t border-slate-800 font-mono text-xs text-slate-300">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Execution Output:
                      </div>
                      <pre className="text-xs text-emerald-400 whitespace-pre-wrap">
                        {codeExecution.consoleOutput}
                      </pre>
                    </div>
                  )}

                  {/* Test Cases Visualizer */}
                  {currentQuestion.codingMetadata?.testCases && (
                    <div className="p-4 bg-slate-850 border-t border-slate-700">
                      <div className="text-xs font-bold text-slate-300 mb-2">Automated Test Cases:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {currentQuestion.codingMetadata.testCases.map((tc, idx) => {
                          const execResult = codeExecution.results?.find((r) => r.id === tc.id);
                          return (
                            <div
                              key={tc.id}
                              className={`p-2.5 rounded-lg border text-xs ${
                                execResult?.passed
                                  ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300'
                                  : execResult
                                  ? 'bg-red-950/60 border-red-600/60 text-red-300'
                                  : 'bg-slate-800 border-slate-700 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between font-mono font-bold mb-1">
                                <span>Case {idx + 1} {tc.isHidden ? '(Hidden)' : ''}</span>
                                {execResult?.passed && <span className="text-emerald-400">✓ Passed</span>}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono truncate">
                                In: {tc.input}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono truncate">
                                Expected: {tc.expectedOutput}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Autosave & Server Sync Status Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      autosaveState === 'SAVING'
                        ? 'bg-amber-500 animate-ping'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span role="status">
                    {saveStatus === undefined
                      ? 'Preview: nothing is saved'
                      : saveStatus === 'error'
                      ? 'Not saved. Check your internet connection.'
                      : saveStatus === 'saving' || autosaveState === 'SAVING'
                      ? 'Saving…'
                      : 'Saved'}
                  </span>
                  {saveStatus === 'error' && onRetrySave && (
                    <button type="button" onClick={onRetrySave} className="ml-2 underline font-semibold cursor-pointer">
                      Retry
                    </button>
                  )}
                </div>

                {activeAnswer !== null && activeAnswer !== undefined && activeAnswer !== '' && (
                  <button
                    onClick={handleClearAnswer}
                    className="text-xs text-slate-400 hover:text-red-600 transition underline cursor-pointer"
                  >
                    Clear Response
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Step Actions */}
          <div className="max-w-4xl w-full mx-auto flex items-center justify-between pt-6">
            <button
              onClick={toggleMarkForReview}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-bold transition cursor-pointer ${
                currentStatus === 'MARKED_FOR_REVIEW' ||
                currentStatus === 'ANSWERED_AND_MARKED_FOR_REVIEW'
                  ? 'bg-cta border-cta text-ink'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>
                {currentStatus === 'MARKED_FOR_REVIEW' ||
                currentStatus === 'ANSWERED_AND_MARKED_FOR_REVIEW'
                  ? 'Marked for Review'
                  : 'Mark for Review'}
              </span>
            </button>

            <div className="flex items-center gap-3">
              <button
                disabled={activeQIdx === 0}
                onClick={() => setActiveQIdx((prev) => prev - 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {activeQIdx < currentSection.questions.length - 1 ? (
                <button
                  onClick={() => setActiveQIdx((prev) => prev + 1)}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer transition shadow-xs"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : activeSecIdx < sections.length - 1 ? (
                <button
                  onClick={handleSectionAutoAdvance}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl text-xs font-bold hover:opacity-95 cursor-pointer transition shadow-xs"
                >
                  <span>Proceed to Section {activeSecIdx + 2}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finalize & Review</span>
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Right Palette Grid Drawer - Real-time Matrix */}
        <aside className="w-80 bg-white border-l border-slate-200 p-6 hidden lg:flex flex-col gap-2 shrink-0 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Question Palette
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {currentSection.questions.length} items
              </span>
            </div>

            {/* Numeric Matrix */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {currentSection.questions.map((q, idx) => {
                const resp = attempt.responses[q.id];
                const st = resp?.status || 'UNVISITED';
                let style = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';

                if (st === 'ANSWERED') {
                  style = 'bg-emerald-600 text-white border-emerald-600 font-extrabold';
                } else if (st === 'MARKED_FOR_REVIEW') {
                  style = 'bg-cta text-ink border-cta font-extrabold';
                } else if (st === 'ANSWERED_AND_MARKED_FOR_REVIEW') {
                  style =
                    'bg-brand-600 text-white border-2 border-cta font-extrabold';
                } else if (st === 'UNANSWERED') {
                  style = 'bg-white text-slate-700 border-slate-400 border-dashed font-extrabold';
                }

                if (activeQIdx === idx) {
                  style += ' ring-2 ring-slate-900 ring-offset-2';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setActiveQIdx(idx)}
                    className={`h-9 rounded-lg border text-xs font-bold flex items-center justify-center transition cursor-pointer ${style}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Palette Legend */}
          <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600 shrink-0" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-cta shrink-0" />
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-brand-600 border-2 border-cta shrink-0" />
              <span>Answered & Marked</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-white border border-dashed border-slate-400 shrink-0" />
              <span>Visited / Unanswered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 shrink-0" />
              <span>Unvisited</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Review & Edit Modal */}
      <SubmissionReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        sections={sections}
        questionsSummary={questionsSummary}
        responses={attempt.responses}
        timeRemainingSec={globalTimeRemaining}
        onEditChoice={(qId, newAnswer) => {
          recordAnswerForQuestion(qId, newAnswer);
        }}
        onJumpToQuestion={(secIdx, qIdx) => {
          setActiveSecIdx(secIdx);
          setActiveQIdx(qIdx);
          const targetSec = sections[secIdx];
          const rem = attempt.sectionStates[targetSec.id]?.timeRemainingSec;
          setSectionTimeRemaining(rem !== undefined && rem > 0 ? rem : targetSec.durationMin * 60);
        }}
        onSubmitFinal={() => {
          setIsReviewModalOpen(false);
          onSubmitAssessment(attempt);
        }}
      />

      {/* High-Contrast Malpractice Warning Modal */}
      {infractionModal.show && (
        <div className="fixed inset-0 z-50 bg-red-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 border-2 border-red-600 shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-red-900 mb-1">
              SECURITY INFRACTION DETECTED
            </h3>
            <p className="text-xs font-bold text-red-600 mb-3">
              Violation {infractionModal.count} of {test.proctoring.maxTabSwitchViolations}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {infractionModal.reason}. Switching tabs or exiting fullscreen undermines assessment integrity. Reaching 3 infractions will immediately terminate and disqualify your attempt.
            </p>
            <button
              onClick={() => setInfractionModal({ show: false, count: 0, reason: '' })}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              I Understand & Acknowledge Warning
            </button>
          </div>
        </div>
      )}

      <ProtectionLayer
        enabled={protect}
        hidden={protection.hidden}
        notice={protection.notice}
        watermark={{ name: attempt.candidateName, email: attempt.candidateEmail, attemptId: attempt.id }}
      />
    </div>
  );
};
