# Hermann current-source Duplicate link regression — 2026-09-29

## Runtime and browser

- Target: isolated current-source `updater-vnext` service on ephemeral localhost with a fresh disposable SQLite database; live port 8788 received no requests beyond a separately checked health status and was not used for authentication.
- Browser: headed Microsoft Edge 154.0.4258.37 via cached Playwright Core, disposable profile, 390×844 viewport.
- Preflight: `/health` 200; `index.html`, `app.js`, `styles.css`, `navigation.js`, `report-presentation.js`, and `viewport.js` all byte-matched the workspace. `app.js` SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`; CSS SHA-256 `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`.

## Scenario and finding

A synthetic approved member submitted a Feature request. The synthetic admin attempted Duplicate without a target and received the expected 400 and “Link a primary request…” error. The admin then selected a primary request UUID, supplied a public reason, and saved Duplicate. The member’s `/api/feedback/mine` data contained the correct `duplicate_of` UUID, but the member-rendered request card showed neither that primary UUID nor its title; it displayed only the generic public update. The tester finding `FEEDBACK-DUPLICATE-LINK-01` therefore persists on the current `app.js` hash.

The same request was moved Duplicate → Complete and persisted after reload. Member view/API omitted private admin notes. No page errors. Run outcome: `PASS_WITH_FINDING`. The isolated service, database, and profile were removed; live 8788 was untouched.

## Artifacts

- Runner: `../output/playwright/feedback-duplicate-link-regression-3e477-20260929/run.mjs`
- Results: `../output/playwright/feedback-duplicate-link-regression-3e477-20260929/results.json`
- Screenshots: `../output/playwright/feedback-duplicate-link-regression-3e477-20260929/admin-duplicate-triage.png` and `member-public-private-visibility.png`
