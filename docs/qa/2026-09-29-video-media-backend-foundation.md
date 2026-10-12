# VIDEO-PLAYER-01 backend foundation QA

**Date:** 2026-09-29 (Asia/Shanghai)  
**Scope:** social-import schema/validation, normalization, SQLite report persistence, and report API projection only. No UI, live service, task scheduler, real database, or publication changes.

## Acceptance checks defined before implementation

1. Legacy records and imports without a video signal normalize to `unknown`; only explicit `present` / `absent` / `unknown` values are accepted, and generic image metadata/source URLs do not imply video.
2. A platform thumbnail is stored separately from the original source URL and accepted only as HTTPS. An imported review/approval assertion must never set a trusted review state; all new/imported reports begin pending with no reviewer identity/time.
3. SQLite migration adds media fields to existing reports without changing existing records' no-media behavior, and insert/dedup semantics remain unchanged.
4. Report API never returns raw JSON, review status/identity, or unreviewed/rejected thumbnail URLs. Approved cover URLs are exposed only when HTTPS source URL is valid and the cover's exact origin matches a configured exact-origin allowlist; absent/unconfigured allowlist exposes no cover.
5. Existing reports with no explicit media retain their prior API field shape. Explicit `present` can communicate a noninteractive preview state without disclosing pending/rejected review metadata or cover URL.
6. Focused automated checks cover normalization, import validation/schema, migration/persistence, approval suppression, origin allowlisting, source integrity, and API privacy; then run the narrow regression suite and `git diff --check`.

## Results

- Environment: Windows workspace, Node.js v24.14.0, disposable in-memory SQLite databases; no live service or persistent DB used.
- Focused command `node --test test/video-media-backend.test.js test/source-policy.test.js test/provenance.test.js test/traffic-ranking.test.js`: **15 passed, 0 failed**. Covers schema/import validation, legacy and invalid signal defaults, imported approval spoofing, persistence defaults, explicit cover persistence, dedup, pending/rejected suppression, empty/malformed/exact-origin allowlist, invalid source URL, and raw/review-field non-disclosure.
- Migration record uses schema version 10; version 9 is already owned by account anonymization. The social-import schema contains no trusted review-status, reviewer, or review-time fields.
- Full `npm test`: **71 passed, 0 failed**.
- Syntax checks for changed JavaScript modules and `git diff --check` on assigned source/test/QA files: **passed**.
- No browser checks apply to this backend-only slice. Rendered placeholder/link behavior remains unverified and belongs to the separate UI implementation and User Tester acceptance.

## Findings and limitations

This assignment does not include a trusted human media-review actor, review API/UI, review audit trail, or removal workflow. Imported approval claims will be ignored and API exposure remains fail-closed unless an independent trusted mechanism sets the review fields. No thumbnail origins will be configured by this change. The slice validates URL protocol/credentials and exact allowed origin, but does not fetch media or verify MIME/image format or graphic content; those require the trusted review and media-safety policy path before enabling real origins.
