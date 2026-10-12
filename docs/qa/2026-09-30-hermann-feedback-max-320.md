# Hermann member feedback maximum-length narrow viewport regression — 2026-09-30

## Session

- Target: isolated current-source service and disposable SQLite DB/Edge profile; live 8788 untouched.
- Browser: headed Microsoft Edge 154.0.4258.37 at 320×800.
- Preflight: `/health` 200; six served UI assets matched source (`app.js` SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`, CSS `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`).
- Fixture: one synthetic approved member, fresh isolated database.

## Result

PASS. Whitespace-only/too-short title and description remained client-side with localized validation. Maximum fields (title 120, description 4000, context 2000 raw characters with surrounding spaces) submitted successfully and rendered in the member list at 320px. Form reset after success. `document.documentElement.scrollWidth` equaled `clientWidth` at 305px both before and after submission; no horizontal document overflow. Zero unexpected console/page errors. Temporary service, DB, and profile removed.

No defect found at this viewport and boundary.

## Evidence

- Runner: `../output/playwright/member-feedback-max-320-current-3e477-20260930/run.mjs`
- Results: `../output/playwright/member-feedback-max-320-current-3e477-20260930/results.json`
- Screenshots: `../output/playwright/member-feedback-max-320-current-3e477-20260930/01-whitespace-title-native-validation.png`, `03-whitespace-description-native-validation.png`, `04-max-boundary-submitted-normalized.png`
