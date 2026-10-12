import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { openDb, insertReport } from '../src/db.js';
import { normalizeReport } from '../src/normalize.js';
import { runCollection } from '../src/pipeline.js';
import { migrateAuth } from '../apps/api/auth.js';
import { listReports } from '../apps/api/reports-repository.js';
import { myVotes, revokeVote, saveVote } from '../apps/api/votes-repository.js';
import { SVM_ALGORITHM, vectorize } from '../src/svm.js';

test('traffic ratings change shared ranking without reusing historical ADAS votes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'traffic-ranking-'));
  const db = openDb(path.join(dir, 'reports.db'));
  try {
    migrateAuth(db);
    const userId = Number(db.prepare(`INSERT INTO users(username,password_salt,password_hash,role,created_at)
      VALUES('reviewer','salt','hash','member',?)`).run(new Date().toISOString()).lastInsertRowid);
    const older = normalizeReport({ title: '广东高速货车追尾事故', url: 'https://example.org/older', published_at: '2026-09-20' });
    const newer = normalizeReport({ title: '北京路口汽车碰撞事故', url: 'https://example.org/newer', published_at: '2026-09-21' });
    assert.ok(insertReport(db, older));
    assert.ok(insertReport(db, newer));
    db.prepare("INSERT INTO review_votes(fingerprint,voter_id,vote,created_at) VALUES(?,?,'not_relevant',?)")
      .run(older.fingerprint, `local:${userId}`, new Date().toISOString());
    db.prepare('UPDATE reports SET svm_score=-10 WHERE fingerprint=?').run(older.fingerprint);
    const ranked = () => listReports(db, new URLSearchParams('sort=relevance')).data;
    assert.equal(ranked()[0].fingerprint, newer.fingerprint);
    assert.equal(ranked()[1].ranking_score, 0.5);
    assert.deepEqual(myVotes(db, userId), []);
    saveVote(db, userId, older.fingerprint, 'relevant');
    assert.equal(ranked()[0].fingerprint, older.fingerprint);
    assert.deepEqual(ranked()[0].labels.community_votes, { relevant: 1, not_relevant: 0 });
    saveVote(db, userId, older.fingerprint, 'not_relevant');
    assert.equal(ranked()[1].fingerprint, older.fingerprint);
    revokeVote(db, userId, older.fingerprint);
    assert.equal(ranked()[1].ranking_score, 0.5);
    assert.deepEqual(myVotes(db, userId), []);
  } finally {
    db.close();
    const resolved = fs.realpathSync(dir);
    assert.ok(resolved.startsWith(fs.realpathSync(os.tmpdir()) + path.sep));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});

test('social import accepts a traffic incident without an ADAS claim', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'traffic-import-'));
  const inbox = path.join(dir, 'inbox');
  fs.mkdirSync(inbox);
  const db = openDb(path.join(dir, 'reports.db'));
  try {
    fs.writeFileSync(path.join(inbox, 'items.jsonl'), [
      { title: '杭州路口货车与电动车碰撞事故', content: '公开报道的交通事故线索。', url: 'https://example.org/traffic', platform: 'other_social' },
      { title: '工厂机器碰撞事故', content: '设备故障。', url: 'https://example.org/factory', platform: 'other_social' }
    ].map((item) => JSON.stringify(item)).join('\n'));
    const result = await runCollection({ db, sourceIds: ['manual-platform-exports'], importOnly: true, inboxDir: inbox });
    assert.deepEqual([result.inserted, result.rejected, result.errors.length], [1, 1, 0]);
    const report = db.prepare('SELECT title,english_description FROM reports').get();
    assert.equal(report.title, '杭州路口货车与电动车碰撞事故');
    assert.doesNotMatch(report.english_description, /driver.assistance/i);
  } finally {
    db.close();
    const resolved = fs.realpathSync(dir);
    assert.ok(resolved.startsWith(fs.realpathSync(os.tmpdir()) + path.sep));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});

test('Xiaohongshu import preserves the complete post body for classification', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xiaohongshu-import-'));
  const inbox = path.join(dir, 'inbox');
  fs.mkdirSync(inbox);
  const db = openDb(path.join(dir, 'reports.db'));
  const content = '路口发生追尾事故。'.repeat(60) + '目击者说明车辆在红灯前停车，后车仍撞上。';
  try {
    fs.writeFileSync(path.join(inbox, 'post.jsonl'), JSON.stringify({
      title: '上海路口车辆追尾事故', content,
      url: 'https://www.xiaohongshu.com/explore/example', platform: 'xiaohongshu'
    }) + '\n');
    const result = await runCollection({ db, sourceIds: ['manual-platform-exports'], importOnly: true, inboxDir: inbox });
    assert.equal(result.inserted, 1);
    const report = db.prepare('SELECT content,platform FROM reports').get();
    assert.equal(report.platform, 'xiaohongshu');
    assert.equal(report.content, content.normalize('NFKC'));
  } finally {
    db.close();
    const resolved = fs.realpathSync(dir);
    assert.ok(resolved.startsWith(fs.realpathSync(os.tmpdir()) + path.sep));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});

test('collection scores later post content with the stored traffic model version', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'traffic-svm-pipeline-'));
  const inbox = path.join(dir, 'inbox');
  fs.mkdirSync(inbox);
  const db = openDb(path.join(dir, 'reports.db'));
  const content = '路口发生追尾事故。后续目击者提到独特刹车故障线索。';
  try {
    const feature = Object.keys(vectorize(content)).find((token) => token.includes('刹车'));
    assert.ok(feature);
    db.prepare('INSERT INTO traffic_svm_models(trained_at,algorithm,samples,weights_json,bias) VALUES(?,?,?,?,?)')
      .run(new Date().toISOString(), SVM_ALGORITHM, 8, JSON.stringify({ [feature]: 2 }), 0);
    fs.writeFileSync(path.join(inbox, 'post.jsonl'), JSON.stringify({
      title: '上海路口追尾事故', content,
      url: 'https://www.xiaohongshu.com/explore/svm-example', platform: 'xiaohongshu'
    }) + '\n');
    const result = await runCollection({ db, sourceIds: ['manual-platform-exports'], importOnly: true, inboxDir: inbox });
    assert.equal(result.inserted, 1);
    const report = db.prepare('SELECT traffic_svm_score,traffic_svm_model_id FROM reports').get();
    assert.ok(report.traffic_svm_score > 0);
    assert.equal(report.traffic_svm_model_id, 1);
  } finally {
    db.close();
    const resolved = fs.realpathSync(dir);
    assert.ok(resolved.startsWith(fs.realpathSync(os.tmpdir()) + path.sep));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});
