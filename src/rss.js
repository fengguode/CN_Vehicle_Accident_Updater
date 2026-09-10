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
  const response = await fetch(source.url, { headers: { 'user-agent': 'ChinaADASAccidentMonitor/0.1 (+local-research)' }, signal: AbortSignal.timeout(source.fetch_timeout_ms || 15000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const items = parseRss(await response.text()).filter((item) => matchesKeywordGroups(item, source.keyword_groups || []));
  const candidates = items.slice(0, Number(source.max_resolve_candidates || 20));
  const resolver = options.resolve || resolvePublicSource;
  const timeoutMs = source.resolve_timeout_ms || options.timeoutMs || 8000;
  const concurrency = Math.max(1, Math.min(4, Number(source.resolve_concurrency || 4)));
  const results = new Array(candidates.length); let next = 0;
  async function worker() { while (true) { const index = next++; if (index >= candidates.length) return; const item = candidates[index]; results[index] = { item, result: await resolver(item.url, { ...options, timeoutMs }) }; } }
  await Promise.all(Array.from({ length: Math.min(concurrency, candidates.length) }, worker));
  const resolved = [];
  for (const { item, result } of results) {
    if (isGoogleNewsWrapper(item.url) && (!result.resolved || !result.source_url || isGoogleNewsWrapper(result.source_url))) continue;
    if (source.require_resolved && (!result.resolved || !result.source_url || result.source_url === item.url)) continue;
    if (source.allowed_hosts?.length && !allowedHost(result.source_url, source.allowed_hosts)) continue;
    resolved.push({ ...item, ...result, discovery_url: result.discovery_url || item.url });
  }
  return resolved;
}
import { resolvePublicSource, isGoogleNewsWrapper } from './provenance.js';
