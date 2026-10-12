# Hermann QA-01 native zoom attempt — current isolated source

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`.  
**Scope:** Bounded attempt at native Edge 200% zoom for signed-in Account and Reports flows, then one effective-width fallback. No application or backlog files were changed.

## Browser preflight and isolation

- Headed Microsoft Edge `154.0.4258.37`, driven through direct Playwright Node API with cached `playwright-core` and unique persistent disposable profiles.
- Isolated `apps/api/server.js`, fresh synthetic SQLite database, synthetic approved admin/member, and six fictional reports. The browser rendered the app from the same origin as `/health` and the API. Served `index.html`, `app.js`, `styles.css`, and `navigation.js` matched workspace files.
- Target instances: native attempt `http://127.0.0.1:58854`; effective-width fallback `http://127.0.0.1:50970`. Baseline browser viewport was 390×844 CSS px (`innerWidth` 390, `innerHeight` 844, devicePixelRatio 1; visual viewport width 375 due to scrollbar).
- Port 8788 was not contacted. No real accounts or data were used. The services were stopped and synthetic databases/profiles removed; cleanup is asserted in both result JSON files.

## Results

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| Baseline Reports | Signed-in synthetic member can open Reports and see seeded reports | Reports view rendered 6 synthetic cards at 390×844; no horizontal overflow | Pass |
| Baseline Account | Signed-in member can open Account and feedback form | Account view and feedback form rendered at 390×844; no horizontal overflow | Pass |
| Native Edge zoom attempt | 200% zoom causes a measurable viewport/device scale change; inspect Account and Reports under that zoom | Five `Control+Shift+Equal` shortcut keypresses caused no change: `innerWidth` 390→390, DPR 1→1, visual viewport scale 1→1. Browser-chrome zoom could not be controlled through this automation path | Blocked / unverified |
| Effective-width fallback | At the 200%-effective-width approximation (195×422 CSS px), Account and Reports reflow without page-level horizontal overflow | Both views rendered, six Reports cards remained available, document/body scroll widths matched client widths (180px). Header wordmark wrapped nearly one letter per line; navigation label “Account” split across lines. This is a rendered narrow-width observation, not proof of native zoom behavior | Pass with UX observation |
| Browser errors and isolation | No client errors; test state remains disposable | Zero page errors; cleanup true; port 8788 untouched | Pass |

## Evidence

- Native attempt result: [`results.json`](../../output/playwright/qa01-native-zoom-20260929/results.json), SHA-256 `237B7F03E4FB216570ECE0596EE46E0C4047CFAACEF7FBD1BC74B46253F5A05E`, result `BLOCKED_NATIVE_ZOOM_UNCONTROLLED`.
- Effective-width fallback result: [`effective-viewport-results.json`](../../output/playwright/qa01-native-zoom-20260929/effective-viewport-results.json), SHA-256 `922A1A4658930F8A84CA1EBEBAAF32CE172D6A26EFB723390C1E082D1B3CCF67`, result `PASS_EFFECTIVE_VIEWPORT_ONLY_NATIVE_ZOOM_UNVERIFIED`.
- Baseline and fallback screenshots: [`reports-390x844-baseline.png`](../../output/playwright/qa01-native-zoom-20260929/reports-390x844-baseline.png), [`account-390x844-baseline.png`](../../output/playwright/qa01-native-zoom-20260929/account-390x844-baseline.png), [`account-after-native-zoom-attempt.png`](../../output/playwright/qa01-native-zoom-20260929/account-after-native-zoom-attempt.png), [`account-195x422-effective-width.png`](../../output/playwright/qa01-native-zoom-20260929/account-195x422-effective-width.png), and [`reports-195x422-effective-width.png`](../../output/playwright/qa01-native-zoom-20260929/reports-195x422-effective-width.png).
- Commands: `node output/playwright/qa01-native-zoom-20260929/run.mjs` and `node output/playwright/qa01-native-zoom-20260929/run-effective-viewport.mjs`. Initial harness-only attempts hit an invalid Playwright `:input` selector and a hidden sign-in form; both were corrected before the recorded final runs. They did not indicate product failures.
- Current served source hashes from the isolated run: `index.html` `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; `app.js` `9f56a4081a8d3f6369b52d1805d8960ef6d86bbab2b9a21cd94e697654adfc1f`; `styles.css` `cde5d66726ddfa3f7c8ec20fcb195abe80589c8ea580d70ef2a7f8764d8c9583`; `navigation.js` `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`.

## Follow-up browser bridge probe

The current computer-use browser inventory exposed only the Codex in-app browser and no native app windows. A bounded attempt to create an Edge tab returned `Browser is not available: edge`; it did not open a tab or change browser settings. Therefore native Edge zoom remains unverified. The headed Playwright Edge runs above and in the linked header regression prove rendered effective-width behavior, not browser-chrome zoom.

## Finding and disposition

The 195×422 fallback has a visual reflow concern: the header wordmark and “Account” navigation label wrap into multiple short lines. This is reproducible from the fallback screenshots, but its behavior under true native 200% zoom remains unverified. Treat it as a candidate QA-01 responsive usability follow-up, not as a verified native-zoom defect. No new stable issue ID is assigned here.

**QA-01 scope:** Native zoom remains open and unverified. The existing effective-width check is supplemented with current-source Account and Reports evidence and the header wrapping observation; this does not close the native zoom gate. Physical devices, screen readers, and browser zoom UI were not tested. The release readiness decision remains with the primary agent.

**Git state:** `updater-vnext` HEAD remains `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; the requested QA note and output artifacts are uncommitted. The follow-up bridge probe made no source or browser-setting change.
