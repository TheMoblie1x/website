import React, { useState } from 'react';
import { useBrand } from './ThemeProvider';
import {
  FileSpreadsheet,
  Settings,
  Users,
  Palette,
  Play,
  Plus,
  Pencil,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Compass,
  TrendingUp,
  Mail,
  UserCog,
  CreditCard,
} from 'lucide-react';
import {
  CandidateAttempt,
  Organization,
  SectionNavMode,
  Test,
  TestSection,
  Question,
  ProctoringSettings,
} from '../types/testforge';
import { BrandMark } from './BrandMark';
import { SettingSwitch } from './SettingSwitch';
import { can, Role } from '../auth/roles';
import { useAuth } from '../auth/AuthProvider';
import { TeamPanel } from './TeamPanel';
import { BillingPanel } from './BillingPanel';
import { CreateTestModal, SectionModal, QuestionModal, newId } from './TestAuthoring';
import { BulkIngestionModal } from './BulkIngestionModal';
import { AnalyticsTab } from './AnalyticsTab';
import { AttemptReviewModal } from './AttemptReviewModal';
import { getResults, saveTests } from '../utils/storage';
import { InvitePanel } from './InvitePanel';
import { usePlanInfo } from '../data/usePlanInfo';
import { candidatesThisMonth, canAddAssessment, canInviteCandidates, subscriptionAllows } from '../data/limits';
import { LEGACY_TESTS_KEY, findLegacyTests, sampleAssessmentFor } from '../data/legacyImport';

