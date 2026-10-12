# UX-I18N-02 final-bundle focused regression

- **Date:** 2026-09-29 (Asia/Shanghai)
- **Target:** `updater-vnext`, isolated fresh service `http://127.0.0.1:63100`; empty disposable SQLite plus one synthetic approved member
- **Browser:** Microsoft Edge 154.0.4258.37, headed, direct Playwright API, isolated temporary profile; browser locale `en-US`; viewport `1280×800`
- **Build:** served `/app.js` SHA-256 `a4ef417072e185bf8871c3f205aaad72ee348d259f163531a9e386bf74f9e794`; matched current source exactly
- **Preflight:** isolated service `/health` 200; same-origin UI/API rendered; no use of port 8788
- **Cleanup:** closed Edge context, terminated isolated service, removed temp profile and synthetic SQLite database

## Results

PASS: With English UI, empty feedback submission displayed visible `role=alert` errors linked through `aria-describedby`, marked title and description `aria-invalid=true`, and focused title. Switching UI language while the validation error was present updated it to `请填写此字段。`. Chinese UI empty submission displayed the Chinese message and focused title. Under each UI language, whitespace-only title (five spaces) and description (ten spaces) were rejected with the localized message and appropriate first-invalid-field focus. All invalid attempts produced zero `/api/feedback` POSTs. No page errors occurred.

This was a focused validation/current-bundle regression; it did not repeat the previously recorded valid feedback submission/list lifecycle.

## Artifacts

- [results.json](../../output/playwright/ux-i18n-02-current-bundle-final-20260929/results.json)
- [run.mjs](../../output/playwright/ux-i18n-02-current-bundle-final-20260929/run.mjs)
