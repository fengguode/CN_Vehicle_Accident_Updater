import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('public dataset contract is documented', () => {
  const root = path.resolve('..', 'china-adas-accident-database');
  const metadata = JSON.parse(fs.readFileSync(path.join(root, 'data', 'metadata.json')));
  const reports = JSON.parse(fs.readFileSync(path.join(root, 'data', 'reports.json')));
  assert.equal(metadata.record_count, reports.length);
  assert.equal(metadata.schema_version, '1.0.0');
  assert.ok(fs.existsSync(path.join(root, 'site', 'index.html')));
});
