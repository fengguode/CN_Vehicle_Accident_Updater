# QA-01 native Edge zoom desktop-control attempt — 2026-09-30

## Scope

Try the Windows Computer Use bridge to establish native Edge browser-control access for QA-01's actual 200% page-zoom acceptance. No page zoom or other browser setting was changed.

## Result

The returned installed-app inventory listed Microsoft Edge (`MSEdge`) as not running with no targetable windows. `sky.launch_app({ app: "MSEdge" })` returned `Computer Use app approval timed out`. A follow-up read-only `sky.list_apps()` confirmed Edge remained not running with no windows. No browser UI, profile, application setting, or project service was changed.

The previous isolated Playwright attempt also did not establish native zoom: Edge retained the seeded preference but Reports, Account, and Feedback kept `innerWidth=1256`, DPR=1, and `visualViewport.scale=1` before and after relaunch. See [preference attempt evidence](2026-09-29-qa01-native-zoom-pref-attempt.md) and its machine results. A CSS-width approximation is not accepted as native zoom evidence.

## Disposition

`QA-01-NATIVE-ZOOM-01` remains Blocked/unverified. The Windows desktop-control bridge timed out at app-launch approval; the browser-profile preference path was ignored by Edge. Do not claim 200% acceptance from these attempts. No live service or user data was involved.
