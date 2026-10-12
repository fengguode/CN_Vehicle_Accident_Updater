# VIDEO-THUMBNAIL-01 — Platform video cover thumbnails

**Status:** In progress; foundational backend, report preview, and administrator review UI are implemented and covered by synthetic checks. Real external thumbnail origins remain disabled pending policy approval.
**Priority:** P2 proposed; this is not an owner priority commitment.
**Canonical backlog ID:** `VIDEO-PLAYER-01` (stable tracking ID retained after the owner clarified the initial inline-player request to linked thumbnails).
**Target:** `updater-vnext` Reports cards
**Source:** Owner request and follow-up decisions in this task; current-state evidence below.

## Goal

When an original-platform report has an approved platform-supplied still/cover image for its video, show that image in the report-card preview. The preview links to the report's exact original-platform URL. Yuzhou recommends opening it in a new tab to preserve the report view. Video is played on the original platform; the app does not embed or play video.

## Current-state evidence

- `README.md` says report/social-import schemas have no reviewed image or video field, `raw_json` is not exposed to the browser, source URLs are provenance rather than media, and media needs explicit schema/import/API handling plus a safe-host and non-graphic review policy.
- `apps/web/report-presentation.js` projects only explicit API `video_status: present` metadata and validates both image and source URLs as HTTPS.
- `apps/web/app.js` renders the approved thumbnail as a keyboard-operable link to the exact source URL and restores the neutral placeholder on load failure; no player is loaded.
- `apps/web/styles.css` uses 16:9 desktop/tablet and 4:3 phone ratios for video-bearing cards; ordinary no-video cards retain the compact phone layout.
- `apps/api/reports-repository.js` returns a cover only when an independent review field is approved and an exact HTTPS origin is configured. The allowlist currently has no real platform entries.
- `apps/social-collector/record.schema.json` and `import-inbox.js` accept an explicit video state and platform-provided HTTPS cover separately from source provenance. Normalization ignores imported review assertions and sets new records pending. An admin-only review queue/API supports approve/reject/remove with append-only history; candidate cover URLs from unconfigured origins are withheld and cannot be approved. The allowlist has no real entries and media policy gates remain open.
- `experiments/media-detection-poc/` can detect generic image-preview metadata such as `og:image`, but its tests explicitly do not treat an image preview as evidence that a video exists. It is not wired to ingestion and is not a substitute for an explicit platform-provided video signal and cover thumbnail.

These observations describe current code and the remaining implementation boundary.

## Owner-confirmed behavior

1. The only accepted image input is a still/cover thumbnail supplied by the original platform. Do not capture screenshots, scrape/generate an image, guess a thumbnail URL, or derive it from `source_url`.
2. The thumbnail is a hyperlink to the exact, recorded `source_url` for that report. Do not use the thumbnail URL as the destination.
3. Do not embed a player, autoplay, or play video inside the app.
4. Show a preview on both desktop and phone layouts, with a different aspect ratio for each. The owner approved differing ratios; the implemented 16:9 desktop/tablet and 4:3 phone values follow Yuzhou's design recommendation.
5. If the thumbnail is absent or unavailable, show a neutral, localized placeholder.
6. A thumbnail does not change the report's verification state or imply an incident, its cause, or ADAS involvement has been verified.

## Design recommendation (Yuzhou, 2026-09-29)

Yuzhou recommends 16:9 on desktop/tablet and 4:3 on phones, using `object-fit: contain` with fixed geometry and no crop. Reuse the existing original-source link behavior: open the exact source URL in a new tab with `rel="noopener noreferrer"` to preserve the Reports view. The owner asked for different desktop/phone ratios and a link to the original platform, without choosing exact ratios or tab behavior. This is the design recommendation for implementation; no further owner input is needed to build to it, but it remains identified as a recommendation rather than an owner quote.

## Proposed traceable requirement hierarchy

### Goal

Let report readers recognize video-bearing source posts from their supplied cover image and open the original platform post without confusing the preview with an in-app player or verification evidence.

### Epic

**MEDIA-01 — Provenance-preserving report media previews.** Extend ingestion, persistence, API projection, and the report-card presentation to carry only reviewed platform-provided still media and its provenance.

### Feature

**MEDIA-01.1 — Linked platform cover preview.** Render an approved platform-provided cover thumbnail as a link to the exact original source post, responsively and accessibly.

### Use case

An approved member viewing Reports sees a cover image for a report whose platform supplies one. They activate it by pointer or keyboard and the exact source post opens in another tab. If no usable approved cover exists, they see a neutral localized placeholder and can still use the existing source link.

### User story

As an approved report reader, I want to recognize a source post that has video and open that post from its cover image, while keeping my report list available in its current tab.

## Functional and nonfunctional requirements

