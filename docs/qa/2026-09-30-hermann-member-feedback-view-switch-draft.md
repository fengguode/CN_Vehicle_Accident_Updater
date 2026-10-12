# Hermann member feedback draft across view navigation — 2026-09-30

## Runtime and scope

- Target: isolated current-source `updater-vnext` service with synthetic approved member/admin and disposable SQLite data. Live port 8788 was untouched.
- Browser: headed Microsoft Edge 154.0.4258.37, viewport 1280×900, Playwright Core.
- All six served UI assets matched the workspace source.
- Checked draft persistence across Reports/Account navigation, then submission and continuation into administrator triage/member-visible update.

## Results

PASS. Member entered Issue title, description and context, navigated from Account to Reports and back, and found all three fields unchanged. Submission returned 201 and appeared exactly once in the member list. A subsequent delayed double-click case also returned only one POST. Admin queue showed submitter attribution; admin changed the request to Under review with a public update and private note. After the member logged in again, the status/public update appeared and the private note remained hidden. Markup-like user content stayed literal text with no injected DOM nodes or script execution. Zero page errors. Disposable data/profile were removed and isolated service stopped.

No defect found.

## Evidence

- Runner: `../../output/playwright/member-feedback-view-switch-draft-20260930/run.mjs`
- Results: `../../output/playwright/member-feedback-view-switch-draft-20260930/result.json`
- Screenshot: `../../output/playwright/member-feedback-view-switch-draft-20260930/member-feedback-draft-after-view-return.png`
