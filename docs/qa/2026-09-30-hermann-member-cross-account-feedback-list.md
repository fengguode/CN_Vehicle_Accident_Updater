# Hermann cross-account member feedback list refresh — 2026-09-30

## Runtime and scope

- Target: isolated current-source `updater-vnext` service with disposable admin and two approved synthetic members; live port 8788 was untouched.
- Browser: headed Microsoft Edge 154.0.4258.37, viewport 1280×900, Playwright Core.
- All six served UI assets matched workspace source.
- Member A submitted a request and logged out. Member B then signed in with `/api/feedback/mine` deliberately held, to inspect cross-account privacy and request behavior.

## Results

PASS for cross-account privacy. While Member B's request list was still loading (`aria-busy=true`), the prior member's feedback card was already cleared and was not visible. After the delayed response was released, Member B saw the correct empty state.

DEFECT reproduced: exactly two concurrent `GET /api/feedback/mine` requests were initiated during Member B's login. The UI discarded the stale earlier result by request ID, so no duplicate card or cross-account disclosure occurred, but one of the two reads is redundant. Finding `FEEDBACK-MY-LIST-DUPLICATE-GET-01` is open for a focused implementation/retest.

Zero page errors; temporary profile/data removed and isolated service stopped.

## Evidence

- Runner: `../../output/playwright/member-feedback-cross-account-stale-list-20260930/run.mjs`
- Results: `../../output/playwright/member-feedback-cross-account-stale-list-20260930/result.json`
- Screenshot: `../../output/playwright/member-feedback-cross-account-stale-list-20260930/second-member-sees-stale-feedback-while-loading.png`

## Delayed previous-account response follow-up

A second isolated run held Member A's own-list GET pending, then signed A out and signed Member B in. While A's request was pending, A's card remained visible to A; the identity change cleared it. B's two login-triggered list GETs returned an empty list. Releasing A's delayed response afterward did not change B's identity, status, or list. This confirms the stale-response guard prevents cross-account data from reappearing. The login duplicate-read finding is unchanged: B still triggered two own-list GETs. See [follow-up runner/results/screenshot](../../output/playwright/member-feedback-stale-response-identity-20260930/).
