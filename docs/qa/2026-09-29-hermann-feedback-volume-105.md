# Hermann FEEDBACK-UX-01 volume and pagination browser QA

**Date:** 2026-09-29 (Asia/Shanghai)
**Target:** isolated latest-source service `http://127.0.0.1:59441/`; no live 8788 requests/writes.
**Browser:** Microsoft Edge 154.0.4258.37, headed direct Node ESM/cached Playwright, separate fresh admin/member profiles, 390×844.
**Tester:** Hermann User Tester.

## Data and source identity

Fresh isolated SQLite DB contained two synthetic approved accounts and exactly 105 synthetic feedback requests owned by one member (53 Issue / 52 Feature), each with one Submitted event. Rows were inserted through the repository helper into the disposable DB because the form rate-limits after 10 requests per hour; the browser was used to render and navigate the UI. No real or incident data was used.

Preflight `/health` returned 200 and same-origin UI rendered. Served source matched current workspace:

- app.js SHA-256 `a4ef417072e185bf8871c3f205aaad72ee348d259f163531a9e386bf74f9e794`
- index.html `09379f2df2553c5de80ce22c90d8953906c7781f6e5f953b4bef65dd2bea2459`
- server.js `f6760db746861e3cff69d982904f52a9e0d0d5f5e64a321916e6124fe0b7e9`
- auth.js `3c931cbe1c8c9b95984f6a302467df99f3750d2d1b0d3f125084ab1b6b94692d`
- feedback-repository.js `576e3180224b3bd277f2ff4af5e9a974edecd52ee12278d874797d8041da4c36`

## Browser results

| Role / action | Result |
|---|---|
| Member Account list | All 105 owned requests rendered, including first/last request; `aria-busy=false`, empty state hidden. `GET /api/feedback/mine` took 3–5ms; latest response to full visible list was about 64ms. |
| Member layout | At 390px viewport, body/document client/scroll widths were 375/375. Request card measured 320×279px. Zero overflowing/out-of-bounds elements were reported. |
| Admin initial queue | `GET /api/admin/feedback?limit=100&offset=0` returned 100 cards (requests 001–100), with Load older visible/enabled. API 15ms; DOM after response 131ms. |
| Admin Load older | Enter activated the button; offset 100 returned the final five (105 total); button became hidden. Live region announced “Older requests loaded.” and focus moved to `#feedback-admin-status`. API 13ms; render about 34ms. |
| Admin Feature filter | `type=Feature` returned exactly 52 matching cards and hid Load older; API 3ms; no overflow reported. |
| Admin layout | Card measured 320×939px at x=27..348; no overflow. A full editor is repeated in each of 100 cards, implying a nominal first-page vertical stack around 93,900px. This is a measurable scroll-depth/density concern, not a confirmed user failure by itself. |

**Focus-ring limitation:** The harness focused Load older programmatically before pressing Enter, so its `:focus-visible` ring was not verified via a real Tab traversal. Pagination announcement and post-activation focus target were verified. The accepted/admin-side density and ring questions remain open under FEEDBACK-UX-01; no defect was confirmed in this pass.

## Cleanup and Git state

The isolated database contained two synthetic users and 105 requests before removal. Service, DB and profiles were removed; port 59441 no longer accepts TCP. Live 8788 remained untouched.

`updater-vnext`, branch `vnext-home-hosted`, HEAD `daa5b58aaf7550561dbfedf1c4ff91ff5ea09e59`; shared source/QA/backlog changes remain uncommitted; no commit or push.
