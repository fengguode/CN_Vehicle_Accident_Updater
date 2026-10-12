# QA record: independent navigation source rechecks

**Date:** 2026-09-28 (Asia/Shanghai)  
**Target:** committed vNext navigation adjustment in `apps/web/styles.css` on `vnext-home-hosted`; source-only reviews, no files changed by reviewers.

## Review evidence

Two independent read-only follow-ups examined the CSS and role-dependent view state after the earlier 390px overflow report:

- `mobile_nav_fix` confirmed the mobile navigation is a full-width grid with shrinkable columns, wraps labels, switches to three columns when User management is present, and retains 44px minimum targets, focus-visible styling, and current-page styling.
- `nav_code_review` confirmed the CSS and app state logic align with the intended row/role rules and found no concrete additional source-level defect.

## Result and remaining gate

**Source review: pass, no additional code change justified. Browser acceptance: blocked/incomplete.** Neither reviewer rendered the page or measured the corrected geometry. Hermann's separate check recorded that CUA had no available browser and the browser runtime could not launch.

Before closing UI-ACCEPT-01, run the disposable approved-admin flow at 390×844 and verify:

- the brand/account controls and workspace nav use the intended rows;
- the three admin nav targets each have at least 44px height;
- keyboard focus and current-page state are visible;
- `.workspace-nav.scrollWidth === .workspace-nav.clientWidth` and page width does not overflow;
- the old 354px/351px nav measurement is no longer reproduced.

Source inspection does not substitute for that rendered acceptance. See the [canonical backlog](../PROJECT_BACKLOG.md#active-and-blocked-work).
