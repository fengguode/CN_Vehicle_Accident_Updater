# Requirement intake QA: linked video thumbnail preview

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`.  
**Scope:** Documentation/backlog intake only. No application, database, service, or account changes.

## Owner request

When the original article contains a video, show a platform-supplied still/cover thumbnail in the report preview. Clicking it links to the exact original-platform URL; Yuzhou recommends opening it in a new tab to preserve the report view. Do not embed or play video inside the application. The owner confirmed that only platform-supplied thumbnails are acceptable and a neutral placeholder should be used when one is unavailable. Previews should appear on both desktop and phone layouts, with a different aspect ratio for each.

## Source-of-truth review

- The root README for `updater-vnext` says current report/social-import schemas do not define reviewed image/video fields; media requires a separate schema/import/API change, source URL provenance, an approved safe-host and non-graphic review policy, and tests. The README also says source URLs are provenance, not media, and raw imported JSON is not exposed to the browser.
- `apps/web/report-presentation.js` projects `media: null`.
- `apps/web/app.js` renders a fixed `.report-preview` placeholder. The public reports repository returns report/source metadata but no reviewed media field.
- `apps/web/styles.css` hides the preview at phone width, so the owner's request requires a deliberate responsive decision for video-bearing cards.
- The social JSONL schema/importer defines no video or cover fields; extra values are stored in `raw_json`, which is not exposed by the report API. The `reviewed_relevance` flag is not media approval.
- The existing media-detection POC can identify generic image preview metadata, but its tests do not treat `og:image` as evidence that a video exists; it is not connected to ingestion.

## Role review and acceptance draft

Feng recommends a separate reviewed media field, exposing only approved metadata through the reports API, and retaining unverified status regardless of video presence. After the owner's clarification, Feng confirms platform-supplied cover thumbnails only: do not capture screenshots or infer thumbnail URLs; link to the exact recorded source URL; show previews on both desktop and phone with different ratios; use a neutral localized placeholder when missing; no in-app player. Feng and Yuzhou recommend 16:9 desktop and 4:3 phone ratios with `object-fit: contain`; exact ratios are not owner-confirmed. Yuzhou recommends a new tab to preserve the existing report view.

Yuzhou recommends the whole preview act as a keyboard-accessible link to `source_url`, opening a new tab with `rel="noopener noreferrer"`; accessible name identifies the platform/report and announces the new tab. Desktop/tablet uses 16:9; phone uses 4:3 only for video-bearing cards, while no-video cards retain the compact layout. Use `object-fit: contain`, fixed dimensions, neutral localized fallback on missing/failed image, retain the source link elsewhere, and do not crop or distort source evidence. Keep source/platform attribution, avoid asserting the image proves incident facts, and test focus, EN/ZH text, 44px mobile target, 1280px/tablet/390px/320px layouts, no overflow, and current-tab route/filter/scroll preservation.

Wang Licun's read-only feasibility check found that social imports currently have no explicit video/cover schema or media-review state. The requested feature therefore requires a platform/export-provided video state (`present`, `absent`, or `unknown`) plus a supplied cover when present; a generic `og:image` cannot qualify. Explicitly present video with unavailable cover gets a neutral placeholder; absent/unknown video preserves existing no-media behavior. The POC is not wired to ingestion and is not proof that a video exists.

The primary recorded `VIDEO-PLAYER-01` in the canonical backlog as P2 proposed / In progress. The owner decisions on thumbnail source, fallback, and phone preview are resolved as above. Priority remains a proposal rather than an owner-assigned release commitment. Implementation still requires the reviewed media schema/import/API contract, approved-host/privacy and non-graphic review boundary, and acceptance evidence.

Dennis reviewed the requirements, backlog wording, and this intake. He confirmed that new-tab behavior is consistently marked as a design recommendation rather than an owner decision, and that absent, malformed, or non-HTTPS `source_url` values fail closed without a guessed destination. No further actionable documentation concern remains in this scope.

After the feasibility check, the contract was refined to distinguish explicit `present`, explicit `absent`, and legacy `unknown` video states. Yuzhou and Dennis confirmed that only explicit `present` reserves the responsive video slot; a missing/unapproved thumbnail gets a neutral, noninteractive placeholder while the separate valid source link remains available. Explicit `absent` and legacy `unknown` preserve current no-media behavior (desktop fallback, compact phone card). Generic `og:image` metadata does not promote a record to video-present. Dennis found no further actionable requirement inconsistency.

The broader `SOURCE-01` generic-media and collector scope remains deferred; this owner-requested thumbnail-only feature is tracked separately.

## QA checks

- Read the target variant README and current card projection, renderer, CSS breakpoint, and public-report API contract.
- Confirmed no media value is currently projected and that raw import JSON is intentionally not exposed.
- Cross-checked the stable ID/status in `docs/PROJECT_BACKLOG.md`; the feature links to this note and `SOURCE-01` points to the decomposed scope.
- `git diff --check` is the final documentation consistency check for this intake.

No runtime/browser/media playback claim is made by this intake. No live service, port 8788, production database, account, or scheduled task was accessed or changed.
