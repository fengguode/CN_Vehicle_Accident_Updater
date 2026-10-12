# Hermann live signed-out account entry check

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** current local service `http://127.0.0.1:8788/`  
**Browser:** Codex In-app Browser, 764×838 rendered viewport  
**Tester:** Hermann UX continuation

## Preflight and safety

Read-only preflight returned `/health` 200, `/` 200, `/api/auth/me` `{"user":null,"csrf":null}`, and `/api/reports` HTTP 401. This confirms the service was available and the browser was signed out. Authenticated process/database identity remains unknown; no authenticated requests or writes were made.

## Rendered checks

- Fresh tab loaded the current app shell and showed the signed-out Reports notice, source/provenance disclaimer, Account navigation, and Log in entry.
- Opening Log in rendered Username, Password (12+ characters), and a Register with invitation mode control.
- Opening registration rendered Username, Password, Invitation code, and the helper “Ask an approved member to create and share a one-use invitation code with you.” The fields and button fit in one row/visible form at the observed viewport.
- Empty Create account was blocked by required-field validation; all three required fields were identified and focus returned to Username. No account, invitation, or feedback request was submitted.

No reproducible product defect was found in this bounded pass. Broader responsive/keyboard/internationalization evidence remains linked in prior live signed-out QA; this session did not remeasure focus indicators or narrow viewports. Live API checks were read-only and no source was changed.
