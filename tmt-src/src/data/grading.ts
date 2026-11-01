import { CandidateAttempt, Test } from '../types/testforge';
import { evaluateAttempt, TestScoreResult } from '../utils/scoring';
import { AttemptResult } from './transform';

/** Only finished attempts are scored. */
export function isFinished(a: CandidateAttempt): boolean {
  return a.status === 'SUBMITTED' || a.status === 'TERMINATED_MALPRACTICE';
}

/**
 * Builds the record stored at results/{cid}/{attemptId}. Automatic marks cover objective questions; written and
 * coding answers count as 0 until `manualMarks` are entered. A terminated attempt never passes.
 */
export function buildResult(
  test: Test,
  attempt: CandidateAttempt,
  manualMarks: Record<string, number> = {},
  gradedBy?: string,
  now: Date = new Date()
): { result: AttemptResult; detail: TestScoreResult } {
  const detail = evaluateAttempt(test, attempt, manualMarks);
  const result: AttemptResult = {
    totalScore: detail.totalScore,
    maxScore: detail.maxScore,
    percentageScore: detail.percentage,
    isPassed: attempt.status === 'TERMINATED_MALPRACTICE' ? false : detail.isPassed,
    pendingReview: detail.pendingReview,
    computedAt: now.toISOString(),
  };
  if (Object.keys(manualMarks).length) result.manualMarks = manualMarks;
  if (gradedBy) {
    result.gradedBy = gradedBy;
    result.gradedAt = now.toISOString();
  }
  return { result, detail };
}
