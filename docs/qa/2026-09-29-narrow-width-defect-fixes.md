# Narrow-width UI defect fix and regression QA

**Date:** 2026-09-29 (Asia/Shanghai)  
**Scope:** `UI-ADMIN-195-02`, `QA-01-ZOOM-OVERFLOW-02`, and tester follow-up `QA01-NARROW-CONTROL-01` in `updater-vnext`.  
**Owners:** Primary implementation; Hermann independent User Tester; Dennis independent Reviewer.  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright API, disposable profiles.  
**Targets:** Fresh isolated current-source API services on ephemeral ports with synthetic users/reports/feedback only. Port 8788 was not used.

## Acceptance checks

1. Match served HTML/JS/CSS/navigation/report/viewport assets to source before interaction.
2. At 195×844 and 195×422 effective CSS width, verify User management heading and controls fit, Reports advanced filters do not overflow, and admin Feedback editor remains contained.
3. Repeat relevant states at 320×800/844 and 390×844; require document/body and tested nested panels to have matching client/scroll widths and visible controls within the client edge.
4. Capture browser errors and API writes; allow only synthetic login/logout/read requests; confirm service, DB, and profile cleanup.
5. Treat 195px as an effective CSS width approximation, not native 200% Edge zoom. Keep keyboard/focus/native-device claims limited to separately recorded evidence.

## Implementation

`apps/web/styles.css` now narrows the User management heading and stacks it at <=240px, permits long user names to wrap, constrains User management row controls, gives the Reports advanced filters one column, and stacks the Reports search/sort row at <=240px. Existing 320px/390px breakpoints remain in effect.

## Results

- The original User management heading clipping and page overflow were fixed. After that pass surfaced a 2px Reports search/sort excess and 3px User management row excess at 195px, additional narrow rules removed both.
- Final headed Edge runners were executed against current source hash `styles.css` SHA-256 `8550ae76526eb900b6eb74749daacf196e528e47b5c2d1a4980457e2c92f028b`. Served/source CSS matched; all six UI asset checks passed in each relevant runner.
- **Hermann independent recheck:** At 195/320/390px, document/body client→scroll widths were 180→180, 305→305, and 375→375. User panel and row were 125→125, 250→250, and 320→320. The tested row controls all fit; rightmost bounds were x=152.6, 277.6, and 347.6 within client widths. Reports advanced filters and admin Feedback/editor had zero measured overflow at 195×422, 320×800, and 390×844. No page errors or non-login writes occurred.
- **Primary reruns:** Both isolated runners passed against the final CSS hash. Temporary SQLite/profile directories were removed and child services stopped. Port 8788 remained untouched.
- **Independent Reviewer:** Dennis reviewed final CSS hash `8550ae76526eb900b6eb74749daacf196e528e47b5c2d1a4980457e2c92f028b` and found no actionable correctness or scope regression. The <=240px rules are appropriately scoped; measured 195/320/390 layouts fit.

## Findings and limits

- `UI-ADMIN-195-02`, `QA-01-ZOOM-OVERFLOW-02`, and `QA01-NARROW-CONTROL-01` pass for the tested current-source Edge CSS viewports after final Dennis review.
- **Hermann keyboard/focus follow-up:** On the same CSS hash, a fresh isolated headed Edge 154 run at 195×422, 320×800, and 390×844 passed 71 recorded assertions. Reports Tab/Shift+Tab focus remained visible and inside the client edge for navigation, search/sort, reset, More filters, and all five filter selects; Space/Enter/Escape interactions behaved as expected. User management keyboard navigation traversed Role, Approval, Status, Save, and enabled Anonymize in order, with visible focus and row containment at all widths. Long names wrapped. No save/anonymize/report mutations occurred, only synthetic login writes, zero page errors; disposable DB/profile/service cleaned, isolated port 55402 closed, 8788 untouched. Runner/results/screenshots: [Hermann keyboard QA](../../output/playwright/user-management-keyboard-195-20260929/).
- Actual Edge chrome zoom at 200%, screen-reader timing, physical forced-colors, and physical/mobile-device checks remain open under QA-01. These measurements do not close those checks.
- Artifacts: [User management runner/results/screenshots](../../output/playwright/admin-user-195-current-exact-bounds-20260929/) and [advanced-filter/admin-feedback runner/results/screenshots](../../output/playwright/qa01-zoom-overflow-latest-20260929/).
- `git diff --check` passed for the stylesheet and this QA record; the whole-tree command may emit CRLF conversion warnings for existing mixed-line-ending files.
