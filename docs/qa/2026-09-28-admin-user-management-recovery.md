# Admin user-management recovery and focus acceptance

**Date:** 2026-09-28 (Asia/Shanghai)  
**Target:** `updater-vnext/apps/web/app.js` on `vnext-home-hosted` at `5291f92ba977f7abec6ce1d1250645fb4f82cb62` plus current worktree.  
**Owner:** Primary; Dennis independent code review; Hermann disposable browser acceptance.

## Acceptance checks

1. When the signed-in administrator demotes, unapproves, or disables their own account, refresh authoritative auth state, remove administrator controls/data, return from User management to Account, and focus the Account heading.
2. On admin user-list GET 503 → Retry → 200, preserve keyboard access by focusing status during loading/success. On repeated 503, focus the replacement Retry. A delayed response after leaving User management must not steal focus or repopulate hidden admin data.
3. Save completion must retain keyboard context through list rerender; save failure must announce feedback, re-enable Save, and restore focus. 401/403 must refresh auth state and remove admin UI when access was revoked. An approved admin editing another user must remain in User management.
4. Report code review and automated suite; run all browser checks against disposable synthetic data only; record cleanup and remaining QA-01 scope.

## Root cause and implementation

Dennis's read-only review found two P2 gaps: self-demotion/deactivation updated only local approval state, so client-side admin privileges and rows could remain stale after server permission loss; and replacing the focused Retry/Save/list controls could leave focus on BODY. Primary changes now refetch `/api/auth/me` after self-update, refresh auth following admin 401/403, clear/leave the view and focus Account H1 when admin rights disappear, and preserve focus in the admin status/replacement Retry around list loading. Save failures restore focus to Save after feedback; successful Save keeps context through a focused status announcement. Dennis noted that a successful Retry also needed a non-empty completion message; primary added localized “Accounts loaded” / “账户已加载” status text. His follow-up review found no remaining actionable issue. No server permissions were weakened.

## Checks

| Check | Result |
|---|---|
| `node --check apps/web/app.js` | PASS |
| `npm test` | PASS, 65/65, 0 failures |
| `git diff --check` | PASS; only existing Git LF/CRLF normalization warnings |
| Member live approval revocation and restoration; self-demotion in User management | PASS. Synthetic member loaded one report. Admin PATCH `/api/admin/users/2` `{approved:false}` returned 200; member `GET /api/reports` returned 403. After 32 seconds, UI showed approval-pending status, had zero report/card/source/vote controls, Reports remained selected, and focus stayed on the Reports nav button. Root reload remained pending with zero cards. Admin reapproval restored report/count automatically within the next 32-second poll. A second synthetic admin demoted self to Member; UI redirected to Account, removed User management nav, showed access-changed feedback, and focused `H1#account-heading`. |
| GET `/api/admin/users` 503 → keyboard Retry → 200 and repeated 503 focus | PASS. Fault proxy injected 503. Initial error kept H1 focus and Tab reached Retry. Keyboard Retry then 200 left focus on `p#admin-load-status[role=status][aria-live=polite]`, announcing “Accounts loaded.” A second consecutive 503 left the replacement Try again visible and focused. |
| PATCH 500/401/403, duplicate activation, and successful recovery | PASS in second isolated session. Delayed synthetic 500 plus double-click generated exactly one PATCH; visible save-failure feedback appeared, Save re-enabled and held focus. Clearing proxy fault and retrying saved once, refreshed the user list, announced “Changes saved.”, and focused the live status. Separate 401 and 403 injections each left the admin view and rows intact for the still-authorized admin, showed inline failure feedback, restored affected Save focus, and generated one PATCH each. |
| External admin role removal while User management is open | PASS. After injected role removal, the 30-second auth poll cleared user rows/nav, returned to Account with administrator-access-changed feedback, and focused Account H1. |
| Disabled-member session revocation | PASS. A synthetic member's `/api/reports` returned 401 immediately after disable; after 32 seconds the browser showed signed-out access prompt, zero report/card/actions, and retained Reports selection/focus. |
| Held user-list GET 503 after leaving User management; held Save PATCH 500 after leaving User management | PASS. For held GET, one `/api/admin/users` request was pending while Loading accounts showed; user selected Reports and focus remained on Reports navigation when GET was released as 503. Reports stayed visible; no admin rows or controls appeared. For held PATCH, one Save was pending and disabled; user selected Reports and focus remained there when PATCH was released as 500. Reports remained intact, no stale admin controls/error appeared in the active view, and only one PATCH occurred. |
| Dennis independent review of primary's final implementation | PASS; no actionable issue in auth refresh, focus behavior, localized successful-load announcement, or stale global status clear |
| Prior global “Changes saved” status beside a later row error | PASS. Successful Save announced “Changes saved.” and focused status. A subsequent injected PATCH 500 cleared stale global status, displayed the current row error, and restored focus to enabled Save. |

## Safety, cleanup, and limitations

Environment: first local Node service on `127.0.0.1:8895`, fault proxy on `127.0.0.1:8896`, then second isolated service/proxy on `127.0.0.1:8897/8898`; disposable synthetic SQLite/accounts/reports; Chrome with cached Playwright CLI 0.1.21. No production account/database or running home-hosted service was used. API evidence included GET `/api/reports` 403 after approval revocation and 401 after disable; admin PATCH 200 for approval, role, and disable changes; snapshots captured member loaded/pending/recovered states, self-demotion, successful Retry, repeated Retry failure, and PATCH failure/recovery with duplicate activation blocked.

Cleanup: first-session cleanup closed all three named Playwright sessions, stopped recorded Node PIDs 65836 and 80072, verified no processes or listeners remained on ports 8895/8896, and removed only `output/playwright/qa-01-live-revoke-20260928`; existing `.playwright-cli` artifacts were preserved. Second-session cleanup closed browser sessions, stopped exact Node PIDs 80400/73276, verified both exited and ports 8897/8898 had no listeners, and removed only `output/playwright/qa-01-admin-failure-20260928`. Third focused regression closed its browser, stopped exact service/proxy PIDs 72068/81324, verified ports 8899/8900 clear, and removed only `output/playwright/qa-admin-status-clear-20260928`. Fourth race session closed `qa-admin-race`, stopped exact PIDs 80432/77932, verified no processes/listeners on ports 8893/8894, and removed only `output/playwright/qa-admin-nav-race-20260928`. Existing `.playwright-cli` artifacts were preserved. QA-01 remains open for broader P2 form/accessibility/device acceptance.
