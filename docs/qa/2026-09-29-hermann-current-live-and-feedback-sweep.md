# Hermann current live signed-out and feedback lifecycle sweep — 2026-09-29

## Target and safe test setup

- Selected variant: `updater-vnext`, following its `README.md`.
- Live localhost `http://127.0.0.1:8788/health` returned 200 before testing; port 8793 refused connections. The live service's effective database remains unidentified, so its browser session was signed-out/read-only only.
- Browser: headed Microsoft Edge 154.0.4258.37 with direct Node Playwright API and disposable profiles.
- Live UI was checked at 390×844 and 320×844. The six served root/UI assets matched current workspace source exactly, including `app.js` SHA-256 `dc89716730effa108c47f66089a607f7c3cb74171bc4c9ef0470c35ec16ba763` and `styles.css` SHA-256 `8550ae76526eb900b6eb74749daacf196e528e47b5c2d1a4980457e2c92f028b`.

## Live signed-out findings

- Reports rendered the approved-account gate; Account login and invitation registration rendered.
- Signed-out navigation hid both admin and Feedback links. Invitation code was required and its helper text was linked with `aria-describedby=invite-help`; helper was present in English and Chinese.
- At 320 and 390 CSS pixels, document and body widths matched viewport widths. No browser page errors.
- Only API request was anonymous `GET /api/auth/me`, returning `user:null`. No credentials or writes were sent.
- No new defect found in this pass. The previously tracked invitation-request guidance gap remains as recorded in `UX-REG-01`.

## Current-source isolated member/admin feedback lifecycle

Because the live authenticated data store was not safe to identify, current authenticated paths were exercised on a fresh disposable SQLite DB and ephemeral local service (port 56587), with synthetic approved member/admin accounts. The isolated service served all six UI files byte-for-byte from current source.

- Member and admin each submitted an Issue (201) and saw it in their own Account list; member admin navigation stayed hidden.
- Admin Feedback queue resolved loading, showed both submissions, and attributed the member request.
- Admin moved the member request to `Under review` with a public update/private note, then to `Complete` with another public update/private note. Reload retained current status and event history.
- Member re-login showed both public updates and all three events (`Submitted`, `Under review`, `Complete`). Neither private note appeared in rendered member text or `/api/feedback/mine`.
- Zero page errors. Only expected feedback writes occurred on the isolated service. Service was stopped, its health endpoint no longer responded, and its DB/profile were removed. Port 8788 remained healthy and untouched.

## Result and artifacts

No current-source defect found in the tested signed-out or feedback lifecycle paths. This pass does not reproduce the user's reported stuck queue on port 8793: that listener is unavailable, and no authenticated requests were sent to 8788. Keep `LIVE-FEEDBACK-01` open.

- [Signed-out live browser results and screenshots](../../output/playwright/live-signedout-current-20260929/)
- [Current-source synthetic lifecycle runner, result, and screenshots](../../output/playwright/feedback-lifecycle-current-dc897-20260929/)

Repository: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. QA/backlog/artifacts are uncommitted among existing shared changes; no product source change, commit, push, or live DB mutation. `git diff --check` passed; Git printed line-ending conversion advisory warnings.
