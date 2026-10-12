# QA-01 dynamic feedback and non-text contrast pass

## Session record

- **Date:** 2026-09-29 (Asia/Shanghai)
- **Variant / source:** `updater-vnext`; served `apps/web/app.js` SHA-256 `a4ef417072e185bf8871c3f205aaad72ee348d259f163531a9e386bf74f9e794`, equal to current workspace source
- **Target:** disposable service `http://127.0.0.1:62569`, new synthetic SQLite DB; health endpoint 200, UI and API same-origin
- **Browser:** Microsoft Edge 154.0.4258.37, headed, direct Playwright Node API using cached `playwright-core`; isolated persistent profile in OS temp
- **Viewport:** 390×844 CSS pixels
- **Command:** from `updater-vnext`: `node output/playwright/qa01-dynamic-contrast-20260929/run.mjs`
- **Data:** synthetic approved member and admin; two synthetic feedback requests; one injected 503; no production or live data
- **Safety / cleanup:** port 8788 untouched. Harness closed Edge and service and removed profile, database, and temp directory.

## Acceptance coverage and results

| Area | Result |
|---|---|
| Signed-in member validation | Empty feedback showed custom localized validation, `aria-invalid`, visible alerts and focused title in English and Chinese. No invalid request was submitted. |
| Interrupted submission and recovery | A synthetic 503 kept the entered title and description, displayed the error, re-enabled Submit, and placed focus on enabled Submit with a visible 3px focus outline in both languages. Retrying submitted once and created the own-list card with submitted status. |
| Admin feedback queue | Admin could see both synthetic requests, status/type filters, triage controls, and localized public status updates; member subsequently saw the updates. No page errors occurred. |
| Responsive layout | At 390×844, feedback form/list and admin queue had no measured horizontal or nested overflow. |
| Non-text control contrast | **Finding:** resting control boundaries are below 3:1 against the white control surface: form inputs/selects/textareas `#cbd8d0` measured 1.47:1; quiet buttons `#dce5df` measured 1.29:1. This affected Login password, member feedback fields/Refresh, and admin queue filters/triage controls. The sampled invalid-field red outline was 7.19:1 and primary button text 6.45:1. |

### Finding QA-01-NON-TEXT-01 (initial scan, before fix)

- **Initial disposition:** new; primary review/triage required. The following post-fix Edge regression verifies and closes this sampled finding.
- **Severity:** P2 accessibility gap; resting control boundaries are the sole visual edge on white surfaces, and sampled contrast is under the 3:1 non-text contrast threshold in WCAG 2.2 SC 1.4.11.
- **Reproduction:** open Account or Feedback triage at 390×844 and inspect an unfocused field/select/textarea or quiet button. The exact selectors and computed colors/ratios are in the results JSON. The 1px field border is set in `apps/web/styles.css` around line 48; quiet-button border comes from `var(--line)` around line 23.
- **Expected:** necessary visual information identifying the control boundary contrasts at least 3:1 against adjacent colors.
- **Actual:** measured 1.47:1 and 1.29:1, respectively.
- **Initial disposition:** User Tester did not change application source or backlog status. Primary added the finding to the canonical backlog, obtained design/reviewer input, applied the fix, and recorded the post-fix regression below.

The first harness attempt read the feedback invalid focus before the browser's animation-frame focus update, so its initial focus observation was false. The bounded rerun waited for the first-invalid-field focus before recording; it passed. The contrast sampler was also corrected to compare against the nearest opaque rendered surface instead of treating transparent computed backgrounds as black.

## Evidence

- [Machine results](../../output/playwright/qa01-dynamic-contrast-20260929/results.json)
- [Repro harness](../../output/playwright/qa01-dynamic-contrast-20260929/run.mjs)
- [Login validation](../../output/playwright/qa01-dynamic-contrast-20260929/login-validation.png)
- [English submission error and recovery](../../output/playwright/qa01-dynamic-contrast-20260929/en-error-retry-390x844.png)
- [English submitted request](../../output/playwright/qa01-dynamic-contrast-20260929/en-submitted-list-390x844.png)
- [Admin triage queue](../../output/playwright/qa01-dynamic-contrast-20260929/admin-updated-queue-390x844.png)

## Post-fix contrast regression (2026-09-29)

The primary changed `--control-border` and applied it to fields, quiet buttons, and navigation/hover boundaries. A fresh isolated headed Edge 154 run verified that the served JavaScript **and stylesheet** both matched the current source exactly. Results are recorded in [post-fix results](../../output/playwright/qa01-control-contrast-postfix-20260929/results.json), the reproducible [post-fix harness](../../output/playwright/qa01-control-contrast-postfix-20260929/run.mjs), and screenshots in that directory.

- **Target:** disposable same-source service `http://127.0.0.1:62046`; health 200; synthetic member/admin and feedback only. Port 8788 untouched; service, database and Edge profile removed after the run.
- **Browser / automation / viewport:** Microsoft Edge 154.0.4258.37, headed, direct Playwright Node API, isolated persistent profile, `390×844`.
- **Served source hashes:** `apps/web/app.js` SHA-256 `a4ef417072e185bf8871c3f205aaad72ee348d259f163531a9e386bf74f9e794`; `apps/web/styles.css` SHA-256 `9fc657c3bcb35626d84d012ca43a9142f84a44155755f33cf48a0f6e1a4b9d4e`. Both matched workspace source.
- **Resting and hover boundaries:** field, select, textarea and quiet-button `#73877b` border measured **3.83:1 against white** and **3.40:1 against soft green**. Selected/hover navigation border measured 3.40:1 against its soft-green fill and 3.55:1 against page surface. Quiet-button hover also passed against both adjacent colors. Admin triage primary-button hover fill/border measured **8.65:1** against its card surface.
- **Keyboard focus:** keyboard-focused Login mode and Submit restored after synthetic 503 each showed a 3px focus ring at **4.30:1** against white; both remained visibly focused. Feedback error still preserved the draft and re-enabled Submit; retry success and own-list status worked in English and Chinese.
- **Responsive/runtime:** member feedback and specifically measured admin queue/card/triage panel geometry had no horizontal or nested overflow. No page errors.
- **Result:** the previous measured contrast defect passed this sampled post-fix regression. QA-01-NON-TEXT-01 can be marked verified for these controls/states after the primary updates the canonical backlog. This focused sample does not imply site-wide contrast certification.

The initial post-fix harness attempt stopped on a test-harness array-await mistake before testing product behavior; the assertion was corrected and the full isolated run passed. A later rerun added explicit admin panel geometry checks. The final results artifact represents the successful run.

## Limits

This pass covered one mobile viewport, the listed control families and synthetic member/admin feedback. It did not test native screen readers, physical devices, 200% zoom, forced-colors mode, or every application control. The overall QA-01 accessibility gate remains open.
