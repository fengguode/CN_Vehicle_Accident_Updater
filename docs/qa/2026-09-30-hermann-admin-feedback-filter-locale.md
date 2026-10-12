# Hermann admin feedback filter locale preservation — 2026-09-30

## Session

- Target: isolated current-source API/UI with disposable DB and Edge profile; live 8788 untouched.
- Browser: headed Microsoft Edge 154.0.4258.37 at 1280×900.
- Preflight: isolated health 200 and exact parity for all six UI assets (`app.js` `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`, CSS `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`).
- Fixture: one synthetic Issue and one synthetic Feature request, both Submitted.

## Result

PASS. With Status=Submitted and Type=Feature, the admin queue showed exactly the Feature request. Switching to Chinese preserved both filter values, translated selected labels to “已提交” and “功能建议,” and reloaded the same single request. Switching back to English and clearing the filters restored the queue. Zero page errors; isolated DB, service and profile removed.

No locale/filter-state defect found.

## Evidence

- Runner: `../output/playwright/admin-feedback-filter-locale-current-3e477-20260930/run.mjs`
- Results: `../output/playwright/admin-feedback-filter-locale-current-3e477-20260930/results.json`
- Screenshot: `../output/playwright/admin-feedback-filter-locale-current-3e477-20260930/filters-preserved-after-zh-toggle.png`
