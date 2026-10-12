# QA finding: duplicate username exposes raw database error in Chinese registration

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** isolated disposable AAE service/database on port 58940, seeded with one synthetic admin and one unused invitation  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Viewport:** 390×844  
**Source parity:** served/source app.js `AAE23B6A90DD7DF84354990CF6F9EB4B7D1476C10A019FDC7987E325AD5FB7E2`; styles.css `D761134A7738B6D6620074CC39C516DC0FE6D4B82134D6397514DEA02FE2A380`; matched before/after.

With a valid synthetic invitation, Chinese registration using the existing synthetic admin username returned HTTP 400 and displayed raw English SQLite text: `UNIQUE constraint failed: users.username.` The error appeared in a `role="status"` / `aria-live="polite"` region; username/password/invitation remained populated and focus returned to Submit. DB still contained only the original synthetic admin, no new session, and invitation remained unused. No page errors.

This is UX-REG-04, distinct from the invalid-invitation localization mismatch (UX-REG-03): it leaks database implementation detail instead of a clear localized duplicate-username message. Screenshot: [Chinese duplicate-registration error](../../output/playwright/registration-duplicate-username-aae-20260929/duplicate-registration-error-zh-CN.png).

Synthetic data only; DB/profile removed and port 58940 stopped. No live 8788 access/writes or source edits. Branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared work remains uncommitted.

## Independent review

Dennis confirmed the unique constraint (UNIQUE COLLATE NOCASE), registration transaction ordering, raw API error serialization, and browser catch behavior. Duplicate insert rolls back before invite consumption/session creation. P2 and acceptance are reasonable: return clear localized duplicate-name feedback without SQLite/table/column details; use a generic fallback for unexpected DB errors; retain fields, polite announcement and submit focus; verify no account/session/invite mutation. No code change was made in this testing task.


## English baseline

A fresh isolated AAE run used the same duplicate username with a valid synthetic invitation in English mode. Registration again returned HTTP 400 and exposed raw UNIQUE constraint failed: users.username. Username/password/invite remained filled; message stayed in polite status and focus returned to submit. DB still had only the synthetic admin, invite unused, and no session. No page errors. Served/source AAE/D761 hashes matched before/after; DB/profile removed, port 58941 stopped, and live 8788 was untouched. Screenshot: [English duplicate-name error](../../output/playwright/registration-duplicate-username-en-aae-20260929/duplicate-registration-error-en.png).
