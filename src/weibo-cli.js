import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readJson } from './config.js';

const execFileAsync = promisify(execFile);
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_BUFFER = 2 * 1024 * 1024;
export const DEFAULT_ARGS = ['search', 'statuses/limited', '--q', '{query}', '--output', 'json'];

function executableCandidates() { return process.env.WEIBO_CLI_PATH ? [process.env.WEIBO_CLI_PATH] : (process.platform === 'win32' ? ['weibo.cmd', 'weibo.exe', 'weibo'] : ['weibo']); }
function replaceTokens(value, tokens) { return String(value).replace(/\{(query|since|cursor|limit)\}/g, (_, key) => tokens[key] ?? ''); }

export function parseCliOutput(stdout) {
  const text = String(stdout || '').trim(); if (!text) return { items: [], nextCursor: null };
  let value; try { value = JSON.parse(text); } catch (error) { throw new Error(`weibo-cli returned non-JSON output: ${error.message}`); }
  const items = Array.isArray(value) ? value : (value.items || value.results || value.data || []);
  if (!Array.isArray(items)) throw new Error('weibo-cli JSON must contain an array or items/results/data array');
  return { items, nextCursor: value.next_cursor ?? value.nextCursor ?? value.cursor ?? null };
}

export function normalizeWeiboItem(item, pack = {}) {
  const id = item.id || item.mid || item.post_id || item.status_id || null;
  const url = item.url || item.permalink || (id ? `https://weibo.com/${id}` : null);
  return { ...item, external_id: item.external_id || (id ? String(id) : null), url, source_url: url, platform: 'weibo', source_name: pack.name || 'Weibo CLI', published_at: item.published_at || item.created_at || item.createdAt || null, content: item.content || item.text || item.title || '' };
}

export function diagnoseWeiboCli(source = {}) {
  const configuredArgs = source.args || process.env.WEIBO_CLI_ARGS_JSON || DEFAULT_ARGS; let argsError = null;
  if (typeof configuredArgs === 'string') { try { JSON.parse(configuredArgs); } catch (error) { argsError = error.message; } }
  return { available: Boolean(configuredArgs) && !argsError, executable: process.env.WEIBO_CLI_PATH || executableCandidates()[0], configured: Boolean(configuredArgs), argsError, auth: Boolean(process.env.WEIBO_CLI_TOKEN || process.env.WEIBO_CLI_REFRESH_TOKEN), note: configuredArgs ? 'Capability probe can be run with the configured action.' : 'Set WEIBO_CLI_ARGS_JSON or source.args after validating the authenticated CLI action.' };
}

async function resolveWindowsCommand(executable, args) {
  if (process.platform !== 'win32' || !/\.cmd$/i.test(executable)) return { executable, args };
  if (process.env.WEIBO_CLI_JS) return { executable: process.execPath, args: [process.env.WEIBO_CLI_JS, ...args] };
  let shim = executable;
  if (!path.isAbsolute(shim)) {
    try { shim = (await execFileAsync('where.exe', [shim], { windowsHide: true, timeout: 5000, maxBuffer: 32768 })).stdout.split(/\r?\n/).find(Boolean) || shim; } catch { return { executable, args }; }
  }
  try {
    const text = fs.readFileSync(shim, 'utf8');
    const match = text.match(/(?:node(?:\.exe)?)["']?\s+["']([^"']*dist[\\/]index\.js)["']/i);
    if (match) return { executable: process.execPath, args: [match[1], ...args] };
  } catch {}
  return { executable, args };
}

async function run(executable, args, options) {
  const command = await resolveWindowsCommand(executable, args);
  const runner = options.runner || ((file, argv, settings) => execFileAsync(file, argv, { shell: false, windowsHide: true, timeout: settings.timeoutMs || DEFAULT_TIMEOUT_MS, maxBuffer: settings.maxBuffer || DEFAULT_MAX_BUFFER, env: process.env }));
  return runner(command.executable, command.args, options);
}

export async function probeWeiboCli(source = {}, options = {}) {
  const args = source.probeArgs || (process.env.WEIBO_CLI_PROBE_ARGS_JSON ? JSON.parse(process.env.WEIBO_CLI_PROBE_ARGS_JSON) : null);
  if (!args) return { ok: false, ...diagnoseWeiboCli(source), error: 'No capability probe arguments configured' };
  try { await run(process.env.WEIBO_CLI_PATH || executableCandidates()[0], args, options); return { ok: true, ...diagnoseWeiboCli(source) }; } catch (error) { return { ok: false, ...diagnoseWeiboCli(source), error: error.message }; }
}

export async function collectWeiboCli(source = {}, options = {}) {
  const configured = source.args || process.env.WEIBO_CLI_ARGS_JSON || DEFAULT_ARGS;
  const template = typeof configured === 'string' ? JSON.parse(configured) : configured;
  if (!Array.isArray(template) || !template.length) throw new Error('weibo-cli args must be a non-empty JSON array');
  const packs = source.query_packs || readJson('config/weibo-query-packs.json').packs; const state = options.state || {};
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); const cursor = state.cursor || null; const items = []; let nextCursor = cursor;
  for (const pack of packs) {
    const query = pack.terms.map((term) => `(${term})`).join(' AND ');
    const args = template.map((arg) => replaceTokens(arg, { query, since, cursor: cursor || '', limit: source.limit || 100 }));
    const result = parseCliOutput((await run(process.env.WEIBO_CLI_PATH || executableCandidates()[0], args, options)).stdout);
    items.push(...result.items.map((item) => normalizeWeiboItem(item, pack))); if (result.nextCursor) nextCursor = result.nextCursor;
    if (source.delay_ms || options.delayMs) await new Promise((resolve) => setTimeout(resolve, Number(source.delay_ms || options.delayMs)));
  }
  return { items, nextCursor, overlapSince: since, diagnostics: diagnoseWeiboCli(source) };
}
