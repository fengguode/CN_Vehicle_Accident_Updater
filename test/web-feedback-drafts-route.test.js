import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

async function freePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => listener.listen(0, '127.0.0.1', resolve).once('error', reject));
  const { port } = listener.address();
  await new Promise((resolve) => listener.close(resolve));
  return port;
}

test('serves feedback browser modules from the same origin with JavaScript MIME', async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext-feedback-drafts-route-'));
  const port = await freePort();
  const child = spawn(process.execPath, ['apps/api/server.js'], {
    cwd: path.resolve(import.meta.dirname, '..'),
    env: { ...process.env, ADAS_DB_PATH: path.join(directory, 'isolated.sqlite'), ADAS_VNEXT_PORT: String(port) },
    stdio: 'ignore', windowsHide: true
  });
  const childExit = new Promise((resolve) => { child.once('exit', resolve); child.once('error', resolve); });
  t.after(async () => {
    if (child.exitCode === null) child.kill();
    await childExit;
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const origin = `http://127.0.0.1:${port}`;
  let response;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      response = await fetch(`${origin}/health`);
      if (response.ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.equal(response?.status, 200, 'isolated service becomes ready');

  const app = await fetch(`${origin}/app.js`);
  assert.equal(app.status, 200);
  assert.match(await app.text(), /from '\.\/feedback-drafts\.js'/);
  const appAgain = await fetch(`${origin}/app.js`);
  assert.match(await appAgain.text(), /from '\.\/feedback-triage\.js'/);

  const module = await fetch(`${origin}/feedback-drafts.js`);
  assert.equal(module.status, 200);
  assert.match(module.headers.get('content-type'), /^text\/javascript; charset=utf-8$/);
  assert.match(await module.text(), /createFeedbackDraftStore/);

  const triage = await fetch(`${origin}/feedback-triage.js`);
  assert.equal(triage.status, 200);
  assert.match(triage.headers.get('content-type'), /^text\/javascript; charset=utf-8$/);
  assert.match(await triage.text(), /rebaseFeedbackTriageDraft/);
});
