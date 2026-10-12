# UX-REG-03/04 supplemental registration error pass — 9F56/69F09

**Date:** 2026-09-29. **Target:** one fresh isolated `updater-vnext` service and SQLite DB. Synthetic admin, approved existing member, and three synthetic valid invitation codes. No live 8788 auth or writes.

## Preflight

- Service `/health` 200; `/api/auth/me` user-null. The root `/` served the app; all six assets matched current workspace source.
- SHA-256: app.js `9f56a4081a8d3f6369b52d1805d8960ef6d86bbab2b9a21cd94e697654adfc1f`; styles.css `69f09a8d660b83e808715a2045e313a30e94eccfdbd3dddc76553a4e535454fc`; index.html `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; navigation.js `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`; report-presentation.js `d0a081dc918f6c848d15a865d890eb8695d6554d1f626a8db4f26edcf1d07d6f`; viewport.js `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da`.
- Headed Microsoft Edge 154.0.4258.37, direct Node Playwright using cached playwright-core, disposable profile, 390×844. No browser page errors.

## UX-REG-03 invalid invitation and recovery

Chinese registration was opened and submitted by keyboard (Tab from invitation field to Create account, then Enter) with a synthetic invalid invitation. `/api/auth/register` returned **400**. The UI displayed the untranslated English text `Invitation code is invalid, expired, or already used.` despite `documentElement.lang="zh-CN"`. The message was `role=status`, `aria-live=polite`; username/password/code remained populated and focus returned to Create account with a 3px blue `:focus-visible` ring. At this checkpoint the disposable DB still contained 2 users, 0 sessions, 3 valid unused invitation rows, and 0 consumed invitations.

The same synthetic username/password then recovered with a seeded valid invitation; `/api/auth/register` returned **201** and the browser rendered a logged-in pending member Account state. A harness wait timed out afterward because it searched the Chinese `#auth-status` text for the English substring “pending”; therefore post-recovery DB/session/invitation counts were not captured, and later duplicate-username attempts were not reached. This is a harness language mismatch, not an application failure. The valid registration itself was a synthetic disposable write.

The recovery screenshot shows a long Chinese pending-user status line running to the viewport’s right edge at the 390px run. This is a **visual candidate only**: the harness saved no post-recovery DOM bounds/scroll metrics, so clipping is not confirmed as a defect.

## UX-REG-04 duplicate username

The English and Chinese duplicate-username attempts were not run in this fixture because the recovery-status harness timeout stopped the single bounded pass. Existing prior 9F56/Cafe evidence for both locales remains in [UX-REG-04 QA](2026-09-29-hermann-duplicate-username-current-source.md): each duplicate returned HTTP 400 with raw `UNIQUE constraint failed: users.username`, with fields retained and polite status/focus. This pass does not refresh that evidence to CSS 69F09.

## Browser/network/cleanup evidence

Observed registration responses: invalid invitation **400**, valid recovery **201**. No other form submission occurred. Browser errors: zero. Before invalid submit, invariant snapshot was users=2, sessions=0, invitations=3, used invitations=0; after the invalid request the same counts remained. The second registration's success and pending Account rendering are captured, but no post-success DB snapshot was available. No duplicate requests were issued.

Machine artifact: [`results.json`](../output/playwright/registration-error-state-current-69f09-20260929/results.json); runner: [`run.mjs`](../output/playwright/registration-error-state-current-69f09-20260929/run.mjs). Screenshots: [Chinese invalid invitation](../output/playwright/registration-error-state-current-69f09-20260929/invalid-invite-zh.png), [valid recovery pending state and unconfirmed clipping candidate](../output/playwright/registration-error-state-current-69f09-20260929/failure-state.png).

Cleanup passed: isolated service on port 63706 stopped, health unreachable, exact SQLite/profile temp directory removed, 8788 untouched. Disposition: UX-REG-03 remains confirmed/open; UX-REG-04 remains open with prior evidence; duplicate checks in this run unverified; clipping is not a confirmed finding.