- **FR-1 Video and thumbnail provenance:** Authorized platform/export metadata must explicitly identify whether the original post contains video (`present`, `absent`, or `unknown`) and, when present, may provide its platform-supplied still/cover thumbnail. Ingestion/import and persistence represent the video signal and cover explicitly, separately from `source_url`, with platform/source provenance and a media review/approval state. Existing records without an explicit signal remain `unknown` and media-free. Do not infer video presence from `og:image`, generic image metadata, or the source URL.
- **FR-2 API boundary:** The report API exposes only the approved cover metadata needed by the UI. It must not expose `raw_json`, unreviewed media values, importer-only data, or credentials.
- **FR-2a Trusted media review:** Only an authenticated, approved administrator can inspect media candidates and change their media review state. The review list is separate from incident verification. Record the admin actor, action, and time in append-only history. Support approve, reject, and remove; reject/remove immediately suppress public exposure, and removal clears the stored cover URL. Imported review claims never change this history or state. The admin UI must not automatically fetch a thumbnail from an unconfigured or disallowed origin; with an empty origin allowlist, show a blocked/unavailable preview state and retain the original-source provenance link.
- **FR-3 Destination integrity:** For a report with an approved cover and valid HTTPS `source_url`, the cover links to that exact stored source URL. The cover URL is only an image source, never a navigation destination. If the source URL is absent, malformed, or not HTTPS, fail closed: do not make the thumbnail interactive and do not construct or guess a destination; retain only the existing source-link behavior.
- **FR-4 Safe navigation:** Proposed: open the cover link in a new tab with `rel="noopener noreferrer"` to preserve the existing Reports view. The existing explicit original-source link remains available and continues to point to the same report source.
- **FR-5 Responsive preview:** Approved cover previews are visible at desktop and phone breakpoints, with different ratios. Proposed ratios are 16:9 desktop/tablet and 4:3 phone; Yuzhou should confirm these in the design acceptance. Images use contain behavior without cropping or distortion. Layout remains stable while images load or fail.
- **FR-6 Empty/error state:** When video is explicitly present but its thumbnail is missing, unapproved, invalid, blocked, or fails to load, show a neutral localized, noninteractive “Video preview unavailable” placeholder in the video preview slot. Keep the existing separately labeled valid source link available. When video is explicitly absent or unknown, do not show a video thumbnail/affordance and preserve the existing no-media layout behavior.
- **FR-7 Accessible operation:** The linked image has a concise localized accessible name identifying it as a preview/link to the source. It is keyboard focusable and operable, has a visible focus indicator, and does not duplicate verbose alt text already conveyed by adjacent report content. The placeholder is not presented as a broken interactive control.
- **FR-8 Research semantics:** Video/thumbnail presence does not change `verification_status`, lead labeling, relevance votes, classifier labels, or causal language.
- **NFR-1 Privacy:** No media-provider/player code is loaded because there is no in-app player. Do not request the original video; fetch only the approved cover. Avoid sending unnecessary report text or account identifiers to thumbnail hosts. Respect platform access/retention rules and deletion requests.
- **NFR-2 Safety:** Accept only platform-provided still/cover images from approved platform origins and supported image formats. Apply the project's approved non-graphic review policy before API exposure. Reject active content, arbitrary HTML/SVG, unsafe protocols, and arbitrary host URLs. Do not claim the thumbnail itself verifies the post or event.
- **NFR-3 Compatibility:** Existing reports and consumers without media continue to work with the neutral placeholder; source provenance, report authorization, pagination, and current card content remain intact.

## Acceptance criteria

| ID | Scenario | Acceptance evidence |
|---|---|---|
| AC-1 | Explicit platform video signal, approved platform cover, and exact HTTPS source URL | API returns approved video/cover metadata; rendered image uses that cover URL and links to the byte-for-byte/equivalent normalized stored `source_url`. If the proposed new-tab behavior is accepted, verify `target="_blank"` and safe `rel` attributes. |
| AC-2 | Explicit video-present signal but missing, unreviewed, rejected, malformed, or failed cover | Noninteractive neutral localized “Video preview unavailable” placeholder remains in the video preview slot at desktop and phone ratios; no unapproved image is exposed; card content and the separate valid source link remain available. |
| AC-3 | Explicit video-absent or legacy/unknown signal | No video preview or thumbnail affordance appears; preserve the existing no-media behavior (desktop fallback and compact phone layout). Generic `og:image` alone never changes unknown to video-present. |
| AC-4 | Missing, malformed, or non-HTTPS original source URL | Do not make the thumbnail interactive or create a destination; show the neutral fallback for an explicitly video-present item; retain the existing source-link policy. |
| AC-5 | Desktop and phone rendering | Browser measurements/computed styles establish the selected desktop and phone preview ratios; contain behavior preserves the whole image; no crop, distortion, layout shift, or horizontal overflow. |
| AC-6 | Keyboard and assistive access | Tab reaches the linked preview in logical order; Enter opens the exact source URL (new tab only if accepted as the design behavior); visible focus indication and localized accessible name are present; placeholder state is understandable without a broken link. |
| AC-7 | Source and thumbnail differ | Activating preview always navigates to the exact original post URL, never the thumbnail host/asset URL. The existing source link remains a separate usable link to that same original. |
| AC-8 | Unverified lead with image | API/UI retain the record's existing verification state and lead language; no verification or ADAS causation is inferred from media presence. |
| AC-9 | Privacy/safety boundary | Isolated integration tests show raw importer JSON and unreviewed media are absent from public API; unsupported protocols/hosts/formats are rejected; browser network inspection shows no player/embed request and no video-file request. |
| AC-10 | Regression and empty dataset | Existing records with unknown/absent media retain current no-media behavior; report authorization, source link, card content, and responsive behavior remain intact. |
| AC-11 | Trusted media review | Synthetic integration/browser checks prove non-admin access is denied; an approved admin can inspect the candidate separately from incident status, approve/reject/remove it, and review actor/action/time are retained; reject/remove immediately stop public cover exposure. |
| AC-12 | Admin media-host safety | With no configured thumbnail origins or with an invalid/disallowed cover URL, admin UI makes no thumbnail request and clearly shows that the preview cannot be inspected; it retains the exact source link and must prevent approval until inspection is possible. |

