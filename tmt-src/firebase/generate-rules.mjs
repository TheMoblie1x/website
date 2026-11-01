// Generates database.rules.json from named fragments so parentheses stay balanced.
import { writeFileSync } from 'node:fs';

const myCo = "root.child('members').child(auth.uid).child('companyId').val()";
const myRole = "root.child('members').child(auth.uid).child('role').val()";
const isOwner = `${myRole} === 'owner'`;
const isMgr = `(${myRole} === 'owner' || ${myRole} === 'manager')`;
const inCo = (cid) => `${myCo} === ${cid}`;
const staffOfCo = `auth != null && ${inCo('$cid')}`; // any role in the company
const mgrOfCo = `auth != null && ${inCo('$cid')} && ${isMgr}`;
const ownerOfCo = `auth != null && ${inCo('$cid')} && ${isOwner}`;

const tok = "newData.child('inviteToken').val()";
const inv = (f) => `root.child('invites').child(${tok}).child('${f}').val()`;

const existingAttemptOk =
  `data.child('candidateUid').val() === auth.uid && data.child('inviteToken').val() === ${tok} && ` +
  `data.child('status').val() !== 'SUBMITTED' && data.child('status').val() !== 'TERMINATED_MALPRACTICE' && data.child('status').val() !== 'EXPIRED'`;
const newAttemptOk =
  `${inv('expiresAt')} > now && (${inv('single')} !== true || ${inv('claimedBy')} === auth.uid)`;
const candidateWrite =
  `newData.exists() && newData.child('candidateUid').val() === auth.uid && ` +
  `${inv('companyId')} === $cid && ${inv('testId')} === newData.child('testId').val() && ${inv('revoked')} !== true && ` +
  `(data.exists() ? (${existingAttemptOk}) : (${newAttemptOk}))`;
const managerDelete = `!newData.exists() && ${isMgr} && ${inCo('$cid')}`;

// Email key the rules derive from the signed-in user's verified email (must match roles.ts emailKey()).
const emailKeyExpr = "auth.token.email.toLowerCase().replace('.', ',')";
const verified = "auth.token.email_verified === true";
const pend = (f) => `root.child('pendingMembers').child(${emailKeyExpr}).child('${f}').val()`;

const ownerManagesMember =
  `auth != null && ${isOwner} && ` +
  `((newData.exists() && newData.child('companyId').val() === ${myCo} && (!data.exists() || data.child('companyId').val() === ${myCo})) || ` +
  `(!newData.exists() && data.child('companyId').val() === ${myCo}))`;

// First sign-in: a person may create their OWN membership, but only exactly as an owner invited their verified email.
const claimOwnMembership =
  `auth != null && auth.uid === $uid && !data.exists() && ${verified} && ` +
  `${pend('companyId')} === newData.child('companyId').val() && ${pend('role')} === newData.child('role').val()`;

const memberWrite = `(${ownerManagesMember}) || (${claimOwnMembership})`;

const rules = {
  rules: {
    '.read': false,
    '.write': false,

    members: {
      $uid: {
        '.read': 'auth != null && auth.uid === $uid',
        '.write': memberWrite,
        '.validate':
          "newData.hasChildren(['companyId', 'role']) && (newData.child('role').val() === 'owner' || newData.child('role').val() === 'manager' || newData.child('role').val() === 'evaluator')",
      },
    },

    companyMembers: {
      $cid: {
        '.read': staffOfCo,
        $uid: {
          '.write': `(${ownerOfCo}) || (auth != null && auth.uid === $uid && ${myCo} === $cid)`,
        },
      },
    },

    pendingMembers: {
      $emailKey: {
        '.read': `auth != null && ((${verified} && ${emailKeyExpr} === $emailKey) || (${isOwner} && data.child('companyId').val() === ${myCo}))`,
        '.write': `auth != null && ((${isOwner} && (newData.exists() ? newData.child('companyId').val() : data.child('companyId').val()) === ${myCo}) || (!newData.exists() && ${verified} && ${emailKeyExpr} === $emailKey))`,
        '.validate':
          "newData.hasChildren(['companyId', 'role']) && (newData.child('role').val() === 'owner' || newData.child('role').val() === 'manager' || newData.child('role').val() === 'evaluator')",
      },
    },

    companies: {
      $cid: {
        '.read': staffOfCo,
        '.write': `${ownerOfCo} && data.exists()`,
      },
    },

    tests: { $cid: { '.read': staffOfCo, '.write': mgrOfCo } },
    answerKeys: { $cid: { '.read': staffOfCo, '.write': mgrOfCo } },
    companyInvites: { $cid: { '.read': mgrOfCo, '.write': mgrOfCo } },

    invites: {
      $token: {
        '.read': 'auth != null',
        '.write':
          `auth != null && ${isMgr} && ${myCo} === (newData.exists() ? newData.child('companyId').val() : data.child('companyId').val())`,
        claimedBy: { '.write': 'auth != null && !data.exists() && newData.val() === auth.uid' },
      },
    },

    attempts: {
      $cid: {
        '.indexOn': ['testId', 'candidateEmail', 'submittedAt'],
        $aid: {
          '.read': `auth != null && (data.child('candidateUid').val() === auth.uid || ${inCo('$cid')})`,
          '.write': `auth != null && ((${managerDelete}) || (${candidateWrite}))`,
          totalScore: { '.validate': false },
          maxScore: { '.validate': false },
          percentageScore: { '.validate': false },
          isPassed: { '.validate': false },
        },
      },
    },

    results: { $cid: { '.read': staffOfCo, '.write': staffOfCo } },
  },
};

// Balanced-bracket sanity check on every rule expression.
const walk = (o, path = '') => {
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'string' && k.startsWith('.')) {
      let d = 0;
      for (const ch of v) { if (ch === '(') d++; if (ch === ')') d--; if (d < 0) break; }
      if (d !== 0) { console.error('UNBALANCED at', path + '/' + k); process.exit(1); }
    } else if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, path + '/' + k);
  }
};
walk(rules);
writeFileSync(process.argv[2], JSON.stringify(rules, null, 2) + '\n');
console.log('rules written:', process.argv[2]);
