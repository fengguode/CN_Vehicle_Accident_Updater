# Hermann User management narrow-width overflow reproduction

**Date:** 2026-09-29 (Asia/Shanghai)  
**Variant:** `updater-vnext`  
**Target:** isolated same-origin service `http://127.0.0.1:57727/`, fresh disposable SQLite fixture  
**Browser:** Microsoft Edge 154.0.4258.37, headed Playwright  
**Tester:** Hermann User Tester

## Runtime and fixture

`/health` returned 200 and the User management view rendered. Fixture had only synthetic admin `uxadmin` and member `uxmember`, no reports or feedback. Served `/app.js` exactly matched current local source, SHA-256 `7fc6a25889d54a6b329b4b5e773b208df1d2c9407c6e8d5cb5a4d740a01ec24c`. No page errors occurred. `GET /api/admin/users` returned 200.

## Measurement

At 1280×800, document client/scroll widths were 1280/1280 and body widths were 1160/1160; no horizontal overflow offenders were present. At 320×800, both document and body client width were 305px while scroll width was 317px (12px excess). The offending element was:

```text
body>main>section.workspace-view:nth-of-type(3)>div.view-heading>span
text: Administrator access
bounding box: x=226.64, y=268.28, width=90.56, height=42.66
right=317.2, bottom=310.94
clientWidth/scrollWidth=91/91
CSS overflow-x=visible; white-space=normal
```

The label extends into the 15px vertical scrollbar gutter, while the user cards and controls stay within the content bounds. `scrollX` remained 0 when attempting horizontal scrolling. The screenshot was captured during the run but removed with the temporary fixture during cleanup. An earlier admin-only 320px comparison did not reproduce this overflow, so the member-row fixture is part of the current reproduction condition. No changes were made to source or the live service.

## Cleanup and scope

Synthetic DB/profile/harness directory were removed, service PID 44536 stopped, and port 57727 no longer responded. Port 8788 was not contacted during the run. Visual occlusion of the final glyph by the scrollbar was not confirmed; the finding is a reproducible 12px page-level overflow/heading-label encroachment rather than a confirmed loss of a control or data.
