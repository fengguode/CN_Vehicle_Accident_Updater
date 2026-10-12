# Hermann UX-I18N-01 isolated Edge verification

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** Fresh disposable service `http://127.0.0.1:55260` with an empty isolated SQLite database.  
**Browser:** Microsoft Edge `154.0.4258.37`, headed persistent context, direct Playwright Node API with cached `playwright-core`, fresh disposable profile; viewport `1280×800`.  
**Source revision:** HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared worktree dirty. Served `/app.js` SHA-256 `38304aaf4481d476d0cabd8ecc85876028d5355bee8b620b1f7a775f88b1a1d9` matched current `apps/web/app.js` exactly.

## Preflight

- Isolated service `/health`: HTTP 200; expected app UI rendered from same origin as API.
- Current app bundle identity verified by fetching `/app.js` and byte-for-byte hash comparison against local source.
- No production service, account, database, port 8788, or external network was used.

## UX-I18N-01 acceptance

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| Initial language | `document.title` is English and `<html lang="en">`. | `China Traffic Incident Database`; `en`. | Pass |
| Toggle to Chinese | Chinese document title and `lang="zh-CN"`. | `中国交通事故数据库`; `zh-CN`; local preference `zh`. | Pass |
| Toggle back to English | English document title and `lang="en"`. | `China Traffic Incident Database`; `en`; local preference `en`. | Pass |
| Reload with persisted Chinese preference | After app initialization, title and document language remain Chinese. | `中国交通事故数据库`; `zh-CN`; local preference `zh`. | Pass |
| Page errors | No browser page errors. | Zero `pageerror` events. | Pass |

Full results: [results.json](../../output/playwright/ux-i18n-01-edge-20260929/results.json). Final Chinese-after-reload screenshot: [chinese-title-after-reload.png](../../output/playwright/ux-i18n-01-edge-20260929/chinese-title-after-reload.png). Harness: [run.mjs](../../output/playwright/ux-i18n-01-edge-20260929/run.mjs).

The service, empty database, and Edge profile were cleaned up. This verifies the isolated current-source UI behavior for the specified language/title transitions; it does not assert native screen-reader announcements or other localization coverage.

Git was read-only checked: branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, existing dirty/untracked work preserved. QA artifacts are uncommitted.
