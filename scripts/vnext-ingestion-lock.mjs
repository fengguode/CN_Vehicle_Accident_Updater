import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const INGESTION_MUTEX_NAME = 'Global\\ChinaTrafficIssueMonitor_vnext_public_ingestion';
const helperPath = fileURLToPath(new URL('./vnext-ingestion-lock.ps1', import.meta.url));

export class IngestionLockBusyError extends Error {
  constructor() {
    super('Another vNext public/social ingestion run is already active. Retry after it finishes.');
    this.name = 'IngestionLockBusyError';
    this.exitCode = 75;
  }
}

export function assertWindowsPlatform(platform = process.platform) {
  if (platform !== 'win32') {
    throw new Error('vNext public/social ingestion locking is supported on Windows only; no data was changed.');
  }
}

/** Acquire the shared Windows mutex; release() relinquishes it after all work/logging. */
export async function acquireWindowsIngestionLock({
  platform = process.platform,
  mutexName = INGESTION_MUTEX_NAME
} = {}) {
  assertWindowsPlatform(platform);
  const powershell = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  const child = spawn(powershell, [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', helperPath, '-MutexName', mutexName
  ], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });

  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => { stderr += chunk; });

  let exitPromise;
  const exited = new Promise((resolve) => {
    child.once('error', (error) => resolve({ code: null, error }));
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });

  const state = await new Promise((resolve, reject) => {
    let output = '';
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      fn(value);
    };
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      output += chunk;
      const newline = output.indexOf('\n');
      if (newline < 0) return;
      const line = output.slice(0, newline).trim();
      if (line === 'BUSY') finish(reject, new IngestionLockBusyError());
      else if (line.startsWith('ACQUIRED:')) finish(resolve, { helperPid: Number(line.slice('ACQUIRED:'.length)) });
      else finish(reject, new Error(`Unexpected ingestion lock helper response: ${line || '(empty)'}`));
    });
    child.once('error', (error) => finish(reject, new Error(`Could not start Windows ingestion lock helper: ${error.message}`)));
    child.once('exit', (code) => {
      if (!settled) finish(reject, new Error(`Windows ingestion lock helper exited before acquiring the mutex (code ${code}). ${stderr.trim()}`.trim()));
    });
  }).catch(async (error) => {
    child.stdin.destroy();
    await exited;
    throw error;
  });

  exitPromise = exited;
  let released = false;
  return {
    helperPid: state.helperPid,
    async release() {
      if (released) return;
      released = true;
      child.stdin.end();
      const result = await exitPromise;
      if (result.error) throw result.error;
      if (result.code !== 0) throw new Error(`Windows ingestion lock helper failed to release cleanly (code ${result.code}). ${stderr.trim()}`.trim());
    }
  };
}

export async function withWindowsIngestionLock(task, options) {
  const lock = await acquireWindowsIngestionLock(options);
  try {
    return await task();
  } finally {
    await lock.release();
  }
}
