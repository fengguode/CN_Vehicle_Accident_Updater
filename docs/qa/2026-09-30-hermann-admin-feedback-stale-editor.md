# Hermann admin stale feedback editor overwrite — 2026-09-30

## Runtime and scope

- Target: isolated current-source `updater-vnext` service with disposable synthetic admin/member accounts and one feedback request; live port 8788 was untouched.
- Browser: headed Microsoft Edge 154.0.4258.37, viewport 1280×900, two tabs sharing one synthetic admin session.
- All six served UI assets matched workspace source.
- Scenario: open the same request in both tabs, save and reload changes in tab A, then submit tab B's stale editor after changing only its private note.

## Reproduction and result

DEFECT reproduced. Both tabs initially loaded Submitted/normal. Tab A saved Under review/high, a public update, and a private note (PATCH 200). Reloading tab A confirmed all values persisted. Tab B remained open with stale Submitted/normal/empty note values. Changing only its private note and saving returned PATCH 200 with no conflict warning. The stale form reset the request to Submitted/normal and replaced the newer private note; the updated state persisted after reload.

The member then signed in and saw Submitted in the card. Public history contained the first tab's public update twice: once under Under review and again under Submitted. Both private notes remained hidden. Zero page errors. Isolated data/profile were removed and service stopped.

Finding `FEEDBACK-TRIAGE-STALE-EDITOR-01` is open. Admin queue writes need stale-version/conflict protection or an equivalent merge-safe interaction so an older editor cannot silently roll back newer triage fields.

## Evidence

- Runner: `../../output/playwright/admin-feedback-stale-editor-overwrite-20260930/run.mjs`
- Results: `../../output/playwright/admin-feedback-stale-editor-overwrite-20260930/result.json`
- Screenshots: `../../output/playwright/admin-feedback-stale-editor-overwrite-20260930/stale-tab-overwrote-newer-triage.png`, `../../output/playwright/admin-feedback-stale-editor-overwrite-20260930/member-sees-rolled-back-status-history.png`
