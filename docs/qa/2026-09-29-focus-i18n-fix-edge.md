# Reports focus and User management locale regression QA

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`, isolated `apps/api/server.js` at `http://127.0.0.1:62633/` (ephemeral; stopped after run). Branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared working-tree changes were present. No app source or backlog edits were made by this tester.  
**Browser:** headed Microsoft Edge 154.0.4258.37 via direct Playwright Node API and a fresh persistent profile. Reports viewport 320×800; User management viewport 390×844.  
**Runtime preflight:** `/health` returned 200; same-origin UI/API process entrypoint was `apps/api/server.js`; `index.html`, `app.js`, `styles.css`, and `navigation.js` served exactly the workspace source before and after the browser checks. Current `app.js` SHA-256: `e11633259c3400f532424aa63567c1a7d27f180290b8c413f625b06f358f65fc`; `styles.css`: `b6071808af773a20c03ace8f5dbe34c00a564cce32705a28da9f112d3e0ec8d`.

## Acceptance results

| Check | Expected | Actual | Result |
|---|---|---|---|
| UI-REPORTS-FOCUS-01: inline Reset filters | From keyboard-focused inline Reset filters, Enter restores reports/count and sends focus to Reports heading when the removed trigger leaves focus on BODY | The button was reached in 4 Tabs from Search. With the `/api/reports` request held, its removal left focus on BODY. After release, all four reports and the live count returned and focus moved to `#heading` with a visible focus outline | Pass |
| Reset focus during deliberate movement | If the user moves focus to another control while reset is pending, completion does not steal it | With the reset request held, focus was moved to `#query`; after release it remained on `#query` | Pass |
| External toolbar reset | Reset keeps focus on its connected toolbar trigger | Keyboard activation restored four reports and focus stayed on connected `#reset-filters` | Pass |
| UI-ADMIN-I18N-01: locale update | In-place English→Chinese updates loaded status, select labels/options, Save and Anonymize | Status became `账户已加载。`; role label/options `角色` / `成员, 管理员`; approval `数据库审批` / `已批准, 待批准`; account state `账户状态` / `启用, 停用`; buttons `保存` and `匿名化已停用账户` | Pass |
| Unsaved values and language-toggle focus | Unsaved role/approval selections survive the rerender; language toggle keeps focus | Changed the synthetic member’s role to Admin and approval to Pending without saving. Both values survived; API still reported server role `member`, approved `true`. Keyboard Enter on the language toggle left focus on `#language-toggle` | Pass |
| Focused row control across locale rerender | When rerender begins with focus on a row control, that control remains focused | With role select focused, dispatched the language toggle’s click handler through `element.click()`; the same row’s `role` select remained focused and both unsaved values survived. This directly exercises the preservation branch; it is not a natural pointer-click focus sequence | Pass (focused-control branch) |
| Save while request is in flight | Save remains disabled during pending request and repeated activation does not duplicate the PATCH | A synthetic member role PATCH was routed to the isolated server, then its response was held. Save remained disabled with `Saving…`; a repeated click produced no second request (one PATCH total). After response release, `Changes saved.` appeared and the synthetic row showed Admin | Pass |
| Responsive/runtime checks | No horizontal overflow or browser page errors | Reports document/body width 305/305 at 320px; User management 375/375 at 390px. Zero page errors | Pass |
| Isolation and cleanup | Only synthetic data is changed; isolated service/profile are removed | Four synthetic reports, two admins, and synthetic members only; service stopped and DB/profile removed; port 8788 untouched | Pass |

## Late identity-response scope

The delayed cross-admin response scenario was **not browser-tested** in this run. Read-only source review found `loadAdminUsers` increments a request ID before fetching and checks that ID plus the current user ID/role before updating the panel/cache. `renderAuth` requests a fresh user list when the current admin identity changes while the User management view is open. This is source evidence only and does not replace a controlled cross-tab held-response check.

## Evidence and command

Command: `node output/playwright/focus-i18n-fix-20260929/run.mjs`. Results JSON, harness, and screenshots are in [`output/playwright/focus-i18n-fix-20260929`](../../output/playwright/focus-i18n-fix-20260929/). Results JSON SHA-256: `ebc4c501333d3efeef925acc2ce507f57172273c27246127b69afbb55b084c42d`.

Both targeted regressions passed on the current source. No full application test suite, other browser, or live-runtime readiness check was run. No authentication, data, or runtime operation touched port 8788.
