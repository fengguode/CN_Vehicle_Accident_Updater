import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { openDb } from '../../src/db.js';
import { bootstrapAdmin } from './auth.js';

if (!stdin.isTTY || !stdout.isTTY) {
  console.error('Run this command in an interactive local terminal; passwords must not be piped or supplied as arguments.');
  process.exit(2);
}

const rl = readline.createInterface({ input: stdin, output: stdout });
try {
  const username = (await rl.question('Initial admin username (3–32 characters): ')).trim();
  rl.close();
  stdout.write('Initial admin password (12+ characters; input hidden): ');
  stdin.setRawMode(true);
  stdin.resume();
  let password = '';
  await new Promise((resolve) => stdin.on('data', function onData(chunk) {
    for (const char of chunk.toString('utf8')) {
      if (char === '\r' || char === '\n') { stdin.off('data', onData); resolve(); break; }
      if (char === '\u0003') { stdin.off('data', onData); reject(new Error('Cancelled.')); break; }
      if (char === '\u007f' || char === '\b') password = password.slice(0, -1);
      else password += char;
    }
  }));
  stdin.setRawMode(false);
  stdout.write('\n');
  const db = openDb();
  try {
    const id = bootstrapAdmin(db, username, password);
    console.log(`Created initial administrator account ${username} (user #${id}). Keep its password safe; bootstrap cannot be repeated while an admin exists.`);
  } finally { db.close(); password = ''; }
} catch (error) {
  if (stdin.isRaw) stdin.setRawMode(false);
  rl.close();
  console.error(`Admin bootstrap failed: ${error.message}`);
  process.exitCode = 1;
}
