import fs from 'node:fs';
import path from 'node:path';
import { dataDir } from './config.js';

const modelPath = path.join(dataDir, 'svm-model.json');
const tokens = (text) => String(text || '').toLowerCase().match(/[\u3400-\u9fff]{1,4}|[a-z0-9_]{2,}/g) || [];
export function vectorize(text) { const vector = {}; for (const token of tokens(text)) vector[token] = (vector[token] || 0) + 1; return vector; }
export function trainSvm(samples, options = {}) {
  if (samples.length < 8 || new Set(samples.map(s => s.label)).size < 2) return null;
  const weights = {}; let bias = 0; const epochs = options.epochs || 20; const lambda = options.lambda || 0.0001;
  for (let epoch = 0; epoch < epochs; epoch += 1) for (const sample of samples) { const x = vectorize(sample.text); const y = sample.label > 0 ? 1 : -1; let score = bias; for (const [key, value] of Object.entries(x)) score += (weights[key] || 0) * value; const rate = 0.05 / (1 + epoch); for (const key of Object.keys(weights)) weights[key] *= (1 - rate * lambda); if (y * score < 1) { for (const [key, value] of Object.entries(x)) weights[key] = (weights[key] || 0) + rate * y * value; bias += rate * y; } }
  return { algorithm: 'linear_svm_pegasos_v1', trained_at: new Date().toISOString(), samples: samples.length, weights, bias };
}
export function scoreSvm(model, text) { if (!model) return null; const x = vectorize(text); return Object.entries(x).reduce((sum, [key, value]) => sum + (model.weights[key] || 0) * value, model.bias || 0); }
export function saveSvm(model) { if (!model) return; fs.mkdirSync(path.dirname(modelPath), { recursive: true }); fs.writeFileSync(modelPath, JSON.stringify(model, null, 2) + '\n'); }
export function clearSvm() { if (fs.existsSync(modelPath)) fs.unlinkSync(modelPath); }
export function loadSvm(db) {
  if (db) {
    const row = db.prepare('SELECT algorithm,trained_at,samples,weights_json,bias FROM svm_models ORDER BY id DESC LIMIT 1').get();
    return row ? { algorithm: row.algorithm, trained_at: row.trained_at, samples: row.samples, weights: JSON.parse(row.weights_json), bias: row.bias } : null;
  }
  try { return JSON.parse(fs.readFileSync(modelPath, 'utf8')); } catch { return null; }
}
