# Superseded initial QA-01-INVALID-FOCUS-01 observation

This initial report described an apparent stale `aria-describedby` association. It was a **false positive caused by the first harness**: its `inspect()` function called `el.checkValidity()`, which dispatches `invalid` and invokes the app's invalid handler, replacing alert nodes while the harness was collecting IDs. The corrected passive inspection and authoritative rerun are recorded in [`2026-09-29-qa01-invalid-focus-corrected.md`](2026-09-29-qa01-invalid-focus-corrected.md). Do not treat the finding below as a product defect.

# Initial multi-field validation/focus investigation (superseded)

## Session record

- **Target:** current `updater-vnext` source via an isolated `apps/api/server.js` instance.
- **Browser:** headed Microsoft Edge `154.0.4258.37`, direct Playwright Node API using cached `playwright-core`, isolated persistent profile; Node `v24.14.0`.
- **Origin / preflight:** `http://127.0.0.1:50651`; `/health` returned 200; UI and API were same-origin; all six served web assets matched workspace hashes recorded in `results.json`.
- **Viewports:** `1280×900` and `320×800` CSS px.
- **Data:** a synthetic approved member and empty disposable database; only authentication occurred; the feedback form was not submitted to the API and no real data was used.
- **Cleanup:** Edge closed, isolated service stopped, unique temp DB/profile directory removed; port 8788 untouched.

## Acceptance scenarios and results

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| Press Enter on the empty feedback form | Title and description become invalid; first invalid field receives keyboard focus with a blue 3px focus ring; invalid border and error remain red/visible | Both controls had `aria-invalid="true"`, red `#9b342b` border, visible “Complete this field.” alert text; Title received focus with blue `#217dce` 3px solid outline | Visual/functional pass at both widths |
| Tab from title to description | Focus ring moves to Description while both invalid borders/errors remain | Description received `:focus-visible`; both fields remained invalid and red; errors persisted | Pass at both widths |
| Correct Title only | Title's invalid cue/error clears; Description remains invalid with its error | Title became valid, removed `aria-invalid`, `aria-describedby`, and its visible error; Description remained invalid with red border and visible error | Visual/functional pass at both widths |
| Error accessibility relationship | Each invalid field's `aria-describedby` names the visible associated error; the error uses alert semantics | Both fields had labels, `aria-invalid`, and `aria-describedby`; referenced nodes resolved to `role="alert"` elements with the correct text, but the ID references did **not** match the visible alert span IDs and the referenced nodes had no rendered client rects | **Fail — reproducible accessibility association mismatch** |
| Responsive/error geometry | No horizontal overflow or clipped validation field/message at 1280 and 320px | document/client widths matched (`1265/1265` desktop; `305/305` mobile); measured control/error rectangles remained inside the viewport; no selector overflow | Pass |
| Runtime | No browser page errors | None recorded | Pass |

## Finding: QA-01-INVALID-FOCUS-01 — `aria-describedby` points away from the visible validation alert

- **Severity:** P2 accessibility issue in the invalid-form recovery flow.
- **Prerequisites:** synthetic approved member signed in to a fresh isolated service; empty issue/feature feedback form.
- **Reproduction:** at either 1280×900 or 320×800, focus Submit and press Enter. Inspect the `title` and `description` controls' `aria-describedby`, then compare the referenced IDs with the IDs of the visible `.field-validation-error` spans. Press Tab, compare again, then fill Title with `Valid title now` and compare Description's relation to the remaining visible error.
- **Expected:** every invalid field's `aria-describedby` references its current, visible inline error element, whose `role="alert"` provides the alert semantics.
- **Actual:** references point to prior non-rendered error nodes; different currently visible error spans carry the inline messages. At 1280: initially Title/Description reference `field-validation-1`/`field-validation-2`, while visible spans are `field-validation-3`/`field-validation-4`; after Tab, references are `-3`/`-4` while visible spans are `-5`/`-6`; after correcting Title, Description references `-6` while the visible remaining span is `-7`. At 320 the same pattern repeats with IDs `-8`/`-9` vs visible `-10`/`-11`, then references `-10`/`-11` vs visible `-12`/`-13`, then remaining reference `-13` vs visible `-14`.
- **Evidence:** machine data in [`results.json`](../../output/playwright/qa01-invalid-focus-20260929/results.json), particularly each viewport's `initial`, `tabbed`, `corrected` control relation arrays and `formErrors`; screenshots below show the visible red messages and focus rings. `errorVisible` is false for the ID-resolved `aria-describedby` nodes, while the separately enumerated current form alert spans are visible.
- **Impact:** keyboard users can see the inline message, but the invalid field's description relation targets a different, non-rendered alert node. A screen reader may not announce the visible error as the field's description. No screen-reader device/AT was used, so actual spoken output remains unverified.
- **Disposition:** reproducible current-source finding for primary/architect review; no application source or backlog file was changed by this tester.

## Evidence and checks

- Harness: [`run.mjs`](../../output/playwright/qa01-invalid-focus-20260929/run.mjs)
- Machine results: [`results.json`](../../output/playwright/qa01-invalid-focus-20260929/results.json)
- Screenshots: [title focused, desktop](../../output/playwright/qa01-invalid-focus-20260929/invalid-title-focused-1280.png), [description focused, desktop](../../output/playwright/qa01-invalid-focus-20260929/invalid-description-focused-1280.png), [title corrected, desktop](../../output/playwright/qa01-invalid-focus-20260929/title-corrected-1280.png), [title focused, 320px](../../output/playwright/qa01-invalid-focus-20260929/invalid-title-focused-320.png), [description focused, 320px](../../output/playwright/qa01-invalid-focus-20260929/invalid-description-focused-320.png), [title corrected, 320px](../../output/playwright/qa01-invalid-focus-20260929/title-corrected-320.png).
- Commands: `node --check output/playwright/qa01-invalid-focus-20260929/run.mjs` passed; `node output/playwright/qa01-invalid-focus-20260929/run.mjs` completed the browser path and cleanup with no setup failure.
- Limitations: DOM semantics were inspected through labels, `aria-invalid`, `aria-describedby`, and `role="alert"`; this is not a native accessibility-tree or screen-reader acceptance test. No other locales, physical devices, or zoom modes were tested.
