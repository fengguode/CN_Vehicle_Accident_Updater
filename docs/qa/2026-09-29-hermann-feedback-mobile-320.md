# Hermann member/admin feedback mobile QA at 320×800

**Date:** 2026-09-29 (Asia/Shanghai)
**Target:** isolated latest-source service at `127.0.0.1:63020`; no auth or write to live 8788.
**Browser:** Microsoft Edge 154.0.4258.37, headed direct Node ESM/cached Playwright, fresh profiles, 320×800.
**Tester:** Hermann User Tester.

## Preflight and isolation

Fresh synthetic admin/member DB; `/health` 200; same-origin UI rendered. Latest served files matched source: app.js SHA-256 `a4ef417072e185bf8871c3f205aaad72ee348d259f163531a9e386bf74f9e794`; index.html `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; server.js `f6760db746861e3cff69d982904f52a9e0d0d5f5e64a321916e6124fe0b7e9`; auth.js `3c931cbe1c8c9b95984f6a302467df99f3750d2d1b0d3f125084ab1b6b94692d`.

## Rendered coverage and limits

The synthetic member/admin lifecycle completed through Issue submission; the member's request appeared in the member Account list and the admin Feedback queue loaded the request. At the 320px viewport, member document/body `scrollWidth` was 305px; the member request card text fit in the captured list, and no member-side overflow elements were reported.

The runner also reached the admin card/triage editor and executed geometry checks plus a seven-step keyboard traversal, but the tool output was truncated before the admin measurements were retained. Therefore admin queue no-overflow/focus results are **unverified** in this record. This is an evidence-output limitation, not a reproduced product failure. No defect was reported in the retained result.

## Cleanup and Git state

The isolated DB contained only two synthetic users and one synthetic feedback request before cleanup. Database and both profiles were removed; port 63020 no longer accepts connections. Live 8788 remained healthy and untouched.

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared source/docs are uncommitted; no commit or push.
