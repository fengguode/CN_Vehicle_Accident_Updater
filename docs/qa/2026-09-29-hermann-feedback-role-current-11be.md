# QA-01 — member and admin Issue feedback lifecycle (current source)

**Date:** 2026-09-29. **Scope:** Verify both an approved member and an administrator can submit an Issue, each sees it in their own Account list, admin can review/respond, and the member sees only the public update. All mutations used synthetic accounts and data on a disposable local SQLite service. No application source edits or live 8788 access.

## Preflight

- Isolated same-origin `apps/api/server.js`, `/health` 200; `/api/auth/me` was user-null before browser use.
- Served/source parity passed for `index.html`, `app.js`, `styles.css`, `navigation.js`, `report-presentation.js`, and `viewport.js`.
- SHA-256: app.js `9f56a4081a8d3f6369b52d1805d8960ef6d86bbab2b9a21cd94e697654adfc1f`; styles.css `11be0d54e3d0757f640758c00dc2284441e2f3fad4c767e15b17e30b94cc1e3a`; index.html `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; navigation.js `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`; report-presentation.js `d0a081dc918f6c848d15a865d890eb8695d6554d1f626a8db4f26edcf1d07d6f`; viewport.js `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da`.
- Browser: Microsoft Edge 154.0.4258.37, headed direct Node Playwright using cached playwright-core, disposable persistent profile, 390×844 viewport.

## Journey and results

1. Synthetic approved member logged in. User management and Feedback navigation were hidden. In Account, the member submitted “Synthetic member issue 11BE”; `/api/feedback` returned **201**, and the member's own list showed **Submitted**.
2. Synthetic administrator logged in and submitted “Synthetic admin issue 11BE”; `/api/feedback` returned **201**, and admin's own list showed **Submitted**. Admin navigation was visible.
3. Admin Feedback queue showed both requests (two cards). Admin changed the member issue to **Under review**, adding “Synthetic public status update for QA.” and a synthetic private note. The UI showed “Request status updated.” and admin history displayed both entries; `/api/admin/feedback/{member-request}` returned **200**.
4. Member logged in again. Account list showed **Under review** and the public update, and did not show the private note. Zero browser page errors.

Expected mutating requests were the two feedback creation POSTs (201) and admin triage PATCH (200), plus synthetic login/logout requests. No other write requests were recorded.

## Harness caveat

The complete user-visible journey and all role/privacy assertions finished. The raw runner marked `FAIL_OR_BLOCKED` at its final safety assertion because it incorrectly classified the intended admin triage PATCH as an unexpected write. This is a harness bookkeeping error, not an application failure. Raw output remains in [`results.json`](../output/playwright/feedback-role-current-11be-20260929/results.json); the role journey disposition is in [`acceptance-summary.json`](../output/playwright/feedback-role-current-11be-20260929/acceptance-summary.json).

Screenshots: [member own list](../output/playwright/feedback-role-current-11be-20260929/member-submission-own-list.png), [admin own list](../output/playwright/feedback-role-current-11be-20260929/admin-submission-own-list.png), [admin triage/history](../output/playwright/feedback-role-current-11be-20260929/admin-triage-public-private.png), and [member public/private visibility](../output/playwright/feedback-role-current-11be-20260929/member-public-private-visibility.png). Runner: [`run.mjs`](../output/playwright/feedback-role-current-11be-20260929/run.mjs).

Cleanup passed: isolated service on port 62090 stopped and health became unreachable; exact synthetic DB/profile directory removed. Port 8788 was untouched. No role permission or privacy defect reproduced; broader QA-01 coverage remains open.
