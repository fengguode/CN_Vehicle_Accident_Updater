# QA-01-INVALID-FOCUS-01 — corrected multi-field validation and focus pass

## Session record

- **Target:** current `updater-vnext` workspace source through isolated `apps/api/server.js`.
- **Browser:** Microsoft Edge `154.0.4258.37`, headed, direct Playwright Node API using cached `playwright-core`, isolated persistent profile; Node `v24.14.0`.
- **Origin / preflight:** `http://127.0.0.1:59204`; `/health` returned 200; the same origin served expected UI/API; all six UI assets matched workspace hashes in the machine results.
- **Viewports:** 1280×900 and 320×800 CSS px.
- **Data:** synthetic approved member `qa-invalid-focus-member`, empty disposable database; only login occurred. Feedback requests were not submitted to the API.
- **Cleanup:** Edge closed, service stopped, unique temp DB/profile removed; port 8788 untouched. Git HEAD/status was not queried from this subagent sandbox; no Git configuration or application/backlog files were changed.

## Acceptance checks

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| Keyboard submit with Title and Description empty | Both become invalid; first invalid Title receives blue 3px focus ring while title/description borders and alert text stay red | Both controls had `aria-invalid="true"`; Title focused with `:focus-visible`, 3px solid `rgb(33,125,206)` outline; both borders were `rgb(155,52,43)`; both visible inline messages read “Complete this field.” and rendered in red | Pass at both widths |
| Tab from Title to Description | Focus ring moves to Description; both fields remain invalid with their errors | Description became active and `:focus-visible`; both `aria-invalid` states and red borders remained | Pass at both widths |
| Correct Title only | Title's invalid state and its message clear; Description remains invalid with its own message | Title became valid; its `aria-invalid` and `aria-describedby` were removed and its alert span disappeared. Description remained invalid and its alert remained visible | Pass at both widths |
| Accessible field/error relationship | Each invalid field's `aria-describedby` references its currently visible associated error; labels, invalid semantics, and alert role are present | After submit, both references matched the two visible alert IDs. After Tab, both still matched. After Title correction, the remaining Description reference matched its sole visible alert. Every linked node had role `alert`, matching text, and a rendered rectangle; each field had an associated label and `aria-invalid="true"` while invalid | DOM-semantic pass at both widths |
| Clipping/overflow | No horizontal overflow; invalid controls and messages stay in viewport bounds | Document and client widths matched (1265px desktop; 305px mobile); overflow lists were empty and every measured form control/error rectangle stayed within viewport horizontal bounds | Pass at both widths |
| Browser runtime | No page errors | Zero page errors | Pass |

### Accessible relation evidence

The corrected harness reads `el.validity.valid`, which is passive. It does not call `checkValidity()` during inspection. At 1280px, Title and Description referenced visible alert IDs `field-validation-1` and `field-validation-2` both immediately after validation and after Tab. After correcting Title, its invalid/described-by state and message were gone; Description referenced the single remaining visible alert, `field-validation-2`. At 320px the equivalent associations were `field-validation-3`/`-4` at validation/Tab and `-4` alone after correcting Title. Machine results record per-field labels, `aria-invalid`, `aria-describedby` ID references, current visible alert IDs/roles/text/client-rect visibility, and each pass condition.

This is a DOM-semantic check, not a native accessibility-tree or screen-reader test; spoken output remains unverified.

## False-positive harness correction

The preceding initial run appeared to show stale alert IDs because the harness inspection called `el.checkValidity()`. That API dispatches an `invalid` event, and the app's invalid-event handler replaces that field's error node. The harness therefore mutated the UI while comparing the relation. I preserved the initial note, JSON, harness, and screenshots in [`first-run-checkValidity-false-positive`](../../output/playwright/qa01-invalid-focus-20260929/first-run-checkValidity-false-positive/), changed the measurement to passive `el.validity.valid`, and reran against a fresh isolated origin. The corrected run showed the current product keeps the relation intact. The initial finding is withdrawn; it is not a product defect.

## Evidence and environment

- Harness: [`run.mjs`](../../output/playwright/qa01-invalid-focus-20260929/run.mjs)
- Corrected machine results: [`results.json`](../../output/playwright/qa01-invalid-focus-20260929/results.json)
- Screenshots: [Title focused, 1280px](../../output/playwright/qa01-invalid-focus-20260929/invalid-title-focused-1280.png), [Description focused, 1280px](../../output/playwright/qa01-invalid-focus-20260929/invalid-description-focused-1280.png), [Title corrected, 1280px](../../output/playwright/qa01-invalid-focus-20260929/title-corrected-1280.png), [Title focused, 320px](../../output/playwright/qa01-invalid-focus-20260929/invalid-title-focused-320.png), [Description focused, 320px](../../output/playwright/qa01-invalid-focus-20260929/invalid-description-focused-320.png), [Title corrected, 320px](../../output/playwright/qa01-invalid-focus-20260929/title-corrected-320.png).
- Preflight recorded all six served/source asset SHA-256 matches; see `assets` in results.
- `node --check output/playwright/qa01-invalid-focus-20260929/run.mjs` passed. The corrected command `node output/playwright/qa01-invalid-focus-20260929/run.mjs` completed PASS and cleanup succeeded.
- No full application test suite, native zoom, physical device, other locale, forced-colors, or screen-reader test was run.

## Primary integration review

The primary agent independently parsed the corrected `results.json` (`status: PASS`, both 1280 and 320 viewports, all served/source matches true, zero page errors, and all cleanup flags true) and visually inspected the focused-invalid desktop screenshot. Dennis's read-only cascade review confirmed invalid controls retain a red border while keyboard-focused invalid controls receive the 3px blue ring; the corrected DOM check separately confirms error IDs are current and visible. `git diff --check` passed for the CSS/backlog/QA paths, `node --check` passed for the harness, and the project regression suite passed `npm test` (67/67, zero failures). Current `updater-vnext` HEAD is `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; CSS, backlog, and QA/artifacts remain uncommitted among shared changes. No live-service or account changes were made.
