# Hermann member feedback rate-limit browser recovery — 2026-09-30

## Session

- Target: isolated current-source service, ephemeral localhost, disposable SQLite database and Edge profile; live 8788 untouched.
- Browser: headed Microsoft Edge 154.0.4258.37, 390×844.
- Preflight: health 200, all six served UI assets exactly matched current source (`app.js` SHA-256 `3e47741844e6329e6a089b553ccafa8a5144c7b8cda1c1ee6970757ba6367450`; `styles.css` `a8b4940018d81333226db42bf7507c57af51b6cdc1e120ced4fb660a36e06423`).
- Fixture: approved synthetic member with ten existing requests within the rolling hour.

## Result

PASS. The member's eleventh Feature submission returned HTTP 429 with “Submission limit reached. Try again later.” The message used the polite status region without success styling; all submitted fields remained intact; Submit was enabled and focused; the existing ten-item list remained available with `aria-busy=false`. Zero page errors; the expected 429 was the only HTTP-error console message. Disposable service/database/profile removed.

No defect found in rate-limit recovery.

## Evidence

- Runner: `../output/playwright/member-feedback-rate-limit-2026-09-30/run.mjs`
- Results: `../output/playwright/member-feedback-rate-limit-2026-09-30/results.json`
- Screenshot: `../output/playwright/member-feedback-rate-limit-2026-09-30/member-limit-error-retained-draft.png`
