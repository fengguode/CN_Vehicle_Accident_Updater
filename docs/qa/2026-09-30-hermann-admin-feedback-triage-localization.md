# Hermann administrator feedback triage error localization — 2026-09-30

## Session

- Target: isolated current-source API/UI, fresh synthetic SQLite DB and temporary Edge profile; live 8788 untouched.
- Browser: headed Microsoft Edge 154.0.4258.37, 1280×900.
- Preflight: isolated health 200 and exact byte parity for all six served UI assets (`app.js` SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`, `styles.css` `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`).
- Fixture: synthetic member Issue in the admin queue.

## Reproduction and finding

Set administrator locale to Chinese. Attempted to move the Issue to Added to backlog with a well-formed but nonexistent backlog ID. PATCH returned 400 and the triage editor displayed raw English “Backlog ID does not exist in the canonical project backlog.” The Chinese public update, selected status, and invalid ID remained in the editor; Save was enabled and focused. Replacing the ID with valid `FEEDBACK-DUPLICATE-LINK-01` returned 200 and the queue updated.

Finding **FEEDBACK-I18N-TRIAGE-01 (P3, In progress)**: server-side triage errors are not localized to the administrator's selected Chinese locale. No page errors. Synthetic service/DB/profile removed.

## Evidence

- Runner: `../output/playwright/admin-feedback-triage-localization-20260930/run.mjs`
- Results: `../output/playwright/admin-feedback-triage-localization-20260930/result.json`
- Screenshots: `../output/playwright/admin-feedback-triage-localization-20260930/invalid-backlog-id-error-zh.png`, `corrected-backlog-triage-zh.png`
