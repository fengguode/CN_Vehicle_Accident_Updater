# Hermann unregistered-to-approved-member feedback journey — current source

**Date:** 2026-09-29 (Asia/Shanghai)  
**Owner:** Primary agent, Hermann User Tester  
**Target:** Current `updater-vnext` source on an isolated ephemeral localhost service  
**Outcome:** Exercise invitation, registration, pending-member access, feedback submission, admin approval, and approved-member report access using synthetic identities/data only.

## Acceptance checks

1. Start a disposable database/service with only a synthetic administrator and verify health plus all six asset hashes.
2. Have the synthetic admin issue an invitation; register a new synthetic member through the browser and confirm its initial pending state.
3. Confirm Reports are gated and admin navigation hidden while pending, while feedback submission remains available to the signed-in user.
4. Verify the admin queue loads and attributes the request; approve the member; re-login as the member and confirm Reports access without admin navigation.
5. Verify no page errors and remove the temporary service/database/profile; do not touch 8788.

## Results

- Microsoft Edge 154.0.4258.37, headed Playwright Node API, 390×844, disposable profile. Isolated `apps/api/server.js` at port 64298 with a disposable SQLite DB; synthetic admin and new synthetic member. Health 200 and initial auth user-null.
- Six served assets matched local source: `index.html` `38efdd3f…`, `app.js` `f553ae45…`, `styles.css` `64989f09…`, `navigation.js` `c2658b3d…`, `viewport.js` `fef9e10e…`, `report-presentation.js` `dc9065ad…`.
- Admin invitation creation returned 201. Registration by Enter returned 201; the new identity was a member with `approved:false`.
- Pending member saw the approval gate, no report cards/search access, and no admin/Feedback navigation. Issue submission returned 201 and appeared in the member's own feedback list.
- Synthetic admin queue resolved loading and showed the member request. User approval PATCH returned 200 and displayed “Changes saved.” Member re-login showed `approved:true`; Reports gate was hidden, Reports view was available, and admin/Feedback navigation remained hidden.
- Zero page errors. Expected synthetic calls only; DB after the journey held two users, one invitation, and one feedback row. Isolated service stopped, health failed after shutdown, temporary DB/profile directory removed, and `port8788Touched:false`.
- Two earlier strict preflight attempts aborted before browser launch when the source changed from the originally assigned hashes. After the source stabilized, the current-bundle rerun passed. The generated one-use invitation token was redacted from `results.json`, and its screenshot was removed; no live credential or data was involved.

## Disposition

The unregistered-to-approved-member flow and pending-member feedback path passed in isolation on current source. This does not identify or reproduce the owner's authenticated port-8793 session; LIVE-FEEDBACK-01 remains open. No product defect was observed in this scoped run.

## Artifacts and Git

- [Sanitized results/API trace](../../output/playwright/onboarding-feedback-current-f553-20260929/results.json)
- [Runner](../../output/playwright/onboarding-feedback-current-f553-20260929/run.mjs)
- [Pending Reports gate screenshot](../../output/playwright/onboarding-feedback-current-f553-20260929/pending-reports-gate.png)
- [Pending member submission screenshot](../../output/playwright/onboarding-feedback-current-f553-20260929/pending-member-issue-submitted.png)
- Repository: `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. Source was already dirty in the shared checkout; this session added only QA/backlog/artifacts. No commit or push.
