# Hermann cross-account unsent feedback draft disclosure — 2026-09-30

## Runtime and scope

- Target: isolated current-source `updater-vnext` service with two disposable approved synthetic members; live port 8788 was untouched.
- Browser: headed Microsoft Edge 154.0.4258.37, viewport 1280×900, Playwright Core.
- All six served UI assets matched workspace source.
- Member A entered an unsent Feature title, description and context, logged out, and Member B signed in in the same browser profile.

## Reproduction and result

DEFECT reproduced. Member A had zero submitted requests. Logout hid Account actions, but left the draft values in the form DOM. When Member B signed in, Account actions and the feedback form became visible with Member A's exact title, description and context. No request was sent. Zero page errors; disposable profile/data removed and isolated service stopped.

Finding `FEEDBACK-PRIVACY-DRAFT-01` is open. Clear unsent feedback contents when a different account becomes active while preserving any intended same-account recovery behavior.

## Evidence

- Runner: `../../output/playwright/member-feedback-unsent-draft-cross-account-20260930/run.mjs`
- Results: `../../output/playwright/member-feedback-unsent-draft-cross-account-20260930/result.json`
- Screenshot: `../../output/playwright/member-feedback-unsent-draft-cross-account-20260930/member-b-sees-member-a-unsent-draft.png`

## Same-account recovery control

A follow-up signed Member A back into the same browser after logout; the exact unsent title, description, and context were restored, which confirms same-account draft recovery currently works. After a second logout, Member B signed in and saw the same values. This finding therefore requires clearing across different identities without discarding intended recovery for the original identity. See [follow-up runner/results/screenshot](../../output/playwright/member-feedback-draft-identity-control-20260930/).
