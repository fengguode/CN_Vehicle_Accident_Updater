import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { rootDir } from '../../src/config.js';
import { inboxFiles, readJsonl } from '../../src/importer.js';
import { runCollection } from '../../src/pipeline.js';

const platforms = new Set(['weibo', 'xiaohongshu', 'douyin', 'other_social']);
const forbiddenKeys = new Set(['cookie', 'cookies', 'token', 'access_token', 'password', 'raw_html', 'session']);
const videoStatuses = new Set(['present', 'absent', 'unknown']);

export function validateSocialItem(item, label = 'item') {
  if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`${label}: each JSONL row must be an object`);
  if (!String(item.title || '').trim()) throw new Error(`${label}: title is required`);
  if (!platforms.has(item.platform)) throw new Error(`${label}: unsupported social platform`);
  if (!/^https:\/\//i.test(String(item.url || ''))) throw new Error(`${label}: https source URL is required`);
  const secretKey = Object.keys(item).find((key) => forbiddenKeys.has(key.toLowerCase()));
  if (secretKey) throw new Error(`${label}: secret/session field '${secretKey}' is forbidden`);
  if (item.video_status !== undefined && !videoStatuses.has(item.video_status)) throw new Error(`${label}: video_status must be present, absent, or unknown`);
  if (item.video_thumbnail_url !== undefined) {
    let thumbnail;
    try { thumbnail = new URL(item.video_thumbnail_url); } catch {}
    if (!(thumbnail instanceof URL) || thumbnail.protocol !== 'https:' || thumbnail.username || thumbnail.password || item.video_status !== 'present') {
      throw new Error(`${label}: video_thumbnail_url requires video_status present and an HTTPS URL without credentials`);
    }
  }
  return item;
}

export async function importInbox() {
  const files = inboxFiles(path.join(rootDir, 'data/inbox'));
  for (const file of files) {
    for (const [index, item] of readJsonl(file).entries()) {
      validateSocialItem(item, `${path.basename(file)} line ${index + 1}`);
    }
  }

  const result = await runCollection({ sourceIds: ['manual-platform-exports'], importOnly: true });
  if (!result.errors.length) {
    for (const file of files) {
      const processed = `${file}.processed`;
      if (fs.existsSync(processed)) throw new Error(`Processed-file target already exists: ${path.basename(processed)}`);
      fs.renameSync(file, processed);
    }
  }
  result.archived_files = result.errors.length ? 0 : files.length;
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) process.exitCode = 1;
  return result;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) await importInbox();
