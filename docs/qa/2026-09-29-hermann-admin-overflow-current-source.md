# Hermann User management overflow current-source recheck

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** isolated service `http://127.0.0.1:57723/`, synthetic admin and member  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Tester:** Hermann User Tester

## Runtime and source identity

`/health` returned 200 and the User management view rendered. Served assets exactly matched the tested local source: `app.js` SHA-256 `8bd163704700a1680158c24375dd17d5a52898b472b3d43e5f0f85e27a817384`; `navigation.js` `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`; `styles.css` `9fc657c3bcb35626d84d012ca43a9142f84a44155755f33cf48a0f6e1a4b9d4e`; `index.html` `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; `server.js` `e610efe25dfccb1b8cd7c45db16381a2d658c272c76365e8bec71b9a102da901`; `auth.js` `eebc14d0aa5e85420af365883ef8e120722a1605a7594430c94550db24105d1c`.

## Measurements

| Viewport | Document client/scroll | Body client/scroll | Result |
|---|---:|---:|---|
| 320×800 | 305/317px | 305/317px | Fail: heading label clipped; horizontal scrollbar |
| 360×800 | 345/345px | 345/345px | Pass |
| 390×844 | 375/375px | 375/375px | Pass |
| 1280×800 | 1280/1280px | 1160/1160px | Pass |

At 320px, the `Administrator access` heading text spans x=226.64–317.20, 12.2px beyond the effective client edge at x=305, into the 15px scrollbar gutter. This reproduces the prior current-source finding on the latest app/styles. At 360px the text right edge is 322.06; at 390px it is 342.08; at desktop it is 1196. Admin controls remained within bounds at all four sizes. Admin login returned 200, User management GET returned 200, and no page errors occurred.

The screenshot visibly shows the cropped heading label and horizontal scrollbar: [320px screenshot](../output/playwright/ui-admin-320-01-revalidation-20260929/admin-user-management-320x800.png). The compact browser result is [results.json](../output/playwright/ui-admin-320-01-revalidation-20260929/results.json).

## Cleanup

The synthetic DB/profile were deleted, PID 43604 stopped, and port 57723 no longer had a listener. Live 8788 was not contacted. No source changes were made in this run. This pass confirms UI-ADMIN-320-01 remains open on current source.
