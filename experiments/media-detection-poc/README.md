# Social media availability POC (isolated)

This experiment checks whether a single Weibo or Xiaohongshu post page exposes explicit video or image-preview evidence. It is not imported by the app, updater, API, or database. It performs one unauthenticated read-only request for a user-supplied HTTPS URL, never sends cookies, does not execute page JavaScript, and does not follow redirects.

## Run

From `updater-vnext`:

```powershell
node experiments/media-detection-poc/detect-media.mjs https://weibo.com/<post-path>
node experiments/media-detection-poc/detect-media.mjs https://www.xiaohongshu.com/explore/<note-id>
node --test experiments/media-detection-poc/test/detect-media.test.mjs
```

The command prints a compact JSON result. It does not save the page, create a database, modify a report, or persist discovered links.

## Result contract

- `video_available`: explicit video metadata or a video/source element was found. Candidate media URLs are returned with the exact evidence signal and host; they are not guaranteed to remain playable.
- `photo_preview_available`: an explicit page preview image was found. This is not proof that the note contains a full photo gallery.
- `blocked_or_login_required`: the page redirected to a login/visitor flow or returned an access restriction. This does **not** mean no video exists.
- `unknown`: page loaded but did not expose an explicit media signal. This does **not** mean no video exists; JavaScript-hydrated media may be invisible to this HTTP-only POC.
- `no_media_confirmed`: reserved for a future platform adapter that can demonstrate it fully enumerated that post's media. This generic HTML POC never emits it.
- `fetch_failed`: timeout or network failure. This does **not** mean no video exists.

Video evidence is limited to Open Graph/Twitter video metadata, JSON-LD `VideoObject`, and `<video>/<source>` URLs. Image evidence is limited to Open Graph/JSON-LD preview metadata. A normal site logo or arbitrary `<img>` is not treated as post media. Returned candidates are extracted from the official page, but their CDN host and persistence rights still require review before production use. Prefer linking to the original post; do not download, mirror, autoplay, or expose graphic/identifying imagery.

## Current platform findings

The first live check used a sanitized Weibo source URL already present in the public report export. Without cookies, Weibo returned HTTP 302 toward `passport.weibo.com`; the POC should report `blocked_or_login_required`, with no media conclusion. The official Xiaohongshu Explore URL also returned HTTP 302 instead of a note page in the same unauthenticated test. The checked-in public report export had no Xiaohongshu source rows, so there was no XHS note URL available for an article-level probe.

These checks prove the access-wall classification path, not successful media extraction. A headed, user-authorized session with representative Weibo and Xiaohongshu post URLs is still needed to validate their rendered media DOM/payloads. The Playwright CLI was not available locally and no authenticated browser control is exposed in this session. Do not bypass these barriers.

## QA

See [QA.md](./QA.md) for exact checks, results, and limitations.
