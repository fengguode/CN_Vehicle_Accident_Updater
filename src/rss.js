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

export async function collectRss(source) {
  const response = await fetch(source.url, { headers: { 'user-agent': 'ChinaADASAccidentMonitor/0.1 (+local-research)' }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return parseRss(await response.text());
}
