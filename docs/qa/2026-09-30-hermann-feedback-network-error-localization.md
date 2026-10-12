# Hermann feedback network-error localization and retry — 2026-09-30

## Runtime and scope

- Target: isolated current-source `updater-vnext` service with disposable member/admin accounts and database; live port 8788 was untouched.
- Browser: headed Microsoft Edge 154.0.4258.37, viewport 1280×900, Playwright Core.
- All six served UI assets matched workspace source.
- Scope: Chinese-language member submits an Issue while the browser POST is aborted, then retries.

## Reproduction and result

DEFECT reproduced for error localization; retry behavior passed. With zh-CN selected, aborting `POST /api/feedback` rendered the raw English browser error “Failed to fetch”. The success class was absent, no request card appeared, title/description remained, Submit was enabled and focused, and the member could retry. The retry returned HTTP 201, showed a Chinese success receipt, cleared the form and displayed the request as 已提交.

Finding `FEEDBACK-I18N-NETWORK-01` is open for mapping fetch/network failures to localized feedback error copy. Zero page errors; disposable data/profile removed and isolated service stopped.

## Evidence

- Runner: `../../output/playwright/member-feedback-network-error-zh-20260930/run.mjs`
- Results: `../../output/playwright/member-feedback-network-error-zh-20260930/result.json`
- Screenshots: `../../output/playwright/member-feedback-network-error-zh-20260930/network-error-chinese-locale.png`, `../../output/playwright/member-feedback-network-error-zh-20260930/network-retry-success-chinese-locale.png`
