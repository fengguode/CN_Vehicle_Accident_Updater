# Hermann current-source Chinese pending Account layout (2026-09-30 14:10 local)

## Preflight

- Target: isolated synthetic `updater-vnext` service `http://127.0.0.1:8793`; health `ok:true`; served `app.js` matched workspace SHA-256 `67bf07b144453158a9b6c1f6ba229ba793f8575f462fb36d625597f4c0e4bce7`.
- Browser: headed Microsoft Edge 154.0.4258.37 via Playwright; fresh contexts at 390×844 and 320×800.
- Account: synthetic pending member only; no data writes. Port 8788 untouched.

## UI-ACCOUNT-ZH-390-01

After login and switching to Chinese, the Account heading `账户` occupied 49.625×72.3125 CSS px at 390×844 with a 36.16px line-height, visibly wrapping each glyph to its own line. At 320×800, the heading fit one line at 61.125×36.15625 px. In both widths the pending status remained visible, heading and status did not overlap, document/body client and scroll widths matched, and no page errors or failed requests occurred. Result: the known one-line heading requirement still fails at 390px; the issue remains In progress.

Screenshot and measurements: [`edge-current-zh-account-responsive-results.json`](../../output/playwright/live-feedback-user-story-suite-20260930/edge-current-zh-account-responsive-results.json), [`edge-current-zh-account-390.png`](../../output/playwright/live-feedback-user-story-suite-20260930/edge-current-zh-account-390.png), and [`edge-current-zh-account-320.png`](../../output/playwright/live-feedback-user-story-suite-20260930/edge-current-zh-account-320.png).
