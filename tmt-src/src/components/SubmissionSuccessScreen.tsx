import React from 'react';
import { useBrand } from './ThemeProvider';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  FileCheck,
  Printer,
  RotateCcw,
  Award,
  Compass,
} from 'lucide-react';
import { CandidateAttempt, Test } from '../types/testforge';
import { evaluateAttempt } from '../utils/scoring';

interface SubmissionSuccessScreenProps {
  test: Test;
  attempt: CandidateAttempt;
  onRetakeOrExit: () => void;
  onGoToAdmin: () => void;
}

export const SubmissionSuccessScreen: React.FC<SubmissionSuccessScreenProps> = ({
  test,
  attempt,
  onRetakeOrExit,
  onGoToAdmin,
}) => {
  const { brand } = useBrand();

  const isMalpractice = attempt.status === 'TERMINATED_MALPRACTICE';
  const scoreResult = evaluateAttempt(test, attempt);

  const receiptId =
    attempt.confirmationReceipt ||
    `TMT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-8">
      {/* Insulated Header */}
      <header className="max-w-4xl w-full mx-auto bg-white border border-slate-200 rounded-2xl px-6 py-4 flex items-center justify-between mb-6 shadow-xs">
        <div className="flex items-center gap-3">
          {brand.logoUrl && <img src={brand.logoUrl}
            alt={brand.name}
            className="h-8 w-8 rounded-lg object-cover border border-slate-200"
          />}
          <div>
            <span className="text-sm font-bold text-slate-900 block">{brand.name}</span>
            <span className="text-xs text-slate-400">Preview report</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Scorecard</span>
          </button>
        </div>
      </header>

      {/* Main Report Card */}
      <main className="max-w-4xl w-full mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm mb-6">
        {/* Banner State */}
        {isMalpractice ? (
          <div className="text-center pb-8 border-b border-slate-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-9 h-9" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-red-100 text-red-700">
              Disqualified • Malpractice Policy Infraction
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
              Assessment Terminated Early
            </h1>
            <p className="text-sm text-slate-500 max-w-lg mx-auto mt-2">
              This session was locked and terminated automatically after exceeding the allowed tab-switch violation limit.
            </p>
          </div>
        ) : (
          <div className="text-center pb-8 border-b border-slate-100">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-700">
              Preview complete
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
              Preview submitted
            </h1>
            <p className="text-sm text-slate-500 max-w-lg mx-auto mt-2">
              This is how the preview ended. Written and coding answers are not scored automatically, so they count as 0 until someone marks them.
            </p>
          </div>
        )}

        {/* Official Receipt & Metadata */}
        <div className="my-8 p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 block uppercase font-bold text-[10px]">Confirmation Receipt</span>
            <span className="text-slate-800 font-bold text-sm">{receiptId}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase font-bold text-[10px]">Candidate Email</span>
            <span className="text-slate-800 font-bold text-sm truncate block">{attempt.candidateEmail}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase font-bold text-[10px]">Submitted Timestamp</span>
            <span className="text-slate-800 font-bold text-sm">
              {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleTimeString() : 'Just now'}
            </span>
          </div>
        </div>

        <p className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600">
          This was a preview. Nothing was saved and no email was sent. Real candidates open a link from the Assessments tab and see a receipt, not a score.
        </p>

        {/* Aggregated Score Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
              Total Score
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-blue-900 mt-1">
              {scoreResult.totalScore}
              <span className="text-sm font-normal text-slate-400"> / {scoreResult.maxScore}</span>
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Percentage
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {scoreResult.percentage}%
            </p>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
              Result Verdict
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-800 mt-1 flex items-center gap-1.5">
              {scoreResult.isPassed ? 'PASSED' : 'NEEDS REVIEW'}
            </p>
            <span className="text-[11px] text-emerald-700 mt-0.5 block">
              Threshold: {test.passPercentage}%
            </span>
          </div>

          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
              Security Flags
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-amber-900 mt-1">
              {attempt.infractionCount || 0}
            </p>
            <span className="text-[11px] text-amber-700 mt-0.5 block">
              {attempt.infractionCount > 0 ? 'Infractions logged' : 'Clean session'}
            </span>
          </div>
        </div>

        {/* Sectional Performance Breakdown */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
            Section-by-Section Score Audit
          </h2>
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Answered</th>
                  <th className="px-4 py-3">Correct</th>
                  <th className="px-4 py-3">Negative Deductions</th>
                  <th className="px-4 py-3 text-right">Score Awarded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scoreResult.sectionsSummary.map((sec) => (
                  <tr key={sec.sectionId} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">{sec.title}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono">
                      {sec.answeredCount} / {sec.questionsTotal}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono">{sec.correctCount}</td>
                    <td className="px-4 py-3 text-amber-600 font-mono">
                      {sec.negativeDeductions > 0 ? `-${sec.negativeDeductions}` : '0.0'}
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-slate-900 font-mono">
                      {sec.scoreAwarded} / {sec.totalMarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Infractions Audit Log if any occurred */}
        {attempt.infractions && attempt.infractions.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl mb-8">
            <h3 className="text-xs font-bold text-red-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Proctoring Telemetry Infractions ({attempt.infractions.length})</span>
            </h3>
            <div className="space-y-1.5 text-xs text-red-800">
              {attempt.infractions.map((inf) => (
                <div key={inf.id} className="flex items-center justify-between font-mono">
                  <span>
                    Warning #{inf.warningNumber}: {inf.description}
                  </span>
                  <span className="text-slate-400">{new Date(inf.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
          <button
            onClick={onRetakeOrExit}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Assessment</span>
          </button>

          <button
            onClick={onGoToAdmin}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Open Evaluator & Admin Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
};
