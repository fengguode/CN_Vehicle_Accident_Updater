# UX-I18N-02 current-bundle regression check

**Date:** 2026-09-29 (Asia/Shanghai)
**Variant:** `updater-vnext`
**Target:** `http://127.0.0.1:8788/`
**Browser:** Microsoft Edge 154.0.4258.37, headed direct Node ESM with cached `playwright-core`, fresh temporary profile, 1280×800.
**Tester:** Hermann User Tester.

## Preflight and checks

- `/health` returned 200 and `/api/auth/me` returned `user:null`.
- Served `/app.js` was 77,151 bytes, SHA-256 `1351ab0a6bfe5d9fc67aea74d1a6d39faf635cde21669e5e4e897e5475f74f04`, and exactly matched local source.
- Edge `navigator.language` was `zh-CN`. In the English UI (`documentElement.lang=en`), activating empty Log in displayed `Complete this field.` for Username and Password, set `aria-invalid=true`, focused Username, and did not enter submitting state. After switching to Chinese (`lang=zh-CN`), messages became `请填写此字段。`.
- No POST/PUT/PATCH/DELETE requests were observed. No credentials were entered and no server write occurred.

## Result

UX-I18N-02's earlier mismatch did not reproduce on the current served bundle, including while browser locale was Chinese and selected UI language was English. This records a regression pass, not a closure: source review and Git completion evidence remain outstanding. See the earlier reproduction and [isolated localized validation acceptance](2026-09-29-hermann-ux-i18n-02-localized-validation-edge.md) for the resolved inline-validation behavior.

Git state observed in the shared workspace: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared changes remain uncommitted. No commit or push.
