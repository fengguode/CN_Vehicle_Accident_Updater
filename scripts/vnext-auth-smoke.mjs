import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { openDb } from '../src/db.js';

const baseUrl = 'http://127.0.0.1:8788';
const adminPassword = process.env.ADAS_TEST_ADMIN_PASSWORD;
if (!adminPassword) throw new Error('Set ADAS_TEST_ADMIN_PASSWORD for the local auth smoke run.');

const newPassword = () => crypto.randomBytes(32).toString('base64url');
const testUsername = `smoke_${crypto.randomBytes(5).toString('hex')}`;
const adminTemporaryPassword = newPassword();
const memberInitialPassword = newPassword();
const memberChangedPassword = newPassword();
const jars = [];
let adminChanged = false;
let adminSession;
let memberId = null;
let inviteId = null;
const checks = [];

function rememberCookies(jar, response) {
  const lines = response.headers.getSetCookie?.() || [response.headers.get('set-cookie')].filter(Boolean);
  for (const line of lines) {
    const pair = line.split(';', 1)[0];
    const at = pair.indexOf('=');
    if (at > 0) jar[pair.slice(0, at)] = pair.slice(at + 1);
  }
}

async function api(path, { method = 'GET', body, jar, expected = 200 } = {}) {
  const headers = { accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (jar && Object.keys(jar).length) headers.cookie = Object.entries(jar).map(([key, value]) => `${key}=${value}`).join('; ');
  if (method !== 'GET' && jar?.adas_csrf) headers['x-csrf-token'] = jar.adas_csrf;
  const response = await fetch(new URL(path, baseUrl), { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  rememberCookies(jar || {}, response);
  let payload = {};
  try { payload = await response.json(); } catch {}
  assert.equal(response.status, expected, `${method} ${path}: expected HTTP ${expected}, got ${response.status} (${payload.error || 'no error detail'})`);
  return payload;
}

async function login(username, password, expected = 200) {
  const jar = {};
  const result = await api('/api/auth/login', { method: 'POST', body: { username, password }, jar, expected });
  if (expected === 200) jars.push(jar);
  return { jar, result };
}

function changePassword(jar, currentPassword, nextPassword) {
  return api('/api/auth/password', { method: 'POST', jar, body: { current_password: currentPassword, new_password: nextPassword } });
}

function adminUserChange(jar, id, changes, expected = 200) {
  return api(`/api/admin/users/${id}`, { method: 'PATCH', jar, body: changes, expected });
}

async function cleanup() {
  const db = openDb();
  try {
    db.exec('BEGIN IMMEDIATE');
    try {
      const user = db.prepare('SELECT id FROM users WHERE username=?').get(testUsername);
      if (user) {
        db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);
        db.prepare('DELETE FROM auth_audit WHERE user_id=?').run(user.id);
        db.prepare('DELETE FROM invitations WHERE created_by=? OR used_by=?').run(user.id, user.id);
        db.prepare('DELETE FROM users WHERE id=?').run(user.id);
      }
      if (inviteId !== null) db.prepare('DELETE FROM invitations WHERE id=? AND used_by IS NULL').run(inviteId);
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  } finally { db.close(); }
}

try {
  const adminLogin = await login('admin', adminPassword);
  adminSession = adminLogin.jar;
  assert.equal(adminLogin.result.user.role, 'admin');
  assert.equal((await api('/api/auth/me', { jar: adminSession })).user.username, 'admin');
  checks.push('admin login and persistent session');

  await changePassword(adminSession, adminPassword, adminTemporaryPassword);
  adminChanged = true;
  await login('admin', adminPassword, 401);
  const tempAdmin = await login('admin', adminTemporaryPassword);
  assert.equal(tempAdmin.result.user.role, 'admin');
  await changePassword(adminSession, adminTemporaryPassword, adminPassword);
  adminChanged = false;
  assert.equal((await api('/api/auth/me', { jar: adminSession })).user.role, 'admin');
  assert.equal((await api('/api/auth/me', { jar: tempAdmin.jar })).user, null);
  assert.equal((await login('admin', adminPassword)).result.user.role, 'admin');
  checks.push('admin password change, old-password rejection, and session revocation');

  const invite = await api('/api/auth/invitations', { method: 'POST', jar: adminSession, body: {}, expected: 201 });
  inviteId = invite.id;
  assert.ok(invite.code && invite.expires_at);
  const memberSession = {};
  const registration = await api('/api/auth/register', {
    method: 'POST', body: { username: testUsername, password: memberInitialPassword, invite_code: invite.code }, jar: memberSession, expected: 201
  });
  assert.equal(registration.user.role, 'member');
  memberId = registration.user.id;
  jars.push(memberSession);
  assert.equal((await api('/api/auth/me', { jar: memberSession })).user.username, testUsername);
  await api('/api/auth/register', {
    method: 'POST', body: { username: `${testUsername}_again`, password: memberInitialPassword, invite_code: invite.code }, jar: {}, expected: 400
  });
  checks.push('invitation creation, registration, immediate sign-in, and one-use enforcement');

  await changePassword(memberSession, memberInitialPassword, memberChangedPassword);
  await login(testUsername, memberInitialPassword, 401);
  const memberChangedLogin = await login(testUsername, memberChangedPassword);
  assert.equal(memberChangedLogin.result.user.id, memberId);
  assert.equal((await api('/api/auth/me', { jar: memberSession })).user.username, testUsername);
  checks.push('member self-service password change');

  const users = await api('/api/admin/users', { jar: adminSession });
  assert.ok(users.data.some((user) => user.id === memberId && user.active));
  await adminUserChange(adminSession, memberId, { active: false });
  assert.equal((await api('/api/auth/me', { jar: memberChangedLogin.jar })).user, null);
  await login(testUsername, memberChangedPassword, 401);
  await adminUserChange(adminSession, memberId, { active: true });
  const restored = await login(testUsername, memberChangedPassword);
  assert.equal(restored.result.user.active, true);
  await adminUserChange(restored.jar, memberId, { active: false }, 403);
  checks.push('admin access revoke and restore, immediate session invalidation, member authorization denial');

  const adminId = adminLogin.result.user.id;
  await adminUserChange(adminSession, adminId, { active: false }, 400);
  checks.push('last active admin protection');
} finally {
  if (adminChanged && adminSession) {
    try { await changePassword(adminSession, adminTemporaryPassword, adminPassword); adminChanged = false; }
    catch (error) { console.error('CRITICAL: unable to restore the administrator password; current test password is available in process memory only.', error.message); }
  }
  await cleanup();
}

console.log(JSON.stringify({ ok: true, checks, temporaryMemberCleaned: true, inviteCleaned: true }));
