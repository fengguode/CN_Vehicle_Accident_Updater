import fs from 'node:fs';

const DEFAULT_DELAY_MS = 1000;
const DEFAULT_TIMEOUT_MS = 10000;

export function isAllowedWeiboHost(url) {
  try { const host = new URL(url).hostname.toLowerCase(); const blocked = new Set(['passport.weibo.com', 'login.weibo.com', 'account.weibo.com']); return !blocked.has(host) && (host === 'weibo.com' || host.endsWith('.weibo.com')); } catch { return false; }
}

function cleanText(value = '') { return String(value).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim(); }
function meta(html, key) { const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i')); return match?.[1] ? cleanText(match[1]) : ''; }

export function extractWeiboArticleText(html) {
  const candidates = [meta(html, 'og:description'), meta(html, 'description')];
  for (const block of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const value = JSON.parse(block[1]); const rows = Array.isArray(value) ? value : [value]; for (const row of rows) if (row.articleBody) candidates.push(cleanText(row.articleBody)); } catch {}
  }
  const article = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i); if (article) candidates.push(cleanText(article[1]));
  return [...new Set(candidates.filter((value) => value && value.length >= 20))].sort((a, b) => b.length - a.length)[0] || null;
}

function readCookie(options = {}) {
  if (options.cookie) return options.cookie;
  if (process.env.WEIBO_WEB_COOKIE) return process.env.WEIBO_WEB_COOKIE;
  const file = options.cookieFile || process.env.WEIBO_WEB_COOKIE_FILE;
  if (file) { try { return fs.readFileSync(file, 'utf8').trim(); } catch {} }
  return null;
}

export function weiboWebDiagnostics() {
  return { configured: Boolean(process.env.WEIBO_WEB_COOKIE || process.env.WEIBO_WEB_COOKIE_FILE), cookieFileConfigured: Boolean(process.env.WEIBO_WEB_COOKIE_FILE), note: 'Optional enrichment sends credentials only to resolved weibo.com hosts and stops on visitor/login walls, CAPTCHA, auth, or rate-limit responses.' };
}

export async function enrichWeiboArticle(item, options = {}) {
  if (!isAllowedWeiboHost(item.source_url)) return { item, enriched: false, reason: 'host_not_allowed' };
  const cookie = readCookie(options); if (!cookie) return { item, enriched: false, reason: 'not_configured' };
  if (options.delayMs !== 0) await new Promise((resolve) => setTimeout(resolve, Math.max(DEFAULT_DELAY_MS, Number(options.delayMs || DEFAULT_DELAY_MS))));
  try {
    const response = await (options.fetch || fetch)(item.source_url, { headers: { cookie, 'user-agent': 'ChinaADASAccidentMonitor/0.1 (+authorized-research)' }, redirect: 'manual', signal: AbortSignal.timeout(options.timeoutMs || DEFAULT_TIMEOUT_MS) });
    if ([401, 403, 429].includes(response.status) || (response.status >= 300 && response.status < 400)) return { item, enriched: false, reason: `blocked_${response.status}` };
    if (!response.ok || !isAllowedWeiboHost(response.url || item.source_url)) return { item, enriched: false, reason: `http_${response.status}` };
    const html = await response.text();
    if (/passport\.weibo\.com|visitor system|captcha|验证码|登录后|请登录/i.test(html)) return { item, enriched: false, reason: 'login_or_captcha_wall' };
    const content = extractWeiboArticleText(html);
    return content ? { item: { ...item, content, enrichment_source: 'weibo_public_html' }, enriched: true, reason: null } : { item, enriched: false, reason: 'no_conservative_text' };
  } catch (error) { return { item, enriched: false, reason: error.name === 'TimeoutError' ? 'timeout' : 'fetch_failed' }; }
}

export async function enrichWeiboItems(items, options = {}) {
  const cap = Math.max(0, Math.min(Number(options.maxItems ?? 5), 5)); let attempted = 0; let enriched = 0; const output = [];
  for (const item of items) {
    if (attempted >= cap) { output.push(item); continue; }
    attempted++; const result = await enrichWeiboArticle(item, options); output.push(result.item); if (result.enriched) enriched++;
  }
  return { items: output, attempted, enriched };
}
