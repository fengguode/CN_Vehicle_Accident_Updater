import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync, backup } from 'node:sqlite';
import { dbPath } from '../src/config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backupRoot = path.resolve(process.env.ADAS_VNEXT_BACKUP_DIR || path.join(path.dirname(root), 'vnext-backups'));
if (backupRoot === root || !path.relative(root, backupRoot).startsWith('..')) throw new Error('Backups must stay outside the repository.');
fs.mkdirSync(backupRoot, { recursive: true });
const folder = path.join(backupRoot, new Date().toISOString().replace(/[:.]/g, '-'));
fs.mkdirSync(folder);
const database = path.join(folder, 'database.db');
const source = new DatabaseSync(dbPath, { readOnly: true });
try { await backup(source, database); }
finally { source.close(); }
const inspect = (file) => {
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    const integrity = db.prepare('PRAGMA integrity_check').get().integrity_check;
    if (integrity !== 'ok') throw new Error(`Backup integrity failed: ${integrity}`);
    return { reports: db.prepare('SELECT COUNT(*) AS n FROM reports').get().n,
      votes: db.prepare('SELECT COUNT(*) AS n FROM review_votes').get().n,
      users: db.prepare('SELECT COUNT(*) AS n FROM users').get().n };
  } finally { db.close(); }
};
const counts = inspect(database);
const drill = path.join(folder, 'restore-drill.db');
fs.copyFileSync(database, drill);
const restored = inspect(drill);
if (JSON.stringify(counts) !== JSON.stringify(restored)) throw new Error('Restore drill counts do not match the backup.');
fs.unlinkSync(drill);
const manifest = { kind: 'vnext-backup', created_at: new Date().toISOString(),
  source: dbPath, backup: database, bytes: fs.statSync(database).size,
  sha256: crypto.createHash('sha256').update(fs.readFileSync(database)).digest('hex'), counts, restore_drill: 'passed' };
fs.writeFileSync(path.join(folder, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
let expired = 0;
const cutoff = Date.now() - 30 * 86400_000;
for (const entry of fs.readdirSync(backupRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const candidate = path.resolve(backupRoot, entry.name);
  if (path.dirname(candidate) !== backupRoot || candidate === folder) continue;
  const marker = path.join(candidate, 'manifest.json');
  if (!fs.existsSync(marker)) continue;
  let prior;
  try { prior = JSON.parse(fs.readFileSync(marker, 'utf8')); } catch { continue; }
  if (prior.kind !== 'vnext-backup' || !Number.isFinite(Date.parse(prior.created_at)) || Date.parse(prior.created_at) >= cutoff) continue;
  fs.rmSync(candidate, { recursive: true, force: false });
  expired++;
}
console.log(JSON.stringify({ folder, counts, restore_drill: manifest.restore_drill, expired_backups_removed: expired }));
