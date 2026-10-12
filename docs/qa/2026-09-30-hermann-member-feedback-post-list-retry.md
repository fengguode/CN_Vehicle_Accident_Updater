# Hermann member feedback post/list recovery — 2026-09-30

## Runtime and scope

- Target: isolated current-source `updater-vnext` service with disposable synthetic member/admin data; live `127.0.0.1:8788` was not contacted by the browser runner.
- Browser: headed Microsoft Edge 154.0.4258.37, viewport 1280×900, Playwright Core.
- Source: runner verified its six served UI assets against the current workspace bundle.
- Purpose: simulate a successful feedback POST followed by a failed automatic `/api/feedback/mine` refresh, then verify recovery does not submit twice.

## Acceptance and results

PASS. Member Issue submission returned HTTP 201. The success receipt included the request reference and success styling; the form cleared. The immediately following own-list GET returned synthetic HTTP 503 and displayed the error with a visible Try again control; `aria-busy` returned to `false`. Clicking Try again made a second list GET, loaded exactly one request card, hid the retry control, and left the POST count at one. Zero page errors.

The runner reported disposable data and browser profile removed and the isolated service stopped. Live port 8788 was not touched by the runner. No defect found.

## Evidence

- Runner: `../../output/playwright/member-feedback-submit-list-refresh-retry-20260930/run.mjs`
- Results: `../../output/playwright/member-feedback-submit-list-refresh-retry-20260930/result.json`
- Screenshots: `../../output/playwright/member-feedback-submit-list-refresh-retry-20260930/post-success-list-load-failure.png`, `../../output/playwright/member-feedback-submit-list-refresh-retry-20260930/queue-error-retry.png`, `../../output/playwright/member-feedback-submit-list-refresh-retry-20260930/queue-retry-recovered.png`
