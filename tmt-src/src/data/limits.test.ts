import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canAddAssessment, canAddSeat, canInviteCandidates, candidatesThisMonth, subscriptionAllows } from './limits';
import { buildResult, isFinished } from './grading';
import { INITIAL_TESTS } from '../utils/seedData';
import { CandidateAttempt } from '../types/testforge';

const limits = { assessments: 3, candidatesPerMonth: 25, seats: 3 };

test('limits block at the cap and allow below it; no plan means no block', () => {
  assert.equal(canAddAssessment(limits, 2).ok, true);
  assert.equal(canAddAssessment(limits, 3).ok, false);
  assert.equal(canInviteCandidates(limits, 24).ok, true);
  assert.equal(canInviteCandidates(limits, 25).ok, false);
  assert.equal(canAddSeat(limits, 2, 0).ok, true);
  assert.equal(canAddSeat(limits, 2, 1).ok, false, 'pending invites use a seat');
  assert.equal(canAddAssessment(null, 99).ok, true);
});

test('a canceled subscription blocks; trialing and active do not', () => {
  assert.equal(subscriptionAllows({ planId: 'trial', status: 'canceled' }).ok, false);
  assert.equal(subscriptionAllows({ planId: 'trial', status: 'trialing' }).ok, true);
  assert.equal(subscriptionAllows(null).ok, true);
});

test('only candidate-link attempts started this month are counted', () => {
  const now = new Date('2026-11-15T00:00:00Z');
  const a = (o: Partial<CandidateAttempt>) => ({ id: 'x', ...o }) as CandidateAttempt;
  const list = [
    a({ candidateUid: 'u1', startedAt: '2026-11-02T00:00:00Z' }),
    a({ candidateUid: 'u2', startedAt: '2026-10-31T23:59:00Z' }),
    a({ startedAt: '2026-11-03T00:00:00Z' }), // staff preview/legacy: no candidateUid
  ];
  assert.equal(candidatesThisMonth(list, now), 1);
});

test('a terminated attempt never passes, even with a high score; finished states are detected', () => {
  const t = INITIAL_TESTS[0];
  const base = { id: 'a', testId: t.id, candidateName: 'n', candidateEmail: 'e', infractionCount: 0, infractions: [], sectionStates: {}, responses: {} } as unknown as CandidateAttempt;
  assert.equal(isFinished({ ...base, status: 'IN_PROGRESS' }), false);
  assert.equal(isFinished({ ...base, status: 'SUBMITTED' }), true);
  const r = buildResult(t, { ...base, status: 'TERMINATED_MALPRACTICE' }, {}, undefined, new Date('2026-11-01T00:00:00Z'));
  assert.equal(r.result.isPassed, false);
  assert.equal(r.result.computedAt, '2026-11-01T00:00:00.000Z');
  const g = buildResult(t, { ...base, status: 'SUBMITTED' }, { q1: 1 }, 'grader@x.co');
  assert.equal(g.result.gradedBy, 'grader@x.co');
  assert.deepEqual(g.result.manualMarks, { q1: 1 });
});
