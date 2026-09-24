import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { openDb } from '../src/db.js';
import { makeInvitation, registerUser, updateUser } from '../apps/api/auth.js';
import { revokeVote } from '../apps/api/votes-repository.js';

const base = process.env.ADAS_TEST_BASE_URL;
if (!base || new URL(base).protocol !== 'https:') throw new Error('Set ADAS_TEST_BASE_URL to the vNext HTTPS origin.');
const db = openDb();
const admin = db.prepare("SELECT id,username,role,active,approved FROM users WHERE role='admin' AND active=1 AND approved=1 ORDER BY id LIMIT 1").get();
if (!admin) throw new Error('No approved administrator exists.');
const username = `qa_${crypto.randomBytes(5).toString('hex')}`;
const password = crypto.randomBytes(24).toString('base64url');
let invitation;
let userId;
let fingerprint;
const jar = {};

async function request(route, method = 'GET', body, expected = 200) {
  const headers = { accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (Object.keys(jar).length) headers.cookie = Object.entries(jar).map(([key, value]) => `${key}=${value}`).join('; ');
  if (method !== 'GET' && jar.adas_csrf) headers['x-csrf-token'] = jar.adas_csrf;
  const response = await fetch(new URL(route, base), { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20_000) });
  for (const cookie of response.headers.getSetCookie()) {
    const [name, value] = cookie.split(';', 1)[0].split('=');
    jar[name] = value;
  }
  const result = await response.json();
  assert.equal(response.status, expected, `${method} ${route}: ${response.status} ${result.error || ''}`);
  return { result, response };
}

try {
  await request('/api/reports', 'GET', undefined, 401);
  invitation = makeInvitation(db, admin);
  userId = registerUser(db, username, password, invitation.code);
  const login = await request('/api/auth/login', 'POST', { username, password });
  assert.equal(login.result.user.approved, false);
  assert.ok(login.response.headers.getSetCookie().every((cookie) => cookie.includes('Secure')), 'HTTPS session cookies must be Secure');
  await request('/api/reports', 'GET', undefined, 403);
  updateUser(db, userId, admin.id, { approved: true });
  const reports = (await request('/api/reports?page=1&page_size=2&sort=relevance')).result;
  assert.equal(reports.total, 294);
  assert.equal(reports.data.length, 2);
  fingerprint = reports.data[0].fingerprint;
  const voted = (await request('/api/vote', 'POST', { fingerprint, vote: 'relevant' })).result;
  assert.equal(voted.vote, 'relevant');
  assert.ok((await request('/api/my-votes')).result.data.some((vote) => vote.fingerprint === fingerprint));
  assert.equal((await request(`/api/vote/${fingerprint}`, 'DELETE')).result.revoked, true);
  fingerprint = undefined;
  await request('/api/auth/logout', 'POST', {});
  await request('/api/reports', 'GET', undefined, 401);
  console.log(JSON.stringify({ ok: true, https: true, anonymous_denied: true, pending_denied: true, approved_reports: reports.total, vote_and_revoke: true, secure_cookies: true, test_account_removed: true }));
} finally {
  if (userId) {
    if (fingerprint) revokeVote(db, userId, fingerprint);
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare('DELETE FROM review_votes WHERE voter_id=?').run(`local:${userId}`);
      db.prepare('DELETE FROM sessions WHERE user_id=?').run(userId);
      db.prepare('DELETE FROM invitations WHERE used_by=?').run(userId);
      db.prepare('DELETE FROM auth_audit WHERE user_id=?').run(userId);
      db.prepare('DELETE FROM users WHERE id=?').run(userId);
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  } else if (invitation) {
    db.prepare('DELETE FROM invitations WHERE id=?').run(invitation.id);
  }
  db.close();
}
