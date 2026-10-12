# Hermann live signed-out feedback entry check

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** `http://127.0.0.1:8788/` (local user service; read-only interaction)  
**Browser:** Codex In-app Browser, Chromium-based; rendered desktop view  
**Tester:** Hermann User Tester

## Runtime and bundle parity

`/health` and `/` both returned HTTP 200. The served `/app.js` SHA-256 matched `apps/web/app.js` at `8bd163704700a1680158c24375dd17d5a52898b472b3d43e5f0f85e27a817384`. `/api/auth/me` returned `user: null`, and `/api/reports` returned HTTP 401. This test did not authenticate or mutate live data.

## Browser observations

The signed-out Reports view rendered the sign-in/approval notice and an Open account action. Activating Account rendered the Account heading, Username and Password fields, Log in, and Register with invitation. The navigation exposed Reports and Account while Log in remained available in the header. No feedback submission form or feedback queue was exposed while signed out. This is consistent with the previously verified access policy.

## Related isolated submission evidence

Creation as an administrator (Issue and Feature) passed in [admin submission QA](2026-09-29-hermann-admin-feedback-submission.md). Creation by a pending signed-in member (Issue), own-list visibility, and admin queue visibility passed in [pending-member QA](2026-09-29-hermann-pending-member-feedback.md). Approved-member creation is covered by [latest-source member feedback lifecycle QA](2026-09-29-hermann-latest-source-member-feedback-lifecycle.md). The live database was not used for writes.

No new defect was found in this signed-out entry check.

## Git state

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`. Shared changes were already present; this note and backlog update are uncommitted. No commit or push.
