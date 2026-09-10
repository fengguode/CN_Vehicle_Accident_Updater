function decodeXml(value = '') {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}

function tag(block, name) {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return match ? decodeXml(match[1]).trim() : '';
}

export function parseRss(xml) {
  const items = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);
  return items.map((item) => ({
    title: tag(item, 'title'),
    content: tag(item, 'description'),
    url: tag(item, 'link'),
    guid: tag(item, 'guid'),
    author: tag(item, 'author') || tag(item, 'dc:creator'),
    published_at: tag(item, 'pubDate')
  })).filter((item) => item.title && item.url);
}

function matchesKeywordGroups(item, groups = []) {
  const text = `${item.title || ''} ${item.content || ''}`.toLocaleLowerCase('zh-CN');
  return groups.every((group) => group.some((term) => text.includes(String(term).toLocaleLowerCase('zh-CN'))));
}

function allowedHost(url, hosts = []) {
  try { const hostname = new URL(url).hostname.toLowerCase(); return hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`)); } catch { return false; }
}

export async function collectRss(source, options = {}) {
  const response = await fetch(source.url, { headers: { 'user-agent': 'ChinaADASAccidentMonitor/0.1 (+local-research)' }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const items = parseRss(await response.text()).filter((item) => matchesKeywordGroups(item, source.keyword_groups || []));
  const candidates = items.slice(0, Number(source.max_resolve_candidates || items.length));
  const resolved = [];
  const resolver = options.resolve || resolvePublicSource;
  for (const item of candidates) {
    const result = await resolver(item.url, options);
    if (source.require_resolved && (!result.resolved || !result.source_url || result.source_url === item.url)) continue;
    if (source.allowed_hosts?.length && !allowedHost(result.source_url, source.allowed_hosts)) continue;
    resolved.push({ ...item, ...result, discovery_url: result.discovery_url || item.url });
  }
  return resolved;
}
import { resolvePublicSource } from './provenance.js';
