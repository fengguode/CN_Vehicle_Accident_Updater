import assert from 'node:assert/strict';
import crypto from 'node:crypto';
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

test('feedback idempotency is submitter-scoped, payload-bound, and durable across API restart', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext-feedback-idempotency-'));
  const dbPath = path.join(dir, 'feedback.sqlite');
  const port = await freePort();
  const db = openDb(dbPath);
  migrateAuth(db);
  assert.ok(db.prepare('SELECT 1 FROM schema_migrations WHERE version=12').get(), 'idempotency migration is recorded');
  const now = new Date().toISOString();
  const addUser = (name) => Number(db.prepare(`INSERT INTO users(username,password_salt,password_hash,role,active,approved,created_at)
    VALUES(?, 'salt', 'hash', 'member', 1, 1, ?)`).run(name, now).lastInsertRowid);
  const userA = addUser('idem-member-a');
  const userB = addUser('idem-member-b');
  const sessions = Object.fromEntries([userA, userB].map((id) => [id, createSession(db, id)]));
  db.close();

  let child;
  const start = async () => {
    child = spawn(process.execPath, ['apps/api/server.js'], {
      cwd: path.resolve(import.meta.dirname, '..'),
      env: { ...process.env, ADAS_DB_PATH: dbPath, ADAS_VNEXT_PORT: String(port) },
      stdio: 'ignore', windowsHide: true
    });
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let i = 0; i < 100 && !ready; i += 1) {
      try { ready = (await fetch(`${base}/health`)).ok; } catch { await new Promise((resolve) => setTimeout(resolve, 50)); }
    }
    assert.equal(ready, true, 'isolated API starts');
    return base;
  };
  const stop = async () => {
    if (!child || child.exitCode !== null) return;
    child.kill();
    await new Promise((resolve) => {
      child.once('exit', resolve);
      setTimeout(resolve, 2000).unref();
    });
  };
  t.after(async () => {
    await stop();
    const resolved = fs.realpathSync(dir);
    assert.ok(resolved.startsWith(fs.realpathSync(os.tmpdir()) + path.sep));
    fs.rmSync(resolved, { recursive: true, force: true });
  });

  let base = await start();
  const request = (route, userId, body, idempotencyKey) => {
    const session = sessions[userId];
    return fetch(`${base}${route}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `adas_session=${session.token}; adas_csrf=${session.csrf}`,
        'x-csrf-token': session.csrf,
        'idempotency-key': idempotencyKey
      },
      body: JSON.stringify(body)
    });
  };
  const key = crypto.randomUUID();
  const payload = { type: 'Issue', title: '  Retry-safe feedback  ', description: '  Replaying this request must create one receipt.  ', context: '  Steps to reproduce.  ' };
  const first = await request('/api/feedback', userA, payload, key);
  assert.equal(first.status, 201);
  const firstItem = (await first.json()).data;

  await stop();
  base = await start();
  const replay = await request('/api/feedback', userA, {
    ...payload, title: payload.title.trim(), description: payload.description.trim(), context: payload.context.trim()
  }, key);
  assert.equal(replay.status, 200, 'same normalized payload replays the original receipt');
  assert.equal((await replay.json()).data.id, firstItem.id);

  const mismatch = await request('/api/feedback', userA, { ...payload, title: 'Changed title' }, key);
  assert.equal(mismatch.status, 409);
  assert.equal((await mismatch.json()).code, 'idempotency_key_conflict');

  const sameKeyOtherUser = await request('/api/feedback', userB, payload, key);
  assert.equal(sameKeyOtherUser.status, 201, 'another submitter gets a separately scoped receipt');
  const otherItem = (await sameKeyOtherUser.json()).data;
  assert.notEqual(otherItem.id, firstItem.id);

  const nextKey = crypto.randomUUID();
  const [newAttempt, racedReplay] = await Promise.all([
    request('/api/feedback', userA, payload, nextKey),
    request('/api/feedback', userA, payload, nextKey)
  ]);
  assert.deepEqual([newAttempt.status, racedReplay.status].sort(), [200, 201], 'concurrent duplicate requests yield one insert and one replay');
  const [newItem, racedItem] = await Promise.all([newAttempt.json(), racedReplay.json()]);
  assert.equal(newItem.data.id, racedItem.data.id);
  assert.notEqual(newItem.data.id, firstItem.id, 'a distinct attempt key permits a genuinely new submission');

  const checkDb = openDb(dbPath);
  try {
    assert.equal(checkDb.prepare('SELECT COUNT(*) AS n FROM feedback_requests WHERE submitter_id=?').get(userA).n, 2);
    assert.equal(checkDb.prepare('SELECT COUNT(*) AS n FROM feedback_events WHERE request_id=?').get(firstItem.id).n, 1, 'replay does not add a second receipt event');
  } finally { checkDb.close(); }
});
