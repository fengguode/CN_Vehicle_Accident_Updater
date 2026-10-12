import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createSession, migrateAuth } from '../apps/api/auth.js';
import { openDb } from '../src/db.js';

async function freePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => listener.listen(0, '127.0.0.1', resolve).once('error', reject));
  const { port } = listener.address();
  await new Promise((resolve) => listener.close(resolve));
  return port;
}

test('admin media review actions are authorized, audited, and gate public thumbnails', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext-media-review-'));
  const dbPath = path.join(dir, 'review.sqlite');
  const port = await freePort();
  const db = openDb(dbPath);
  migrateAuth(db);
  assert.ok(db.prepare('SELECT 1 FROM schema_migrations WHERE version=11').get());
  const now = new Date().toISOString();
  const addUser = (username, role) => Number(db.prepare(`INSERT INTO users(username,password_salt,password_hash,role,active,approved,created_at)
    VALUES(?, 'salt', 'hash', ?, 1, 1, ?)`).run(username, role, now).lastInsertRowid);
  const member = addUser('media-member', 'member');
  const admin = addUser('media-admin', 'admin');
  const insertReport = db.prepare(`INSERT INTO reports(fingerprint,source_url,source_name,title,content,collected_at,raw_json,created_at,updated_at,
      video_status,video_thumbnail_url,media_review_status)
    VALUES(?,?,'fixture',?,'content',?,'{"private_raw_marker":"DO_NOT_LEAK"}',?,?,?,?,'pending')`);
  const approvedFp = 'a'.repeat(64);
  const rejectedFp = 'b'.repeat(64);
  const removedFp = 'c'.repeat(64);
  const noVideoFp = 'd'.repeat(64);
  const blockedFp = 'e'.repeat(64);
  const noCoverFp = 'f'.repeat(64);
  const candidateUrl = 'https://video-cdn.example.test/cover.webp';
  insertReport.run(approvedFp, 'https://source.example.test/post/1', 'Approve fixture', now, now, now, 'present', candidateUrl);
  insertReport.run(rejectedFp, 'https://source.example.test/post/2', 'Reject fixture', now, now, now, 'present', candidateUrl);
  insertReport.run(removedFp, 'https://source.example.test/post/3', 'Remove fixture', now, now, now, 'present', candidateUrl);
  insertReport.run(noVideoFp, 'https://source.example.test/post/4', 'No video fixture', now, now, now, 'unknown', candidateUrl);
  insertReport.run(blockedFp, 'https://source.example.test/post/5', 'Blocked origin fixture', now, now, now, 'present', 'https://unconfigured.example.test/cover.webp');
  insertReport.run(noCoverFp, 'https://source.example.test/post/6', 'Missing cover fixture', now, now, now, 'present', null);
  const sessions = { [member]: createSession(db, member), [admin]: createSession(db, admin) };
  const reportIds = Object.fromEntries(db.prepare('SELECT fingerprint,id FROM reports').all().map(({ fingerprint, id }) => [fingerprint, id]));
  db.close();

  const child = spawn(process.execPath, ['apps/api/server.js'], {
    cwd: path.resolve(import.meta.dirname, '..'),
    env: { ...process.env, ADAS_DB_PATH: dbPath, ADAS_VNEXT_PORT: String(port), VIDEO_THUMBNAIL_ALLOWED_ORIGINS: 'https://video-cdn.example.test' },
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
  assert.equal(ready, true, 'isolated API starts');
  const request = (route, userId, options = {}) => {
    const session = userId ? sessions[userId] : null;
    const headers = { ...(options.body === undefined ? {} : { 'content-type': 'application/json' }), ...(options.headers || {}) };
    if (session && options.auth !== false) headers.cookie = `adas_session=${session.token}; adas_csrf=${session.csrf}`;
    if (session && options.csrf) headers['x-csrf-token'] = session.csrf;
    return fetch(`${base}${route}`, { ...options, headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  };

  assert.equal((await request('/api/admin/media-review', null)).status, 401, 'queue requires authentication');
  assert.equal((await request('/api/admin/media-review', member)).status, 403, 'queue is admin-only');
  const initial = await request('/api/admin/media-review?status=pending', admin);
  assert.equal(initial.status, 200);
  const initialBody = await initial.json();
  assert.equal(initialBody.data.length, 5, 'only explicit video candidates are listed');
  assert.equal(JSON.stringify(initialBody).includes('DO_NOT_LEAK'), false, 'raw_json is not exposed');
  assert.equal('raw_json' in initialBody.data[0], false);
  const blockedCandidate = initialBody.data.find(({ fingerprint }) => fingerprint === blockedFp);
  assert.equal(blockedCandidate.video_thumbnail_url, null, 'unconfigured origin URL is withheld from the admin queue');
  assert.equal(blockedCandidate.thumbnail_policy_blocked, true);
  const missingCover = initialBody.data.find(({ fingerprint }) => fingerprint === noCoverFp);
  assert.equal(missingCover.video_thumbnail_url, null);
  assert.equal(missingCover.thumbnail_policy_blocked, false, 'missing cover is not mislabeled as an origin-policy block');
  assert.equal((await request(`/api/admin/media-review/${reportIds[approvedFp]}/approve`, admin, { method: 'POST' })).status, 403, 'mutations require CSRF');
  assert.equal((await request(`/api/admin/media-review/${reportIds[approvedFp]}/approve`, null, { method: 'POST' })).status, 401, 'mutations require authentication');
  assert.equal((await request(`/api/admin/media-review/${reportIds[approvedFp]}/approve`, member, { method: 'POST', csrf: true })).status, 403, 'members cannot review');
  assert.equal((await request('/api/admin/media-review/not-an-id/approve', admin, { method: 'POST', csrf: true })).status, 400);
  assert.equal((await request(`/api/admin/media-review/${reportIds[noVideoFp]}/approve`, admin, { method: 'POST', csrf: true })).status, 404, 'non-video report cannot be reviewed');
  const blockedApproval = await request(`/api/admin/media-review/${reportIds[blockedFp]}/approve`, admin, { method: 'POST', csrf: true });
  assert.equal(blockedApproval.status, 400, 'uninspectable origin cannot be approved');
  assert.equal((await blockedApproval.json()).error, 'Thumbnail origin is not enabled for review.');
  assert.equal((await request(`/api/admin/media-review/${reportIds[approvedFp]}/bogus`, admin, { method: 'POST', csrf: true })).status, 400);
  const reportList = async () => (await (await request('/api/reports?page_size=100', admin)).json()).data;
  const thumbnail = (rows, fingerprint) => rows.find((row) => row.fingerprint === fingerprint)?.media?.thumbnail_url ?? null;
  assert.equal(thumbnail(await reportList(), approvedFp), null, 'pending candidate is not publicly exposed');

  const unsafeDb = openDb(dbPath);
  unsafeDb.prepare('UPDATE reports SET video_thumbnail_url=? WHERE id=?').run('http://video-cdn.example.test/unsafe.jpg', reportIds[approvedFp]);
  unsafeDb.close();
  const unsafeApproval = await request(`/api/admin/media-review/${reportIds[approvedFp]}/approve`, admin, { method: 'POST', csrf: true });
  assert.equal(unsafeApproval.status, 400, 'approval requires a valid HTTPS candidate');
  const restoreDb = openDb(dbPath);
  restoreDb.prepare('UPDATE reports SET video_thumbnail_url=? WHERE id=?').run(candidateUrl, reportIds[approvedFp]);
  restoreDb.close();

  const approved = await request(`/api/admin/media-review/${reportIds[approvedFp]}/approve`, admin, { method: 'POST', csrf: true });
  assert.equal(approved.status, 200);
  assert.equal((await approved.json()).data.review_status, 'approved');
  assert.equal(thumbnail(await reportList(), approvedFp), candidateUrl, 'approved URL is exposed only under configured exact-origin policy');
  const rejected = await request(`/api/admin/media-review/${reportIds[rejectedFp]}/reject`, admin, { method: 'POST', csrf: true });
  assert.equal(rejected.status, 200);
  assert.equal((await rejected.json()).data.review_status, 'rejected');
  assert.equal(thumbnail(await reportList(), rejectedFp), null, 'rejection suppresses public exposure');
  const removed = await request(`/api/admin/media-review/${reportIds[removedFp]}/remove`, admin, { method: 'POST', csrf: true });
  assert.equal(removed.status, 200);
  assert.equal((await removed.json()).data.thumbnail_url, null);
  assert.equal(thumbnail(await reportList(), removedFp), null, 'removal clears public media URL');

  const eventsResponse = await request(`/api/admin/media-review/${reportIds[approvedFp]}/events`, admin);
  assert.equal(eventsResponse.status, 200);
  const events = (await eventsResponse.json()).data;
  assert.equal(events.length, 1);
  assert.equal(events[0].actor_id, admin);
  assert.equal(events[0].action, 'approve');
  assert.equal(JSON.parse(events[0].old_state).review_status, 'pending');
  assert.equal(JSON.parse(events[0].new_state).review_status, 'approved');
  const removedEvents = (await (await request(`/api/admin/media-review/${reportIds[removedFp]}/events`, admin)).json()).data;
  assert.deepEqual(removedEvents.map(({ action }) => action), ['remove']);
  const reopened = openDb(dbPath);
  assert.throws(() => reopened.prepare('UPDATE media_review_events SET action=? WHERE report_id=?').run('reject', reportIds[approvedFp]), /append-only/);
  assert.throws(() => reopened.prepare('DELETE FROM media_review_events WHERE report_id=?').run(reportIds[approvedFp]), /append-only/);
  const removedReport = reopened.prepare('SELECT video_thumbnail_url,media_review_status FROM reports WHERE id=?').get(reportIds[removedFp]);
  assert.equal(removedReport.video_thumbnail_url, null);
  assert.equal(removedReport.media_review_status, 'rejected');
  reopened.close();
  const invalidStatus = await request('/api/admin/media-review?status=untrusted', admin);
  assert.equal(invalidStatus.status, 400);
  const invalidLimit = await request('/api/admin/media-review?limit=101', admin);
  assert.equal(invalidLimit.status, 400);
  const paginationDb = openDb(dbPath);
  const insertPaginationReport = paginationDb.prepare(`INSERT INTO reports(fingerprint,source_url,source_name,title,content,collected_at,raw_json,created_at,updated_at,
      video_status,video_thumbnail_url,media_review_status)
    VALUES(?,?,'fixture',?,'content',?,'{}',?,?,? ,?,'pending')`);
  for (const status of ['pending', 'approved', 'rejected']) {
    const pageRows = [];
    for (let index = 0; index < 205; index += 1) {
      const fingerprint = `${status[0]}${String(index).padStart(63, '0')}`;
      const result = insertPaginationReport.run(fingerprint, `https://source.example.test/${status}/${index}`, `Pagination ${status} ${index}`, now, now, now, 'present', candidateUrl);
      pageRows.push(Number(result.lastInsertRowid));
    }
    paginationDb.prepare('UPDATE reports SET media_review_status=?,media_reviewed_by=?,media_reviewed_at=? WHERE id>=? AND id<=?')
      .run(status, status === 'pending' ? null : admin, status === 'pending' ? null : now, pageRows[0], pageRows.at(-1));

    const collectedIds = [];
    const expectedIds = paginationDb.prepare(`SELECT id FROM reports WHERE video_status='present' AND media_review_status=? AND id<=? ORDER BY id DESC`)
      .all(status, pageRows.at(-1)).map(({ id }) => Number(id));
    let cursor;
    let pageNumber = 0;
    do {
      const query = new URLSearchParams({ status, limit: '100' });
      if (cursor) query.set('cursor', cursor);
      const response = await request(`/api/admin/media-review?${query}`, admin);
      assert.equal(response.status, 200);
      const page = await response.json();
      assert.ok(page.data.length <= 100, 'each candidate page is bounded to at most 100 rows');
      const ids = page.data.map(({ report_id }) => report_id);
      assert.ok(ids.every((id, index) => index === 0 || ids[index - 1] > id), 'each page is strictly newest-first');
      if (collectedIds.length) assert.ok(collectedIds.at(-1) > ids[0], 'the next page continues strictly older than the previous page');
      collectedIds.push(...ids);
      cursor = page.next_cursor;
      pageNumber += 1;
      if (pageNumber === 1) {
        const injectedFp = `${status[0]}${'9'.repeat(63)}`;
        insertPaginationReport.run(injectedFp, `https://source.example.test/${status}/newer`, `Pagination newer ${status}`, now, now, now, 'present', candidateUrl);
      }
    } while (cursor);
    assert.equal(pageNumber, 3, '205 candidates are returned in 100, 100, and 5 row pages');
    assert.equal(collectedIds.length, expectedIds.length);
    assert.equal(new Set(collectedIds).size, expectedIds.length, 'cursor traversal has no duplicate candidates');
    assert.deepEqual(collectedIds, expectedIds, 'cursor traversal neither skips nor reorders the filtered candidates present at its starting boundary');
    assert.ok(!collectedIds.includes(Number(paginationDb.prepare('SELECT id FROM reports WHERE fingerprint=?').get(`${status[0]}${'9'.repeat(63)}`).id)), 'newer rows inserted during traversal do not shift the cursor window');
  }
  const malformedCursor = await request('/api/admin/media-review?cursor=1.5', admin);
  assert.equal(malformedCursor.status, 400);
  const zeroCursor = await request('/api/admin/media-review?cursor=0', admin);
  assert.equal(zeroCursor.status, 400);
  const unsafeCursor = await request('/api/admin/media-review?cursor=9007199254740992', admin);
  assert.equal(unsafeCursor.status, 400);
  paginationDb.close();
});
