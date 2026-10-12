# VIDEO-PLAYER-01 owner decision audit — 2026-09-30

## Current requirements

Feng reviewed the current README, canonical backlog, and `requirements/VIDEO-THUMBNAIL-01.md`. The owner-confirmed interaction is: use only a platform-supplied still/cover; link to the exact recorded source URL; use a neutral fallback when unavailable; do not embed or play video; keep previews on desktop and phone with different ratios; and do not imply that the image verifies an incident or ADAS causation.

The current implementation keeps `present`/`absent`/`unknown` state distinct from verification, exposes covers only when human-approved and the exact HTTPS origin is configured, and keeps the production origin allowlist empty. The API does not expose real covers while that allowlist is empty. No raw importer JSON is rendered.

## Pending owner decisions

Yuzhou recommends 16:9 desktop/tablet and 4:3 phone, `object-fit: contain`, and opening the exact source URL in a new tab with safe `rel` attributes. The owner approved different phone/desktop ratios and a source hyperlink, but did not confirm those exact ratios or new-tab behavior in the recorded replies. Keep these as provisional design recommendations until the owner confirms them.

Before any real remote cover is exposed, the owner/policy must also name supported platform/CDN origins, accepted image formats and size limits, and non-graphic review/removal criteria. The feature's release scheduling remains proposed P2, not owner-scheduled. No origin or policy was inferred or changed in this audit.

## Disposition

The synthetic/fail-closed foundation may proceed under existing acceptance criteria. Real media remains unavailable until explicit policy decisions are recorded. See the linked implementation blueprint and acceptance evidence in [`PROJECT_BACKLOG.md`](../PROJECT_BACKLOG.md#active-and-blocked-work).

## Git state

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; this QA/backlog update is uncommitted among existing shared work. No code, allowlist, or live service was changed.
