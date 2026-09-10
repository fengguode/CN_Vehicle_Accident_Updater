import { openDb } from './db.js';

const db = openDb();
const rows = db.prepare('SELECT id, title, content FROM reports WHERE title_en IS NULL OR content_en IS NULL ORDER BY id').all();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function translate(text) {
  const value = String(text || '');
  if (!value || !/[\u3400-\u9fff]/.test(value)) return value;
  const chunks = value.match(/[\s\S]{1,1400}(?:\n|$)|[\s\S]{1,1400}/g) || [value];
  const translated = [];
  for (const chunk of chunks) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=${encodeURIComponent(chunk)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`translation_http_${response.status}`);
    const body = await response.json();
    translated.push((body[0] || []).map((part) => part[0]).join(''));
    await sleep(120);
  }
  return translated.join('\n').trim();
}

let completed = 0;
for (const row of rows) {
  try {
    const title = await translate(row.title);
    const content = await translate(row.content);
    db.prepare('UPDATE reports SET title_en=?, content_en=?, updated_at=? WHERE id=?').run(title, content, new Date().toISOString(), row.id);
    completed += 1;
    if (completed % 10 === 0) console.log(`translated ${completed}/${rows.length}`);
  } catch (error) {
    console.error(`translation failed for report ${row.id}: ${error.message}`);
  }
}
db.close();
console.log(JSON.stringify({ requested: rows.length, completed }));
