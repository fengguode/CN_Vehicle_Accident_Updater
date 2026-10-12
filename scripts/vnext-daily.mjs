import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { acquireWindowsIngestionLock } from './vnext-ingestion-lock.mjs';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function runDaily({
  root = defaultRoot,
  execute = (entryPath) => spawnSync(process.execPath, [entryPath], {
    cwd: root, env: process.env, encoding: 'utf8', timeout: 10 * 60_000, maxBuffer: 1024 * 1024
  }),
  acquireLock = acquireWindowsIngestionLock,
  log = console.log
} = {}) {
  const heldLock = await acquireLock();
  const outcomes = [];
  let failed = false;
  try {
    const logs = path.join(root, 'data', 'logs');
    fs.mkdirSync(logs, { recursive: true });
    for (const entry of [
      ['public_news', 'apps/updater/run-public.js'],
      ['social_inbox', 'apps/social-collector/import-inbox.js']
    ]) {
      const started = Date.now();
      let child;
      try { child = await execute(path.join(root, entry[1]), entry[0]); }
      catch (error) { child = { status: null, error }; }
      let stats = null;
      try { const parsed = JSON.parse(child.stdout || '{}'); stats = { fetched: parsed.fetched, inserted: parsed.inserted, duplicates: parsed.duplicates, rejected: parsed.rejected, errors: parsed.errors, source_quality: parsed.source_quality }; }
      catch {}
      const outcome = { source: entry[0], finished_at: new Date().toISOString(), duration_ms: Date.now() - started,
        exit_code: child.status, error: child.error?.message || null, stats };
      outcomes.push(outcome);
      if (child.status !== 0) failed = true;
    }
    fs.appendFileSync(path.join(logs, 'vnext-daily.jsonl'), JSON.stringify({ finished_at: new Date().toISOString(), outcomes }) + '\n');
    log(JSON.stringify({ outcomes }));
    return { outcomes, exitCode: failed ? 1 : 0 };
  } finally {
    await heldLock.release();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await runDaily();
    if (result.exitCode) process.exitCode = result.exitCode;
  } catch (error) {
    console.error(error.message);
    process.exitCode = error.exitCode || 1;
  }
}
