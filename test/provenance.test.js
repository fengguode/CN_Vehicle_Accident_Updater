import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePublicSource } from '../src/provenance.js';
import { extractGoogleArticleParams, buildGoogleBatchRequest, parseBatchExecuteUrl } from '../src/provenance.js';
import { normalizeReport } from '../src/normalize.js';
import { needsResolution } from '../src/backfill.js';
import fs from 'node:fs';
import path from 'node:path';

test('resolves a public Google News wrapper and preserves discovery URL', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('<html><link rel="canonical" href="https://publisher.example/story/1"></html>', { headers: { 'content-type': 'text/html' } });
  try {
    const wrapper = 'https://news.google.com/rss/articles/ABC?hl=zh-CN';
    const resolved = await resolvePublicSource(wrapper, { delayMs: 0 });
    assert.equal(resolved.source_url, 'https://publisher.example/story/1');
    const report = normalizeReport({ title: '辅助驾驶事故', url: wrapper, source_url: resolved.source_url, discovery_url: wrapper, content: '公开报道' });
    assert.equal(report.source_url, 'https://publisher.example/story/1');
    assert.equal(report.discovery_url, wrapper);
    assert.equal(report.english_description_source, 'machine_heuristic_v1');
    assert.match(report.english_description, /Reported/);
  } finally { globalThis.fetch = originalFetch; }
});

test('extracts Google metadata and parses batchexecute publisher URLs', () => {
  const fixture = fs.readFileSync(path.join('test', 'fixtures', 'google-news-wrapper.html'), 'utf8');
  const params = extractGoogleArticleParams(fixture);
  assert.deepEqual(params, { id: 'ARTICLE_ID_123', timestamp: '1725891265', signature: 'SIGNATURE_123' });
  assert.match(buildGoogleBatchRequest(params), /Fbv4je/);
  assert.equal(parseBatchExecuteUrl('[[["Fbv4je","https:\\/\\/publisher.example\\/story?id=1"]]]'), 'https://publisher.example/story?id=1');
});

test('does not rewrite non-Google source URLs', async () => {
  const result = await resolvePublicSource('https://publisher.example/story/2', { delayMs: 0 });
  assert.deepEqual(result, { source_url: 'https://publisher.example/story/2', discovery_url: null, resolved: false });
});

test('backfill skips already-resolved publisher URLs even when discovery URL is Google', () => {
  assert.equal(needsResolution({ source_url: 'https://publisher.example/story', discovery_url: 'https://news.google.com/rss/articles/ABC' }), false);
  assert.equal(needsResolution({ source_url: 'https://news.google.com/rss/articles/ABC', discovery_url: null }), true);
});
