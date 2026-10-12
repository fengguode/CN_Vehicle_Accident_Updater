# Hermann populated member Report responsive details QA — 2026-09-29

## Environment

Current-source isolated service and synthetic approved member with two fictional report rows. All six served UI assets matched source (app.js `314bb82b…`, CSS `8550ae76…`). Headed Microsoft Edge 154, 390×844 initial viewport; resized in browser to 320×844, 390×844, and 1280×844. Live 8788 health was 200 and no authenticated live requests/writes were sent.

## Results

- The alpha report's details disclosure remained open at all three widths.
- The source link was in `.report-card-body` at 320/390px and in `.report-details` at 1280px, consistent with the responsive layout.
- Document/body scroll widths matched their client widths at all widths; no horizontal overflow. Search, province filter, vote change, and vote undo also passed on the same isolated fixture. Zero page errors; isolated DB ended with no vote rows; service, DB, and profile removed.
- During harness development, one first measurement sampled the first (beta) card instead of the opened alpha card. It was discarded; the harness was corrected to identify alpha by title and assert disclosure state, then the recorded final run passed.

No responsive Report detail defect found. See [runner, final structured result and screenshots](../../output/playwright/member-report-responsive-current-20260929/). Live 8788 remained untouched.

Repository: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. QA/backlog/artifacts remain uncommitted in existing shared changes; no source edit, commit, or push.
