// Security-rules test harness. Usage: node rules-test.mjs <service-account.json> <webconfig.json>
// Creates temporary users/companies (all prefixed zz_), runs allow/deny checks, then deletes everything.
import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';

const key = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const web = JSON.parse(readFileSync(process.argv[3], 'utf8'));
const DB = web.databaseURL, API = web.apiKey, P = web.projectId;

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const sign = (payload) => {
  const u = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64(payload);
  return u + '.' + createSign('RSA-SHA256').update(u).sign(key.private_key, 'base64url');
};
const now = () => Math.floor(Date.now() / 1000);

async function adminToken() {
  const jwt = sign({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
    aud: 'https://oauth2.googleapis.com/token', iat: now(), exp: now() + 3000,
  });
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  return (await r.json()).access_token;
}

async function userToken(uid, claims) {
  const jwt = sign({
    iss: key.client_email, sub: key.client_email,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: now(), exp: now() + 3000, uid, claims,
  });
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: jwt, returnSecureToken: true }),
  });
  const j = await r.json();
  if (!j.idToken) throw new Error('custom token exchange failed: ' + JSON.stringify(j.error));
  return j.idToken;
}

const ADMIN = await adminToken();
async function call(method, path, body, who) {
  const q = who === 'admin' ? `access_token=${ADMIN}` : who ? `auth=${who}` : '';
  const r = await fetch(`${DB}/${path}.json?${q}`, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  let json = null; try { json = await r.json(); } catch {}
  return { ok: r.ok, status: r.status, json };
}

let pass = 0, fail = 0;
const check = (name, res, expectAllowed) => {
  const allowed = res.ok;
  const good = allowed === expectAllowed;
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${expectAllowed ? 'allowed' : 'denied '}  ${name}${good ? '' : `   <-- got HTTP ${res.status}`}`);
};
const allow = (n, r) => check(n, r, true);
const deny = (n, r) => check(n, r, false);

const ek = (e) => e.trim().toLowerCase().replace(/\./g, ',');
const U = {
  ownerA: { uid: 'zz_ownerA', email: 'owner.a@rulestest.example' },
  mgrA: { uid: 'zz_mgrA', email: 'mgr.a@rulestest.example' },
  evalA: { uid: 'zz_evalA', email: 'eval.a@rulestest.example' },
  ownerB: { uid: 'zz_ownerB', email: 'owner.b@rulestest.example' },
  stranger: { uid: 'zz_stranger', email: 'stranger@rulestest.example' },
  unverified: { uid: 'zz_unverified', email: 'unverified@rulestest.example' },
};
const CAND1 = 'zz_cand1', CAND2 = 'zz_cand2';
const allUids = [...Object.values(U).map((u) => u.uid), CAND1, CAND2];

async function cleanup() {
  const paths = ['companies/zz_a', 'companies/zz_b', 'companyMembers/zz_a', 'companyMembers/zz_b', 'tests/zz_a', 'tests/zz_b',
    'answerKeys/zz_a', 'answerKeys/zz_b', 'attempts/zz_a', 'attempts/zz_b', 'results/zz_a', 'results/zz_b',
    'companyInvites/zz_a', 'companyInvites/zz_b', 'invites/zz_tok1', 'invites/zz_tok_revoked', 'invites/zz_tok_expired',
    ...allUids.map((u) => `members/${u}`), ...Object.values(U).map((u) => `pendingMembers/${ek(u.email)}`)];
  for (const p of paths) await call('DELETE', p, undefined, 'admin');
  await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${P}/accounts:batchDelete`, {
    method: 'POST', headers: { Authorization: `Bearer ${ADMIN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ localIds: allUids, force: true }),
  });
}

try {
  await cleanup();

  // ---- tokens ----
  const tk = {};
  for (const [k, u] of Object.entries(U)) tk[k] = await userToken(u.uid, { email: u.email, email_verified: k !== 'unverified' });
  tk.cand1 = await userToken(CAND1, {});
  tk.cand2 = await userToken(CAND2, {});
  const payload = JSON.parse(Buffer.from(tk.ownerA.split('.')[1], 'base64url').toString());
  console.log(`token carries email claim: ${!!payload.email}, email_verified: ${payload.email_verified}\n`);

  // ---- admin seeds two companies and invites ----
  await call('PUT', 'companies/zz_a', { name: 'Test Co A' }, 'admin');
  await call('PUT', 'companies/zz_b', { name: 'Test Co B' }, 'admin');
  await call('PUT', `pendingMembers/${ek(U.ownerA.email)}`, { companyId: 'zz_a', role: 'owner' }, 'admin');
  await call('PUT', `pendingMembers/${ek(U.mgrA.email)}`, { companyId: 'zz_a', role: 'manager' }, 'admin');
  await call('PUT', `pendingMembers/${ek(U.evalA.email)}`, { companyId: 'zz_a', role: 'evaluator' }, 'admin');
  await call('PUT', `pendingMembers/${ek(U.ownerB.email)}`, { companyId: 'zz_b', role: 'owner' }, 'admin');
  await call('PUT', `pendingMembers/${ek(U.unverified.email)}`, { companyId: 'zz_a', role: 'owner' }, 'admin');

  console.log('--- anonymous / no sign-in');
  deny('unauthenticated read of whole database', await call('GET', '', undefined, null));
  deny('unauthenticated write', await call('PUT', 'members/zz_x', { companyId: 'zz_a', role: 'owner' }, null));

  console.log('\n--- claiming a role');
  const mem = (u, role, cid = 'zz_a') => ({ companyId: cid, role, email: u.email, name: 'T' });
  deny('stranger (no invite) claims owner', await call('PUT', `members/${U.stranger.uid}`, mem(U.stranger, 'owner'), tk.stranger));
  deny('unverified email claims its invite', await call('PUT', `members/${U.unverified.uid}`, mem(U.unverified, 'owner'), tk.unverified));
  deny('manager-invitee claims OWNER (role escalation)', await call('PUT', `members/${U.mgrA.uid}`, mem(U.mgrA, 'owner'), tk.mgrA));
  deny('manager-invitee claims a DIFFERENT company', await call('PUT', `members/${U.mgrA.uid}`, mem(U.mgrA, 'manager', 'zz_b'), tk.mgrA));
  deny('user claims membership for someone else\'s uid', await call('PUT', `members/${U.evalA.uid}`, mem(U.evalA, 'evaluator'), tk.mgrA));
  allow('owner claims exactly the invited role', await call('PUT', `members/${U.ownerA.uid}`, mem(U.ownerA, 'owner'), tk.ownerA));
  allow('manager claims exactly the invited role', await call('PUT', `members/${U.mgrA.uid}`, mem(U.mgrA, 'manager'), tk.mgrA));
  allow('evaluator claims exactly the invited role', await call('PUT', `members/${U.evalA.uid}`, mem(U.evalA, 'evaluator'), tk.evalA));
  allow('company B owner claims', await call('PUT', `members/${U.ownerB.uid}`, mem(U.ownerB, 'owner', 'zz_b'), tk.ownerB));
  deny('member later rewrites own role to owner (self-promotion)', await call('PUT', `members/${U.mgrA.uid}`, mem(U.mgrA, 'owner'), tk.mgrA));
  deny('member rewrites own role to manager from evaluator', await call('PUT', `members/${U.evalA.uid}`, mem(U.evalA, 'manager'), tk.evalA));

  console.log('\n--- reading membership & pending invites');
  allow('user reads own membership', await call('GET', `members/${U.mgrA.uid}`, undefined, tk.mgrA));
  deny('user reads someone else\'s membership', await call('GET', `members/${U.ownerA.uid}`, undefined, tk.mgrA));
  deny('user reads another email\'s pending invite', await call('GET', `pendingMembers/${ek(U.ownerB.email)}`, undefined, tk.mgrA));
  allow('owner reads own company\'s pending invite', await call('GET', `pendingMembers/${ek(U.unverified.email)}`, undefined, tk.ownerA));
  deny('owner of B reads company A\'s pending invite', await call('GET', `pendingMembers/${ek(U.unverified.email)}`, undefined, tk.ownerB));

  console.log('\n--- owner manages team');
  allow('owner invites a new manager (own company)', await call('PUT', `pendingMembers/${ek('new.mgr@rulestest.example')}`, { companyId: 'zz_a', role: 'manager' }, tk.ownerA));
  deny('owner invites into ANOTHER company', await call('PUT', `pendingMembers/${ek('sneaky@rulestest.example')}`, { companyId: 'zz_b', role: 'owner' }, tk.ownerA));
  deny('manager invites a member', await call('PUT', `pendingMembers/${ek('x@rulestest.example')}`, { companyId: 'zz_a', role: 'manager' }, tk.mgrA));
  deny('evaluator invites a member', await call('PUT', `pendingMembers/${ek('y@rulestest.example')}`, { companyId: 'zz_a', role: 'owner' }, tk.evalA));
  await call('DELETE', `pendingMembers/${ek('new.mgr@rulestest.example')}`, undefined, 'admin');

  console.log('\n--- company data isolation & roles');
  allow('owner A writes company A test', await call('PUT', 'tests/zz_a/t1', { title: 'T1' }, tk.ownerA));
  allow('manager A writes company A test', await call('PUT', 'tests/zz_a/t2', { title: 'T2' }, tk.mgrA));
  deny('evaluator A writes company A test', await call('PUT', 'tests/zz_a/t3', { title: 'T3' }, tk.evalA));
  allow('evaluator A reads company A tests', await call('GET', 'tests/zz_a', undefined, tk.evalA));
  deny('owner B reads company A tests', await call('GET', 'tests/zz_a', undefined, tk.ownerB));
  deny('owner B writes company A test', await call('PUT', 'tests/zz_a/t9', { title: 'hax' }, tk.ownerB));
  deny('candidate reads company A tests', await call('GET', 'tests/zz_a', undefined, tk.cand1));
  allow('manager A writes answer keys', await call('PUT', 'answerKeys/zz_a/t1', { q1: 'B' }, tk.mgrA));
  deny('evaluator A writes answer keys', await call('PUT', 'answerKeys/zz_a/t1', { q1: 'A' }, tk.evalA));
  deny('candidate reads answer keys', await call('GET', 'answerKeys/zz_a/t1', undefined, tk.cand1));
  deny('anyone reads company B answer keys but B', await call('GET', 'answerKeys/zz_b', undefined, tk.ownerA));
  allow('owner A edits company A branding', await call('PUT', 'companies/zz_a/name', 'Test Co A2', tk.ownerA));
  deny('manager A edits company A branding', await call('PUT', 'companies/zz_a/name', 'Hacked', tk.mgrA));
  deny('owner A edits company B branding', await call('PUT', 'companies/zz_b/name', 'Hacked', tk.ownerA));
  deny('owner A creates a brand-new company', await call('PUT', 'companies/zz_new', { name: 'Rogue' }, tk.ownerA));

  console.log('\n--- candidate invite links');
  allow('manager A creates invite link', await call('PUT', 'invites/zz_tok1', { companyId: 'zz_a', testId: 't1', expiresAt: Date.now() + 3600e3, single: false }, tk.mgrA));
  deny('manager B (owner B) creates invite for company A', await call('PUT', 'invites/zz_tok_x', { companyId: 'zz_a', testId: 't1', expiresAt: Date.now() + 3600e3 }, tk.ownerB));
  deny('evaluator A creates invite link', await call('PUT', 'invites/zz_tok_y', { companyId: 'zz_a', testId: 't1', expiresAt: Date.now() + 3600e3 }, tk.evalA));
  await call('PUT', 'invites/zz_tok_revoked', { companyId: 'zz_a', testId: 't1', expiresAt: Date.now() + 3600e3, revoked: true }, 'admin');
  await call('PUT', 'invites/zz_tok_expired', { companyId: 'zz_a', testId: 't1', expiresAt: Date.now() - 1000 }, 'admin');
  allow('candidate reads invite by its token', await call('GET', 'invites/zz_tok1', undefined, tk.cand1));
  deny('candidate lists ALL invites', await call('GET', 'invites', undefined, tk.cand1));
  deny('no-auth reads an invite', await call('GET', 'invites/zz_tok1', undefined, null));

  console.log('\n--- candidate attempts');
  const att = (extra = {}) => ({ candidateUid: CAND1, inviteToken: 'zz_tok1', testId: 't1', status: 'IN_PROGRESS', ...extra });
  allow('candidate starts attempt with valid invite', await call('PUT', 'attempts/zz_a/a1', att(), tk.cand1));
  allow('candidate saves progress on own attempt', await call('PUT', 'attempts/zz_a/a1', att({ responses: { q1: 'B' } }), tk.cand1));
  deny('candidate sets own score (totalScore)', await call('PUT', 'attempts/zz_a/a1', att({ totalScore: 100 }), tk.cand1));
  deny('candidate marks self passed (isPassed)', await call('PUT', 'attempts/zz_a/a1', att({ isPassed: true }), tk.cand1));
  deny('candidate attempt with revoked invite', await call('PUT', 'attempts/zz_a/a2', att({ inviteToken: 'zz_tok_revoked' }), tk.cand1));
  deny('candidate attempt with expired invite', await call('PUT', 'attempts/zz_a/a3', att({ inviteToken: 'zz_tok_expired' }), tk.cand1));
  deny('candidate attempt for wrong company path', await call('PUT', 'attempts/zz_b/a4', att(), tk.cand1));
  deny('candidate attempt claiming a different test', await call('PUT', 'attempts/zz_a/a5', att({ testId: 'other' }), tk.cand1));
  deny('candidate attempt as someone else\'s uid', await call('PUT', 'attempts/zz_a/a6', att({ candidateUid: CAND2 }), tk.cand1));
  deny('other candidate overwrites my attempt', await call('PUT', 'attempts/zz_a/a1', att({ candidateUid: CAND2 }), tk.cand2));
  deny('other candidate reads my attempt', await call('GET', 'attempts/zz_a/a1', undefined, tk.cand2));
  allow('candidate reads own attempt', await call('GET', 'attempts/zz_a/a1', undefined, tk.cand1));
  allow('manager A reads company A attempts', await call('GET', 'attempts/zz_a/a1', undefined, tk.mgrA));
  allow('evaluator A reads company A attempts', await call('GET', 'attempts/zz_a/a1', undefined, tk.evalA));
  deny('owner B reads company A attempts', await call('GET', 'attempts/zz_a/a1', undefined, tk.ownerB));
  allow('candidate submits (status SUBMITTED)', await call('PUT', 'attempts/zz_a/a1', att({ status: 'SUBMITTED', submittedAt: new Date().toISOString() }), tk.cand1));
  deny('candidate edits attempt AFTER submitting', await call('PUT', 'attempts/zz_a/a1', att({ status: 'IN_PROGRESS' }), tk.cand1));
  deny('evaluator deletes an attempt', await call('DELETE', 'attempts/zz_a/a1', undefined, tk.evalA));
  allow('manager A deletes an attempt', await call('DELETE', 'attempts/zz_a/a1', undefined, tk.mgrA));

  console.log('\n--- results (scores)');
  allow('evaluator A writes a result (grading)', await call('PUT', 'results/zz_a/a1', { totalScore: 5 }, tk.evalA));
  deny('candidate writes a result', await call('PUT', 'results/zz_a/a1', { totalScore: 100 }, tk.cand1));
  deny('candidate reads results', await call('GET', 'results/zz_a/a1', undefined, tk.cand1));
  deny('owner B reads company A results', await call('GET', 'results/zz_a/a1', undefined, tk.ownerB));
} catch (e) {
  console.error('HARNESS ERROR:', e.message);
  fail++;
} finally {
  await cleanup();
  const left = await call('GET', '', undefined, 'admin');
  console.log(`\nCleanup: database root after cleanup = ${JSON.stringify(left.json)}`);
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
