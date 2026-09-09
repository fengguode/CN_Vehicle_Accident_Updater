import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openDb } from '../src/db.js';
import { hydratePublicData } from '../src/hydrate.js';

test('hydrates public records with stable IDs and no raw secrets', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adas-hydrate-'));
  const file = path.join(dir, 'reports.json');
  fs.writeFileSync(file, JSON.stringify([{ id: 77, fingerprint: 'fp-77', source_url: 'https://example.test/77', source_name: 'test', title: '公开线索', content: '内容', verification_status: 'unverified', labels: { brand: 'Test' }, relevance_score: 0.8 }]));
  const db = openDb(path.join(dir, 'state.db'));
  assert.deepEqual(hydratePublicData(file, db), { records: 1, inserted: 1, updated: 0 });
  const row = db.prepare('SELECT id,fingerprint,labels_json,raw_json FROM reports').get();
  assert.equal(row.id, 77); assert.equal(row.fingerprint, 'fp-77'); assert.match(row.labels_json, /Test/); assert.match(row.raw_json, /public-data/); assert.doesNotMatch(row.raw_json, /secret/);
  fs.writeFileSync(file, JSON.stringify([{ id: 77, fingerprint: 'fp-77', source_name: 'test', title: '更新线索', verification_status: 'human_verified' }]));
  assert.deepEqual(hydratePublicData(file, db), { records: 1, inserted: 0, updated: 1 });
  assert.equal(db.prepare('SELECT title,verification_status FROM reports WHERE id=77').get().title, '更新线索');
  db.close();
});
