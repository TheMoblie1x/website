# TakeMyTest handoff

Live: https://mobile1x.com/tmt/ · Repo: `TheMoblie1x/website` (`main`, deploys on push via Netlify)
Candidate links: `?invite=<token>`. Source: `tmt-src/` · Built output (committed, what Netlify serves): `tmt/`

## Build and ship
```sh
cd tmt-src
npx tsc --noEmit
node --import tsx --test src/auth/roles.test.ts src/utils/excelParser.test.ts src/landing/waitlistLogic.test.ts
npx vite build            # writes ../tmt (base /tmt/)
cd .. && git add tmt tmt-src && git commit && git push origin main
```
Brand rules and contrast table: `tmt-src/BRAND.md`. Firebase rules, tooling and tests: `tmt-src/firebase/README.md`.

## State
- **Auth/RBAC:** Google sign-in. Roles owner / manager / evaluator per company; super user = verified email listed under
  `platformAdmins` (currently `therahulpahuja@gmail.com`). One Google account belongs to one company.
- **Firebase** `takemytest-d6714`: rules generated from `firebase/generate-rules.mjs`; `firebase/rules-test.mjs` runs 128 checks
  against the live project and cleans up after itself (last run: 128 passed).
- **Data:** tests, answer keys, attempts, results and branding are stored per company in Firebase (see `HANDOFF-CHANGES.md`).
- **Seeded data:** companies Acme, Apex, FinEdge (placeholder names), Cyberark (added by the owner in the console); owner invite
  for `rahulpahuja2015@gmail.com` at Acme; one plan, "Free trial", with placeholder limits (3 assessments, 25 candidates/month, 3 seats).
- **Landing page + waitlist:** public; waitlist in `waitlist/`, readable and exportable only by the super user (Platform console, Waitlist tab).
- **Design skill:** `design-taste-frontend` installed globally (from github.com/leonxlnx/taste-skill, audited before install).
  Working folder `tmt-src/.taste-skill/` is git-ignored.
- **Secrets:** the Firebase service-account key lives only in `~/Downloads` (owner-only). It is not in the repo. Delete it when setup is done.

See `HANDOFF-CHANGES.md` for the Firebase migration, candidate links, grading and content protection, and its "Open items" list of what is still to do.
