# Hermann QA — report rating, change, and undo (2026-09-29)

## Scope and setup

- Variant: `updater-vnext`; current served/source UI: AAE `apps/web/app.js` SHA-256 `AAE23B6A90DD7DF84354990CF6F9EB4B7D1476C10A019FDC7987E325AD5FB7E2`; CSS `D761134A7738B6D6620074CC39C516DC0FE6D4B82134D6397514DEA02FE2A380`.
- Browser: Microsoft Edge headed Playwright (Hermann User Tester); 390×844 and 320×800 CSS viewport.
- Target: disposable isolated service on 127.0.0.1:58943 with synthetic report/member and fresh DB. No authenticated action or write against live 8788.
- Live gate during/after QA: 8788 `/health` returned 200, `/api/auth/me` user and CSRF null; served app.js matched current source.

## Scenarios and results

- Opened Reports as approved synthetic member. Keyboard Tab reached Relevant with visible 3px blue focus outline.
- Relevant rating POST returned 200 and UI announced it saved.
- Changed rating to Not relevant; POST returned 200 and choice persisted after reload.
- Undid rating; DELETE `/api/vote/<fingerprint>` returned 200 and absence persisted after reload.
- Repeat at 320px and 390px: document/body widths 305/305 and 375/375; no nested overflow offenders. Card widths 281px/351px; details and vote controls 256.63px/326.63px.
- No browser page errors. Final synthetic vote table empty; isolated DB/profile removed; isolated listener count on 58943 was zero (including stopping the test's orphaned Node PID 63832).

## Findings

No actionable UX defect reproduced in this rating flow. This session verifies voting UX, not issue/feature feedback submission or administrator triage, which have separate linked QA sessions in the canonical backlog.

## Evidence

- [390px report screenshot](../../output/playwright/reports-vote-responsive-aae-20260929/member-report-390-open.png)
- [320px report screenshot](../../output/playwright/reports-vote-responsive-aae-20260929/member-report-320-open.png)

## Git state

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. Shared dirty workspace; this QA note/backlog update and screenshots are uncommitted; no commit/push or live-service change.
