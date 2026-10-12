# QA session: AAE approved-member Feature submission

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** isolated service/database on port 58928 with synthetic approved member/admin; health 200  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Viewport:** 390×844  
**Source parity:** app.js SHA-256 `AAE23B6A90DD7DF84354990CF6F9EB4B7D1476C10A019FDC7987E325AD5FB7E2`; styles.css `B6071808AF773A20C03ACE8F5D5BE34C00A564CCE32705A28DA9F112D3E0EC8D`; matched source/served before and after.

## Results

- Synthetic approved normal member submitted a Feature (POST 201) and saw one own-list card with Submitted status.
- Member admin/Feedback navigation remained hidden.
- Synthetic admin opened the queue and saw the same request still Submitted; no triage or status change occurred.
- Corrected browser run had no page errors. An initial harness attempt hit an unbound username predicate before login and submitted nothing; corrected on the same fixture.

Screenshots: [member Feature](../../output/playwright/member-feature-aae-20260929/member-feature-own-list-390x844.png), [member own list](../../output/playwright/member-feature-aae-20260929/member-feature-own-list-390x844.png), [admin queue](../../output/playwright/member-feature-aae-20260929/admin-queue-feature-submitted-390x844.png).

Synthetic data only. No live 8788 writes. Profiles/database/scripts removed; port 58928 has no listener. No source edits. Workspace has shared uncommitted changes; branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; no commit/push.