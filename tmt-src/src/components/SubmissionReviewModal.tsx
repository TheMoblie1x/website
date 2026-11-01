import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Bookmark,
  Lock,
  Edit3,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { CandidateResponse, Question, QuestionStatus, TestSection } from '../types/testforge';

export interface QuestionSummaryItem {
  id: string;
  orderIndex: number;
  sectionIndex: number;
  sectionId: string;
  sectionTitle: string;
  status: QuestionStatus;
  isSectionLocked: boolean;
  marks: number;
}

interface SubmissionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToQuestion: (sectionIndex: number, questionIndex: number) => void;
  onEditChoice: (questionId: string, newAnswer: any) => void;
  onSubmitFinal: () => void;
  sections: TestSection[];
  questionsSummary: QuestionSummaryItem[];
  responses: Record<string, CandidateResponse>;
  timeRemainingSec: number;
}

export const SubmissionReviewModal: React.FC<SubmissionReviewModalProps> = ({
  isOpen,
  onClose,
  onJumpToQuestion,
  onEditChoice,
  onSubmitFinal,
  sections,
  questionsSummary,
  responses,
  timeRemainingSec,
}) => {
  const [doubleConfirm, setDoubleConfirm] = useState(false);
  const [reviewMode, setReviewMode] = useState<'DETAILED_EDITOR' | 'COMPACT_GRID'>('DETAILED_EDITOR');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('ALL');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [lastEditedQuestionId, setLastEditedQuestionId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate dynamic aggregated metrics from live responses
  const totalQuestions = questionsSummary.length;
  let totalAnswered = 0;
  let totalMarked = 0;

  questionsSummary.forEach((q) => {
    const resp = responses[q.id];
    const hasAnswer =
      resp &&
      resp.savedAnswer !== null &&
      resp.savedAnswer !== undefined &&
      resp.savedAnswer !== '' &&
      (!Array.isArray(resp.savedAnswer) || resp.savedAnswer.length > 0);

    if (hasAnswer) totalAnswered++;
    if (resp?.status === 'MARKED_FOR_REVIEW' || resp?.status === 'ANSWERED_AND_MARKED_FOR_REVIEW') {
      totalMarked++;
    }
  });

  const totalUnanswered = totalQuestions - totalAnswered;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleChoiceSelect = (questionId: string, answer: any) => {
    onEditChoice(questionId, answer);
    setLastEditedQuestionId(questionId);
    setTimeout(() => {
      setLastEditedQuestionId((prev) => (prev === questionId ? null : prev));
    }, 2000);
  };

  const toggleSectionCollapse = (secId: string) => {
    setCollapsedSections((prev) => ({ ...prev, [secId]: !prev[secId] }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      <div className="bg-white max-w-5xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="px-5 sm:px-8 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-extrabold text-slate-900">
                Review & Edit Assessment Choices
              </h2>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                Live Choice Editing Enabled
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review all questions and edit your selected answers below before final submission.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 shadow-2xs">
              <span className="text-slate-400">Timer:</span>
              <span className={timeRemainingSec < 300 ? 'text-red-600 font-extrabold animate-pulse' : ''}>
                {formatTimer(timeRemainingSec)}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              title="Return to test workspace"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Aggregated Metric Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 px-5 sm:px-8 py-3.5 bg-slate-100/70 border-b border-slate-200">
          <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Answered
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-lg sm:text-2xl font-extrabold text-emerald-600 mt-0.5">
              {totalAnswered}{' '}
              <span className="text-xs font-normal text-slate-400">/ {totalQuestions}</span>
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                Unanswered
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-lg sm:text-2xl font-extrabold text-amber-600 mt-0.5">
              {totalUnanswered}{' '}
              <span className="text-xs font-normal text-slate-400">/ {totalQuestions}</span>
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-purple-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                Flagged for Review
              </span>
              <Bookmark className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-lg sm:text-2xl font-extrabold text-purple-600 mt-0.5">
              {totalMarked}{' '}
              <span className="text-xs font-normal text-slate-400">questions</span>
            </p>
          </div>
        </div>

        {/* View Switcher & Filter Bar */}
        <div className="px-5 sm:px-8 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600 mr-1 hidden sm:inline">Review Display:</span>
            <button
              onClick={() => setReviewMode('DETAILED_EDITOR')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                reviewMode === 'DETAILED_EDITOR'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Full Choice Editor</span>
            </button>

            <button
              onClick={() => setReviewMode('COMPACT_GRID')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                reviewMode === 'COMPACT_GRID'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Compact Matrix
            </button>
          </div>

          {/* Section Filter */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Filter Section:</span>
            <select
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Sections ({sections.length})</option>
              {sections.map((s, idx) => (
                <option key={s.id} value={s.id}>
                  Section {idx + 1}: {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Question Inspection & Direct Choice Editor Body */}
        <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {sections
            .filter((sec) => selectedSectionFilter === 'ALL' || sec.id === selectedSectionFilter)
            .map((sec, secIdx) => {
              const secQuestions = questionsSummary.filter((q) => q.sectionId === sec.id);
              const isCollapsed = !!collapsedSections[sec.id];
              const secAnsweredCount = sec.questions.filter((q) => {
                const resp = responses[q.id];
                return (
                  resp &&
                  resp.savedAnswer !== null &&
                  resp.savedAnswer !== undefined &&
                  resp.savedAnswer !== '' &&
                  (!Array.isArray(resp.savedAnswer) || resp.savedAnswer.length > 0)
                );
              }).length;

              return (
                <div
                  key={sec.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
                >
                  {/* Section Title Header Bar */}
                  <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => toggleSectionCollapse(sec.id)}
                        className="p-1 hover:bg-slate-200 rounded-md text-slate-500 transition cursor-pointer"
                        title="Toggle Section"
                      >
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )}
                      </button>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Section {secIdx + 1}:
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{sec.title}</h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                        {secAnsweredCount} / {sec.questions.length} answered
                      </span>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="p-5 space-y-5">
                      {/* COMPACT MATRIX VIEW */}
                      {reviewMode === 'COMPACT_GRID' && (
                        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-2">
                          {secQuestions.map((q) => {
                            const resp = responses[q.id];
                            const hasAnswer =
                              resp &&
                              resp.savedAnswer !== null &&
                              resp.savedAnswer !== undefined &&
                              resp.savedAnswer !== '' &&
                              (!Array.isArray(resp.savedAnswer) || resp.savedAnswer.length > 0);

                            let badge =
                              'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200';
                            if (hasAnswer) {
                              badge =
                                'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600';
                            } else if (resp?.status === 'MARKED_FOR_REVIEW') {
                              badge =
                                'bg-purple-600 text-white border-purple-700 hover:bg-purple-700';
                            } else if (resp?.status === 'UNANSWERED') {
                              badge = 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100';
                            }

                            return (
                              <button
                                key={q.id}
                                onClick={() => {
                                  onClose();
                                  onJumpToQuestion(q.sectionIndex, q.orderIndex);
                                }}
                                title={`Question ${q.orderIndex + 1} • Click to jump in workspace`}
                                className={`h-10 rounded-lg border text-xs font-bold flex flex-col items-center justify-center transition cursor-pointer hover:scale-105 ${badge}`}
                              >
                                <span>{q.orderIndex + 1}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* FULL QUESTION REVIEW & DIRECT CHOICE EDITOR */}
                      {reviewMode === 'DETAILED_EDITOR' && (
                        <div className="space-y-4">
                          {sec.questions.map((q, qIdx) => {
                            const resp = responses[q.id];
                            const currentAnswer = resp?.savedAnswer;
                            const isJustEdited = lastEditedQuestionId === q.id;

                            const isAnswered =
                              currentAnswer !== null &&
                              currentAnswer !== undefined &&
                              currentAnswer !== '' &&
                              (!Array.isArray(currentAnswer) || currentAnswer.length > 0);

                            return (
                              <div
                                key={q.id}
                                className={`p-4 sm:p-5 rounded-xl border-2 transition ${
                                  isJustEdited
                                    ? 'border-emerald-500 bg-emerald-50/30'
                                    : isAnswered
                                    ? 'border-slate-200 bg-white hover:border-slate-300'
                                    : 'border-amber-200 bg-amber-50/30'
                                }`}
                              >
                                {/* Question Title Bar */}
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-extrabold font-mono text-slate-500">
                                      Q{qIdx + 1}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                      {q.type}
                                    </span>
                                    {isAnswered ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                                        <CheckCircle2 className="w-3 h-3" /> Answered
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                                        <AlertTriangle className="w-3 h-3" /> Unanswered
                                      </span>
                                    )}
                                    {isJustEdited && (
                                      <span className="text-[10px] font-bold text-emerald-600 animate-pulse flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> Choice Updated
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-600 font-mono">
                                      +{q.marks} pts
                                    </span>
                                    <button
                                      onClick={() => {
                                        onClose();
                                        onJumpToQuestion(secIdx, qIdx);
                                      }}
                                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition flex items-center gap-1 cursor-pointer"
                                      title="Open in Full Test Workspace"
                                    >
                                      <span>Workspace</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Content */}
                                <p className="text-xs sm:text-sm font-medium text-slate-900 leading-relaxed mb-4">
                                  {q.content}
                                </p>

                                {/* Interactive Choice Selector: SCQ */}
                                {q.type === 'SCQ' && q.options && (
                                  <div className="space-y-2">
                                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                      Select / Change Your Choice:
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {q.options.map((opt) => {
                                        const isChosen = currentAnswer === opt.id;
                                        return (
                                          <button
                                            key={opt.id}
                                            onClick={() =>
                                              handleChoiceSelect(
                                                q.id,
                                                isChosen ? null : opt.id
                                              )
                                            }
                                            className={`p-3 rounded-xl border-2 text-left text-xs transition cursor-pointer flex items-center gap-2.5 select-none ${
                                              isChosen
                                                ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold shadow-2xs'
                                                : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                                            }`}
                                          >
                                            <span
                                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                                isChosen
                                                  ? 'border-blue-600 bg-blue-600 text-white'
                                                  : 'border-slate-300 text-slate-600 bg-white'
                                              }`}
                                            >
                                              {isChosen ? '✓' : opt.id}
                                            </span>
                                            <span className="truncate">{opt.text}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Interactive Choice Selector: MCQ */}
                                {q.type === 'MCQ' && q.options && (
                                  <div className="space-y-2">
                                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                      Select / Toggle Choices (Multiple Allowed):
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {q.options.map((opt) => {
                                        const isChecked =
                                          Array.isArray(currentAnswer) &&
                                          currentAnswer.includes(opt.id);

                                        return (
                                          <button
                                            key={opt.id}
                                            onClick={() => {
                                              const currentList: string[] = Array.isArray(
                                                currentAnswer
                                              )
                                                ? currentAnswer
                                                : [];
                                              const updated = isChecked
                                                ? currentList.filter((x) => x !== opt.id)
                                                : [...currentList, opt.id];
                                              handleChoiceSelect(
                                                q.id,
                                                updated.length > 0 ? updated : null
                                              );
                                            }}
                                            className={`p-3 rounded-xl border-2 text-left text-xs transition cursor-pointer flex items-center gap-2.5 select-none ${
                                              isChecked
                                                ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold shadow-2xs'
                                                : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                                            }`}
                                          >
                                            <span
                                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                                isChecked
                                                  ? 'border-blue-600 bg-blue-600 text-white'
                                                  : 'border-slate-300 text-slate-600 bg-white'
                                              }`}
                                            >
                                              {isChecked ? '✓' : opt.id}
                                            </span>
                                            <span className="truncate">{opt.text}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Interactive Choice Selector: TRUE_FALSE */}
                                {q.type === 'TRUE_FALSE' && (
                                  <div className="space-y-2">
                                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                      Select / Change Truth Value:
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 max-w-sm">
                                      {(
                                        q.options || [
                                          { id: 'A', text: 'True' },
                                          { id: 'B', text: 'False' },
                                        ]
                                      ).map((opt) => {
                                        const isChosen = currentAnswer === opt.id;
                                        return (
                                          <button
                                            key={opt.id}
                                            onClick={() =>
                                              handleChoiceSelect(
                                                q.id,
                                                isChosen ? null : opt.id
                                              )
                                            }
                                            className={`p-3 rounded-xl border-2 text-center text-xs font-bold transition cursor-pointer ${
                                              isChosen
                                                ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                                            }`}
                                          >
                                            {opt.text} {isChosen ? '✓' : ''}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Interactive Choice Selector: FILL_BLANKS */}
                                {q.type === 'FILL_BLANKS' && (
                                  <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                      Your Entered Value:
                                    </label>
                                    <input
                                      type="text"
                                      value={currentAnswer || ''}
                                      onChange={(e) =>
                                        handleChoiceSelect(q.id, e.target.value)
                                      }
                                      placeholder="Type response here..."
                                      className="w-full max-w-md px-3.5 py-2 text-xs font-mono bg-white border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100"
                                    />
                                  </div>
                                )}

                                {/* Interactive Choice Selector: SUBJECTIVE */}
                                {q.type === 'SUBJECTIVE' && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        Your Written Analysis:
                                      </label>
                                      <span className="text-[11px] text-slate-400 font-mono">
                                        {
                                          String(currentAnswer || '')
                                            .trim()
                                            .split(/\s+/)
                                            .filter(Boolean).length
                                        }{' '}
                                        words
                                      </span>
                                    </div>
                                    <textarea
                                      rows={3}
                                      value={currentAnswer || ''}
                                      onChange={(e) =>
                                        handleChoiceSelect(q.id, e.target.value)
                                      }
                                      placeholder="Edit your subjective analysis here..."
                                      className="w-full p-3 text-xs bg-white border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100"
                                    />
                                  </div>
                                )}

                                {/* Interactive Choice Selector: CODING */}
                                {q.type === 'CODING' && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        Candidate Solution Code:
                                      </span>
                                      <button
                                        onClick={() => {
                                          onClose();
                                          onJumpToQuestion(secIdx, qIdx);
                                        }}
                                        className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                                      >
                                        Open Code Runner
                                      </button>
                                    </div>
                                    <textarea
                                      rows={4}
                                      spellCheck={false}
                                      value={
                                        currentAnswer !== undefined
                                          ? currentAnswer
                                          : q.codingMetadata?.boilerplate || ''
                                      }
                                      onChange={(e) =>
                                        handleChoiceSelect(q.id, e.target.value)
                                      }
                                      className="w-full p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Warning If Unanswered Questions Remain */}
        {totalUnanswered > 0 && (
          <div className="px-6 py-2.5 bg-amber-50 border-t border-amber-200 flex items-center gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Note:</strong> You have <strong>{totalUnanswered}</strong> unanswered question(s). You can select or change your choices directly in the cards above!
            </span>
          </div>
        )}

        {/* Two-Step Confirmation Footer */}
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id="confirmCheck"
              checked={doubleConfirm}
              onChange={(e) => setDoubleConfirm(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
            <span className="text-xs text-slate-700 font-medium">
              I am ready to finalize my assessment. I understand responses cannot be altered after submission.
            </span>
          </label>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-300 bg-white rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Back to Test Workspace
            </button>
            <button
              disabled={!doubleConfirm}
              onClick={onSubmitFinal}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Submit Assessment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
