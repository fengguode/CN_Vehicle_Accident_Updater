# QA-01 report rating/undo continuation — partial current 6a4b6c evidence

**Date:** 2026-09-29 (Asia/Shanghai)  
**Requested target:** app `6a4b6c125763…` / CSS `69f09a8d…`; isolated approved synthetic member with a synthetic report.  
**Status:** Partial; persistence/revoke and 320/390 layout remain unverified on this target. No product defect established.

## Preflight and partial browser evidence

- Isolated `apps/api/server.js` service at `http://127.0.0.1:58459`, disposable SQLite DB with synthetic admin/member and one fictional report. `/health` 200, initial auth user-null.
- Headed Microsoft Edge `154.0.4258.37`, direct Playwright Node API using cached `playwright-core`, unique disposable profile, 390×844.
- All six served assets matched source: `index.html` `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; `app.js` `6a4b6c125763569aae68cfbcaff4197e5ef335f2297c0372e5469ef3a0931fde`; `styles.css` `69f09a8d660b83e808715a2045e313a30e94eccfdbd3dddc76553a4e535454fc`; `navigation.js` `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`; `viewport.js` `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da`; `report-presentation.js` `d0a081dc918f6c848d15a865d890eb8695d6554d1f626a8db4f26edcf1d07d6f`.
- Initial rendered controls: group accessible name `Rate this report: Synthetic report for rating UX`; buttons “Relevant traffic incident” and “Not relevant” both `aria-pressed=false`; Undo was absent. Tab traversal from the Reports heading reached Relevant; it had `:focus-visible=true` with a 3px blue outline.
- Enter activated Relevant; `/api/vote` returned 200, the UI announced `Your rating was saved.`, Relevant became `aria-pressed=true`, and Undo vote rendered. DB after that attempt contained one synthetic vote and one rating receipt. Zero page errors.

## Incomplete checks and harness corrections

- First attempt then timed out because the harness searched for `button[data-vote="undo"]`; UI exposes `data-vote="revoke"`. Results are preserved at [first attempt](../../output/playwright/reports-rating-undo-6a4b6c-20260929/first-attempt-wrong-revoke-selector.json).
- Corrected attempt used the `revoke` selector and confirmed the saved state but then timed out because it tried to fill a login form hidden after page reload. The existing synthetic authenticated session should have been checked through same-origin `/api/auth/me` while waiting for Reports content. Results are preserved at [second attempt](../../output/playwright/reports-rating-undo-6a4b6c-20260929/second-attempt-hidden-status-locator.json).
- Final corrected runner was stopped by the strict target guard before browser launch after the app advanced from 6a4b6c/CSS69F09 to app `e0bc2f834eddee51beca9bb28900725c7c1aa47a82101092872dccdc78ecb309`, CSS `0f2c947585740633653741dadc1108a85b721f16846a0f622be56d14bc179e19`. All six assets matched that newer workspace source; this assigned-target run stopped before browser interaction. See [final drift result](../../output/playwright/reports-rating-undo-6a4b6c-20260929/results.json).

The 6a4b6c test fixture/process/profile were cleaned after both browser attempts; ports 53379 and 58459 were confirmed closed and 8788 was untouched. Final drift-preflight service/profile were also removed (port 57505). There was no completed 320×800 measurement, reload persistence assertion, or revoke/undo verification on the assigned bundle. No defect is inferred from harness timeouts.

Artifacts: [runner](../../output/playwright/reports-rating-undo-6a4b6c-20260929/run.mjs), [baseline screenshot](../../output/playwright/reports-rating-undo-6a4b6c-20260929/rating-baseline-390x844.png), and [saved-state screenshot](../../output/playwright/reports-rating-undo-6a4b6c-20260929/rating-saved-390x844.png). The requested checks remain open under QA-01 until a stable current target can be exercised end to end.

**Git:** QA/backlog/artifacts uncommitted with shared work; no application source edits, commit, or push.
