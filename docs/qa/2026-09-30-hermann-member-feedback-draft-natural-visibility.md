# QA session: FEEDBACK-PRIVACY-DRAFT-01 current-source identity and visibility regression

**Date:** 2026-09-30 (Asia/Shanghai)  
**Target:** `updater-vnext`, branch `vnext-home-hosted`, current working source at recorded commit `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`.  
**Result:** **PARTIAL — identity/draft lifecycle scenarios passed; natural tab-hidden/return remains unverified.**

## Environment and preflight

- Microsoft Edge 154.0.4258.37, headed via Playwright direct Node API; isolated persistent profile; 390×844 CSS px viewport.
- Fresh disposable service/database on `http://127.0.0.1:63697`; synthetic admin plus synthetic approved members A and B. No live port was accessed (`livePortsTouched: []`).
- `/health` and `/` returned 200; protected `/api/reports` returned expected signed-out 401. The served HTML and six UI files including `app.js` and `feedback-drafts.js` all returned 200 and byte-matched current source. `app.js` SHA-256: `e64e7aacb3b25b2951e51880a208c7817c7e2b308e9d8c7ceaeeb6a249e5cfb1`; `feedback-drafts.js`: `789b36766bc396b5af0583544cfa82181f5be6ee5597f60aaf4f43227c13c66e`; `server.js`: `403436805df855db19652f4d81b99fcfbcaf347356745ec51471c7ba8bf80be3`.

## Results

- **PASS:** Member A's unsent draft survived same-tab navigation, logout/relogin as A and same-ID role refresh. Logout blanked the form. Switching the same tab to member B displayed only B's blank/own draft; no feedback POST was sent.
- **PASS:** Validation errors/decorations did not cross account identities; same-tab B's own invalid draft remained recoverable without stale validation UI.
- **PASS:** Cross-tab auth change A→B refreshed the identity, removed A's fields and showed only B's tab-local draft. A held `/api/auth/me` response kept account content hidden/inert until confirmation. A held successful POST preserved a newer draft and produced one receipt/card. Reload and a fresh context did not restore unsent drafts. No page errors; isolated DB ended with one expected synthetic feedback row.
- **UNVERIFIED:** After setting a synthetic A draft, the runner minimized the headed Edge window through the OS and observed `document.hidden === false`, with no `visibilitychange` events. The DOM remained populated. Therefore this run did not exercise the product's natural hide/return handler or its synchronous blanking behavior. The alternate prior sibling-tab `bringToFront()` probe also did not produce a hidden event. This is an automation/window-control limitation, not evidence that the handler is broken.

## Cleanup and evidence

- The runner closed both browser contexts, stopped its isolated service, removed its temporary database/profile directory, and verified port 63697 no longer listened. It did not touch source or backlog. No shared/live service was altered.
- Machine-readable results, runner, and screenshots: [natural visibility run artifacts](../../output/playwright/member-feedback-draft-privacy-natural-visibility-20260930/).
- QA runner was derived from the prior identity regression runner and updated to current source hashes; this new run supersedes no earlier result.

## Disposition

Keep `FEEDBACK-PRIVACY-DRAFT-01` **In progress**. The remaining acceptance criterion is a controllable, genuine browser/window transition that makes the document hidden and then visible while exercising the app. The other identity, draft, held-response, storage, and cross-tab cases pass against this current isolated build. Existing Edge child processes had no discoverable main-window handles after the run; the disposable profile and service were removed, and no process was terminated beyond the test-owned API child.
