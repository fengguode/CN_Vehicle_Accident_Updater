const state = { page: 1, pageSize: 20, sort: 'date', language: localStorage.getItem('adas-language') === 'zh' ? 'zh' : 'en', user: null, csrf: null, authMode: 'login' };
const $ = (selector) => document.querySelector(selector);
let searchTimer;
let summarySnapshot;
const labels = {
  en: { eyebrow: 'CHINA ADAS INCIDENT DATABASE', heading: 'Reported incident leads', loading: 'Loading reports…', keyword: 'Keyword', brand: 'Brand', cause: 'Cause', province: 'Province', road: 'Road type', verification: 'Verification', sort: 'Sort by', all: 'All', dateSort: 'Date (newest first)', relevanceSort: 'SVM relevance', previous: 'Previous', next: 'Next', reports: 'reports', unverified: 'unverified', latest: 'Latest update', noReports: 'No reports match these filters.', loadError: 'Could not load reports. Check that the home database service is running.', missingTitle: 'Untitled report', openSource: 'Open original source', searchPlaceholder: 'Title, content, source', username: 'Username', password: 'Password (12+ characters)', inviteCode: 'Invitation code', login: 'Log in', register: 'Create account', needInvite: 'Register with invitation', haveAccount: 'Already registered? Log in', logout: 'Log out', createInvite: 'Create invitation', userManagement: 'User management', signedIn: 'Signed in as', admin: 'Administrator', member: 'Member', accountError: 'Account request failed', inviteCreated: 'Invitation code (share once):', active: 'Active', disabled: 'Disabled', role: 'Role', save: 'Save', loginRequired: 'Sign in to create an invitation.', currentPassword: 'Current password', newPassword: 'New password', changePassword: 'Change password', passwordChanged: 'Password changed. Other sessions were signed out.' },
  zh: { eyebrow: '中国 ADAS 事故数据库', heading: '公开报告线索', loading: '正在加载…', keyword: '关键词', brand: '品牌', cause: '事故原因', province: '省份', road: '道路类型', verification: '核验状态', sort: '排序方式', all: '全部', dateSort: '日期（最新优先）', relevanceSort: 'SVM 相关度', previous: '上一页', next: '下一页', reports: '条报告', unverified: '条未核实', latest: '最近更新', noReports: '没有符合条件的报告。', loadError: '无法加载报告，请确认家用数据库服务正在运行。', missingTitle: '未命名报告', openSource: '打开原始来源', searchPlaceholder: '标题、内容或来源', username: '用户名', password: '密码（至少 12 位）', inviteCode: '邀请码', login: '登录', register: '创建账户', needInvite: '使用邀请码注册', haveAccount: '已有账户？登录', logout: '退出登录', createInvite: '创建邀请码', userManagement: '用户管理', signedIn: '当前用户', admin: '管理员', member: '成员', accountError: '账户请求失败', inviteCreated: '邀请码（请立即分享）：', active: '启用', disabled: '停用', role: '角色', save: '保存', loginRequired: '请先登录以创建邀请码。', currentPassword: '当前密码', newPassword: '新密码', changePassword: '修改密码', passwordChanged: '密码已修改，其他登录会话已退出。' }
};
const text = (key) => labels[state.language][key];

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

async function authRequest(url, method = 'GET', body) {
  const headers = { accept: 'application/json' };
  if (body) headers['content-type'] = 'application/json';
  if (method !== 'GET' && state.csrf) headers['x-csrf-token'] = state.csrf;
  const response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin', cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || text('accountError'));
  return result;
}

function renderAuth() {
  const form = $('#auth-form');
  const loggedIn = Boolean(state.user);
  form.hidden = loggedIn;
  $('#account-actions').hidden = !loggedIn;
  $('#admin-panel').hidden = !loggedIn || state.user.role !== 'admin';
  $('#invite-field').hidden = state.authMode !== 'register';
  $('#auth-form [name="invite_code"]').required = state.authMode === 'register';
  $('#auth-form [name="password"]').autocomplete = state.authMode === 'register' ? 'new-password' : 'current-password';
  $('#auth-submit').textContent = text(state.authMode === 'register' ? 'register' : 'login');
  $('#auth-mode').textContent = text(state.authMode === 'register' ? 'haveAccount' : 'needInvite');
  $('#auth-status').textContent = loggedIn ? `${text('signedIn')}: ${state.user.username} · ${text(state.user.role === 'admin' ? 'admin' : 'member')}` : '';
  if (loggedIn && state.user.role === 'admin') loadAdminUsers();
}

