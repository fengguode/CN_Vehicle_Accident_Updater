# VIDEO-PLAYER-01 cross-role requirement recheck

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`; requirements/backlog only. Current shared source HEAD is unchanged by this session; no commit or push.  
**Participants:** Feng Guo (architecture), Wu Yuzhou (design), primary (integration).  
**Result:** The fail-closed first implementation slice and design recommendation are documented. No application code or live service was changed.

## Owner-confirmed behavior retained

- Show a still/cover thumbnail supplied by the original platform; use a neutral fallback if missing/unavailable.
- The preview links to the exact original-platform URL; do not embed or play video in-app.
- Provide previews on phone and desktop with different ratios.
- Do not imply incident verification, cause, or ADAS involvement from video or cover presence.

## Cross-role agreement and boundaries

- Feng traced the current social import, raw JSON persistence, reports API projection, and card presentation. A first slice can safely add explicit video/cover fields and manual review state without selecting allowed CDN domains if exposure fails closed until an origin is configured. Imported content must not self-assert approval. Media review is distinct from relevance review and incident verification; preserve reviewer/time and rejection/removal behavior.
- Yuzhou recommends 16:9 desktop/tablet, 4:3 phone, contain/no crop, fixed geometry, localized fallback and accessible keyboard operation. Reuse the existing original-source safe new-tab behavior (`target="_blank"`, `rel="noopener noreferrer"`) to preserve the report view. These exact values/tab semantics are design recommendations, not direct owner statements.
- A future thumbnail is eligible for API/UI exposure only when video state is explicit `present`, review is approved, the thumbnail is valid HTTPS and its exact origin is in configured allowlist, and the stored source URL is valid HTTPS. Empty allowlist, absent/rejected/unreviewed image, or invalid source fails closed. Explicit `absent` and legacy `unknown` preserve the existing no-media layout. Generic `og:image` is not a video signal.
- No further owner decision is required to build the fail-closed foundation. Actual supported origins/CDNs and non-graphic review criteria remain a prerequisite for showing real external images.

## Focused documentation QA

- Cross-read `docs/requirements/VIDEO-THUMBNAIL-01.md`, `docs/PROJECT_BACKLOG.md`, `README.md`, and the existing intake record against both role reviews.
- Confirmed owner inputs remain distinct from design/architecture recommendations; no change to proposed P2 priority or release date.
- Confirmed no in-app player, guessed thumbnail, `raw_json` exposure, verification-state change, or arbitrary image origin was introduced by this documentation update.
- `git diff --check` on the requirement, backlog, and this record passed.

## Next implementation boundary

Torsten may implement the explicit import/storage/API/review foundation and UI state plumbing with empty-origin fail-closed defaults. Real thumbnail exposure remains disabled until an approved origin list and review policy are configured. Browser acceptance is required before this item can be marked complete; the current environment's headed Edge startup blocker is tracked separately under UX-REG-03/04 and QA-01.
