# Superseded partial triage localization harness (2026-09-30 14:32 local)

## Target and preflight

- Isolated `http://127.0.0.1:8793` was healthy and served the then-current workspace app.js SHA-256 `e614a57ae24f52d0564bc3f632a424d996899f7b63122ab5d0c332c577941311` and styles.css SHA-256 `61e43beb97e57899738c65e6662bd05107dc4e7d05899c2720fb915a841a06e0`.
- Headed Microsoft Edge 154.0.4258.37, 1280×900, synthetic admin, invalid canonical backlog ID only; the server returned 400 and no state changed.

## Disposition

The English baseline rendered the new localized English copy (“One or more backlog IDs do not exist in the project backlog.”), retained the status, invalid ID and public text, and kept Save enabled. The inherited harness still asserted the previous English error literal and stopped before running the zh-CN case. This is a stale harness expectation, not a product failure. The run is **incomplete and superseded**, not acceptance evidence. No page errors or failed requests occurred before the assertion.

The team requested stopping acceptance on this hash while another API error mapping is being added. Chinese triage validation and the 390×844/320×800 heading regression were not run against this hash. Resume only against the next team-confirmed exact source hash. Existing evidence/backlog findings from the prior `67bf07b1…` build remain intact.

Machine output: [`edge-current-triage-localization-results.json`](../../output/playwright/live-feedback-user-story-suite-20260930/edge-current-triage-localization-results.json). Runner with the superseded assertion: [`edge-current-triage-localization.mjs`](../../output/playwright/live-feedback-user-story-suite-20260930/edge-current-triage-localization.mjs).

Post-run read-only check: 8793 remains healthy, but source and served app.js advanced to SHA-256 86d16203535c4ba10a9d80c6b03c27ab156404cc0dfb8d1af4e026a1dae505b6. This hash has not been tested; continue waiting for the team’s explicit retest request.