## Dependencies and implementation boundaries

- **Architecture/Worker:** define the explicit import/storage/API field contract and migration/backfill behavior before coding. Keep `source_url` authoritative provenance; cover-image URL is separate and never a substitute for it.
- **Ingestion owner:** establish which supported platforms can supply a video-present signal and cover metadata through authorized, documented methods. No scraping around login walls, platform controls, or access restrictions.
- **Video-signal integrity:** preserve a platform/export-provided video-present signal alongside the cover. The existing media-detection POC may identify a generic preview image but does not prove video presence and is not evidence for this feature.
- **Review policy:** define the trusted platform-origin allowlist, non-graphic review disposition, approval/rejection states, and removal behavior before an image is exposed. Unavailable review means placeholder.
- **UI Designer (completed recommendation):** use desktop/tablet 16:9, phone 4:3, contain/no crop, localized accessible name/fallback, and safe new-tab behavior consistent with the existing source link. The owner requested differing ratios; no additional ratio choice is required to proceed with this recommendation.
- **Exposure policy:** use a configurable exact-origin allowlist for approved thumbnail URLs. An empty allowlist must expose no external covers. Media approval and origin authorization are independent gates; default to pending and fail closed. The first implementation slice may build schema, import, persistence, review-state, API suppression, and synthetic tests before any real platform/CDN origin is authorized.
- **Review workflow:** do not accept an imported `media_review_status=approved` or equivalent as proof of human review. Establish a trusted human review action or trusted review artifact outside the untrusted post payload; preserve reviewer and review time, allow rejection/removal, and immediately stop exposure on rejection/removal.
- **User Tester/Reviewer:** exercise real rendered desktop/phone behavior and inspect link destination, keyboard use, failure fallback, privacy/network behavior, and API exposure with disposable synthetic data.
- **Compatibility:** audit every report API consumer, import path, migration, export/publication path, and any existing media-related feature before implementation. Do not publish media by adding it to raw/public exports implicitly.

## Verification evidence required before completion

1. Unit tests for `present`/`absent`/`unknown` video-signal behavior, URL/provenance validation, allowlist and format rejection, review-state filtering, and absent-media fallback; verify generic image metadata alone never qualifies as video.
2. Isolated API/database migration and authorization tests proving approved-only exposure and no `raw_json` leakage.
3. Browser UI tests at desktop and phone sizes for exact aspect ratios, contain/no-crop, no layout shift/overflow, localized fallback, keyboard/focus behavior, exact source destination, and safe new-tab attributes.
4. Browser network evidence confirming no player, embed, or video request, and only approved thumbnail requests; synthetic data only.
5. Narrow project regression suite, syntax checks, `git diff --check`, and scoped independent code review. Record browser, viewport, target instance, and source/build identity in the QA session.

## Open decisions and non-goals

- **Owner product decisions:** The owner has confirmed thumbnail provenance, fallback, no embedded player, source link, and previews on both desktop/phone with differing ratios. Exact ratio values and new-tab behavior follow Yuzhou's design recommendation. P2 is proposed and is not an owner commitment.
- **Implementation prerequisite before real thumbnail exposure:** authorize supported platform/CDN origins and image formats, and define the human non-graphic review/removal criteria. These are security/data-contract details; a fail-closed foundation and admin review/API suppression can be built before choosing origin entries, but actual thumbnails remain hidden until the configured allowlist and review gate pass. They are not unresolved owner choices about the confirmed user experience.
- **Out of scope:** in-app playback, embedded third-party players, screenshots captured by this system, generated/guessed thumbnails, automatic verification or cause inference, changing vote semantics, or changing the original-source destination.

## Agreement record

The owner confirmed platform-supplied cover thumbnails only, neutral placeholder when unavailable, link to the exact original platform URL, no embedded player, and previews on both desktop and phone with different ratios. Feng's architecture review supports a fail-closed contract with explicit video state, separate media review, and a configured origin allowlist; with an empty allowlist, no cover reaches the API. Yuzhou's design review recommends 16:9 desktop/tablet, 4:3 phone, contain/no crop, accessible keyboard link, and safe new-tab behavior. These role recommendations do not authorize actual platform/CDN origins or claim customer acceptance.