async function loadAdminUsers() {
  const panel = $('#admin-users');
  try {
    const { data } = await fetchJson('/api/admin/users');
    panel.replaceChildren();
    for (const user of data) {
      const row = document.createElement('div'); row.className = 'user-row';
      addText(row, 'span', `${user.username} (#${user.id})`);
      const role = document.createElement('select');
      for (const value of ['member', 'admin']) { const option = document.createElement('option'); option.value = value; option.textContent = text(value); role.append(option); }
      role.value = user.role;
      const active = document.createElement('select');
      for (const [value, label] of [['true', 'active'], ['false', 'disabled']]) { const option = document.createElement('option'); option.value = value; option.textContent = text(label); active.append(option); }
      active.value = String(user.active);
      const save = document.createElement('button'); save.type = 'button'; save.textContent = text('save');
      save.addEventListener('click', async () => {
        try { await authRequest(`/api/admin/users/${user.id}`, 'PATCH', { role: role.value, active: active.value === 'true' }); await loadAdminUsers(); }
        catch (error) { $('#auth-status').textContent = error.message; }
      });
      row.append(role, active, save); panel.append(row);
    }
  } catch (error) { panel.textContent = error.message; }
}

async function refreshAuth() {
  try { const result = await authRequest('/api/auth/me'); state.user = result.user; state.csrf = result.csrf; }
  catch { state.user = null; state.csrf = null; }
  renderAuth();
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
  await refreshAuth();
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
$('#auth-mode').addEventListener('click', () => { state.authMode = state.authMode === 'login' ? 'register' : 'login'; renderAuth(); });
$('#auth-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const payload = { username: form.get('username'), password: form.get('password') };
  const route = state.authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
  if (state.authMode === 'register') payload.invite_code = form.get('invite_code');
  try {
    const result = await authRequest(route, 'POST', payload);
    state.user = result.user; state.csrf = result.csrf; state.authMode = 'login'; formElement.reset();
    $('#auth-status').textContent = `${text('signedIn')}: ${state.user.username}`; renderAuth();
  } catch (error) { $('#auth-status').textContent = error.message; }
});
$('#logout').addEventListener('click', async () => {
  try { await authRequest('/api/auth/logout', 'POST', {}); state.user = null; state.csrf = null; renderAuth(); }
  catch (error) { $('#auth-status').textContent = error.message; }
});
$('#create-invite').addEventListener('click', async () => {
  try { const result = await authRequest('/api/auth/invitations', 'POST', {}); $('#invite-result').textContent = `${text('inviteCreated')} ${result.code} · ${result.expires_at.slice(0, 10)}`; }
  catch (error) { $('#auth-status').textContent = error.message; }
});
$('#password-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  try {
    await authRequest('/api/auth/password', 'POST', { current_password: form.get('current_password'), new_password: form.get('new_password') });
    formElement.reset();
    $('#auth-status').textContent = text('passwordChanged');
  } catch (error) { $('#auth-status').textContent = error.message; }
});
$('#sort').addEventListener('change', (event) => { state.sort = event.target.value; state.page = 1; loadReports(); });
$('#query').addEventListener('input', () => { clearTimeout(searchTimer); state.page = 1; searchTimer = setTimeout(loadReports, 250); });
document.querySelectorAll('[data-filter]').forEach((control) => control.addEventListener('change', () => { state.page = 1; loadReports(); }));
$('#previous').addEventListener('click', () => { state.page = Math.max(1, state.page - 1); loadReports(); });
$('#next').addEventListener('click', () => { state.page += 1; loadReports(); });

initialize();
