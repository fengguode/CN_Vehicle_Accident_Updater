# QA session: FEEDBACK-IDEMPOTENCY-01 committed-response-loss retry

**Date:** 2026-09-30 (Asia/Shanghai)  
**Target:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; application/source changes were uncommitted in the shared worktree.  
**Owner:** Hermann (User Tester).  
**Result:** **Pass** for the isolated browser/API retry acceptance described below.

## Environment and preflight

- Browser: Microsoft Edge 154.0.4258.37, headed, Playwright direct Node API.
- Viewport: 390×844 CSS px.
- Isolated target: `http://127.0.0.1:49843`; synthetic SQLite DB/profile and synthetic admin/member only. Live port 8788 and real accounts/data were untouched.
- Health/routes: `/health` 200, `/` 200, signed-out `/api/feedback/mine` 401.
- The UI and imported module source assets were all served with expected content types and exact source SHA-256 parity:

| Asset | SHA-256 (source = served) |
|---|---|
| `index.html` | `38efdd3f8c2c1b9522588accd56d3127fc3abace971542acb8e7e8fc07f24520` |
| `app.js` | `0170cafa7f27fa5acdc13d760a4128353a73fd1378753bdbfdd8ca303c984675` |
| `styles.css` | `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423` |
| `navigation.js` | `c2658b3def8edc3ef4625c40e1679e616ac16bb95b0b30e23bd98d0bf5145cd5` |
| `report-presentation.js` | `dc9065adcf2eb5199a60315bc65fe76e43fb9e936172f7d06b552ea6ae5d49a0` |
| `viewport.js` | `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da` |
| `feedback-drafts.js` | `789b36766bc396b5af0583544cfa82181f5be6ee5597f60aaf4f43227c13c66e` |

`apps/api/server.js` source SHA-256: `90df0727641c196927dc958f6359b75c3ea774bce4c45ee680cbc5c640d02a08`.

## Acceptance scenario and result

1. Signed in as the synthetic member, enter an Issue title, description, and context. Submit once.
2. The isolated browser interceptor forwarded the first POST upstream so the service committed it and returned 201, then returned a synthetic 503 to the browser. The UI retained the exact form, re-enabled Submit, showed a non-success error message, and showed no success receipt or request card. This verified that retry remained available after an ambiguous failure.
3. Before retry, direct SQLite inspection showed one feedback request, one submitted event, and one submission-key row. The committed ID was `620eccc1-386c-432b-b4c3-a31af995b953`.
4. Retry the unchanged payload. The browser sent the same `Idempotency-Key` and payload; the API returned HTTP 200 with the original request ID. The UI showed one success receipt containing that ID, cleared the submitted form, and showed exactly one matching member card.
5. Final SQLite inspection showed exactly one request, one submission event, and one idempotency-key mapping, all associated with the same request ID and synthetic submitter. There was no second record or duplicate event.

| Check | Expected | Actual | Result |
|---|---|---|---|
| First upstream commit | One 201 commit before browser-facing 503 | Upstream 201, browser 503, one durable row | Pass |
| Retry usability | Same draft retained and Submit enabled | Exact values retained; Submit enabled; no false success/card shown | Pass |
| Retry identity | Same key and unchanged payload; replay original row | Same key/payload; replay HTTP 200 returned original ID | Pass |
| Customer receipt/list | One accurate success receipt and one request card | Receipt ID matched committed row; exactly one matching card | Pass |
| Persistence/integrity | One request, event, and key after retry | Final counts were 1/1/1 with linked IDs | Pass |
| Browser errors/cleanup | No page errors; isolated resources removed | No page errors; DB/profile removed; service stopped | Pass |

No new defect was found in this reproduced retry path. The prior duplicate-submission finding is verified fixed for the tested same-account, unchanged-payload retry case. Cross-account replay, changed-payload conflict handling, concurrent same-key submissions, and retries across a full page/browser restart were not exercised in this session.

## Evidence and cleanup

- Runner: [`run.mjs`](../../output/playwright/member-feedback-idempotency-regression-20260930/run.mjs)
- Machine results: [`result.json`](../../output/playwright/member-feedback-idempotency-regression-20260930/result.json)
- Screenshot: [`successful-idempotent-retry-receipt.png`](../../output/playwright/member-feedback-idempotency-regression-20260930/successful-idempotent-retry-receipt.png)
- Disposable database and Edge profile were removed; isolated service stopped and port 49843 closed. No commit or push was made.
