# VIDEO-PLAYER-01 linked preview UI QA

**Date:** 2026-09-29 (Asia/Shanghai)  
**Scope:** report-card media projection and rendering only. All data/accounts were synthetic. Port 8788 and production data were not accessed.

## Acceptance checks defined before implementation

1. Only API metadata explicitly marked `video_status: present` can qualify for a preview; both supplied thumbnail and exact source destination must be HTTPS without credentials.
2. Render a platform-supplied still as a link to the recorded original URL, with safe new-tab attributes; do not load a player or video.
3. Use 16:9 desktop and 4:3 phone geometry, show video-bearing previews at both widths, contain rather than crop, and preserve compact phone behavior for non-video cards.
4. Keep keyboard operation and localized link name; show the neutral fallback if the image fails.
5. Check source/build parity and exercise a real headed Edge session against an isolated service with synthetic media only.

## Results

- `node --check apps/web/app.js`: passed.
- Focused `node --test test/report-presentation.test.js test/video-media-backend.test.js`: 7 passed, 0 failed. URL guards reject insecure sources and thumbnail URLs; legacy/non-video metadata does not produce media.
- Full `npm test`: 72 passed, 0 failed.
- `git diff --check` on the focused UI, test, and API files: passed (Git emitted existing LF-to-CRLF normalization warnings).
- Headed Microsoft Edge 154.0.4258.37 via the cached Playwright Node API rendered the isolated service at `127.0.0.1:55629`. Synthetic SQLite contained one explicitly-present, approved test row; the permitted test image origin was intercepted and fulfilled locally by Playwright, so no external thumbnail was fetched. Served `app.js` and `styles.css` hashes matched source.
- At 1280×800 (`innerWidth`/`innerHeight` asserted), the preview rendered at 358×201.375 (16:9), with `object-fit: contain`. Tab/focus reached the preview link, which targeted the exact synthetic original source with `target=_blank` and `rel=noopener noreferrer`.
- At 390×844 (`innerWidth`/`innerHeight` asserted), the video preview rendered at 349×261.75 (4:3), with no horizontal overflow. Switching to Chinese changed the link's accessible name to `打开原始来源`.
- A synthetic image 404 caused the image link to be removed and a noninteractive fallback with localized text `暂无视频预览` and matching accessible name to render. The corresponding English copy is `Video preview unavailable`.
- The isolated service, disposable DB, and Edge profile were removed. Port 8788 was untouched. Attempt one remained Account view; the runner navigation was corrected and the successful rerun followed.
- Results and screenshots: [runner](../../output/playwright/video-thumbnail-ui-20260929/run.mjs), [machine results](../../output/playwright/video-thumbnail-ui-20260929/results.json), [desktop screenshot](../../output/playwright/video-thumbnail-ui-20260929/desktop.png), [phone screenshot](../../output/playwright/video-thumbnail-ui-20260929/mobile.png).

## Findings and remaining gates

- UI rendering, ratios, source destination, keyboard focus, and bilingual accessible naming passed for the approved synthetic thumbnail.
- The missing-URL/unreviewed state is enforced by the API; this Edge run directly exercised image-load failure. A separate missing-thumbnail row and malformed URL row are not yet rendered in the browser.
- The trusted administrator review/approval/rejection/removal workflow and its audit record remain unimplemented. No real platform/CDN origin is configured; API exposure therefore remains fail-closed. MIME/image-format and non-graphic review policy also remains open. No real platform cover can currently be exposed.
- Dennis's backend review found no actionable defect and noted the old-schema migration path has no direct migration-from-legacy-schema test. Dennis's independent UI review identified missing video-specific fallback wording; the localized fallback was added and the rendered image-error path rerun. Hermann's independent User Tester rerun passed the measured layouts and source-link checks, while initially flagging the mislabeled desktop screenshot; the runner was corrected to capture desktop before resizing and now asserts viewport dimensions.
- The feature stays `In progress`; this QA is not release or customer acceptance.

## Superseding targeted follow-up — 2026-09-29

The missing-thumbnail/malformed-source cases and admin review workflow noted above were open at the time of this session. They subsequently passed along with allowed synthetic-origin approval, Remove confirmation (dismiss/accept), and migration preserving an existing pre-video row. See the later [targeted VIDEO-PLAYER-01 follow-up](2026-09-29-video-player-followup.md) and its isolated Edge results. Production origins, MIME/format policy, human review/removal policy, and separate 320px/tablet preview acceptance remain open; this follow-up does not enable real covers.
