import { CandidateAttempt, CandidateResponse, Question, Test } from '../types/testforge';

export interface QuestionScoreResult {
  questionId: string;
  isCorrect: boolean;
  scoreAwarded: number;
  maxScore: number;
  negativeMarksApplied: number;
  feedback?: string;
  /** Written and coding answers cannot be marked by the browser; a person gives the marks. */
  needsReview?: boolean;
}

export interface SectionScoreSummary {
  sectionId: string;
  title: string;
  totalMarks: number;
  scoreAwarded: number;
  questionsTotal: number;
  answeredCount: number;
  correctCount: number;
  negativeDeductions: number;
}

export interface TestScoreResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  sectionsSummary: SectionScoreSummary[];
  questionResults: Record<string, QuestionScoreResult>;
  /** Written/coding answers with no marks entered yet. */
  pendingReview: number;
}

export function evaluateQuestion(question: Question, response?: CandidateResponse): QuestionScoreResult {
  const maxScore = question.marks;
  const negativeMarks = question.negativeMarks || 0;

  if (!response || !response.savedAnswer) {
    return {
      questionId: question.id,
      isCorrect: false,
      scoreAwarded: 0,
      maxScore,
      negativeMarksApplied: 0,
      feedback: 'Unattempted (no penalty applied)',
    };
  }

  const { type, correctAnswers } = question;
  const saved = response.savedAnswer;

  switch (type) {
    case 'SCQ':
    case 'TRUE_FALSE': {
      const correctStr = String(correctAnswers || '').trim().toUpperCase();
      const userStr = String(saved || '').trim().toUpperCase();
      if (userStr === correctStr) {
        return {
          questionId: question.id,
          isCorrect: true,
          scoreAwarded: maxScore,
          maxScore,
          negativeMarksApplied: 0,
        };
      } else {
        return {
          questionId: question.id,
          isCorrect: false,
          scoreAwarded: -negativeMarks,
          maxScore,
          negativeMarksApplied: negativeMarks,
          feedback: `Incorrect. Correct answer was ${correctStr}.`,
        };
      }
    }

    case 'MCQ': {
      const expected = Array.isArray(correctAnswers)
        ? correctAnswers.map((s) => String(s).trim().toUpperCase())
        : [String(correctAnswers).trim().toUpperCase()];
      const userSelected = Array.isArray(saved)
        ? saved.map((s) => String(s).trim().toUpperCase())
        : [String(saved).trim().toUpperCase()];

      // Partial credit or all-or-nothing check
      const wrongPicks = userSelected.filter((u) => !expected.includes(u));
      const rightPicks = userSelected.filter((u) => expected.includes(u));

      if (wrongPicks.length === 0 && rightPicks.length === expected.length) {
        return {
          questionId: question.id,
          isCorrect: true,
          scoreAwarded: maxScore,
          maxScore,
          negativeMarksApplied: 0,
        };
      } else if (wrongPicks.length > 0) {
        // Any incorrect selection applies full negative marking penalty
        return {
          questionId: question.id,
          isCorrect: false,
          scoreAwarded: -negativeMarks,
          maxScore,
          negativeMarksApplied: negativeMarks,
          feedback: `Incorrect options selected. Correct was ${expected.join(', ')}.`,
        };
      } else {
        // Partial correct without wrong selections: proportional score
        const partialScore = parseFloat(((rightPicks.length / expected.length) * maxScore).toFixed(2));
        return {
          questionId: question.id,
          isCorrect: false,
          scoreAwarded: partialScore,
          maxScore,
          negativeMarksApplied: 0,
          feedback: `Partially correct (${rightPicks.length}/${expected.length} options selected).`,
        };
      }
    }

    case 'FILL_BLANKS': {
      const expected = String(correctAnswers || '').trim();
      const userStr = String(saved || '').trim();
      // Case-insensitive comparison
      const isMatch = userStr.toLowerCase() === expected.toLowerCase();
      if (isMatch) {
        return {
          questionId: question.id,
          isCorrect: true,
          scoreAwarded: maxScore,
          maxScore,
          negativeMarksApplied: 0,
        };
      } else {
        return {
          questionId: question.id,
          isCorrect: false,
          scoreAwarded: -negativeMarks,
          maxScore,
          negativeMarksApplied: negativeMarks,
          feedback: `Expected "${expected}".`,
        };
      }
    }

    case 'SUBJECTIVE':
    case 'CODING': {
      // Not marked automatically: the browser cannot judge prose or run submitted code. An evaluator enters marks.
      return {
        questionId: question.id,
        isCorrect: false,
        scoreAwarded: 0,
        maxScore,
        negativeMarksApplied: 0,
        needsReview: true,
        feedback: 'Awaiting manual marks from an evaluator.',
      };
    }

    default:
      return {
        questionId: question.id,
        isCorrect: false,
        scoreAwarded: 0,
        maxScore,
        negativeMarksApplied: 0,
      };
  }
}

/**
 * Scores an attempt. `manualMarks` (question id -> marks) are entered by an evaluator and take precedence for the
 * questions that need review; they are clamped to 0..question marks.
 */
export function evaluateAttempt(
  test: Test,
  attempt: CandidateAttempt,
  manualMarks: Record<string, number> = {}
): TestScoreResult {
  let pendingReview = 0;
  let totalScore = 0;
  let maxScore = 0;
  const sectionsSummary: SectionScoreSummary[] = [];
  const questionResults: Record<string, QuestionScoreResult> = {};

  test.sections.forEach((section) => {
    let secMax = 0;
    let secAwarded = 0;
    let secAnswered = 0;
    let secCorrect = 0;
    let secNegative = 0;

    section.questions.forEach((q) => {
      secMax += q.marks;
      const resp = attempt.responses[q.id];
      let evaluated = evaluateQuestion(q, resp);
      const manual = manualMarks[q.id];
      if (typeof manual === 'number' && Number.isFinite(manual)) {
        const marks = Math.min(Math.max(manual, 0), q.marks);
        evaluated = { ...evaluated, scoreAwarded: marks, isCorrect: marks >= q.marks, needsReview: false, feedback: 'Marked by an evaluator.' };
      } else if (evaluated.needsReview && resp && resp.savedAnswer) {
        pendingReview++;
      }
      questionResults[q.id] = evaluated;

      secAwarded += evaluated.scoreAwarded;
      if (resp && resp.status === 'ANSWERED') secAnswered++;
      if (evaluated.isCorrect) secCorrect++;
      if (evaluated.negativeMarksApplied > 0) secNegative += evaluated.negativeMarksApplied;
    });

    totalScore += Math.max(0, secAwarded);
    maxScore += secMax;

    sectionsSummary.push({
      sectionId: section.id,
      title: section.title,
      totalMarks: secMax,
      scoreAwarded: Math.max(0, parseFloat(secAwarded.toFixed(2))),
      questionsTotal: section.questions.length,
      answeredCount: secAnswered,
      correctCount: secCorrect,
      negativeDeductions: secNegative,
    });
  });

  const clampedTotal = Math.max(0, parseFloat(totalScore.toFixed(2)));
  const percentage = maxScore > 0 ? parseFloat(((clampedTotal / maxScore) * 100).toFixed(1)) : 0;
  const isPassed = percentage >= test.passPercentage;

  return {
    totalScore: clampedTotal,
    maxScore,
    percentage,
    isPassed,
    sectionsSummary,
    questionResults,
    pendingReview,
  };
}
