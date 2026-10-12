# FEEDBACK-UX-01 — Isolated Edge acceptance

**Date:** 2026-09-29  
**Target:** `updater-vnext`, isolated `apps/api/server.js` instance at `http://127.0.0.1:64290` (ephemeral; stopped after run). Source tree based on `HEAD daa5b58` with the current shared working-tree edits; served `index.html`, `app.js`, and `styles.css` matched the workspace files. `app.js` SHA-256: `dfbfbe7f9dcbe564f90f05b826f08bb4fb43845d71ed315d01d50f5addeaa508`; `styles.css` SHA-256: `b6071808af773a20c03ace8f5dbe34c00a564cce32705a28da9f112d3e0ec8d`.  
**Environment:** Windows, Microsoft Edge 154.0.4258.37, direct Playwright Node API using headed Edge and a fresh disposable persistent profile, 390×844 viewport. Isolated SQLite DB contained two synthetic admins, one approved synthetic member, and 105 synthetic feedback requests. No real data used and port 8788 was not contacted. Browser preflight passed: isolated service `/health` returned 200, the app and API shared the same ephemeral origin, and all served UI assets matched source.

## Acceptance results

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| Admin queue initial page | First 100 requests; Load older appears before list; one closed triage disclosure per card with ID/title/status summary | 100 rendered; button precedes list; all 100 summaries matched their synthetic records | Pass |
| Keyboard pagination | Load older reached in ≤4 Tabs from status filter; Enter loads remaining 5, announces completion and returns focus to status filter | Reached in 2 Tabs; 105 rendered; `Older requests loaded.` announced; focus `feedback-admin-status`; button hidden | Pass |
| Filters and collapsed controls | Feature and Feature+Complete filters are accurate; collapsed editor fields are skipped; opening via keyboard yields sensible order | Counts 53 and 11; Tab skips to next summary; editor order: status, priority, public update, private notes, backlog IDs, duplicate, save | Pass |
| Draft state and same-tab identity switch | Drafts persist through filter/language re-render; same-identity auth poll preserves editor/focus; changing A→B removes A’s draft and restores server values | Filter and Chinese language toggle retained draft values; simulated 30s poll preserved open editor and focused `public_update`; B saw server status/priority and no A draft/private text | Pass |
| Cross-tab shared-session identity change | A’s unsaved values disappear before B’s queue renders; refreshed list belongs to B | B authenticated in second tab; MutationObserver recorded A list with draft, then empty list with no draft, then B’s one-row Blocked list; B server values rendered | Pass |
| Save visibility and privacy | Public update reaches submitter; internal note remains private | Admin saw both saved public/private text; member list/API showed public update and no `internal_notes` field or private text | Pass |
| Responsive/error checks | No horizontal overflow or browser page errors at target viewport | Admin and member document/body widths 375/375 CSS px (390px viewport less scrollbar); zero Playwright `pageerror` events | Pass |
| Isolation and cleanup | Stop isolated server, remove synthetic DB/profile, leave live service untouched | Server stopped; DB and profile removed; port 8788 untouched | Pass |

## Evidence and disposition

The final run result is **PASS** with no product defects found in these scenarios. Command: `node output/playwright/feedback-ux-01-final-20260929/run.mjs`. Machine-readable results, harness, and seven final screenshots are in [`output/playwright/feedback-ux-01-final-20260929`](../../output/playwright/feedback-ux-01-final-20260929/). I visually reviewed the cross-tab admin and member privacy screenshots in addition to the DOM assertions. Results JSON SHA-256: `9af6c0d4533eb949402ecc3201cd17cfeBD3b85f83445d56c2a89083874d0b1c`.

The harness had intermediate test-side predicate/expectation errors while being developed (closed `<details>` descendants can have layout rectangles; filter state persists across identity changes; localized status wording; and saved public updates display in card/history while the edit field is blank). Those were corrected in the harness; they did not indicate application failures. The final run is the evidence of record.

**Untested / limitations:** This is a focused rendered acceptance run at 390×844, not a full browser/accessibility audit or full automated test suite. No artificially delayed stale network response was injected; the shared-cookie identity transition and ordered clear/refill DOM mutations were exercised. Other browsers, viewport sizes, live service readiness, and concurrent production traffic remain outside this session.
