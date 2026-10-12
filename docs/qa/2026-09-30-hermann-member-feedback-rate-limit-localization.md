# Hermann member feedback rate-limit localization — 2026-09-30

## Session

- Target: isolated current-source `updater-vnext` service and disposable SQLite database/Edge profile; live 8788 untouched.
- Browser: headed Microsoft Edge 154.0.4258.37, 390×844.
- Preflight: isolated health 200; all six served UI assets byte-matched source (`app.js` SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`; styles.css `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`).
- Fixture: approved synthetic member with ten existing feedback requests in the rolling hour.

## Reproduction and finding

Switched the signed-in member UI to Chinese, then attempted an eleventh Feature submission. The API returned 429. The form's polite status region rendered the English server string “Submission limit reached. Try again later.” instead of Chinese. The rest of the recovery behavior passed: no success styling, all fields retained, Submit enabled and focused, existing list available with `aria-busy=false`.

Finding **FEEDBACK-I18N-RATELIMIT-01 (P3, In progress)**: server-generated feedback rate-limit error is displayed untranslated in Chinese. No page errors; only the expected 429 console response. Synthetic service/database/profile removed.

## Evidence

- Runner: `../output/playwright/member-feedback-rate-limit-zh-current-3e477-20260930/run.mjs`
- Results: `../output/playwright/member-feedback-rate-limit-zh-current-3e477-20260930/results.json`
- Screenshot: `../output/playwright/member-feedback-rate-limit-zh-current-3e477-20260930/member-limit-error-retained-draft.png`
