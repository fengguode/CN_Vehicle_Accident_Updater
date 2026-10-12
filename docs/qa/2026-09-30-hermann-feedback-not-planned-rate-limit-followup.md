# Hermann feedback Not planned rationale and rate-limit follow-up — 2026-09-30

## Acceptance

- **Target:** isolated current-source vNext at `127.0.0.1:8793`, fresh read-only route parity preflight; all eight UI assets matched the workspace source, app.js SHA-256 `df4f730e6511e626ff3ee3c8b3bb0d075c25211f6f459555ab15538f7df6ab94`.
- **Browser:** headed Microsoft Edge 154.0.4258.37, Playwright Core, viewport 390×844.
- **Not planned rationale — PASS:** The synthetic member saw the public status and full rationale in both the rendered own-request list and `/api/feedback/mine`. The member API/UI did not expose the private admin note or admin identity. No page errors. Screenshot: [`not-planned-member.png`](../../output/playwright/not-planned-429-followup-20260930/not-planned-member.png).
- **429 recovery — NOT RUN:** The fixture had only two requests within the rolling hour, despite a larger all-time list. Two submissions returned HTTP 201. The 429 message/recovery state therefore was not tested and no product conclusion is drawn.

## Synthetic data and cleanup

Two synthetic feedback events were created by the unsuccessful rate-limit setup attempts. Exact-ID deletion was rejected by the database's append-only event rule and the transaction rolled back. Hermann stopped further writes and closed both browser profiles. The records are test-only; do not treat them as user feedback. Because the database is an isolated disposable fixture, remove/reseed the whole database when its 8793 test session is retired; individual event deletion is unsupported. Port 8788 and production data were untouched.

Sanitized machine summary: [`results-sanitized.json`](../../output/playwright/not-planned-429-followup-20260930/results-sanitized.json). The original detailed output remains in the local temp evidence directory and contains synthetic fixture identifiers; it is not copied into the repository.

## Disposition

Close the member-visible Not planned rationale scenario. Keep 429 user-facing recovery open under `QA-01` / `LIVE-FEEDBACK-01`. This feedback slice does not close full product acceptance or the separate live 8788 module-route mismatch.
