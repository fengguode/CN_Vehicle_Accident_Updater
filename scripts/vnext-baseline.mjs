import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync, backup } from 'node:sqlite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = path.dirname(root);
const paths = {
  reports: path.resolve(process.env.ADAS_BASELINE_REPORTS_DB || path.join(workspace, 'china-adas-accident-methods/data/adas-accidents.db')),
  votes: path.resolve(process.env.ADAS_BASELINE_VOTES_DB || path.join(workspace, 'china-adas-accident-methods/data/votes.db')),
  vnext: path.resolve(process.env.ADAS_BASELINE_VNEXT_DB || path.join(root, 'data/adas-accidents.db')),
  public: path.resolve(process.env.ADAS_BASELINE_PUBLIC_JSON || path.join(workspace, 'china-adas-accident-database/data/reports.json')),
  model: path.resolve(process.env.ADAS_BASELINE_SVM_MODEL || path.join(workspace, 'china-adas-accident-methods/data/svm-model.json'))
};
const backupRoot = path.resolve(process.env.ADAS_BASELINE_BACKUP_DIR || path.join(workspace, 'baseline-backups'));
if (backupRoot === root || !path.relative(root, backupRoot).startsWith('..')) {
  throw new Error('Backups must be stored outside the updater repository.');
}
for (const [name, file] of Object.entries(paths)) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error(`Missing ${name} source: ${file}`);
}

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function inspectDb(file) {
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    const integrity = db.prepare('PRAGMA integrity_check').get().integrity_check;
    if (integrity !== 'ok') throw new Error(`SQLite integrity check failed for ${file}: ${integrity}`);
    const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((row) => row.name));
    const count = (table) => tables.has(table) ? db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n : null;
    const result = { integrity, reports: count('reports'), votes: count('votes'), review_votes: count('review_votes'), runs: count('runs'), source_state: count('source_state'), users: count('users') };
    if (tables.has('reports')) {
      result.distinct_fingerprints = db.prepare('SELECT COUNT(DISTINCT fingerprint) AS n FROM reports').get().n;
      result.canonical_url_duplicates = db.prepare("SELECT COUNT(*) AS n FROM (SELECT canonical_url FROM reports WHERE canonical_url IS NOT NULL AND canonical_url<>'' GROUP BY canonical_url HAVING COUNT(*)>1)").get().n;
    }
    return result;
  } finally { db.close(); }
}

function reportFingerprints(file) {
  const db = new DatabaseSync(file, { readOnly: true });
  try { return new Set(db.prepare('SELECT fingerprint FROM reports').all().map((row) => row.fingerprint)); }
  finally { db.close(); }
}

function voteDigest(file, table) {
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    const rows = db.prepare(`SELECT fingerprint,voter_id,vote FROM ${table} ORDER BY fingerprint,voter_id`).all();
    return crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex');
  } finally { db.close(); }
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.mkdirSync(backupRoot, { recursive: true });
const folder = path.join(backupRoot, stamp);
fs.mkdirSync(folder);
const files = {};
for (const name of ['reports', 'votes', 'vnext']) {
  const target = path.join(folder, `${name}.db`);
  const source = new DatabaseSync(paths[name], { readOnly: true });
  try { await backup(source, target); }
  finally { source.close(); }
  files[name] = { backup: path.basename(target), bytes: fs.statSync(target).size, sha256: hashFile(target), ...inspectDb(target) };
}
for (const name of ['public', 'model']) {
  const target = path.join(folder, name === 'public' ? 'reports.json' : 'svm-model.json');
  fs.copyFileSync(paths[name], target);
  files[name] = { backup: path.basename(target), bytes: fs.statSync(target).size, sha256: hashFile(target) };
}
const publicReports = JSON.parse(fs.readFileSync(path.join(folder, 'reports.json'), 'utf8'));
if (!Array.isArray(publicReports)) throw new Error('The public report snapshot is not a JSON array.');
const publicFingerprints = new Set(publicReports.map((report) => report.fingerprint).filter(Boolean));
const sourceFingerprints = reportFingerprints(path.join(folder, 'reports.db'));
const model = JSON.parse(fs.readFileSync(path.join(folder, 'svm-model.json'), 'utf8'));
const reconciliation = {
  public_reports: publicReports.length,
  public_distinct_fingerprints: publicFingerprints.size,
  public_only_fingerprints: [...publicFingerprints].filter((id) => !sourceFingerprints.has(id)).length,
  database_only_fingerprints: [...sourceFingerprints].filter((id) => !publicFingerprints.has(id)).length,
  vote_snapshots_match: voteDigest(path.join(folder, 'reports.db'), 'review_votes') === voteDigest(path.join(folder, 'votes.db'), 'votes'),
  svm_training_samples: typeof model.samples === 'number' ? model.samples : model.samples?.length ?? null
};
const manifest = {
  created_at: new Date().toISOString(),
  sources: paths,
  files,
  reconciliation,
  identity_rules: {
    report: 'fingerprint is the primary identity; a nonempty canonical URL is checked for collisions before insert',
    vote: 'one current vote per fingerprint and voter_id; later changes replace and revocations remove that row',
    text: 'retain original source URL, Chinese text, English fields, and provenance without translating during import'
  }
};
fs.writeFileSync(path.join(folder, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ backup_folder: folder, files: Object.fromEntries(Object.entries(files).map(([name, item]) => [name, { bytes: item.bytes, integrity: item.integrity ?? null, reports: item.reports ?? null, votes: item.votes ?? item.review_votes ?? null }])), reconciliation }));
