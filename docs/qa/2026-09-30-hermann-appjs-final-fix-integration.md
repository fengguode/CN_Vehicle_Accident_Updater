# Hermann app.js blocker fix — integration QA (2026-09-30)

## Scope

Integrated Torsten's final triage-error localization change for `FEEDBACK-I18N-TRIAGE-01` and the responsive pending-account heading change for `UI-ACCOUNT-ZH-390-01`. The last review gap was missing EN/ZH handling for the API's `same_origin_required` code. No runtime, account, data, or production service was touched.

## Source and verification

- `apps/web/app.js` final SHA-256: `AD3CEA5921901A7A17550455200F293DF7C61B07663C8C5D1ED979C69579EF1F`.
- `apps/web/styles.css` SHA-256: `61E43BEB97E57899738C65E6662BD05107DC4E7D05899C2720FB915A841A06E0`.
- `node --check apps/web/app.js`: passed.
- `npm test`: passed, 85 tests, 0 failures (7.7s).
- `git diff --check`: passed; only existing LF-to-CRLF warnings reported for dirty files.
- Torsten's focused triage/layout tests: 6/6 passed. Regression assertions cover `same_origin_required` and `internal_error` localization in both locales.

## Review and rendered acceptance

Dennis completed exact-hash read-only review: all normal triage validation/security responses, `same_origin_required`, and generic `internal_error` are mapped; unknown text fallback, conflict rebase, draft preservation, and focus behavior remain intact. Hermann's final headed Microsoft Edge 154.0.4258.37 run on isolated `http://127.0.0.1:8793` served exact app.js/CSS hashes at 1280×900 (triage) and 390×844/320×800 (Account). PASS: invalid backlog ID returned HTTP 400 with localized English and Chinese polite errors; `same_origin_required` returned 403 and generic `internal_error` returned 500 with expected Chinese messages; duplicate-cycle validation returned 400 in Chinese. For each triage case, attempted values remained, Save was enabled/focused, and no unwanted triage mutation was detected. All page errors and failed requests were empty. See [structured final results](../output/playwright/live-feedback-user-story-suite-20260930/edge-ad3-final-localization-and-layout-results.json), [390px screenshot](../output/playwright/live-feedback-user-story-suite-20260930/edge-ad3-pending-account-390.png), [320px screenshot](../output/playwright/live-feedback-user-story-suite-20260930/edge-ad3-pending-account-320.png), and triage screenshots in the same directory.

At both Account widths, `账户` rendered on one line; pending status remained visible beneath it with no overlap; document and body scroll widths matched their client widths. The range bounding box extended 3px above the heading element's CSS box because of font line-box geometry, but the rendered screenshots show the complete glyphs; horizontal text bounds fit and the browser reported no clipping or page overflow. The isolated synthetic triage records matched before/after snapshots. Port 8788 and production data remain untouched. The earlier e614 and intermediate harness failures are recorded as superseded setup/assertion issues, not product failures.

## Disposition

Integration, independent source review, and exact-hash rendered Edge acceptance pass for both backlog items. The reported localization/layout defects are complete.
