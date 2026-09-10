const provinces = { 北京: 'Beijing', 天津: 'Tianjin', 上海: 'Shanghai', 重庆: 'Chongqing', 河北: 'Hebei', 山西: 'Shanxi', 辽宁: 'Liaoning', 吉林: 'Jilin', 黑龙江: 'Heilongjiang', 江苏: 'Jiangsu', 浙江: 'Zhejiang', 安徽: 'Anhui', 福建: 'Fujian', 江西: 'Jiangxi', 山东: 'Shandong', 河南: 'Henan', 湖北: 'Hubei', 湖南: 'Hunan', 广东: 'Guangdong', 海南: 'Hainan', 四川: 'Sichuan', 贵州: 'Guizhou', 云南: 'Yunnan', 陕西: 'Shaanxi', 甘肃: 'Gansu', 青海: 'Qinghai', 内蒙古: 'Inner Mongolia', 广西: 'Guangxi', 西藏: 'Tibet', 宁夏: 'Ningxia', 新疆: 'Xinjiang', 台湾: 'Taiwan', 香港: 'Hong Kong', 澳门: 'Macau' };
const causes = { perception_failure: 'a possible perception failure', unexpected_braking: 'a possible unexpected-braking issue', lane_or_steering: 'a possible lane or steering issue', driver_misuse_or_inattention: 'a possible driver-attention or misuse issue', handover_failure: 'a possible handover issue', speed_or_distance: 'a possible following-distance or speed issue', road_or_weather: 'a possible road or weather factor', mechanical_or_tire: 'a possible mechanical or tire issue', unknown_or_disputed: 'an unknown or disputed cause' };
const roads = { highway: 'a highway', urban: 'an urban road', rural: 'a rural road', parking: 'a parking area', other_or_unknown: 'an unspecified road' };
const severity = { fatal: 'fatal outcome', serious_injury: 'serious injury', minor_injury: 'minor injury', property_damage: 'property damage', near_miss: 'near miss' };
const modes = { active: 'The report claims driver assistance was active.', claimed_active: 'The report claims driver assistance may have been active.', inactive: 'The report says driver assistance was inactive.', unknown: 'The driver-assistance state is unknown.' };
const statuses = { human_verified: 'Verified report', disputed: 'Disputed report', unverified: 'Unverified report' };
const ascii = (value) => /^[\x00-\x7F]*$/.test(String(value || ''));

/** Conservative, clearly machine-generated fallback; it does not infer causation or facts. */
export function englishDescription({ title, content, brand, cause, verification_status }) {
  const status = statuses[verification_status] || 'Unverified report';
  const subject = brand && brand !== 'Unknown' ? brand : 'an unidentified vehicle';
  const location = roads[arguments[0]?.road_type] || 'an unspecified road';
  const province = provinces[arguments[0]?.province] || null;
  const place = province ? `${location} in ${province}` : location;
  const causePhrase = causes[cause] || 'an unclassified cause';
  const model = arguments[0]?.model && ascii(arguments[0].model) ? ` (${arguments[0].model})` : '';
  const severityPhrase = severity[arguments[0]?.severity];
  const publisher = arguments[0]?.publisher_name && ascii(arguments[0].publisher_name) ? ` Source: ${arguments[0].publisher_name}.` : (arguments[0]?.source_url?.includes('news.google.com') ? ' Original publisher URL unresolved; discovery reference retained.' : ' Original publisher unspecified.');
  const date = String(arguments[0]?.event_date || arguments[0]?.published_at || '').slice(0, 10);
  return `${status} involving ${subject}${model} on ${place}, categorized as ${causePhrase}. ${modes[arguments[0]?.adas_mode] || modes.unknown}${severityPhrase ? ` Coded outcome: ${severityPhrase}.` : ''}${date ? ` Report date: ${date}.` : ''}${publisher}`;
}

const brandNames = { 理想: 'Li Auto', 理想汽车: 'Li Auto', 小米: 'Xiaomi', 小鹏: 'XPeng', 华为: 'Huawei', 问界: 'AITO', 特斯拉: 'Tesla', 比亚迪: 'BYD', 岚图: 'Voyah', 吉利: 'Geely', 尊界: 'Maextro', 蔚来: 'NIO', 智己: 'IM Motors', 极氪: 'Zeekr' };
const titleTerms = [
  [/辅助驾驶|智驾|领航辅助|自动驾驶/, 'driver-assistance'],
  [/追尾|追撞/, 'rear-end collision'],
  [/碰撞|撞车|车祸|事故/, 'crash/incident'],
  [/失控|偏航|偏移/, 'loss-of-control event'],
  [/险情|差点|避免事故/, 'near miss'],
  [/受伤|伤亡|死亡/, 'injury/fatality report'],
  [/AEB|自动紧急制动/, 'AEB event']
];

/** English title stored in the JSON publication; original Chinese title remains in `title`. */
export function englishTitle({ title = '', brand, model, cause, severity }) {
  const text = String(title);
  if (ascii(text) && text.trim()) return text.trim();
  const brandText = Object.entries(brandNames).find(([key]) => text.includes(key))?.[1] || (brand && brand !== 'Unknown' ? brand : 'Vehicle');
  const modelText = model && ascii(model) ? ` ${model}` : '';
  const term = titleTerms.find(([pattern]) => pattern.test(text))?.[1] || 'road-safety report';
  const outcome = severity === 'fatal' ? ' with a fatal outcome' : severity === 'serious_injury' ? ' involving serious injury' : severity === 'minor_injury' ? ' involving minor injury' : '';
  return `${brandText}${modelText} ${term}${outcome}`;
}

export async function translateDescription(text, options = {}) {
  const endpoint = options.endpoint || process.env.ADAS_TRANSLATION_ENDPOINT;
  if (!endpoint) return null;
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, target_language: 'en' }), signal: AbortSignal.timeout(options.timeoutMs ?? 15000) });
    if (!response.ok) return null;
    const body = await response.json();
    const value = body.translation || body.translatedText || body.text;
    return typeof value === 'string' && !/[\u3400-\u9fff]/.test(value) ? value.trim() : null;
  } catch { return null; }
}

export const ENGLISH_DESCRIPTION_SOURCE = 'machine_heuristic_v1';
