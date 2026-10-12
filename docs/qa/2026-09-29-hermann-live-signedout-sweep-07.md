# Hermann live signed-out UX sweep 07

**Date:** 2026-09-29 (Asia/Shanghai)
**Variant:** `updater-vnext`
**Target:** `http://127.0.0.1:8788/`
**Browser:** Microsoft Edge 154.0.4258.37, headed direct Node ESM with cached `playwright-core`, fresh disposable profile, 1280×800.
**Tester:** Hermann User Tester; read-only browser journey.

## Runtime and source identity

- `/health` returned 200; `/api/auth/me` returned `user:null`; `/api/reports` returned 401.
- The served `/app.js` was 77,151 bytes with SHA-256 `1351ab0a6bfe5d9fc67aea74d1a6d39faf635cde21669e5e4e897e5475f74f04`, matching the local workspace source at test time.
- No credentials were entered and no account, invitation, report, or feedback write was attempted. No page errors were observed.

## Rendered observations

- Signed-out Reports and Account access gates rendered. Keyboard traversal reached Username, Password, Invitation code, Create account, login-mode control, home, and Reports without submitting a form.
- Switching English and Chinese updated the visible labels, document language/title, and title in both directions.
- Registration still requires an invitation code and provides no visible request/help route for an unregistered visitor (**UX-REG-01**, reproduced).
- Empty states behind the signed-out Reports gate were not accessible in this pass.
- No new distinct defect was identified. The harness's initial `.cjs` launch failed; the `.mjs` retry completed the browser pass.

## QA result and limits

This pass confirms the signed-out gates, language switching, keyboard route, and UX-REG-01 against the source-matched live shell. Authentication, member/admin journeys, and protected report/feedback states were not tested against port 8788 because its database/process identity remains unknown. See the isolated role QA for synthetic member/admin coverage and the isolated localized-validation Edge acceptance matrix for custom form validation.

The variant repository is `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59` as last recorded; existing shared working-tree changes remain preserved. This QA note and backlog update are uncommitted; no commit or push.

## Primary narrow-width follow-up

The live signed-out Account registration form was inspected at 390×844 and 320×800 in the Codex In-app Browser. The Username, Password, Invitation code, Create account, and sign-in-switch controls remained visible. At 320px, `window.innerWidth`, document scroll width, and body scroll width were each 320px; the form card measured 265px wide within the viewport, with no horizontal overflow. The invitation-request guidance gap remained visible. The temporary viewport override was reset and the test tab closed.

## Keyboard navigation follow-up

**Browser:** Codex In-app Browser at its default 1280×720 viewport, hidden disposable tab, live target 8788. The first six Tab stops were the home link, Reports, Account, Log in, language toggle, and Open account. Each had a visible 3px solid focus outline. The sequence reached all principal signed-out navigation/access actions in order; no form was submitted. The browser tab was closed after the pass.
