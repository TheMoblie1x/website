// Generates database.rules.json from named fragments so parentheses stay balanced.
// Usage: node firebase/generate-rules.mjs firebase/database.rules.json
import { writeFileSync } from 'node:fs';

/* ---- building blocks -------------------------------------------------- */
const myCo = "root.child('members').child(auth.uid).child('companyId').val()";
const myRole = "root.child('members').child(auth.uid).child('role').val()";
const isOwner = `${myRole} === 'owner'`;
const isMgr = `(${myRole} === 'owner' || ${myRole} === 'manager')`;
const inCo = (cid) => `${myCo} === ${cid}`;

// Email key derived from the verified Google email (must match roles.ts emailKey()).
const emailKeyExpr = "auth.token.email.toLowerCase().replace('.', ',')";
const verified = 'auth.token.email_verified === true';
// Platform administrator ("super user"): a verified email listed under /platformAdmins.
const PA = `(auth != null && ${verified} && root.child('platformAdmins').child(${emailKeyExpr}).exists())`;

const staffOfCo = `auth != null && ${inCo('$cid')}`; // any role in the company
const mgrOfCo = `auth != null && ${inCo('$cid')} && ${isMgr}`;
const ownerOfCo = `auth != null && ${inCo('$cid')} && ${isOwner}`;
const staffOrPA = `(${staffOfCo}) || ${PA}`;
const mgrOrPA = `(${mgrOfCo}) || ${PA}`;

/* ---- invites & attempts (candidate side) ------------------------------ */
const tok = "newData.child('inviteToken').val()";
const inv = (f) => `root.child('invites').child(${tok}).child('${f}').val()`;
const existingAttemptOk =
  `data.child('candidateUid').val() === auth.uid && data.child('inviteToken').val() === ${tok} && ` +
  `data.child('status').val() !== 'SUBMITTED' && data.child('status').val() !== 'TERMINATED_MALPRACTICE' && data.child('status').val() !== 'EXPIRED'`;
const newAttemptOk = `${inv('expiresAt')} > now && (${inv('single')} !== true || ${inv('claimedBy')} === auth.uid)`;
const candidateWrite =
  `newData.exists() && newData.child('candidateUid').val() === auth.uid && ` +
  `${inv('companyId')} === $cid && ${inv('testId')} === newData.child('testId').val() && ${inv('revoked')} !== true && ` +
  `(data.exists() ? (${existingAttemptOk}) : (${newAttemptOk}))`;
const managerDelete = `!newData.exists() && ${isMgr} && ${inCo('$cid')}`;

/* ---- membership -------------------------------------------------------- */
const ownerManagesMember =
  `auth != null && ${isOwner} && ` +
  `((newData.exists() && newData.child('companyId').val() === ${myCo} && (!data.exists() || data.child('companyId').val() === ${myCo})) || ` +
  `(!newData.exists() && data.child('companyId').val() === ${myCo}))`;
const pend = (f) => `root.child('pendingMembers').child(${emailKeyExpr}).child('${f}').val()`;
// First sign-in: a person may create their OWN membership, but only exactly as an owner invited their verified email.
const claimOwnMembership =
  `auth != null && auth.uid === $uid && !data.exists() && ${verified} && ` +
  `${pend('companyId')} === newData.child('companyId').val() && ${pend('role')} === newData.child('role').val()`;
const memberWrite = `(${ownerManagesMember}) || (${claimOwnMembership}) || ${PA}`;

// The person whose email key this is may delete their own invite (done when claiming it).
const claimantRemovesInvite = `!newData.exists() && auth != null && ${verified} && ${emailKeyExpr} === $emailKey`;
const roleSet = "(newData.child('role').val() === 'owner' || newData.child('role').val() === 'manager' || newData.child('role').val() === 'evaluator')";

