# Hermann QA-01-ZOOM-OVERFLOW-02 current-source recheck

**Date:** 2026-09-29 (Asia/Shanghai)  
**Owner:** Primary agent, Hermann User Tester  
**Target:** `updater-vnext`, isolated same-origin service and disposable data  
**Outcome:** Recheck the member Reports advanced-filter overflow and admin Feedback editor at 195, 320, and 390 CSS px.

## Acceptance checks

- Build an isolated service with synthetic approved member/admin, three synthetic reports, and one synthetic feedback request.
- Require health and six-asset source parity before browser checks.
- In headed Edge, measure member Reports with advanced filters open and admin Feedback with the triage editor open at 195×422, 320×800, and 390×844.
- Confirm no non-login writes/page errors and clean up the temporary service, database, and profile without touching 8788.

## Results

- Microsoft Edge 154.0.4258.37, headed Playwright Node API, disposable profile. Isolated API service port 50409, health 200. All six UI assets matched source: app `8e9299c9…`, styles `0fdcb2b2…`, index `38efdd3f…`, navigation `c2658b3d…`, report presentation `dc9065ad…`, viewport `fef9e10e…`.
- Approved synthetic member, at 195×422: document/body client width 180 px and scroll width 182 px. `main` is 156/170 px; `.advanced-filters` is 125/155 px. All five selects are 155 px wide and end at x=182.4 px, beyond the client edge x=180. This confirms the existing small horizontal scrollbar/overflow.
- Member Reports at 320×800 and 390×844 had no page or element overflow.
- Admin Feedback with an open triage editor had document/body widths 180/180 at 195×422 and no overflowing element. At 320×800 and 390×844, document/body widths matched and no overflow was measured.
- No page errors; `nonLoginWrites` was empty. Isolated service stopped, health unavailable after cleanup, temporary DB/profile removed, `port8788Untouched:true`.

## Disposition

`QA-01-ZOOM-OVERFLOW-02` remains open: member advanced filters still overflow by about 2 px at 195 effective CSS px; the sampled admin Feedback editor passes. This is not native Edge zoom acceptance.

## Artifacts and Git

- [Results and API trace](../../output/playwright/qa01-zoom-overflow-latest-20260929/results.json)
- [Runner](../../output/playwright/qa01-zoom-overflow-latest-20260929/run.mjs)
- [Member Reports screenshot](../../output/playwright/qa01-zoom-overflow-latest-20260929/member-reports-advanced-195x422.png)
- [Admin Feedback screenshot](../../output/playwright/qa01-zoom-overflow-latest-20260929/admin-feedback-editor-195x422.png)
- Repository: `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18; code already dirty in shared tree, QA/backlog/artifacts uncommitted; no source edits or commit/push.
