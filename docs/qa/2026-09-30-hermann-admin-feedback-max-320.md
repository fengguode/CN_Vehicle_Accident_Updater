# Hermann admin feedback max-length 320px browser check — 2026-09-30

## Session

- Target: isolated current-source service, disposable SQLite database and Edge profile; live 8788 untouched.
- Browser: headed Microsoft Edge 154.0.4258.37 at 320×800.
- Preflight: health 200 and exact parity for six served UI assets (`app.js` SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`; styles.css `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`).
- Journey: member submitted maximum-length unbroken title/description/context; admin opened the request and expanded the triage editor.

## Result

PASS. At 320px the member submission had no document overflow. In the admin view with expanded editor, the document measured `scrollWidth=clientWidth=305`; the card stayed within the viewport, and status, priority, public/private note, backlog ID, duplicate ID, and Save controls all ended within the 320px viewport. Zero page errors. Disposable service, DB, and profile removed.

No narrow admin layout defect found in this scenario.

## Evidence

- Runner: `../output/playwright/admin-feedback-max-320-current-3e477-20260930/run.mjs`
- Results: `../output/playwright/admin-feedback-max-320-current-3e477-20260930/results.json`
- Screenshot: `../output/playwright/admin-feedback-max-320-current-3e477-20260930/admin-expanded-max-feedback-320.png`
