# Hermann current-source administrator queue recovery regression (2026-09-30 14:07 local)

## Preflight

- Isolated synthetic service `http://127.0.0.1:8793`, health `ok:true`, UI root HTTP 200.
- Headed Microsoft Edge 154.0.4258.37 via Playwright Core; fresh context; viewport 1280×900.
- Workspace and served `apps/web/app.js` SHA-256 matched `67bf07b144453158a9b6c1f6ba229ba793f8575f462fb36d625597f4c0e4bce7`.
- Synthetic admin account only. No data mutation; port 8788 untouched.

## FEEDBACK-QUEUE-STALL-01 and FEEDBACK-FILTER-FOCUS-01

Held an admin queue GET for 8.5 seconds. The UI left busy state, displayed “The feedback queue took too long to load. Try again,” and exposed one retry button. Clicking Retry returned HTTP 200 and rendered 29 queue records. Releasing the old held request afterward did not overwrite the recovered result or status. The intentionally timed-out request was aborted (`net::ERR_ABORTED`), which is expected cancellation behavior; the retry and later filter requests succeeded.

Changed Status using keyboard focus + ArrowDown + Enter. The queue announced “Feedback queue updated; showing 21 requests,” used `role=status` and `aria-live=polite`, and retained the initiating Status select as the active element with a visible 3px focus outline (`:focus-visible=true`). No page exceptions occurred.

Result: PASS for timeout, retry, stale-response protection, and keyboard filter focus on current source. Machine evidence and screenshots: [`edge-current-source-admin-queue-recovery-results.json`](../../output/playwright/live-feedback-user-story-suite-20260930/edge-current-source-admin-queue-recovery-results.json) and adjacent queue/filter screenshots. The broader story matrix remains In progress.
