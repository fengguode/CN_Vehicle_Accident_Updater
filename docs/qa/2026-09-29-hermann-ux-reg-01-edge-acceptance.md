# Hermann UX-REG-01 invitation guidance and invalid-code Edge acceptance

**Date:** 2026-09-29 (Asia/Shanghai)
**Variant:** `updater-vnext`
**Browser:** Microsoft Edge 154.0.4258.37, headed direct Node ESM with cached `playwright-core`, fresh disposable profiles.
**Tester:** Hermann User Tester.

## Source identity and isolation

The latest local and served `apps/web/app.js` matched at 77,393 bytes, SHA-256 `a4ef417072e185bf8871c3f205aaad72ee348d259f163531a9e386bf74f9e794`. `apps/web/index.html` SHA-256 was `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; `apps/api/server.js` SHA-256 was `f6760db746861e3cff69d982904f52a9e0d0d5f5e64a321916e6124fe0b7e9`; `apps/api/auth.js` SHA-256 was `3c931cbe1c8c9b95984f6a302467df99f3750d2d1b0d3f125084ab1b6b94692d`.

The browser acceptance ran against two fresh local services and separate disposable SQLite databases: port 54401 for responsive/helper behavior and port 55739 for invalid invitation behavior. No live 8788 authentication or write was made. The invalid-code database started empty and used only fabricated test values.

## Results

- In Register mode, the helper rendered in English and Chinese, changed with the selected UI language, and was associated to the visible required Invitation code field through `aria-describedby="invite-help"`.
- In Login mode, both the invitation field and helper were hidden and omitted from the accessibility tree; the input's `aria-describedby` attribute remained in the DOM but was inert while the input/helper were hidden. No assistive-technology exposure issue was observed.
- At 320×800 and 390×844, the helper and input fit without horizontal overflow or apparent clipping. The logged measurements showed viewport-width document layout.
- On the empty isolated DB, one registration submit using a fabricated username, synthetic password, and 40-character invalid invitation code sent one `/api/auth/register` request and received HTTP 400 with the clear message `Invitation code is invalid, expired, or already used.` Username, password, and code values remained in the form for correction; focus returned to Create account; the submit control was enabled; signed-in actions stayed hidden; `/api/auth/me` remained user-null; DB user count remained zero, including the fabricated username.
- No new defect was found. The earlier missing invitation guidance issue is resolved by accurate bilingual helper text directing visitors to an approved member. This test did not create an account or invitation.

Both Edge sessions/profiles, services, databases, and temp directories were removed. The test ports refused connections after cleanup. Live 8788 remained healthy and untouched.

**Review:** Dennis had already confirmed the helper ID and validation-handler preservation/restoration in the shared source review. This pass verified the rendered behavior and error/recovery path.

**Git state:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; `apps/web/app.js`, `apps/web/index.html`, backlog/roundtable and QA artifacts remain shared uncommitted changes; no commit or push.
