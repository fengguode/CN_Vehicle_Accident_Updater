# Hermann QA-01 native browser zoom attempt — current source

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`.  
**Scope:** Verify Edge's native 200% page zoom and inspect member Reports, Account feedback, and administrator Feedback queue/editor at that zoom. No application source changed.

## Preflight and isolated runtime

- Headed Microsoft Edge 154.0.4258.37 through direct Node Playwright using the cached `playwright-core` import; requested viewport 1280×800; disposable persistent profile.
- Two bounded isolated attempts used `apps/api/server.js`, on ports 50836 and 64590 with fresh synthetic SQLite databases. Both `/health` checks returned 200 and initial `/api/auth/me` was user-null. Live 8788 was not contacted. The second attempt was a selector-only harness correction after the first role locator failed.
- Served UI assets matched source exactly: `index.html` SHA-256 `09379F2DF2553C5DE80CE22C90D8953906C7781F6E5F953B4BEF65DD2BEA2459`, `app.js` `9F56A4081A8D3F6369B52D1805D8960EF6D86BBAB2B9A21CD94E697654ADFC1F`, `styles.css` `CAFE53B8491E9BCE07476A33EEF7CB2A4DE424ADF21ACDC4B06FFEF44E573EC8`, and `navigation.js` `7A1114587842F11BACE2B1B4D69F9D15D5E35AE946ABF7EFD0F5564461DCEA56`.
- Synthetic admin/member accounts and three fictional reports were prepared in the disposable database. No sign-in or feedback form interaction occurred because browser zoom could not be changed through the selected control.

## Results

| Check | Expected | Actual | Result |
|---|---|---|---|
| Browser preflight and source identity | Isolated app renders same-origin UI/API on requested Edge | Service health 200, initial auth null, all four served assets matched current source | Pass |
| Native zoom control | Set actual Edge page zoom to 200%; verify DPR and reduced CSS viewport | Edge `edge://settings/appearance` loaded and its Page zoom chooser displayed. Attempt 1: `getByRole('menuitemradio', { name: '200%' })` timed out. Attempt 2: a visible-text locator resolved a 200% text node but Playwright reported that node as not visible and timed out. No 200% selection or zoom change was confirmed; no target viewport/DPR measurement exists. | Blocked / unverified |
| Member Reports and Account feedback at 200% | Render both views and inspect overflow, labels, focus, and target access | Not reached because native zoom was not confirmed and no account was signed in | Blocked / unverified |
| Admin Feedback queue/editor at 200% | Render queue and open editor; inspect overflow, labels, focus, and target access | Not reached | Blocked / unverified |
| Errors and cleanup | No app errors; remove service, DB, and profile | No target-page errors or network requests were recorded. Service stopped, port 50836 health unreachable after cleanup, isolated DB/profile directory removed, and 8788 untouched. | Pass |

## Evidence and limitation

The final failed runner result is [`results.json`](../../output/playwright/qa01-native-zoom-cafe53-20260929/results.json); the screenshot captured at the failure point is [`failure-state.png`](../../output/playwright/qa01-native-zoom-cafe53-20260929/failure-state.png). The runner is [`run.mjs`](../../output/playwright/qa01-native-zoom-cafe53-20260929/run.mjs). A separate disposable-profile feasibility probe observed Edge's Page zoom control and 200% item. In the acceptance attempts, Playwright could resolve the item text but could not interact with it as a visible element. We stopped after the bounded selector correction and did not substitute a CSS-scaled viewport or claim the views passed.

**Disposition:** QA-01 native 200% zoom remains open and unverified. No product defect is concluded from this harness failure. Browser-native zoom and rendered member/admin behavior at that zoom remain incomplete.

**Git/evidence state:** No application code changed. The QA note, runner, result, and screenshot are uncommitted with the existing shared `updater-vnext` changes. Both isolated services were stopped; health was unreachable afterward; each synthetic DB and Edge profile directory was removed. `git diff --check` is required after this note is added; no commit or push was made.
