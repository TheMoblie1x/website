# TakeMyTest handoff

Live: https://mobile1x.com/tmt/ · Repo: `TheMoblie1x/website` (`main`, deploys on push via Netlify)
Source: `tmt-src/` · Built output (committed, what Netlify serves): `tmt/`

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
- **Firebase** `takemytest-d6714`: rules generated from `firebase/generate-rules.mjs`; `firebase/rules-test.mjs` runs 125 checks
  against the live project and cleans up after itself (last run: 125 passed).
- **Seeded data:** companies Acme, Apex, FinEdge (placeholder names), Cyberark (added by the owner in the console); owner invite
  for `rahulpahuja2015@gmail.com` at Acme; one plan, "Free trial", with placeholder limits (3 assessments, 25 candidates/month, 3 seats).
- **Landing page + waitlist:** public; waitlist in `waitlist/`, readable and exportable only by the super user (Platform console, Waitlist tab).
- **Design skill:** `design-taste-frontend` installed globally (from github.com/leonxlnx/taste-skill, audited before install).
  Working folder `tmt-src/.taste-skill/` is git-ignored.
- **Secrets:** the Firebase service-account key lives only in `~/Downloads` (owner-only). It is not in the repo. Delete it when setup is done.

## FLAGS (open, in rough priority order)
1. **Simulated "AI" proctoring: mostly fixed, one leftover.** Gaze, second-device and audio detection were simulated (random numbers, a Simulate panel).
   The room-sweep step, the live camera HUD and the four fake switches are removed from the candidate and admin screens; the admin now offers only the two
   real checks (full screen, tab-switch limit). **Leftover:** the sample submissions in `seedData.ts` still carry a `roomSweep` record, so Analytics shows a
   "360° sweep certified" tile, the success screen can show a sweep badge, and the sent email can say "Room Sweep Certified" for those samples. Remove the
   tile/badge/email text and the sample `roomSweep` data. The component files `AiProctoringLiveHUD.tsx` and `AiProctoringSweepModal.tsx` are unused but still in the repo.
2. **Data is still per browser.** Tests, attempts and results are in `localStorage` (keys `testforge_*`), not Firebase. Not shared across devices
   or users. The footer on the test screen now says "Saved on this device" (it used to claim "Synced with server").
3. **Candidate invite links are not built.** Candidates cannot take a test from a link. "Preview as candidate" is the only way in.
   The Published switch does not hide unpublished tests from candidates yet.
4. **Plan limits are display-only.** Nothing enforces assessments, candidates or seats.
5. **Payments are not built.** Needs: a provider choice (Razorpay or Stripe), account and keys entered by the owner as Netlify
   environment variables (never in the repo or chat), and real plan prices.
6. **Evaluators cannot score anything.** The `submissions:grade` permission exists, but there is no grading screen, and written answers are not auto-scored.
7. **Stale branding: partly fixed.** Receipt prefixes are now `TMT-` (code and sample data). Internals still say `testforge` (module `types/testforge`,
   `testforge_*` storage keys); renaming the storage keys would orphan saved data, so it was left.
8. **Waitlist.** Email only now (the name/company/interest fields were dropped in the redesign; the console columns remain, blank for new entries).
   No email is sent automatically; export the CSV and mail people yourself. There is no privacy-policy page. The public write endpoint has
   field validation and a honeypot but no rate limit. The line "We use your email only to contact you about TakeMyTest early access" is a commitment written for the owner; review it.
9. **Landing redesign status.** Inspector: 0 FAIL, 6 WARN at 1440/768/390 (card rows; no photographs or video, deliberate for software; line length;
   empty middle on the action row; a ~450px blank stretch near the end, cause not found). The skill's three-round critique write-up was not completed; only the
   first screen and the phone first screen were reviewed visually. Pictures are interface fragments, all sample content is labelled as examples.
10. **Not visually verified:** the signed-in screens (dashboard, console, test view) in the new palette. They could not be opened without a real Google
    sign-in. The signed-in app screens were not redesigned (separate "app screens" run in the skill).
11. **Saved tenant colours.** Browsers that already saved the old default company colours keep them until local data is reset.
12. **Rules and sign-in.** If sign-in ever fails on the live site, add an invite for the Google account in use (a one-line write under
    `pendingMembers/<email with . as ,>` = `{companyId, role}`) using an admin token.
