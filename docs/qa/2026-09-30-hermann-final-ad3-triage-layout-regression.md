# Hermann final ad3 triage localization and Account layout regression

Date: 2026-09-30 (local)

## Runtime and browser

- Target: isolated synthetic service at `http://127.0.0.1:8793`; `/health` returned `{"ok":true,"service":"adas-vnext"}` and `/` returned HTTP 200.
- Browser: headed Microsoft Edge 154.0.4258.37 via Playwright.
- Viewports: 1280×900 for admin triage; 390×844 and 320×800 for pending-member Account.
- Workspace and served assets matched exactly: `app.js` SHA-256 `ad3cea5921901a7a17550455200f293df7c61b07663c8c5d1ed979c69579ef1f`; `styles.css` SHA-256 `61e43beb97e57899738c65e6662bd05107dc4e7d05899c2720fb915a841a06e0`.
- Used synthetic admin and pending-member identities and an isolated disposable SQLite fixture. Port 8788 was not accessed or changed.

## Acceptance results

The final exact-hash suite passed. Admin triage covered English and zh-CN nonexistent backlog IDs (HTTP 400), Chinese `same_origin_required` (HTTP 403), generic `internal_error` (HTTP 500), and duplicate-cycle rejection (HTTP 400). Each displayed the expected localized friendly message without exposing raw server text, retained the editor values, and left Save enabled and focused. The server-side wrong-Origin probe returned 403 `same_origin_required`. Snapshots confirmed no unintended triage writes.

At both 390×844 and 320×800, the Chinese `账户` heading rendered on one line. Pending status appeared below without overlap; document/body scroll widths equaled client widths. Screenshots were visually inspected and show no clipping or horizontal overflow. The harness's prior `textWithinHeading` metric was intentionally not used as a clipping gate: glyph range bounds extended 3 px beyond the CSS line box while the screenshot showed fully visible text. The final check used line count, horizontal bounds, status position, and visual inspection.

There were zero browser page errors and zero failed requests. The targeted error submissions left the synthetic triage rows unchanged.

## Harness side-effect reconciliation

An earlier superseded harness attempted to override Chromium's forbidden `Origin` header using a page-route header override; Chromium sent the actual origin and the synthetic request wrote one public test string to feedback request `09a3fa34-0fa5-4a9f-92a6-bd54029e91bc`. This was a harness setup error, not a product defect. After confirming the database and row identity were synthetic/disposable, a narrowly guarded cleanup restored that row's public update, triage version, and timestamp to their pre-probe values. Its append-only synthetic audit event was preserved. The final suite then confirmed no unintended writes. No non-synthetic or live data was touched.

## Artifacts

- Runner: [edge-ad3-final-localization-and-layout.mjs](../../output/playwright/live-feedback-user-story-suite-20260930/edge-ad3-final-localization-and-layout.mjs)
- Machine results: [edge-ad3-final-localization-and-layout-results.json](../../output/playwright/live-feedback-user-story-suite-20260930/edge-ad3-final-localization-and-layout-results.json)
- Screenshots: [triage invalid ID EN](../../output/playwright/live-feedback-user-story-suite-20260930/edge-ad3-triage-invalid-id-en.png), [triage invalid ID zh-CN](../../output/playwright/live-feedback-user-story-suite-20260930/edge-ad3-triage-invalid-id-zh-CN.png), [triage generic errors zh-CN](../../output/playwright/live-feedback-user-story-suite-20260930/edge-ad3-triage-generic-errors-zh-CN.png), [triage cycle zh-CN](../../output/playwright/live-feedback-user-story-suite-20260930/edge-ad3-triage-cycle-zh-CN.png), [Account 390](../../output/playwright/live-feedback-user-story-suite-20260930/edge-ad3-pending-account-390.png), [Account 320](../../output/playwright/live-feedback-user-story-suite-20260930/edge-ad3-pending-account-320.png)
- Superseded failed assertion and synthetic-row restoration are retained in the same artifact directory for provenance.

## Outcome

The exact-hash Edge regression passes for `FEEDBACK-I18N-TRIAGE-01` and `UI-ACCOUNT-ZH-390-01`. This closes these two specific current-source UI findings. It does not close the broader role/story matrix, native accessibility/zoom checks, or the separate unresolved 8788 runtime report.
