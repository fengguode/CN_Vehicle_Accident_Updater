import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const dataDir = path.join(rootDir, 'data');
export const dbPath = path.resolve(rootDir, process.env.ADAS_DB_PATH || 'data/adas-accidents.db');

export function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), 'utf8'));
}

export function ensureDirectories() {
  for (const dir of [dataDir, path.join(dataDir, 'inbox'), path.join(dataDir, 'exports')]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
