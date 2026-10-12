# Hermann signed-out protected-route browser QA — 2026-09-29

## Runtime and scope

`updater-vnext` localhost `http://127.0.0.1:8788` was available (`/health` 200). Port 8793 continued to refuse connections. Used headed Microsoft Edge with direct Node Playwright API, disposable profile, current source, 390×844 and 320×844 viewports. All six served shell/UI assets matched workspace source. No credentials or non-GET requests were sent to the live service.

## Observed behavior

- Signed-out Reports and Account targets were available; User management, Feedback, and Media review navigation targets were hidden.
- `GET /api/feedback/mine`, `/api/admin/feedback`, `/api/reports`, `/api/filters`, and `/api/summary` each returned 401 `authentication_required`.
- At 320px, document, body, and viewport widths were all 320px. No page errors.
- Browser network API requests were GET-only (`/api/auth/me`).

## Outcome

Pass; no new defect found. One initial QA harness attempt stopped before protected API requests due to a harness initialization error (`protectedRoutes` array missing); corrected the harness and reran the complete browser/API check successfully. No product request or write occurred during the failed harness attempt.

See [runner and structured evidence](../../output/playwright/live-boundary-current-20260929/), including screenshots and exact asset hashes. Port 8788 remained healthy after the session. The actual authenticated live user path remains unverified because the active database identity is unknown; authenticated member/admin journeys remain isolated per `LIVE-FEEDBACK-01`.

Repository: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. QA/backlog artifacts are uncommitted within the existing shared changes; no source edit, commit, or push.
