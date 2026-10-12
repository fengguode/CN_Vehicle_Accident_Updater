# Hermann approved-member populated Reports browser QA — 2026-09-29

## Runtime and data

The `updater-vnext` live service at 8788 returned health 200. After the isolated browser run, its served `app.js` SHA-256 matched current workspace (`314bb82b1ff9306e457f092c17ac8cc6f2735482fb597bc64714bd8243e3e714`). No authenticated live requests or writes were made. Authenticated member testing used a fresh isolated Node API service, disposable SQLite database, one synthetic approved member and two fictional report rows. All six UI assets served by the isolated service exactly matched source. Browser: headed Microsoft Edge 154, Playwright, 390×844, disposable profile.

## Results

- Approved member signed in and saw both fictional reports (one unverified lead and one verified) with the expected title, source label and province.
- Search for the alpha report returned exactly that one card; clearing search restored both.
- Province filter `Example Province` returned exactly the alpha report; clearing restored both.
- Member rated the alpha report relevant; the button became pressed and the UI showed the member vote. Changing to not relevant updated the pressed state/current vote. Undo removed the member-vote UI.
- Isolated database contained zero `traffic_votes` rows after undo. No page errors.
- Isolated service was stopped; health no longer responded; synthetic DB/profile removed. Port 8788 stayed healthy and untouched.

Pass; no member Reports search/filter/vote defect found in this current-source run. This did not test writes against the live database. See [runner, result, and screenshot](../../output/playwright/member-reports-search-vote-current-20260929/).

Repository: `updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`, ahead 18. QA/backlog/artifacts are uncommitted among existing shared changes; no source edit, commit, or push.
