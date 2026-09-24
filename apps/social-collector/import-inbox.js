import path from 'node:path';
import { rootDir } from '../../src/config.js';
import { inboxFiles, readJsonl } from '../../src/importer.js';
import { runCollection } from '../../src/pipeline.js';

const platforms = new Set(['weibo', 'xiaohongshu', 'douyin', 'other_social']);
const forbiddenKeys = new Set(['cookie', 'cookies', 'token', 'access_token', 'password', 'raw_html', 'session']);
const files = inboxFiles(path.join(rootDir, 'data/inbox'));
for (const file of files) {
  for (const [index, item] of readJsonl(file).entries()) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`${path.basename(file)} line ${index + 1}: each JSONL row must be an object`);
    if (!String(item.title || '').trim()) throw new Error(`${path.basename(file)} line ${index + 1}: title is required`);
    if (!platforms.has(item.platform)) throw new Error(`${path.basename(file)} line ${index + 1}: unsupported social platform`);
    if (!/^https:\/\//i.test(String(item.url || ''))) throw new Error(`${path.basename(file)} line ${index + 1}: https source URL is required`);
    const secretKey = Object.keys(item).find((key) => forbiddenKeys.has(key.toLowerCase()));
    if (secretKey) throw new Error(`${path.basename(file)} line ${index + 1}: secret/session field '${secretKey}' is forbidden`);
  }
}

const result = await runCollection({ sourceIds: ['manual-platform-exports'], importOnly: true });
console.log(JSON.stringify(result, null, 2));
if (result.errors.length) process.exitCode = 1;
