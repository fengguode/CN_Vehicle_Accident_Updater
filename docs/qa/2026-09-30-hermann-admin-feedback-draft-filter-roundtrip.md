# Hermann admin triage draft filter round trip — 2026-09-30

## Session

- Target: isolated current-source service, disposable SQLite DB and Edge profile; live 8788 untouched.
- Browser: headed Microsoft Edge 154.0.4258.37, 1280×900.
- Preflight: health 200 and exact parity for six served assets (`app.js` `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`, CSS `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`).
- Fixture: one synthetic Issue and one synthetic Feature request.

## Result

PASS. On the Feature request, admin changed status/priority and entered unsaved public/private notes. Filtering to Issue removed the Feature card and showed only the Issue. Returning to Feature restored the same request with all four triage values intact. Zero page errors; disposable service, DB and profile removed.

No draft loss or cross-request draft leak found.

## Evidence

- Runner: `../output/playwright/admin-feedback-draft-filter-roundtrip-current-3e477-20260930/run.mjs`
- Results: `../output/playwright/admin-feedback-draft-filter-roundtrip-current-3e477-20260930/results.json`
- Screenshot: `../output/playwright/admin-feedback-draft-filter-roundtrip-current-3e477-20260930/feature-draft-restored-after-filter.png`
