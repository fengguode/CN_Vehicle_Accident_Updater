import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { acquireWindowsIngestionLock, assertWindowsPlatform, IngestionLockBusyError } from '../scripts/vnext-ingestion-lock.mjs';
import { runDaily } from '../scripts/vnext-daily.mjs';

const privateName = () => `Global\\ChinaTrafficIssueMonitor_test_${process.pid}_${randomUUID().replaceAll('-', '')}`;

const powershellExe = () => path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');

function inspectMutexAcl(mutexName) {
  const escapedName = mutexName.replaceAll("'", "''");
  const command = `$ErrorActionPreference='Stop'; $rights=[System.Security.AccessControl.MutexRights]::Modify -bor [System.Security.AccessControl.MutexRights]::Synchronize -bor [System.Security.AccessControl.MutexRights]::ReadPermissions; $m=[System.Threading.Mutex]::OpenExisting('${escapedName}',$rights); try { $acl=$m.GetAccessControl(); $rules=@($acl.GetAccessRules($true,$true,[System.Security.Principal.SecurityIdentifier]) | ForEach-Object { [pscustomobject]@{ sid=$_.IdentityReference.Value; rights=$_.MutexRights.ToString(); type=$_.AccessControlType.ToString(); inherited=$_.IsInherited } }); [pscustomobject]@{ currentSid=[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value; ownerSid=$acl.GetOwner([System.Security.Principal.SecurityIdentifier]).Value; protected=$acl.AreAccessRulesProtected; rules=$rules } | ConvertTo-Json -Compress -Depth 4 } finally { $m.Dispose() }`;
  return JSON.parse(execFileSync(powershellExe(), ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', command], { encoding: 'utf8', windowsHide: true }).trim());
}

function startUnsecuredMutexOwner(mutexName) {
  const escapedName = mutexName.replaceAll("'", "''");
  const command = `$ErrorActionPreference='Stop'; $m=New-Object System.Threading.Mutex($false,'${escapedName}'); $owned=$false; try { $owned=$m.WaitOne(0); if (-not $owned) { exit 75 }; [Console]::Out.WriteLine('READY'); [Console]::Out.Flush(); [void][Console]::In.ReadLine() } finally { if ($owned) { $m.ReleaseMutex() }; $m.Dispose() }`;
  const child = spawn(powershellExe(), ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', command], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  let output = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const exited = new Promise((resolve) => child.once('exit', (code) => resolve(code)));
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Unsecured mutex helper did not start. ${stderr}`)), 5000);
    child.stdout.on('data', (chunk) => {
      output += chunk;
      if (output.includes('READY')) { clearTimeout(timer); resolve(); }
    });
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('exit', (code) => {
      if (!output.includes('READY')) { clearTimeout(timer); reject(new Error(`Unsecured mutex helper exited before ready (code ${code}). ${stderr}`)); }
    });
  });
  return { child, ready, exited };
}

test('ingestion lock is Windows-only and rejects unsupported platforms before work', async () => {
  assert.throws(() => assertWindowsPlatform('linux'), /Windows only; no data was changed/);
  let changed = false;
  await assert.rejects(
    () => acquireWindowsIngestionLock({ platform: 'linux' }).then(() => { changed = true; }),
    /Windows only; no data was changed/
  );
  assert.equal(changed, false);
});

test('new global mutex has a protected DACL limited to the current SID and required rights', { skip: process.platform !== 'win32' }, async () => {
  const mutexName = privateName();
  const lock = await acquireWindowsIngestionLock({ mutexName });
  try {
    const acl = inspectMutexAcl(mutexName);
    assert.equal(acl.protected, true, 'the mutex DACL should not inherit broader principals');
    assert.equal(acl.ownerSid, acl.currentSid, 'the signed-in application account should own the mutex');
    assert.equal(acl.rules.length, 1, 'only the application account should have an explicit mutex ACE');
    assert.equal(acl.rules[0].sid, acl.currentSid);
    assert.equal(acl.rules[0].rights, 'Modify, ReadPermissions, Synchronize');
    assert.equal(acl.rules[0].type, 'Allow');
    assert.equal(acl.rules[0].inherited, false);
  } finally {
    await lock.release();
  }
});

test('existing mutex with a broader default DACL fails closed without being repaired', { skip: process.platform !== 'win32' }, async () => {
  const mutexName = privateName();
  const owner = startUnsecuredMutexOwner(mutexName);
  try {
    await owner.ready;
    await assert.rejects(
      () => acquireWindowsIngestionLock({ mutexName }),
      /unsafe or unexpected access control list/
    );
    const acl = inspectMutexAcl(mutexName);
    assert.equal(acl.protected, false, 'the lock helper must not repair an existing descriptor');
    assert.ok(acl.rules.length > 1, 'the original broader descriptor remains intact');
  } finally {
    owner.child.stdin.end();
    await owner.exited;
  }
});

test('shared mutex admits exactly one owner, reports busy, and recovers after abandonment', { skip: process.platform !== 'win32' }, async () => {
  const mutexName = privateName();
  const contenders = await Promise.allSettled(Array.from({ length: 4 }, () => acquireWindowsIngestionLock({ mutexName })));
  const admitted = contenders.filter((result) => result.status === 'fulfilled');
  assert.equal(admitted.length, 1, 'exactly one simultaneous caller should own the mutex');
  for (const result of contenders) {
    if (result.status === 'rejected') {
      assert.ok(result.reason instanceof IngestionLockBusyError);
      assert.equal(result.reason.exitCode, 75);
    }
  }
  await admitted[0].value.release();

  const abandonedOwner = await acquireWindowsIngestionLock({ mutexName });
  process.kill(abandonedOwner.helperPid);
  let recovered;
  const deadline = Date.now() + 8000;
  while (!recovered && Date.now() < deadline) {
    try { recovered = await acquireWindowsIngestionLock({ mutexName }); }
    catch (error) {
      if (!(error instanceof IngestionLockBusyError)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  assert.ok(recovered, 'a later run should acquire the abandoned mutex');
  await recovered.release();
});

test('daily runner holds exclusion through both children and its log, records failures, then releases', { skip: process.platform !== 'win32' }, async () => {
  const mutexName = privateName();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext-lock-daily-'));
  const acquireLock = () => acquireWindowsIngestionLock({ mutexName });
  const calls = [];
  let printed;
  try {
    const result = await runDaily({
      root,
      acquireLock,
      execute: async (entryPath, source) => {
        calls.push({ entryPath, source });
        await assert.rejects(acquireLock(), IngestionLockBusyError);
        return { status: source === 'public_news' ? 1 : 0, stdout: '{}', error: null };
      },
      log: (line) => { printed = line; }
    });

    assert.deepEqual(calls.map(({ source }) => source), ['public_news', 'social_inbox']);
    assert.equal(result.exitCode, 1);
    assert.deepEqual(result.outcomes.map(({ exit_code }) => exit_code), [1, 0]);
    const logPath = path.join(root, 'data', 'logs', 'vnext-daily.jsonl');
    const loggedRun = JSON.parse(fs.readFileSync(logPath, 'utf8').trim());
    assert.deepEqual(loggedRun.outcomes, JSON.parse(printed).outcomes);
    assert.deepEqual(loggedRun.outcomes.map(({ source }) => source), ['public_news', 'social_inbox']);

    const retry = await acquireLock();
    await retry.release();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
