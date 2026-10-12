# Hermann feedback success message locale switching — 2026-09-30

## Runtime and scope

- Target: isolated current-source `updater-vnext` service with disposable approved member/admin accounts and database; live port 8788 was untouched.
- Browser: headed Microsoft Edge 154.0.4258.37, viewport 1280×900, Playwright Core.
- All six served UI assets matched workspace source.
- Scope: submit a Feature in English, then switch Account to Chinese while the success receipt remains visible.

## Reproduction and result

DEFECT reproduced. Feature POST returned HTTP 201 and displayed “Request submitted. Reference: #…”. After switching to zh-CN, the Account heading and request card translated (“功能建议”, “已提交”), while the success receipt remained “Request submitted. Reference: #…”. The receipt retained its success styling. Zero page errors; disposable data/profile removed and isolated service stopped.

Finding `FEEDBACK-I18N-SUCCESS-01` is open. Preserve the receipt's request ID while rendering the success message in the selected locale after a language change.

## Evidence

- Runner: `../../output/playwright/member-feedback-success-locale-switch-20260930/run.mjs`
- Results: `../../output/playwright/member-feedback-success-locale-switch-20260930/result.json`
- Screenshot: `../../output/playwright/member-feedback-success-locale-switch-20260930/english-success-message-in-chinese-account.png`
