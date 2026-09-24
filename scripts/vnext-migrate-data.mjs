import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openDb } from '../src/db.js';
import { migrateAuth } from '../apps/api/auth.js';
import { refreshVotesAndSvm } from '../apps/api/votes-repository.js';

const [backupFolderArg, targetArg] = process.argv.slice(2);
if (!backupFolderArg || !targetArg) throw new Error('Usage: node scripts/vnext-migrate-data.mjs BACKUP_FOLDER TARGET_DB');
const folder = path.resolve(backupFolderArg);
const targetPath = path.resolve(targetArg);
const manifest = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json'), 'utf8'));
const backupFile = (name) => path.join(folder, manifest.files[name].backup);
if (Object.keys(manifest.files).some((name) => path.resolve(backupFile(name)) === targetPath)) throw new Error('Target must differ from every backup source.');
for (const name of ['reports', 'votes', 'public']) {
  const digest = crypto.createHash('sha256').update(fs.readFileSync(backupFile(name))).digest('hex');
  if (digest !== manifest.files[name].sha256) throw new Error(`${name} backup checksum does not match the manifest.`);
}

const source = new DatabaseSync(backupFile('reports'), { readOnly: true });
const voteSource = new DatabaseSync(backupFile('votes'), { readOnly: true });
const target = openDb(targetPath);
try {
  migrateAuth(target);
  target.exec(`CREATE TABLE IF NOT EXISTS data_imports (
    source_sha256 TEXT PRIMARY KEY, imported_at TEXT NOT NULL,
    reports INTEGER NOT NULL, votes INTEGER NOT NULL
  )`);
  const publicReports = JSON.parse(fs.readFileSync(backupFile('public'), 'utf8'));
  if (!Array.isArray(publicReports)) throw new Error('Public report backup must be an array.');
  const publicByFingerprint = new Map(publicReports.map((report) => [report.fingerprint, report]));
  const sourceRows = source.prepare('SELECT * FROM reports ORDER BY id').all();
  const voteRows = voteSource.prepare('SELECT fingerprint,voter_id,vote,created_at FROM votes').all();
  const targetColumns = new Set(target.prepare('PRAGMA table_info(reports)').all().map((row) => row.name));
  const columns = source.prepare('PRAGMA table_info(reports)').all().map((row) => row.name).filter((name) => targetColumns.has(name));
  const insert = target.prepare(`INSERT OR IGNORE INTO reports (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`);
  const bilingual = target.prepare("UPDATE reports SET title_en=COALESCE(NULLIF(title_en,''),?),content_en=COALESCE(NULLIF(content_en,''),?),title_zh_short=?,title_en_short=?,summary_zh=?,summary_en=? WHERE fingerprint=?");
  const insertVote = target.prepare('INSERT OR IGNORE INTO review_votes(fingerprint,voter_id,vote,created_at) VALUES(?,?,?,?)');
  const runColumns = source.prepare('PRAGMA table_info(runs)').all().map((row) => row.name);
  const insertRun = target.prepare(`INSERT OR IGNORE INTO runs (${runColumns.join(',')}) VALUES (${runColumns.map(() => '?').join(',')})`);
  const stateColumns = source.prepare('PRAGMA table_info(source_state)').all().map((row) => row.name);
  const insertState = target.prepare(`INSERT INTO source_state (${stateColumns.join(',')}) VALUES (${stateColumns.map(() => '?').join(',')})
    ON CONFLICT(source_id) DO UPDATE SET last_success_at=excluded.last_success_at,last_error=excluded.last_error,
    last_item_at=excluded.last_item_at,state_json=excluded.state_json,updated_at=excluded.updated_at
    WHERE excluded.updated_at > source_state.updated_at`);
  let insertedReports = 0;
  let insertedVotes = 0;
  target.exec('BEGIN IMMEDIATE');
  try {
    for (const row of sourceRows) insertedReports += insert.run(...columns.map((name) => row[name])).changes;
    for (const report of publicReports) {
      if (!report.fingerprint) continue;
      bilingual.run(report.title_en || null, report.content_en || null, report.title_zh_short || null, report.title_en_short || null, report.summary_zh || null, report.summary_en || null, report.fingerprint);
    }
    for (const row of voteRows) {
      if (!/^[a-f0-9]{64}$/.test(row.fingerprint) || !['relevant', 'not_relevant'].includes(row.vote)) throw new Error('Invalid historical vote record.');
      insertedVotes += insertVote.run(row.fingerprint, `legacy:${row.voter_id}`, row.vote, row.created_at).changes;
    }
    for (const row of source.prepare('SELECT * FROM runs ORDER BY id').all()) insertRun.run(...runColumns.map((name) => row[name]));
    for (const row of source.prepare('SELECT * FROM source_state').all()) insertState.run(...stateColumns.map((name) => row[name]));
    const missingReports = sourceRows.filter((row) => !target.prepare('SELECT 1 FROM reports WHERE fingerprint=?').get(row.fingerprint)).length;
    const missingVotes = voteRows.filter((row) => !target.prepare('SELECT 1 FROM review_votes WHERE fingerprint=? AND voter_id=?').get(row.fingerprint, `legacy:${row.voter_id}`)).length;
    if (missingReports || missingVotes) throw new Error(`Migration reconciliation failed: ${missingReports} reports and ${missingVotes} votes missing.`);
    const missingPublic = [...publicByFingerprint.keys()].filter((fingerprint) => !target.prepare('SELECT 1 FROM reports WHERE fingerprint=?').get(fingerprint)).length;
    if (missingPublic) throw new Error(`${missingPublic} public reports are missing from the migrated database.`);
    target.prepare('INSERT OR IGNORE INTO data_imports(source_sha256,imported_at,reports,votes) VALUES(?,?,?,?)')
      .run(manifest.files.reports.sha256, new Date().toISOString(), sourceRows.length, voteRows.length);
    target.exec('COMMIT');
  } catch (error) { target.exec('ROLLBACK'); throw error; }
  const model = (insertedReports || insertedVotes || !target.prepare('SELECT 1 FROM svm_models LIMIT 1').get()) ? refreshVotesAndSvm(target) : null;
  console.log(JSON.stringify({ target: targetPath, source_reports: sourceRows.length, inserted_reports: insertedReports, source_votes: voteRows.length, inserted_votes: insertedVotes, total_reports: target.prepare('SELECT COUNT(*) AS n FROM reports').get().n, total_votes: target.prepare('SELECT COUNT(*) AS n FROM review_votes').get().n, source_runs: source.prepare('SELECT COUNT(*) AS n FROM runs').get().n, svm: model }));
} finally { source.close(); voteSource.close(); target.close(); }
