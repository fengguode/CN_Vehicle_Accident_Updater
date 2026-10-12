# Accessibility live-region and preference QA

**Date:** 2026-09-28 (Asia/Shanghai)  
**Target:** `updater-vnext` signed-out Account and empty Reports states.  
**Tester:** Hermann (Project User Tester).

## Acceptance and results

| Scenario | Result |
|---|---|
| Navigation/credential names | PASS: Main navigation has an accessible name; Username and Password have associated labels |
| Native required validation | PASS: empty login is blocked before request and focuses Username |
| Invalid login feedback | PASS: synthetic invalid credentials announce through `role=status`/`aria-live=polite`, preserve values, and focus Log in |
| Reports loading/empty | PASS: Reports region is polite; loading sets `aria-busy=true`; empty state is shown after completion |
| Reports 503/retry | PASS: error text and accessible Try again button appear; successful retry returns to empty state and focuses Reports heading |
| Reduced motion | PASS under browser emulation: transitions use `0.01ms` |
| Forced colors/focus | PASS under browser emulation: keyboard focus retains a 3px solid outline |

No defect was reproduced. No screen reader or physical forced-colors display was available; admin/member announcements and other language/browser combinations remain outside this session.

## Isolation and cleanup

Synthetic admin and empty disposable database on local port `18894`, Playwright browser. The browser was closed, recorded processes were stopped, port `18894` was cleared, and only the exact disposable test directory was removed. No production data or service was used.

**Disposition:** The focused signed-out announcements, report loading/empty/error/retry, reduced-motion, and forced-colors-emulated focus checks passed. Screen-reader use and broad role/device coverage remain open in QA-01.
