# Hermann member feedback double-submit browser check — 2026-09-30

## Session

- Target: isolated current-source API/UI service, synthetic SQLite DB and temporary Edge profile; live 8788 untouched.
- Browser: headed Microsoft Edge 154.0.4258.37, 1280×900.
- Preflight: isolated health 200 and exact six-asset parity (`app.js` SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`, CSS `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`).
- Scenario: synthetic member's first feedback request; browser response held after isolated API had committed 201, then the member double-clicked Submit while response remained pending.

## Result

PASS. Only one POST was sent while response was held. Submit was disabled and the form marked `data-submitting=true`. After releasing the response, one matching card appeared, total feedback cards increased from one to two, and Submit re-enabled. Zero page errors. Disposable service/database/profile removed.

No duplicate feedback defect found for double-click activation.

## Evidence

- Runner: `../output/playwright/member-feedback-double-submit-current-3e477-20260930/run.mjs`
- Results: `../output/playwright/member-feedback-double-submit-current-3e477-20260930/result.json`
- Screenshot: `../output/playwright/member-feedback-double-submit-current-3e477-20260930/double-click-single-submission.png`
