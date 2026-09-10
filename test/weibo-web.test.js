import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { enrichWeiboArticle, enrichWeiboItems, extractWeiboArticleText, isAllowedWeiboHost } from '../src/weibo-web.js';

const html = fs.readFileSync(path.join('test', 'fixtures', 'weibo-status.html'), 'utf8');

test('extracts conservative text from Weibo public HTML', () => {
  assert.match(extractWeiboArticleText(html), /正文保留完整公开状态文本/);
  assert.equal(isAllowedWeiboHost('https://www.weibo.com/u/1'), true);
  assert.equal(isAllowedWeiboHost('https://passport.weibo.com/visitor'), false);
});

test('enriches only allowed Weibo hosts and never forwards cookie elsewhere', async () => {
  let seen;
  const result = await enrichWeiboArticle({ source_url: 'https://weibo.com/u/1', content: 'short' }, { cookie: 'SENSITIVE=1', delayMs: 0, fetch: async (url, options) => { seen = { url, options }; return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } }); } });
  assert.equal(result.enriched, true); assert.match(result.item.content, /正文保留完整公开状态文本/); assert.equal(seen.url, 'https://weibo.com/u/1'); assert.equal(seen.options.headers.cookie, 'SENSITIVE=1');
  const blocked = await enrichWeiboArticle({ source_url: 'https://passport.weibo.com/visitor' }, { cookie: 'SENSITIVE=1', delayMs: 0 });
  assert.equal(blocked.reason, 'host_not_allowed');
});

test('stops on visitor wall and caps five enrichments', async () => {
  let calls = 0;
  const items = Array.from({ length: 7 }, (_, id) => ({ source_url: `https://weibo.com/u/${id}` }));
  const result = await enrichWeiboItems(items, { cookie: 'SENSITIVE=1', delayMs: 0, fetch: async () => { calls++; return new Response('<html>passport.weibo.com visitor system captcha</html>', { status: 200 }); } });
  assert.equal(calls, 5); assert.equal(result.enriched, 0); assert.equal(result.attempted, 5);
});
