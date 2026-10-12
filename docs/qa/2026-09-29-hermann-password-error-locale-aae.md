# QA finding: wrong current password error ignores selected Chinese locale

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** isolated disposable AAE service/database on port 58932 with synthetic approved member/admin; health was verified by tester  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Viewport:** 390×844  
**Source parity:** app.js `AAE23B6A90DD7DF84354990CF6F9EB4B7D1476C10A019FDC7987E325AD5FB7E2`; styles.css `D761134A7738B6D6620074CC39C516DC0FE6D4B82134D6397514DEA02FE2A380`; matched served before/after in both initial and follow-up runs.

In English and Chinese Account/password UI, the same synthetic wrong-current-password attempt returned HTTP 400 and displayed “Current password is incorrect.” (untranslated in Chinese). A second Chinese-locale attempt used the correct current password but reused it as the new password; HTTP 400 displayed “Choose a password different from the current one.” Both are server-side messages shown untranslated. For both attempts, fields remained filled, errors appeared in the `role="status"` / `aria-live="polite"` region, and focus returned to Submit. After logout, the original synthetic password successfully authenticated, confirming neither rejected attempt changed it. No page errors. No live 8788 access.

Tracked as UX-AUTH-I18N-01, separate from registration invalid-invitation UX-REG-03. Screenshot was not retained in the tester handoff; reproduce/capture on a disposable fixture if fix acceptance requires visual artifact. Workspace branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared work remains uncommitted.

## Independent review

Dennis confirmed the API returns the English wrong-current-password message and the web form displays it unchanged in Chinese mode. The scoped acceptance (localize this known error while preserving fields, polite live status, submit focus, and unchanged password) is sound. Stable error-code mapping is preferable. Other password-change errors may also be raw English; broaden the scope only if that is the intended fix. Hermann captured [English wrong-current error](../../output/playwright/password-error-locale-aae-20260929/wrong-current-en.png), [Chinese wrong-current error](../../output/playwright/password-error-locale-aae-20260929/wrong-current-zh-CN.png), and [Chinese same-password error](../../output/playwright/password-same-current-aae-20260929/same-password-error-zh-CN.png). AAE hashes for the last run matched: app.js `AAE23B6A90DD7DF84354990CF6F9EB4B7D1476C10A019FDC7987E325AD5FB7E2`, styles.css `D761134A7738B6D6620074CC39C516DC0FE6D4B82134D6397514DEA02FE2A380`.
