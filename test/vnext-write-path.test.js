import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { openDb } from '../src/db.js';
import { runCollection } from '../src/pipeline.js';
import { listReports } from '../apps/api/reports-repository.js';

test('failed source rolls back reports and cursor; retry is idempotent', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adas-vnext-write-'));
  const inboxDir = path.join(dir, 'inbox');
  fs.mkdirSync(inboxDir);
  const db = openDb(path.join(dir, 'reports.db'));
  try {
    const items = [
      { title: '高速辅助驾驶追尾事故', content: '车主称辅助驾驶开启时发生追尾事故。', url: 'https://weibo.com/test/first', platform: 'weibo', reviewed_relevance: true },
      { title: '自动泊车碰撞事故', content: '车主称自动泊车时撞上地库立柱。', url: 'https://weibo.com/test/failure', platform: 'weibo', reviewed_relevance: true }
    ];
    fs.writeFileSync(path.join(inboxDir, 'batch.jsonl'), items.map((item) => JSON.stringify(item)).join('\n') + '\n');
    db.exec("CREATE TRIGGER reject_fixture BEFORE INSERT ON reports WHEN NEW.source_url LIKE '%/failure' BEGIN SELECT RAISE(ABORT, 'fixture failure'); END");
    const failed = await runCollection({ db, sourceIds: ['manual-platform-exports'], importOnly: true, inboxDir });
    assert.equal(failed.inserted, 0);
    assert.equal(failed.errors.length, 1);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM reports').get().n, 0);
    assert.equal(db.prepare("SELECT last_success_at FROM source_state WHERE source_id='manual-platform-exports'").get().last_success_at, null);
    db.exec('DROP TRIGGER reject_fixture');
    const succeeded = await runCollection({ db, sourceIds: ['manual-platform-exports'], importOnly: true, inboxDir });
    assert.deepEqual([succeeded.inserted, succeeded.errors.length], [2, 0]);
    assert.ok(db.prepare("SELECT last_success_at FROM source_state WHERE source_id='manual-platform-exports'").get().last_success_at);
    const stored = db.prepare('SELECT source_url,platform,author,verification_status,collected_at FROM reports WHERE source_url=?')
      .get('https://weibo.com/test/first');
    assert.deepEqual([stored.source_url, stored.platform, stored.verification_status], [items[0].url, 'weibo', 'unverified']);
    assert.ok(stored.collected_at);
    const apiPage = listReports(db, new URLSearchParams('verification_status=unverified&q=高速辅助驾驶'));
    assert.equal(apiPage.total, 1);
    assert.ok(apiPage.data.some((report) => report.source_url === items[0].url && report.verification_status === 'unverified'));
    const retry = await runCollection({ db, sourceIds: ['manual-platform-exports'], importOnly: true, inboxDir });
    assert.deepEqual([retry.inserted, retry.duplicates, retry.errors.length], [0, 2, 0]);
  } finally {
    db.close();
    const resolved = fs.realpathSync(dir);
    assert.ok(resolved.startsWith(fs.realpathSync(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('adas-vnext-write-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});
