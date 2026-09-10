import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWeiboQueryUrl, runWeiboWebBackfill } from '../src/weibo-backfill.js';
import { openDb } from '../src/db.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('builds site-restricted multi-term Google News query', () => {
  const url = buildWeiboQueryUrl({ adas_terms: ['辅助驾驶', 'NOA'], brand_terms: ['沃尔沃'] }, ['追撞', '事故']);
  assert.match(decodeURIComponent(url), /site:weibo\.com/); assert.match(decodeURIComponent(url), /辅助驾驶/); assert.match(decodeURIComponent(url), /追撞/); assert.match(decodeURIComponent(url), /沃尔沃/);
});

test('backfill deduplicates direct URLs and caps newest imports', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adas-weibo-backfill-')); const db = openDb(path.join(dir, 'state.db'));
  const config = { accident_terms: ['事故'], packs: [{ name: 'one', adas_terms: ['辅助驾驶'], brand_terms: [] }, { name: 'two', adas_terms: ['NOA'], brand_terms: [] }] };
  const collect = async (source) => source.id.endsWith('one') ? [{ title: '辅助驾驶事故追撞', content: '追撞', source_url: 'https://weibo.com/a/1', discovery_url: 'https://news.google.com/rss/articles/1', published_at: '2026-09-09T00:00:00Z' }] : [{ title: 'NOA事故碰撞', content: '碰撞', source_url: 'https://weibo.com/a/1', published_at: '2026-09-08T00:00:00Z' }, { title: 'NOA事故追尾', content: '追尾', source_url: 'https://weibo.com/a/2', published_at: '2026-09-10T00:00:00Z' }];
  const result = await runWeiboWebBackfill({ db, config, maxResults: 2, collect });
  assert.equal(result.resolvedUnique, 2); assert.equal(result.inserted, 2); assert.equal(db.prepare('SELECT COUNT(*) AS count FROM reports').get().count, 2); assert.equal(db.prepare('SELECT source_url FROM reports WHERE source_url LIKE ?').get('https://news.google.com%'), undefined); db.close();
});
