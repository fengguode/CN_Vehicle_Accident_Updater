import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from '../../src/db.js';
import { getFilterOptions, getSummary, listReports } from './reports-repository.js';
import { anonymizeUser, authenticate, changeOwnPassword, clearSessionCookies, createSession, currentUser, cookies, endSession, listInvitations, listUsers, makeInvitation, migrateAuth, publicUser, registerUser, requireCsrf, sessionCookies, updateUser } from './auth.js';
import { deleteAnonymizedUserVotes, myVotes, revokeVote, saveVote } from './votes-repository.js';
import { createFeedback, listAdminFeedback, listMyFeedback, triageFeedback } from './feedback-repository.js';
import { listMediaCandidates, listMediaReviewEvents, reviewMediaCandidate } from './media-review-repository.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web');
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/navigation.js', ['navigation.js', 'text/javascript; charset=utf-8']],
  ['/feedback-drafts.js', ['feedback-drafts.js', 'text/javascript; charset=utf-8']],
  ['/feedback-triage.js', ['feedback-triage.js', 'text/javascript; charset=utf-8']],
  ['/viewport.js', ['viewport.js', 'text/javascript; charset=utf-8']],
  ['/report-presentation.js', ['report-presentation.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/favicon.svg', ['favicon.svg', 'image/svg+xml']],
  ['/favicon.ico', ['favicon.svg', 'image/svg+xml']]
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
    let tooLarge = false;
    req.on('data', (chunk) => {
      if (tooLarge) return;
      body += chunk;
      if (body.length > 16_384) {
        tooLarge = true;
        body = '';
        reject(Object.assign(new Error('Request body too large.'), { status: 413 }));
      }
    });
    req.on('end', () => {
      if (tooLarge) return;
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
function secureRequest(req) {
  const forwarded = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  return Boolean(req.socket.encrypted) || forwarded === 'https';
}
function signedInRequired(db, req, res) {
  const user = currentUser(db, req);
  if (!user) { json(res, { error: 'authentication_required' }, 401); return null; }
  if (!requireCsrf(db, req)) { json(res, { error: 'csrf_check_failed' }, 403); return null; }
  return user;
}
function memberRequired(db, req, res) {
  const user = signedInRequired(db, req, res);
  if (!user) return null;
  if (!user.approved) { json(res, { error: 'admin_approval_required' }, 403); return null; }
  return user;
}
function approvedRequired(db, req, res) {
  const user = currentUser(db, req);
  if (!user) { json(res, { error: 'authentication_required' }, 401); return null; }
  if (!user.approved) { json(res, { error: 'admin_approval_required' }, 403); return null; }
  return user;
}
function adminRequired(db, req, res) {
  const user = currentUser(db, req);
  if (!user) { json(res, { error: 'authentication_required' }, 401); return null; }
  if (user.role !== 'admin') { json(res, { error: 'admin_required' }, 403); return null; }
  if (!user.approved) { json(res, { error: 'admin_approval_required' }, 403); return null; }
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
        return json(res, { ok: true }, 200, { 'set-cookie': clearSessionCookies(secureRequest(req)) });
      }
      if (url.pathname.endsWith('/register')) {
        let userId;
        try { userId = registerUser(db, body.username, body.password, body.invite_code); }
        catch (error) {
          if (error.code === 'invalid_invitation_code' || error.code === 'username_taken') {
            return json(res, { error: error.message, code: error.code }, 400);
          }
          if (error.message === 'Username must be 3–32 letters, numbers, dots, dashes, or underscores.')
            return json(res, { error: error.message, code: 'invalid_username' }, 400);
          if (error.message === 'Password must be 12–200 characters.')
            return json(res, { error: error.message, code: 'invalid_password' }, 400);
          if (error.message === 'Usernames starting with anonymous- are reserved.')
            return json(res, { error: error.message, code: 'reserved_username' }, 400);
          console.error('Registration failed.');
          return json(res, { error: 'Registration could not be completed.', code: 'registration_failed' }, 500);
        }
        const user = db.prepare('SELECT id,username,role,active,approved FROM users WHERE id=?').get(userId);
        const session = createSession(db, userId);
        return json(res, { user: publicUser(user), csrf: session.csrf }, 201, { 'set-cookie': sessionCookies(session, secureRequest(req)) });
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
      return json(res, { user, csrf: session.csrf }, 200, { 'set-cookie': sessionCookies(session, secureRequest(req)) });
    }
    if (req.method === 'POST' && url.pathname === '/api/auth/invitations') {
      const user = memberRequired(db, req, res); if (!user) return;
      let invitation;
      try { invitation = makeInvitation(db, user); }
      catch (error) { return json(res, { error: error.message }, 400); }
      return json(res, invitation, 201);
    }
    if (req.method === 'POST' && url.pathname === '/api/auth/password') {
      const user = signedInRequired(db, req, res); if (!user) return;
      const body = await readJson(req);
      try { changeOwnPassword(db, user.id, body.current_password, body.new_password, cookies(req).adas_session); }
      catch (error) { return json(res, { error: error.message }, 400); }
      return json(res, { ok: true });
    }
    if (req.method === 'GET' && url.pathname === '/api/auth/invitations') {
      const user = approvedRequired(db, req, res); if (!user) return;
      return json(res, { data: listInvitations(db) });
    }
    if (req.method === 'GET' && url.pathname === '/api/admin/users') {
      const user = currentUser(db, req);
      if (!user) return json(res, { error: 'authentication_required' }, 401);
      if (user.role !== 'admin') return json(res, { error: 'admin_required' }, 403);
      if (!user.approved) return json(res, { error: 'admin_approval_required' }, 403);
      return json(res, { data: listUsers(db) });
    }
    const userMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)$/);
    if (req.method === 'PATCH' && userMatch) {
      const actor = adminRequired(db, req, res); if (!actor) return;
      const body = await readJson(req);
      try {
        if (!updateUser(db, Number(userMatch[1]), actor.id, body)) return json(res, { error: 'user_not_found' }, 404);
      } catch (error) { return json(res, { error: error.message }, 400); }
      return json(res, { ok: true });
    }
    const userDataActionMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)\/(anonymize|votes)$/);
    if (userDataActionMatch && ['POST', 'DELETE'].includes(req.method)) {
      const actor = adminRequired(db, req, res); if (!actor) return;
      const targetId = Number(userDataActionMatch[1]);
      try {
        if (userDataActionMatch[2] === 'anonymize' && req.method === 'POST') {
          if (!anonymizeUser(db, targetId, actor.id)) return json(res, { error: 'user_not_found' }, 404);
          return json(res, { ok: true });
        }
        if (userDataActionMatch[2] === 'votes' && req.method === 'DELETE') {
          const result = deleteAnonymizedUserVotes(db, targetId, actor.id);
          if (!result) return json(res, { error: 'user_not_found' }, 404);
          return json(res, result);
        }
      } catch (error) { return json(res, { error: error.message }, 400); }
    }
    if (req.method === 'POST' && url.pathname === '/api/feedback') {
      const user = signedInRequired(db, req, res); if (!user) return;
      const body = await readJson(req);
      try {
        const result = createFeedback(db, user.id, body, req.headers['idempotency-key'] || undefined);
        return json(res, { data: result.data }, result.replayed ? 200 : 201);
      }
      catch (error) {
        const status = error.status || (error.message === 'Submission limit reached. Try again later.' ? 429 : 400);
        return json(res, { error: error.message, ...(error.code ? { code: error.code } : {}) }, status);
      }
    }
    if (req.method === 'GET' && url.pathname === '/api/feedback/mine') {
      const user = currentUser(db, req);
      if (!user) return json(res, { error: 'authentication_required' }, 401);
      return json(res, { data: listMyFeedback(db, user.id) });
    }
    if (req.method === 'GET' && url.pathname === '/api/admin/feedback') {
      const user = currentUser(db, req);
      if (!user) return json(res, { error: 'authentication_required' }, 401);
      if (user.role !== 'admin') return json(res, { error: 'admin_required' }, 403);
      if (!user.approved) return json(res, { error: 'admin_approval_required' }, 403);
      try { return json(res, { viewer_id: user.id, data: listAdminFeedback(db, {
        status: url.searchParams.get('status') || undefined,
        type: url.searchParams.get('type') || undefined,
        limit: url.searchParams.get('limit') || undefined,
        offset: url.searchParams.get('offset') || undefined
      }) }); }
      catch (error) { return json(res, { error: error.message }, 400); }
    }
    if (req.method === 'GET' && url.pathname === '/api/admin/media-review') {
      const user = currentUser(db, req);
      if (!user) return json(res, { error: 'authentication_required' }, 401);
      if (user.role !== 'admin') return json(res, { error: 'admin_required' }, 403);
      if (!user.approved) return json(res, { error: 'admin_approval_required' }, 403);
      try { return json(res, listMediaCandidates(db, {
        status: url.searchParams.get('status') || undefined,
        limit: url.searchParams.get('limit') || undefined,
        cursor: url.searchParams.get('cursor') || undefined
      })); }
      catch (error) { return json(res, { error: error.message }, 400); }
    }
    const mediaEventsMatch = url.pathname.match(/^\/api\/admin\/media-review\/(\d+)\/events$/);
    if (req.method === 'GET' && mediaEventsMatch) {
      const user = currentUser(db, req);
      if (!user) return json(res, { error: 'authentication_required' }, 401);
      if (user.role !== 'admin') return json(res, { error: 'admin_required' }, 403);
      if (!user.approved) return json(res, { error: 'admin_approval_required' }, 403);
      try { return json(res, { data: listMediaReviewEvents(db, Number(mediaEventsMatch[1])) }); }
      catch (error) { return json(res, { error: error.message }, 400); }
    }
    const mediaActionMatch = url.pathname.match(/^\/api\/admin\/media-review\/([^/]+)\/([^/]+)$/);
    if (req.method === 'POST' && mediaActionMatch) {
      const actor = adminRequired(db, req, res); if (!actor) return;
      try {
        const result = reviewMediaCandidate(db, Number(mediaActionMatch[1]), actor.id, mediaActionMatch[2]);
        if (!result) return json(res, { error: 'video_report_not_found' }, 404);
        return json(res, { data: result });
      } catch (error) { return json(res, { error: error.message }, 400); }
    }
    const feedbackMatch = url.pathname.match(/^\/api\/admin\/feedback\/([0-9a-f-]{36})$/i);
    if (req.method === 'PATCH' && feedbackMatch) {
      const actor = adminRequired(db, req, res); if (!actor) return;
      const body = await readJson(req);
      try {
        const backlogPath = path.resolve(root, '../../docs/PROJECT_BACKLOG.md');
        const backlogText = fs.readFileSync(backlogPath, 'utf8');
        const canonicalBacklogIds = new Set([...backlogText.matchAll(/^\|\s*([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\s*\|/gm)].map((match) => match[1]));
        const data = triageFeedback(db, feedbackMatch[1], actor.id, body, canonicalBacklogIds);
        if (!data) return json(res, { error: 'feedback_not_found' }, 404);
        return json(res, { data });
      } catch (error) {
        return json(res, {
          error: error.message,
          ...(error.code ? { code: error.code } : {}),
          ...(error.data ? { data: error.data } : {})
        }, error.status || 400);
      }
    }
    if (req.method === 'GET' && url.pathname === '/health') return json(res, { ok: true, service: 'adas-vnext' });
    if (req.method === 'GET' && url.pathname === '/api/my-votes') {
      const user = approvedRequired(db, req, res); if (!user) return;
      return json(res, { data: myVotes(db, user.id) });
    }
    if (req.method === 'POST' && url.pathname === '/api/vote') {
      const user = memberRequired(db, req, res); if (!user) return;
      const body = await readJson(req);
      try { return json(res, saveVote(db, user.id, body.fingerprint, body.vote)); }
      catch (error) { return json(res, { error: error.message }, error.message === 'Report not found.' ? 404 : 400); }
    }
    const voteMatch = url.pathname.match(/^\/api\/vote\/([a-f0-9]{64})$/);
    if (req.method === 'DELETE' && voteMatch) {
      const user = memberRequired(db, req, res); if (!user) return;
      try { return json(res, revokeVote(db, user.id, voteMatch[1])); }
      catch (error) { return json(res, { error: error.message }, 400); }
    }
    if (req.method === 'GET' && ['/api/reports', '/api/filters', '/api/summary'].includes(url.pathname)) {
      const user = approvedRequired(db, req, res); if (!user) return;
      if (url.pathname === '/api/reports') return json(res, listReports(db, url.searchParams));
      if (url.pathname === '/api/filters') return json(res, getFilterOptions(db));
      return json(res, getSummary(db));
    }
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
