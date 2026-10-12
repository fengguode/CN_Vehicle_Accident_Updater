# Hermann triage unknown-error fallback acceptance — ad3

Date: 2026-09-30 local

## Preflight

- Isolated synthetic service `http://127.0.0.1:8793` returned HTTP 200 for health and root; synthetic credentials and `synthetic.sqlite` were present and identified.
- Headed Edge 154 at 1280×900. All eight served UI assets matched workspace source. app.js SHA-256 `ad3cea5921901a7a17550455200f293df7c61b07663c8c5d1ed979c69579ef1f`; styles.css SHA-256 `61e43beb97e57899738c65e6662bd05107dc4e7d05899c2720fb915a841a06e0`.

## Browser check

Synthetic admin login succeeded. In zh-CN Feedback triage, a browser route interception returned HTTP 400 `{ "error": "Unexpected API failure" }` for one PATCH, matching the API route's validation-error response shape. The editor showed the exact unrecognized message, retained the form, re-enabled Save, and restored focus. The synthetic feedback row snapshot was identical before and after; the intercepted request never reached the API/database. There were zero page errors and failed requests.

The displayed English text for an unrecognized error is the current explicit fallback contract: `test/web-feedback-triage.test.js` asserts that unknown server text is preserved, while known backend errors (including `internal_error`) have localized mappings. Therefore no new product defect is filed from this case. A separate exploratory mock of a 500 with an arbitrary unknown error was discarded as not representative: the server's global 500 handler emits `internal_error`.

## Evidence and outcome

- [Final machine results](../../output/playwright/live-feedback-user-story-suite-20260930/edge-triage-unknown-error-contract-ad3-retry-results.json)
- [Screenshot](../../output/playwright/live-feedback-user-story-suite-20260930/edge-triage-unknown-error-contract-ad3-retry.png)
- Source contract: [triage fallback test](../../test/web-feedback-triage.test.js); actual route behavior: [API server](../../apps/api/server.js).

No app.js blocker or new defect was reproduced. Port 8788 was untouched.
