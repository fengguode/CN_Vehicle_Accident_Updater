import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCollection } from '../../src/pipeline.js';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(appDir, 'public-sources.json'), 'utf8'));
const result = await runCollection({ sourceIds: config.source_ids });
console.log(JSON.stringify(result, null, 2));
if (result.errors.length) process.exitCode = 1;
