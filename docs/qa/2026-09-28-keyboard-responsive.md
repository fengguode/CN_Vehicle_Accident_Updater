# Keyboard and narrow viewport QA

**Date:** 2026-09-28 (Asia/Shanghai)  
**Target:** `updater-vnext` web UI, signed-out empty synthetic database.  
**Tester:** Hermann (Project User Tester).

## Acceptance and results

| Scenario | Result |
|---|---|
| 320×700 portrait | PASS: document width equals viewport; no horizontal overflow; Reports and Account nav controls visible at 44px high |
| 700×320 landscape | PASS: document width equals viewport; no horizontal overflow; Reports and Account controls remain visible at 44px high |
| 320px with 200% CSS zoom approximation | PASS: no horizontal overflow; native browser zoom itself was unavailable and remains unverified |
| Keyboard-only signed-out traversal | PASS: visible 3px focus outline on home, Reports, Account, Log in, language toggle, and Open account controls |
| Reports/Account view selection | PASS: Enter on Reports and Account updates `aria-current=page` and visibility as expected |

No defect was reproduced. The run used an empty synthetic database, so report-list interactions, signed-in/admin navigation, and native browser zoom are outside this session.

## Isolation and cleanup

Disposable service on `127.0.0.1:18893`, fresh empty synthetic database, Playwright browser session `qa-keyboard-responsive`. Closed the browser, stopped recorded PIDs 80452 and 84816, verified no listener remained on port 18893, and removed only `output/playwright/qa-keyboard-responsive`. `.playwright-cli` artifacts were preserved. No production data or services were used.

**Disposition:** Focused narrow viewport and signed-out keyboard checks pass. Broader QA-01 accessibility, content-bearing signed-in/admin flows, and native zoom remain open.
