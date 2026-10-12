#!/usr/bin/env node
import { pathToFileURL } from 'node:url';

const DEFAULT_TIMEOUT_MS = 8000;
const LOGIN_HOSTS = new Set(['passport.weibo.com', 'login.weibo.com', 'account.weibo.com']);

export function platformForUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    if (LOGIN_HOSTS.has(host)) return null;
    if (host === 'weibo.com' || host.endsWith('.weibo.com')) return 'weibo';
    if (host === 'xiaohongshu.com' || host.endsWith('.xiaohongshu.com')) return 'xiaohongshu';
  } catch {}
  return null;
}

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return result;
}

function safeCandidate(value, sourceUrl) {
  try {
    const url = new URL(value, sourceUrl);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}

function metaEntries(html) {
  const entries = [];
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    const key = (attrs.property || attrs.name || '').toLowerCase();
    if (key && attrs.content) entries.push({ key, value: attrs.content });
  }
  return entries;
}

function jsonLdEntries(html) {
  const values = [];
  for (const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { values.push(JSON.parse(match[1])); } catch {}
  }
  const flattened = [];
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== 'object') return;
    flattened.push(value);
    for (const child of Object.values(value)) if (child && typeof child === 'object') visit(child);
  };
  values.forEach(visit);
  return flattened;
}

function addLink(links, type, raw, evidence, sourceUrl) {
  const url = safeCandidate(raw, sourceUrl);
  if (!url) return;
  if (!links.some((link) => link.url === url && link.type === type)) links.push({ type, url, evidence });
}

export function detectMediaFromHtml(html, sourceUrl) {
  const platform = platformForUrl(sourceUrl);
  if (!platform) return { platform: null, status: 'unsafe_source_url', has_video: null, media_links: [], evidence: [] };

  const links = [];
  const evidence = [];
  for (const { key, value } of metaEntries(String(html))) {
    if (['og:video', 'og:video:url', 'og:video:secure_url', 'twitter:player:stream'].includes(key)) {
      addLink(links, 'video', value, key, sourceUrl);
      if (safeCandidate(value, sourceUrl)) evidence.push(key);
    } else if (key === 'og:image' || key === 'og:image:url' || key === 'og:image:secure_url') {
      addLink(links, 'image_preview', value, key, sourceUrl);
      if (safeCandidate(value, sourceUrl)) evidence.push(key);
    }
  }

  for (const obj of jsonLdEntries(String(html))) {
    const types = [].concat(obj['@type'] || []).map((type) => String(type).toLowerCase());
    if (types.includes('videoobject')) {
      for (const key of ['contentUrl', 'embedUrl']) {
        if (typeof obj[key] === 'string') {
          addLink(links, 'video', obj[key], `jsonld.VideoObject.${key}`, sourceUrl);
          if (safeCandidate(obj[key], sourceUrl)) evidence.push(`jsonld.VideoObject.${key}`);
        }
      }
    }
    if (types.includes('imageobject') && typeof obj.contentUrl === 'string') {
      addLink(links, 'image_preview', obj.contentUrl, 'jsonld.ImageObject.contentUrl', sourceUrl);
      if (safeCandidate(obj.contentUrl, sourceUrl)) evidence.push('jsonld.ImageObject.contentUrl');
    }
  }

  const videoTags = [...String(html).matchAll(/<(?:video|source)\b[^>]*>/gi)].map((match) => attributes(match[0]));
  for (const attrs of videoTags) {
    const candidate = attrs.src || attrs['data-src'];
    if (candidate) {
      addLink(links, 'video', candidate, attrs.src ? 'html.video-source' : 'html.video-data-src', sourceUrl);
      if (safeCandidate(candidate, sourceUrl)) evidence.push(attrs.src ? 'html.video-source' : 'html.video-data-src');
    }
  }

  const hasVideo = links.some((link) => link.type === 'video');
  const hasImagePreview = links.some((link) => link.type === 'image_preview');
  const status = hasVideo && hasImagePreview ? 'video_and_photo_preview_available'
    : hasVideo ? 'video_available'
      : hasImagePreview ? 'photo_preview_available'
        : 'unknown';
  return { platform, status, has_video: hasVideo ? true : null, media_links: links, evidence: [...new Set(evidence)] };
}

function isLoginDestination(value) {
  try {
    const url = new URL(value);
    return LOGIN_HOSTS.has(url.hostname.toLowerCase()) || /(?:login|passport|visitor|auth)/i.test(url.pathname);
  } catch { return false; }
}

export async function probeSourceUrl(sourceUrl, { fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const platform = platformForUrl(sourceUrl);
  if (!platform) return { platform: null, status: 'unsafe_source_url', has_video: null, media_links: [], evidence: [] };
  try {
    const response = await fetchImpl(sourceUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: { accept: 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(timeoutMs)
    });
    const location = response.headers?.get?.('location');
    if (response.status >= 300 && response.status < 400) {
      const target = location ? new URL(location, sourceUrl).href : null;
      return {
        platform,
        status: target && isLoginDestination(target) ? 'blocked_or_login_required' : 'redirected_uninspected',
        has_video: null,
        media_links: [],
        evidence: [`http_${response.status}`],
        redirect_host: target ? new URL(target).hostname : null
      };
    }
    if ([401, 403, 429].includes(response.status)) {
      return { platform, status: 'blocked_or_login_required', has_video: null, media_links: [], evidence: [`http_${response.status}`] };
    }
    if (!response.ok) return { platform, status: 'fetch_failed', has_video: null, media_links: [], evidence: [`http_${response.status}`] };
    const contentType = response.headers?.get?.('content-type') || '';
    if (!/html|xhtml/i.test(contentType)) return { platform, status: 'unknown', has_video: null, media_links: [], evidence: ['non_html_response'] };
    const html = await response.text();
    if (/captcha|验证码|visitor system|访问异常/i.test(html)) {
      return { platform, status: 'blocked_or_login_required', has_video: null, media_links: [], evidence: ['access_wall_marker'] };
    }
    return detectMediaFromHtml(html, sourceUrl);
  } catch (error) {
    return { platform, status: error?.name === 'TimeoutError' ? 'fetch_failed' : 'fetch_failed', has_video: null, media_links: [], evidence: [error?.name === 'TimeoutError' ? 'timeout' : 'network_error'] };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const sourceUrl = process.argv[2];
  if (!sourceUrl) {
    console.error('Usage: node experiments/media-detection-poc/detect-media.mjs <Weibo-or-Xiaohongshu-HTTPS-URL>');
    process.exitCode = 2;
  } else {
    console.log(JSON.stringify(await probeSourceUrl(sourceUrl), null, 2));
  }
}
