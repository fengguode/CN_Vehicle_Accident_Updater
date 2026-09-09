const GOOGLE_NEWS_HOSTS = new Set(['news.google.com', 'www.news.google.com']);

export function isGoogleNewsWrapper(value) {
  try { const url = new URL(value); return GOOGLE_NEWS_HOSTS.has(url.hostname) && url.pathname.startsWith('/rss/'); } catch { return false; }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function extractCanonical(html) {
  const patterns = [
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i
  ];
  for (const pattern of patterns) { const match = html.match(pattern); if (match) { try { return new URL(match[1], 'https://news.google.com').toString(); } catch {} } }
  return null;
}

/** Resolve only public Google News wrappers. Never logs in or bypasses access controls. */
export async function resolvePublicSource(url, options = {}) {
  if (!isGoogleNewsWrapper(url)) return { source_url: url, discovery_url: null, resolved: false };
  const delayMs = Number(options.delayMs ?? process.env.GOOGLE_NEWS_RESOLVE_DELAY_MS ?? 250);
  if (delayMs > 0) await sleep(delayMs);
  try {
    const response = await fetch(url, { headers: { 'user-agent': 'ChinaADASAccidentMonitor/0.1 (+public-research)' }, redirect: 'follow', signal: AbortSignal.timeout(options.timeoutMs ?? 15000) });
    const finalUrl = response.url && !isGoogleNewsWrapper(response.url) ? response.url : null;
    const html = (response.headers.get('content-type') || '').includes('html') ? await response.text() : '';
    const canonical = extractCanonical(html);
    const resolved = canonical && !isGoogleNewsWrapper(canonical) ? canonical : finalUrl;
    return { source_url: resolved || url, discovery_url: url, resolved: Boolean(resolved) };
  } catch (error) {
    return { source_url: url, discovery_url: url, resolved: false, error: error.message };
  }
}