interface AdminDashboardProps {
  role: Role;
  tests: Test[];
  onUpdateTests: (tests: Test[]) => void;
  attempts: CandidateAttempt[];
  onRefreshAttempts: () => Promise<void>;
  onGraded: () => void;
  staffEmail: string;
  onLaunchCandidateTest: (testId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  role,
  tests,
  onUpdateTests,
  attempts,
  onRefreshAttempts,
  onGraded,
  staffEmail,
  onLaunchCandidateTest,
}) => {
  const { brand, setBrand, updateBrandColors } = useBrand();
  // What this person may do. The database rules enforce the same limits server-side.
  const canWrite = can(role, 'tests:write');
  const canBrand = can(role, 'branding:edit');
  const canManageTeam = can(role, 'members:manage');
  const { user: authUser, membership } = useAuth();
  const { sub, limits } = usePlanInfo(membership?.companyId);
  const assessmentLimit = canAddAssessment(limits, tests.length);
  const inviteBlock =
    subscriptionAllows(sub).message || canInviteCandidates(limits, candidatesThisMonth(attempts, new Date())).message;
  const [refreshing, setRefreshing] = useState(false);
  const [legacyDismissed, setLegacyDismissed] = useState(false);
  const legacyTests = (() => {
    try {
      return findLegacyTests(localStorage.getItem(LEGACY_TESTS_KEY), new Set(tests.map((t) => t.id)));
    } catch {
      return [];
    }
  })();

  const [activeTab, setActiveTab] = useState<'TESTS' | 'ANALYTICS' | 'BRANDING' | 'ATTEMPTS' | 'QUESTIONS' | 'TEAM' | 'BILLING'>('TESTS');
  const [selectedTestId, setSelectedTestId] = useState<string>(tests[0]?.id || '');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [questionModal, setQuestionModal] = useState<{ sectionId: string; question?: Question } | null>(null);
  const [pendingDeleteQ, setPendingDeleteQ] = useState<string | null>(null);
  const [publishMessage, setPublishMessage] = useState("");
  const [attemptDetailModal, setAttemptDetailModal] = useState<CandidateAttempt | null>(null);

  // Branding Studio State
  const [brandForm, setBrandForm] = useState({
    name: brand.name,
    logoUrl: brand.logoUrl,
    primaryColor: brand.primaryColor,
    secondaryColor: brand.secondaryColor,
    fontFamily: brand.fontFamily,
  });

  const activeTest = tests.find((t) => t.id === selectedTestId) || tests[0];

  // Update Test Settings Handler
  const handleToggleNavigationMode = () => {
    if (!activeTest || !canWrite) return;
    const newMode: SectionNavMode = activeTest.navigationMode === 'SEQUENTIAL' ? 'FREE' : 'SEQUENTIAL';
    const updated: Test[] = tests.map((t) => (t.id === activeTest.id ? { ...t, navigationMode: newMode } : t));
    onUpdateTests(updated);
    saveTests(updated);
  };

  const handleToggleNegativeMarking = () => {
    if (!activeTest || !canWrite) return;
    const updated = tests.map((t) =>
      t.id === activeTest.id ? { ...t, negativeMarking: !t.negativeMarking } : t
    );
    onUpdateTests(updated);
    saveTests(updated);
  };

  const handleToggleProctoringSetting = (key: keyof ProctoringSettings) => {
    if (!activeTest || !canWrite) return;
    const currentVal = activeTest.proctoring ? (activeTest.proctoring[key] ?? true) : true;
    const updated = tests.map((t) => {
      if (t.id === activeTest.id) {
        return {
          ...t,
          proctoring: {
            ...t.proctoring,
            [key]: !currentVal,
          },
        };
      }
      return t;
    });
    onUpdateTests(updated);
    saveTests(updated);
  };

  // ---- Authoring: every change recalculates section marks and total duration ----
  const commitTests = (updated: Test[]) => {
    if (!canWrite) return;
    onUpdateTests(updated);
    saveTests(updated);
  };

  const updateActiveTest = (fn: (t: Test) => Test) => {
    if (!activeTest) return;
    commitTests(
      tests.map((t) => {
        if (t.id !== activeTest.id) return t;
        const next = fn(t);
        return {
          ...next,
          sections: next.sections.map((s) => ({
            ...s,
            totalMarks: s.questions.reduce((a, q) => a + q.marks, 0),
          })),
          totalDurationMin: next.sections.reduce((a, s) => a + s.durationMin, 0),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handleCreateTest = (test: Test) => {
    commitTests([...tests, test]);
    setSelectedTestId(test.id);
    setIsCreateOpen(false);
    setActiveTab("TESTS");
  };

  const handleAddSection = (s: { title: string; description: string; durationMin: number }) => {
    updateActiveTest((t) => ({
      ...t,
      sections: [
        ...t.sections,
        {
          id: newId("sec"),
          testId: t.id,
          title: s.title,
          description: s.description,
          orderIndex: t.sections.length,
          durationMin: s.durationMin,
          questions: [],
        },
      ],
    }));
    setIsSectionModalOpen(false);
  };

  const handleSaveQuestion = (sectionId: string, q: Question) => {
    updateActiveTest((t) => ({
      ...t,
      sections: t.sections.map((s) => {
        const existsHere = s.questions.some((x) => x.id === q.id);
        if (s.id === sectionId) {
          const list = existsHere
            ? s.questions.map((x) => (x.id === q.id ? q : x))
            : [...s.questions, q];
          return { ...s, questions: list.map((x, i) => ({ ...x, orderIndex: i })) };
        }
        return existsHere
          ? { ...s, questions: s.questions.filter((x) => x.id !== q.id).map((x, i) => ({ ...x, orderIndex: i })) }
          : s;
      }),
    }));
    setQuestionModal(null);
  };

  const handleDeleteQuestion = (qid: string) => {
    updateActiveTest((t) => ({
      ...t,
      sections: t.sections.map((s) => ({
        ...s,
        questions: s.questions.filter((x) => x.id !== qid).map((x, i) => ({ ...x, orderIndex: i })),
      })),
    }));
    setPendingDeleteQ(null);
  };

  const handleTogglePublished = () => {
    if (!activeTest) return;
    const count = activeTest.sections.reduce((a, s) => a + s.questions.length, 0);
    if (!activeTest.isPublished && count === 0) {
      setPublishMessage("Add at least one question before publishing.");
      return;
    }
    setPublishMessage("");
    updateActiveTest((t) => ({ ...t, isPublished: !t.isPublished }));
  };

  const handleToggleTabLimit = () => {
    if (!activeTest || !canWrite) return;
    const current = activeTest.proctoring?.maxTabSwitchViolations ?? 3;
    const updated = tests.map((t) =>
      t.id === activeTest.id ? { ...t, proctoring: { ...t.proctoring, maxTabSwitchViolations: current > 0 ? 0 : 3 } } : t
    );
    onUpdateTests(updated);
    saveTests(updated);
  };

  const handleCommitBulkQuestions = (testId: string, newSections: TestSection[]) => {
    if (!canWrite) return;
    const updated = tests.map((t) => {
      if (t.id === testId) {
        return {
          ...t,
          sections: [...t.sections, ...newSections],
          totalDurationMin: t.totalDurationMin + newSections.reduce((acc, s) => acc + s.durationMin, 0),
        };
      }
      return t;
    });
    onUpdateTests(updated);
    saveTests(updated);
  };

  // Branding apply
  const handleSaveBranding = () => {
    if (!canBrand) return;
    updateBrandColors(
      brandForm.primaryColor,
      brandForm.secondaryColor,
      brandForm.name,
      brandForm.logoUrl,
      brandForm.fontFamily
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Platform Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 sm:py-0 sm:h-16 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sticky top-0 z-30">
        <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3 shrink-0">
            <BrandMark />
            <span
              className="hidden lg:block text-xs text-slate-500 truncate max-w-[160px] pl-3 border-l border-slate-200"
              title={brand.name}
            >
              {brand.name}
            </span>
          </div>

          <div className="h-5 w-px bg-slate-200 shrink-0 hidden sm:block" />

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 shrink-0">
            <button
              onClick={() => setActiveTab('TESTS')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'TESTS'
                  ? 'bg-accent-soft text-accent'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Assessments</span>
            </button>

            <button
              onClick={() => setActiveTab('ANALYTICS')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'ANALYTICS'
                  ? 'bg-accent-soft text-accent'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>

            {canBrand && (
            <button
              onClick={() => setActiveTab('BRANDING')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'BRANDING'
                  ? 'bg-accent-soft text-accent'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              Branding
            </button>
            )}

            <button
              onClick={() => setActiveTab('ATTEMPTS')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'ATTEMPTS'
                  ? 'bg-accent-soft text-accent'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Submissions ({attempts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('QUESTIONS')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'QUESTIONS'
                  ? 'bg-accent-soft text-accent'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Question Bank</span>
            </button>

            {canManageTeam && (
              <>
                <button
                  onClick={() => setActiveTab('TEAM')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'TEAM' ? 'bg-accent-soft text-accent' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <UserCog className="w-3.5 h-3.5" />
                  <span>Team</span>
                </button>
                <button
                  onClick={() => setActiveTab('BILLING')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'BILLING' ? 'bg-accent-soft text-accent' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Billing</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Global Action CTA */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            disabled={!activeTest}
            onClick={() => activeTest && onLaunchCandidateTest(activeTest.id)}
            className="w-full sm:w-auto px-4 py-2 bg-ink hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Preview as candidate</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto p-6 flex-1">
        {/* ================= TAB 1: TESTS MANAGEMENT ================= */}
        {activeTab === 'TESTS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-ink">Assessments</h1>
                <p className="text-sm text-slate-600 mt-1">
                  Set the rules, timing and proctoring for each test.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  aria-label="Choose assessment"
                  value={activeTest?.id || ""}
                  onChange={(e) => {
                    setSelectedTestId(e.target.value);
                    setPublishMessage("");
                  }}
                  className="max-w-[16rem] truncate px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-ink font-medium cursor-pointer"
                >
                  {tests.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                      {t.jobRole ? " (" + t.jobRole + ")" : ""}
                    </option>
                  ))}
                </select>
                {canWrite && (
                  <>
                <button
                  onClick={() => setIsBulkModalOpen(true)}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                  <span>Import questions</span>
                </button>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  disabled={!assessmentLimit.ok}
                  title={assessmentLimit.message || undefined}
                  className="px-4 py-2 bg-cta hover:bg-cta-hover active:bg-cta-press text-ink font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span>New assessment</span>
                </button>
                  </>
                )}
              </div>
            </div>

            {assessmentLimit.message && (
              <p role="status" className="text-[13px] text-amber-700">{assessmentLimit.message}</p>
            )}

            {canWrite && !legacyDismissed && legacyTests.length > 0 && (
              <div role="status" className="p-4 bg-brand-50 border border-brand-200 rounded-xl text-sm text-ink flex flex-wrap items-center justify-between gap-3">
                <span>
                  {legacyTests.length} assessment{legacyTests.length === 1 ? ' is' : 's are'} saved only in this browser from an older version. Import {legacyTests.length === 1 ? 'it' : 'them'} so your whole team can use {legacyTests.length === 1 ? 'it' : 'them'}.
                </span>
                <span className="flex gap-2">
                  <button
                    onClick={() => {
                      const imported = legacyTests.map((t) => ({ ...t, orgId: membership?.companyId || t.orgId, isPublished: false }));
                      onUpdateTests([...tests, ...imported]);
                      setSelectedTestId(imported[0].id);
                    }}
                    className="px-3 py-1.5 bg-ink text-white rounded-lg font-semibold cursor-pointer"
                  >
                    Import
                  </button>
                  <button onClick={() => setLegacyDismissed(true)} className="px-3 py-1.5 border border-slate-300 rounded-lg font-semibold cursor-pointer">
                    Not now
                  </button>
                </span>
              </div>
            )}

            {!activeTest && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <h2 className="text-lg font-semibold text-ink">No assessments yet</h2>
                <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                  {canWrite
                    ? 'Create your first assessment, or start from a sample you can edit.'
                    : 'Ask an owner or manager to create an assessment.'}
                </p>
                {canWrite && (
                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      onClick={() => {
                        const sample = sampleAssessmentFor(membership?.companyId || 'org', authUser?.uid || 'staff');
                        onUpdateTests([...tests, sample]);
                        setSelectedTestId(sample.id);
                      }}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold cursor-pointer"
                    >
                      Add a sample assessment
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Test overview */}
            {activeTest &&
              (() => {
                const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
                const sectionMarks = (s: TestSection) =>
                  s.totalMarks || s.questions.reduce((a, b) => a + b.marks, 0);
                const questionCount = activeTest.sections.reduce((a, s) => a + s.questions.length, 0);
                const totalMinutes = activeTest.sections.reduce((a, s) => a + s.durationMin, 0);
                const totalMarks = activeTest.sections.reduce((a, s) => a + sectionMarks(s), 0);
                const proctoringOn = (key: keyof ProctoringSettings) =>
                  activeTest.proctoring?.[key] !== false;

                return (
                  <div className="bg-white border border-slate-200 rounded-xl">
                    <div className="p-6 border-b border-slate-200">
                      <p className="text-[13px] text-slate-500 tabular-nums">
                        {activeTest.jobRole ? activeTest.jobRole + ' · ' : ''}{plural(questionCount, 'question')} · {plural(activeTest.sections.length, 'section')} ·{' '}
                        {totalMinutes} min · {plural(totalMarks, 'mark')}
                      </p>
                      <h2 className="text-xl font-semibold text-ink mt-1">{activeTest.title}</h2>
                      {activeTest.description && (
                        <p className="text-sm text-slate-600 mt-1.5 max-w-3xl">{activeTest.description}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-3">
                        ID <span className="font-mono">{activeTest.id}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-slate-200">
                      <div className="p-6">
                        <h3 className="text-sm font-semibold text-ink">Test rules</h3>
                        <div className="divide-y divide-slate-100 mt-1">
                          <div>
                            <SettingSwitch
                              label="Published"
                              description="Only published assessments can be sent to candidates."
                              checked={activeTest.isPublished}
                              disabled={!canWrite}
                              onChange={handleTogglePublished}
                            />
                            {publishMessage && (
                              <p role="alert" className="text-[13px] text-red-600 pb-3 -mt-1">
                                {publishMessage}
                              </p>
                            )}
                          </div>
                          <SettingSwitch
                            label="Lock sections in order"
                            description="Candidates finish each section before the next one opens."
                            checked={activeTest.navigationMode === 'SEQUENTIAL'}
                            disabled={!canWrite}
                            onChange={handleToggleNavigationMode}
                          />
                          <SettingSwitch
                            label="Negative marking"
                            description="Wrong answers deduct marks."
                            checked={activeTest.negativeMarking}
                            disabled={!canWrite}
                            onChange={handleToggleNegativeMarking}
                          />
                          <div className="flex items-start justify-between gap-4 py-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">Pass mark</p>
                              <p className="text-[13px] text-slate-500 mt-0.5">
                                Minimum score a candidate needs to pass.
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-ink tabular-nums">
                              {activeTest.passPercentage}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 border-t border-slate-200 lg:border-t-0">
                        <h3 className="text-sm font-semibold text-ink">Integrity checks</h3>
                        <div className="divide-y divide-slate-100 mt-1">
                          <SettingSwitch
                            label="Require full screen"
                            description="Leaving full screen during the test counts as a violation."
                            checked={activeTest.proctoring?.enforceFullscreen !== false}
                            disabled={!canWrite}
                            onChange={() => handleToggleProctoringSetting('enforceFullscreen')}
                          />
                          <SettingSwitch
                            label="Limit tab switches"
                            description="Switching tabs or windows counts as a violation. The third one ends the test."
                            checked={(activeTest.proctoring?.maxTabSwitchViolations ?? 3) > 0}
                            disabled={!canWrite}
                            onChange={handleToggleTabLimit}
                          />
                          <SettingSwitch
                            label="Discourage screenshots and copying"
                            description="Hides the questions when the window loses focus, blocks copy, print and right-click, and tiles the candidate's name, email and attempt ID over the page so a leaked photo is traceable. It cannot stop a phone camera or an operating-system screen recorder."
                            checked={activeTest.proctoring?.protectContent !== false}
                            disabled={!canWrite}
                            onChange={() => handleToggleProctoringSetting('protectContent')}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-6 border-t border-slate-200">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <h3 className="text-sm font-semibold text-ink">Sections</h3>
{canWrite && (
                        <button
                          onClick={() => setIsSectionModalOpen(true)}
                          className="text-sm font-semibold text-accent hover:text-accent-hover flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Add section
                        </button>
)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeTest.sections.map((sec, idx) => (
                          <div key={sec.id} className="rounded-lg border border-slate-200 p-4">
                            <div className="flex items-baseline justify-between gap-3">
                              <h4 className="text-sm font-semibold text-ink">
                                {idx + 1}. {sec.title}
                              </h4>
                              <span className="text-[13px] text-slate-500 tabular-nums shrink-0">
                                {sec.durationMin} min
                              </span>
                            </div>
                            {sec.description && (
                              <p className="text-[13px] text-slate-600 mt-1">{sec.description}</p>
                            )}
                            <p className="mt-3 text-[13px] text-slate-500 tabular-nums">
                              {plural(sec.questions.length, 'question')} · {plural(sectionMarks(sec), 'mark')}
                            </p>
{canWrite && (
                            <button
                              onClick={() => setQuestionModal({ sectionId: sec.id })}
                              className="mt-3 text-sm font-semibold text-accent hover:text-accent-hover flex items-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              Add question
                            </button>
)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

            {activeTest && membership && (
              <InvitePanel
                companyId={membership.companyId}
                test={activeTest}
                canInvite={can(role, 'invites:manage')}
                blockedReason={inviteBlock}
              />
            )}
          </div>
        )}

        {/* ================= TAB: TEAM & ROLES ================= */}
        {activeTab === 'TEAM' && canManageTeam && membership && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">Team</h1>
              <p className="text-sm text-slate-600 mt-1">
                Invite people from {membership.companyName} and choose what each can do.
              </p>
            </div>
            <TeamPanel companyId={membership.companyId} canManage currentUid={authUser?.uid} seatLimit={limits?.seats ?? null} />
          </div>
        )}

        {/* ================= TAB: BILLING ================= */}
        {activeTab === 'BILLING' && canManageTeam && membership && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">Billing</h1>
              <p className="text-sm text-slate-600 mt-1">Your plan, its limits and renewal date.</p>
            </div>
            <BillingPanel companyId={membership.companyId} canEdit={false} />
          </div>
        )}

        {/* ================= TAB: ANALYTICS & INSIGHTS ================= */}
        {activeTab === 'ANALYTICS' && (
          <AnalyticsTab
            tests={tests}
            attempts={attempts}
          />
        )}

        {/* ================= TAB 2: WHITE-LABEL BRANDING STUDIO ================= */}
        {activeTab === 'BRANDING' && canBrand && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                White-Label Branding & Theming Studio
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize colors, typography, and logos. The candidate interface completely insulates your organization brand.
              </p>
            </div>

            {/* Custom Brand Colors & Assets Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1">
                  Brand Theme Editor
                </h3>

                <div>
                  <label htmlFor="brand-name" className="block text-xs font-bold text-slate-700 mb-1">Organization Display Name</label>
                  <input
                    id="brand-name"
                    type="text"
                    value={brandForm.name}
                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="brand-logo-url" className="block text-xs font-bold text-slate-700 mb-1">Brand Logo Image URL</label>
                  <input
                    id="brand-logo-url"
                    type="text"
                    value={brandForm.logoUrl}
                    onChange={(e) => setBrandForm({ ...brandForm, logoUrl: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="brand-primary-color" className="block text-xs font-bold text-slate-700 mb-1">Primary Color (Hex)</label>
                    <div className="flex items-center gap-2">
                      <input
                        id="brand-primary-color"
                        type="color"
                        value={brandForm.primaryColor}
                        onChange={(e) => setBrandForm({ ...brandForm, primaryColor: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={brandForm.primaryColor}
                        onChange={(e) => setBrandForm({ ...brandForm, primaryColor: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="brand-secondary-color" className="block text-xs font-bold text-slate-700 mb-1">Secondary Color (Hex)</label>
                    <div className="flex items-center gap-2">
                      <input
                        id="brand-secondary-color"
                        type="color"
                        value={brandForm.secondaryColor}
                        onChange={(e) => setBrandForm({ ...brandForm, secondaryColor: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={brandForm.secondaryColor}
                        onChange={(e) => setBrandForm({ ...brandForm, secondaryColor: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="brand-font-family" className="block text-xs font-bold text-slate-700 mb-1">Typography Stack</label>
                  <select
                    id="brand-font-family"
                    value={brandForm.fontFamily}
                    onChange={(e) => setBrandForm({ ...brandForm, fontFamily: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="'Inter', sans-serif">Inter (Modern & Clean)</option>
                    <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans (Distinctive SaaS)</option>
                    <option value="'Roboto', sans-serif">Roboto (Technical Enterprise)</option>
                  </select>
                </div>

                <button
                  onClick={handleSaveBranding}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer mt-2"
                >
                  Apply Theme Across Platform
                </button>
              </div>

              {/* Live Preview Pane */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
                    Live Candidate Experience Preview
                  </h3>
                  <div
                    className="border border-slate-200 rounded-xl p-6 space-y-4 shadow-inner"
                    style={{ fontFamily: brandForm.fontFamily }}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        {brandForm.logoUrl && <img src={brandForm.logoUrl}
                          alt="preview logo"
                          className="h-7 w-7 rounded object-cover"
                        />}
                        <span className="text-xs font-bold text-slate-800">{brandForm.name}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        Time: 29:45
                      </span>
                    </div>

                    <div className="text-xs font-medium text-slate-800">
                      Sample Question: Which data structure guarantees O(1) amortized insertion?
                    </div>

                    <div className="space-y-2">
                      <div
                        className="p-2.5 rounded-lg border-2 text-xs font-semibold flex items-center gap-2"
                        style={{
                          borderColor: brandForm.primaryColor,
                          backgroundColor: `${brandForm.primaryColor}15`,
                          color: brandForm.primaryColor,
                        }}
                      >
                        <span
                          className="w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                          style={{ backgroundColor: brandForm.primaryColor }}
                        >
                          B
                        </span>
                        <span>Hash Table with Chaining</span>
                      </div>
                    </div>

                    <button
                      style={{ backgroundColor: brandForm.primaryColor }}
                      className="w-full py-2 rounded-lg text-white font-bold text-xs shadow-xs"
                    >
                      Primary Action Button
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-4">
                  Candidate view is 100% white-labeled; no TakeMyTest references are visible to examinees.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: CANDIDATE ATTEMPTS & AUDIT ================= */}
        {activeTab === 'ATTEMPTS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">
                  Candidate Attempts & Integrity Audit
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review answers, mark written responses, and see violations and receipts. New submissions appear automatically.
                </p>
              </div>
              <button
                disabled={refreshing}
                onClick={async () => {
                  setRefreshing(true);
                  try {
                    await onRefreshAttempts();
                  } finally {
                    setRefreshing(false);
                  }
                }}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            {attempts.length === 0 && (
              <p className="text-sm text-slate-600">
                No submissions yet. Share a candidate link from the Assessments tab; submissions appear here.
              </p>
            )}

            {/* Attempts Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Score & Percentage</th>
                    <th className="px-4 py-3">Infractions</th>
                    <th className="px-4 py-3">Submitted At</th>
                    <th className="px-4 py-3 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attempts.map((att) => {
                    const isTerminated = att.status === 'TERMINATED_MALPRACTICE';
                    const isSubmitted = att.status === 'SUBMITTED';

                    return (
                      <tr key={att.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{att.candidateName}</div>
                          <div className="text-xs text-slate-400 font-mono">{att.candidateEmail}</div>
                        </td>
                        <td className="px-4 py-3">
                          {isTerminated ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-700">
                              <ShieldAlert className="w-3.5 h-3.5" /> Terminated (Malpractice)
                            </span>
                          ) : isSubmitted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                              In Progress
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <div className="font-bold text-slate-900">
                            {att.totalScore !== undefined ? `${att.totalScore} pts` : 'Pending'}
                          </div>
                          {att.percentageScore !== undefined && (
                            <div className="text-xs text-slate-400">
                              {att.percentageScore}% ({att.isPassed ? 'Passed' : 'Failed'})
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                              (att.infractionCount || 0) > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {att.infractionCount || 0} violations
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                          {att.submittedAt
                            ? new Date(att.submittedAt).toLocaleDateString() +
                              ' ' +
                              new Date(att.submittedAt).toLocaleTimeString()
                            : 'Active'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setAttemptDetailModal(att)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                            >
                              Review & mark
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 4: QUESTION BANK ================= */}
        {activeTab === 'QUESTIONS' && activeTest && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-ink">Question bank</h1>
                <p className="text-sm text-slate-600 mt-1">
                  Add, edit and review the questions in{" "}
                  <span className="font-semibold text-ink">{activeTest.title}</span>.
                </p>
              </div>

              {canWrite && (
                <div className="flex items-center gap-3">
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                <span>Import questions</span>
              </button>
              <button
                onClick={() => setQuestionModal({ sectionId: activeTest.sections[0]?.id || "" })}
                disabled={!activeTest.sections.length}
                className="px-4 py-2 bg-cta hover:bg-cta-hover active:bg-cta-press text-ink font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Add question</span>
              </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {activeTest.sections.map((sec, sIdx) => (
                <div key={sec.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {sIdx + 1}. {sec.title}
                      </h3>
                      <p className="text-xs text-slate-500">{sec.description}</p>
                    </div>
                    <span className="text-[13px] font-semibold text-slate-600 tabular-nums">
                      {sec.questions.length} {sec.questions.length === 1 ? "question" : "questions"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {sec.questions.map((q, qIdx) => (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono text-slate-400">
                              Q{qIdx + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              {q.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold text-slate-600 tabular-nums mr-2">
                              +{q.marks} {q.marks === 1 ? "mark" : "marks"}
                              {q.negativeMarks > 0 && ` · -${q.negativeMarks} if wrong`}
                            </span>
                            {canWrite && (
                              <>
                            <button
                              onClick={() => setQuestionModal({ sectionId: sec.id, question: q })}
                              aria-label={`Edit question ${qIdx + 1}`}
                              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {pendingDeleteQ === q.id ? (
                              <>
                                <button
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setPendingDeleteQ(null)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setPendingDeleteQ(q.id)}
                                aria-label={`Delete question ${qIdx + 1}`}
                                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                              </>
                            )}
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                          {q.content}
                        </p>

                        {q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-200">
                            {q.options.map((opt) => {
                              const isCorrect =
                                q.correctAnswers === opt.id ||
                                (Array.isArray(q.correctAnswers) &&
                                  q.correctAnswers.includes(opt.id));
                              return (
                                <div
                                  key={opt.id}
                                  className={`p-2 rounded-lg text-xs font-mono flex items-center gap-2 ${
                                    isCorrect
                                      ? 'bg-emerald-100/70 border border-emerald-300 text-emerald-900 font-bold'
                                      : 'bg-white border border-slate-200 text-slate-600'
                                  }`}
                                >
                                  <span className="w-4 h-4 rounded bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                    {opt.id}
                                  </span>
                                  <span>{opt.text}</span>
                                  {isCorrect && <span className="ml-auto text-[10px]">✓ Correct</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {q.explanation && (
                          <div className="mt-2 text-[11px] text-slate-500 italic">
                            Explanation: {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
      {isCreateOpen && (
        <CreateTestModal
          tests={tests}
          orgId={brand.id}
          authorId={authUser?.uid || "staff"}
          onCreate={handleCreateTest}
          onClose={() => setIsCreateOpen(false)}
        />
      )}
      {isSectionModalOpen && (
        <SectionModal onSave={handleAddSection} onClose={() => setIsSectionModalOpen(false)} />
      )}
      {questionModal && activeTest && (
        <QuestionModal
          test={activeTest}
          sectionId={questionModal.sectionId}
          question={questionModal.question}
          onSave={handleSaveQuestion}
          onClose={() => setQuestionModal(null)}
        />
      )}
      <BulkIngestionModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        targetTest={activeTest}
        onCommitQuestions={handleCommitBulkQuestions}
      />

      {attemptDetailModal && (
        <AttemptReviewModal
          attempt={attemptDetailModal}
          test={tests.find((t) => t.id === attemptDetailModal.testId)}
          result={getResults()[attemptDetailModal.id]}
          canGrade={can(role, 'submissions:grade')}
          staffEmail={staffEmail}
          onClose={() => setAttemptDetailModal(null)}
          onSaved={onGraded}
        />
      )}
    </div>
  );
};
