# VIDEO-PLAYER-01 targeted QA follow-up

- **Date:** 2026-09-29
- **Target:** isolated `updater-vnext` service at `http://127.0.0.1:53353`; source/served browser assets matched.
- **Browser:** Microsoft Edge 154.0.4258.37, headed direct Playwright API, fresh disposable profile, 1280×800 viewport.
- **Data/policy:** synthetic administrator, synthetic reports and sources only. Configured only `https://covers.qa.invalid` as an allowlisted origin; no real origins, accounts, database, or covers were used.
- **Source hashes:** app.js `a438bd543df864f9837c06e9603ef160cecbf1135856237cc8225bbe322ecb9b`; styles.css `6e44743862cbbe118c6714f085f9b88541256c8cab8143373ef9e9af0a0f1ceb`; server.js `8a65a1d53753e721a7179fd19df430ee27116e9f2db4860075e9edb8fc0724d2`; media-review-repository.js `402c945dbc78095bd98b8371dac6752dc0229d663ce9ff99babc9678ddcd3e5b`; reports-repository.js `5376bda55177b4c24d683044888a460550a1bcc176b684ccf852d5d98f127901`.

## Acceptance cases

| Case | Result | Evidence |
|---|---|---|
| Browser preflight and served/source parity | Pass | Fresh Edge profile rendered the synthetic service. `results.json` has matching SHA-256 for index, app, styles, navigation, viewport, and report presentation assets. |
| Approve cover on configured synthetic origin | Pass | `https://covers.qa.invalid/approval.png` was fulfilled as a synthetic image; it loaded and Approve was enabled. Admin approved it in the rendered review UI; the candidate appeared under Approved, an `approve` history event was recorded, and authenticated `/api/reports` exposed the exact thumbnail URL. |
| Remove confirmation | Pass | First confirmation was dismissed: candidate and thumbnail remained, with no review event. Second confirmation was accepted: UI announced “Media review updated.” and reports API returned video present with no thumbnail. Dialog text matched the intended warning. |
| Missing-thumbnail fallback | Pass | Approved video with no cover rendered an image-role placeholder labeled “Video preview unavailable”; no image or preview link appeared. |
| Malformed-source fallback | Pass | Approved cover paired with `javascript:alert(1)` source returned no public thumbnail; report preview rendered the same neutral unavailable placeholder, with no preview link or source link. |
| Existing-record legacy migration | Pass | Disposable report schema was rolled back to pre-video/v10 shape, preserving an existing record. Current `migrate()` restored video columns; the row remained unchanged and received `video_status=unknown`, `video_thumbnail_url=NULL`, `media_review_status=pending`, and null reviewer/time. |

## Result and limits

All assigned cases passed. No page errors occurred. Only the expected synthetic admin approve and remove POSTs changed data; the test DB was disposable. Service stopped, DB and Edge profile removed, and live ports 8788/8793 were untouched. This run does not decide or validate production platform origins, image format/MIME policy, or human review/removal policy.

Machine-readable results, repeatable harness, request audit, and screenshots are in [`output/playwright/video-player-followup-20260929/`](../../output/playwright/video-player-followup-20260929/).

