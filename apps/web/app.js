const state = { page: 1, pageSize: 20, sort: 'date', language: localStorage.getItem('adas-language') === 'zh' ? 'zh' : 'en' };
const $ = (selector) => document.querySelector(selector);
let searchTimer;
let summarySnapshot;
const labels = {
  en: { eyebrow: 'CHINA ADAS INCIDENT DATABASE', heading: 'Reported incident leads', loading: 'Loading reports…', keyword: 'Keyword', brand: 'Brand', cause: 'Cause', province: 'Province', road: 'Road type', verification: 'Verification', sort: 'Sort by', all: 'All', dateSort: 'Date (newest first)', relevanceSort: 'SVM relevance', previous: 'Previous', next: 'Next', reports: 'reports', unverified: 'unverified', latest: 'Latest update', noReports: 'No reports match these filters.', loadError: 'Could not load reports. Check that the home database service is running.', missingTitle: 'Untitled report', openSource: 'Open original source', searchPlaceholder: 'Title, content, source' },
  zh: { eyebrow: '中国 ADAS 事故数据库', heading: '公开报告线索', loading: '正在加载…', keyword: '关键词', brand: '品牌', cause: '事故原因', province: '省份', road: '道路类型', verification: '核验状态', sort: '排序方式', all: '全部', dateSort: '日期（最新优先）', relevanceSort: 'SVM 相关度', previous: '上一页', next: '下一页', reports: '条报告', unverified: '条未核实', latest: '最近更新', noReports: '没有符合条件的报告。', loadError: '无法加载报告，请确认家用数据库服务正在运行。', missingTitle: '未命名报告', openSource: '打开原始来源', searchPlaceholder: '标题、内容或来源' }
};
const text = (key) => labels[state.language][key];

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

function updateLanguageButton() {
  $('#language-toggle').textContent = state.language === 'en' ? '中文' : 'English';
  document.documentElement.lang = state.language === 'en' ? 'en' : 'zh-CN';
  document.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = text(element.dataset.i18n); });
  $('#query').placeholder = text('searchPlaceholder');
}

function renderSummary() {
  if (!summarySnapshot) return;
  $('#record-total').textContent = `${summarySnapshot.total} ${text('reports')} · ${summarySnapshot.unverified} ${text('unverified')}`;
  $('#latest-collection').textContent = summarySnapshot.latest_collection ? `${text('latest')}: ${summarySnapshot.latest_collection.slice(0, 10)}` : '';
}

function addText(parent, tag, value, className = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value || '';
  parent.append(element);
  return element;
}

function reportCard(report) {
  const card = document.createElement('article');
  card.className = 'report-card';
  const title = state.language === 'zh' ? report.title_zh : report.title_en;
  const content = state.language === 'zh' ? report.content_zh : (report.description_en || report.content_en);
  const date = report.event_date || report.published_at || report.collected_at || '';
  addText(card, 'time', date.slice(0, 10));
  addText(card, 'h2', title || text('missingTitle'));
  addText(card, 'p', content || '', 'report-content');
  const details = [report.publisher_name || report.source_name, report.brand, report.cause, report.road_type, report.province, report.verification_status].filter(Boolean).join(' · ');
  addText(card, 'p', details, 'report-meta');
  if (Number.isFinite(report.svm_score)) addText(card, 'p', `SVM: ${report.svm_score.toFixed(3)}`, 'report-score');
  if (report.source_url) {
    try {
      const source = new URL(report.source_url);
      if (source.protocol === 'https:') {
        const link = document.createElement('a');
        link.href = source.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = text('openSource');
        card.append(link);
      }
    } catch {}
  }
  return card;
}

function currentFilters() {
  const params = new URLSearchParams({ page: String(state.page), page_size: String(state.pageSize), sort: state.sort });
  const query = $('#query').value.trim();
  if (query) params.set('q', query);
  document.querySelectorAll('[data-filter]').forEach((control) => { if (control.value) params.set(control.dataset.filter, control.value); });
  return params;
}

async function loadReports() {
  const list = $('#reports');
  list.replaceChildren();
  addText(list, 'p', 'Loading…');
  try {
    const result = await fetchJson(`/api/reports?${currentFilters()}`);
    list.replaceChildren(...(result.data.length ? result.data.map(reportCard) : [addText(document.createElement('div'), 'p', text('noReports'))]));
    $('#page-status').textContent = `${result.page} / ${Math.max(result.pages, 1)} · ${result.total} ${text('reports')}`;
    $('#previous').disabled = result.page <= 1;
    $('#next').disabled = result.page >= result.pages;
  } catch {
    list.replaceChildren();
    addText(list, 'p', text('loadError'));
  }
}

async function initialize() {
  updateLanguageButton();
  try {
    const [summary, filters] = await Promise.all([fetchJson('/api/summary'), fetchJson('/api/filters')]);
    summarySnapshot = summary;
    renderSummary();
    for (const field of ['brand', 'cause', 'province', 'road_type', 'verification_status']) {
      const select = document.querySelector(`[data-filter="${field}"]`);
      for (const value of filters[field] || []) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.append(option);
      }
    }
  } catch {
    $('#record-total').textContent = text('loadError');
  }
  await loadReports();
}

$('#language-toggle').addEventListener('click', () => {
  state.language = state.language === 'en' ? 'zh' : 'en';
  localStorage.setItem('adas-language', state.language);
  updateLanguageButton();
  renderSummary();
  loadReports();
});
$('#sort').addEventListener('change', (event) => { state.sort = event.target.value; state.page = 1; loadReports(); });
$('#query').addEventListener('input', () => { clearTimeout(searchTimer); state.page = 1; searchTimer = setTimeout(loadReports, 250); });
document.querySelectorAll('[data-filter]').forEach((control) => control.addEventListener('change', () => { state.page = 1; loadReports(); }));
$('#previous').addEventListener('click', () => { state.page = Math.max(1, state.page - 1); loadReports(); });
$('#next').addEventListener('click', () => { state.page += 1; loadReports(); });

initialize();
