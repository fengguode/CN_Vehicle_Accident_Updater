const URL_FIELDS = new Set(['source_url', 'discovery_url']);
// These institutional accounts were manually reviewed in the PRIV-02 scan; unknown handles are redacted.
const PUBLIC_INSTITUTION_MENTIONS = [
  '@湖南高速警察四支队',
  '@宁波晚报',
  '@莱西检察',
  '@Hunan',
  '@NINGBO',
  '@Laixi'
];

/** Remove common personal contact data and social account references from public narrative fields. */
export function redactPublicText(value) {
  let text = String(value ?? '')
    .replace(/^c\s+[^:：?]{1,80}[?:：]\s*/i, '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email redacted]')
    .replace(/(?<!\d)(?:\+?86[ \t-]?)?1[3-9](?:[ \t-]?\d){9}(?!\d)/g, '[phone redacted]')
    .replace(/(?<!\d)(?:\+?86[ \t-]?)?0\d{2,3}(?:[ \t-]?\d){7,8}(?!\d)/g, '[phone redacted]')
    .replace(/\b\d{17}[0-9Xx]\b/g, '[ID redacted]')
    .replace(/[\u3400-\u9fff][A-Z][A-Z0-9]{5,6}\b/g, '[license plate redacted]');
  const preserved = [];
  for (const mention of PUBLIC_INSTITUTION_MENTIONS) {
    const token = `\u0000${preserved.length}\u0000`;
    const pattern = new RegExp(`${mention.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[\\s,.:;，。！？!?])`, 'gi');
    if (pattern.test(text)) {
      pattern.lastIndex = 0;
      text = text.replace(pattern, token);
      preserved.push(mention);
    }
  }
  text = text.replace(/@[\p{L}\p{N}_-]{2,}/gu, '[account redacted]');
  return text.replace(/\u0000(\d+)\u0000/g, (_, index) => preserved[Number(index)]);
}

/** Preserve stable source provenance while omitting account-level social author identifiers. */
export function sanitizePublicRecord(record) {
  const socialSource = ['weibo', 'weibo_web_index'].includes(record.platform);
  const sanitizeValue = (key, value) => {
    if (URL_FIELDS.has(key) || key === 'fingerprint') return value;
    if (typeof value === 'string') return redactPublicText(value);
    if (Array.isArray(value)) return value.map((item) => sanitizeValue('', item));
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, sanitizeValue(childKey, childValue)]));
    }
    return value;
  };
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [
    key,
    key === 'author' && socialSource
      ? null
      : sanitizeValue(key, value)
  ]));
}
