# QA session: AAE signed-out generic login error

**Date:** 2026-09-29 (Asia/Shanghai)  
**Target:** isolated empty AAE service/database on port 58935; health 200  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Viewport:** 390×844  
**Source parity:** app.js `AAE23B6A90DD7DF84354990CF6F9EB4B7D1476C10A019FDC7987E325AD5FB7E2`; styles.css `D761134A7738B6D6620074CC39C516DC0FE6D4B82134D6397514DEA02FE2A380`; matched served/source through completion.

One login attempt using a synthetic nonexistent username and wrong password returned HTTP 401 with the generic localized message `用户名或密码不正确。` in Chinese. Switching language updated it to `Username or password is incorrect.` The username/password remained filled; message used a polite live status and focus stayed on the login button. This avoids account-existence disclosure. No page errors. API requests were limited to auth state and one login attempt; no report/admin requests. DB remained zero users, sessions, and feedback requests.

Screenshot: [Chinese generic login error](../../output/playwright/login-generic-error-aae-20260929/invalid-login-zh-CN.png). Synthetic-only. Disposable service/database/profile removed; port 58935 stopped. No live 8788 access/writes and no source edits. Branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared work remains uncommitted.