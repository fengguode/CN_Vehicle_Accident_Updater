# Hermann FEEDBACK-UX-01 pagination keyboard focus follow-up

**Date:** 2026-09-29 (Asia/Shanghai)
**Target:** isolated current-source service at `127.0.0.1:51239`; no live 8788 requests/writes.
**Browser:** Microsoft Edge 154.0.4258.37, headed direct Node ESM/cached Playwright, fresh disposable profile, 390×844.
**Tester:** Hermann User Tester.

## Preflight

Fresh isolated DB contained one synthetic approved administrator and 101 synthetic feedback requests. `/health` returned 200; same-origin UI/API loaded. Served assets matched current source: app.js SHA-256 `a4ef417072e185bf8871c3f205aaad72ee348d259f163531a9e386bf74f9e794`; index.html `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; server.js `f6760db746861e3cff69d982904f52a9e0d0d5f5e64a321916e6124fe0b7e9`; feedback repository `576e3180224b3bd277f2ff4af5e9a974edecd52ee12278d874797d8041da4c36`.

## Actual keyboard pagination result

Admin queue showed 100 requests and Load older visible/enabled. Starting from the Status filter, the tester pressed Tab 702 times through the two filters and seven controls in each of 100 cards until `#feedback-load-more` was the actual active element. It matched `:focus-visible`, with a solid 3px outline; bounding box x=27..219, 192×44px. Enter issued the offset-100 GET (200), appended the final request (101 total), hid Load older, and moved focus to `#feedback-admin-status`, which announced “Older requests loaded.” as `role=status`, `aria-live=polite`. No keyboard pagination defect was found.

## Cleanup and limits

The DB had one synthetic user and 101 requests before removal. Service, DB and profile were removed; port 51239 no longer accepts TCP. Live 8788 remained untouched. This closes the pagination focus-ring uncertainty from the earlier volume run; it does not resolve the separate design question of repeated tall admin editors (939px per card / about 93,900px for 100 cards).

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared source/docs remain uncommitted; no commit or push.
