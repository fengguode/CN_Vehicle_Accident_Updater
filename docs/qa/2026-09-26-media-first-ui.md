# QA session: media-first incident report cards

**Date:** 2026-09-26 (Asia/Shanghai)  
**Target:** `updater-vnext`, working tree changes in `apps/web/app.js`, `apps/web/styles.css`, `apps/web/report-presentation.js`, `apps/api/server.js`, `test/report-presentation.test.js`, and the media-availability note in `README.md`.  
**Environment:** Node.js 24.14.0; local disposable service on `127.0.0.1:8791`; database copied with SQLite `VACUUM INTO` from the local 321-report database into `%TEMP%/ctim-vnext-ui-qa/staging.db`; temporary QA admin credentials were used only on that staging service. The production listener and database were not used for these checks.

## Acceptance checks and results

| Check | Result | Evidence |
| --- | --- | --- |
| Report presentation chooses concise bilingual title/summary and exposes no inferred media, even when input has `source_url` or an arbitrary `image_url`. Missing records default to the explicit unverified state. | **Pass** | `node --test` ran 50 tests, including `test/report-presentation.test.js`; 50 passed, 0 failed. |
| JavaScript parses and the patch has no whitespace errors. | **Pass** | `node --check apps/web/app.js`; `node --check apps/web/report-presentation.js`; `node --check apps/api/server.js`; `git diff --check`. |
| Disposable API/auth checks cover signed-out denial, admin/member/pending roles, approvals, invitation lifecycle, pagination, filters, vote/change/undo, and data not exposing `raw_json`. | **Pass** | With `ADAS_TEST_BASE_URL=http://127.0.0.1:8791` and `ADAS_DB_PATH` pointing to the disposable copy: `npm run vnext:test-auth` and `npm run vnext:test-io` both returned `ok: true`. The IO smoke reported 321 reports, pages 1/2, 12 brand filter values and vote change/revoke success. |
| Updated asset routes load from the disposable service. | **Pass** | HTTP GET to `/`, `/app.js`, `/report-presentation.js`, and `/styles.css` each returned 200 with expected content type. `/health` returned `{"ok":true,"service":"adas-vnext"}`. |
| Project User Tester performs the required fresh signed-out desktop and narrow-mobile user flows, including keyboard login, report details, search/filter/pagination, votes, and role access. | **Blocked** | The User Tester could reach the staging service but browser discovery/tab creation failed (`nodeRepl.fetch request failed`, browser request-header policy load failure, and IAB visibility unsupported). Primary CUA state inspection timed out. The Playwright CLI `npx` prerequisite was present, but package invocation produced no output and stalled; it was interrupted. No browser scenarios or screenshots were produced. |

## Findings and disposition

- The target report API and social-import schema have no explicit media fields. Import accepts unknown JSON properties into private `raw_json`, which the API omits; the browser is intentionally not given that raw object. Across all 321 local records, the raw inputs contained no photo/video/media/thumbnail property names. Thus no actual media is available to render, and the UI uses an honest “No preview available” surface. No URL is guessed from a post URL and no autoplay or fabricated thumbnail is used.
- A safe future media feature needs an explicit source-provided media field with provenance, an allowlisted HTTPS host policy and a reviewed non-graphic/privacy-safe flag, carried through importer, storage and API with tests. README documents this prerequisite.
- The visual User Tester gate remains incomplete because no browser runtime was available. Desktop/mobile layout, keyboard focus in rendered cards, actual details interaction and responsive overflow have not been manually verified. Do not mark this UI task QA-complete until that pass runs in a browser-enabled context.

## Operational notes

The live-facing API serves `apps/web` source files directly from its known asset map on port 8788. These source edits become visible after the running API process reloads/restarts; this task did not restart or publish the live service. Only the disposable port 8791 service/database was used for integration checks.
