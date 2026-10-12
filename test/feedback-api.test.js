import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createSession, makeInvitation, migrateAuth } from '../apps/api/auth.js';
import { openDb } from '../src/db.js';
import { refreshVotesAndSvm } from '../apps/api/votes-repository.js';

async function freePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => listener.listen(0, '127.0.0.1', resolve).once('error', reject));
  const { port } = listener.address();
  await new Promise((resolve) => listener.close(resolve));
  return port;
}

test('feedback API enforces auth, CSRF, ownership, triage, and public/private separation', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext-feedback-api-'));
  const dbPath = path.join(dir, 'feedback.sqlite');
  const port = await freePort();
  const db = openDb(dbPath);
  migrateAuth(db);
  assert.ok(db.prepare('SELECT 1 FROM schema_migrations WHERE version=9').get(), 'anonymized identity schema migration is recorded');
  const now = new Date().toISOString();
  const addUser = (username, role, approved) => Number(db.prepare(`INSERT INTO users(username,password_salt,password_hash,role,active,approved,created_at)
    VALUES(?, 'salt', 'hash', ?, 1, ?, ?)`).run(username, role, approved ? 1 : 0, now).lastInsertRowid);
  const pending = addUser('feedback-pending', 'member', false);
  const other = addUser('feedback-other', 'member', true);
  addUser(`anonymous-${other}`, 'member', true); // Simulate a legacy account using the reserved label namespace.
  const admin = addUser('feedback-admin', 'admin', true);
  const reportFingerprint = 'a'.repeat(64);
  db.prepare(`INSERT INTO reports(fingerprint,title,content,source_name,collected_at,raw_json,created_at,updated_at)
    VALUES(?, 'Privacy fixture', 'Synthetic report', 'fixture', ?, '{}', ?, ?)`).run(reportFingerprint, now, now, now);
  db.prepare(`INSERT INTO traffic_votes(fingerprint,user_id,vote,created_at) VALUES(?,?,'relevant',?)`).run(reportFingerprint, other, now);
  db.prepare(`INSERT INTO traffic_rating_receipts(fingerprint,user_id,first_received_at) VALUES(?,?,?)`).run(reportFingerprint, other, now);
  const additionalFingerprints = [];
  const insertReport = db.prepare(`INSERT INTO reports(fingerprint,title,content,source_name,collected_at,raw_json,created_at,updated_at)
    VALUES(?, ?, 'synthetic training content', 'fixture', ?, '{}', ?, ?)`);
  const insertVote = db.prepare(`INSERT INTO traffic_votes(fingerprint,user_id,vote,created_at) VALUES(?,?,?,?)`);
  const insertReceipt = db.prepare(`INSERT INTO traffic_rating_receipts(fingerprint,user_id,first_received_at) VALUES(?,?,?)`);
  for (let i = 0; i < 9; i += 1) {
    const value = (i + 1).toString(16).padStart(64, 'c');
    additionalFingerprints.push(value);
    insertReport.run(value, `Synthetic training report ${i}`, now, now, now);
    insertVote.run(value, admin, i % 2 ? 'not_relevant' : 'relevant', now);
    insertReceipt.run(value, admin, now);
  }
  insertVote.run(reportFingerprint, admin, 'not_relevant', now);
  insertReceipt.run(reportFingerprint, admin, now);
  refreshVotesAndSvm(db);
  const otherFeedbackId = crypto.randomUUID();
  db.prepare(`INSERT INTO feedback_requests(id,submitter_id,type,title,description,created_at,updated_at)
    VALUES(?,?,'Issue','Privacy fixture','Retain this request.',?,?)`).run(otherFeedbackId, other, now, now);
  db.prepare(`INSERT INTO feedback_events(request_id,actor_id,action,status,created_at) VALUES(?,?,'submitted','Submitted',?)`).run(otherFeedbackId, other, now);
  const legacyReviewVoteId = Number(db.prepare(`INSERT INTO review_votes(fingerprint,vote,voter_id,created_at)
    VALUES(?,'relevant',?,?)`).run(reportFingerprint, String(other), now).lastInsertRowid);
  db.prepare('INSERT INTO auth_audit(user_id,action,created_at,detail) VALUES(?,?,?,?)')
    .run(other, 'fixture_before_anonymization', now, 'synthetic pre-existing audit');
  const registrationInvite = makeInvitation(db, { id: admin });
  const failedRegistrationInvite = makeInvitation(db, { id: admin });
  const expiredRegistrationInvite = makeInvitation(db, { id: admin });
  const usedRegistrationInvite = makeInvitation(db, { id: admin });
  db.prepare('UPDATE invitations SET expires_at=? WHERE id=?').run(new Date(Date.now() - 60_000).toISOString(), expiredRegistrationInvite.id);
  db.prepare('UPDATE invitations SET used_at=?,used_by=? WHERE id=?').run(now, other, usedRegistrationInvite.id);
  db.exec(`CREATE TRIGGER reject_test_registration BEFORE INSERT ON users
    WHEN NEW.username='db-failure'
    BEGIN SELECT RAISE(ABORT, 'SYNTHETIC PRIVATE DATABASE DETAIL'); END`);
  const sessions = Object.fromEntries([pending, other, admin].map((id) => [id, createSession(db, id)]));
  db.close();

  const child = spawn(process.execPath, ['apps/api/server.js'], {
    cwd: path.resolve(import.meta.dirname, '..'),
    env: { ...process.env, ADAS_DB_PATH: dbPath, ADAS_VNEXT_PORT: String(port) },
    stdio: 'ignore', windowsHide: true
  });
  t.after(async () => {
    child.kill();
    await new Promise((resolve) => {
      if (child.exitCode !== null) return resolve();
      child.once('exit', resolve);
      setTimeout(resolve, 2000).unref();
    });
    const resolved = fs.realpathSync(dir);
    assert.ok(resolved.startsWith(fs.realpathSync(os.tmpdir()) + path.sep));
    fs.rmSync(resolved, { recursive: true, force: true });
  });

  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 80 && !ready; i += 1) {
    try { ready = (await fetch(`${base}/health`)).ok; } catch { await new Promise((resolve) => setTimeout(resolve, 50)); }
  }
  assert.equal(ready, true, 'disposable API should start');
  const request = async (route, userId, options = {}) => {
    const session = sessions[userId];
    const headers = { ...(options.body === undefined ? {} : { 'content-type': 'application/json' }), ...(options.headers || {}) };
    if (session && options.auth !== false) headers.cookie = `adas_session=${session.token}; adas_csrf=${session.csrf}`;
    if (session && options.csrf) headers['x-csrf-token'] = session.csrf;
    return fetch(`${base}${route}`, { ...options, headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  };

  const noAuth = await request('/api/feedback/mine', null);
  assert.equal(noAuth.status, 401);
  const reservedName = await request('/api/auth/register', null, { method: 'POST', body: {
    username: 'anonymous-999', password: 'QATest!ReservedName2026', invite_code: 'x'.repeat(32)
  } });
  assert.equal(reservedName.status, 400);
  assert.deepEqual(await reservedName.json(), {
    error: 'Usernames starting with anonymous- are reserved.', code: 'reserved_username'
  });
  const malformedUsername = await request('/api/auth/register', null, { method: 'POST', body: {
    username: 'bad name', password: 'QATest!Registration2026', invite_code: 'x'.repeat(32)
  } });
  assert.equal(malformedUsername.status, 400);
  assert.equal((await malformedUsername.json()).code, 'invalid_username');
  const shortPassword = await request('/api/auth/register', null, { method: 'POST', body: {
    username: 'new-synthetic', password: 'short', invite_code: 'x'.repeat(32)
  } });
  assert.equal(shortPassword.status, 400);
  assert.equal((await shortPassword.json()).code, 'invalid_password');
  const invalidInvite = await request('/api/auth/register', null, { method: 'POST', body: {
    username: 'new-synthetic', password: 'QATest!Registration2026', invite_code: 'x'.repeat(32)
  } });
  assert.equal(invalidInvite.status, 400);
  assert.deepEqual(await invalidInvite.json(), {
    error: 'Invitation code is invalid, expired, or already used.', code: 'invalid_invitation_code'
  });
  for (const [username, invite] of [
    ['expired-attempt', expiredRegistrationInvite], ['used-attempt', usedRegistrationInvite]
  ]) {
    const rejectedInvite = await request('/api/auth/register', null, { method: 'POST', body: {
      username, password: 'QATest!Registration2026', invite_code: invite.code
    } });
    assert.equal(rejectedInvite.status, 400);
    assert.equal((await rejectedInvite.json()).code, 'invalid_invitation_code');
  }
  const duplicateUsername = await request('/api/auth/register', null, { method: 'POST', body: {
    username: 'feedback-other', password: 'QATest!Registration2026', invite_code: registrationInvite.code
  } });
  assert.equal(duplicateUsername.status, 400);
  assert.deepEqual(await duplicateUsername.json(), { error: 'That username is unavailable.', code: 'username_taken' });
  const inviteRecovery = await request('/api/auth/register', null, { method: 'POST', body: {
    username: 'new-synthetic', password: 'QATest!Registration2026', invite_code: registrationInvite.code
  } });
  assert.equal(inviteRecovery.status, 201, 'failed duplicate-name attempt must not consume the invitation');
  const unexpectedRegistrationError = await request('/api/auth/register', null, { method: 'POST', body: {
    username: 'db-failure', password: 'QATest!Registration2026', invite_code: failedRegistrationInvite.code
  } });
  assert.equal(unexpectedRegistrationError.status, 500);
  assert.deepEqual(await unexpectedRegistrationError.json(), {
    error: 'Registration could not be completed.', code: 'registration_failed'
  });
  const databaseFailureRecovery = await request('/api/auth/register', null, { method: 'POST', body: {
    username: 'database-ok', password: 'QATest!Registration2026', invite_code: failedRegistrationInvite.code
  } });
  assert.equal(databaseFailureRecovery.status, 201, 'unexpected database failure must roll back and retain the invitation');
  const noCsrf = await request('/api/feedback', pending, { method: 'POST', body: { type: 'Issue', title: 'Broken filter', description: 'The province filter does not apply.' } });
  assert.equal(noCsrf.status, 403);
  const invalidType = await request('/api/feedback', pending, { method: 'POST', csrf: true, body: { type: 'Other', title: 'Broken filter', description: 'The province filter does not apply.' } });
  assert.equal(invalidType.status, 400);
  const tooLong = await request('/api/feedback', pending, { method: 'POST', csrf: true, body: { type: 'Feature', title: 'x'.repeat(121), description: 'Please add a map view.' } });
  assert.equal(tooLong.status, 400);
  const invalidBounds = [
    { title: 'x'.repeat(4), description: 'A sufficiently long description.' },
    { title: 'Valid title', description: 'x'.repeat(9) },
    { title: 'Valid title', description: 'x'.repeat(4001) },
    { title: 'Valid title', description: 'A sufficiently long description.', context: 'x'.repeat(2001) },
    { title: 123, description: 'A sufficiently long description.' },
    { description: 'A sufficiently long description.' },
    { title: '     ', description: '          ' }
  ];
  for (const body of invalidBounds) {
    const invalid = await request('/api/feedback', admin, { method: 'POST', csrf: true, body: { type: 'Issue', ...body } });
    assert.equal(invalid.status, 400, `expected invalid bounds to reject: ${JSON.stringify({ ...body, description: body.description?.length })}`);
  }
  const adminSession = sessions[admin];
  const oversized = await fetch(`${base}/api/feedback`, { method: 'POST', headers: {
    'content-type': 'application/json', cookie: `adas_session=${adminSession.token}; adas_csrf=${adminSession.csrf}`,
    'x-csrf-token': adminSession.csrf
  }, body: JSON.stringify({ type: 'Issue', title: 'Valid title', description: 'x'.repeat(17_000) }) });
  assert.equal(oversized.status, 413);
  const exactBounds = await request('/api/feedback', admin, { method: 'POST', csrf: true, body: {
    type: 'Feature', title: '  Title  ', description: `  ${'d'.repeat(4000)}  `, context: 'c'.repeat(2000)
  } });
  assert.equal(exactBounds.status, 201);
  const normalizedBoundary = (await exactBounds.json()).data;
  assert.equal(normalizedBoundary.title, 'Title');
  assert.equal(normalizedBoundary.description.length, 4000);
  assert.equal(normalizedBoundary.context.length, 2000);
  const maximumTitle = await request('/api/feedback', admin, { method: 'POST', csrf: true, body: {
    type: 'Feature', title: 'T'.repeat(120), description: 'D'.repeat(10)
  } });
  assert.equal(maximumTitle.status, 201);
  assert.equal((await maximumTitle.json()).data.title.length, 120);
  const unicodeBounds = await request('/api/feedback', admin, { method: 'POST', csrf: true, body: {
    type: 'Issue', title: '🚗🚗🚗', description: '🚗'.repeat(5)
  } });
  assert.equal(unicodeBounds.status, 201, 'server validation counts JavaScript UTF-16 code units, matching HTML minlength');
  const tooShortUnicode = await request('/api/feedback', admin, { method: 'POST', csrf: true, body: {
    type: 'Issue', title: '🚗🚗', description: 'A sufficiently long description.'
  } });
  assert.equal(tooShortUnicode.status, 400);
  const created = await request('/api/feedback', pending, { method: 'POST', csrf: true, body: { type: 'Issue', title: 'Broken filter', description: 'The province filter does not apply.', context: 'Selecting Guangdong leaves all rows visible.' } });
  assert.equal(created.status, 201);
  const { data: item } = await created.json();
  assert.match(item.id, /^[0-9a-f-]{36}$/i);
  assert.equal(item.status, 'Submitted');
  const mine = await request('/api/feedback/mine', pending);
  assert.equal((await mine.json()).data[0].history[0].action, 'submitted');
  const otherList = await request('/api/feedback/mine', other);
  const otherItems = (await otherList.json()).data;
  assert.deepEqual(new Set(otherItems.map(({ id }) => id)), new Set([otherFeedbackId]));
  const notAdminQueue = await request('/api/admin/feedback', other);
  assert.equal(notAdminQueue.status, 403);
  const unboundedQueue = await request('/api/admin/feedback?limit=201', admin);
  assert.equal(unboundedQueue.status, 400);
  const invalidOffset = await request('/api/admin/feedback?offset=-1', admin);
  assert.equal(invalidOffset.status, 400);
  const excessiveOffset = await request('/api/admin/feedback?offset=1000001', admin);
  assert.equal(excessiveOffset.status, 400);

  const badAccept = await request(`/api/admin/feedback/${item.id}`, admin, { method: 'PATCH', csrf: true, body: { status: 'Added to backlog' } });
  assert.equal(badAccept.status, 400);
  const nonexistentBacklog = await request(`/api/admin/feedback/${item.id}`, admin, { method: 'PATCH', csrf: true, body: { status: 'Added to backlog', backlog_ids: ['MADE-UP-999'] } });
  assert.equal(nonexistentBacklog.status, 400);
  const triaged = await request(`/api/admin/feedback/${item.id}`, admin, { method: 'PATCH', csrf: true, body: {
    expected_version: item.triage_version, status: 'Added to backlog', priority: 'normal', backlog_ids: ['FEEDBACK-02'],
    public_update: 'Accepted for engineering consideration.', internal_notes: 'Private triage detail.'
  } });
  assert.equal(triaged.status, 200);
  const adminItem = (await triaged.json()).data;
  assert.equal(adminItem.internal_notes, 'Private triage detail.');
  assert.equal(adminItem.submitter, 'feedback-pending');
  assert.deepEqual(adminItem.backlog_ids, ['FEEDBACK-02']);
  assert.equal(adminItem.history.at(-1).actor, 'feedback-admin');
  assert.ok(adminItem.triage_version >= 2);
  const filteredQueue = await request('/api/admin/feedback?status=Added%20to%20backlog&type=Issue&limit=1', admin);
  assert.equal((await filteredQueue.json()).data.length, 1);

  const submitterView = await request('/api/feedback/mine', pending);
  const publicItem = (await submitterView.json()).data[0];
  assert.equal(publicItem.public_update, 'Accepted for engineering consideration.');
  assert.equal('internal_notes' in publicItem, false);
  assert.equal(JSON.stringify(publicItem).includes('Private triage detail.'), false);
  const priorityOnly = await request(`/api/admin/feedback/${item.id}`, admin, { method: 'PATCH', csrf: true, body: { expected_version: adminItem.triage_version, priority: 'high' } });
  assert.equal(priorityOnly.status, 200);
  const priorityUpdated = (await priorityOnly.json()).data;
  assert.equal(priorityUpdated.public_update, 'Accepted for engineering consideration.');
  const duplicateRequest = await request('/api/feedback', pending, { method: 'POST', csrf: true, body: { type: 'Issue', title: 'Duplicate cycle probe', description: 'This is a cycle validation request.' } });
  const duplicateId = (await duplicateRequest.json()).data.id;
  const missingReason = await request(`/api/admin/feedback/${duplicateId}`, admin, { method: 'PATCH', csrf: true, body: { status: 'Not planned' } });
  assert.equal(missingReason.status, 400);
  const validDuplicate = await request(`/api/admin/feedback/${duplicateId}`, admin, { method: 'PATCH', csrf: true, body: { expected_version: 1, status: 'Duplicate', duplicate_of: item.id, public_update: 'This request matches the earlier report.' } });
  assert.equal(validDuplicate.status, 200);
  const submitterDuplicate = (await (await request('/api/feedback/mine', pending)).json()).data.find(({ id }) => id === duplicateId);
  assert.equal(submitterDuplicate.duplicate_of, item.id, 'submitter API exposes only the linked primary ID needed by the Duplicate card');
  assert.equal('internal_notes' in submitterDuplicate, false);
  const duplicateCycle = await request(`/api/admin/feedback/${item.id}`, admin, { method: 'PATCH', csrf: true, body: { expected_version: priorityUpdated.triage_version, status: 'Duplicate', duplicate_of: duplicateId, public_update: 'This should be rejected as a cycle.' } });
  assert.equal(duplicateCycle.status, 400);
  const guessedOtherId = await request(`/api/admin/feedback/${item.id}`, other, { method: 'PATCH', csrf: true, body: { status: 'Complete' } });
  assert.equal(guessedOtherId.status, 403);

  const staleCreate = await request('/api/feedback', admin, { method: 'POST', csrf: true, body: {
    type: 'Issue', title: 'Stale editor protection', description: 'Two editors must not overwrite newer triage.'
  } });
  const staleItem = (await staleCreate.json()).data;
  const tabASave = await request(`/api/admin/feedback/${staleItem.id}`, admin, { method: 'PATCH', csrf: true, body: {
    expected_version: staleItem.triage_version, status: 'Under review', priority: 'high',
    public_update: 'The team is reviewing this.', internal_notes: 'Note from editor A.', backlog_ids: ['FEEDBACK-02']
  } });
  assert.equal(tabASave.status, 200);
  const tabALatest = (await tabASave.json()).data;
  const tabBStale = await request(`/api/admin/feedback/${staleItem.id}`, admin, { method: 'PATCH', csrf: true, body: {
    expected_version: staleItem.triage_version, internal_notes: 'Note from editor B.'
  } });
  assert.equal(tabBStale.status, 409);
  const conflict = await tabBStale.json();
  assert.equal(conflict.code, 'feedback_conflict');
  assert.equal(conflict.data.triage_version, tabALatest.triage_version);
  assert.equal(conflict.data.status, 'Under review');
  assert.equal(conflict.data.priority, 'high');
  assert.equal(conflict.data.public_update, 'The team is reviewing this.');
  assert.equal(conflict.data.internal_notes, 'Note from editor A.');
  assert.deepEqual(conflict.data.backlog_ids, ['FEEDBACK-02']);
  assert.equal(conflict.data.history.length, 2, 'stale write adds no event');
  const tabBRebasedSave = await request(`/api/admin/feedback/${staleItem.id}`, admin, { method: 'PATCH', csrf: true, body: {
    expected_version: conflict.data.triage_version, internal_notes: 'Note from editor B.'
  } });
  assert.equal(tabBRebasedSave.status, 200);
  const rebasedRow = (await tabBRebasedSave.json()).data;
  assert.equal(rebasedRow.status, 'Under review');
  assert.equal(rebasedRow.priority, 'high');
  assert.equal(rebasedRow.public_update, 'The team is reviewing this.');
  assert.equal(rebasedRow.internal_notes, 'Note from editor B.');
  assert.equal(rebasedRow.history.length, 3);
  assert.equal(rebasedRow.history[2].public_update, '', 'private-note-only save does not repeat the prior public update as a new event');
  const submitterHistory = (await (await request('/api/feedback/mine', admin)).json()).data.find(({ id }) => id === staleItem.id).history;
  assert.equal(submitterHistory.filter((event) => event.public_update).length, 1, 'member history contains only the explicitly published update');

  const sameFieldConflict = await request(`/api/admin/feedback/${staleItem.id}`, admin, { method: 'PATCH', csrf: true, body: {
    expected_version: conflict.data.triage_version, priority: 'low'
  } });
  assert.equal(sameFieldConflict.status, 409);
  const sameFieldData = await sameFieldConflict.json();
  assert.equal(sameFieldData.data.priority, 'high', 'latest server value is returned for same-field conflict');
  assert.equal(sameFieldData.data.history.length, 3, 'same-field stale attempt adds no event');
  const explicitRetry = await request(`/api/admin/feedback/${staleItem.id}`, admin, { method: 'PATCH', csrf: true, body: {
    expected_version: sameFieldData.data.triage_version, priority: 'low'
  } });
  assert.equal(explicitRetry.status, 200, 'explicit save against refreshed version applies the retained same-field edit');
  assert.equal((await explicitRetry.json()).data.priority, 'low');

  const noOpSave = await request(`/api/admin/feedback/${staleItem.id}`, admin, { method: 'PATCH', csrf: true, body: {
    expected_version: 4, internal_notes: 'Note from editor B.  ', backlog_ids: [' FEEDBACK-02 ']
  } });
  assert.equal(noOpSave.status, 400, 'whitespace-only normalized values are rejected as a no-op');
  assert.match((await noOpSave.json()).error, /No effective feedback changes/);
  const noOpCheck = (await (await request('/api/admin/feedback', admin)).json()).data.find(({ id }) => id === staleItem.id);
  assert.equal(noOpCheck.triage_version, 4, 'no-op does not advance the triage version');
  assert.equal(noOpCheck.history.length, 4, 'no-op does not append a triage event');
  const emptyAnnouncement = await request(`/api/admin/feedback/${staleItem.id}`, admin, { method: 'PATCH', csrf: true, body: {
    expected_version: 4, public_update: '   '
  } });
  assert.equal(emptyAnnouncement.status, 400, 'whitespace-only public update is not a clearing action');
  const afterEmptyAnnouncement = (await (await request('/api/admin/feedback', admin)).json()).data.find(({ id }) => id === staleItem.id);
  assert.equal(afterEmptyAnnouncement.public_update, 'The team is reviewing this.', 'blank update preserves the latest member-visible announcement');
  assert.equal(afterEmptyAnnouncement.triage_version, 4);
  assert.equal(afterEmptyAnnouncement.history.length, 4);

  const legacyId = crypto.randomUUID();
  const legacyDb = openDb(dbPath);
  const legacyNow = new Date().toISOString();
  legacyDb.prepare(`INSERT INTO feedback_requests(id,submitter_id,type,title,description,status,created_at,updated_at)
    VALUES(?,?,'Issue','Legacy status request','A request created before the status was retired.','Needs information',?,?)`)
    .run(legacyId, other, legacyNow, legacyNow);
  legacyDb.close();
  const retiredStatusRejected = await request(`/api/admin/feedback/${duplicateId}`, admin, { method: 'PATCH', csrf: true, body: {
    expected_version: 2, status: 'Needs information', public_update: 'Please add more details.'
  } });
  assert.equal(retiredStatusRejected.status, 400);
  const retiredStatusFilter = await request('/api/admin/feedback?status=Needs%20information', admin);
  assert.equal(retiredStatusFilter.status, 400);
  const legacyPublic = (await (await request('/api/feedback/mine', other)).json()).data.find(({ id }) => id === legacyId);
  assert.equal(legacyPublic.status, 'Needs information');
  const legacyNoUpdate = await request(`/api/admin/feedback/${legacyId}`, admin, { method: 'PATCH', csrf: true, body: { expected_version: 1, status: 'Under review' } });
  assert.equal(legacyNoUpdate.status, 400);
  const legacyUpdated = await request(`/api/admin/feedback/${legacyId}`, admin, { method: 'PATCH', csrf: true, body: {
    expected_version: 1, public_update: 'Please share the missing details in a new update.'
  } });
  assert.equal(legacyUpdated.status, 200);
  const legacyAdminData = (await legacyUpdated.json()).data;
  assert.equal(legacyAdminData.status, 'Under review');
  assert.equal(legacyAdminData.history.at(-1).status, 'Under review');
  assert.equal(legacyAdminData.public_update, 'Please share the missing details in a new update.');

  const reopenedDb = openDb(dbPath);
  assert.throws(() => reopenedDb.prepare('UPDATE feedback_events SET action=? WHERE request_id=?').run('tampered', item.id), /append-only/);
  reopenedDb.close();
  for (let i = 0; i < 7; i += 1) {
    const response = await request('/api/feedback', pending, { method: 'POST', csrf: true, body: { type: 'Feature', title: `Feature ${i}`, description: 'A bounded rate test request.' } });
    assert.equal(response.status, 201);
  }
  const tenth = await request('/api/feedback', pending, { method: 'POST', csrf: true, body: { type: 'Feature', title: 'Tenth request', description: 'This request reaches the rate limit.' } });
  assert.equal(tenth.status, 201);
  const rateLimited = await request('/api/feedback', pending, { method: 'POST', csrf: true, body: { type: 'Feature', title: 'One more feature', description: 'This request exceeds the rate limit.' } });
  assert.equal(rateLimited.status, 429);
  const seedDb = openDb(dbPath);
  const insertSeed = seedDb.prepare(`INSERT INTO feedback_requests(id,submitter_id,type,title,description,status,created_at,updated_at)
    VALUES(?,?,'Feature',?,'Pagination fixture','Submitted',?,?)`);
  const seededIds = [];
  for (let i = 0; i < 105; i += 1) {
    const id = crypto.randomUUID();
    seededIds.push(id);
    const timestamp = new Date(Date.UTC(2027, 0, 1) - i * 1000).toISOString();
    insertSeed.run(id, pending, `Queue seed ${i}`, timestamp, timestamp);
  }
  seedDb.close();
  const firstPage = await request('/api/admin/feedback?limit=100&offset=0', admin);
  const secondPage = await request('/api/admin/feedback?limit=100&offset=100', admin);
  const firstItems = (await firstPage.json()).data;
  const secondItems = (await secondPage.json()).data;
  assert.equal(firstItems.length, 100);
  assert.equal(secondItems.length, 21);
  assert.deepEqual(firstItems.map(({ id }) => id), seededIds.slice(0, 100));
  assert.deepEqual(secondItems.slice(0, 5).map(({ id }) => id), seededIds.slice(100));

  assert.equal((await request(`/api/admin/users/${other}/anonymize`, admin, { method: 'POST', csrf: true })).status, 400, 'active accounts must not be anonymized');
  assert.equal((await request(`/api/admin/users/${other}/votes`, admin, { method: 'DELETE', csrf: true })).status, 400, 'votes remain until account anonymization');
  assert.equal((await request(`/api/admin/users/${other}`, admin, { method: 'PATCH', csrf: true, body: { role: 'member', approved: true, active: false } })).status, 200);
  const anonymized = await request(`/api/admin/users/${other}/anonymize`, admin, { method: 'POST', csrf: true });
  assert.equal(anonymized.status, 200);
  const usersAfterAnonymize = (await (await request('/api/admin/users', admin)).json()).data;
  const anonymousUser = usersAfterAnonymize.find(({ id }) => id === other);
  assert.equal(anonymousUser.username, `anonymous-${other}-1`, 'legacy alias collision gets a distinct anonymized label');
  assert.equal(anonymousUser.anonymized, true);
  assert.equal(anonymousUser.vote_count, 1);
  const retainedDb = openDb(dbPath);
  assert.equal(retainedDb.prepare('SELECT submitter_id FROM feedback_requests WHERE id=?').get(otherFeedbackId).submitter_id, other);
  assert.equal(retainedDb.prepare('SELECT COUNT(*) AS n FROM feedback_events WHERE request_id=?').get(otherFeedbackId).n, 1);
  assert.equal(retainedDb.prepare('SELECT COUNT(*) AS n FROM auth_audit WHERE user_id=? AND action=?').get(other, 'fixture_before_anonymization').n, 1);
  assert.equal(retainedDb.prepare(`SELECT u.username FROM auth_audit a JOIN users u ON u.id=a.user_id
    WHERE a.user_id=? AND a.action='fixture_before_anonymization'`).get(other).username, `anonymous-${other}-1`);
  assert.equal(retainedDb.prepare('SELECT COUNT(*) AS n FROM review_votes WHERE id=?').get(legacyReviewVoteId).n, 1);
  retainedDb.close();
  assert.equal((await request('/api/feedback/mine', other)).status, 401, 'old sessions stop working');
  assert.equal((await request(`/api/admin/users/${other}`, admin, { method: 'PATCH', csrf: true, body: { role: 'member', approved: true, active: true } })).status, 400, 'anonymized identities cannot be restored');
  const prematureVoteDelete = await request(`/api/admin/users/${pending}/votes`, admin, { method: 'DELETE', csrf: true });
  assert.equal(prematureVoteDelete.status, 400, 'vote deletion is restricted to anonymized accounts');
  const modelCountBeforeDelete = (() => { const readDb = openDb(dbPath); const count = readDb.prepare('SELECT COUNT(*) AS n FROM traffic_svm_models').get().n; readDb.close(); return count; })();
  const failedRebuildDb = openDb(dbPath);
  failedRebuildDb.exec("CREATE TRIGGER fail_admin_vote_rebuild BEFORE UPDATE OF traffic_svm_score ON reports BEGIN SELECT RAISE(ABORT,'injected rebuild failure'); END");
  failedRebuildDb.close();
  const failedVoteDelete = await request(`/api/admin/users/${other}/votes`, admin, { method: 'DELETE', csrf: true });
  assert.equal(failedVoteDelete.status, 400);
  const rollbackDb = openDb(dbPath);
  assert.equal(rollbackDb.prepare('SELECT COUNT(*) AS n FROM traffic_votes WHERE user_id=?').get(other).n, 1, 'vote deletion rolls back with failed score rebuild');
  assert.equal(rollbackDb.prepare('SELECT COUNT(*) AS n FROM traffic_rating_receipts WHERE user_id=?').get(other).n, 1);
  assert.equal(rollbackDb.prepare('SELECT COUNT(*) AS n FROM traffic_svm_models').get().n, modelCountBeforeDelete);
  rollbackDb.exec('DROP TRIGGER fail_admin_vote_rebuild');
  rollbackDb.close();
  const deletedVotes = await request(`/api/admin/users/${other}/votes`, admin, { method: 'DELETE', csrf: true });
  assert.deepEqual(await deletedVotes.json(), { deleted: 1 });
  const deletedDb = openDb(dbPath);
  assert.equal(deletedDb.prepare('SELECT COUNT(*) AS n FROM traffic_votes WHERE user_id=?').get(other).n, 0);
  assert.equal(deletedDb.prepare('SELECT COUNT(*) AS n FROM traffic_rating_receipts WHERE user_id=?').get(other).n, 0);
  assert.equal(deletedDb.prepare('SELECT COUNT(*) AS n FROM feedback_requests WHERE id=?').get(otherFeedbackId).n, 1);
  assert.equal(deletedDb.prepare("SELECT COUNT(*) AS n FROM auth_audit WHERE action='delete_anonymized_user_votes'").get().n, 1);
  const derived = deletedDb.prepare('SELECT labels_json,traffic_svm_score,traffic_svm_model_id FROM reports WHERE fingerprint=?').get(reportFingerprint);
  const labels = JSON.parse(derived.labels_json);
  assert.deepEqual(labels.community_votes, { relevant: 0, not_relevant: 1 });
  assert.equal(labels.community_relevance, 'rejected');
  assert.ok(derived.traffic_svm_score !== null);
  assert.ok(derived.traffic_svm_model_id > 0);
  assert.equal(deletedDb.prepare('SELECT COUNT(*) AS n FROM traffic_svm_models').get().n, modelCountBeforeDelete + 1);
  assert.equal(deletedDb.prepare('SELECT COUNT(*) AS n FROM review_votes WHERE id=?').get(legacyReviewVoteId).n, 1, 'legacy vote records are outside this delete action');
  assert.equal(deletedDb.prepare('SELECT COUNT(*) AS n FROM auth_audit WHERE user_id=? AND action=?').get(other, 'fixture_before_anonymization').n, 1, 'pre-existing audit records remain attached to the anonymized identity');
  deletedDb.close();
});
