# QA-01 independent current-source feedback queue and filter regression

- **Target/build:** isolated ephemeral service `http://127.0.0.1:54123`, entrypoint `apps/api/server.js`, disposable SQLite DB seeded with synthetic admin and six feedback requests. Port 8788 untouched.
- **Bundle parity:** eight served assets returned 200 and matched current source byte-for-byte. app.js SHA-256 `33b0e8369c90a7042f4f8ec638f4ca93f6760c772e145c0be7bd5c0f75d35713`.
- **Browser:** Microsoft Edge 154.0.4258.37, headed Playwright Core, 1280×900, unique temporary browser profile. Same-origin UI and APIs, zero page exceptions and console errors.
- **PASS — held GET timeout/retry:** held first admin queue GET. At the 8-second timeout, UI showed “The feedback queue took too long to load. Try again”, retry button visible, and `aria-busy=false`. Clicked retry after releasing the held response; recovered to six cards with status “Feedback queue updated: 6.”
- **PASS — keyboard Status/Type filters:** keyboard ArrowDown/Enter on Status retained focus on `#feedback-filter-status`, visible focus indicator true, and polite status announcement “Feedback queue updated: 6.” Type retained focus on `#feedback-filter-type`, focus indicator true, and announced 3 results. Both were role=status / aria-live=polite.
- **PASS — stale response ordering:** held older Status=Submitted response, then applied Type=Feature. The newer three Feature cards rendered first. After releasing the old response, the UI remained at three Feature cards with both filters selected; stale six-card response did not overwrite current results.
- **Cleanup:** ephemeral service stopped; health check failed after stop as expected; DB and profile removed; port 8788 untouched. No app source or backlog edits.
- **Evidence:** [structured results](../../output/playwright/hermann-current-queue-focus-20260930/results.json); timeout/retry, status filter, and type filter screenshots in the same folder.
