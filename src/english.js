const phrases = [
  ['辅助驾驶', 'driver-assistance'], ['智能驾驶', 'smart-driving'], ['自动驾驶', 'automated-driving'], ['事故', 'incident'], ['碰撞', 'collision'], ['追尾', 'rear-end collision'], ['失控', 'loss of control'], ['开启', 'active'], ['启用', 'active'], ['高速', 'highway'], ['道路', 'road'], ['车辆', 'vehicle'], ['乘员', 'occupant'], ['受伤', 'injured'], ['死亡', 'fatal'], ['称', 'reported'], ['导致', 'resulted in'], ['特斯拉', 'Tesla'], ['小鹏', 'XPeng'], ['理想', 'Li Auto'], ['华为', 'Huawei'], ['问界', 'AITO'], ['蔚来', 'NIO'], ['比亚迪', 'BYD']
];

function translateKnown(text) {
  let value = String(text || '').replace(/[“”「」]/g, '');
  for (const [from, to] of phrases) value = value.split(from).join(` ${to} `);
  return value.replace(/[，。！？：；、]/g, ', ').replace(/\s+/g, ' ').replace(/,\s*,/g, ',').replace(/^, |, $/g, '').trim();
}

/** Conservative, clearly machine-generated fallback; it does not infer causation or facts. */
export function englishDescription({ title, content, brand, cause, verification_status }) {
  const translatedTitle = translateKnown(title).slice(0, 220);
  const context = translateKnown(content).slice(0, 180);
  const label = [brand && brand !== 'Unknown' ? brand : null, cause && cause !== 'unclassified' ? `label: ${cause}` : null].filter(Boolean).join('; ');
  return [translatedTitle ? `Reported ${translatedTitle}.` : 'A public report was collected.', context ? `Source text: ${context}.` : null, label ? `Automatic labels: ${label}.` : null, `Verification status: ${verification_status || 'unverified'}.`].filter(Boolean).join(' ');
}

export const ENGLISH_DESCRIPTION_SOURCE = 'machine_heuristic_v1';
