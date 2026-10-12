# Hermann member/admin feedback flow — current source

**Date:** 2026-09-29 (Asia/Shanghai)  
**Owner:** Primary agent, Hermann User Tester  
**Target:** Current `updater-vnext` source served by an isolated local API process on an ephemeral port  
**Outcome:** Recheck that an approved member can submit feedback and an admin can load/triage the queue without using the live 8788 database.

## Acceptance checks

1. Seed only synthetic admin/member identities and a disposable database; bind an ephemeral port and verify service health.
2. Confirm the six served UI assets exactly match the source before browser interaction.
3. In headed Edge, sign in as synthetic member and admin, submit one Issue as each, verify own-list and admin queue visibility, triage the member request, then verify public/private separation from the member account.
4. Record API outcomes/errors and remove the fixture, browser profile, and service; leave 8788 untouched.

## Results

- Isolated `apps/api/server.js` at `http://127.0.0.1:52264`, ephemeral port; disposable SQLite database; synthetic approved member and synthetic admin; Edge 154.0.4258.37 headed, Playwright direct Node API, 390×844.
- Health returned 200, initial auth was signed out, and all six served assets matched source. The tested app hash was `f3871211…`; stylesheet hash `0f2c9475…`.
- Member Issue creation returned 201, appeared as Submitted in that member's own list, and member Feedback/Admin navigation stayed hidden.
- Admin Issue creation returned 201 and appeared in the admin's own list. Admin navigation was visible; Feedback opened with `aria-busy=false`, and the queue displayed both synthetic submissions with attribution.
- Admin triage of the member request returned 200 with status Under review, a public update, and a private note. On member re-login, Under review and the public update were visible while the private note was absent.
- Zero page errors. Expected synthetic calls only: two feedback POSTs and one triage PATCH, plus synthetic auth login/logout. No API error was observed.
- Cleanup confirmed isolated service stopped, isolated health unavailable afterward, temporary DB/profile directory removed, and `port8788Touched:false`.

## Disposition

Current-source member submission, admin submission, queue loading, triage, and public/private display passed in isolation. This does not verify the owner-reported authenticated 8793 session and does not identify the database behind the live 8788 process. `LIVE-FEEDBACK-01` remains open. No product defect was observed in this scoped run.

## Artifacts and Git

- [Results and API trace](../../output/playwright/feedback-role-current-f387-20260929/results.json)
- [Runner](../../output/playwright/feedback-role-current-f387-20260929/run.mjs)
- [Admin triage screenshot](../../output/playwright/feedback-role-current-f387-20260929/admin-triage-public-private.png)
- [Member visibility screenshot](../../output/playwright/feedback-role-current-f387-20260929/member-public-private-visibility.png)
- Repository: `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. UI/API/DB source was already dirty in the shared checkout; this session added QA/backlog/artifacts only. No commit or push.
