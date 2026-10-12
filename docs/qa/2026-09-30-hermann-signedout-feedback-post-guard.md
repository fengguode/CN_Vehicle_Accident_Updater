# Hermann signed-out feedback POST boundary — 2026-09-30

## Runtime and scope

- Target: isolated current-source `updater-vnext` service with disposable database; headed Microsoft Edge 154.0.4258.37 at 1280×900.
- Live port 8788 was untouched. All six served UI assets matched workspace source.
- Scope: signed-out Account UI plus direct feedback creation and protected-list requests.

## Results

PASS. Signed-out Account displayed the authentication form while the feedback form and administrator Feedback navigation remained hidden. A direct valid-shaped `POST /api/feedback` without a session returned HTTP 401 `authentication_required`; `/api/feedback/mine` and `/api/admin/feedback` also returned 401. A direct database count after the attempt showed zero feedback requests. Zero page errors; temporary profile/data removed and isolated service stopped.

No defect found.

## Evidence

- Runner: `../../output/playwright/signedout-feedback-post-guard-20260930/run.mjs`
- Results: `../../output/playwright/signedout-feedback-post-guard-20260930/result.json`
- Screenshot: `../../output/playwright/signedout-feedback-post-guard-20260930/signedout-feedback-gated.png`
