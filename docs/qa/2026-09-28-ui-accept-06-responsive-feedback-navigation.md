# UI-ACCEPT-06 — Responsive administrator feedback navigation

**Date:** 2026-09-28 (Asia/Shanghai)  
**Target:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; worktree edits remain uncommitted.  
**Owner:** Primary; independent Dennis source review; project User Tester recheck in progress.  
**Environment:** Connected Codex in-app browser, local isolated API, temporary SQLite database seeded with 105 synthetic requests; no production service/account/data used.

## Acceptance checks and results

- **Reproduction at 752px — PASS (defect reproduced):** With the authenticated administrator Feedback queue populated by 100 rendered requests and a Load older control, the initial header remained a single desktop row and the page showed a horizontal scrollbar. Navigation and card content extended beyond the viewport.
- **752px regression after fix — PASS (primary browser run):** Moved the compact header/navigation layout breakpoint to 860px. After a full page reload against the same isolated service and data, the four navigation links occupied a second row, the feedback cards fit within the viewport, and the page had vertical scrolling only; the prior horizontal scrollbar was absent.
- **Admin pagination by keyboard — PASS:** From the first-page queue, `End` moved to the page bottom; `Tab` focused **Load older requests** after the last card's Save control; `Enter` appended requests 101–105, hid the Load older button, and moved focus to the feedback status region. The AX tree contained 105 request headings before the second page, included request 105 afterward, and contained no Load older button.
- **Disposition rationale — PASS (primary browser run):** Changed the first synthetic request to `Not planned`, left the public update empty, and activated Save by keyboard. Browser-native required-field validation focused **Update for the submitter** and blocked submission. A read-only check of the disposable database confirmed the request remained `Submitted`.
- **Mobile admin nav review finding — FIX IN PROGRESS:** Dennis's independent source review noted that the 752px fix exposed the existing four-column Feedback navigation rule at widths through 420px, which can split “User management” inside a word. Primary added a <=420px two-column override. Rendered 390px verification of that override is pending User Tester/primary regression and is a completion gate.
- **Automated regression — PASS:** `npm test`: 66 passed, 0 failed, exit code 0. `git diff --check` passed (Git emitted only existing LF-to-CRLF working-copy warnings). CSS is served from disk; the browser performed a full reload after the 860px breakpoint change. The <=420px override still needs rendered verification.

## Review, cleanup, and remaining scope

Dennis reviewed the current stylesheet, navigation markup, and role visibility. His source review found no issue with the 860px desktop-to-compact transition, but identified the phone label-wrap concern above. The in-app browser tab was closed. The local service had already exited; its recorded PID was absent and the test port had no listener. The isolated request remained `Submitted`; only the exact fresh test directory under `%TEMP%` was removed.

This record covers the focused feedback queue breakpoint and pagination scenario, not the broader QA-01 matrix. Previous feedback flows passed at 1280px and 390px before this CSS change; those widths were not re-run after it. Independent User Tester confirmation, 390px current admin navigation verification, and 1280px post-change confirmation remain pending. Current Git HEAD is recorded above; relevant source and QA changes are uncommitted among other existing worktree changes. No production process or data was changed.
