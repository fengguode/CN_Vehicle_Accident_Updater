# Hermann UI-ADMIN-195-02 current-source reproduction

**Date:** 2026-09-29 (Asia/Shanghai)  
**Owner:** Primary agent, Hermann User Tester  
**Target:** Isolated current-source `updater-vnext` service; synthetic admin/member accounts  
**Outcome:** Recheck the open 195 px User management clipping finding and distinguish heading overflow from user-row control overflow.

## Acceptance checks

- Start only an isolated service/database with synthetic accounts, verify health and six-asset parity.
- In headed Edge, view User management at 195×844, 320×844, and 390×844; measure heading, page, list, and row controls.
- Do not save or alter any account state; verify zero page errors and remove all test resources.

## Results

- Microsoft Edge 154.0.4258.37, headed Playwright Node API, 195×844 initial viewport. Isolated API service port 60347; disposable DB and two synthetic accounts; health 200. All six served assets exactly matched workspace source: app `8e9299c9…`, styles `0fdcb2b2…`, index `38efdd3f…`, navigation `c2658b3d…`, report-presentation `dc9065ad…`, viewport `fef9e10e…`.
- At 195 CSS px, `document.documentElement.clientWidth` is 180 px and `scrollWidth` is 211 px. The “User management” H1 bounds are x=12…210.6 px; the text line for “management” ends at x=210.7 px, outside the 180 px client viewport. The screenshot visibly clips the heading at the right edge. `#admin-users` is 125 px client / 128 px scroll width.
- In this newer bundle, the tested member row's role, approval, active, Save, and anonymize controls end at x=155.7 px and fit within the 180 px client width. Thus the current repro confirms the heading/page overflow while the sampled row controls fit; the earlier 36c127 run also had controls clipped.
- At 320×844, document/body width is 305/305 px and H1 right edge x=285.8 px. At 390×844, document/body width is 375/375 px. No overflow was measured at those sizes.
- No Save or account mutation was performed; one synthetic admin login and expected read-only data loads only. Zero page errors. Service stopped, isolated DB/profile removed, port 8788 untouched.
- A prior signed-out geometry run used a nonexistent selector and required a correction. This independent admin run uses the corrected runner and reproduced the page overflow; the selector issue does not affect this finding.

## Disposition

**UI-ADMIN-195-02 reproduces on current source.** Keep the existing P2 backlog item open. This is an effective 195 CSS px viewport approximation; native Edge zoom has not been exercised.

## Artifacts and Git

- [Exact bounds/results](../../output/playwright/admin-user-195-current-exact-bounds-20260929/results.json)
- [Runner](../../output/playwright/admin-user-195-current-exact-bounds-20260929/run.mjs)
- [Clipped heading screenshot](../../output/playwright/admin-user-195-current-exact-bounds-20260929/user-row-195x844.png)
- Repository: `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. Application changes predate this QA; QA/backlog/artifacts are uncommitted in the shared tree. No source edit or commit/push.
