# Hermann admin Feedback mobile layout and keyboard QA at 320×800

**Date:** 2026-09-29 (Asia/Shanghai)
**Target:** isolated service at `127.0.0.1:52616`; no live 8788 requests/writes.
**Browser:** Microsoft Edge 154.0.4258.37, headed direct Node ESM/cached Playwright, fresh disposable profile, 320×800.
**Tester:** Hermann User Tester.

## Preflight and source identity

Fresh isolated SQLite DB with one synthetic admin; `/health` returned 200 and the rendered UI loaded. The synthetic admin submitted one Issue through the Account form (POST `/api/feedback` returned 201), then opened Feedback. The current served source matched local files:

- app.js: `a4ef417072e185bf8871c3f205aaad72ee348d259f163531a9e386bf74f9e794`
- index.html: `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`
- server.js: `f6760db746861e3cff69d982904f52a9e0d0d5f5e64a321916e6124fe0b7e9`

## Admin queue observations

The synthetic request rendered in the admin Feedback queue. Viewport width was 320px; document and body client/scroll widths were 305px/305px. The card measured x=27 to x=278 (width 250px, height 1008px); its scroll/client widths were 248/248px. No descendant overflow or out-of-viewport elements were found.

Status and Priority selects, public/private textareas, backlog and duplicate inputs, and Save update were visible, enabled and within x=41..264. Selects and inputs measured 223×45px, textareas 223×59px, and Save update 223×44px. Keyboard traversal was Status → Priority → public update → private note → backlog ID → duplicate ID → Save update. All seven controls matched `:focus-visible` and showed a solid 3px outline. No mobile layout or keyboard-focus defect was reproduced.

## Cleanup and Git state

Only synthetic login and feedback creation writes occurred. Cleanup found one synthetic user and one issue before deleting the DB/profile; port 52616 no longer accepts TCP. Live 8788 remained untouched.

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared changes remain uncommitted; no commit or push.
