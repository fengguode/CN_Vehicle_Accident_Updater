# Hermann UX-REG-04 duplicate username — current-source regression

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`.  
**Finding:** UX-REG-04 remains reproduced. No app source was edited.

## Environment and preflight

- Fresh isolated `apps/api/server.js` service on `http://127.0.0.1:59920`, backed by a disposable synthetic SQLite database. `/health` returned 200 and initial `/api/auth/me` was user-null.
- Headed Microsoft Edge `154.0.4258.37`, direct Playwright Node API using cached `playwright-core`, unique disposable profile, viewport 390×844.
- Served assets matched workspace files byte-for-byte: `index.html` `09379F2DF2553C5DE80CE22C90D8953906C7781F6E5F953B4BEF65DD2BEA2459`, `app.js` `9F56A4081A8D3F6369B52D1805D8960EF6D86BBAB2B9A21CD94E697654ADFC1F`, `styles.css` `CAFE53B8491E9BCE07476A33EEF7CB2A4DE424ADF21ACDC4B06FFEF44E573EC8`, and `navigation.js` `7A1114587842F11BACE2B1B4D69F9D15D5E35AE946ABF7EFD0F5564461DCEA56`.
- Fixture contained one synthetic admin, one synthetic existing approved member (`qa04existing`), and a valid unused invitation seeded before browser interaction. The registration attempt used that existing username with synthetic credentials and invite. No account was successfully registered.

## Results

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| English duplicate registration | Clear, localized, non-database error; retain values and invite | `POST /api/auth/register` returned 400; visible message was raw SQLite text `UNIQUE constraint failed: users.username`. Username, password, and invitation code remained filled. Message was in `#account-message` with `role="status"` and `aria-live="polite"`; Create account retained focus. | Fail — UX-REG-04 reproduced |
| Chinese duplicate registration | Chinese localized equivalent with same safe recovery | Second registration POST returned 400; the same untranslated English SQLite constraint text was displayed. All three values remained; Create account retained focus; status remained polite live region. | Fail — UX-REG-04 reproduced |
| No partial account/session/invitation mutation | No third account or new session; invitation remains usable | DB after both requests had only the two seeded accounts (admin and existing member), zero sessions, and invitation `used_at` null. The attempted username exists only as the original seeded member. | Pass |
| Browser/runtime | Current source, no client exception | All served assets matched source; zero page errors. The only non-GET calls were the two rejected registration POSTs (both 400). | Pass |
| Cleanup | Remove service, fixture and profile; leave live 8788 untouched | Service stopped; port 59920 health unreachable; temp DB/profile removed; 8788 untouched. | Pass |

The screenshots are [`English error`](../../output/playwright/registration-duplicate-username-9f56-cafe53-20260929/duplicate-registration-error-en.png) and [`Chinese error`](../../output/playwright/registration-duplicate-username-9f56-cafe53-20260929/duplicate-registration-error-zh-CN.png); the full request, focus, DB and cleanup evidence is in [`results.json`](../../output/playwright/registration-duplicate-username-9f56-cafe53-20260929/results.json). The test used pointer activation for Submit; the browser reports `document.activeElement` as Create account afterward, but `:focus-visible` was false. A keyboard-submitted error/focus-ring path remains untested in this pass.

**Disposition:** Keep UX-REG-04 `In progress`. Latest app.js `9F56A408…` still surfaces raw database constraint detail in both locales; no new separate issue is needed.  
**Git/evidence state:** This QA note, result, screenshots, runner, and backlog reference are uncommitted with existing shared changes. No commit or push.
