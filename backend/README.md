# WeChat H5 vote backend

This is a Cloudflare Worker/D1 implementation for WeChat H5 OAuth. It keeps the WeChat AppSecret server-side, creates an HttpOnly signed session cookie, and stores one vote per WeChat OpenID/report fingerprint.

## Deployment outline

1. Create a Cloudflare D1 database and apply `schema.sql`.
2. Copy `wrangler.toml.example` to `wrangler.toml` and set the Worker URL and D1 ID.
3. Configure the WeChat Official Account web-authorization callback domain to the Worker domain.
4. Set `WECHAT_APP_ID`, `WECHAT_APP_SECRET`, and a random `SESSION_SECRET` with `wrangler secret put`.
5. Deploy with `wrangler deploy`.

The static site can then use `/auth/wechat/start` for login and `POST /api/vote` for centralized relevance votes. No WeChat secret belongs in this repository.
