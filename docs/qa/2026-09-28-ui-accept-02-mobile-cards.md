# UI-ACCEPT-02 phone card hierarchy regression

**Date:** 2026-09-28 (Asia/Shanghai)  
**Target:** `updater-vnext`, source-first report cards for phone widths `≤420px`  
**Design basis:** Feng approved source-first mobile cards; Yuzhou's review specifies status/date/title/provenance/excerpt/source before details, 44px targets, one source link, focus retention when the viewport crosses the breakpoint, and tablet/desktop unchanged.

## Acceptance checks

- At 390×844, hide the empty preview and show date, title, explicit verification state, source/platform metadata, excerpt, and one original-source link before scrolling.
- Ensure no document or card horizontal overflow; preserve heading semantics and safe HTTPS source-link attributes.
- Keep the same source anchor and preserve its keyboard focus and open-details state while resizing both directions across 420px; check exactly 420/421 behavior.
- At wider widths, retain the preview and place the one source link within expandable details.

## Environment and isolation

Windows, Node.js v24.14.0, headed Chrome through `@playwright/cli`; current working-tree assets served by vNext API on `127.0.0.1:8805`. Database `C:\Users\guofe\AppData\Local\Temp\ctim-card-final-qa-20260928\staging.sqlite` contained one synthetic administrator and one synthetic report with a synthetic HTTPS source. No live account/service/database or production content was used. Browser session: `ctim-card-final`.

## Browser results

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| 390×844 first screen | Empty preview hidden; date/title/status/provenance/excerpt/source visible before details and within the first viewport | Preview `display:none`; date y=595.6–614.9; title y=616.5–641.6; Unverified lead badge y=648.5–672.1; source/platform y=677.7–698.3; three-line excerpt y=705.5–779.9; 44px source link y=783.9–827.9; details begins y=831.1. | PASS |
| 390px width | No page/nav horizontal overflow | `innerWidth=390`; document `clientWidth=375`, `scrollWidth=375`; workspace nav `clientWidth=351`, `scrollWidth=351`. Native sort select is constrained to its grid column. | PASS |
| Provenance and link safety | One original source link, keyboard reachable before disclosure, HTTPS only, `noopener noreferrer` | Exactly one `.report-source` anchor in the card; href `https://synthetic.example/incident/2`; `target=_blank`; `rel="noopener noreferrer"`. Clicking Report details then Shift+Tab reached the link with a visible 3px solid focus outline while details remained open. | PASS |
| Resize phone→desktop while source is focused/details open | Same anchor moves to native details; focus and disclosure remain | At 1280px, parent was `.report-details`, one anchor remained, `document.activeElement` stayed the anchor, details remained open, preview displayed as grid. | PASS |
| Resize desktop→phone while source is focused/details open | Same anchor returns before details; focus and disclosure remain | At 390px, parent returned to `.report-card-body`, one anchor remained, focus remained, details stayed open, preview hidden. | PASS |
| Exact breakpoint | 421px retains tablet/desktop presentation; 420px uses phone source-first layout | At 421px link parent was `.report-details`, preview displayed; at 420px link parent was `.report-card-body`, preview hidden. Focus and open details survived both transitions. | PASS |
| Tablet 768×1024 | Retain wider layout and avoid horizontal overflow | Document clientWidth/scrollWidth 753/753; preview `display:grid`; one source link stayed inside open details. No production data used. | PASS |
| Cleanup | Remove only the disposable test state | Closed the named browser, stopped the disposable service, confirmed port 8805 had no listener, and removed the unique temp root. | PASS |

## Findings and iteration

The first browser attempt hid the placeholder and exposed the excerpt, but the source link ended at y=879.9, below the 844px fold. A two-column phone search/sort row brought the link into view. The final full-width check then found a 16px document overflow from the native sort select's intrinsic minimum size. Setting the phone sort control to `min-width:0` removed the overflow; final `document.scrollWidth` equaled `clientWidth`.

The same `.report-source` node is moved rather than duplicated when crossing 420px. Its focus is restored with `preventScroll`, and native disclosure state stays intact. The excerpt is the existing report summary/content, visually clamped to three lines while full text remains in the DOM and details. Desktop/tablet retain the preview and link placement inside details.

**Code/test review:** Dennis independent review found no actionable issue. Hermann User Tester passed the scope, including the 768×1024 tablet measurement. `npm test` — 63 passed, 0 failed; `node --check` passed for `apps/web/app.js` and all three changed ingestion runners/helpers; `git diff --check` passed (line-ending normalization warnings only). Disposable browser/API/database were closed/stopped; port 8805 was clear; the unique temporary data directory was removed. The README presentation paragraph now documents phone-only source-first cards and wider placeholder layout; a focused cross-read confirmed it preserves the schema/media provenance policy. UI-ACCEPT-02 acceptance is complete; broader UI accessibility/error-recovery work remains tracked separately under QA-01/UI-ACCEPT-03.
