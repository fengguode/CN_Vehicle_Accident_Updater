import test from 'node:test';
import assert from 'node:assert/strict';
import { collectRss } from '../src/rss.js';

test('Weibo web-index source filters, caps, resolves, and rejects non-Weibo URLs', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(`<rss><channel>
    <item><title>辅助驾驶事故追尾</title><link>https://news.google.com/rss/articles/A</link><description>智驾碰撞</description></item>
    <item><title>辅助驾驶事故失控</title><link>https://news.google.com/rss/articles/B</link><description>智驾事故</description></item>
    <item><title>辅助驾驶产品</title><link>https://news.google.com/rss/articles/C</link><description>新品</description></item>
  </channel></rss>`);
  try {
    const rows = await collectRss({ keyword_groups: [['辅助驾驶'], ['事故']], max_resolve_candidates: 2, require_resolved: true, allowed_hosts: ['weibo.com'], url: 'https://example.test/rss' }, { resolve: async (url) => url.endsWith('/A') ? { source_url: 'https://weibo.com/u/1', discovery_url: url, resolved: true } : { source_url: 'https://news.example/story', discovery_url: url, resolved: true } });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].source_url, 'https://weibo.com/u/1');
    assert.equal(rows[0].discovery_url, 'https://news.google.com/rss/articles/A');
  } finally { globalThis.fetch = originalFetch; }
});
