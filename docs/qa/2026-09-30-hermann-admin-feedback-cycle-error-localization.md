# Hermann duplicate-cycle triage error localization — 2026-09-30

## Runtime and scope

- Target: isolated current-source `updater-vnext` service with disposable synthetic admin/member and two feedback requests; live port 8788 was untouched.
- Browser: headed Microsoft Edge 154.0.4258.37, viewport 1280×900, Playwright Core.
- All six served UI assets matched the current workspace files.
- Scope: create one valid Duplicate link, attempt its reverse, and inspect the administrator-facing error under the Chinese locale.

## Reproduction and result

PASS for cycle prevention; DEFECT reproduced for localization. Admin linked the synthetic candidate to the primary request; PATCH returned 200 and the candidate appeared as Duplicate. After switching the admin interface to zh-CN, the admin attempted the reverse link. PATCH returned 400; the existing primary request remained Submitted and the candidate remained Duplicate. The editor retained the attempted duplicate ID and remained enabled, but its status region showed raw English: “Duplicate links cannot form a cycle.”

This extends existing finding `FEEDBACK-I18N-TRIAGE-01`; the finding remains open pending localized server-error mapping and regression. Zero page errors. Disposable service/data/profile were removed.

## Evidence

- Runner: `../../output/playwright/admin-feedback-duplicate-cycle-localization-20260930/run.mjs`
- Results: `../../output/playwright/admin-feedback-duplicate-cycle-localization-20260930/result.json`
- Screenshot: `../../output/playwright/admin-feedback-duplicate-cycle-localization-20260930/duplicate-cycle-rejected-zh.png`
