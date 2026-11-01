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
} from 'lucide-react';
import {
  CandidateAttempt,
  Organization,
  SectionNavMode,
  Test,
  TestSection,
  Question,
  ProctoringSettings,
  EmailNotification,
} from '../types/testforge';
import { BrandMark } from './BrandMark';
import { SettingSwitch } from './SettingSwitch';
import { can, Role } from '../auth/roles';
import { CreateTestModal, SectionModal, QuestionModal, newId } from './TestAuthoring';
import { BulkIngestionModal } from './BulkIngestionModal';
import { AnalyticsTab } from './AnalyticsTab';
import { MockEmailViewerModal } from './MockEmailViewerModal';
import { getSentEmails, getLatestEmailForCandidate } from '../utils/emailService';
import { DEFAULT_ORGANIZATIONS } from '../utils/seedData';
import { saveOrganizations, saveTests, saveAttempt } from '../utils/storage';

interface AdminDashboardProps {
  role: Role;
  tests: Test[];
  onUpdateTests: (tests: Test[]) => void;
  attempts: CandidateAttempt[];
  onUpdateAttempts: (attempts: CandidateAttempt[]) => void;
  onLaunchCandidateTest: (testId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  role,
  tests,
  onUpdateTests,
  attempts,
  onUpdateAttempts,
  onLaunchCandidateTest,
}) => {
  const { brand, setBrand, updateBrandColors } = useBrand();
  // What this person may do. The database rules enforce the same limits server-side.
  const canWrite = can(role, 'tests:write');
  const canBrand = can(role, 'branding:edit');

  const [activeTab, setActiveTab] = useState<'TESTS' | 'ANALYTICS' | 'BRANDING' | 'ATTEMPTS' | 'QUESTIONS'>('TESTS');
  const [selectedTestId, setSelectedTestId] = useState<string>(tests[0]?.id || '');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [questionModal, setQuestionModal] = useState<{ sectionId: string; question?: Question } | null>(null);
  const [pendingDeleteQ, setPendingDeleteQ] = useState<string | null>(null);
  const [publishMessage, setPublishMessage] = useState("");
  const [attemptDetailModal, setAttemptDetailModal] = useState<CandidateAttempt | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedEmailForViewer, setSelectedEmailForViewer] = useState<EmailNotification | undefined>(undefined);

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
    const currentVal = activeTest.proctoring ? activeTest.proctoring[key] : true;
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

  const handleSelectOrgPreset = (org: Organization) => {
    if (!canBrand) return;
    setBrand(org);
    setBrandForm({
      name: org.name,
      logoUrl: org.logoUrl,
      primaryColor: org.primaryColor,
      secondaryColor: org.secondaryColor,
      fontFamily: org.fontFamily,
    });
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
          </nav>
        </div>

        {/* Global Action CTA */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={() => onLaunchCandidateTest(activeTest.id)}
            className="w-full sm:w-auto px-4 py-2 bg-ink hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New assessment</span>
                </button>
                  </>
                )}
              </div>
            </div>

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
                        <h3 className="text-sm font-semibold text-ink">Proctoring</h3>
                        <div className="divide-y divide-slate-100 mt-1">
                          <SettingSwitch
                            label="Room check"
                            description="Candidate scans their room before the test starts."
                            checked={proctoringOn('enable360RoomSweep')}
                            disabled={!canWrite}
                            onChange={() => handleToggleProctoringSetting('enable360RoomSweep')}
                          />
                          <SettingSwitch
                            label="Gaze tracking"
                            description="Flags repeated looking away from the screen."
                            checked={proctoringOn('enableAiGazeTracking')}
                            disabled={!canWrite}
                            onChange={() => handleToggleProctoringSetting('enableAiGazeTracking')}
                          />
                          <SettingSwitch
                            label="Second-device detection"
                            description="Flags a phone or extra screen in view."
                            checked={proctoringOn('enableDeviceDetection')}
                            disabled={!canWrite}
                            onChange={() => handleToggleProctoringSetting('enableDeviceDetection')}
                          />
                          <SettingSwitch
                            label="Audio monitoring"
                            description="Flags voices and background talking."
                            checked={proctoringOn('enableAudioMonitoring')}
                            disabled={!canWrite}
                            onChange={() => handleToggleProctoringSetting('enableAudioMonitoring')}
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
          </div>
        )}

        {/* ================= TAB: ANALYTICS & INSIGHTS ================= */}
        {activeTab === 'ANALYTICS' && (
          <AnalyticsTab
            tests={tests}
            attempts={attempts}
            emails={getSentEmails()}
            onOpenEmailOutbox={() => {
              setSelectedEmailForViewer(undefined);
              setIsEmailModalOpen(true);
            }}
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

            {/* Quick Preset Organizations */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
                Pre-Configured Enterprise Tenants
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DEFAULT_ORGANIZATIONS.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleSelectOrgPreset(org)}
                    className={`p-3.5 rounded-xl border-2 text-left transition flex items-center gap-3 cursor-pointer ${
                      brand.name === org.name
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                    }`}
                  >
                    <img
                      src={org.logoUrl}
                      alt={org.name}
                      className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{org.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="w-3 h-3 rounded-full border border-black/10"
                          style={{ backgroundColor: org.primaryColor }}
                        />
                        <span className="text-[11px] text-slate-500">{org.primaryColor}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
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
                        <img
                          src={brandForm.logoUrl}
                          alt="preview logo"
                          className="h-7 w-7 rounded object-cover"
                        />
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
                  Inspect scores, section performance, proctoring tab-switch infractions, and submission receipts.
                </p>
              </div>
            </div>

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
                              onClick={() => {
                                const email = getLatestEmailForCandidate(att.candidateEmail);
                                setSelectedEmailForViewer(email);
                                setIsEmailModalOpen(true);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="View Dispatched Email Report"
                            >
                              <Mail className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setAttemptDetailModal(att)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                            >
                              Inspect Audit
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
        {activeTab === 'QUESTIONS' && (
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
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
          authorId="usr_admin_1"
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

      {/* Candidate Attempt Detailed Audit Inspection Modal */}
      {attemptDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-3xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Candidate Assessment Audit: {attemptDetailModal.candidateName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {attemptDetailModal.candidateEmail} • Receipt: {attemptDetailModal.confirmationReceipt}
                </p>
              </div>
              <button
                onClick={() => setAttemptDetailModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* 360° AI Room Sweep Audit Inspection */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-blue-600" />
                    <span className="font-bold uppercase tracking-wider text-slate-800 text-xs">
                      360° AI Room Sweep & Perimeter Certification
                    </span>
                  </div>
                  {attemptDetailModal.roomSweep?.isVerified ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      CERTIFIED ({attemptDetailModal.roomSweep.integrityScore}% INTEGRITY)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      SWEEP NOT COMPLETED
                    </span>
                  )}
                </div>

                {attemptDetailModal.roomSweep ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500">
                      Verified at: {new Date(attemptDetailModal.roomSweep.verifiedAt || Date.now()).toLocaleString()} • {attemptDetailModal.roomSweep.notes || 'Full 5-angle perimeter verified clean'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {attemptDetailModal.roomSweep.steps.map((step) => (
                        <div
                          key={step.angle}
                          className="p-2 bg-white rounded-lg border border-slate-200 text-[11px]"
                        >
                          <div className="flex items-center justify-between font-semibold text-slate-800 mb-0.5">
                            <span>{step.label.split(' - ')[0]}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {step.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {step.detectedObjects.join(' • ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    Candidate did not complete a 360° panoramic room sweep prior to this attempt.
                  </p>
                )}
              </div>

              {/* Infraction Log */}
              {attemptDetailModal.infractions && attemptDetailModal.infractions.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1.5 text-red-900">
                  <div className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>Malpractice Warnings Triggered:</span>
                  </div>
                  {attemptDetailModal.infractions.map((inf) => (
                    <div key={inf.id} className="font-mono">
                      Warning #{inf.warningNumber}: {inf.description} (
                      {new Date(inf.timestamp).toLocaleTimeString()})
                    </div>
                  ))}
                </div>
              )}

              {/* Answers Inspection */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Responses Record:
                </h4>
                <div className="space-y-2">
                  {Object.entries(attemptDetailModal.responses).map(([qId, resp]) => (
                    <div key={qId} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between font-mono font-bold mb-1">
                        <span>Question ID: {qId}</span>
                        <span className="text-blue-600">Status: {resp.status}</span>
                      </div>
                      <div className="font-mono text-slate-700">
                        Saved Response:{' '}
                        {typeof resp.savedAnswer === 'object'
                          ? JSON.stringify(resp.savedAnswer)
                          : String(resp.savedAnswer || 'None')}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Time spent: {resp.timeSpentSec}s • Score awarded: {resp.scoreAwarded ?? 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  const email = getLatestEmailForCandidate(attemptDetailModal.candidateEmail);
                  setSelectedEmailForViewer(email);
                  setIsEmailModalOpen(true);
                }}
                className="px-3.5 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>View Dispatched Email Report</span>
              </button>

              <button
                onClick={() => setAttemptDetailModal(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mock Email Dispatch Outbox / Candidate Email Viewer Modal */}
      <MockEmailViewerModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        initialEmail={selectedEmailForViewer}
        allEmails={getSentEmails()}
      />
    </div>
  );
};
