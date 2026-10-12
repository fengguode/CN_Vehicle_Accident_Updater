# FEEDBACK-UX-01 current-source Edge acceptance

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`; isolated `apps/api/server.js` at `http://127.0.0.1:64828/`, stopped after the run.  
**Source/build:** `apps/web/app.js` SHA-256 `aae23b6a90dd7df84354990cf6f9eb4b7d1476c10a019fdc7987e325ad5fb7e2`; `apps/web/styles.css` SHA-256 `d761134a7738b6d6620074cc39c516dc0fe6d4b82134d6397514dea02fe2a380`; API entrypoint `apps/api/server.js` SHA-256 `7485771fc8a5c7b8ea9ecf9a1e5204b086abae694a2f6daa41cc17dd621b0949`. The isolated process was spawned from this workspace with `apps/api/server.js`. `/health` returned 200; served `index.html`, `app.js`, and `styles.css` exactly matched workspace source before browser checks.  
**Browser:** headed Microsoft Edge 154.0.4258.37, direct Playwright Node API using cached `playwright-core`, fresh disposable persistent profile, 390×844 CSS px.  
**Fixture:** 105 synthetic feedback records; synthetic Admin A, Admin B, and approved Member. No real data/accounts. Port 8788 was not touched.

## Acceptance results

| Scenario | Expected | Actual | Status |
|---|---|---|---|
| Initial admin queue | Exactly 100 newest requests render; each card has one collapsed, named editor summary containing request ID/title/status | 100 shown; Load older button was before the list; all cards passed ID/title/status and collapsed-disclosure assertions | Pass |
| Load older keyboard action | Status filter → Load older is reachable within four Tabs; activation loads remaining five, announces result and places focus appropriately | Reached in 2 Tabs; Enter produced 105 cards (100+5), API offset 100 returned 5, “Older requests loaded.” appeared, focus moved to `#feedback-admin-status` | Pass |
| Queue filters | Type and status filters produce the correct intersection | Feature filter returned 53; Feature + Complete returned 11, every card matched | Pass |
| Collapsed editor keyboard behavior | Tab skips closed editor controls; Enter opens one chosen editor; control order is logical | Closed editor controls were skipped. After keyboard opening, order was status, priority, public update, private note, backlog IDs, duplicate ID, Save | Pass |
| Draft retention | Unsaved fields survive same-identity auth refresh, filter rerender, and English→Chinese rerender | Status `Blocked`, priority `urgent`, public/private drafts, and backlog ID survived; same-identity refresh kept the editor open, draft and focus | Pass |
| Same-tab account switch | Admin B sees server values, not Admin A’s unsaved draft | Logout/switch to Admin B showed stored `Complete`/normal values with empty drafts; Admin A’s private draft was absent | Pass |
| Shared-cookie cross-tab change | When Tab B changes the shared session from Admin A to B, old A drafts clear before B’s queue renders | Tab A’s synthetic draft was removed before B’s refreshed queue appeared; current identity was Admin B, server values were shown, and no A draft rendered | Pass |
| Triage and member privacy | Public update reaches requester; private note stays admin-only | Admin saved a public update and private note. Member’s 105-item list/API showed the update and did not contain/expose internal notes | Pass |
| Responsive/errors/cleanup | No 390px horizontal overflow or browser page errors; isolated resources removed | Admin and Member document/body widths matched at 375/375; zero page errors; isolated service, synthetic DB and Edge profile removed | Pass |

## Evidence

Command: `node output/playwright/feedback-ux-01-current-20260929/run.mjs`. Results: [`results.json`](../../output/playwright/feedback-ux-01-current-20260929/results.json), SHA-256 `3b43cbe8e5dfd9dd6c52fffe52eef88d24fb9bf9ef0bab7bd829aaf6992f3bbd`. Screenshots and harness are in [`output/playwright/feedback-ux-01-current-20260929`](../../output/playwright/feedback-ux-01-current-20260929/). The result records the ephemeral target, Edge version, source hashes/parity, request IDs, keyboard trail, draft values, account identities, response values, page errors, and cleanup outcome.

No UI defect was reproduced in this current-source run. Prior FEEDBACK-UX-01 artifacts remain unchanged; this run supersedes their older `app.js` hash for release evidence. It did not test native screen-reader output or other browser engines, and does not certify readiness of any separately running/live instance. All persistent changes were limited to the synthetic disposable database.

**Repository context:** `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`. Shared working-tree edits to `apps/api/server.js`, `apps/web/app.js`, and `apps/web/styles.css` pre-existed this QA assignment and were not changed by this tester. The QA note and test artifact folder are uncommitted QA artifacts.
