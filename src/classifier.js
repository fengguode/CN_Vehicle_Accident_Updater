import { readJson } from './config.js';

const taxonomy = readJson('config/taxonomy.json');

function normalized(text) {
  return String(text || '').toLocaleLowerCase('zh-CN').replace(/\s+/g, ' ');
}

function scoreMap(text, map, fallback) {
  const value = normalized(text);
  let best = { label: fallback, hits: [] };
  for (const [label, terms] of Object.entries(map)) {
    const hits = terms.filter((term) => value.includes(normalized(term)));
    if (hits.length > best.hits.length) best = { label, hits };
  }
  return best;
}

function allMatches(text, map) {
  const value = normalized(text);
  return Object.entries(map).flatMap(([label, terms]) => terms.some((term) => value.includes(normalized(term))) ? [label] : []);
}

export function classify(input) {
  const text = `${input.title || ''} ${input.content || ''}`;
  const brand = scoreMap(text, taxonomy.brands, 'Unknown');
  const cause = scoreMap(text, taxonomy.causes, 'unclassified');
  const road = scoreMap(text, taxonomy.roadTypes, 'unknown');
  const severity = scoreMap(text, taxonomy.severity, 'unknown');
  const mode = scoreMap(text, taxonomy.adasModes, 'unknown');
  const province = taxonomy.provinces.find((name) => normalized(text).includes(normalized(name))) || null;
  const adasTerms = ['辅助驾驶', '智能驾驶', '自动驾驶', 'adas', 'autopilot', 'fsd', 'noa', 'nop', 'ngp', '智驾'];
  const accidentTerms = ['事故', '车祸', '碰撞', '撞', '追尾', '追撞', '撞车', '失控', '伤亡', '险情'];
  const hasAdas = adasTerms.some((x) => normalized(text).includes(x));
  const hasAccident = accidentTerms.some((x) => normalized(text).includes(x));
  const relevanceScore = Number(((hasAdas ? 0.55 : 0) + (hasAccident ? 0.35 : 0) + (brand.hits.length ? 0.1 : 0)).toFixed(2));
  return {
    brand: brand.label,
    cause: cause.label,
    cause_confidence: cause.hits.length ? Math.min(0.45 + cause.hits.length * 0.15, 0.9) : 0,
    road_type: road.label,
    severity: severity.label,
    adas_mode: mode.label,
    province,
    relevance_score: relevanceScore,
    labels_json: JSON.stringify({
      brandMatches: allMatches(text, taxonomy.brands),
      causeMatches: allMatches(text, taxonomy.causes),
      roadMatches: allMatches(text, taxonomy.roadTypes),
      severityMatches: allMatches(text, taxonomy.severity),
      matchedKeywords: [...brand.hits, ...cause.hits, ...road.hits, ...severity.hits, ...mode.hits]
    })
  };
}
