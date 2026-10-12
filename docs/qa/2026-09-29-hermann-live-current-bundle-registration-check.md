# Hermann live current-bundle signed-out registration check

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** local 8788 service, read-only signed-out browser session  
**Browser:** Codex In-app Browser, 1280×720  
**Tester:** Hermann UX continuation

## Preflight

`/health` and `/` returned 200; `/api/auth/me` returned `{"user":null,"csrf":null}`; `/api/reports` returned 401. Served `/app.js` SHA-256 `8bd163704700a1680158c24375dd17d5a52898b472b3d43e5f0f85e27a817384` matched local source exactly. The signed-out Reports view displayed the research disclaimer and approval gate; Feedback navigation was hidden.

## Rendered path

Opening Account showed Login, then Register with invitation showed Username, Password, Invitation code, and the approved-member one-use invitation helper. An empty Create account attempt rendered required-field errors under all three controls, marked each input invalid, and focused Username. Switching the selected language to Chinese updated all three errors and registration helper to Chinese without clearing them; switching back restored English. No credentials or invitation were entered, and no success or authenticated state appeared. The browser API/network request log was not captured, so this run does not assert whether the browser emitted any POST; authenticated user remained null on subsequent read-only check.

No defect was found in the scoped current-bundle path. This was a read-only UI acceptance check; no account/data mutation or source edit was made. Port 8788's process/database identity remains unknown, so all authenticated/write scenarios stay on isolated services.
