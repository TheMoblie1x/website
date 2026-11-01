/**
 * Pure helpers that shape data for Realtime Database and back. No Firebase imports, so they are unit-testable.
 *
 * Why this exists:
 *  - Answers must never be readable by candidates. `tests/` (and the invite snapshot copied from it) hold the
 *    sanitized test; `answerKeys/` holds the answers and is readable by staff only.
 *  - Scores are not allowed inside `attempts/` (the rules forbid it); they live in `results/`.
 *  - Realtime Database drops `undefined`, empty arrays and empty objects, so reads need defaults.
 */
import { CandidateAttempt, CodingTestCase, Question, Test } from '../types/testforge';

export interface AnswerKey {
  correctAnswers?: string | string[];
  /** Ids of options flagged as correct (mirrors `options[].isCorrect`). */
  optionCorrect?: string[];
  explanation?: string;
  /** Coding test cases hidden from the candidate (the visible ones stay on the question). */
  hiddenTestCases?: CodingTestCase[];
}
export type AnswerKeys = Record<string, AnswerKey>;

/** Marks and grading state for one attempt. Lives at results/{cid}/{attemptId}. */
export interface AttemptResult {
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  isPassed: boolean;
  /** Marks entered by hand per question id (written answers and coding). */
  manualMarks?: Record<string, number>;
  /** Written/coding answers still waiting for a person to give marks. */
  pendingReview: number;
  gradedBy?: string;
  gradedAt?: string;
  computedAt: string;
}

/** Recursively removes undefined (Realtime Database throws on it). Arrays keep their positions. */
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => (v === undefined ? null : stripUndefined(v))) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

/** Splits a full test into the part candidates may see and the answer key. */
export function splitTest(test: Test): { publicTest: Test; keys: AnswerKeys } {
  const keys: AnswerKeys = {};
  const sections = test.sections.map((s) => ({
    ...s,
    questions: s.questions.map((q): Question => {
      const key: AnswerKey = {};
      if (q.correctAnswers !== undefined) key.correctAnswers = q.correctAnswers;
      const correctIds = (q.options || []).filter((o) => o.isCorrect).map((o) => o.id);
      if (correctIds.length) key.optionCorrect = correctIds;
      if (q.explanation) key.explanation = q.explanation;

      const { correctAnswers: _c, explanation: _e, ...rest } = q;
      const publicQ: Question = { ...rest };
      if (q.options) publicQ.options = q.options.map(({ isCorrect: _i, ...o }) => o);
      if (q.codingMetadata) {
        const hidden = q.codingMetadata.testCases.filter((t) => t.isHidden);
        if (hidden.length) key.hiddenTestCases = hidden;
        publicQ.codingMetadata = {
          ...q.codingMetadata,
          testCases: q.codingMetadata.testCases.filter((t) => !t.isHidden),
        };
      }
      if (Object.keys(key).length) keys[q.id] = key;
      return publicQ;
    }),
  }));
  return { publicTest: { ...test, sections }, keys };
}

/** Adds the answer key back (staff only). */
export function mergeTest(publicTest: Test, keys: AnswerKeys): Test {
  return {
    ...publicTest,
    sections: publicTest.sections.map((s) => ({
      ...s,
      questions: s.questions.map((q): Question => {
        const k = keys[q.id];
        if (!k) return q;
        const merged: Question = { ...q };
        if (k.correctAnswers !== undefined) merged.correctAnswers = k.correctAnswers;
        if (k.explanation) merged.explanation = k.explanation;
        if (k.optionCorrect && q.options) {
          merged.options = q.options.map((o) => ({ ...o, isCorrect: k.optionCorrect!.includes(o.id) }));
        }
        if (k.hiddenTestCases && q.codingMetadata) {
          merged.codingMetadata = { ...q.codingMetadata, testCases: [...q.codingMetadata.testCases, ...k.hiddenTestCases] };
        }
        return merged;
      }),
    })),
  };
}

/** Defaults for fields Realtime Database omits when they are empty. */
export function normalizeTest(raw: Test): Test {
  return {
    ...raw,
    guidelines: raw.guidelines ?? '',
    sections: (raw.sections || []).map((s) => ({
      ...s,
      questions: (s.questions || []).map((q) => ({
        ...q,
        content: q.content ?? '',
        options: q.options ? q.options : undefined,
        codingMetadata: q.codingMetadata
          ? { ...q.codingMetadata, testCases: q.codingMetadata.testCases || [] }
          : undefined,
      })),
    })),
    proctoring: {
      enforceFullscreen: raw.proctoring?.enforceFullscreen ?? true,
      maxTabSwitchViolations: raw.proctoring?.maxTabSwitchViolations ?? 3,
      protectContent: raw.proctoring?.protectContent ?? true,
    },
  };
}

export function normalizeAttempt(raw: CandidateAttempt): CandidateAttempt {
  return {
    ...raw,
    infractionCount: raw.infractionCount ?? 0,
    infractions: raw.infractions || [],
    responses: raw.responses || {},
    sectionStates: raw.sectionStates || {},
  };
}

/** Score fields are not allowed in attempts/; remove them before writing. */
export function attemptForWrite(a: CandidateAttempt): Record<string, unknown> {
  const { totalScore: _t, maxScore: _m, percentageScore: _p, isPassed: _i, ...rest } = a;
  return stripUndefined(rest) as Record<string, unknown>;
}

/** Overlays staff-side results on an attempt for display. */
export function withResult(a: CandidateAttempt, r?: AttemptResult | null): CandidateAttempt {
  if (!r) return a;
  return {
    ...a,
    totalScore: r.totalScore,
    maxScore: r.maxScore,
    percentageScore: r.percentageScore,
    isPassed: r.isPassed,
  };
}

/** What a candidate is allowed to learn from an invite link: the sanitized test plus white-label branding. */
export interface InviteBrand {
  name: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

export function randomToken(bytes = 16): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
}

export type InviteProblem = 'NOT_FOUND' | 'REVOKED' | 'EXPIRED' | 'USED';

/** Why an invite cannot be used right now (null = usable). */
export function inviteProblem(
  inv: { revoked?: boolean; expiresAt?: number; single?: boolean; claimedBy?: string } | null | undefined,
  now: number,
  uid?: string
): InviteProblem | null {
  if (!inv) return 'NOT_FOUND';
  if (inv.revoked === true) return 'REVOKED';
  if (typeof inv.expiresAt !== 'number' || inv.expiresAt <= now) return 'EXPIRED';
  if (inv.single === true && inv.claimedBy && inv.claimedBy !== uid) return 'USED';
  return null;
}

export const INVITE_PROBLEM_TEXT: Record<InviteProblem, string> = {
  NOT_FOUND: 'This link is not valid. Check that you copied the whole address, or ask the organiser for a new link.',
  REVOKED: 'This link has been withdrawn by the organiser. Ask them for a new link.',
  EXPIRED: 'This link has expired. Ask the organiser for a new link.',
  USED: 'This link was meant for one candidate and has already been used. Ask the organiser for a new link.',
};
