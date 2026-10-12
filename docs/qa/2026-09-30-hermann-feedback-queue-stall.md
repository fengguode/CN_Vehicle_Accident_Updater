# Hermann administrator feedback queue stalled-request UX — 2026-09-30

## Runtime and browser

- Target: isolated current-source `updater-vnext` service on an ephemeral localhost port with disposable SQLite DB and Edge profile. Live 8788 received no authenticated traffic or writes.
- Browser: headed Microsoft Edge 154.0.4258.37 via cached Playwright Core; viewport 1280×900.
- Preflight: isolated `/health` 200; all six served UI assets exactly matched workspace files, including app.js SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450` and styles.css `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`.
- Fixture: synthetic approved member submitted one Issue (201); synthetic administrator opened Feedback.

## Reproduction and outcome

Held the browser's first `/api/admin/feedback` request before it reached the isolated service. After 8 seconds, the admin UI still displayed “Loading feedback queue…”, `#admin-feedback-list` remained `aria-busy="true"`, no request cards appeared, and no error or retry control was shown. Changing Status to Submitted triggered a second GET that completed and recovered the queue; releasing the older held request afterward did not disrupt the recovered view.

Finding **FEEDBACK-QUEUE-STALL-01 (P2, In progress)**: a stalled queue request has no timeout or explicit retry/error state; it can be worked around by changing a filter, which triggers a fresh GET. This matches the reported stuck-loading symptom while the active request remains pending. This isolates the browser behavior; it does not establish the cause or database/API condition on live 8788.

No browser page errors. Temporary service, DB and profile removed. Port 8788 untouched.

## Evidence

- Runner: `../output/playwright/admin-feedback-queue-stall-current-3e477-20260930/run.mjs`
- Results: `../output/playwright/admin-feedback-queue-stall-current-3e477-20260930/result.json`
- Screenshots: `../output/playwright/admin-feedback-queue-stall-current-3e477-20260930/queue-stalled-after-8s.png` and `queue-recovered-after-release.png`

