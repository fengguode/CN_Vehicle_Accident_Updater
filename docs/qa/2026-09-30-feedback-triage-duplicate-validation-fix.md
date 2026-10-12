# FEEDBACK-TRIAGE-DUPLICATE-VALIDATION-01 — implementation QA — 2026-09-30

## Result

**Complete.** Primary implementation, isolated browser acceptance, Dennis's independent source review, and Hermann's independent User Tester sign-off all passed. Mobile-width and keyboard-only acceptance remain outside this focused item and are not claimed here.

## Change

- Selecting Duplicate marks the primary request ID input required and gives it a locale-specific custom validity message.
- Submitting without the ID sends no PATCH, announces the localized explanation in the editor's live status, and focuses the reference input. Filling the ID clears that validation state.
- Other statuses leave the reference optional; the non-Duplicate Under review control was verified with an empty reference and saved successfully.

## Verification

- `node --check apps/web/app.js` passed.
- Full `npm test` passed: 82/82, zero failures.
- Headed Microsoft Edge 154.0.4258.37, 1280×900 CSS px, against current-source isolated service on ephemeral port 56490 with a disposable SQLite DB and browser profile.
- All eight served UI/helper assets byte-matched source: `index.html`, `app.js`, `styles.css`, `navigation.js`, `report-presentation.js`, `viewport.js`, `feedback-drafts.js`, and `feedback-triage.js`.
- In zh-CN and English, choosing Duplicate with no primary ID marked the field required and invalid, showed the matching localized message, focused `duplicate_of`, and sent zero PATCH requests. Supplying the primary ID saved with HTTP 200 and one PATCH. A separate Submitted request changed to Under review with an empty optional duplicate ID and saved with HTTP 200.
- The member-facing Duplicate status/public explanation remained intact; the pre-existing missing linked-request identity is separately tracked by `FEEDBACK-DUPLICATE-LINK-01`.
- Zero page errors. The isolated service stopped and synthetic database/profile were removed. Live 8788 was untouched.
- An initial adapted-runner attempt failed on a stale expectation from the original defect-reproduction harness (it expected a 400 PATCH). The corrected runner records zero PATCHes for invalid input and then passed; no product defect remained from that harness mismatch.
- Dennis's first review found that an invalid Duplicate warning stayed visible if the administrator changed status to Under review. The client now clears only that duplicate-specific warning when Duplicate is no longer selected. The final headed Edge rerun on port 63788 verified the warning and custom validity cleared (`required=false`, valid input, empty live status, no validation marker), then verified the field could become required again and valid Duplicate/Under review saves each returned HTTP 200. zh-CN and English invalid submissions still focused the field and sent zero PATCHes. `npm test` passed 82/82 after this change; `node --check` and `git diff --check` passed.
- Dennis's final independent source review closed his finding and found no additional regression.

## Hermann User Tester acceptance

Hermann independently passed the same current-source acceptance on a fresh isolated service at `http://127.0.0.1:64277`, using synthetic admin/member data and headed Edge 154.0.4258.37 at 1280×900. All eight served assets byte-matched source, including the same `app.js` hash above. In English and zh-CN, blank Duplicate references were required, showed the localized live-region message, focused the field, and sent zero PATCH requests. Switching to Under review cleared the message and custom validity; returning to Duplicate restored the requirement. Correcting the ID saved with one PATCH/HTTP 200; the non-Duplicate control also saved with a blank optional ID/HTTP 200. Zero page errors; isolated service, DB and profile were removed; port 8788 untouched.

The independent tester's result and screenshots are preserved in [Hermann's acceptance artifacts](../output/playwright/hermann-duplicate-validation-acceptance-20260930/). Mobile-width and keyboard-only behavior were not part of this focused acceptance.

## Evidence and Git state

- Runner, result and screenshots: [browser artifacts](../output/playwright/admin-feedback-duplicate-validation-fix-20260930/).
- Current `app.js` SHA-256 after the final reviewed fix: `EB42A33FD9F6CE1B2D22ED7A26E8B66D70085E080FF9AA25A828270EDA9F0850`.
- Target: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. Source, runner, results, screenshots, QA and backlog remain uncommitted among existing shared changes; no commit or push.
