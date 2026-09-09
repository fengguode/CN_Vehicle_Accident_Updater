import crypto from 'node:crypto';
import { classify } from './classifier.js';
import { englishDescription, ENGLISH_DESCRIPTION_SOURCE } from './english.js';
import { publisherName } from './provenance.js';

export function cleanUrl(raw) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|spm|from|source|ref)/i.test(key)) url.searchParams.delete(key);
    }
    url.hash = '';
    return url.toString();
  } catch { return raw; }
}

function normalizeText(text) {
  return String(text || '').normalize('NFKC').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function fingerprint(input) {
  const url = cleanUrl(input.canonical_url || input.url || input.source_url);
  const basis = url || `${normalizeText(input.title).toLowerCase()}|${String(input.published_at || input.event_date || '').slice(0, 10)}`;
  return crypto.createHash('sha256').update(basis).digest('hex');
}

export function normalizeReport(input, source = {}) {
  const now = new Date().toISOString();
  const title = normalizeText(input.title);
  const content = normalizeText(input.content || input.description || input.summary);
  const labels = classify({ title, content });
  const sourceUrl = cleanUrl(input.source_url || input.url || input.link);
  return {
    fingerprint: fingerprint({ ...input, title, source_url: sourceUrl }),
    canonical_url: cleanUrl(input.canonical_url || sourceUrl),
    source_url: sourceUrl,
    publisher_name: publisherName(sourceUrl),
    discovery_url: cleanUrl(input.discovery_url || (input.url && input.url !== sourceUrl ? input.url : null)),
    source_name: input.source_name || source.name || source.id || 'unknown',
    platform: input.platform || source.platform || 'unknown',
    external_id: input.external_id || input.guid || null,
    title,
    content,
    author: normalizeText(input.author) || null,
    published_at: validDate(input.published_at || input.pubDate),
    collected_at: now,
    event_date: validDate(input.event_date),
    ...labels,
    model: input.model || null,
    city: input.city || null,
    injuries: integerOrNull(input.injuries),
    fatalities: integerOrNull(input.fatalities),
    verification_status: input.verification_status || 'unverified',
    raw_json: JSON.stringify(input),
    english_description: input.english_description || englishDescription({ title, content, ...labels, source_url: sourceUrl, publisher_name: publisherName(sourceUrl), verification_status: input.verification_status || 'unverified' }),
    english_description_source: input.english_description_source || ENGLISH_DESCRIPTION_SOURCE,
    duplicate_of: null,
    review_notes: null,
    created_at: now,
    updated_at: now
  };
}

function validDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function integerOrNull(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : null;
}
