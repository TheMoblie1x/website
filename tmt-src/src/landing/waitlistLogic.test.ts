import test from 'node:test';
import assert from 'node:assert/strict';
import { csvCell, validateWaitlist, waitlistKey, waitlistToCsv } from './waitlistLogic';

test('accepts a valid entry, trimming and lowercasing the email', () => {
  const r = validateWaitlist({ email: '  Jane.Doe@Example.COM ', name: ' Jane ', company: 'Acme', interest: 'Hiring team' });
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.value, { email: 'jane.doe@example.com', name: 'Jane', company: 'Acme', interest: 'Hiring team' });
});

test('optional fields are omitted when blank (the database rejects undefined)', () => {
  const r = validateWaitlist({ email: 'a@b.co', name: '   ', company: '', interest: '' });
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.value, { email: 'a@b.co' });
});

test('rejects malformed emails', () => {
  for (const email of ['', 'plain', 'a@b', '@b.co', 'a b@c.co', 'a@b .co']) {
    const r = validateWaitlist({ email });
    assert.equal(r.ok, false, `"${email}" should be rejected`);
  }
});

test('rejects over-long fields and unknown interest options', () => {
  const long = 'x'.repeat(101);
  const r = validateWaitlist({ email: 'a@b.co', name: long, company: long, interest: 'Spy' });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.ok(r.errors.name);
    assert.ok(r.errors.company);
    assert.ok(r.errors.interest);
  }
  assert.equal(validateWaitlist({ email: 'x'.repeat(250) + '@b.co' }).ok, false);
});

test('the database key matches the rule-side derivation (dots become commas)', () => {
  assert.equal(waitlistKey('Jane.Doe@Example.com'), 'jane,doe@example,com');
});

test('csvCell quotes, doubles quotes and defuses spreadsheet formulas', () => {
  assert.equal(csvCell('plain'), '"plain"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell('=HYPERLINK("http://evil")'), `"'=HYPERLINK(""http://evil"")"`);
  for (const lead of ['+1', '-2', '@x', '\tcmd']) assert.ok(csvCell(lead).startsWith(`"'`), lead);
  assert.equal(csvCell(undefined), '""');
  assert.equal(csvCell(42), '"42"');
});

test('waitlistToCsv writes a header and one line per row', () => {
  const csv = waitlistToCsv([
    { email: 'a@b.co', name: 'A, B', createdAt: Date.UTC(2026, 10, 1, 12, 0, 0) },
    { email: 'c@d.co', company: '=1+1' },
  ]);
  const lines = csv.split('\r\n');
  assert.equal(lines.length, 3);
  assert.equal(lines[0], '"Email","Name","Company","Interest","Joined (UTC)"');
  assert.equal(lines[1], '"a@b.co","A, B","","","2026-11-01T12:00:00.000Z"');
  assert.equal(lines[2], `"c@d.co","","'=1+1","",""`);
});
