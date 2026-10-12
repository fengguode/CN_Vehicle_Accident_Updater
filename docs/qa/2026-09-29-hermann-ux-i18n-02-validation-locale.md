# Hermann UX-I18N-02 native validation locale investigation

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** Fresh disposable same-origin service `http://127.0.0.1:62448`; temporary SQLite database with one synthetic admin and member; no reports or feedback records.  
**Browser:** Microsoft Edge `154.0.4258.37`, headed, direct Playwright Node API via cached `playwright-core`, fresh persistent profile per browser locale, viewport `1280×800`. Context `locale` was set in turn to `en-US` and `zh-CN`.  
**Tester:** Hermann (User Tester).  
**Source:** HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, shared worktree dirty. Served `/app.js` hash `38304aaf4481d476d0cabd8ecc85876028d5355bee8b620b1f7a775f88b1a1d9` matched current source.

## Browser preflight and isolation

- `/health` returned HTTP 200. Edge rendered the expected app from the same origin as the API. The test fetched `/app.js` and matched its SHA-256 to the current workspace file.
- Playwright reported the requested `navigator.language`/`navigator.languages` for each context (`en-US` and `zh-CN`).
- All data was synthetic and confined to the temporary SQLite service. Native validation prevented empty login and feedback forms; no login or feedback POST was sent for those empty submissions.
- The isolated service, both Edge contexts/profiles, database and sidecar files were stopped/removed. Port 8788 was not touched.

## Reproduction and observations

For each fresh Edge context, the UI initially loaded in English. I submitted an empty login form, authenticated with the synthetic member, and submitted the empty Account feedback form once in English UI and once after toggling to Chinese. I captured the control's `validationMessage`, active control, document language, `navigator.language`, and API POST count.

| Edge context locale | UI `lang` | Form | Native `validationMessage` | Focus | POST sent? |
|---|---|---|---|---|---|
| `en-US` | `en` | Empty login | `请填写此字段。` | Username | No |
| `en-US` | `en` | Empty feedback | `请填写此字段。` | Title | No |
| `en-US` | `zh-CN` | Empty feedback | `请填写此字段。` | Title | No |
| `zh-CN` | `en` | Empty login | `请填写此字段。` | Username | No |
| `zh-CN` | `en` | Empty feedback | `请填写此字段。` | Title | No |
| `zh-CN` | `zh-CN` | Empty feedback | `请填写此字段。` | Title | No |

Thus UX-I18N-02 is reproduced: with the UI in English, Edge exposes a Chinese required-field message; with the UI in Chinese, that string happens to match. Changing Playwright's browser context locale changed `navigator.language`, but did not change the message in this Edge installation. This is evidence that native wording is not following the app's selected language in this environment. It suggests the installed browser/OS localization controls native validation text; that cause is an inference, not proven by this run.

## Recommendation

If acceptance requires the message language to track the UI's English/Chinese selection regardless of Edge or OS language, the app needs explicit localized validation feedback. Native `required` validation alone does not satisfy that contract here. A suitable implementation could prevent the browser's default message and provide translated inline or custom validity text, clearing/updating it as fields change or the UI language toggles. Preserve invalid-field focus and accessible announcement behavior. This investigation is read-only and does not change source or backlog.

Detailed matrix and browser metadata: [results.json](../../output/playwright/ux-i18n-02-validation-locale-20260929/results.json). Screenshots and the direct Playwright harness are in that output directory.

## Scope limits and Git state

This establishes the native-validation mismatch for empty login and feedback fields in this Edge installation, across two emulated browser context locales. It does not measure native screen-reader announcements or compare another physical Edge installation/Windows locale.

Git was read-only checked: branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, existing shared dirty/untracked work preserved. The QA note and generated test artifacts are uncommitted.
