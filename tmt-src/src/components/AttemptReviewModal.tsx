import React, { useMemo, useState } from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { CandidateAttempt, Question, Test } from '../types/testforge';
import { buildResult } from '../data/grading';
import { AttemptResult } from '../data/transform';
import { saveResult } from '../utils/storage';

const needsMarks = (q: Question) => q.type === 'SUBJECTIVE' || q.type === 'CODING';

const show = (v: unknown): string => {
  if (v === undefined || v === null || v === '') return 'No answer';
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
};

/**
 * Staff view of one submission: every answer next to the key, with marks entry for written and coding answers.
 * Saving recomputes the totals from the answer key and stores them in results/ (the candidate never sees the key).
 */
export const AttemptReviewModal: React.FC<{
  attempt: CandidateAttempt;
  test: Test | undefined;
  result: AttemptResult | undefined;
  canGrade: boolean;
  staffEmail: string;
  onClose: () => void;
  onSaved: () => void;
}> = ({ attempt, test, result, canGrade, staffEmail, onClose, onSaved }) => {
  const [marks, setMarks] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(result?.manualMarks || {}).map(([k, v]) => [k, String(v)]))
  );
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const questions = useMemo(() => (test ? test.sections.flatMap((s) => s.questions.map((q) => ({ q, section: s.title }))) : []), [test]);

  const parsed = (): Record<string, number> | null => {
    const out: Record<string, number> = {};
    for (const { q } of questions) {
      const raw = (marks[q.id] ?? '').trim();
      if (raw === '') continue;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0 || n > q.marks) {
        setError(`Marks for "${q.content.slice(0, 40)}…" must be a number from 0 to ${q.marks}.`);
        return null;
      }
      out[q.id] = n;
    }
    setError('');
    return out;
  };

  const preview = useMemo(() => {
    if (!test) return null;
    const m: Record<string, number> = {};
    for (const { q } of questions) {
      const n = Number((marks[q.id] ?? '').trim());
      if ((marks[q.id] ?? '').trim() !== '' && Number.isFinite(n)) m[q.id] = Math.min(Math.max(n, 0), q.marks);
    }
    return buildResult(test, attempt, m);
  }, [test, attempt, marks, questions]);

  const save = () => {
    if (!test || !canGrade) return;
    const m = parsed();
    if (!m) return;
    saveResult(attempt.id, buildResult(test, attempt, m, staffEmail).result);
    setSaved(true);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Submission review">
      <div className="bg-white max-w-3xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-ink truncate">{attempt.candidateName}</h3>
            <p className="text-xs text-slate-500 font-mono truncate">
              {attempt.candidateEmail} · Receipt {attempt.confirmationReceipt || 'none'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg text-slate-500 hover:text-ink cursor-pointer">
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {!test && <p role="alert" className="text-red-700">The assessment for this submission no longer exists, so it cannot be marked.</p>}

          {preview && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500">Score</p>
                <p className="text-lg font-bold text-ink tabular-nums">
                  {preview.result.totalScore} / {preview.result.maxScore}
                </p>
              </div>
              <div className="p-3 border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500">Percentage</p>
                <p className="text-lg font-bold text-ink tabular-nums">{preview.result.percentageScore}%</p>
              </div>
              <div className="p-3 border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500">Result</p>
                <p className="text-lg font-bold text-ink">{preview.result.isPassed ? 'Pass' : 'Not passed'}</p>
              </div>
              <div className="p-3 border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500">Waiting for marks</p>
                <p className="text-lg font-bold text-ink tabular-nums">{preview.result.pendingReview}</p>
              </div>
            </div>
          )}

          {attempt.status === 'TERMINATED_MALPRACTICE' && (
            <p className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-900">
              <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" /> The test was ended after too many violations. It counts as not passed.
            </p>
          )}

          {attempt.infractions.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
              <p className="font-semibold">Violations ({attempt.infractions.length})</p>
              {attempt.infractions.map((inf) => (
                <p key={inf.id} className="font-mono text-xs">
                  #{inf.warningNumber} {inf.description} ({new Date(inf.timestamp).toLocaleTimeString()})
                </p>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {questions.map(({ q, section }) => {
              const resp = attempt.responses[q.id];
              const res = preview?.detail.questionResults[q.id];
              const manual = needsMarks(q);
              return (
                <div key={q.id} className="p-3 border border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-500">
                    {section} · {q.type} · {q.marks} mark{q.marks === 1 ? '' : 's'}
                  </p>
                  <p className="text-ink font-medium mt-0.5">{q.content}</p>
                  <p className="mt-2 text-xs text-slate-500">Candidate answer</p>
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg p-2">{show(resp?.savedAnswer)}</pre>
                  {!manual && (
                    <p className="mt-2 text-xs text-slate-600">
                      Correct answer: <span className="font-mono">{show(q.correctAnswers)}</span>
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                    {manual ? (
                      <label className="flex items-center gap-2">
                        <span className="text-slate-600">Marks (0 to {q.marks})</span>
                        <input
                          type="number"
                          min={0}
                          max={q.marks}
                          step="0.5"
                          value={marks[q.id] ?? ''}
                          disabled={!canGrade || !resp}
                          onChange={(e) => {
                            setSaved(false);
                            setMarks({ ...marks, [q.id]: e.target.value });
                          }}
                          className="w-20 px-2 py-1 border border-slate-300 rounded-md disabled:bg-slate-100"
                        />
                      </label>
                    ) : (
                      <span className="text-slate-600">Marked automatically</span>
                    )}
                    <span className="font-mono tabular-nums text-ink">
                      {resp ? `${res?.scoreAwarded ?? 0} / ${q.marks}` : 'Not answered'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <p role="status" className="text-xs text-slate-600">
            {error ? <span role="alert" className="text-red-700">{error}</span> : saved ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Marks saved</span> : canGrade ? 'Enter marks, then save.' : 'You can view this submission but not mark it.'}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border border-slate-300 text-slate-800 font-semibold text-sm rounded-lg cursor-pointer">
              Close
            </button>
            {canGrade && test && (
              <button onClick={save} className="px-4 py-2 bg-cta hover:bg-cta-hover text-ink font-semibold text-sm rounded-lg cursor-pointer">
                Save marks
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
