import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = path.join(root, 'data');
const logs = path.join(data, 'logs');
fs.mkdirSync(logs, { recursive: true });
const lock = path.join(data, 'vnext-daily.lock');
let handle;
try { handle = fs.openSync(lock, 'wx'); }
catch (error) {
  if (error.code === 'EEXIST') throw new Error(`A daily run is already locked: ${lock}`);
  throw error;
}
fs.writeSync(handle, JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() }));
const outcomes = [];
try {
  for (const entry of [
    ['public_news', 'apps/updater/run-public.js'],
    ['social_inbox', 'apps/social-collector/import-inbox.js']
  ]) {
    const started = Date.now();
    const child = spawnSync(process.execPath, [path.join(root, entry[1])], {
      cwd: root, env: process.env, encoding: 'utf8', timeout: 10 * 60_000, maxBuffer: 1024 * 1024
    });
    let stats = null;
    try { const parsed = JSON.parse(child.stdout || '{}'); stats = { fetched: parsed.fetched, inserted: parsed.inserted, duplicates: parsed.duplicates, rejected: parsed.rejected, errors: parsed.errors }; }
    catch {}
    const outcome = { source: entry[0], finished_at: new Date().toISOString(), duration_ms: Date.now() - started,
      exit_code: child.status, error: child.error?.message || null, stats };
    outcomes.push(outcome);
    if (child.status !== 0) process.exitCode = 1;
  }
  fs.appendFileSync(path.join(logs, 'vnext-daily.jsonl'), JSON.stringify({ finished_at: new Date().toISOString(), outcomes }) + '\n');
  console.log(JSON.stringify({ outcomes }));
} finally {
  fs.closeSync(handle);
  fs.unlinkSync(lock);
}
