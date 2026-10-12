# QA session: AAE invalid invitation error localization and recovery

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** isolated disposable AAE service/database on port 58930, synthetic admin only before attempts; health 200  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Viewport:** 390×844  
**Source parity:** app.js SHA-256 `AAE23B6A90DD7DF84354990CF6F9EB4B7D1476C10A019FDC7987E325AD5FB7E2`; styles.css `B6071808AF773A20C03ACE8F5D5BE34C00A564CCE32705A28DA9F112D3E0EC8D`; matched before/after.

## Reproduction and recovery

- In Chinese registration, submitting synthetic username/password with an invalid synthetic invitation returned POST `/api/auth/register` 400 but displayed English `Invitation code is invalid, expired, or already used.` in `#account-message`.
- Username, password and invitation values remained populated; help remained visible; focus returned to `创建账户` with a visible blue 3px ring.
- Read-only DB inspection after the failed request showed only the seeded admin (`users=1`); invitation remained unused and no member was created.
- Replacing only the invitation field with a valid synthetic code returned 201. DB then showed `qainvalid` as a member with `approved=0`; Chinese UI showed `当前用户: qainvalid · 成员 · 数据库权限：待批准`, Reports gate visible, Admin/Feedback hidden.
- No page errors. One harness predicate timed out because it expected English “pending” in Chinese status; corrected rendered and DB checks completed successfully.

This confirms UX-REG-03, separate from localized client-side required-field validation under UX-I18N-02. Screenshots: [invalid invitation English error in Chinese mode](../../output/playwright/invalid-invite-aae-20260929/invalid-invite-chinese-error-390x844.png), [valid-code pending recovery](../../output/playwright/invalid-invite-aae-20260929/valid-invite-pending-chinese-390x844.png).

Synthetic data only. No live 8788 credentials or writes. Disposable DB/profile/scripts removed; port 58930 has no listener. No source edits. Workspace has shared uncommitted changes; branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; no commit/push.

## Independent review

Dennis independently confirmed the source path: the API returns an English invitation error and the web client displays it verbatim in Chinese mode. Recommended acceptance is a stable error code mapped to selected-language copy, preserving field values/focus and no-account creation for rejected invites. No additional concern. No source change was made in this testing task.
