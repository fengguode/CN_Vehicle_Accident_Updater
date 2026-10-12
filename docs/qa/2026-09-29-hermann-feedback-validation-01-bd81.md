# FEEDBACK-VALIDATION-01 rendered retest — current app bd81 / CSS 69F09

## Scope

Retest the earlier `FEEDBACK-VALIDATION-01-F1` behavior on the primary-confirmed current source: title length 5–120, description 10–4000 and context 0–2000 UTF-16 code units after trimming. Check whitespace-only-after-normalization field errors in both locales, accessible error associations/focus, error/draft refresh after switching language, and exact maximum-boundary submission plus the member's own request list. All account and request data is synthetic.

## Environment and preflight

- Target: isolated same-origin `apps/api/server.js` instance at `http://127.0.0.1:65408`; `/health` returned 200.
- Browser: Microsoft Edge 154.0.4258.37, headed direct Node Playwright API with cached `playwright-core`, unique temporary persistent profile, 390×844 CSS viewport.
- Source/served parity passed for the root shell and all six browser assets. `app.js` SHA-256 `bd81f2839ae59cbe7a6bcc859fd2f1736313bc289024b4484fc88f4a7f859688`; `styles.css` `69f09a8d660b83e808715a2045e313a30e94eccfdbd3dddc76553a4e535454fc`; `index.html` `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`; `navigation.js` `7a1114587842f11bace2b1b4d69f9d15d5e35ae946abf7efd0f5564461dcea56`; `viewport.js` `fef9e10e9114de24f83a0ca909b841c1b93f1a6aa84fe8dabb023235893922da`; `report-presentation.js` `d0a081dc918f6c848d15a865d890eb8695d6554d1f626a8db4f26edcf1d07d6f`. `server.js` `2bd308fc81d6ea877dd83b079488deb35090cadd315e90d3802ad258f0335070`; `auth.js` `eebc14d0aa5e85420af365883ef8e120722a1605a7594430c94550db24105d1c`; `feedback-repository.js` `49a6af58c52d648a57b2b86d1fb36829fd798fecd89b0036f6ae435bdf81bb24`.
- One synthetic approved member was logged in. Invalid validation attempts made no `/api/feedback` POST; the single maximum-boundary request was synthetic and returned 201. No live 8788 access or writes. Page errors and unexpected console errors: zero.

## Results

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| English title entered as four spaces plus `x` (raw length 5) | Trim to one character; block POST; show linked, visible localized error and focus Title. | Value normalized to `x`; custom invalid state; `aria-invalid="true"`; `aria-describedby="field-validation-1"` resolves to visible `role="alert"` text “Enter at least 5 characters.”; Title focused with visible blue focus ring; zero feedback POSTs. | Pass |
| Switch language while title error is present | Keep invalid draft and refresh message to Chinese. | `x` retained; same error node/ref remains visible with Chinese text “请至少输入 5 个字符。” and `aria-invalid="true"`. Focus moves to the language toggle because it was clicked. | Pass; expected focus movement for the user's click |
| Chinese description entered as eight spaces, `x`, and a trailing space (raw length 10) | Trim to one character; block POST; show linked, visible Chinese error and focus Description. | Value normalized to `x`; `aria-invalid="true"`; visible `role="alert"` “请至少输入 10 个字符。” linked by `aria-describedby`; Description focused; zero feedback POSTs. | Pass |
| Switch language while description error is present | Keep invalid draft and refresh message to English. | `x` retained; same visible alert/ref updated to “Enter at least 10 characters.” and `aria-invalid="true"`. Focus moves to the clicked language toggle. | Pass |
| Exact raw maximum lengths | Accept title 120, description 4000, context 2000; show stored normalized values in own list. | Client native validity passed; POST returned 201/Submitted; stored/list lengths were title 120, description 3998, context 1998 after trimming boundary spaces; own list returned 200/count 1; form reset and success reference rendered. Document width 375/375 after submit. | Pass |

The synthetic boundary values were normalized as designed. The earlier F1 symptom (no surviving inline/accessibility error after the form's trim) did **not** reproduce on this current bundle. The screenshots show the visible alert and focused invalid field: [English title error](../../output/playwright/feedback-validation-01-current-bd81-20260929/01-whitespace-title-native-validation.png), [title after Chinese switch](../../output/playwright/feedback-validation-01-current-bd81-20260929/02-title-error-after-locale-switch.png), [Chinese description error](../../output/playwright/feedback-validation-01-current-bd81-20260929/03-whitespace-description-native-validation.png), and [maximum submission](../../output/playwright/feedback-validation-01-current-bd81-20260929/04-max-boundary-submitted-normalized.png). Full [machine results](../../output/playwright/feedback-validation-01-current-bd81-20260929/results.json) and [runner](../../output/playwright/feedback-validation-01-current-bd81-20260929/run.mjs) retain exact values and responses.

## Disposition and limits

- Rendered acceptance for the requested whitespace, locale-refresh, accessibility-relationship, focus, exact-boundary and own-list cases: **Pass on app bd81/CSS 69F09**.
- FEEDBACK-VALIDATION-01 overall status remains **In progress** pending the API/white-box boundary contract, Dennis review, project test gate and integration by the primary. Do not infer those gates from this browser run. F1 is **not reproduced on the current bundle; awaiting primary/reviewer disposition and regression**.
- Cleanup passed: Edge profile closed; temporary database/profile directory removed; isolated service stopped. Live port 8788 was untouched.
