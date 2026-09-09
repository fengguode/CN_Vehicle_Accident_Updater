import fs from 'node:fs';
import path from 'node:path';
import { openDb } from './db.js';
import { runCollection } from './pipeline.js';
import { dataDir, ensureDirectories } from './config.js';
import { hydratePublicData } from './hydrate.js';
import { backfillReports } from './backfill.js';

const command = process.argv[2] || 'help';

if (command === 'init') {
  const db = openDb(); db.close();
  console.log('Database initialized.');
} else if (command === 'collect' || command === 'import') {
  console.log(JSON.stringify(await runCollection({ importOnly: command === 'import' }), null, 2));
} else if (command === 'stats') {
  const db = openDb();
  const stats = {
    reports: db.prepare('SELECT COUNT(*) count FROM reports').get().count,
    needsReview: db.prepare("SELECT COUNT(*) count FROM reports WHERE verification_status='unverified'").get().count,
    latestRun: db.prepare('SELECT * FROM runs ORDER BY id DESC LIMIT 1').get() || null
  };
  console.log(JSON.stringify(stats, null, 2)); db.close();
} else if (command === 'export') {
  ensureDirectories();
  const db = openDb();
  const rows = db.prepare('SELECT * FROM reports ORDER BY COALESCE(published_at,collected_at) DESC').all();
  const stamp = new Date().toISOString().slice(0, 10);
  const target = path.join(dataDir, 'exports', `adas-accidents-${stamp}.json`);
  fs.writeFileSync(target, JSON.stringify(rows.map((r) => ({ ...r, labels: JSON.parse(r.labels_json) })), null, 2));
  console.log(target); db.close();
} else if (command === 'hydrate') {
  const db = openDb();
  console.log(JSON.stringify(hydratePublicData(process.argv[3] || '../china-adas-accident-database/data/reports.json', db), null, 2));
  db.close();
} else if (command === 'backfill') {
  const db = openDb();
  console.log(JSON.stringify(await backfillReports({ db, offline: process.argv.includes('--offline') }), null, 2));
  db.close();
} else {
  console.log('Usage: npm run init | collect | import | serve | export | stats | hydrate | backfill [--offline]');
}
