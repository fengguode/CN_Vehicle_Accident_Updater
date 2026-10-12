# QA-01 native zoom preference attempt — 2026-09-29

## Scope and acceptance

Attempt one bounded, disposable Microsoft Edge run to verify the Reports, Account, and Feedback views at actual native 200% page zoom, without viewport/device emulation. Acceptance requires the same browser window and viewport, `innerWidth` approximately half baseline, `devicePixelRatio` approximately double, and `visualViewport.scale` remaining 1.

## Result

Microsoft Edge 154.0.4258.37 retained a seeded `profile.default_zoom_level` value of `3.8017840169239308`, but did not apply it. At baseline and after relaunch, the 1280×900 browser window measured `innerWidth=1256`, `devicePixelRatio=1`, and `visualViewport.scale=1`. Reports, Account, and Feedback rendered with no horizontal overflow or page errors, but at unchanged zoom. Edge's settings page rendered blank in the automation harness, so its Page Zoom percentage could not be inspected. Native 200% acceptance therefore remains **unverified**; this is an automation/setup failure rather than a reproduced application defect.

## Runtime and cleanup

The run used headed Edge 154, direct Playwright API, `viewport: null`, a persistent disposable profile, and the same `--window-size=1280,900` geometry on both launches. The isolated current-source service was `http://127.0.0.1:62682`; six served assets matched source. Only synthetic data was used. Service, database, and profile were removed; live ports 8788 and 8793 were untouched.

## Evidence and follow-up

Machine results and screenshots: [`output/playwright/qa01-native-zoom-pref-20260929/`](../../output/playwright/qa01-native-zoom-pref-20260929/). The preference-seeding path did not achieve or verify native zoom. Do not treat narrow CSS viewport checks as a substitute. Resume only with a controlled Edge UI method that confirms the selected Page Zoom value and viewport metrics, within the bounded UI acceptance session.
