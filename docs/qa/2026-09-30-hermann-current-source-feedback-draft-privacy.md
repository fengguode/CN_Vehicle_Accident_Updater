# Hermann current-source feedback draft identity/privacy regression (2026-09-30 14:18 local)

## Preflight

- Launched a fresh temporary isolated service on port 50419 with its own synthetic SQLite database; the harness stopped the service and removed its DB/profile.
- Browser: headed Microsoft Edge 154.0.4258.37 via Playwright, 390×844.
- All seven served UI assets matched source. `apps/web/app.js` SHA-256 was `67bf07b144453158a9b6c1f6ba229ba793f8575f462fb36d625597f4c0e4bce7`; `apps/api/server.js` SHA-256 was `403436805df855db19652f4d81b99fcfbcaf347356745ec51471c7ba8bf80be3`.
- No live ports touched; service, profile and disposable DB were removed at test end.

## Results

PASS: same-account draft recovery; A→B same-tab draft isolation (B saw blank fields); validation reset across identity change; same-ID role refresh; content-free cross-tab auth signal and revalidation; blank/inert UI while cross-tab auth was held; preserving B's newer draft while a submitted request was pending; one receipt/list item; and blank drafts after reload/fresh context. No page errors. One synthetic feedback request was created in the isolated DB as part of the held-submit scenario; the disposable DB was removed.

**Remaining unverified scenario:** the natural `document.hidden`/`visibilitychange` handler was not exercised. Playwright foreground switching yielded `document.hidden=false`; the harness records this as unverified, not passed. Therefore FEEDBACK-PRIVACY-DRAFT-01 stays In progress for that remaining visibility scenario.

Evidence: [`result.json`](../../output/playwright/member-feedback-draft-identity-current-67bf-20260930/result.json), [`run.mjs`](../../output/playwright/member-feedback-draft-identity-current-67bf-20260930/run.mjs), and screenshots in the same directory.
