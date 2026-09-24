import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from '../../src/db.js';
import { getFilterOptions, getSummary, listReports } from './reports-repository.js';
import { authenticate, clearSessionCookies, createSession, currentUser, cookies, endSession, listInvitations, listUsers, makeInvitation, migrateAuth, publicUser, registerUser, requireCsrf, sessionCookies, updateUser } from './auth.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web');
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']]
]);
const db = openDb();
migrateAuth(db);
const port = Number(process.env.ADAS_VNEXT_PORT || 8788);
const loginFailures = new Map();

function send(res, status, body, contentType = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'content-type': contentType, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(body);
}
function json(res, value, status = 200, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers });
  res.end(JSON.stringify(value));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 16_384) { reject(Object.assign(new Error('Request body too large.'), { status: 413 })); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(Object.assign(new Error('Invalid JSON.'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === String(req.headers.host || '').toLowerCase(); } catch { return false; }
}
function memberRequired(db, req, res) {
  const user = currentUser(db, req);
  if (!user) { json(res, { error: 'authentication_required' }, 401); return null; }
  if (!requireCsrf(db, req)) { json(res, { error: 'csrf_check_failed' }, 403); return null; }
  return user;
}
function adminRequired(db, req, res) {
  const user = currentUser(db, req);
  if (!user) { json(res, { error: 'authentication_required' }, 401); return null; }
  if (user.role !== 'admin') { json(res, { error: 'admin_required' }, 403); return null; }
  if (!requireCsrf(db, req)) { json(res, { error: 'csrf_check_failed' }, 403); return null; }
  return user;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    if (req.method !== 'GET' && !sameOrigin(req)) return json(res, { error: 'same_origin_required' }, 403);
    if (req.method === 'GET' && url.pathname === '/api/auth/me') {
      const user = currentUser(db, req);
      const csrf = cookies(req).adas_csrf || null;
      return json(res, { user, csrf });
    }
    if (req.method === 'POST' && ['/api/auth/login', '/api/auth/register', '/api/auth/logout'].includes(url.pathname)) {
      const body = await readJson(req);
      if (url.pathname === '/api/auth/logout') {
        const user = currentUser(db, req);
        if (user && !requireCsrf(db, req)) return json(res, { error: 'csrf_check_failed' }, 403);
        endSession(db, req);
        return json(res, { ok: true }, 200, { 'set-cookie': clearSessionCookies });
      }
      if (url.pathname.endsWith('/register')) {
        let userId;
        try { userId = registerUser(db, body.username, body.password, body.invite_code); }
        catch (error) { return json(res, { error: error.message }, 400); }
        const user = db.prepare('SELECT id,username,role,active FROM users WHERE id=?').get(userId);
        const session = createSession(db, userId);
        return json(res, { user: publicUser(user), csrf: session.csrf }, 201, { 'set-cookie': sessionCookies(session) });
      }
      const key = `${req.socket.remoteAddress || 'local'}:${String(body.username || '').toLowerCase()}`;
      const attempt = loginFailures.get(key) || { count: 0, until: 0 };
      if (attempt.until > Date.now() && attempt.count >= 8) return json(res, { error: 'login_temporarily_limited' }, 429);
      const user = authenticate(db, body.username, body.password);
      if (!user) {
        const next = attempt.until > Date.now() ? attempt : { count: 0, until: Date.now() + 15 * 60_000 };
        next.count += 1;
        loginFailures.set(key, next);
        return json(res, { error: 'invalid_username_or_password' }, 401);
      }
      loginFailures.delete(key);
      const session = createSession(db, user.id);
      return json(res, { user, csrf: session.csrf }, 200, { 'set-cookie': sessionCookies(session) });
    }
    if (req.method === 'POST' && url.pathname === '/api/auth/invitations') {
      const user = memberRequired(db, req, res); if (!user) return;
      let invitation;
      try { invitation = makeInvitation(db, user); }
      catch (error) { return json(res, { error: error.message }, 400); }
      return json(res, invitation, 201);
    }
    if (req.method === 'GET' && url.pathname === '/api/auth/invitations') {
      const user = currentUser(db, req);
      if (!user) return json(res, { error: 'authentication_required' }, 401);
      return json(res, { data: listInvitations(db) });
    }
    if (req.method === 'GET' && url.pathname === '/api/admin/users') {
      const user = currentUser(db, req);
      if (!user) return json(res, { error: 'authentication_required' }, 401);
      if (user.role !== 'admin') return json(res, { error: 'admin_required' }, 403);
      return json(res, { data: listUsers(db) });
    }
    const userMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)$/);
    if (req.method === 'PATCH' && userMatch) {
      const actor = adminRequired(db, req, res); if (!actor) return;
      const body = await readJson(req);
      if (!updateUser(db, Number(userMatch[1]), actor.id, body)) return json(res, { error: 'user_not_found' }, 404);
      return json(res, { ok: true });
    }
    if (req.method === 'GET' && url.pathname === '/health') return json(res, { ok: true, service: 'adas-vnext' });
    if (req.method === 'GET' && url.pathname === '/api/reports') return json(res, listReports(db, url.searchParams));
    if (req.method === 'GET' && url.pathname === '/api/filters') return json(res, getFilterOptions(db));
    if (req.method === 'GET' && url.pathname === '/api/summary') return json(res, getSummary(db));
    if (req.method !== 'GET') return json(res, { error: 'method_not_allowed' }, 405);
    const asset = assets.get(url.pathname);
    if (!asset) return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    return send(res, 200, fs.readFileSync(path.join(root, asset[0])), asset[1]);
  } catch (error) {
    console.error('vNext request failed:', error.message);
    return json(res, { error: error.status ? error.message : 'internal_error' }, error.status || 500);
  }
});

server.listen(port, '127.0.0.1', () => console.log(`ADAS vNext UI/API listening at http://127.0.0.1:${port}`));
function shutdown() { server.close(() => { db.close(); }); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
