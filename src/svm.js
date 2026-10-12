import fs from 'node:fs';
import path from 'node:path';
import { dataDir } from './config.js';

const modelPath = path.join(dataDir, 'svm-model.json');
export const SVM_ALGORITHM = 'linear_svm_pegasos_v2';
const segmenter = new Intl.Segmenter('zh-Hans', { granularity: 'word' });

function tokens(text) {
  const normalized = String(text ?? '').toLowerCase();
  const result = [];
  for (const part of segmenter.segment(normalized)) {
    if (!part.isWordLike) continue;
    const token = part.segment.trim();
    if (!token) continue;
    result.push(token);

  }
  // Add bigrams across word boundaries too: ICU may split an unfamiliar term
  // such as 刹车 into individual characters.
  for (const match of normalized.matchAll(/[\u3400-\u9fff]+/gu)) {
    const run = match[0];
    for (let i = 0; i < run.length - 1; i += 1) result.push(run.slice(i, i + 2));
  }
  return result;
}

export function vectorize(text) {
  const counts = {};
  for (const token of tokens(text)) counts[token] = (counts[token] || 0) + 1;
  const vector = {};
  let squaredNorm = 0;
  for (const [token, count] of Object.entries(counts)) {
    const value = 1 + Math.log(count);
    vector[token] = value;
    squaredNorm += value * value;
  }
  const norm = Math.sqrt(squaredNorm);
  if (norm > 0) for (const token of Object.keys(vector)) vector[token] /= norm;
  return vector;
}

export function trainSvm(samples, options = {}) {
  if (samples.length < 8 || new Set(samples.map(s => s.label)).size < 2) return null;
  const weights = {}; let bias = 0; const epochs = options.epochs || 20; const lambda = options.lambda || 0.0001;
  for (let epoch = 0; epoch < epochs; epoch += 1) for (const sample of samples) { const x = vectorize(sample.text); const y = sample.label > 0 ? 1 : -1; let score = bias; for (const [key, value] of Object.entries(x)) score += (weights[key] || 0) * value; const rate = 0.05 / (1 + epoch); for (const key of Object.keys(weights)) weights[key] *= (1 - rate * lambda); if (y * score < 1) { for (const [key, value] of Object.entries(x)) weights[key] = (weights[key] || 0) + rate * y * value; bias += rate * y; } }
  return { algorithm: SVM_ALGORITHM, trained_at: new Date().toISOString(), samples: samples.length, weights, bias };
}

export function scoreSvm(model, text) {
  if (!model || model.algorithm !== SVM_ALGORITHM) return null;
  const x = vectorize(text);
  return Object.entries(x).reduce((sum, [key, value]) => sum + (model.weights[key] || 0) * value, model.bias || 0);
}

export function saveSvm(model) { if (!model) return; fs.mkdirSync(path.dirname(modelPath), { recursive: true }); fs.writeFileSync(modelPath, JSON.stringify(model, null, 2) + '\n'); }
export function clearSvm() { if (fs.existsSync(modelPath)) fs.unlinkSync(modelPath); }
export function loadSvm(db) {
  if (db) {
    const row = db.prepare('SELECT algorithm,trained_at,samples,weights_json,bias FROM svm_models ORDER BY id DESC LIMIT 1').get();
    return row ? { algorithm: row.algorithm, trained_at: row.trained_at, samples: row.samples, weights: JSON.parse(row.weights_json), bias: row.bias } : null;
  }
  try { return JSON.parse(fs.readFileSync(modelPath, 'utf8')); } catch { return null; }
}
