# Hermann member/admin feedback authorization QA — 2026-09-29

## Setup

`updater-vnext` current source was tested in headed Microsoft Edge 154 via direct Node Playwright API, 390×844, against an ephemeral localhost service with a disposable SQLite database and synthetic admin/member accounts. All six served UI assets exactly matched current source (`app.js` `dc897167…`, CSS `8550ae76…`). Live port 8788 health was 200 before the run and was not accessed for authenticated operations.

## Checks and result

- Approved regular member saw no admin or Feedback navigation.
- As that signed-in member, a direct same-origin `GET /api/admin/feedback` returned 403 with `admin_required`.
- Member and admin each created an Issue and saw their own submission. Admin queue loaded and showed both with correct member attribution.
- Admin triaged the member request to `Under review` then `Complete`; reload retained history. Member re-login displayed public updates and all three lifecycle events, while private notes remained absent from member UI and API response.
- Zero browser errors. Isolated service stopped, health endpoint disappeared, and disposable DB/profile removed; port 8788 was untouched.

Pass; no authorization/lifecycle defect found. See [runner, structured result and screenshots](../../output/playwright/member-admin-route-guard-current-20260929/). No live account credentials or writes were used.

Repository: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. QA/backlog artifacts are uncommitted among existing shared changes; no source edit, commit, or push.
