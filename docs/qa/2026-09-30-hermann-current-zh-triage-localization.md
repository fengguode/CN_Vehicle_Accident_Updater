# Hermann current-source Chinese admin triage localization (2026-09-30 14:13 local)

## Preflight

- Isolated synthetic service `http://127.0.0.1:8793`, health `ok:true`; served app.js matched workspace SHA-256 `67bf07b144453158a9b6c1f6ba229ba793f8575f462fb36d625597f4c0e4bce7`.
- Headed Microsoft Edge 154.0.4258.37 via Playwright Core, 1280×900; signed in with synthetic admin.
- A synthetic existing feedback request was edited only with an invalid canonical backlog reference; server validation rejected the PATCH, so no state was changed. Port 8788 untouched.

## Finding: FEEDBACK-I18N-TRIAGE-01 remains reproducible

With the UI set to zh-CN, set status to Added to backlog, entered `NOT-REAL-TEST-ITEM`, and submitted. The API returned HTTP 400. The editor retained the selected status, invalid ID, public update, and enabled Save button. However, the status text included the raw English server error “Backlog ID does not exist in the canonical project backlog.” No page errors or failed requests occurred.

Disposition: confirmed localization finding remains In progress; the Chinese status labels do not make the raw English validation message localized. Machine evidence and screenshot: [`edge-current-zh-triage-error-results.json`](../../output/playwright/live-feedback-user-story-suite-20260930/edge-current-zh-triage-error-results.json), [`edge-current-zh-triage-error.mjs`](../../output/playwright/live-feedback-user-story-suite-20260930/edge-current-zh-triage-error.mjs), [`edge-current-zh-triage-error-1280.png`](../../output/playwright/live-feedback-user-story-suite-20260930/edge-current-zh-triage-error-1280.png).
