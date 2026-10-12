# Hermann feedback retry after committed POST with lost response — 2026-09-30

## Runtime and scope

- Target: isolated current-source `updater-vnext` service with disposable synthetic member/admin and database; live port 8788 was untouched.
- Browser: headed Microsoft Edge 154.0.4258.37, viewport 1280×900, Playwright Core.
- All six served UI assets matched workspace source.
- Fault injection let the first feedback POST reach and commit in the service, then returned a synthetic HTTP 503 to the browser; the user retried the retained form.

## Reproduction and result

DEFECT reproduced. The service returned HTTP 201 to the intercepted upstream POST, but the browser received HTTP 503. The UI showed an error, retained the draft, re-enabled Submit, showed no request card, and offered no indication that the first record had committed. A direct own-list GET confirmed one committed request. Retrying submitted a second POST and returned 201; the member list then showed two records with the same title.

Finding `FEEDBACK-IDEMPOTENCY-01` is open. An ambiguous response must not make a retry silently create a second feedback record; use a stable submission idempotency key or equivalent safe reconciliation.

Zero page errors; disposable data/profile removed and isolated service stopped.

## Evidence

- Runner: `../../output/playwright/member-feedback-ambiguous-post-retry-20260930/run.mjs`
- Results: `../../output/playwright/member-feedback-ambiguous-post-retry-20260930/result.json`
- Screenshot: `../../output/playwright/member-feedback-ambiguous-post-retry-20260930/retry-created-second-feedback-record.png`
