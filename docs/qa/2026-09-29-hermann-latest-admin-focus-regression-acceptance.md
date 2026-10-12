# QA session: latest admin localization and Reports reset-focus regressions

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`, isolated disposable service/database on port 58924 with synthetic admin, member and three reports; health 200  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Viewports:** 390×844 and 320×800  
**Source parity:** app.js SHA-256 `E11633259C3400F532424AA63567C1A7D27F180290B8C413F625B06F358F65FC`; styles.css `B6071808AF773A20C03ACE8F5D5BE34C00A564CCE32705A28DA9F112D3E0EC8D`; served assets matched source before and after.

## UI-ADMIN-I18N-01 acceptance

In-place English→Chinese translated the existing User management heading, status, existing account row, option labels, buttons, and accessible labels. Unsaved selections (role=admin, approval=false, active=false) survived language change. Checked at 390×844 and 320×800; at 320 document/body scroll widths matched client width (305px inner viewport with scrollbar), and User panel fit without horizontal overflow. A visible 3px focus ring appeared on the active row select before toggle. No localization regression observed.

## UI-REPORTS-FOCUS-01 acceptance

At 320×800, Tab to inline Reset filters and Enter restored all three synthetic report cards; focus moved to the Reports heading with a visible focus ring. In a second run, report response was deliberately held and focus moved to Search before releasing it; the cards restored while focus remained on Search. No focus-stealing regression observed.

No application page errors. An initial test-runner attempt stopped on a script indexing error before 320px/member checks; it was test harness code, and the complete checks resumed in the same isolated fixture. Screenshots: [English admin](../../output/playwright/admin-i18n-reports-focus-20260929/admin-users-en-390.png), [Chinese admin at 320](../../output/playwright/admin-i18n-reports-focus-20260929/admin-users-zh-320.png), [empty results](../../output/playwright/admin-i18n-reports-focus-20260929/reports-empty-reset-320.png), [reset focus on heading](../../output/playwright/admin-i18n-reports-focus-20260929/reports-reset-heading-320.png), [deliberate focus preserved](../../output/playwright/admin-i18n-reports-focus-20260929/reports-reset-preserved-query-320.png).

Disposable data, profile and scripts removed; port 58924 has no listener. No source edits. Workspace has shared uncommitted changes; branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; no commit/push. Both backlog items remain In progress pending independent review.