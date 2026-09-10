import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { collectWeiboCli, diagnoseWeiboCli, normalizeWeiboItem, parseCliOutput } from '../src/weibo-cli.js';

const fixture = JSON.parse(fs.readFileSync(path.join('test', 'fixtures', 'weibo-cli-search.json'), 'utf8'));

test('parses fixture JSON and preserves stable Weibo ID/URL', () => {
  const item = normalizeWeiboItem(fixture.items[0], { name: 'fixture pack' });
  assert.equal(item.external_id, 'm123');
  assert.equal(item.source_url, 'https://weibo.com/m123');
  assert.equal(parseCliOutput(JSON.stringify(fixture)).nextCursor, 'cursor-2');
});

test('collector uses configured argument template and query packs without shell execution', async () => {
  const calls = [];
  const result = await collectWeiboCli({ args: ['search', '--query', '{query}', '--since', '{since}', '--cursor', '{cursor}'], query_packs: [{ name: 'fixture', terms: ['辅助驾驶', '事故'] }, { name: 'fixture-2', terms: ['智驾', '碰撞'] }], delay_ms: 0 }, { state: { cursor: 'cursor-1' }, runner: async (exe, args) => { calls.push({ exe, args }); return { stdout: JSON.stringify(fixture) }; } });
  assert.equal(result.items.length, 2);
  assert.equal(result.nextCursor, 'cursor-2');
  assert.equal(calls.length, 2);
  assert.ok(calls[0].args.includes('cursor-1'));
  assert.match(calls[0].args[calls[0].args.indexOf('--query') + 1], /辅助驾驶/);
});

test('adapter remains unavailable until args are explicitly configured', () => {
  const diagnostic = diagnoseWeiboCli({});
  assert.equal(diagnostic.configured, false);
  assert.equal(diagnostic.available, false);
});
