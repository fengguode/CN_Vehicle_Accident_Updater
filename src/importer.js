import fs from 'node:fs';
import path from 'node:path';

export function readJsonl(file) {
  const text = fs.readFileSync(file, 'utf8');
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); }
    catch (error) { throw new Error(`${path.basename(file)} line ${index + 1}: ${error.message}`); }
  });
}

export function inboxFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith('.jsonl')).map((name) => path.join(dir, name));
}
