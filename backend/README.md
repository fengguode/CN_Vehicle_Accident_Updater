# Direct GitHub account voting

## Current vNext backend story and acceptance criteria

The current home-hosted vNext application is the authoritative backend for the Web UI. Its Node API, collectors/importers, and UI use the same persistent SQLite database; the separate GitHub vote API described below belongs to the earlier static-site architecture and is not the vNext write path.

### Newly discovered items

- When an enabled discovery source or authorized import supplies a new item, the backend persists it to the SQLite database queried by the Web UI without requiring a separate export/import or vote-sync step.
- Keep the original source URL and available source/platform, author, publication-time, and collection-time provenance attached to the item.
- Insert new items as `unverified`. Discovery or ingestion alone must not mark an item reviewed or verified; only an explicit human review may change that status.
- Repeating ingestion of the same item must follow the existing deduplication/idempotency behavior and must not create a second report or overwrite review state.
- If ingestion fails, do not expose a partially written item or advance the source cursor past data that was not committed. Retry must safely complete the write.

### Relevance rating and SVM refresh

- Recalculate the SVM boundary and report relevance values after every 100 newly received member relevance ratings/votes, or when an internal backend trigger requests recalculation. “Rate” means a member's relevant/not-relevant rating of a report.
- Count newly received ratings, not API requests: retries of the same accepted rating operation must not increment the threshold twice. The selected policy is a member/report pair counts once for its lifetime; changing or revoking a rating and later restoring it updates current training input but never adds another rating to the 100-rating threshold. A durable receipt ledger and SQLite singleton store first-rating receipts, pending threshold progress, and internal refresh requests across restarts.
- A successful recalculation writes one model version, every corresponding report score, and clears the durable trigger in one SQLite write transaction. API readers therefore see the prior complete score set or the new complete set. A failed recalculation rolls back model and score writes while retaining committed ratings and the retryable counter/trigger.
- The score represents community relevance to the database, not verification, source credibility, severity, or causation.

**Implemented refinement:** the current-vote table remains the training source; a compact `traffic_rating_receipts` table records the first time each member/report pair was ever rated, including after the current vote is revoked. Existing current votes are backfilled into this ledger at migration so pre-feature ratings do not count as new. The vote, first-rating receipt, and threshold increment commit together. Model publication happens in a subsequent transaction, so training failures cannot reject or lose an accepted vote; the counter remains at or above 100 for retry on the next vote or through the internal `retryPendingSvmRefresh` hook. `requestSvmRefresh` persists an explicit backend request before attempting publication.

`github-vote-worker.js` is the vote API logic. It can run on this Windows computer through `home-vote-server.js`, using local SQLite, or on Cloudflare Workers with D1. GitHub identifies the voter through OAuth. One current vote is stored per report and GitHub account; a voter can replace or delete it. The browser stores an opaque session token in `sessionStorage`; GitHub credentials stay on the server.

## Home computer deployment

1. Keep the computer on and arrange a stable public HTTPS address that forwards to the local server. A reverse proxy or tunnel may be used; do not expose plain HTTP to the public internet.
2. Register a GitHub OAuth app with callback URL `https://YOUR-PUBLIC-HOST/auth/github/callback`. It needs no repository write scope.
3. Set `VOTE_PUBLIC_BASE_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and a long random `VOTE_EXPORT_TOKEN` as environment variables on the computer. Run `npm run serve-votes`. The API listens on `127.0.0.1:8790` by default and stores data in `data/votes.db`.
4. Set `VOTE_API_URL` to the public HTTPS origin in the database repository's Actions variables and set the same token as `VOTE_EXPORT_TOKEN` in its Actions secrets. Trigger the daily update workflow to regenerate the site and import current votes.

The local API can be checked at `http://127.0.0.1:8790/health`. Keep the SQLite file backed up. If the home connection is down, the public report page remains readable but new votes cannot be submitted until it returns.

### Tailscale Funnel on Windows

This is the preferred home-hosting path when no domain is available. A new Tailscale account can be created with the project owner's existing GitHub login. Install Tailscale from its official Windows download page, sign in, and enable Funnel in the Tailscale admin console when prompted. Funnel makes the local vote API publicly reachable over HTTPS; it does **not** make the rest of the computer or the SQLite file public.

With the vote server listening only on `127.0.0.1:8790`, run `tailscale funnel --bg --https=443 http://127.0.0.1:8790` and read its assigned `https://<machine>.<tailnet>.ts.net` URL using `tailscale funnel status`. Set that exact origin as `VOTE_PUBLIC_BASE_URL`, then restart the vote server. Register the GitHub OAuth app callback as `<origin>/auth/github/callback`; set its client ID and secret only in the server environment. Use the same origin for the database repository's `VOTE_API_URL` Actions variable. Keep the export token secret and never put it in the site HTML or repository.

Do not use a random-address quick tunnel for production voting: OAuth callbacks and the published site need a stable origin. If the PC shuts down or Tailscale disconnects, voting pauses until both are running again.

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
