export function projectReportCard(report, language = 'en') {
  const title = language === 'zh'
    ? (report.title_zh_short || report.title_zh || report.title)
    : (report.title_en_short || report.title_en || report.title_zh_short || report.title_zh || report.title);
  const summary = language === 'zh'
    ? (report.summary_zh || report.content_zh)
    : (report.summary_en || report.description_en || report.content_en || report.summary_zh || report.content_zh);
  return {
    title: title || (language === 'zh' ? '未命名报告' : 'Untitled report'),
    summary: String(summary || '').trim(),
    date: (report.event_date || report.published_at || report.collected_at || '').slice(0, 10),
    source: report.publisher_name || report.source_name || '',
    platform: report.platform || '',
    location: [report.city, report.province].filter(Boolean).join(' · '),
    status: report.verification_status || 'unverified',
    media: projectReportMedia(report)
  };
}

export function projectReportMedia(report = {}) {
  if (report.media?.video_status !== 'present') return null;
  const thumbnail = safeHttpsUrl(report.media.thumbnail_url);
  const source = safeHttpsUrl(report.source_url);
  return { thumbnail: thumbnail?.href || null, source: source?.href || null };
}

function safeHttpsUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url : null;
  } catch { return null; }
}
