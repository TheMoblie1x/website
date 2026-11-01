# Firebase (Realtime Database + Auth)

Project: `takemytest-d6714`. Staff sign in with **Google**; candidates will use Firebase
**anonymous** sign-in plus an invite link.

## Access model
- `members/{uid}` — which company a signed-in person belongs to and their role
  (`owner`, `manager`, `evaluator`). Only an owner can change it, or the person themselves
  can create it **once**, exactly matching an invite.
- `pendingMembers/{emailKey}` — an owner's invite for an email address (dots become commas,
  e.g. `jane,doe@gmail,com`). Claimed automatically on that person's first Google sign-in
  (verified email only), then deleted.
- Data is partitioned by company: `tests/{companyId}`, `answerKeys/{companyId}`,
  `attempts/{companyId}`, `results/{companyId}`, `companyInvites/{companyId}`.
- Candidates read a test through `invites/{token}` (unguessable token) and write only their
  own attempt; they can never read answer keys or write scores.

The UI role matrix lives in `src/auth/roles.ts`; the database rules are what actually enforce it.

## Rules
`database.rules.json` is generated. Edit `generate-rules.mjs`, then:

```sh
node firebase/generate-rules.mjs firebase/database.rules.json
```

Deploy by pasting into Console → Realtime Database → Rules, or PUT it to
`<databaseURL>/.settings/rules.json` with an admin access token.

## Testing the rules
`rules-test.mjs` creates temporary users and companies (all prefixed `zz_`), checks that
allowed actions work and forbidden ones are denied, then deletes everything it created.

```sh
node firebase/rules-test.mjs <service-account.json> <web-app-config.json>
```

Keep the service-account key outside this repository and never commit it.
