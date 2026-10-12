function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * fraction;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function rounded(value) { return value === null ? null : Math.round(value * 10) / 10; }

export function summarizeWeiboSourceQuality(items, collectedAt = new Date()) {
  const now = collectedAt.getTime();
  const ages = [];
  const lengths = [];
  let enriched = 0;
  for (const item of items) {
    if (item.enrichment_source === 'weibo_public_html') enriched += 1;
    lengths.push(String(item.content || '').length);
    const published = Date.parse(String(item.published_at || ''));
    if (Number.isFinite(published) && published <= now && published > 0) ages.push((now - published) / 3_600_000);
  }
  return {
    resolved_posts: items.length,
    public_text_enriched: enriched,
    feed_timestamped: ages.length,
    feed_age_median_hours: rounded(percentile(ages, 0.5)),
    feed_age_p90_hours: rounded(percentile(ages, 0.9)),
    content_chars_median: rounded(percentile(lengths, 0.5))
  };
}
