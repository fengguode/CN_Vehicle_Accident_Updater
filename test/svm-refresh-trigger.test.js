import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { migrateAuth } from '../apps/api/auth.js';
import { requestSvmRefresh, retryPendingSvmRefresh, saveVote, revokeVote } from '../apps/api/votes-repository.js';
import { openDb } from '../src/db.js';

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adas-svm-trigger-'));
  const db = openDb(path.join(dir, 'test.db'));
  migrateAuth(db);
  db.prepare('INSERT INTO users(username,password_salt,password_hash,role,created_at) VALUES(?,?,?,\'member\',?)')
    .run('fixture-member', 'salt', 'hash', new Date().toISOString());
  const userId = Number(db.prepare("SELECT id FROM users WHERE username='fixture-member'").get().id);
  const fingerprints = [];
  const insert = db.prepare(`INSERT INTO reports(fingerprint,title,content,source_name,collected_at,raw_json,created_at,updated_at)
    VALUES(?,?,?,'fixture',?,'{}',?,?)`);
  const now = new Date().toISOString();
  for (let i = 0; i < 100; i += 1) {
    const fingerprint = i.toString(16).padStart(64, '0');
    fingerprints.push(fingerprint);
    insert.run(fingerprint, i % 2 ? '高速追尾事故' : '停车位碰撞事故', `fixture report ${i}`, now, now, now);
  }
  t.after(() => {
    db.close();
    const resolved = fs.realpathSync(dir);
    assert.ok(resolved.startsWith(fs.realpathSync(os.tmpdir()) + path.sep));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return { db, userId, fingerprints };
}

test('only first member/report ratings count; 100th rating refreshes model and scores atomically', (t) => {
  const { db, userId, fingerprints } = fixture(t);
  for (let i = 0; i < 99; i += 1) saveVote(db, userId, fingerprints[i], i % 2 ? 'not_relevant' : 'relevant');
  assert.equal(db.prepare('SELECT pending_new_ratings FROM traffic_svm_state WHERE id=1').get().pending_new_ratings, 99);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM traffic_svm_models').get().n, 0);

  const retry = saveVote(db, userId, fingerprints[0], 'not_relevant');
  assert.equal(retry.newly_accepted, false);
  assert.equal(db.prepare('SELECT pending_new_ratings FROM traffic_svm_state WHERE id=1').get().pending_new_ratings, 99);
  assert.equal(revokeVote(db, userId, fingerprints[1]).revoked, true);
  assert.equal(db.prepare('SELECT pending_new_ratings FROM traffic_svm_state WHERE id=1').get().pending_new_ratings, 99);
  const restoredAfterRevoke = saveVote(db, userId, fingerprints[1], 'relevant');
  assert.equal(restoredAfterRevoke.newly_accepted, true);
  assert.equal(restoredAfterRevoke.counted_new_rating, false);
  assert.equal(db.prepare('SELECT pending_new_ratings FROM traffic_svm_state WHERE id=1').get().pending_new_ratings, 99);

  const result = saveVote(db, userId, fingerprints[99], 'not_relevant');
  assert.equal(result.newly_accepted, true);
  assert.ok(result.model_id);
  assert.equal(db.prepare('SELECT pending_new_ratings FROM traffic_svm_state WHERE id=1').get().pending_new_ratings, 0);
  assert.equal(db.prepare('SELECT refresh_requested FROM traffic_svm_state WHERE id=1').get().refresh_requested, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM reports WHERE traffic_svm_model_id=?').get(result.model_id).n, 100);
});

test('auth migration backfills existing current ratings without counting them as new', (t) => {
  const { db, userId, fingerprints } = fixture(t);
  db.prepare("INSERT INTO traffic_votes(fingerprint,user_id,vote,created_at) VALUES(?,?,'relevant',?)")
    .run(fingerprints[0], userId, new Date().toISOString());
  migrateAuth(db);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM traffic_rating_receipts').get().n, 1);
  assert.equal(db.prepare('SELECT pending_new_ratings FROM traffic_svm_state WHERE id=1').get().pending_new_ratings, 0);
  const changed = saveVote(db, userId, fingerprints[0], 'not_relevant');
  assert.equal(changed.newly_accepted, false);
  assert.equal(changed.counted_new_rating, false);
  assert.equal(db.prepare('SELECT pending_new_ratings FROM traffic_svm_state WHERE id=1').get().pending_new_ratings, 0);
});

test('failed model publication keeps committed ratings and a durable retry; internal trigger is durable', (t) => {
  const { db, userId, fingerprints } = fixture(t);
  for (let i = 0; i < 99; i += 1) saveVote(db, userId, fingerprints[i], i % 2 ? 'not_relevant' : 'relevant');
  db.exec("CREATE TRIGGER fail_score_publication BEFORE UPDATE OF traffic_svm_score ON reports BEGIN SELECT RAISE(ABORT,'fixture publish failure'); END");
  const failed = saveVote(db, userId, fingerprints[99], 'not_relevant');
  assert.equal(failed.newly_accepted, true);
  assert.match(failed.refresh_error, /fixture publish failure/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM traffic_votes').get().n, 100);
  assert.equal(db.prepare('SELECT pending_new_ratings FROM traffic_svm_state WHERE id=1').get().pending_new_ratings, 100);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM traffic_svm_models').get().n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM reports WHERE traffic_svm_model_id IS NOT NULL').get().n, 0);

  db.exec('DROP TRIGGER fail_score_publication');
  const refreshed = retryPendingSvmRefresh(db);
  assert.ok(refreshed.model_id);
  assert.equal(db.prepare('SELECT pending_new_ratings FROM traffic_svm_state WHERE id=1').get().pending_new_ratings, 0);

  requestSvmRefresh(db);
  assert.equal(db.prepare('SELECT refresh_requested FROM traffic_svm_state WHERE id=1').get().refresh_requested, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM traffic_svm_models').get().n, 2);
});
