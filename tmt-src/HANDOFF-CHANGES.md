# TakeMyTest: what changed in the Firebase migration

Read `HANDOFF.md` (state and build steps), `BRAND.md` and `firebase/README.md` first.

## Data
- Tests, answer keys, attempts, results and company branding live in Firebase (`src/data/*`, `src/utils/storage.ts`).
  `storage.ts` keeps the old synchronous API as a cache that writes through in order; the top bar shows "Saving… / All changes saved / error".
- Answers are split out of the test: `tests/{cid}` and invite snapshots hold no answers, `answerKeys/{cid}` (staff only) holds them.
- Scores are not stored on attempts (rules forbid it). Finished attempts get an automatic result in `results/{cid}/{attemptId}` for objective questions;
  written and coding answers are marked by hand in Submissions → "Review & mark" (evaluators, managers, owners).
- Staff "Preview as candidate" runs are never saved.
- Assessments saved in a browser by the older version can be imported from a banner in the Assessments tab; an empty company can add a sample assessment.

## Candidate links
- Manager creates a link per published assessment (Assessments tab → Candidate links): 128-bit token, expiry, optional one-candidate-only, revoke.
- `?invite=<token>` opens `src/candidate/CandidateApp.tsx`, which uses its own Firebase app instance and anonymous sign-in (`src/firebase/candidateClient.ts`),
  so a signed-in staff session in the same browser is untouched. Branding comes from the link (white-label). Progress is saved about every 2 seconds,
  the attempt resumes after a reload, and the finish screen shows a receipt, not a score.
- Only published assessments can be invited: enforced in the UI and by the database rule (creation only; revoking always works).

## Content protection
`src/components/ContentProtection.tsx` and `src/utils/contentProtection.ts`: questions hide on focus loss, copy / print / context menu / PrintScreen are blocked
on a best-effort basis, and a watermark (name, email, attempt ID, time) covers the page. Admin switch "Discourage screenshots and copying" (default on).
It discourages and makes leaks traceable; it cannot stop OS screenshots, screen recording or a phone camera, and product copy must not say it does.

## Other changes
- Simulated proctoring removed everywhere (sweep badge, audit panel, email badge, sample data, types and settings).
- Plan limits (assessments, candidates per month, seats, canceled subscription) are checked in the UI (`src/data/limits.ts`). The database cannot count records,
  so these are guard rails, not a security control.
- Privacy page at `#privacy`, linked from the landing footer and waitlist tile.
- Preview results screen and test footer no longer make claims about email or server storage that were not true; the mock email outbox buttons and the demo
  tenant switcher were removed from admin.
- Rules: `firebase/generate-rules.mjs` now requires a published test for new invites. Deployed to `takemytest-d6714`; harness result 128 passed, 0 failed.

## Verified
`npx tsc --noEmit` clean; 40 unit tests pass; `firebase/rules-test.mjs` 128 passed, 0 failed against the deployed rules; local scratch build checked in a browser
(privacy page, invalid-link screen, landing tiles).

## Verify commands
```sh
cd tmt-src
npx tsc --noEmit
node --import tsx --test src/auth/roles.test.ts src/utils/excelParser.test.ts src/landing/waitlistLogic.test.ts src/utils/contentProtection.test.ts src/data/transform.test.ts src/data/limits.test.ts
node firebase/generate-rules.mjs firebase/database.rules.json
node firebase/rules-test.mjs <service-account.json> <web-app-config.json>
```
Ship: `npx vite build` (writes `../tmt`), then `git add tmt tmt-src && git commit && git push origin main`.
