const fingerprintPattern = /^[a-f0-9]{64}$/;
const sessionLifetimeMs = 30 * 24 * 60 * 60 * 1000;

function json(value, status = 200, headers = {}) {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
}

function cors(request, env) {
  const origin = request.headers.get('origin');
  return origin === env.FRONTEND_ORIGIN ? { 'access-control-allow-origin': origin, 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS', vary: 'Origin' } : { vary: 'Origin' };
}

function bytesToHex(bytes) { return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join(''); }
function randomToken() { return bytesToHex(crypto.getRandomValues(new Uint8Array(32))); }
async function tokenHash(token) { return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))); }

async function sessionUser(request, env) {
  const token = request.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/i)?.[1];
  if (!token) return null;
  return env.DB.prepare('SELECT github_id, github_login FROM sessions WHERE token_hash=? AND expires_at>?').bind(await tokenHash(token), new Date().toISOString()).first();
}

function oauthStateCookie(value, maxAge = 600) { return `adas_oauth_state=${value}; Path=/auth/github; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`; }

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = cors(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (url.pathname === '/health' && request.method === 'GET') return json({ ok: true }, 200, headers);
    if (url.pathname === '/auth/github/start' && request.method === 'GET') {
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.FRONTEND_URL) return json({ error: 'auth_not_configured' }, 503, headers);
      const state = randomToken();
      const callback = new URL('/auth/github/callback', url.origin).toString();
      const target = new URL('https://github.com/login/oauth/authorize');
      target.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      target.searchParams.set('redirect_uri', callback);
      target.searchParams.set('state', state);
      return new Response(null, { status: 302, headers: { location: target.toString(), 'set-cookie': oauthStateCookie(state), 'cache-control': 'no-store' } });
    }
    if (url.pathname === '/auth/github/callback' && request.method === 'GET') {
      const state = url.searchParams.get('state');
      const cookieState = request.headers.get('cookie')?.match(/(?:^|;\s*)adas_oauth_state=([a-f0-9]{64})(?:;|$)/)?.[1];
      const code = url.searchParams.get('code');
      if (!code || !state || state !== cookieState) return json({ error: 'invalid_oauth_state' }, 400, headers);
      const exchange = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: new URL('/auth/github/callback', url.origin).toString() })
      });
      const credentials = await exchange.json();
      if (!exchange.ok || !credentials.access_token) return json({ error: 'github_token_exchange_failed' }, 502, headers);
      const identityResponse = await fetch('https://api.github.com/user', { headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${credentials.access_token}`, 'user-agent': 'CN-ADAS-Vote' } });
      const identity = await identityResponse.json();
      if (!identityResponse.ok || !Number.isSafeInteger(identity.id)) return json({ error: 'github_identity_failed' }, 502, headers);
      const token = randomToken();
      await env.DB.prepare('INSERT INTO sessions(token_hash,github_id,github_login,expires_at) VALUES(?,?,?,?)').bind(await tokenHash(token), String(identity.id), identity.login || '', new Date(Date.now() + sessionLifetimeMs).toISOString()).run();
      const destination = new URL(env.FRONTEND_URL);
      destination.hash = `session=${token}`;
      return new Response(null, { status: 302, headers: { location: destination.toString(), 'set-cookie': oauthStateCookie('', 0), 'cache-control': 'no-store' } });
    }
    if (url.pathname === '/auth/me' && request.method === 'GET') {
      const user = await sessionUser(request, env);
      return json({ authenticated: Boolean(user), login: user?.github_login || null }, 200, headers);
    }
    if (url.pathname === '/auth/logout' && request.method === 'POST') {
      const token = request.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/i)?.[1];
      if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await tokenHash(token)).run();
      return json({ ok: true }, 200, headers);
    }
    if (url.pathname === '/api/my-votes' && request.method === 'GET') {
      const user = await sessionUser(request, env);
      if (!user) return json({ error: 'login_required' }, 401, headers);
      const rows = await env.DB.prepare('SELECT fingerprint,vote FROM votes WHERE voter_id=?').bind(`github:${user.github_id}`).all();
      return json({ votes: rows.results || [] }, 200, headers);
    }
    if (url.pathname === '/api/votes/summary' && request.method === 'GET') {
      const rows = await env.DB.prepare("SELECT fingerprint,SUM(vote='relevant') relevant,SUM(vote='not_relevant') not_relevant FROM votes GROUP BY fingerprint").all();
      return json({ totals: rows.results || [] }, 200, headers);
    }
    if (url.pathname === '/api/vote' && request.method === 'POST') {
      const user = await sessionUser(request, env);
      if (!user) return json({ error: 'login_required' }, 401, headers);
      let body;
      try { body = await request.json(); } catch { return json({ error: 'invalid_json' }, 400, headers); }
      if (!fingerprintPattern.test(body?.fingerprint || '') || !['relevant', 'not_relevant'].includes(body?.vote)) return json({ error: 'invalid_vote' }, 400, headers);
      await env.DB.prepare('INSERT INTO votes(fingerprint,voter_id,vote,created_at) VALUES(?,?,?,?) ON CONFLICT(fingerprint,voter_id) DO UPDATE SET vote=excluded.vote,created_at=excluded.created_at').bind(body.fingerprint, `github:${user.github_id}`, body.vote, new Date().toISOString()).run();
      return json({ ok: true, fingerprint: body.fingerprint, vote: body.vote }, 200, headers);
    }
    if (url.pathname.startsWith('/api/vote/') && request.method === 'DELETE') {
      const user = await sessionUser(request, env);
      if (!user) return json({ error: 'login_required' }, 401, headers);
      const fingerprint = url.pathname.slice('/api/vote/'.length);
      if (!fingerprintPattern.test(fingerprint)) return json({ error: 'invalid_fingerprint' }, 400, headers);
      await env.DB.prepare('DELETE FROM votes WHERE fingerprint=? AND voter_id=?').bind(fingerprint, `github:${user.github_id}`).run();
      return json({ ok: true, fingerprint, vote: null }, 200, headers);
    }
    if (url.pathname === '/api/votes/export' && request.method === 'GET') {
      if (!env.EXPORT_TOKEN || request.headers.get('authorization') !== `Bearer ${env.EXPORT_TOKEN}`) return json({ error: 'forbidden' }, 403, headers);
      const rows = await env.DB.prepare('SELECT fingerprint,vote,voter_id,created_at FROM votes ORDER BY fingerprint,voter_id').all();
      return json(rows.results || [], 200, headers);
    }
    return json({ error: 'not_found' }, 404, headers);
  }
};
