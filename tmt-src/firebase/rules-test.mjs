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
  pa: { uid: 'zz_pa', email: 'pa@rulestest.example' },
  claimer: { uid: 'zz_claimer', email: 'claimer@rulestest.example' },
};
const CAND1 = 'zz_cand1', CAND2 = 'zz_cand2';
// Waitlist test entries (only these exact keys are ever cleaned up, never the whole node).
const WL = ['wl.one@rulestest.example', 'wl.full@rulestest.example', 'wl.other@rulestest.example', 'wl.admin@rulestest.example'];
const allUids = [...Object.values(U).map((u) => u.uid), CAND1, CAND2];

async function cleanup() {
  const paths = ['companies/zz_a', 'companies/zz_b', 'companyMembers/zz_a', 'companyMembers/zz_b', 'tests/zz_a', 'tests/zz_b',
    'answerKeys/zz_a', 'answerKeys/zz_b', 'attempts/zz_a', 'attempts/zz_b', 'results/zz_a', 'results/zz_b',
    'companyInvites/zz_a', 'companyInvites/zz_b', 'companies/zz_c', 'companyPending/zz_a', 'companyPending/zz_b', 'companyPending/zz_c', 'subscriptions/zz_a', 'subscriptions/zz_b', 'subscriptions/zz_c', 'plans/zz_plan', ...WL.map((e) => `waitlist/${ek(e)}`), `pendingMembers/${ek('newowner@rulestest.example')}`, `platformAdmins/${ek('pa@rulestest.example')}`, 'invites/zz_tok1', 'invites/zz_tok_revoked', 'invites/zz_tok_expired',
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
  await call('PUT', `platformAdmins/${ek(U.pa.email)}`, true, 'admin');
  await call('PUT', `pendingMembers/${ek(U.claimer.email)}`, { companyId: 'zz_a', role: 'evaluator' }, 'admin');
  await call('PUT', `companyPending/zz_a/${ek(U.claimer.email)}`, { email: U.claimer.email, role: 'evaluator' }, 'admin');

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

  console.log('\n--- team management (owner)');
  const key2 = (e) => ek(e);
  allow('owner A adds an invite to the company list', await call('PUT', `companyPending/zz_a/${key2('hire@rulestest.example')}`, { email: 'hire@rulestest.example', role: 'manager' }, tk.ownerA));
  deny('owner A adds an invite to ANOTHER company\'s list', await call('PUT', `companyPending/zz_b/${key2('hire@rulestest.example')}`, { email: 'hire@rulestest.example', role: 'manager' }, tk.ownerA));
  deny('manager A adds to the invite list', await call('PUT', `companyPending/zz_a/${key2('m@rulestest.example')}`, { email: 'm@rulestest.example', role: 'manager' }, tk.mgrA));
  allow('owner A reads the company invite list', await call('GET', 'companyPending/zz_a', undefined, tk.ownerA));
  deny('manager A reads the company invite list', await call('GET', 'companyPending/zz_a', undefined, tk.mgrA));
  deny('owner B reads company A invite list', await call('GET', 'companyPending/zz_a', undefined, tk.ownerB));
  allow('owner A changes a teammate\'s role (own company)', await call('PUT', `members/${U.evalA.uid}`, { companyId: 'zz_a', role: 'manager', email: U.evalA.email, name: 'T' }, tk.ownerA));
  deny('owner A moves a company B member into company A', await call('PUT', `members/${U.ownerB.uid}`, { companyId: 'zz_a', role: 'owner', email: U.ownerB.email, name: 'T' }, tk.ownerA));
  deny('owner A removes a company B member', await call('DELETE', `members/${U.ownerB.uid}`, undefined, tk.ownerA));
  deny('manager A changes a teammate\'s role', await call('PUT', `members/${U.evalA.uid}`, { companyId: 'zz_a', role: 'owner', email: U.evalA.email, name: 'T' }, tk.mgrA));
  allow('owner A removes a teammate (own company)', await call('DELETE', `members/${U.evalA.uid}`, undefined, tk.ownerA));
  allow('invitee removes their own invite entries when claiming', await call('DELETE', `companyPending/zz_a/${key2(U.claimer.email)}`, undefined, tk.claimer));
  deny('stranger removes someone else\'s invite entry', await call('DELETE', `companyPending/zz_a/${key2('hire@rulestest.example')}`, undefined, tk.stranger));

  console.log('\n--- platform admin (super user)');
  allow('platform admin reads own platformAdmins entry', await call('GET', `platformAdmins/${ek(U.pa.email)}`, undefined, tk.pa));
  deny('stranger reads the platform admin entry', await call('GET', `platformAdmins/${ek(U.pa.email)}`, undefined, tk.stranger));
  deny('owner makes themselves a platform admin', await call('PUT', `platformAdmins/${ek(U.ownerA.email)}`, true, tk.ownerA));
  deny('platform admin writes platformAdmins from the app', await call('PUT', `platformAdmins/${ek('other@rulestest.example')}`, true, tk.pa));
  allow('platform admin creates a company', await call('PUT', 'companies/zz_c', { name: 'Test Co C' }, tk.pa));
  allow('platform admin lists all companies', await call('GET', 'companies', undefined, tk.pa));
  deny('owner lists all companies', await call('GET', 'companies', undefined, tk.ownerA));
  allow('platform admin invites an owner into any company', await call('PUT', `pendingMembers/${key2('newowner@rulestest.example')}`, { companyId: 'zz_c', role: 'owner' }, tk.pa));
  allow('platform admin lists any company invites', await call('GET', 'companyPending/zz_c', undefined, tk.pa));
  allow('platform admin changes any member role', await call('PUT', `members/${U.mgrA.uid}`, { companyId: 'zz_a', role: 'evaluator', email: U.mgrA.email, name: 'T' }, tk.pa));
  allow('platform admin reads any company tests', await call('GET', 'tests/zz_a', undefined, tk.pa));
  allow('platform admin reads any company attempts', await call('GET', 'attempts/zz_a', undefined, tk.pa));
  allow('manager lists own company attempts', await call('GET', 'attempts/zz_a', undefined, tk.mgrA));
  deny('candidate lists a company\'s attempts', await call('GET', 'attempts/zz_a', undefined, tk.cand1));
  deny('owner of another company lists attempts', await call('GET', 'attempts/zz_a', undefined, tk.ownerB));

  console.log('\n--- plans & subscriptions');
  allow('platform admin creates a plan', await call('PUT', 'plans/zz_plan', { name: 'Test', priceMonthly: 0 }, tk.pa));
  deny('owner edits a plan', await call('PUT', 'plans/zz_plan', { name: 'Free forever', priceMonthly: 0 }, tk.ownerA));
  allow('owner reads the plans catalogue', await call('GET', 'plans', undefined, tk.ownerA));
  deny('unauthenticated reads plans', await call('GET', 'plans', undefined, null));
  allow('platform admin sets a company subscription', await call('PUT', 'subscriptions/zz_a', { planId: 'zz_plan', status: 'active', currentPeriodEnd: Date.now() + 864e5 }, tk.pa));
  deny('owner upgrades own subscription', await call('PUT', 'subscriptions/zz_a', { planId: 'enterprise', status: 'active' }, tk.ownerA));
  deny('owner writes subscription status field', await call('PUT', 'subscriptions/zz_a/status', 'active', tk.ownerA));
  allow('owner reads own subscription', await call('GET', 'subscriptions/zz_a', undefined, tk.ownerA));
  allow('evaluator reads own company subscription', await call('GET', 'subscriptions/zz_a', undefined, tk.mgrA));
  deny('owner B reads company A subscription', await call('GET', 'subscriptions/zz_a', undefined, tk.ownerB));
  deny('owner lists all subscriptions', await call('GET', 'subscriptions', undefined, tk.ownerA));
  deny('candidate reads a subscription', await call('GET', 'subscriptions/zz_a', undefined, tk.cand1));

  console.log('\n--- public waitlist');
  const SV = { '.sv': 'timestamp' };
  const wl = (email, extra = {}) => ({ email, createdAt: SV, ...extra });
  const k1 = ek(WL[0]);
  allow('anyone (not signed in) joins the waitlist', await call('PUT', `waitlist/${k1}`, wl(WL[0]), null));
  allow('join with all optional fields', await call('PUT', `waitlist/${ek(WL[1])}`, wl(WL[1], { name: 'Wendy', company: 'Acme', interest: 'Hiring team' }), null));
  deny('same email joins twice (duplicate)', await call('PUT', `waitlist/${k1}`, wl(WL[0]), null));
  deny('overwrite an existing entry with new data', await call('PUT', `waitlist/${k1}`, wl(WL[0], { name: 'Hijacked' }), null));
  deny('signed-in non-admin overwrites an entry', await call('PUT', `waitlist/${k1}`, wl(WL[0], { name: 'Hijacked' }), tk.stranger));
  deny('read one entry without signing in', await call('GET', `waitlist/${k1}`, undefined, null));
  deny('list the waitlist without signing in', await call('GET', 'waitlist', undefined, null));
  deny('company owner lists the waitlist', await call('GET', 'waitlist', undefined, tk.ownerA));
  deny('entry whose key does not match its email', await call('PUT', `waitlist/${ek(WL[2])}`, wl('someone.else@rulestest.example'), null));
  deny('entry with an invalid email', await call('PUT', `waitlist/${ek('not-an-email')}`, wl('not-an-email'), null));
  deny('entry with an extra field', await call('PUT', `waitlist/${ek(WL[2])}`, wl(WL[2], { isAdmin: true }), null));
  deny('entry with an oversized name', await call('PUT', `waitlist/${ek(WL[2])}`, wl(WL[2], { name: 'x'.repeat(101) }), null));
  deny('entry with a forged timestamp', await call('PUT', `waitlist/${ek(WL[2])}`, { email: WL[2], createdAt: 1 }, null));
  deny('entry with no timestamp', await call('PUT', `waitlist/${ek(WL[2])}`, { email: WL[2] }, null));
  deny('entry that is not an object', await call('PUT', `waitlist/${ek(WL[2])}`, 'hello', null));
  deny('delete an entry without signing in', await call('DELETE', `waitlist/${k1}`, undefined, null));
  deny('company owner deletes an entry', await call('DELETE', `waitlist/${k1}`, undefined, tk.ownerA));
  allow('platform admin lists the waitlist', await call('GET', 'waitlist', undefined, tk.pa));
  allow('platform admin removes an entry', await call('DELETE', `waitlist/${k1}`, undefined, tk.pa));
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
