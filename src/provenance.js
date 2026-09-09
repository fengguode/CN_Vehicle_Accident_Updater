const GOOGLE_NEWS_HOSTS = new Set(['news.google.com', 'www.news.google.com']);

export function isGoogleNewsWrapper(value) {
  try { const url = new URL(value); return GOOGLE_NEWS_HOSTS.has(url.hostname) && url.pathname.startsWith('/rss/'); } catch { return false; }
}

export function extractGoogleArticleParams(html) {
  const get = (name) => { const match = html.match(new RegExp(`data-${name}=["']([^"']+)["']`, 'i')); return match?.[1] || null; };
  const id = get('n-a-id'); const timestamp = get('n-a-ts'); const signature = get('n-a-sg');
  return id && timestamp && signature ? { id, timestamp, signature } : null;
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

export function buildGoogleBatchRequest({ id, timestamp, signature }) {
  const request = ['garturlreq', [['en-US', 'US', ['FINANCE_TOP_INDICES', 'WEB_TEST_1_0_0'], null, null, 1, 1, 'US:en', null, 480, null, null, null, null, null, 0, 5], 'en-US', 'US', 1, [2, 4, 8], 1, 1, null, 0, 0, null, 0], id, Number(timestamp), signature];
  return JSON.stringify([[['Fbv4je', JSON.stringify(request), null, 'generic']]]);
}

export function parseBatchExecuteUrl(text) {
  const normalized = String(text || '').replace(/\\\//g, '/').replace(/\\u003d/g, '=').replace(/\\u0026/g, '&');
  const urls = normalized.match(/https?:\/\/[^\s"\\<>]+/g) || [];
  return urls.map((value) => value.replace(/[),\]]+$/, '')).find((value) => !isGoogleNewsWrapper(value) && !/google\.com|gstatic\.com/i.test(value)) || null;
}

/** Resolve only public Google News wrappers. Never logs in or bypasses access controls. */
export async function resolvePublicSource(url, options = {}) {
  if (!isGoogleNewsWrapper(url)) return { source_url: url, discovery_url: null, resolved: false };
  const delayMs = Number(options.delayMs ?? process.env.GOOGLE_NEWS_RESOLVE_DELAY_MS ?? 250);
  if (delayMs > 0) await sleep(delayMs);
  try {
    const response = await fetch(url, { headers: { 'user-agent': 'ChinaADASAccidentMonitor/0.1 (+public-research)' }, redirect: 'follow', signal: AbortSignal.timeout(options.timeoutMs ?? 15000) });
    const finalUrl = response.url && !isGoogleNewsWrapper(response.url) ? response.url : null;
    const html = await response.text();
    const canonical = extractCanonical(html);
    let resolved = canonical && !isGoogleNewsWrapper(canonical) ? canonical : finalUrl;
    const params = extractGoogleArticleParams(html);
    if (!resolved && params) {
      const rpc = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8', 'user-agent': 'ChinaADASAccidentMonitor/0.1 (+public-research)' }, body: new URLSearchParams({ 'f.req': buildGoogleBatchRequest(params) }), signal: AbortSignal.timeout(options.timeoutMs ?? 15000) });
      if (rpc.ok) resolved = parseBatchExecuteUrl(await rpc.text());
    }
    return { source_url: resolved || url, discovery_url: url, resolved: Boolean(resolved) };
  } catch (error) {
    return { source_url: url, discovery_url: url, resolved: false, error: error.message };
  }
}
