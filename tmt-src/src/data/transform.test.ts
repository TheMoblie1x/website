import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_TESTS } from '../utils/seedData';
import { evaluateAttempt } from '../utils/scoring';
import {
  attemptForWrite,
  inviteProblem,
  mergeTest,
  normalizeAttempt,
  randomToken,
  splitTest,
  stripUndefined,
  withResult,
} from './transform';
import { CandidateAttempt } from '../types/testforge';

const full = INITIAL_TESTS[0];
const allQuestions = full.sections.flatMap((s) => s.questions);

test('the sanitized test carries no answers, question explanations or hidden test cases', () => {
  const { publicTest } = splitTest(full);
  const json = JSON.stringify(publicTest);
  assert.ok(!json.includes('correctAnswers'));
  assert.ok(!json.includes('isCorrect'));
  for (const q of publicTest.sections.flatMap((s) => s.questions)) {
    assert.equal('explanation' in q, false);
    for (const t of q.codingMetadata?.testCases ?? []) assert.notEqual(t.isHidden, true);
  }
});

test('split then merge restores the original test exactly', () => {
  const { publicTest, keys } = splitTest(full);
  assert.deepEqual(mergeTest(publicTest, keys), full);
});

test('answers land in the key and can be re-merged for every question that had one', () => {
  const { keys } = splitTest(full);
  const withAnswer = allQuestions.filter((q) => q.correctAnswers !== undefined);
  assert.ok(withAnswer.length > 0);
  for (const q of withAnswer) assert.deepEqual(keys[q.id].correctAnswers, q.correctAnswers);
});

test('scores are removed from attempts before writing, and undefined is stripped', () => {
  const a = { id: 'a1', testId: 't', totalScore: 5, maxScore: 10, percentageScore: 50, isPassed: true, candidateName: 'N', candidateEmail: 'e@x.co', status: 'SUBMITTED', infractionCount: 0, infractions: [], sectionStates: {}, responses: {}, startedAt: undefined } as CandidateAttempt;
  const out = attemptForWrite(a);
  for (const k of ['totalScore', 'maxScore', 'percentageScore', 'isPassed', 'startedAt']) assert.ok(!(k in out), k);
  assert.equal(out.id, 'a1');
});

test('stripUndefined keeps nulls and nested values', () => {
  assert.deepEqual(stripUndefined({ a: undefined, b: { c: undefined, d: 1 }, e: [1, undefined] }), { b: { d: 1 }, e: [1, null] });
});

test('normalizeAttempt restores empty collections Realtime Database drops', () => {
  const a = normalizeAttempt({ id: 'x' } as CandidateAttempt);
  assert.deepEqual(a.infractions, []);
  assert.deepEqual(a.responses, {});
  assert.equal(a.infractionCount, 0);
});

test('withResult overlays scores', () => {
  const a = { id: 'x' } as CandidateAttempt;
  const r = withResult(a, { totalScore: 3, maxScore: 4, percentageScore: 75, isPassed: true, pendingReview: 0, computedAt: 'now' });
  assert.equal(r.totalScore, 3);
  assert.equal(withResult(a, null), a);
});

test('invite problems: missing, revoked, expired, used by someone else', () => {
  const now = 1_000;
  assert.equal(inviteProblem(null, now), 'NOT_FOUND');
  assert.equal(inviteProblem({ revoked: true, expiresAt: 9_999 }, now), 'REVOKED');
  assert.equal(inviteProblem({ expiresAt: 999 }, now), 'EXPIRED');
  assert.equal(inviteProblem({}, now), 'EXPIRED');
  assert.equal(inviteProblem({ expiresAt: 9_999, single: true, claimedBy: 'u1' }, now, 'u2'), 'USED');
  assert.equal(inviteProblem({ expiresAt: 9_999, single: true, claimedBy: 'u1' }, now, 'u1'), null);
  assert.equal(inviteProblem({ expiresAt: 9_999 }, now), null);
});

test('tokens are 128-bit hex and unique', () => {
  const a = randomToken();
  assert.match(a, /^[0-9a-f]{32}$/);
  assert.notEqual(a, randomToken());
});

test('written answers are not auto-marked; manual marks are clamped and counted', () => {
  const subj = allQuestions.find((q) => q.type === 'SUBJECTIVE');
  assert.ok(subj, 'seed has a subjective question');
  const attempt = {
    id: 'a', testId: full.id, candidateName: 'n', candidateEmail: 'e', status: 'SUBMITTED', infractionCount: 0, infractions: [], sectionStates: {},
    responses: { [subj.id]: { questionId: subj.id, status: 'ANSWERED', savedAnswer: 'a long considered answer '.repeat(10), timeSpentSec: 1 } },
  } as CandidateAttempt;
  const auto = evaluateAttempt(full, attempt);
  assert.equal(auto.questionResults[subj.id].scoreAwarded, 0);
  assert.equal(auto.pendingReview, 1);
  const marked = evaluateAttempt(full, attempt, { [subj.id]: 999 });
  assert.equal(marked.questionResults[subj.id].scoreAwarded, subj.marks);
  assert.equal(marked.pendingReview, 0);
  assert.equal(evaluateAttempt(full, attempt, { [subj.id]: -3 }).questionResults[subj.id].scoreAwarded, 0);
});

import { findLegacyTests, sampleAssessmentFor } from './legacyImport';

test('legacy import skips the untouched sample, existing ids and bad data', () => {
  const edited = { ...full, id: 'mine_1', title: 'My own test' };
  const raw = JSON.stringify([full, edited, { nonsense: true }]);
  const found = findLegacyTests(raw, new Set());
  assert.deepEqual(found.map((t) => t.id), ['mine_1']);
  assert.deepEqual(findLegacyTests(raw, new Set(['mine_1'])), []);
  assert.deepEqual(findLegacyTests('not json', new Set()), []);
  assert.deepEqual(findLegacyTests(null, new Set()), []);
  assert.deepEqual(findLegacyTests('{"a":1}', new Set()), []);
});

test('a sample assessment gets fresh ids, the company id and stays unpublished', () => {
  const s = sampleAssessmentFor('org_x', 'uid1', new Date('2026-11-01T00:00:00Z'));
  assert.equal(s.orgId, 'org_x');
  assert.equal(s.isPublished, false);
  assert.notEqual(s.id, full.id);
  const ids = s.sections.flatMap((sec) => sec.questions.map((q) => q.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const sec of s.sections) for (const q of sec.questions) assert.equal(q.sectionId, sec.id);
});
