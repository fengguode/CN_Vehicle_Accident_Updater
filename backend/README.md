# Direct GitHub account voting

`github-vote-worker.js` is the vote API logic. It can run on this Windows computer through `home-vote-server.js`, using local SQLite, or on Cloudflare Workers with D1. GitHub identifies the voter through OAuth. One current vote is stored per report and GitHub account; a voter can replace or delete it. The browser stores an opaque session token in `sessionStorage`; GitHub credentials stay on the server.

## Home computer deployment

1. Keep the computer on and arrange a stable public HTTPS address that forwards to the local server. A reverse proxy or tunnel may be used; do not expose plain HTTP to the public internet.
2. Register a GitHub OAuth app with callback URL `https://YOUR-PUBLIC-HOST/auth/github/callback`. It needs no repository write scope.
3. Set `VOTE_PUBLIC_BASE_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and a long random `VOTE_EXPORT_TOKEN` as environment variables on the computer. Run `npm run serve-votes`. The API listens on `127.0.0.1:8790` by default and stores data in `data/votes.db`.
4. Set `VOTE_API_URL` to the public HTTPS origin in the database repository's Actions variables and set the same token as `VOTE_EXPORT_TOKEN` in its Actions secrets. Trigger the daily update workflow to regenerate the site and import current votes.

The local API can be checked at `http://127.0.0.1:8790/health`. Keep the SQLite file backed up. If the home connection is down, the public report page remains readable but new votes cannot be submitted until it returns.

## Cloudflare deployment (alternative)

Deployment requires a Cloudflare account and a GitHub OAuth app owned by the project operator:

1. Create a GitHub OAuth app with callback URL `https://YOUR-WORKER-DOMAIN/auth/github/callback`. It needs no repository write scope.
2. Create D1 database `cn-adas-votes` and apply `schema.sql`.
3. Copy `github-wrangler.toml.example` to `github-wrangler.toml`, set the D1 ID, and deploy with `wrangler deploy --config github-wrangler.toml`.
4. Set Worker secrets `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and a long random `EXPORT_TOKEN`. Set the same export token as `VOTE_EXPORT_TOKEN` in the database repository's Actions secrets.
5. Set `VOTE_API_URL` in the database repository's Actions variables to the HTTPS Worker origin. Trigger the daily update workflow to regenerate the public page with that URL.

The browser calls `POST /api/vote` to save or change a vote and `DELETE /api/vote/:fingerprint` to revoke it. `GET /api/my-votes` restores the user's selections after reload. The daily updater imports `GET /api/votes/export` with `VOTE_EXPORT_TOKEN`; it replaces its prior GitHub vote snapshot, so revocations also remove votes from aggregation and SVM training. Until `VOTE_API_URL` is configured, the public page clearly marks voting as unavailable and keeps vote buttons disabled.

## Older WeChat scaffold

This is a Cloudflare Worker/D1 implementation for WeChat H5 OAuth. It keeps the WeChat AppSecret server-side, creates an HttpOnly signed session cookie, and stores one vote per WeChat OpenID/report fingerprint.

## Deployment outline

1. Create a Cloudflare D1 database and apply `schema.sql`.
2. Copy `wrangler.toml.example` to `wrangler.toml` and set the Worker URL and D1 ID.
3. Configure the WeChat Official Account web-authorization callback domain to the Worker domain.
4. Set `WECHAT_APP_ID`, `WECHAT_APP_SECRET`, and a random `SESSION_SECRET` with `wrangler secret put`.
5. Deploy with `wrangler deploy`.

The static site can then use `/auth/wechat/start` for login and `POST /api/vote` for centralized relevance votes. No WeChat secret belongs in this repository.
