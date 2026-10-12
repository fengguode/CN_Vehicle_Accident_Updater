# Hermann User management phone-width matrix

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** isolated current-source service at `http://127.0.0.1:57999/`, disposable DB with synthetic admin and member  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Tester:** Hermann User Tester

## Runtime and cleanup

The isolated service was healthy and loaded current `app.js` and `navigation.js` exactly. SHA-256: app `752d838601ff8c5a1a21196d40f65e0f8ccb2be87e6e7748da66254ec8ff3647`; navigation `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`. Synthetic fixture only; no source edits. Temp DB/profile were removed and port 57999 no longer responds. Port 8788 was untouched.

## Responsive and keyboard results

| Viewport | Document client/scroll width | Body client/scroll width | Result |
|---|---:|---:|---|
| 320×800 | 305/317px | 305/317px | Fail: 12px horizontal overflow; “Administrator access” heading label clipped at viewport edge |
| 360×800 | 345/345px | 345/345px | Pass; no horizontal overflow |
| 390×844 | 375/375px | 375/375px | Pass; no horizontal overflow |

At 320px the viewport content height was 785px with scroll height 1177px and a 15px scrollbar gutter. The heading-label text line extended from x=226.64 to x=317.20, 12.2px past the effective content edge at x=305. At 360px the status container ended at x=333 and its text at x=322.06; at 390px they ended at x=363 and x=342.08. Member-card controls remained within the effective client width at every tested size; the cards scrolled vertically with no control overlap.

At all three widths, Tab from the User management heading reached the first Role selector (`uxadmin`), with `:focus-visible` and a 3px solid blue outline. No keyboard-focus defect was found.

## Header role comparison follow-up

A separate current-source Edge pass compared the header across signed-out, member, and admin states at 320×800, 360×800, and 390×844. Source `app.js` SHA-256 `8bd163704700a1680158c24375dd17d5a52898b472b3d43e5f0f85e27a817384` and `navigation.js` `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56` matched the served assets. The isolated fixture used a synthetic admin and approved member; no live writes occurred.

| Role | Viewport | CT mark | Eyebrow/name lines | Brand area |
|---|---:|---:|---:|---:|
| Signed out | 320×800 | 19.5×40px | 3/2 | 133.5×88.5px |
| Signed out | 360×800 | 25.9×40px | 2/1 | 173.5×51.6px |
| Signed out | 390×844 | 30.8×40px | 2/1 | 203.5×51.6px |
| Member/admin | 320×800 | 30.3×40px | 2/1 | 200.6×51.6px |
| Member/admin | 360×800 | 36.7×40px | 2/1 | 240.6×51.6px |
| Member/admin | 390×844 | 40×40px | 1/1 | 270.6×40px |

All header and navigation controls fit at all role/width combinations; no horizontal overflow, clipping, or control overlap was observed. The signed-out 320px brand is tightly wrapped because the Log in button remains visible, but the logo mark and text are still legible. Treat it as a responsive space tradeoff/design polish opportunity rather than a confirmed usability defect. Three sanitized 320px comparison screenshots are preserved in [the role matrix folder](../output/playwright/header-mobile-role-matrix-20260929/).

![320px User management showing clipped status label and horizontal scrollbar](/D:/project/ChinaTrafficIssueMonitor/updater-vnext/output/playwright/user-management-overflow-20260929/admin-user-management-320x800.png)

Screenshot SHA-256: `1f62eec00aaf6c37bcbf00d491a00971d55dcb2255dbdfe749cc4dea40d9e62e`.
