# QA-01 Edge rendered contrast matrix

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext` Reports, Account, User management, and administrator Feedback views.  
**Browser:** Microsoft Edge 154, headed, driven by the cached Playwright JavaScript API after the CLI could not create its daemon directory under the protected user profile. The API launched the installed Edge executable with a temporary browser profile.  
**Data:** isolated temporary SQLite DB, synthetic admin/member, and nine synthetic feedback requests. The fixture exercised every feedback status. No live service, real account, public data, or production DB was used.

## Results

The browser computed rendered foreground/background ratios for visible text nodes and input placeholders, using WCAG AA thresholds of 4.5:1 for ordinary text and 3:1 for large text. Scans covered both English and Chinese in each of the four views.

| View | Visible text rows (EN/ZH) | Text contrast failures | Placeholder checks/failures | Minimum sampled text ratio |
|---|---:|---:|---:|---:|
| Reports | 28 / 28 | 0 | 1 / 0 | 4.56:1 |
| Account | 26 / 26 | 0 | 0 / 0 | 4.56:1 |
| User management | 16 / 16 | 0 | 0 / 0 | 4.56:1 |
| Feedback queue | 165 / 165 | 0 | 0 / 0 | 4.56:1 |

All nine feedback status labels appeared in the admin queue. After correcting the scan to start at the first document tab stop and enter Feedback by keyboard, Edge Tab navigation reached all 72 of 72 visible enabled candidates across the header and feedback view. Every sampled control had a visible 3px focus outline. The lowest computed outline contrast estimate was 3.98:1 against the nearest nontransparent ancestor background; this CSS estimate is not a pixel-level measurement. The 390 by 844 CSS-pixel feedback view had no horizontal overflow. Edge emitted no page or console errors.

The results are limited to the rendered text/placeholders and focus stops present in these states. This does not cover every dynamic error/success state, all control boundaries/icons/non-text components, forced-colors hardware output, native browser zoom, or screen-reader behavior. QA-01 remains open for those checks and physical-device accessibility coverage.

## Evidence and cleanup

- Full measurements: [`contrast-audit.json`](../../output/playwright/qa01-contrast-full-20260929/contrast-audit.json)
- Feedback queue screenshots: [English desktop](../../output/playwright/qa01-contrast-full-20260929/feedback-queue-en-1280.png), [Chinese desktop](../../output/playwright/qa01-contrast-full-20260929/feedback-queue-zh-1280.png), [English 390 CSS px](../../output/playwright/qa01-contrast-full-20260929/feedback-queue-en-390.png)
- Reports, Account, and User management desktop screenshots are in the same artifact directory.
- The keyboard scan correction and complete rerun are captured in `run-contrast-audit.mjs` and `contrast-audit.json`; `keyboardFocus.candidateCount` and `sampledFocusableCount` are both 72. The isolated service was PID 92764 on port 54298 using temp directory `qa01-contrast-edge-6kU3Rg`. After this rerun, its process was stopped, port 54298 was verified clear, and its uniquely named temp directory was removed after checking it resolved under the system temp root. The Edge Playwright context was closed by the run script.
- The final harness passed `node --check`, and an artifact assertion verified 470 rendered text rows, 72/72 focus candidates reached, nine feedback statuses, no Edge errors, and no mobile document overflow. The earlier contrast documentation state had passed Git `diff --check`; after this keyboard-scan correction, a fresh `diff --check` could not run because `git.exe` was not available on PATH or at the previously recorded Git executable path. This is not reported as a pass. The last available repository snapshot was branch `vnext-home-hosted`, ahead 18 at HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; the QA note, harness/results, backlog, and roundtable include shared uncommitted work. No commit or push was made.

**Disposition:** visible text, placeholder, and sampled focus-outline contrast passed for the listed states. Remaining accessibility and release work stays open under QA-01/REL-01.
