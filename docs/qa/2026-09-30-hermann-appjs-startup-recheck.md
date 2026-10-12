# Hermann app.js isolated startup recheck — 2026-09-30

## Target and setup

- Repository variant: `updater-vnext`; branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`.
- Target: current-source `apps/api/server.js` on ephemeral `http://127.0.0.1:50761`, with a unique empty SQLite database. The live port 8788 was not used for browser acceptance.
- Browser: headed Microsoft Edge 154.0.4258.37, direct Playwright Node API using cached `playwright-core`, fresh disposable persistent profile, viewport 1280×900.

## Acceptance and result

- `/health` and `/` returned 200. Edge rendered “China Traffic Incident Database” with the “Reported incident leads” heading, visible reports view, and signed-out Account entry: **PASS**.
- `index.html`, `app.js`, `navigation.js`, `feedback-drafts.js`, `feedback-triage.js`, `viewport.js`, `report-presentation.js`, and `styles.css` all returned 200 and matched current source byte-for-byte: **PASS**. Served `app.js` SHA-256: `3588924d1a795a45e476508caddd53338075946f22ebfad8c3745b7c45040468`.
- The page requested `app.js` and all five imported modules, including both feedback modules. No console errors, page errors, failed requests, or error responses: **PASS**.
- `node --check apps/web/app.js`: **PASS** (exit code 0).
- Disposable service was stopped; profile and database were removed; ephemeral port became unavailable. Port 8788 was untouched.

## Live-runtime limitation

A separate read-only request check against `http://127.0.0.1:8788` returned 200 for health, root, and `app.js`, but 404 for `/feedback-drafts.js` and `/feedback-triage.js`. Thus current-source startup does not block Hermann’s source-based testing, while feedback acceptance against that already-running service remains blocked until an authorized activation/restart and a fresh runtime check. No live service action was taken.

Structured evidence: [results.json](../../output/playwright/hermann-appjs-startup-recheck-20260930/results.json).
