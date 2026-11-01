import test from 'node:test';
import assert from 'node:assert/strict';
import { can, emailKey, isRole, Permission, ROLES } from './roles';

const ALL: Permission[] = [
  'tests:read',
  'tests:write',
  'invites:manage',
  'submissions:read',
  'submissions:grade',
  'branding:edit',
  'members:manage',
];

test('owner can do everything', () => {
  for (const p of ALL) assert.equal(can('owner', p), true, p);
});

test('manager can run tests but not change branding or team', () => {
  assert.equal(can('manager', 'tests:write'), true);
  assert.equal(can('manager', 'invites:manage'), true);
  assert.equal(can('manager', 'submissions:grade'), true);
  assert.equal(can('manager', 'branding:edit'), false);
  assert.equal(can('manager', 'members:manage'), false);
});

test('evaluator is read plus grading only', () => {
  assert.equal(can('evaluator', 'tests:read'), true);
  assert.equal(can('evaluator', 'submissions:read'), true);
  assert.equal(can('evaluator', 'submissions:grade'), true);
  assert.equal(can('evaluator', 'tests:write'), false);
  assert.equal(can('evaluator', 'invites:manage'), false);
  assert.equal(can('evaluator', 'branding:edit'), false);
  assert.equal(can('evaluator', 'members:manage'), false);
});

test('missing or unknown role is denied everything', () => {
  for (const p of ALL) {
    assert.equal(can(null, p), false);
    assert.equal(can(undefined, p), false);
    assert.equal(can('admin' as never, p), false);
  }
});

test('permissions only ever narrow: evaluator ⊂ manager ⊂ owner', () => {
  for (const p of ALL) {
    if (can('evaluator', p)) assert.equal(can('manager', p), true, p);
    if (can('manager', p)) assert.equal(can('owner', p), true, p);
  }
});

test('isRole accepts only known roles', () => {
  for (const r of ROLES) assert.equal(isRole(r), true);
  assert.equal(isRole('admin'), false);
  assert.equal(isRole(''), false);
  assert.equal(isRole(undefined), false);
});

test('emailKey lowercases, trims and replaces dots', () => {
  assert.equal(emailKey('  Rahul.Pahuja2015@Gmail.com '), 'rahul,pahuja2015@gmail,com');
});

test('emailKey never contains characters forbidden in database keys', () => {
  assert.doesNotMatch(emailKey('a.b.c@x.y.z'), /[.$#[\]/]/);
});
