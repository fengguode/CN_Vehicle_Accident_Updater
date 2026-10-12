import test from 'node:test';
import assert from 'node:assert/strict';
import { detectMediaFromHtml, platformForUrl, probeSourceUrl } from '../detect-media.mjs';

test('accepts only HTTPS post pages on Weibo and Xiaohongshu', () => {
  assert.equal(platformForUrl('https://weibo.com/123/abc'), 'weibo');
  assert.equal(platformForUrl('https://www.xiaohongshu.com/explore/note-id'), 'xiaohongshu');
  assert.equal(platformForUrl('https://passport.weibo.com/visitor'), null);
  assert.equal(platformForUrl('http://weibo.com/123/abc'), null);
  assert.equal(platformForUrl('https://weibo.com.evil.example/123/abc'), null);
});

test('finds an explicit Weibo-style video signal and records its exact evidence', () => {
  const html = '<meta content="https://weibo.com/media/player/123" property="og:video">';
  const result = detectMediaFromHtml(html, 'https://weibo.com/u/123/status');
  assert.equal(result.platform, 'weibo');
  assert.equal(result.status, 'video_available');
  assert.equal(result.has_video, true);
  assert.deepEqual(result.media_links, [{ type: 'video', url: 'https://weibo.com/media/player/123', evidence: 'og:video' }]);
});

test('finds a video source without treating an unrelated image as a video', () => {
  const html = '<main><video poster="https://www.xiaohongshu.com/cover.jpg"><source src="https://www.xiaohongshu.com/video/abc.mp4" type="video/mp4"></video></main>';
  const result = detectMediaFromHtml(html, 'https://www.xiaohongshu.com/explore/note-id');
  assert.equal(result.status, 'video_available');
  assert.deepEqual(result.media_links.map((link) => link.type), ['video']);
});

test('reports a cover image as a preview, never as a confirmed video or gallery', () => {
  const result = detectMediaFromHtml('<meta property="og:image" content="https://weibo.com/cover.jpg">', 'https://weibo.com/u/1/status');
  assert.equal(result.status, 'photo_preview_available');
  assert.equal(result.has_video, null);
  assert.equal(result.media_links[0].type, 'image_preview');
});

test('absence of generic HTML signals remains unknown, not no-video', () => {
  const result = detectMediaFromHtml('<html><body><div id="app"></div></body></html>', 'https://www.xiaohongshu.com/explore/note-id');
  assert.equal(result.status, 'unknown');
  assert.equal(result.has_video, null);
  assert.deepEqual(result.media_links, []);
});

test('does not return insecure or credential-bearing media URLs', () => {
  const html = '<meta property="og:video" content="http://media.example/video.mp4"><meta property="og:image" content="https://user:pass@weibo.com/a.jpg">';
  const result = detectMediaFromHtml(html, 'https://weibo.com/u/1/status');
  assert.equal(result.status, 'unknown');
  assert.deepEqual(result.media_links, []);
});

test('classifies login redirects as blocked without following or sending cookies', async () => {
  let request;
  const result = await probeSourceUrl('https://weibo.com/u/1/status', {
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(null, { status: 302, headers: { location: 'https://passport.weibo.com/visitor' } });
    }
  });
  assert.equal(result.status, 'blocked_or_login_required');
  assert.equal(result.has_video, null);
  assert.equal(request.options.redirect, 'manual');
  assert.equal('cookie' in request.options.headers, false);
});

test('rejects non-platform source URLs before making a request', async () => {
  let calls = 0;
  const result = await probeSourceUrl('https://example.com/post', { fetchImpl: async () => { calls++; } });
  assert.equal(result.status, 'unsafe_source_url');
  assert.equal(calls, 0);
});
