# Hermann pending-member feedback submission and admin queue — 2026-09-30

## Runtime and browser

- Target: fresh current-source `updater-vnext` service on an ephemeral localhost port with a disposable SQLite database.
- Browser: headed Microsoft Edge 154.0.4258.37 via cached Playwright Core, disposable profile, 390×844 viewport.
- Preflight: health 200 and exact parity for all six served UI assets (`index.html`, app.js, styles.css, navigation.js, report-presentation.js, viewport.js). Live 8788 was health-checked but received no authenticated requests or mutations.
- Fixtures: synthetic admin and active pending member only.

## Results

PASS. The pending member signed in with `approved:false`; Reports displayed its access gate while Account exposed the feedback form. User management and admin Feedback navigation remained hidden. The member submitted a synthetic Feature request; it appeared in the member's own list. A separately signed-in synthetic administrator opened Feedback and saw the request with the correct submitting member attribution. No page errors. Isolated service, database, and profile removed.

An initial runner assertion checked the Reports gate while the browser was on Account, where the Reports section is hidden. The assertion was corrected to navigate to Reports before checking the gate; the full flow then passed from a fresh isolated fixture. This was a harness correction, not a product finding.

## Artifacts

- Runner: `../output/playwright/pending-member-feedback-current-3e477-20260930/run.mjs`
- Results: `../output/playwright/pending-member-feedback-current-3e477-20260930/results.json`
- Screenshots: `../output/playwright/pending-member-feedback-current-3e477-20260930/pending-member-own-feature.png` and `admin-queue-pending-member-feature.png`