const rules = {
  rules: {
    '.read': false,
    '.write': false,

    // Super users: only listed by an administrator (Admin SDK / console). Nobody can write this from the app.
    platformAdmins: {
      $emailKey: { '.read': `auth != null && ${verified} && ${emailKeyExpr} === $emailKey`, '.write': false },
    },

    members: {
      $uid: {
        '.read': `auth != null && (auth.uid === $uid || ${PA})`,
        '.write': memberWrite,
        '.validate': `newData.hasChildren(['companyId', 'role']) && ${roleSet}`,
      },
    },

    companyMembers: {
      $cid: {
        '.read': staffOrPA,
        $uid: { '.write': `(${ownerOfCo}) || (auth != null && auth.uid === $uid && ${myCo} === $cid) || ${PA}` },
      },
    },

    // Invites claimed on first sign-in. Looked up by the invitee's own email key.
    pendingMembers: {
      $emailKey: {
        '.read': `auth != null && ((${verified} && ${emailKeyExpr} === $emailKey) || (${isOwner} && data.child('companyId').val() === ${myCo}) || ${PA})`,
        '.write': `auth != null && ((${isOwner} && (newData.exists() ? newData.child('companyId').val() : data.child('companyId').val()) === ${myCo}) || (${claimantRemovesInvite}) || ${PA})`,
        '.validate': `newData.hasChildren(['companyId', 'role']) && ${roleSet}`,
      },
    },

    // Per-company list of invites so owners can see and revoke them.
    companyPending: {
      $cid: {
        '.read': `(${ownerOfCo}) || ${PA}`,
        $emailKey: {
          '.write': `(${ownerOfCo}) || (${claimantRemovesInvite}) || ${PA}`,
        },
      },
    },

    companies: {
      '.read': PA, // list every company
      $cid: {
        '.read': staffOrPA,
        // Owners edit their own company's details; only a platform admin creates or deletes companies.
        '.write': `(${ownerOfCo} && data.exists() && newData.exists()) || ${PA}`,
      },
    },

    // Plans catalogue and per-company subscriptions are controlled by platform admins only.
    plans: {
      '.read': 'auth != null',
      $planId: { '.write': PA },
    },
    subscriptions: {
      '.read': PA,
      $cid: { '.read': staffOrPA, '.write': PA },
    },

    tests: { $cid: { '.read': staffOrPA, '.write': mgrOrPA } },
    answerKeys: { $cid: { '.read': staffOrPA, '.write': mgrOrPA } },
    companyInvites: { $cid: { '.read': mgrOrPA, '.write': mgrOrPA } },

    invites: {
      $token: {
        '.read': 'auth != null',
        '.write': `auth != null && ${isMgr} && ${myCo} === (newData.exists() ? newData.child('companyId').val() : data.child('companyId').val())`,
        claimedBy: { '.write': 'auth != null && !data.exists() && newData.val() === auth.uid' },
      },
    },

    attempts: {
      $cid: {
        // Staff can list their company's attempts; candidates can only read their own (see $aid below).
        '.read': staffOrPA,
        '.indexOn': ['testId', 'candidateEmail', 'submittedAt'],
        $aid: {
          '.read': `auth != null && (data.child('candidateUid').val() === auth.uid || ${inCo('$cid')} || ${PA})`,
          '.write': `auth != null && ((${managerDelete}) || (${candidateWrite}))`,
          totalScore: { '.validate': false },
          maxScore: { '.validate': false },
          percentageScore: { '.validate': false },
          isPassed: { '.validate': false },
        },
      },
    },

    results: { $cid: { '.read': staffOrPA, '.write': staffOrPA } },
  },
};

/* ---- sanity: balanced brackets in every expression ---------------------- */
const walk = (o, path = '') => {
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'string' && k.startsWith('.')) {
      let d = 0;
      for (const ch of v) {
        if (ch === '(') d++;
        if (ch === ')') d--;
        if (d < 0) break;
      }
      if (d !== 0) {
        console.error('UNBALANCED at', path + '/' + k);
        process.exit(1);
      }
    } else if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, path + '/' + k);
  }
};
walk(rules);
writeFileSync(process.argv[2], JSON.stringify(rules, null, 2) + '\n');
console.log('rules written:', process.argv[2]);
