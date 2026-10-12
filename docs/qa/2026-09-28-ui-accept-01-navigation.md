# UI-ACCEPT-01 mobile admin navigation regression

**Date:** 2026-09-28 (Asia/Shanghai)  
**Target:** `updater-vnext`, admin navigation at 390 × 844  
**Tester:** primary agent using the project User Tester acceptance criteria; independently reassessed by the project Test Manager (Hermann) and reviewed by Dennis.

## Acceptance checks

- Approved administrator sees Reports, Account, and User management in one full-width workspace navigation row.
- Each target is at least 44px high; text remains readable and wraps without horizontal scrolling.
- Navigation and document have no horizontal overflow.
- Keyboard Tab reaches each link and shows a visible focus ring; current page is visibly identified.
- Test only against a disposable service/database and synthetic account; clean up the browser and service.

## Environment and isolation

Windows, Node.js v24.14.0, headed Chrome via the installed `@playwright/cli`. Disposable vNext service used `127.0.0.1:8802` and `C:\Users\guofe\AppData\Local\Temp\ctim-nav-qa-retest-20260928\staging.sqlite`; it held only a synthetic `qa-admin` account bootstrapped with a disposable password and no production records. No live service, real account, or user Chrome tab was accessed. The current working-tree stylesheet was served. Browser session: `ctim-nav-qa-final`.

## Results

| Check | Result | Evidence |
|---|---|---|
| Role-dependent nav | PASS | Signed-in state was `qa-admin · Administrator · Database access: approved`. Snapshot contained Reports, Account, and User management. |
| 390 × 844 viewport and horizontal overflow | PASS | Browser evaluation returned `innerWidth=390`, document `clientWidth=390`, document `scrollWidth=390`; workspace nav `clientWidth=366`, `scrollWidth=366`. |
| Row and target dimensions | PASS | All three controls had the same top coordinate (`y=69.95`) and each measured `59.75px` high. They were aligned in one three-column row. |
| Current-page state | PASS | Account had `aria-current="page"`, background `rgb(233, 244, 239)`, and border `rgb(168, 203, 187)`. Other nav controls did not have the current-page marker. |
| Keyboard focus | PASS | Keyboard Tab advanced from Reports to Account to User management. Each focused control computed to `outline: solid` and `outline-width: 3px`. |
| Cleanup | PASS | Closed only the named Playwright session, stopped the foreground disposable service, confirmed port 8802 had zero listeners, and removed the exact unique temp root. |

## Change and review

The old CSS grid centered shorter controls vertically against a taller wrapped User management control. Reduced mobile nav label size to `0.875rem` and set the grid's `align-items: stretch`, producing one aligned row with consistent target heights. Source diff check passed; Git emitted only its existing LF/CRLF conversion warning. Desktop and two-link member geometry were not remeasured in the initial session; they are covered in the follow-up below.

Independent User Tester reassessment: **Pass** for the scoped approved-admin 390px acceptance. Independent code review: **Pass**, no actionable CSS findings. The review confirms the change is within the mobile breakpoint, retains the 44px minimum and wrapping, and does not alter desktop CSS.

`npm test` — **PASS**, 60 tests, 0 failures after the CSS adjustment. `git diff --check -- apps/web/styles.css` — **PASS**, with only the Git LF/CRLF conversion warning.

**Disposition:** The measured 354px/351px overflow is resolved and the 390px admin acceptance checks pass. UI-ACCEPT-01 is scoped to that reported defect and can close. The two-link member layout, desktop role layouts, and broader responsive/accessibility matrix remain in QA-01; this note does not claim those checks passed.

## Role and desktop non-regression follow-up

A second isolated session (`ctim-nav-role-qa`) used a fresh disposable database on `127.0.0.1:8803`, a synthetic admin, and a synthetic approved member registered through a synthetic invitation. No production state was used.

| Role and viewport | Result | Browser evaluation |
|---|---|---|
| Admin, initial desktop viewport | PASS | viewport/document `929/929/929`; nav `382/382`; all three targets shared `y=15.30` and measured `44.39px` high. |
| Admin, 390×844 | PASS | document `390/390`; nav `366/366`; three targets each `59.75px`, same row at `y=62.77`. |
| Admin, 1280×900 | PASS | document `1280/1280`; nav `382/382`; three targets each `44.39px`, same row at `y=15.30`. |
| Approved member, 390×844 | PASS | admin link hidden; document `390/390`; nav `366/366`; Reports and Account each `44px`, same row at `y=62.77`. |
| Approved member, 1280×900 | PASS | admin link hidden; document `1280/1280`; nav `198/198`; Reports and Account each `44.39px`, same row at `y=15.30`. |

Cleanup closed only that Playwright session, stopped the disposable service, confirmed port 8803 had no listener, and removed the unique temp root. This follow-up also verifies the designer's two-column member and three-column admin role-dependent layouts at mobile and desktop widths. The broader QA-01 items (error/retry, accessibility, browser back/forward, longer query and other roles/states) remain open.
