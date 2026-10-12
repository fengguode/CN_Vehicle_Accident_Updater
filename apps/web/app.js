import { projectReportCard } from './report-presentation.js';
import { captureViewport, restoreVoteInteraction } from './viewport.js';
import { canManageUsers, resolveWorkspaceView } from './navigation.js';
import { createFeedbackDraftStore, clearSubmittedFeedbackDraft } from './feedback-drafts.js';
import { feedbackTriageValues, changedFeedbackTriageFields, rebaseFeedbackTriageDraft } from './feedback-triage.js';

const state = { page: 1, pageSize: 20, sort: 'date', language: localStorage.getItem('adas-language') === 'zh' ? 'zh' : 'en', user: null, csrf: null, authMode: 'login', myVotes: new Map() };
const $ = (selector) => document.querySelector(selector);
let searchTimer;
let summarySnapshot;
let lastAuthIdentity;
let authIdentityGeneration = 0;
let authStateRequestId = 0;
let lastAdminIdentity;
let sessionLoadError = false;
let accessNoticeSignature;
let reportRequestId = 0;
let reportAccessBlocked = false;
let accessCheckMessage = '';
let accessActionMessage = '';
let currentView = 'reports';
let myFeedbackRequestId = 0;
let adminFeedbackRequestId = 0;
let adminFeedbackOffset = 0;
let adminUsersSnapshot = null;
let adminUsersSnapshotIdentity = null;
let adminUsersRequestId = 0;
let mediaReviewRequestId = 0;
let mediaReviewCursor = null;
let mediaReviewHasMore = false;
let mediaReviewFilter = null;
let mediaReviewLoadMoreButton = null;
const feedbackFormDrafts = new Map();
const feedbackSubmissionAttempts = new Map();
const memberFeedbackDrafts = createFeedbackDraftStore();
let memberFeedbackDraftIdentity = null;
let visibilityAuthUnconfirmed = false;
let authCheckStatusElement = null;
const authChangeChannel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('adas-vnext-auth') : null;
const feedbackPageSize = 100;
const feedbackStatuses = ['Submitted', 'Under review', 'Added to backlog', 'In progress', 'Complete', 'Blocked', 'Not planned', 'Duplicate'];
const feedbackPriorities = ['low', 'normal', 'high', 'urgent'];
const labels = {
  en: { documentTitle: 'China Traffic Incident Database', eyebrow: 'CHINA TRAFFIC INCIDENT DATABASE', heading: 'Reported incident leads', loading: 'Loading reports…', keyword: 'Search reports', brand: 'Brand', cause: 'Cause', province: 'Province', road: 'Road type', verification: 'Verification', sort: 'Sort by', all: 'All', dateSort: 'Date (newest first)', relevanceSort: 'Community relevance', previous: 'Previous', next: 'Next', reports: 'reports', unverified: 'unverified', latest: 'Updated', noReports: 'No reports match these filters.', loadError: 'Could not load reports. Check that the home database service is running.', retry: 'Try again', resetFilters: 'Reset filters', moreFilters: 'More filters', resultsHeading: 'Reports', account: 'Account', accountIntro: 'Sign in with an approved account to review and rate reports.', workspaceLabel: 'RESEARCH WORKSPACE', leadExplainer: 'These are public reports collected as research leads. A listing is not confirmation that an incident occurred or that a vehicle system caused it.', securityHeading: 'Password and security', missingTitle: 'Untitled report', openSource: 'Open original source', searchPlaceholder: 'Search titles, report text, or sources', previewUnavailable: 'No preview available', videoPreviewUnavailable: 'Video preview unavailable', reportDetails: 'Report details', closeDetails: 'Close details', summary: 'Summary', source: 'Source', platform: 'Platform', location: 'Location', verificationLead: 'Verification status', unverifiedLead: 'Unverified lead', verifiedLead: 'Verified', author: 'Author', published: 'Published', username: 'Username', password: 'Password (12+ characters)', inviteCode: 'Invitation code', login: 'Log in', register: 'Create account', needInvite: 'Register with invitation', haveAccount: 'Already registered? Log in', logout: 'Log out', createInvite: 'Create invitation', userManagement: 'User management', signedIn: 'Signed in as', admin: 'Administrator', member: 'Member', accountError: 'Account request failed', invalidInviteCode: 'This invitation code is invalid, expired, or already used. Check the code or ask for a new one.', usernameTaken: 'That username is unavailable. Choose another username.', invalidUsername: 'Use a username with 3–32 letters, numbers, dots, dashes, or underscores.', invalidPassword: 'Use a password with 12–200 characters.', reservedUsername: 'Usernames beginning with anonymous- are reserved. Choose another username.', inviteCreated: 'Invitation code (share once):', active: 'Active', disabled: 'Disabled', role: 'Role', save: 'Save', loginRequired: 'Sign in to create an invitation.', currentPassword: 'Current password', newPassword: 'New password', changePassword: 'Change password', passwordChanged: 'Password changed. Other sessions were signed out.', relevant: 'Relevant traffic incident', notRelevant: 'Not relevant', rateReport: 'Rate this report', revokeVote: 'Undo vote', myVote: 'Your vote', communityVotes: 'Community ratings', rankingScore: 'Ranking score', rankingHint: 'Estimate from community ratings and report text; not a verification of the incident.', pendingApproval: 'Your account is waiting for administrator approval. The report workspace is not available yet.', signInToView: 'Sign in with an approved account to view reports.', approved: 'Database access: approved', pending: 'Database access: pending', approval: 'Database approval', accountStatus: 'Account status', approve: 'Approved', unapproved: 'Pending approval', saved: 'Changes saved.', voteSaved: 'Your rating was saved.', voteRemoved: 'Your rating was removed.' },
  zh: { documentTitle: '中国交通事故数据库', eyebrow: '中国交通事故数据库', heading: '公开报告线索', loading: '正在加载…', keyword: '搜索报告', brand: '品牌', cause: '事故原因', province: '省份', road: '道路类型', verification: '核验状态', sort: '排序方式', all: '全部', dateSort: '日期（最新优先）', relevanceSort: '社区相关度', previous: '上一页', next: '下一页', reports: '条报告', unverified: '条未核实', latest: '更新于', noReports: '没有符合条件的报告。', loadError: '无法加载报告，请确认家用数据库服务正在运行。', retry: '重试', resetFilters: '重置筛选', moreFilters: '更多筛选条件', resultsHeading: '报告', account: '账户', accountIntro: '使用已获批准的账户登录后，可以查看和评价报告。', workspaceLabel: '研究工作区', leadExplainer: '这些公开报告是待核实的研究线索。出现在此处不代表事故已确认，也不代表车辆系统导致了事故。', securityHeading: '密码与安全', missingTitle: '未命名报告', openSource: '打开原始来源', searchPlaceholder: '搜索标题、报告内容或来源', previewUnavailable: '暂无媒体预览', videoPreviewUnavailable: '暂无视频预览', reportDetails: '报告详情', closeDetails: '收起详情', summary: '摘要', source: '来源', platform: '平台', location: '地点', verificationLead: '核验状态', unverifiedLead: '待核实线索', verifiedLead: '已核实', author: '作者', published: '发布时间', username: '用户名', password: '密码（至少 12 位）', inviteCode: '邀请码', login: '登录', register: '创建账户', needInvite: '使用邀请码注册', haveAccount: '已有账户？登录', logout: '退出登录', createInvite: '创建邀请码', userManagement: '用户管理', signedIn: '当前用户', admin: '管理员', member: '成员', accountError: '账户请求失败', invalidInviteCode: '邀请码无效、已过期或已使用。请检查邀请码或申请新的邀请码。', usernameTaken: '该用户名不可用，请选择其他用户名。', invalidUsername: '用户名须为 3 至 32 个字母、数字、点、短横线或下划线。', invalidPassword: '密码长度须为 12 至 200 个字符。', reservedUsername: 'anonymous- 开头的用户名已保留，请选择其他用户名。', inviteCreated: '邀请码（请立即分享）：', active: '启用', disabled: '停用', role: '角色', save: '保存', loginRequired: '请先登录以创建邀请码。', currentPassword: '当前密码', newPassword: '新密码', changePassword: '修改密码', passwordChanged: '密码已修改，其他登录会话已退出。', relevant: '相关交通事故', notRelevant: '不相关', rateReport: '评价此报告', revokeVote: '撤销评价', myVote: '您的评价', communityVotes: '社区评价', rankingScore: '排序分数', rankingHint: '基于社区评价及报告文本估算，不代表事故已核实。', pendingApproval: '账户正在等待管理员批准，暂时无法访问报告工作区。', signInToView: '请使用已获批准的账户登录以查看报告。', approved: '数据库权限：已批准', pending: '数据库权限：待批准', approval: '数据库审批', accountStatus: '账户状态', approve: '已批准', unapproved: '待批准', saved: '更改已保存。', voteSaved: '评价已保存。', voteRemoved: '评价已撤销。' }
};
labels.en.sessionError = 'Could not check your sign-in session. Try again.';
labels.en.passwordCurrentIncorrect = 'Current password is incorrect.';
labels.en.passwordMustDiffer = 'Choose a password different from the current one.';
labels.en.openAccount = 'Open account';
labels.zh.passwordCurrentIncorrect = '当前密码不正确。';
labels.zh.passwordMustDiffer = '新密码不能与当前密码相同。';
labels.en.sessionRetry = 'Retry session check';
labels.en.reportAccessCheck = 'Report access changed. Your report data is hidden while access is checked.';
labels.en.accessRetry = 'Retry access check';
labels.en.accessCheckUnavailable = 'Access could not be confirmed. Report data remains hidden.';
labels.en.voteDeniedUncommitted = 'Your rating was not saved because report access changed.';
labels.en.voteRemoveDeniedUncommitted = 'Your rating was not removed because report access changed.';
labels.en.voteDeniedCommitted = 'Your rating was saved, but report access changed.';
labels.en.voteRemoveDeniedCommitted = 'Your rating was removed, but report access changed.';
labels.en.invalid_username_or_password = 'Username or password is incorrect.';
labels.en.login_temporarily_limited = 'Too many attempts. Try again later.';
Object.assign(labels.en, { home: 'China Traffic Incident Database home', switchLanguage: 'Switch to Chinese', searchRegion: 'Search reports', reportPages: 'Report pages' });
Object.assign(labels.en, { reportsNav: 'Reports', workspaceNav: 'Main navigation', adminOnly: 'Administrator access', emptyUsers: 'No accounts to manage.', loadingUsers: 'Loading accounts…', usersLoaded: 'Accounts loaded.', saving: 'Saving…', saveFailed: 'Could not save these account changes.', retry: 'Try again', accessLost: 'Administrator access changed. User management is unavailable.' });
Object.assign(labels.en, { anonymizedAccount: 'Anonymized account', anonymize: 'Anonymize disabled account', anonymizeConfirm: 'This permanently replaces the account identity while retaining feedback and audit history. Type the current username to continue:', anonymizeDisabledOnly: 'Disable this account before anonymizing it.', anonymizeFailed: 'Could not anonymize account.', deleteVotes: 'Delete report votes', deleteVotesConfirm: 'This permanently deletes this account’s report relevance votes and rebuilds relevance scores. Issue and feature feedback history is retained. Type DELETE VOTES to continue:', deleteVotesFailed: 'Could not delete report votes.', voteCount: 'report votes', actionComplete: 'Action complete.' });
Object.assign(labels.en, {
  feedbackSubmissionLimit: 'Submission limit reached. Try again later.',
  feedbackNav: 'Feedback', feedbackAdminHeading: 'Feedback triage', feedbackAdminIntro: 'Review and update issue reports and feature requests.',
  feedbackEditRequest: 'Edit request #{id}: {title} — {status}',
  feedbackMyRequests: 'Issues and feature requests', feedbackIntro: 'Send feedback to the project team and track its status here.', feedbackType: 'Request type', feedbackIssue: 'Issue', feedbackFeature: 'Feature request', feedbackTitle: 'Title', feedbackDescription: 'Description', feedbackContext: 'Reproduction steps or additional context (optional)', feedbackSubmit: 'Submit request', feedbackRefresh: 'Refresh my requests', feedbackLoading: 'Loading your requests…', feedbackEmpty: 'You have not submitted any requests yet.', feedbackSubmitted: 'Request submitted. Reference: ', feedbackRequestId: 'Request', feedbackUpdated: 'Updated', feedbackLatestUpdate: 'Project update', feedbackHistorySubmittedBy: 'Submitted by', feedbackHistoryUpdatedBy: 'Updated by', feedbackHistoryRequestReceived: 'Request received.', feedbackBacklogIds: 'Backlog item', feedbackQueueEmpty: 'There are no requests to review.', feedbackQueueLoading: 'Loading feedback queue…', feedbackSaved: 'Request status updated.', feedbackPublicUpdate: 'Update for the submitter', feedbackInternalNote: 'Private admin note', feedbackPriority: 'Priority', feedbackStatusLabel: 'Status', feedbackSubmitter: 'Submitted by', feedbackSave: 'Save update', feedbackDuplicates: 'Duplicate of request ID (optional)', feedbackBacklogReference: 'Canonical backlog ID (comma separated)', feedbackError: 'Could not load or save feedback requests.', feedbackNetworkError: 'Could not confirm the request status. Your draft remains in this tab; retry to check the result.', feedbackLegacyStatusHelp: 'This request has a retired status. Move it to Under review and use a public update to ask for details.', feedbackStatus_submitted: 'Submitted', feedbackStatus_under_review: 'Under review', feedbackStatus_needs_information: 'Needs information (legacy)', feedbackStatus_added_to_backlog: 'Added to backlog', feedbackStatus_in_progress: 'In progress', feedbackStatus_complete: 'Complete', feedbackStatus_blocked: 'Blocked', feedbackStatus_not_planned: 'Not planned', feedbackStatus_duplicate: 'Duplicate', feedbackPriority_low: 'Low', feedbackPriority_normal: 'Normal', feedbackPriority_high: 'High', feedbackPriority_urgent: 'Urgent', feedbackNoUpdates: 'No status updates yet.'
});
Object.assign(labels.en, {
  voteSaveFailed: 'Your rating was not saved.',
  voteRemoveFailed: 'Your rating was not removed.',
  voteSavedRefreshFailed: 'Your rating was saved. Latest report data could not be loaded. Community counts, ranking scores, and relevance ordering may be stale.',
  voteRemovedRefreshFailed: 'Your rating was removed. Latest report data could not be loaded. Community counts, ranking scores, and relevance ordering may be stale.',
  voteSavedRetryFailed: 'Your rating remains saved, but latest report data could not be loaded. Community counts, ranking scores, and relevance ordering remain stale.',
  voteRemovedRetryFailed: 'Your rating remains removed, but latest report data could not be loaded. Community counts, ranking scores, and relevance ordering remain stale.',
  voteSavedListChanged: 'Your rating was saved, but the report is no longer in the current results.',
  voteRemovedListChanged: 'Your rating was removed, but the report is no longer in the current results.',
  retryReports: 'Retry report refresh'
});
labels.zh.sessionError = '无法检查登录状态，请重试。';
labels.en.feedbackQueueTimeout = 'The feedback queue took too long to load.';
labels.en.feedbackQueueFiltered = 'Feedback queue updated; showing';
labels.zh.feedbackQueueTimeout = '反馈队列加载超时。';
labels.zh.feedbackQueueFiltered = '反馈队列已更新，当前显示';
labels.zh.reportAccessCheck = '报告访问权限已变化。检查权限期间，报告数据已隐藏。';
labels.zh.accessRetry = '重新检查访问权限';
labels.zh.accessCheckUnavailable = '无法确认访问权限，报告数据仍处于隐藏状态。';
labels.zh.voteDeniedUncommitted = '报告访问权限已变化，评价未保存。';
labels.zh.voteRemoveDeniedUncommitted = '报告访问权限已变化，评价未撤销。';
labels.zh.voteDeniedCommitted = '评价已保存，但报告访问权限已变化。';
labels.zh.voteRemoveDeniedCommitted = '评价已撤销，但报告访问权限已变化。';
labels.zh.openAccount = '打开账户';
labels.zh.sessionRetry = '重试检查';
labels.zh.invalid_username_or_password = '用户名或密码不正确。';
labels.zh.login_temporarily_limited = '尝试次数过多，请稍后重试。';
Object.assign(labels.zh, { home: '中国交通事故数据库首页', switchLanguage: '切换为英文', searchRegion: '搜索报告', reportPages: '报告分页' });
Object.assign(labels.zh, { reportsNav: '报告', workspaceNav: '主导航', adminOnly: '管理员访问', emptyUsers: '没有可管理的账户。', loadingUsers: '正在加载账户…', usersLoaded: '账户已加载。', saving: '正在保存…', saveFailed: '无法保存此账户更改。', retry: '重试', accessLost: '管理员权限已变更，无法继续管理用户。' });
Object.assign(labels.zh, { anonymizedAccount: '已匿名化账户', anonymize: '匿名化已停用账户', anonymizeConfirm: '此操作会永久替换账户身份，同时保留反馈和审计历史。请输入当前用户名以继续：', anonymizeDisabledOnly: '请先停用此账户，再进行匿名化。', anonymizeFailed: '无法匿名化账户。', deleteVotes: '删除报告评价', deleteVotesConfirm: '此操作会永久删除该账户的报告相关性评价并重新计算相关性分数。问题和功能反馈历史将保留。请输入 DELETE VOTES 以继续：', deleteVotesFailed: '无法删除报告评价。', voteCount: '条报告评价', actionComplete: '操作已完成。' });
Object.assign(labels.zh, {
  feedbackSubmissionLimit: '提交次数已达上限，请稍后重试。',
  feedbackNav: '反馈', feedbackAdminHeading: '反馈处理', feedbackAdminIntro: '查看并更新问题报告和功能建议。',
  feedbackEditRequest: '编辑请求 #{id}：{title} — {status}',
  feedbackMyRequests: '问题与功能建议', feedbackIntro: '向项目团队提交反馈并在此查看处理状态。', feedbackType: '请求类型', feedbackIssue: '问题', feedbackFeature: '功能建议', feedbackTitle: '标题', feedbackDescription: '描述', feedbackContext: '复现步骤或补充背景（可选）', feedbackSubmit: '提交请求', feedbackRefresh: '刷新我的请求', feedbackLoading: '正在加载您的请求…', feedbackEmpty: '您尚未提交请求。', feedbackSubmitted: '请求已提交。编号：', feedbackRequestId: '请求', feedbackUpdated: '更新于', feedbackLatestUpdate: '项目更新', feedbackHistorySubmittedBy: '提交者', feedbackHistoryUpdatedBy: '更新者', feedbackHistoryRequestReceived: '请求已收到。', feedbackBacklogIds: '待办事项', feedbackQueueEmpty: '当前没有待处理请求。', feedbackQueueLoading: '正在加载反馈队列…', feedbackSaved: '请求状态已更新。', feedbackPublicUpdate: '给提交者的更新', feedbackInternalNote: '管理员内部备注', feedbackPriority: '优先级', feedbackStatusLabel: '状态', feedbackSubmitter: '提交者', feedbackSave: '保存更新', feedbackDuplicates: '重复请求编号（可选）', feedbackBacklogReference: '项目待办编号（逗号分隔）', feedbackError: '无法加载或保存反馈请求。', feedbackNetworkError: '无法确认请求状态。草稿仍保留在此标签页；请重试以确认结果。', feedbackLegacyStatusHelp: '此请求使用已停用的状态。请改为“审核中”，并通过公开更新说明需要的信息。', feedbackStatus_submitted: '已提交', feedbackStatus_under_review: '审核中', feedbackStatus_needs_information: '需要补充信息（旧状态）', feedbackStatus_added_to_backlog: '已加入待办', feedbackStatus_in_progress: '处理中', feedbackStatus_complete: '已完成', feedbackStatus_blocked: '受阻', feedbackStatus_not_planned: '暂不计划', feedbackStatus_duplicate: '重复请求', feedbackPriority_low: '低', feedbackPriority_normal: '普通', feedbackPriority_high: '高', feedbackPriority_urgent: '紧急', feedbackNoUpdates: '暂无状态更新。'
});
Object.assign(labels.zh, {
  voteSaveFailed: '评价未能保存。',
  voteRemoveFailed: '评价未能撤销。',
  voteSavedRefreshFailed: '评价已保存，但无法加载最新报告数据。社区评价、排序分数和相关度排序可能已过期。',
  voteRemovedRefreshFailed: '评价已撤销，但无法加载最新报告数据。社区评价、排序分数和相关度排序可能已过期。',
  voteSavedRetryFailed: '评价仍已保存，但仍无法加载最新报告数据。社区评价、排序分数和相关度排序仍可能已过期。',
  voteRemovedRetryFailed: '评价仍已撤销，但仍无法加载最新报告数据。社区评价、排序分数和相关度排序仍可能已过期。',
  voteSavedListChanged: '评价已保存，但当前结果中已没有该报告。',
  voteRemovedListChanged: '评价已撤销，但当前结果中已没有该报告。',
  retryReports: '重试加载报告'
});
Object.assign(labels.en, {
  feedbackConflict: 'This request changed in another session. The latest version is loaded and your edits are preserved. Review the fields and save again.',
  feedbackNoChanges: 'There are no changes to save.',
  triageErrorInvalidRequestId: 'The request ID is invalid.',
  triageErrorBodyObject: 'The request data is invalid.',
  triageErrorUnknownField: 'The request contains an unsupported field.',
  triageErrorExpectedVersion: 'The request version is invalid. Reload the request and try again.',
  triageErrorConflict: 'This request changed in another session. The latest version is loaded and your edits are preserved. Review the fields and save again.',
  triageErrorNoChanges: 'There are no changes to save.',
  triageErrorInvalidStatus: 'Select a valid request status.',
  triageErrorInvalidPriority: 'Select a valid priority: low, normal, high, or urgent.',
  triageErrorPublicUpdateText: 'The public update must be text.',
  triageErrorPublicUpdateLength: 'The public update must be no more than 2000 characters.',
  triageErrorInternalNotesText: 'The private note must be text.',
  triageErrorInternalNotesLength: 'The private note must be no more than 4000 characters.',
  triageErrorBacklogIds: 'Enter up to 10 backlog IDs.',
  triageErrorBacklogIdInvalid: 'One or more backlog IDs are invalid.',
  triageErrorBacklogIdUnknown: 'One or more backlog IDs do not exist in the project backlog.',
  triageErrorDuplicateIdInvalid: 'Enter a valid primary request ID.',
  triageErrorDuplicateTargetMissing: 'The primary request could not be found.',
  triageErrorDuplicateCycle: 'Duplicate links cannot point back to an earlier request.',
  triageErrorBacklogRequired: 'Add at least one backlog ID before accepting this request.',
  triageErrorLegacyUpdateRequired: 'Add a public update before moving this older request to Under review.',
  triageErrorDispositionUpdateRequired: 'Add a public update explaining this decision.',
  triageErrorDuplicatePrimaryRequired: 'Link a primary request before marking this request as a duplicate.',
  triageErrorNoEffectiveChanges: 'There are no changes to save.',
  triageErrorNotFound: 'This feedback request is no longer available.',
  triageErrorAuthentication: 'Your sign-in has expired. Sign in again to update this request.',
  triageErrorAdminRequired: 'Administrator access is required to update feedback.',
  triageErrorAdminApprovalRequired: 'Administrator approval is required to update feedback.',
  triageErrorCsrf: 'Your security check expired. Reload the page and try again.',
  triageErrorSameOrigin: 'The request could not be saved. Reload the page and try again.'
});
Object.assign(labels.zh, {
  feedbackConflict: '此请求已在其他会话中更改。已加载最新版本并保留您的编辑。请检查字段后再次保存。',
  feedbackNoChanges: '没有需要保存的更改。',
  triageErrorInvalidRequestId: '请求编号无效。',
  triageErrorBodyObject: '请求数据无效。',
  triageErrorUnknownField: '请求包含不支持的字段。',
  triageErrorExpectedVersion: '请求版本无效。请重新加载请求后重试。',
  triageErrorConflict: '此请求已在其他会话中更改。已加载最新版本并保留您的编辑。请检查字段后再次保存。',
  triageErrorNoChanges: '没有需要保存的更改。',
  triageErrorInvalidStatus: '请选择有效的请求状态。',
  triageErrorInvalidPriority: '请选择有效的优先级：低、普通、高或紧急。',
  triageErrorPublicUpdateText: '公开更新必须是文本。',
  triageErrorPublicUpdateLength: '公开更新不能超过 2000 个字符。',
  triageErrorInternalNotesText: '管理员内部备注必须是文本。',
  triageErrorInternalNotesLength: '管理员内部备注不能超过 4000 个字符。',
  triageErrorBacklogIds: '最多可填写 10 个待办事项编号。',
  triageErrorBacklogIdInvalid: '一个或多个待办事项编号无效。',
  triageErrorBacklogIdUnknown: '一个或多个待办事项编号不存在于项目待办列表中。',
  triageErrorDuplicateIdInvalid: '请输入有效的主要请求编号。',
  triageErrorDuplicateTargetMissing: '找不到主要请求。',
  triageErrorDuplicateCycle: '重复请求不能指向此前的请求而形成循环。',
  triageErrorBacklogRequired: '接受此请求前，请至少添加一个待办事项编号。',
  triageErrorLegacyUpdateRequired: '将旧请求移至“审核中”前，请添加公开更新。',
  triageErrorDispositionUpdateRequired: '请添加公开更新说明此决定。',
  triageErrorDuplicatePrimaryRequired: '将请求标记为重复前，请关联主要请求。',
  triageErrorNoEffectiveChanges: '没有需要保存的更改。',
  triageErrorNotFound: '此反馈请求已不可用。',
  triageErrorAuthentication: '登录状态已过期。请重新登录后再更新此请求。',
  triageErrorAdminRequired: '需要管理员权限才能更新反馈。',
  triageErrorAdminApprovalRequired: '需要管理员审批才能更新反馈。',
  triageErrorCsrf: '安全验证已过期。请重新加载页面后重试。',
  triageErrorSameOrigin: '请求未能保存。请重新加载页面后重试。'
});
Object.assign(labels.en, {
  feedbackDuplicates: 'Primary request ID (required for Duplicate)',
  feedbackDuplicateRequired: 'Enter the primary request ID before marking this request as Duplicate.',
  feedbackDuplicateOf: 'Duplicate of request'
});
Object.assign(labels.zh, {
  feedbackDuplicates: '主要请求编号（标记为重复请求时必填）',
  feedbackDuplicateRequired: '标记为重复请求前，请输入主要请求编号。',
  feedbackDuplicateOf: '重复请求对应的主要请求'
});
const text = (key) => labels[state.language][key];
function passwordChangeErrorMessage(error) {
  const localizedKeys = {
    'Current password is incorrect.': 'passwordCurrentIncorrect',
    'Choose a password different from the current one.': 'passwordMustDiffer'
  };
  const key = localizedKeys[error?.message];
  return key ? text(key) : (error?.message || text('accountError'));
}
const feedbackTriageErrorKeys = {
  'Invalid request ID.': 'triageErrorInvalidRequestId',
  'Request body must be an object.': 'triageErrorBodyObject',
  'Unknown triage field.': 'triageErrorUnknownField',
  'A valid expected version is required.': 'triageErrorExpectedVersion',
  'feedback_conflict': 'triageErrorConflict',
  'This feedback request changed in another session.': 'triageErrorConflict',
  'No feedback changes were supplied.': 'triageErrorNoChanges',
  'Invalid status.': 'triageErrorInvalidStatus',
  'Priority must be low, normal, high, or urgent.': 'triageErrorInvalidPriority',
  'Public update must be text.': 'triageErrorPublicUpdateText',
  'Public update must be at most 2000 characters.': 'triageErrorPublicUpdateLength',
  'Internal notes must be text.': 'triageErrorInternalNotesText',
  'Internal notes must be at most 4000 characters.': 'triageErrorInternalNotesLength',
  'Backlog IDs must be an array of at most 10 IDs.': 'triageErrorBacklogIds',
  'Invalid canonical backlog ID.': 'triageErrorBacklogIdInvalid',
  'Backlog ID does not exist in the canonical project backlog.': 'triageErrorBacklogIdUnknown',
  'Invalid duplicate request ID.': 'triageErrorDuplicateIdInvalid',
  'Duplicate target not found.': 'triageErrorDuplicateTargetMissing',
  'Duplicate links cannot form a cycle.': 'triageErrorDuplicateCycle',
  'Add at least one backlog ID before accepting this request.': 'triageErrorBacklogRequired',
  'Add a public update before moving this legacy request to Under review.': 'triageErrorLegacyUpdateRequired',
  'Add a public update explaining this disposition.': 'triageErrorDispositionUpdateRequired',
  'Link a primary request before marking this request as a duplicate.': 'triageErrorDuplicatePrimaryRequired',
  'No effective feedback changes were supplied.': 'triageErrorNoEffectiveChanges',
  'feedback_not_found': 'triageErrorNotFound',
  'authentication_required': 'triageErrorAuthentication',
  'admin_required': 'triageErrorAdminRequired',
  'admin_approval_required': 'triageErrorAdminApprovalRequired',
  'csrf_check_failed': 'triageErrorCsrf',
  'same_origin_required': 'triageErrorSameOrigin',
  'internal_error': 'feedbackError'
};
function localizeFeedbackTriageError(error) {
  const key = feedbackTriageErrorKeys[error?.code] || feedbackTriageErrorKeys[error?.message];
  return key ? text(key) : (error?.message || text('feedbackError'));
}
Object.assign(labels.en, {
  validationRequired: 'Complete this field.', validationTooShort: 'Enter at least {minimum} characters.', validationTooLong: 'Enter no more than {maximum} characters.', validationTypeMismatch: 'Enter a value in the required format.', validationPatternMismatch: 'Use the required format for this field.', validationRangeUnderflow: 'Enter a value of at least {minimum}.', validationRangeOverflow: 'Enter a value no greater than {maximum}.', validationStepMismatch: 'Enter a valid value for this field.', validationBadInput: 'Enter a valid value for this field.', inviteHelp: 'Ask an approved member to create and share a one-use invitation code with you.'
});
Object.assign(labels.zh, {
  validationRequired: '请填写此字段。', validationTooShort: '请至少输入 {minimum} 个字符。', validationTooLong: '请勿超过 {maximum} 个字符。', validationTypeMismatch: '请输入符合要求格式的值。', validationPatternMismatch: '请按此字段要求的格式填写。', validationRangeUnderflow: '请输入不小于 {minimum} 的值。', validationRangeOverflow: '请输入不大于 {maximum} 的值。', validationStepMismatch: '请输入此字段的有效值。', validationBadInput: '请输入有效值。', inviteHelp: '请联系已获批准的成员为您创建并分享一次性邀请码。'
});
const validationErrorState = new WeakMap();
let validationErrorId = 0;

function validationMessage(control) {
  const validity = control.validity;
  const whitespaceOnlyRequired = control.required && control.type !== 'password' && typeof control.value === 'string' && control.value.trim() === '';
  const normalizedLength = control.form?.id === 'feedback-form' && typeof control.value === 'string' ? control.value.trim().length : null;
  if (validity.valueMissing || whitespaceOnlyRequired || (control.required && normalizedLength === 0)) return text('validationRequired');
  // Native tooShort/tooLong are not recalculated for values assigned by script
  // (the feedback form trims on submit), so derive these constraints from the
  // same normalized value used by the API.
  if (control.minLength >= 0 && normalizedLength !== null && normalizedLength < control.minLength) return text('validationTooShort').replace('{minimum}', control.minLength);
  if (control.maxLength >= 0 && normalizedLength !== null && normalizedLength > control.maxLength) return text('validationTooLong').replace('{maximum}', control.maxLength);
  if (validity.tooShort) return text('validationTooShort').replace('{minimum}', control.minLength);
  if (validity.tooLong) return text('validationTooLong').replace('{maximum}', control.maxLength);
  if (validity.typeMismatch) return text('validationTypeMismatch');
  if (validity.patternMismatch) return text('validationPatternMismatch');
  if (validity.rangeUnderflow) return text('validationRangeUnderflow').replace('{minimum}', control.min);
  if (validity.rangeOverflow) return text('validationRangeOverflow').replace('{maximum}', control.max);
  if (validity.stepMismatch) return text('validationStepMismatch');
  if (validity.badInput) return text('validationBadInput');
  return '';
}

function showValidationError(control, message = validationMessage(control)) {
  if (!message) return;
  let record = validationErrorState.get(control);
  if (!record) {
    const error = document.createElement('span');
    error.className = 'field-validation-error';
    error.id = `field-validation-${++validationErrorId}`;
    error.setAttribute('role', 'alert');
    const associatedLabel = control.closest('label');
    if (associatedLabel) associatedLabel.append(error);
    else control.insertAdjacentElement('afterend', error);
    record = {
      error,
      describedBy: control.getAttribute('aria-describedby'),
      invalid: control.getAttribute('aria-invalid')
    };
    validationErrorState.set(control, record);
  }
  control.setCustomValidity(message);
  control.setAttribute('aria-invalid', 'true');
  control.setAttribute('aria-describedby', [record.describedBy, record.error.id].filter(Boolean).join(' '));
  record.error.textContent = message;
}

function clearValidationError(control) {
  const record = validationErrorState.get(control);
  control.setCustomValidity('');
  if (!record) return;
  record.error.remove();
  if (record.invalid === null) control.removeAttribute('aria-invalid');
  else control.setAttribute('aria-invalid', record.invalid);
  if (record.describedBy === null) control.removeAttribute('aria-describedby');
  else control.setAttribute('aria-describedby', record.describedBy);
  validationErrorState.delete(control);
}

function refreshValidationMessages() {
  document.querySelectorAll('[aria-invalid="true"]').forEach((control) => {
    if (!validationErrorState.has(control)) return;
    control.setCustomValidity('');
    showValidationError(control);
  });
}

document.addEventListener('invalid', (event) => {
  const control = event.target;
  if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement)) return;
  clearValidationError(control);
  const message = validationMessage(control);
  if (!message) return;
  event.preventDefault();
  showValidationError(control, message);
  const form = control.form;
  requestAnimationFrame(() => (form?.querySelector(':invalid') || control).focus());
}, true);

document.addEventListener('input', (event) => {
  const control = event.target;
  if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) clearValidationError(control);
}, true);
document.addEventListener('change', (event) => {
  const control = event.target;
  if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) clearValidationError(control);
}, true);
document.addEventListener('submit', (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  const blankRequiredText = [...form.querySelectorAll('input[required], textarea[required]')]
    .filter((control) => control.type !== 'password' && control.value.trim() === '');
  if (blankRequiredText.length === 0) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  blankRequiredText.forEach((control) => showValidationError(control, text('validationRequired')));
  blankRequiredText[0].focus();
}, true);

Object.assign(labels.en, { feedbackFilterStatus: 'Filter by status', feedbackFilterType: 'Filter by type', feedbackFilterStatusLabel: 'Filter feedback by status', feedbackFilterTypeLabel: 'Filter feedback by type', feedbackAllStatuses: 'All statuses', feedbackAllTypes: 'All request types', feedbackLoadMore: 'Load older requests', feedbackMoreLoading: 'Loading older requests…', feedbackMoreLoaded: 'Older requests loaded.', feedbackNoMore: 'No older requests remain.' });
Object.assign(labels.zh, { feedbackFilterStatus: '按状态筛选', feedbackFilterType: '按类型筛选', feedbackFilterStatusLabel: '按状态筛选反馈', feedbackFilterTypeLabel: '按类型筛选反馈', feedbackAllStatuses: '所有状态', feedbackAllTypes: '所有请求类型', feedbackLoadMore: '加载更早请求', feedbackMoreLoading: '正在加载更早请求…', feedbackMoreLoaded: '已加载更早的请求。', feedbackNoMore: '没有更早的请求了。' });
Object.assign(labels.en, { mediaReviewNav: 'Media review', mediaReviewHeading: 'Media review', mediaReviewIntro: 'Review platform supplied video covers separately from incident verification.', mediaReviewFilter: 'Filter by media review status', mediaReviewPending: 'Pending previews', mediaReviewApproved: 'Approved previews', mediaReviewRejected: 'Rejected previews', mediaReviewRefresh: 'Refresh previews', mediaReviewLoading: 'Loading media reviews…', mediaReviewEmpty: 'No previews in this status.', mediaReviewError: 'Could not load media reviews.', mediaReviewPolicyBlocked: 'Preview blocked by origin policy.', mediaReviewCandidate: 'Candidate cover', mediaReviewSource: 'Original source', mediaReviewVerification: 'Incident verification', mediaReviewStatus: 'Media review status', mediaReviewApprove: 'Approve preview', mediaReviewReject: 'Reject preview', mediaReviewRemove: 'Remove preview', mediaReviewHistory: 'Review history', mediaReviewHistoryEmpty: 'No review actions recorded.', mediaReviewRemoveConfirm: 'Remove the supplied cover for this report? Its thumbnail URL will be cleared.', mediaReviewSaved: 'Media review updated.', mediaReviewApprovalBlocked: 'Approval is disabled until an authorized preview origin is configured.', mediaReviewActionError: 'Could not update this media review.', mediaReviewAdminRequired: 'Administrator access is required; your session may have expired.', mediaReviewReportId: 'Report ID', mediaReviewReviewer: 'Reviewer', mediaReviewAction: 'Action', mediaReviewTime: 'Time', mediaReviewApproveAction: 'Approve', mediaReviewRejectAction: 'Reject', mediaReviewRemoveAction: 'Remove', mediaReviewPendingState: 'Pending', mediaReviewApprovedState: 'Approved', mediaReviewRejectedState: 'Rejected', mediaReviewHistoryLoading: 'Loading review history…', mediaReviewHistoryError: 'Could not load review history.', mediaReviewUnknownSource: 'Source unavailable', mediaReviewNoCover: 'No platform cover supplied' });
Object.assign(labels.en, { mediaReviewImageUnavailable: 'Preview could not be loaded. Approval is disabled until it can be inspected.' });
Object.assign(labels.zh, { mediaReviewNav: '媒体审核', mediaReviewHeading: '媒体审核', mediaReviewIntro: '请单独审核平台提供的视频封面；此状态不代表事故核验结果。', mediaReviewFilter: '按媒体审核状态筛选', mediaReviewPending: '待审核预览', mediaReviewApproved: '已批准预览', mediaReviewRejected: '已拒绝预览', mediaReviewRefresh: '刷新预览', mediaReviewLoading: '正在加载媒体审核列表…', mediaReviewEmpty: '此状态下没有预览。', mediaReviewError: '无法加载媒体审核列表。', mediaReviewPolicyBlocked: '预览因来源策略被阻止。', mediaReviewCandidate: '候选封面', mediaReviewSource: '原始来源', mediaReviewVerification: '事故核验状态', mediaReviewStatus: '媒体审核状态', mediaReviewApprove: '批准预览', mediaReviewReject: '拒绝预览', mediaReviewRemove: '移除预览', mediaReviewHistory: '审核记录', mediaReviewHistoryEmpty: '没有审核操作记录。', mediaReviewRemoveConfirm: '确定移除此报告的封面吗？系统将清除缩略图网址。', mediaReviewSaved: '媒体审核状态已更新。', mediaReviewApprovalBlocked: '配置授权预览来源后才能批准。', mediaReviewActionError: '无法更新此媒体审核状态。', mediaReviewAdminRequired: '需要管理员权限；您的登录可能已过期。', mediaReviewReportId: '报告编号', mediaReviewReviewer: '审核人', mediaReviewAction: '操作', mediaReviewTime: '时间', mediaReviewApproveAction: '批准', mediaReviewRejectAction: '拒绝', mediaReviewRemoveAction: '移除', mediaReviewPendingState: '待审核', mediaReviewApprovedState: '已批准', mediaReviewRejectedState: '已拒绝', mediaReviewHistoryLoading: '正在加载审核记录…', mediaReviewHistoryError: '无法加载审核记录。', mediaReviewUnknownSource: '来源不可用', mediaReviewNoCover: '未提供平台封面', mediaReviewImageUnavailable: '预览加载失败。在图像可供检查前，不能批准。' });
Object.assign(labels.en, { mediaReviewLoadOlder: 'Load older previews', mediaReviewLoadingOlder: 'Loading older previews…', mediaReviewOlderLoaded: 'Older previews loaded.', mediaReviewNoOlder: 'No older previews remain.' });
Object.assign(labels.zh, { mediaReviewLoadOlder: '加载更早的预览', mediaReviewLoadingOlder: '正在加载更早的预览…', mediaReviewOlderLoaded: '已加载更早的预览。', mediaReviewNoOlder: '没有更早的预览了。' });
labels.en.feedbackPrivacy = 'Do not include passwords, tokens, unnecessary personal information, or graphic material.';
labels.zh.feedbackPrivacy = '请勿填写密码、令牌、不必要的个人信息或图像化内容。';
labels.en.authChecking = 'Checking your sign-in before showing account information…';
labels.en.authCheckFailed = 'Your sign-in could not be confirmed. Account information remains hidden.';
labels.en.authCheckRetry = 'Retry sign-in check';
labels.zh.authChecking = '正在确认登录状态，确认前不会显示账户信息……';
labels.zh.authCheckFailed = '无法确认登录状态。账户信息仍处于隐藏状态。';
labels.zh.authCheckRetry = '重试登录检查';
const feedbackStatusKey = (status) => `feedbackStatus_${String(status || '').toLowerCase().replaceAll(' ', '_')}`;

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) {
    let result = {};
    try { result = await response.json(); } catch {}
    const error = new Error(result.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.code = result.code || result.error;
    throw error;
  }
  return response.json();
}

async function authRequest(url, method = 'GET', body, extraHeaders = {}, requestOptions = {}) {
  const headers = { accept: 'application/json' };
  if (body) headers['content-type'] = 'application/json';
  if (method !== 'GET' && state.csrf) headers['x-csrf-token'] = state.csrf;
  Object.assign(headers, extraHeaders);
  const response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin', cache: 'no-store', signal: requestOptions.signal });
  let result = {};
  try { result = await response.json(); } catch {}
  if (!response.ok) {
    const error = new Error(result.error || text('accountError'));
    error.status = response.status;
    error.code = result.code || result.error;
    error.data = result.data;
    throw error;
  }
  return result;
}

function feedbackAttemptKey(userId, payload) {
  const attemptId = `${userId}:${JSON.stringify([payload.type, payload.title, payload.description, payload.context])}`;
  let key = feedbackSubmissionAttempts.get(attemptId);
  if (!key) {
    key = crypto.randomUUID();
    feedbackSubmissionAttempts.set(attemptId, key);
  }
  return { attemptId, key };
}

function renderAuth() {
  const form = $('#auth-form');
  const loggedIn = Boolean(state.user);
  const authIdentity = loggedIn ? `${state.user.id}:${state.user.role}:${state.user.approved}` : 'signed-out';
  const feedbackForm = $('#feedback-form');
  const feedbackIdentity = loggedIn && !visibilityAuthUnconfirmed ? String(state.user.id) : null;
  if (feedbackIdentity !== memberFeedbackDraftIdentity) {
    if (memberFeedbackDraftIdentity !== null) {
      memberFeedbackDrafts.set(memberFeedbackDraftIdentity, Object.fromEntries(
        [...feedbackForm.elements].filter((control) => control.name).map((control) => [control.name, control.value])
      ));
    }
    // Clear the old account's values before the new auth state can expose the
    // account view, then restore only a draft keyed to the confirmed account ID.
    clearMemberFeedbackForm();
    memberFeedbackDraftIdentity = feedbackIdentity;
    if (feedbackIdentity !== null) {
      const draft = memberFeedbackDrafts.get(feedbackIdentity);
      if (draft) for (const control of feedbackForm.elements) if (control.name in draft) control.value = draft[control.name];
    }
  } else if (feedbackIdentity !== null) {
    // Capture programmatic changes as well as ordinary input events while the
    // same account remains confirmed through role/approval refreshes.
    memberFeedbackDrafts.set(feedbackIdentity, Object.fromEntries(
      [...feedbackForm.elements].filter((control) => control.name).map((control) => [control.name, control.value])
    ));
  }
  if (authIdentity !== lastAuthIdentity) {
    authIdentityGeneration += 1;
    lastAuthIdentity = authIdentity;
    // Unsaved admin triage fields can contain private notes; never carry them across sessions.
    feedbackFormDrafts.clear();
    adminUsersSnapshot = null;
    adminUsersSnapshotIdentity = null;
    adminUsersRequestId += 1;
    $('#feedback-message').textContent = '';
    myFeedbackRequestId += 1;
    $('#my-feedback-list').replaceChildren();
    $('#feedback-list-status').hidden = true;
    if (loggedIn && currentView === 'account') loadMyFeedback();
    if (currentView === 'feedback') {
      adminFeedbackRequestId += 1;
      adminFeedbackOffset = 0;
      $('#admin-feedback-list').replaceChildren();
      $('#feedback-admin-status').textContent = '';
    }
    if (currentView === 'media-review') {
      mediaReviewRequestId += 1;
      $('#media-review-list').replaceChildren();
      $('#media-review-status').textContent = '';
      resetMediaReviewPaging();
    }
  }
  form.hidden = loggedIn;
  $('#account-actions').hidden = !loggedIn;
  $('#create-invite').hidden = !state.user?.approved;
  const adminAllowed = canManageUsers(state.user);
  $('#admin-nav').hidden = !adminAllowed;
  $('#feedback-nav').hidden = !adminAllowed;
  $('#media-review-nav').hidden = !adminAllowed;
  $('#admin-panel').hidden = !adminAllowed;
  if (!loggedIn) $('#admin-feedback-list').replaceChildren();
  if (!adminAllowed) $('#admin-feedback-list').replaceChildren();
  if (!adminAllowed) {
    $('#media-review-list').replaceChildren();
    resetMediaReviewPaging();
  }
  if (!loggedIn || !state.user?.approved) $('#invite-result').textContent = '';
  if (!loggedIn || state.user.role !== 'admin' || !state.user.approved) $('#admin-users').replaceChildren();
  $('#invite-field').hidden = state.authMode !== 'register';
  $('#invite-help').hidden = state.authMode !== 'register';
  $('#auth-form [name="invite_code"]').required = state.authMode === 'register';
  $('#auth-form [name="password"]').autocomplete = state.authMode === 'register' ? 'new-password' : 'current-password';
  $('#auth-submit').textContent = text(state.authMode === 'register' ? 'register' : 'login');
  $('#auth-mode').textContent = text(state.authMode === 'register' ? 'haveAccount' : 'needInvite');
  $('#auth-status').textContent = loggedIn ? `${text('signedIn')}: ${state.user.username} · ${text(state.user.role === 'admin' ? 'admin' : 'member')} · ${text(state.user.approved ? 'approved' : 'pending')}` : '';
  $('#account-entry').textContent = loggedIn ? text('account') : text('login');
  $('#account-entry').setAttribute('aria-label', loggedIn ? text('account') : text('login'));
  if ($('#account-message').dataset.errorKey) $('#account-message').textContent = text($('#account-message').dataset.errorKey);
  if (sessionLoadError) $('#account-message').textContent = text('sessionError');
  const adminIdentity = canManageUsers(state.user) ? authIdentity : null;
  if (adminIdentity !== lastAdminIdentity) {
    lastAdminIdentity = adminIdentity;
    if (adminIdentity && currentView === 'admin') loadAdminUsers();
    if (adminIdentity && currentView === 'media-review') loadMediaReview();
    if (!adminIdentity) {
      $('#admin-users').replaceChildren();
      $('#admin-load-status').textContent = '';
      if (currentView === 'admin' || currentView === 'feedback' || currentView === 'media-review') { showView('account', true); $('#account-message').textContent = text('accessLost'); }
    }
  }
  if ((currentView === 'admin' || currentView === 'feedback' || currentView === 'media-review') && !adminAllowed) showView('account');
  renderDatabaseAccess();
}

function showView(name, moveFocus = false) {
  if (visibilityAuthUnconfirmed) return;
  name = resolveWorkspaceView(name, state.user);
  currentView = name;
  document.querySelectorAll('[data-view]').forEach((view) => { view.hidden = view.dataset.view !== name; });
  document.querySelectorAll('[data-view-target]').forEach((button) => {
    if (button.dataset.viewTarget === name) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  $('#account-entry').hidden = name === 'account';
  if (name === 'admin') loadAdminUsers();
  else { $('#admin-users').replaceChildren(); $('#admin-load-status').textContent = ''; }
  if (name === 'account' && state.user) loadMyFeedback();
  if (name === 'feedback') loadAdminFeedback();
  if (name === 'media-review') loadMediaReview();
  if (moveFocus) document.querySelector(`[data-view="${name}"] h1`)?.focus();
}

function renderDatabaseAccess() {
  const allowed = Boolean(state.user?.approved) && !reportAccessBlocked;
  document.querySelectorAll('.database-content').forEach((element) => { element.hidden = !allowed; });
  const notice = $('#data-access-notice');
  notice.hidden = allowed;
  const signature = `${state.language}:${allowed}:${state.user ? 'signed-in' : 'signed-out'}:${sessionLoadError}:${reportAccessBlocked}:${accessCheckMessage}`;
  if (signature !== accessNoticeSignature) {
    notice.replaceChildren();
    accessNoticeSignature = signature;
  }
  if (!allowed && !notice.childElementCount) {
    const message = document.createElement('p');
    message.textContent = reportAccessBlocked ? (accessCheckMessage || text('reportAccessCheck')) : (state.user ? text('pendingApproval') : text('signInToView'));
    notice.append(message);
    if (reportAccessBlocked) {
      const retry = document.createElement('button');
      retry.type = 'button'; retry.className = 'quiet-button'; retry.textContent = text('accessRetry');
      retry.addEventListener('click', retryReportAccess);
      notice.append(retry);
    }
    if (!state.user) {
      const entry = document.createElement('button');
      entry.type = 'button'; entry.className = 'quiet-button'; entry.textContent = text('openAccount');
      entry.addEventListener('click', openAccount);
      notice.append(entry);
      if (sessionLoadError) {
        const retry = document.createElement('button');
        retry.type = 'button'; retry.className = 'quiet-button'; retry.textContent = text('sessionRetry');
        retry.addEventListener('click', refreshAuth);
        notice.append(retry);
      }
    }
  }
  if (!allowed) {
    reportRequestId += 1;
    $('#reports').replaceChildren();
    $('#page-status').textContent = '';
    summarySnapshot = null;
    $('#record-total').textContent = '';
    $('#latest-collection').textContent = '';
    state.myVotes.clear();
    for (const control of document.querySelectorAll('[data-filter]')) {
      const all = Object.assign(document.createElement('option'), { value: '', textContent: text('all') });
      all.dataset.i18n = 'all';
      control.replaceChildren(all);
      control.value = '';
    }
  }
}

function showReportAccessMessage(message, canRetry) {
  const accountMessage = $('#account-message');
  accountMessage.dataset.errorKey = '';
  accountMessage.replaceChildren(document.createTextNode(message));
  if (canRetry) {
    accountMessage.append(document.createTextNode(' '));
    const retry = document.createElement('button');
    retry.type = 'button'; retry.className = 'quiet-button'; retry.textContent = text('accessRetry');
    retry.addEventListener('click', retryReportAccess);
    accountMessage.append(retry);
  }
}

function clearRestrictedReportData() {
  reportRequestId += 1;
  $('#reports').replaceChildren();
  $('#reports').setAttribute('aria-busy', 'false');
  delete $('#reports').dataset.rankingStale;
  $('#action-status').textContent = '';
  $('#page-status').textContent = '';
  summarySnapshot = null;
  $('#record-total').textContent = '';
  $('#latest-collection').textContent = '';
  state.myVotes.clear();
  for (const control of document.querySelectorAll('[data-filter]')) {
    const all = Object.assign(document.createElement('option'), { value: '', textContent: text('all') });
    all.dataset.i18n = 'all';
    control.replaceChildren(all);
    control.value = '';
  }
}

async function handleReportAccessDenied({ committed = false, action = null } = {}) {
  reportAccessBlocked = true;
  accessCheckMessage = text('reportAccessCheck');
  clearRestrictedReportData();
  renderDatabaseAccess();
  const actionMessage = committed
    ? text(action === 'undo' ? 'voteRemoveDeniedCommitted' : 'voteDeniedCommitted')
    : (action ? text(action === 'undo' ? 'voteRemoveDeniedUncommitted' : 'voteDeniedUncommitted') : '');
  if (actionMessage) accessActionMessage = actionMessage;
  showView('account');
  showReportAccessMessage([accessActionMessage, accessCheckMessage].filter(Boolean).join(' '), false);
  $('#account-heading').focus();
  let retryAvailable = false;
  const authStateRequest = beginAuthStateRequest();
  try {
    const result = await authRequest('/api/auth/me');
    if (!isCurrentAuthStateRequest(authStateRequest)) return { kind: 'denied' };
    state.user = result.user;
    state.csrf = result.csrf;
    sessionLoadError = false;
    if (!state.user?.approved) {
      reportAccessBlocked = false;
      accessCheckMessage = '';
    } else {
      retryAvailable = true;
      accessCheckMessage = text('reportAccessCheck');
    }
  } catch {
    if (!isCurrentAuthStateRequest(authStateRequest)) return { kind: 'denied' };
    sessionLoadError = true;
    retryAvailable = true;
    accessCheckMessage = text('accessCheckUnavailable');
  }
  renderAuth();
  const authStateMessage = state.user?.approved
    ? accessCheckMessage
    : state.user ? text('pendingApproval') : (sessionLoadError ? text('accessCheckUnavailable') : text('signInToView'));
  showReportAccessMessage([accessActionMessage, authStateMessage].filter(Boolean).join(' '), retryAvailable);
  return { kind: 'denied' };
}

async function retryReportAccess() {
  const authStateRequest = beginAuthStateRequest();
  let acceptedAuthRequest = authStateRequest;
  try {
    const result = await authRequest('/api/auth/me');
    if (!isCurrentAuthStateRequest(authStateRequest)) return;
    state.user = result.user;
    state.csrf = result.csrf;
    sessionLoadError = false;
    if (!state.user?.approved) {
      reportAccessBlocked = false;
      accessCheckMessage = '';
      renderAuth();
      showView('account');
      const authStateMessage = state.user ? text('pendingApproval') : text('signInToView');
      showReportAccessMessage([accessActionMessage, authStateMessage].filter(Boolean).join(' '), false);
      $('#account-heading').focus();
      return;
    }
    reportAccessBlocked = false;
    accessCheckMessage = '';
    renderAuth();
    acceptedAuthRequest = { id: authStateRequestId, identityGeneration: authIdentityGeneration };
    const loaded = await loadDatabaseData();
    if (!isCurrentAuthStateRequest(acceptedAuthRequest)) return;
    if (!loaded || reportAccessBlocked) {
      if (!state.user?.approved) {
        showView('account');
        $('#account-heading').focus();
        return;
      }
      if (!reportAccessBlocked) {
        reportAccessBlocked = true;
        accessCheckMessage = text('accessCheckUnavailable');
        clearRestrictedReportData();
        renderAuth();
        showReportAccessMessage([accessActionMessage, accessCheckMessage].filter(Boolean).join(' '), true);
      }
      if (currentView === 'account') {
        showView('account');
        $('#account-heading').focus();
      }
      return;
    }
    const shouldReturnToReports = currentView === 'account';
    if (shouldReturnToReports) showView('reports');
    accessActionMessage = '';
    $('#account-message').dataset.errorKey = '';
    $('#account-message').replaceChildren();
    if (shouldReturnToReports) {
      const resultsHeading = $('#heading');
      resultsHeading.tabIndex = -1;
      resultsHeading.focus();
    }
  } catch {
    if (!isCurrentAuthStateRequest(acceptedAuthRequest)) return;
    reportAccessBlocked = true;
    accessCheckMessage = text('accessCheckUnavailable');
    clearRestrictedReportData();
    renderDatabaseAccess();
    showReportAccessMessage([accessActionMessage, accessCheckMessage].filter(Boolean).join(' '), true);
    if (currentView === 'account') $('#account-heading').focus();
  }
}

async function loadDatabaseData() {
  if (!state.user?.approved || reportAccessBlocked) return false;
  const userId = state.user.id;
  let dataLoaded = true;
  try {
    const [summary, filters, votes] = await Promise.all([fetchJson('/api/summary'), fetchJson('/api/filters'), fetchJson('/api/my-votes')]);
    if (state.user?.id !== userId || !state.user?.approved) return;
    summarySnapshot = summary;
    state.myVotes = new Map(votes.data.map((vote) => [vote.fingerprint, vote.vote]));
    renderSummary();
    for (const field of ['brand', 'cause', 'province', 'road_type', 'verification_status']) {
      const select = document.querySelector(`[data-filter="${field}"]`);
      const selected = select.value;
      const all = Object.assign(document.createElement('option'), { value: '', textContent: text('all') });
      all.dataset.i18n = 'all';
      select.replaceChildren(all);
      for (const value of filters[field] || []) {
        const option = document.createElement('option'); option.value = value; option.textContent = value; select.append(option);
      }
      select.value = selected;
    }
  } catch (error) {
    if (state.user?.id === userId && state.user?.approved && [401, 403].includes(error.status)) {
      await handleReportAccessDenied();
      return false;
    }
    dataLoaded = false;
    if (state.user?.id === userId && state.user?.approved) $('#record-total').textContent = text('loadError');
  }
  if (state.user?.id !== userId || !state.user?.approved || reportAccessBlocked) return false;
  const reports = await loadReports();
  return dataLoaded && reports?.kind === 'success';
}

async function loadAdminUsers({ focusStatus = false, successMessage = '', localizedRerender = false } = {}) {
  const panel = $('#admin-users');
  const status = $('#admin-load-status');
  const adminId = state.user?.id;
  const adminIdentity = `${state.user?.id}:${state.user?.role}:${state.user?.approved}`;
  const requestId = ++adminUsersRequestId;
  if (currentView !== 'admin' || state.user?.role !== 'admin' || !state.user?.approved) return;
  const priorStatusKey = status.dataset.messageKey;
  const preservedRows = localizedRerender ? new Map([...panel.querySelectorAll('.user-row')].map((row) => [row.dataset.userId, {
    values: Object.fromEntries([...row.querySelectorAll('select[name]')].map((control) => [control.name, control.value])),
    feedback: row.querySelector('.user-row-feedback')?.textContent || '',
    actions: Object.fromEntries([...row.querySelectorAll('[data-action]')].map((control) => [control.dataset.action, control.disabled]))
  }])) : null;
  const focusedControl = localizedRerender && panel.contains(document.activeElement)
    ? { userId: document.activeElement.closest('.user-row')?.dataset.userId, key: document.activeElement.name || document.activeElement.dataset.action }
    : null;
  const showActionFailure = (userId, action, message) => {
    if (currentView !== 'admin' || state.user?.id !== adminId || !canManageUsers(state.user)) return;
    const row = panel.querySelector(`[data-user-id="${userId}"]`);
    const button = row?.querySelector(`[data-action="${action}"]`);
    const feedback = row?.querySelector('.user-row-feedback');
    if (feedback) feedback.textContent = message;
    if (button) {
      button.disabled = false;
      button.focus();
    }
  };
  if (!localizedRerender) {
    status.tabIndex = -1;
    status.dataset.messageKey = 'loadingUsers';
    status.textContent = text('loadingUsers');
    if (focusStatus) status.focus();
  }
  try {
    let data;
    if (localizedRerender && adminUsersSnapshot && adminUsersSnapshotIdentity === adminIdentity) data = adminUsersSnapshot;
    else {
      ({ data } = await fetchJson('/api/admin/users'));
    }
    if (requestId !== adminUsersRequestId || currentView !== 'admin' || state.user?.id !== adminId || !canManageUsers(state.user)) return;
    adminUsersSnapshot = data;
    adminUsersSnapshotIdentity = adminIdentity;
    panel.replaceChildren();
    const statusKey = data.length ? (localizedRerender
      ? (['saved', 'actionComplete', 'usersLoaded'].includes(priorStatusKey) ? priorStatusKey : 'usersLoaded')
      : (successMessage ? ['saved', 'actionComplete'].find((key) => successMessage === text(key)) || 'usersLoaded' : 'usersLoaded')) : 'emptyUsers';
    status.dataset.messageKey = statusKey;
    status.textContent = text(statusKey);
    for (const user of data) {
      const row = document.createElement('div'); row.className = 'user-row'; row.dataset.userId = String(user.id);
      addText(row, 'span', `${user.username} (#${user.id})${user.anonymized ? ` · ${text('anonymizedAccount')}` : ''}`);
      if (user.anonymized) {
        if (user.vote_count > 0 || user.rating_receipt_count > 0) {
          const deleteVotes = document.createElement('button'); deleteVotes.type = 'button'; deleteVotes.className = 'quiet-button'; deleteVotes.dataset.action = 'deleteVotes'; deleteVotes.textContent = `${text('deleteVotes')} (${user.vote_count} ${text('voteCount')})`;
          const feedback = document.createElement('span'); feedback.className = 'user-row-feedback'; feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite');
          deleteVotes.addEventListener('click', async () => {
            if (window.prompt(text('deleteVotesConfirm')) !== 'DELETE VOTES') return;
            deleteVotes.disabled = true; feedback.textContent = text('saving');
            try { await authRequest(`/api/admin/users/${user.id}/votes`, 'DELETE'); await loadAdminUsers({ focusStatus: true, successMessage: text('actionComplete') }); }
            catch (error) { showActionFailure(user.id, 'deleteVotes', `${text('deleteVotesFailed')} ${error.message}`); }
          });
          row.append(deleteVotes, feedback);
        }
        panel.append(row);
        continue;
      }
      const role = document.createElement('select');
      role.name = 'role';
      role.setAttribute('aria-label', `${text('role')}: ${user.username}`);
      for (const value of ['member', 'admin']) { const option = document.createElement('option'); option.value = value; option.textContent = text(value); role.append(option); }
      role.value = user.role;
      const approval = document.createElement('select');
      approval.name = 'approval';
      approval.setAttribute('aria-label', `${text('approval')}: ${user.username}`);
      for (const [value, label] of [['true', 'approve'], ['false', 'unapproved']]) { const option = document.createElement('option'); option.value = value; option.textContent = text(label); approval.append(option); }
      approval.value = String(user.approved);
      const active = document.createElement('select');
      active.name = 'active';
      active.setAttribute('aria-label', `${text('accountStatus')}: ${user.username}`);
      for (const [value, label] of [['true', 'active'], ['false', 'disabled']]) { const option = document.createElement('option'); option.value = value; option.textContent = text(label); active.append(option); }
      active.value = String(user.active);
      const save = document.createElement('button'); save.type = 'button'; save.dataset.action = 'save'; save.textContent = text('save');
      const feedback = document.createElement('span'); feedback.className = 'user-row-feedback'; feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite');
      save.addEventListener('click', async () => {
        $('#admin-load-status').textContent = '';
        save.disabled = true; feedback.textContent = text('saving');
        try {
          await authRequest(`/api/admin/users/${user.id}`, 'PATCH', { role: role.value, approved: approval.value === 'true', active: active.value === 'true' });
          if (user.id === state.user?.id) {
            await refreshAuth();
            if (!canManageUsers(state.user) || currentView !== 'admin') return;
          }
          await loadAdminUsers({ focusStatus: true, successMessage: text('saved') });
        } catch (error) {
          if (error.status === 401 || error.status === 403) {
            await refreshAuth();
            if (!canManageUsers(state.user) || currentView !== 'admin') return;
          }
          showActionFailure(user.id, 'save', `${text('saveFailed')} ${error.message}`);
        }
      });
      row.append(role, approval, active, save, feedback); panel.append(row);
      const anonymize = document.createElement('button'); anonymize.type = 'button'; anonymize.className = 'quiet-button'; anonymize.dataset.action = 'anonymize'; anonymize.textContent = text('anonymize'); anonymize.disabled = user.active;
      anonymize.title = user.active ? text('anonymizeDisabledOnly') : '';
      anonymize.addEventListener('click', async () => {
        if (window.prompt(text('anonymizeConfirm')) !== user.username) return;
        anonymize.disabled = true; feedback.textContent = text('saving');
        try { await authRequest(`/api/admin/users/${user.id}/anonymize`, 'POST'); await loadAdminUsers({ focusStatus: true, successMessage: text('actionComplete') }); }
        catch (error) { showActionFailure(user.id, 'anonymize', `${text('anonymizeFailed')} ${error.message}`); }
      });
      row.append(anonymize);
    }
    if (localizedRerender) {
      for (const row of panel.querySelectorAll('.user-row')) {
        const prior = preservedRows.get(row.dataset.userId);
        if (!prior) continue;
        for (const [name, value] of Object.entries(prior.values)) {
          const control = row.querySelector(`[name="${name}"]`);
          if (control) control.value = value;
        }
        const feedback = row.querySelector('.user-row-feedback');
        if (feedback) feedback.textContent = prior.feedback;
        for (const [action, disabled] of Object.entries(prior.actions)) {
          const control = row.querySelector(`[data-action="${action}"]`);
          if (control) control.disabled = disabled;
        }
      }
      if (focusedControl?.userId && focusedControl.key) panel.querySelector(`[data-user-id="${focusedControl.userId}"] [name="${focusedControl.key}"], [data-user-id="${focusedControl.userId}"] [data-action="${focusedControl.key}"]`)?.focus();
    }
  } catch (error) {
    if (requestId !== adminUsersRequestId || currentView !== 'admin' || state.user?.id !== adminId || !canManageUsers(state.user)) return;
    if (error.status === 401 || error.status === 403) await refreshAuth();
    if (requestId !== adminUsersRequestId || currentView !== 'admin' || state.user?.id !== adminId || !canManageUsers(state.user)) return;
    status.replaceChildren(document.createTextNode(error.message + ' '));
    const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'quiet-button'; retry.textContent = text('retry'); retry.addEventListener('click', () => loadAdminUsers({ focusStatus: true })); status.append(retry);
    if (focusStatus) retry.focus();
  }
}

function addFeedbackHistory(parent, events, admin = false) {
  const section = document.createElement('div'); section.className = 'feedback-history';
  addText(section, 'h5', text('feedbackLatestUpdate'));
  const history = (events || []).filter((event) => admin || event.public_update);
  if (!history.length) addText(section, 'p', text('feedbackNoUpdates'));
  for (const event of history) {
    const entry = document.createElement('p');
    if (admin && event.actor) {
      const actorLabel = text(event.action === 'submitted' ? 'feedbackHistorySubmittedBy' : 'feedbackHistoryUpdatedBy');
      entry.append(document.createTextNode(`${actorLabel}: ${event.actor} · `));
    }
    const stamp = document.createElement('time'); stamp.dateTime = event.created_at || ''; stamp.textContent = event.created_at || '';
    entry.append(stamp, document.createTextNode(' · '));
    if (event.status) entry.append(document.createTextNode(`${text(feedbackStatusKey(event.status))}: `));
    const detail = event.public_update || (event.action === 'submitted' ? text('feedbackHistoryRequestReceived') : '');
    if (detail) entry.append(document.createTextNode(detail));
    section.append(entry);
  }
  parent.append(section);
}

function feedbackCard(request, admin = false, editorNotice = '') {
  const card = document.createElement('article'); card.className = 'feedback-card';
  const header = document.createElement('header');
  const type = addText(header, 'span', text(request.type === 'Feature' ? 'feedbackFeature' : 'feedbackIssue'), 'feedback-meta');
  type.setAttribute('aria-label', text('feedbackType'));
  const status = addText(header, 'span', text(feedbackStatusKey(request.status)), 'feedback-status');
  status.setAttribute('aria-label', text('feedbackStatusLabel'));
  card.append(header);
  addText(card, 'h4', request.title);
  addText(card, 'p', request.description);
  if (request.context) addText(card, 'p', request.context, 'feedback-meta');
  const ids = (request.backlog_ids || []).join(', ');
  const submitter = typeof request.submitter === 'string' ? request.submitter : request.submitter?.username;
  const meta = `${text('feedbackRequestId')} #${request.id} · ${text('feedbackUpdated')}: ${request.updated_at || request.created_at || ''}${admin && submitter ? ` · ${text('feedbackSubmitter')}: ${submitter}` : ''}${ids ? ` · ${text('feedbackBacklogIds')}: ${ids}` : ''}`;
  addText(card, 'p', meta, 'feedback-meta');
  if (!admin && request.status === 'Duplicate' && request.duplicate_of) {
    addText(card, 'p', `${text('feedbackDuplicateOf')} #${request.duplicate_of}`, 'feedback-meta');
  }
  const history = request.history || [];
  if (!history.length && request.public_update) history.push({ public_update: request.public_update, status: request.status, created_at: request.updated_at });
  if (!admin) addFeedbackHistory(card, history, false);
  if (admin) {
    if (history.length) addFeedbackHistory(card, history, true);
    if (request.internal_notes) {
      const internal = document.createElement('div'); internal.className = 'feedback-history';
      addText(internal, 'h5', text('feedbackInternalNote'));
      addText(internal, 'p', request.internal_notes);
      card.append(internal);
    }
    const editor = document.createElement('details'); editor.className = 'feedback-triage-disclosure';
    const editorSummary = document.createElement('summary');
    editorSummary.textContent = text('feedbackEditRequest')
      .replace('{id}', String(request.id))
      .replace('{title}', request.title || '')
      .replace('{status}', text(feedbackStatusKey(request.status)));
    editor.append(editorSummary);
    const form = document.createElement('form'); form.className = 'feedback-triage';
    const fields = document.createElement('div'); fields.className = 'account-fields';
    const statusLabel = document.createElement('label'); statusLabel.append(document.createTextNode(`${text('feedbackStatusLabel')} `));
    const statusSelect = document.createElement('select'); statusSelect.name = 'status'; statusSelect.setAttribute('aria-label', `${text('feedbackStatusLabel')}: #${request.id}`);
    for (const value of feedbackStatuses) { const option = document.createElement('option'); option.value = value; option.textContent = text(feedbackStatusKey(value)); statusSelect.append(option); }
    statusSelect.value = feedbackStatuses.includes(request.status) ? request.status : 'Under review';
    statusLabel.append(statusSelect); fields.append(statusLabel);
    if (request.status === 'Needs information') addText(fields, 'p', text('feedbackLegacyStatusHelp'), 'feedback-meta');
    const priorityLabel = document.createElement('label'); priorityLabel.append(document.createTextNode(`${text('feedbackPriority')} `));
    const prioritySelect = document.createElement('select'); prioritySelect.name = 'priority'; prioritySelect.setAttribute('aria-label', `${text('feedbackPriority')}: #${request.id}`);
    for (const value of feedbackPriorities) { const option = document.createElement('option'); option.value = value; option.textContent = text(`feedbackPriority_${value}`); prioritySelect.append(option); }
    prioritySelect.value = request.priority || 'normal'; priorityLabel.append(prioritySelect); fields.append(priorityLabel);
    for (const [name, labelKey, initial, maxLength] of [
      ['public_update', 'feedbackPublicUpdate', '', 1000],
      ['internal_notes', 'feedbackInternalNote', request.internal_notes || '', 4000],
      ['backlog_ids', 'feedbackBacklogReference', ids, 300],
      ['duplicate_of', 'feedbackDuplicates', request.duplicate_of || '', 36]
    ]) {
      const label = document.createElement('label'); label.className = 'feedback-wide'; label.append(document.createTextNode(text(labelKey)));
      const control = ['public_update', 'internal_notes'].includes(name) ? document.createElement('textarea') : document.createElement('input');
      control.name = name; control.maxLength = maxLength; control.value = initial; control.setAttribute('aria-label', text(labelKey));
      if (control.tagName === 'TEXTAREA') control.rows = 2;
      label.append(control); fields.append(label);
    }
    const publicUpdateField = fields.querySelector('[name="public_update"]');
    const duplicateField = fields.querySelector('[name="duplicate_of"]');
    const result = document.createElement('p'); result.className = 'feedback-meta'; result.setAttribute('role', 'status'); result.setAttribute('aria-live', 'polite'); result.textContent = editorNotice;
    if (editorNotice) result.tabIndex = -1;
    const save = document.createElement('button'); save.type = 'submit'; save.textContent = text('feedbackSave');
    form.append(fields, save, result);
    const draft = feedbackFormDrafts.get(request.id);
    if (draft) for (const control of form.elements) if (control.name in draft) control.value = draft[control.name];
    if (editorNotice) editor.open = true;
    const baseline = feedbackTriageValues(request);
    const updateRequiredFields = () => {
      publicUpdateField.required = ['Not planned', 'Duplicate'].includes(statusSelect.value) && statusSelect.value !== request.status;
      duplicateField.required = statusSelect.value === 'Duplicate';
      duplicateField.setCustomValidity(duplicateField.required && !duplicateField.value.trim() ? text('feedbackDuplicateRequired') : '');
      if (!duplicateField.required && result.dataset.validation === 'duplicate') {
        delete result.dataset.validation; result.textContent = ''; result.classList.remove('feedback-error');
      }
    };
    statusSelect.addEventListener('change', updateRequiredFields);
    duplicateField.addEventListener('input', () => {
      updateRequiredFields();
      if (duplicateField.validity.valid && result.dataset.validation === 'duplicate') {
        delete result.dataset.validation; result.textContent = ''; result.classList.remove('feedback-error');
      }
    });
    duplicateField.addEventListener('invalid', () => {
      result.dataset.validation = 'duplicate'; result.textContent = text('feedbackDuplicateRequired'); result.classList.add('feedback-error');
      duplicateField.focus();
    });
    updateRequiredFields();
    const saveDraft = () => {
      feedbackFormDrafts.set(request.id, Object.fromEntries([...form.elements].filter((control) => control.name).map((control) => [control.name, control.value])));
    };
    form.addEventListener('input', saveDraft);
    form.addEventListener('change', saveDraft);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (form.dataset.submitting === 'true') return;
      const values = Object.fromEntries([...form.elements].filter((control) => control.name).map((control) => [control.name, control.value]));
      const changes = changedFeedbackTriageFields(baseline, values);
      if (!Object.keys(changes).length) { result.textContent = text('feedbackNoChanges'); return; }
      form.dataset.submitting = 'true'; save.disabled = true; result.textContent = text('saving');
      try {
        const patch = { ...changes, expected_version: request.triage_version };
        await authRequest(`/api/admin/feedback/${request.id}`, 'PATCH', patch);
        feedbackFormDrafts.delete(request.id);
        await loadAdminFeedback({ focusStatus: true, successMessage: text('feedbackSaved'), reset: true });
      } catch (error) {
        if (error.code === 'feedback_conflict' && error.data && form.isConnected) {
          feedbackFormDrafts.set(request.id, rebaseFeedbackTriageDraft(baseline, error.data, values));
          const refreshedCard = feedbackCard(error.data, true, text('feedbackConflict'));
          card.replaceWith(refreshedCard);
          refreshedCard.querySelector('[role="status"]')?.focus();
          return;
        }
        if ([401, 403].includes(error.status)) await refreshAuth();
        if (currentView !== 'feedback' || !canManageUsers(state.user) || !form.isConnected) return;
        result.textContent = localizeFeedbackTriageError(error); result.classList.add('feedback-error');
        form.dataset.submitting = 'false'; save.disabled = false; save.focus();
      } finally { delete form.dataset.submitting; }
    });
    editor.append(form);
    card.append(editor);
  }
  return card;
}

async function loadMyFeedback({ focusStatus = false } = {}) {
  if (!state.user) return;
  const list = $('#my-feedback-list'); const status = $('#feedback-list-status'); const userId = state.user.id;
  const requestId = ++myFeedbackRequestId;
  list.setAttribute('aria-busy', 'true');
  status.tabIndex = -1;
  status.hidden = false; status.textContent = text('feedbackLoading');
  if (focusStatus) status.focus();
  try {
    const { data } = await authRequest('/api/feedback/mine');
    if (requestId !== myFeedbackRequestId || currentView !== 'account' || state.user?.id !== userId) return;
    list.replaceChildren(...data.map((request) => feedbackCard(request)));
    status.textContent = data.length ? '' : text('feedbackEmpty');
    status.hidden = data.length > 0;
  } catch (error) {
    if ([401, 403].includes(error.status)) await refreshAuth();
    if (requestId !== myFeedbackRequestId || currentView !== 'account' || state.user?.id !== userId) return;
    status.replaceChildren(document.createTextNode(error.message || text('feedbackError')));
    const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'quiet-button'; retry.textContent = text('retry');
    retry.addEventListener('click', () => loadMyFeedback({ focusStatus: true })); status.append(' ', retry); status.hidden = false;
    if (focusStatus) retry.focus();
  } finally { if (requestId === myFeedbackRequestId) list.setAttribute('aria-busy', 'false'); }
}

async function loadAdminFeedback({ focusStatus = false, successMessage = '', reset = false } = {}) {
  if (currentView !== 'feedback' || !canManageUsers(state.user)) return;
  const list = $('#admin-feedback-list'); const status = $('#feedback-admin-status'); const adminId = state.user.id;
  if (reset) { adminFeedbackOffset = 0; list.replaceChildren(); }
  const requestId = ++adminFeedbackRequestId;
  const loadMore = $('#feedback-load-more');
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 8000);
  loadMore.disabled = true;
  list.setAttribute('aria-busy', 'true'); status.tabIndex = -1; status.textContent = text(adminFeedbackOffset ? 'feedbackMoreLoading' : 'feedbackQueueLoading');
  if (focusStatus) status.focus();
  try {
    const query = new URLSearchParams({ limit: String(feedbackPageSize), offset: String(adminFeedbackOffset) });
    const statusFilter = $('#feedback-filter-status').value;
    const typeFilter = $('#feedback-filter-type').value;
    if (statusFilter) query.set('status', statusFilter);
    if (typeFilter) query.set('type', typeFilter);
    const { data, viewer_id: viewerId } = await authRequest(`/api/admin/feedback?${query}`, 'GET', undefined, {}, { signal: controller.signal });
    if (viewerId !== adminId) {
      feedbackFormDrafts.clear();
      await refreshAuth();
      return;
    }
    if (requestId !== adminFeedbackRequestId || currentView !== 'feedback' || state.user?.id !== adminId || !canManageUsers(state.user)) return;
    const cards = data.map((request) => feedbackCard(request, true));
    if (adminFeedbackOffset) list.append(...cards); else list.replaceChildren(...cards);
    status.textContent = successMessage || (adminFeedbackOffset
      ? (data.length ? text('feedbackMoreLoaded') : text('feedbackNoMore'))
      : (data.length
        ? (state.language === 'zh'
          ? `${text('feedbackQueueFiltered')} ${data.length} 项。`
          : `${text('feedbackQueueFiltered')} ${data.length} requests.`)
        : text('feedbackQueueEmpty')));
    loadMore.hidden = data.length < feedbackPageSize;
    loadMore.disabled = false;
  } catch (error) {
    if ([401, 403].includes(error.status)) await refreshAuth();
    if (requestId !== adminFeedbackRequestId || currentView !== 'feedback' || state.user?.id !== adminId || !canManageUsers(state.user)) return;
    status.replaceChildren(document.createTextNode(timedOut ? text('feedbackQueueTimeout') : (error.message || text('feedbackError'))));
    const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'quiet-button'; retry.textContent = text('retry');
    retry.addEventListener('click', () => loadAdminFeedback({ focusStatus: true })); status.append(' ', retry);
    loadMore.hidden = true; loadMore.disabled = false;
    if (focusStatus) retry.focus();
  } finally { clearTimeout(timeout); if (requestId === adminFeedbackRequestId) list.setAttribute('aria-busy', 'false'); }
}

function mediaStatusText(status) {
  return text(({ pending: 'mediaReviewPendingState', approved: 'mediaReviewApprovedState', rejected: 'mediaReviewRejectedState' })[status] || 'mediaReviewPendingState');
}

function safeMediaReviewUrl(value) {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}

function mediaReviewCard(candidate) {
  const card = document.createElement('article'); card.className = 'media-review-card'; card.dataset.reportId = String(candidate.report_id);
  const heading = addText(card, 'h2', candidate.title || text('missingTitle'));
  heading.className = 'media-review-title';
  const facts = document.createElement('dl'); facts.className = 'media-review-facts';
  const verification = candidate.verification_status === 'verified' ? text('verifiedLead') : candidate.verification_status === 'unverified' ? text('unverifiedLead') : (candidate.verification_status || text('unverifiedLead'));
  for (const [key, value] of [
    [text('mediaReviewReportId'), candidate.report_id], [text('platform'), candidate.platform],
    [text('mediaReviewVerification'), verification], [text('mediaReviewStatus'), mediaStatusText(candidate.media_review_status)]
  ]) { addText(facts, 'dt', key); addText(facts, 'dd', String(value)); }
  card.append(facts);

  const sourceUrl = safeMediaReviewUrl(candidate.source_url);
  const sourceBlock = document.createElement('p'); sourceBlock.className = 'media-review-source';
  addText(sourceBlock, 'strong', `${text('mediaReviewSource')}: `);
  if (sourceUrl) {
    const source = document.createElement('a'); source.href = sourceUrl; source.target = '_blank'; source.rel = 'noopener noreferrer';
    source.textContent = candidate.source_name || sourceUrl; sourceBlock.append(source);
  } else addText(sourceBlock, 'span', text('mediaReviewUnknownSource'));
  card.append(sourceBlock);

  const preview = document.createElement('div'); preview.className = 'media-review-preview';
  const thumbnailUrl = candidate.thumbnail_policy_blocked ? null : safeMediaReviewUrl(candidate.video_thumbnail_url);
  let previewLoadFailed = false;
  let approvePreviewButton = null;
  if (thumbnailUrl) {
    const image = document.createElement('img'); image.src = thumbnailUrl; image.alt = `${text('mediaReviewCandidate')}: ${candidate.title || text('missingTitle')}`;
    image.loading = 'lazy'; image.referrerPolicy = 'no-referrer';
    image.addEventListener('error', () => {
      previewLoadFailed = true;
      if (approvePreviewButton) approvePreviewButton.disabled = true;
      preview.replaceChildren(); addText(preview, 'p', text('mediaReviewImageUnavailable'));
    }, { once: true });
    preview.append(image);
  } else addText(preview, 'p', candidate.thumbnail_policy_blocked ? text('mediaReviewPolicyBlocked') : text('mediaReviewNoCover'));
  card.append(preview);
  if (candidate.thumbnail_policy_blocked) {
    const blocked = addText(card, 'p', text('mediaReviewApprovalBlocked'), 'media-review-policy-note');
    blocked.setAttribute('role', 'note');
  }

  const actions = document.createElement('div'); actions.className = 'button-row media-review-actions';
  const actionButton = (action, labelKey) => {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = text(labelKey);
    button.disabled = action === 'approve' && (!thumbnailUrl || previewLoadFailed);
    button.addEventListener('click', async () => {
      if (action === 'remove' && !window.confirm(text('mediaReviewRemoveConfirm'))) return;
      button.disabled = true;
      const status = $('#media-review-status'); status.textContent = text('mediaReviewLoading');
      try {
        await authRequest(`/api/admin/media-review/${candidate.report_id}/${action}`, 'POST', {});
        await loadMediaReview({ focusStatus: true, successMessage: text('mediaReviewSaved') });
      } catch (error) {
        if ([401, 403].includes(error.status)) await refreshAuth();
        if (currentView !== 'media-review' || !canManageUsers(state.user)) return;
        status.textContent = error.status === 401 || error.status === 403 ? text('mediaReviewAdminRequired') : text('mediaReviewActionError');
        button.disabled = false; button.focus();
      }
    });
    return button;
  };
  actions.append(actionButton('approve', 'mediaReviewApprove'), actionButton('reject', 'mediaReviewReject'), actionButton('remove', 'mediaReviewRemove'));
  approvePreviewButton = actions.querySelector('button');
  card.append(actions);

  const history = document.createElement('details'); history.className = 'media-review-history';
  const summary = document.createElement('summary'); summary.textContent = text('mediaReviewHistory'); history.append(summary);
  const historyStatus = addText(history, 'p', '', 'media-review-history-status');
  history.addEventListener('toggle', async () => {
    if (!history.open || history.dataset.loaded === 'true' || !canManageUsers(state.user)) return;
    history.dataset.loaded = 'true'; historyStatus.textContent = text('mediaReviewHistoryLoading');
    try {
      const { data } = await authRequest(`/api/admin/media-review/${candidate.report_id}/events`);
      if (!canManageUsers(state.user) || currentView !== 'media-review') return;
      historyStatus.textContent = data.length ? '' : text('mediaReviewHistoryEmpty');
      if (!data.length) return;
      const list = document.createElement('ol');
      for (const event of data) {
        const item = document.createElement('li');
        const actionKey = ({ approve: 'mediaReviewApproveAction', reject: 'mediaReviewRejectAction', remove: 'mediaReviewRemoveAction' })[event.action];
        addText(item, 'span', `${text(actionKey || 'mediaReviewAction')}: ${text('mediaReviewReviewer')} #${event.actor_id} · `);
        const time = document.createElement('time'); time.dateTime = event.created_at;
        const instant = Date.parse(event.created_at); time.textContent = Number.isFinite(instant)
          ? new Intl.DateTimeFormat(state.language === 'zh' ? 'zh-CN' : 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(instant)
          : event.created_at;
        item.append(time); list.append(item);
      }
      history.append(list);
    } catch (error) {
      if ([401, 403].includes(error.status)) await refreshAuth();
      history.dataset.loaded = 'false'; historyStatus.textContent = text('mediaReviewHistoryError');
    }
  });
  card.append(history);
  return card;
}

function getMediaReviewLoadMoreButton() {
  const list = $('#media-review-list');
  if (!mediaReviewLoadMoreButton) {
    mediaReviewLoadMoreButton = document.createElement('button');
    mediaReviewLoadMoreButton.id = 'media-review-load-older';
    mediaReviewLoadMoreButton.type = 'button';
    mediaReviewLoadMoreButton.className = 'quiet-button';
    mediaReviewLoadMoreButton.setAttribute('aria-controls', 'media-review-list');
    mediaReviewLoadMoreButton.addEventListener('click', () => loadMediaReview({ append: true }));
  }
  if (mediaReviewLoadMoreButton.nextElementSibling !== list) list.before(mediaReviewLoadMoreButton);
  return mediaReviewLoadMoreButton;
}

function resetMediaReviewPaging() {
  mediaReviewCursor = null;
  mediaReviewHasMore = false;
  mediaReviewFilter = null;
  const button = getMediaReviewLoadMoreButton();
  button.hidden = true;
  button.disabled = false;
}

async function loadMediaReview({ append = false, focusStatus = false, successMessage = '' } = {}) {
  if (currentView !== 'media-review' || !canManageUsers(state.user)) return;
  const list = $('#media-review-list'); const status = $('#media-review-status'); const adminId = state.user.id;
  const filter = $('#media-review-filter').value || 'pending';
  if (append && (!mediaReviewHasMore || !mediaReviewCursor || mediaReviewFilter !== filter)) return;
  if (!append) {
    mediaReviewCursor = null;
    mediaReviewHasMore = false;
    mediaReviewFilter = filter;
  }
  const cursor = append ? mediaReviewCursor : null;
  const loadMoreButton = getMediaReviewLoadMoreButton();
  const returnFocusToLoadMore = append && document.activeElement === loadMoreButton;
  const requestId = ++mediaReviewRequestId;
  list.setAttribute('aria-busy', 'true'); status.textContent = text('mediaReviewLoading');
  if (append) loadMoreButton.disabled = true;
  else loadMoreButton.hidden = true;
  if (focusStatus) { status.tabIndex = -1; status.focus(); }
  try {
    const query = new URLSearchParams({ status: filter, limit: '100' });
    if (cursor) query.set('cursor', cursor);
    const { data, next_cursor: nextCursor = null } = await authRequest(`/api/admin/media-review?${query}`);
    if (requestId !== mediaReviewRequestId || currentView !== 'media-review' || state.user?.id !== adminId || !canManageUsers(state.user)) return;
    const newCards = data.map(mediaReviewCard);
    if (append) list.append(...newCards);
    else list.replaceChildren(...newCards);
    mediaReviewCursor = nextCursor;
    mediaReviewHasMore = Boolean(nextCursor);
    loadMoreButton.hidden = !mediaReviewHasMore;
    loadMoreButton.disabled = false;
    loadMoreButton.textContent = text('mediaReviewLoadOlder');
    status.textContent = successMessage || (append ? (data.length ? text('mediaReviewOlderLoaded') : text('mediaReviewNoOlder')) : (data.length ? '' : text('mediaReviewEmpty')));
    const restorePaginationFocus = returnFocusToLoadMore && (document.activeElement === loadMoreButton || document.activeElement === document.body);
    if (restorePaginationFocus) {
      if (mediaReviewHasMore) loadMoreButton.focus();
      else if (newCards.length) {
        const firstNewTitle = newCards[0].querySelector('.media-review-title');
        if (firstNewTitle) { firstNewTitle.tabIndex = -1; firstNewTitle.focus(); }
        else { status.tabIndex = -1; status.focus(); }
      } else { status.tabIndex = -1; status.focus(); }
    }
  } catch (error) {
    if ([401, 403].includes(error.status)) await refreshAuth();
    if (requestId !== mediaReviewRequestId || currentView !== 'media-review' || !canManageUsers(state.user)) return;
    if (!append) list.replaceChildren();
    status.textContent = error.status === 401 || error.status === 403 ? text('mediaReviewAdminRequired') : text('mediaReviewError');
    const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'quiet-button'; retry.textContent = text('retry');
    retry.addEventListener('click', () => loadMediaReview({ append, focusStatus: true })); status.append(' ', retry);
    if (returnFocusToLoadMore && (document.activeElement === loadMoreButton || document.activeElement === document.body)) retry.focus();
  } finally {
    if (requestId === mediaReviewRequestId) {
      list.setAttribute('aria-busy', 'false');
      loadMoreButton.disabled = false;
      if (append && mediaReviewHasMore) loadMoreButton.hidden = false;
    }
  }
}

async function refreshAuth({ requireConfirmation = false } = {}) {
  if (visibilityAuthUnconfirmed && !requireConfirmation) return;
  const authStateRequest = beginAuthStateRequest();
  const priorUserId = state.user?.id ?? null;
  const priorIdentity = state.user ? `${state.user.id}:${state.user.role}:${state.user.approved}` : 'signed-out';
  const accessRetryHadFocus = reportAccessBlocked && $('#account-message').contains(document.activeElement);
  try {
    const result = await authRequest('/api/auth/me');
    if (!isCurrentAuthStateRequest(authStateRequest)) return;
    state.user = result.user; state.csrf = result.csrf;
    if (sessionLoadError && $('#account-message').textContent === text('sessionError')) $('#account-message').textContent = '';
    sessionLoadError = false;
  }
  catch (error) {
    if (!isCurrentAuthStateRequest(authStateRequest)) return;
    if (requireConfirmation && ![401, 403].includes(error.status)) {
      showAuthCheckStatus(true);
      return;
    }
    sessionLoadError = !requireConfirmation; state.user = null; state.csrf = null;
  }
  if (requireConfirmation) visibilityAuthUnconfirmed = false;
  const confirmedUserId = state.user?.id ?? null;
  const accountChanged = priorUserId !== confirmedUserId;
  if (requireConfirmation && accountChanged) clearRestrictedReportData();
  renderAuth();
  if (requireConfirmation) {
    hideAuthCheckStatus();
    document.querySelector('main').hidden = false;
    $('#workspace-nav').inert = false;
    $('#account-entry').inert = false;
    if (currentView === 'account' && state.user && priorIdentity === refreshedAuthIdentity()) loadMyFeedback();
    if (currentView === 'admin' && canManageUsers(state.user) && priorIdentity === refreshedAuthIdentity()) loadAdminUsers();
    if (currentView === 'feedback' && canManageUsers(state.user) && priorIdentity === refreshedAuthIdentity()) loadAdminFeedback({ reset: true });
    if (currentView === 'media-review' && canManageUsers(state.user) && priorIdentity === refreshedAuthIdentity()) loadMediaReview();
    // Reports include the viewer's own vote state. Clear it before unlocking
    // for a different account, then reload that account's data without moving
    // focus or forcing a route change.
    if (accountChanged && state.user?.approved) loadDatabaseData();
  }
  const refreshedIdentity = state.user ? `${state.user.id}:${state.user.role}:${state.user.approved}` : 'signed-out';
  if (priorIdentity !== refreshedIdentity && currentView === 'feedback' && canManageUsers(state.user)) loadAdminFeedback({ reset: true });
  if (!requireConfirmation && priorIdentity !== refreshedIdentity && currentView === 'media-review' && canManageUsers(state.user)) loadMediaReview();
  if (reportAccessBlocked && sessionLoadError) {
    accessCheckMessage = text('accessCheckUnavailable');
    showReportAccessMessage([accessActionMessage, accessCheckMessage].filter(Boolean).join(' '), true);
    if (currentView === 'account' && accessRetryHadFocus) $('#account-message button')?.focus();
  }
}

function refreshedAuthIdentity() {
  return state.user ? `${state.user.id}:${state.user.role}:${state.user.approved}` : 'signed-out';
}

function clearMemberFeedbackForm() {
  const form = $('#feedback-form');
  for (const control of form.elements) {
    clearValidationError(control);
    control.setCustomValidity('');
    control.removeAttribute('aria-invalid');
    control.removeAttribute('aria-describedby');
  }
  form.querySelectorAll('.field-validation-error[role="alert"]').forEach((error) => error.remove());
  form.reset();
}

function snapshotAndBlankMemberFeedbackForm() {
  if (memberFeedbackDraftIdentity !== null) {
    memberFeedbackDrafts.set(memberFeedbackDraftIdentity, Object.fromEntries(
      [...$('#feedback-form').elements].filter((control) => control.name).map((control) => [control.name, control.value])
    ));
  }
  memberFeedbackDraftIdentity = null;
  clearMemberFeedbackForm();
}

function showAuthCheckStatus(failed = false) {
  if (!authCheckStatusElement) {
    authCheckStatusElement = document.createElement('section');
    authCheckStatusElement.className = 'access-notice';
    authCheckStatusElement.setAttribute('role', 'status');
    authCheckStatusElement.setAttribute('aria-live', 'polite');
    authCheckStatusElement.tabIndex = -1;
    const main = document.querySelector('main');
    main.before(authCheckStatusElement);
  }
  authCheckStatusElement.replaceChildren(document.createTextNode(text(failed ? 'authCheckFailed' : 'authChecking')));
  if (failed) {
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'quiet-button';
    retry.textContent = text('authCheckRetry');
    retry.addEventListener('click', () => refreshAuth({ requireConfirmation: true }));
    authCheckStatusElement.append(' ', retry);
  }
  authCheckStatusElement.hidden = false;
}

function hideAuthCheckStatus() {
  if (authCheckStatusElement) authCheckStatusElement.hidden = true;
}

function lockForVisibilityRevalidation() {
  snapshotAndBlankMemberFeedbackForm();
  $('#feedback-message').textContent = '';
  $('#feedback-list-status').replaceChildren();
  $('#feedback-list-status').hidden = true;
  $('#my-feedback-list').replaceChildren();
  $('#account-message').replaceChildren();
  $('#account-message').dataset.errorKey = '';
  $('#invite-result').textContent = '';
  $('#admin-feedback-list').replaceChildren();
  $('#feedback-admin-status').textContent = '';
  delete $('#feedback-admin-status').dataset.messageKey;
  $('#admin-users').replaceChildren();
  $('#admin-load-status').textContent = '';
  delete $('#admin-load-status').dataset.messageKey;
  $('#media-review-list').replaceChildren();
  $('#media-review-status').textContent = '';
  myFeedbackRequestId += 1;
  adminFeedbackRequestId += 1;
  adminUsersRequestId += 1;
  mediaReviewRequestId += 1;
  document.querySelector('main').hidden = true;
  $('#workspace-nav').inert = true;
  $('#account-entry').inert = true;
  $('#admin-nav').hidden = true;
  $('#feedback-nav').hidden = true;
  $('#media-review-nav').hidden = true;
  showAuthCheckStatus(false);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    markAuthUnconfirmed();
    return;
  }
  if (!visibilityAuthUnconfirmed) return;
  lockForVisibilityRevalidation();
  refreshAuth({ requireConfirmation: true });
});

function markAuthUnconfirmed() {
  if (visibilityAuthUnconfirmed) return;
  visibilityAuthUnconfirmed = true;
  authIdentityGeneration += 1;
  authStateRequestId += 1;
  snapshotAndBlankMemberFeedbackForm();
}

authChangeChannel?.addEventListener('message', (event) => {
  if (event.data?.type !== 'auth-changed') return;
  markAuthUnconfirmed();
  if (document.hidden) return;
  lockForVisibilityRevalidation();
  refreshAuth({ requireConfirmation: true });
});

function announceAuthChange() {
  authChangeChannel?.postMessage({ type: 'auth-changed' });
}

function beginAuthStateRequest() {
  return { id: ++authStateRequestId, identityGeneration: authIdentityGeneration };
}

function isCurrentAuthStateRequest(request) {
  return request.id === authStateRequestId && request.identityGeneration === authIdentityGeneration;
}

function openAccount() {
  showView('account');
  if (state.user) $('#logout').focus();
  else $('#auth-form [name="username"]').focus();
}

function updateLanguageButton() {
  $('#language-toggle').textContent = state.language === 'en' ? '中文' : 'English';
  document.documentElement.lang = state.language === 'en' ? 'en' : 'zh-CN';
  document.title = text('documentTitle');
  document.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = text(element.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => { element.setAttribute('aria-label', text(element.dataset.i18nAriaLabel)); });
  for (const [selector, values, allKey, labelKey] of [
    ['#feedback-filter-status', feedbackStatuses, 'feedbackAllStatuses', feedbackStatusKey],
    ['#feedback-filter-type', ['Issue', 'Feature'], 'feedbackAllTypes', (value) => value === 'Feature' ? 'feedbackFeature' : 'feedbackIssue']
  ]) {
    const select = $(selector); const selected = select.value;
    select.replaceChildren(new Option(text(allKey), ''));
    for (const value of values) select.add(new Option(text(labelKey(value)), value));
    select.value = selected;
  }
  const mediaStatus = $('#media-review-filter'); const selectedMediaStatus = mediaStatus.value;
  mediaStatus.replaceChildren(...['pending', 'approved', 'rejected'].map((value) => new Option(text(`mediaReview${value[0].toUpperCase()}${value.slice(1)}`), value)));
  mediaStatus.value = selectedMediaStatus || 'pending';
  $('#query').placeholder = text('searchPlaceholder');
  refreshValidationMessages();
}

function showAction(message) {
  $('#action-status').textContent = message || '';
}

function showActionWithRetry(message, voteContext) {
  const status = $('#action-status');
  status.replaceChildren(document.createTextNode(`${message} `));
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'quiet-button';
  retry.textContent = text('retryReports');
  retry.addEventListener('click', async () => {
    retry.disabled = true;
    const refreshed = await loadReports({ voteContext });
    if (refreshed?.kind === 'success') {
      showAction(refreshed.focused === 'heading'
        ? text(voteContext.action === 'undo' ? 'voteRemovedListChanged' : 'voteSavedListChanged')
        : text(voteContext.action === 'undo' ? 'voteRemoved' : 'voteSaved'));
    } else if (refreshed?.kind === 'failure') {
      showActionWithRetry(text(voteContext.action === 'undo' ? 'voteRemovedRetryFailed' : 'voteSavedRetryFailed'), voteContext);
      $('#action-status button')?.focus();
    }
  });
  status.append(retry);
}

function markReportDataStale() {
  const reports = $('#reports');
  reports.dataset.rankingStale = 'true';
  reports.querySelectorAll('.community-vote-counts, .report-score').forEach((element) => { element.hidden = true; });
}

function restoreVoteFocus(target, position) {
  return restoreVoteInteraction(window, $('#reports'), $('.results-heading h2'), position, target);
}

async function submitVoteAction(report, action, vote, invokedControl) {
  const position = captureViewport();
  const target = { fingerprint: report.fingerprint, vote: action === 'undo' ? 'revoke' : vote };
  const voteContext = { fingerprint: report.fingerprint, vote, position, action };
  const controls = invokedControl.closest('.vote-controls');
  if (controls) controls.querySelectorAll('button').forEach((button) => { button.disabled = true; });

  try {
    if (action === 'undo') await authRequest(`/api/vote/${report.fingerprint}`, 'DELETE');
    else await authRequest('/api/vote', 'POST', { fingerprint: report.fingerprint, vote });
  } catch (error) {
    if ([401, 403].includes(error.status)) {
      await handleReportAccessDenied({ action, committed: false });
      return;
    }
    if (controls) controls.querySelectorAll('button').forEach((button) => { button.disabled = false; });
    restoreVoteFocus(target, position);
    showAction(`${text(action === 'undo' ? 'voteRemoveFailed' : 'voteSaveFailed')} ${error.message}`);
    return;
  }

  if (action === 'undo') state.myVotes.delete(report.fingerprint);
  else state.myVotes.set(report.fingerprint, vote);

  const refreshed = await loadReports({ voteContext });
  if (refreshed?.kind === 'success') {
    showAction(refreshed.focused === 'heading'
      ? text(action === 'undo' ? 'voteRemovedListChanged' : 'voteSavedListChanged')
      : text(action === 'undo' ? 'voteRemoved' : 'voteSaved'));
    return;
  }
  if (refreshed?.kind === 'denied' || refreshed?.kind === 'superseded') {
    if (refreshed.kind === 'superseded') showAction(action === 'undo' ? text('voteRemoved') : text('voteSaved'));
    return;
  }

  const card = [...$('#reports').querySelectorAll('article[data-report-fingerprint]')]
    .find((candidate) => candidate.dataset.reportFingerprint === report.fingerprint);
  const oldControls = card?.querySelector('.vote-controls');
  if (oldControls) oldControls.replaceWith(createVoteControls(report));
  markReportDataStale();
  restoreVoteFocus({ fingerprint: report.fingerprint, vote }, position);
  showActionWithRetry(text(action === 'undo' ? 'voteRemovedRefreshFailed' : 'voteSavedRefreshFailed'), voteContext);
}

function showAccountMessage(message) {
  showView('account');
  const key = ['invalid_username_or_password', 'login_temporarily_limited'].includes(message) ? message : '';
  $('#account-message').dataset.errorKey = key;
  $('#account-message').textContent = key ? text(key) : (message || '');
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
  card.dataset.reportFingerprint = report.fingerprint;
  const view = projectReportCard(report, state.language);
  const preview = document.createElement('div');
  preview.className = 'report-preview';
  if (view.media) preview.dataset.videoPresent = 'true';
  preview.setAttribute('aria-label', view.media?.thumbnail ? text('openSource') : text(view.media ? 'videoPreviewUnavailable' : 'previewUnavailable'));
  const showPlaceholder = () => {
    preview.replaceChildren();
    preview.removeAttribute('data-video-preview');
    preview.setAttribute('role', 'img');
    preview.setAttribute('aria-label', text(view.media ? 'videoPreviewUnavailable' : 'previewUnavailable'));
    addText(preview, 'span', '▧', 'preview-icon').setAttribute('aria-hidden', 'true');
    addText(preview, 'span', text(view.media ? 'videoPreviewUnavailable' : 'previewUnavailable'), 'preview-label');
  };
  if (view.media?.thumbnail && view.media.source) {
    const link = document.createElement('a');
    link.className = 'video-preview-link';
    link.href = view.media.source;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', text('openSource'));
    const image = document.createElement('img');
    image.src = view.media.thumbnail;
    image.alt = '';
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';
    image.addEventListener('error', showPlaceholder, { once: true });
    link.append(image);
    preview.dataset.videoPreview = 'true';
    preview.removeAttribute('aria-label');
    preview.replaceChildren(link);
  } else showPlaceholder();
  card.append(preview);
  const body = document.createElement('div'); body.className = 'report-card-body';
  if (view.date) addText(body, 'time', view.date);
  addText(body, 'h2', view.title);
  const statusLabel = view.status === 'unverified' ? text('unverifiedLead') : (view.status === 'verified' ? text('verifiedLead') : view.status);
  const status = addText(body, 'span', statusLabel, 'verification-badge');
  status.dataset.status = view.status;
  const metadata = [view.source, view.platform, view.location].filter(Boolean).join(' · ');
  if (metadata) addText(body, 'p', metadata, 'report-meta');
  if (view.summary) addText(body, 'p', view.summary, 'report-excerpt');
  const disclosure = document.createElement('details'); disclosure.className = 'report-details';
  disclosure.dataset.reportFingerprint = report.fingerprint;
  const disclosureTitle = document.createElement('summary'); disclosureTitle.textContent = text('reportDetails'); disclosure.append(disclosureTitle);
  if (view.summary) {
    addText(disclosure, 'h3', text('summary'));
    addText(disclosure, 'p', view.summary, 'report-content');
  }
  const provenance = [
    [text('source'), view.source], [text('platform'), view.platform], [text('location'), view.location],
    [text('verificationLead'), statusLabel], [text('brand'), report.brand],
    [text('cause'), report.cause], [text('road'), report.road_type], [text('province'), report.province],
    [text('author'), report.author], [text('published'), report.published_at]
  ];
  const facts = document.createElement('dl'); facts.className = 'report-facts';
  for (const [label, value] of provenance) if (value) { addText(facts, 'dt', label); addText(facts, 'dd', value); }
  disclosure.append(facts);
  if (Number.isFinite(report.ranking_score)) {
    const score = addText(disclosure, 'p', `${text('rankingScore')}: ${Math.round(report.ranking_score * 100)}%`, 'report-score');
    score.title = text('rankingHint');
  }
  const counts = report.labels?.community_votes;
  if (counts) addText(disclosure, 'p', `${text('communityVotes')}: ${counts.relevant} ${text('relevant')} · ${counts.not_relevant} ${text('notRelevant')}`, 'report-meta community-vote-counts');
  if (report.source_url) {
    try {
      const source = new URL(report.source_url);
      if (source.protocol === 'https:') {
        const link = document.createElement('a'); link.href = source.href; link.target = '_blank';
        link.rel = 'noopener noreferrer'; link.textContent = text('openSource'); link.className = 'report-source';
        disclosure.append(link);
      }
    } catch {}
  }
  body.append(disclosure);
  body.append(createVoteControls(report));
  card.append(body);
  return card;
}

function positionReportSourceLinks(root = document) {
  const phoneLayout = window.matchMedia('(max-width: 420px)').matches;
  root.querySelectorAll('.report-card').forEach((card) => {
    const link = card.querySelector('.report-source');
    const body = card.querySelector('.report-card-body');
    const details = card.querySelector('.report-details');
    if (!link || !body || !details) return;
    const destination = phoneLayout ? body : details;
    const before = phoneLayout ? details : null;
    if (link.parentElement === destination && (before ? link.nextElementSibling === before : true)) return;
    const hadFocus = document.activeElement === link;
    destination.insertBefore(link, before);
    if (hadFocus) {
      if (destination === details) details.open = true;
      link.focus({ preventScroll: true });
    }
  });
}

window.matchMedia('(max-width: 420px)').addEventListener('change', () => positionReportSourceLinks());

function createVoteControls(report) {
  const controls = document.createElement('div'); controls.className = 'vote-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', `${text('rateReport')}: ${projectReportCard(report, state.language).title}`);
  for (const [value, label] of [['relevant', 'relevant'], ['not_relevant', 'notRelevant']]) {
    const button = document.createElement('button'); button.type = 'button';
    button.className = 'vote-icon-button';
    button.setAttribute('aria-label', text(label));
    button.setAttribute('aria-pressed', String(state.myVotes.get(report.fingerprint) === value));
    button.dataset.fingerprint = report.fingerprint;
    button.dataset.vote = value;
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('class', `vote-icon${value === 'not_relevant' ? ' vote-icon--down' : ''}`);
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    const thumb = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    thumb.setAttribute('d', 'M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.1L12.9 3.8a1.6 1.6 0 0 1 2.1-.7 2.4 2.4 0 0 1 1.2 2.78z');
    thumb.setAttribute('fill', 'none');
    thumb.setAttribute('stroke', 'currentColor');
    thumb.setAttribute('stroke-width', '2');
    thumb.setAttribute('stroke-linecap', 'round');
    thumb.setAttribute('stroke-linejoin', 'round');
    icon.append(thumb);
    button.append(icon);
    button.addEventListener('click', () => submitVoteAction(report, 'save', value, button));
    controls.append(button);
  }
  if (state.myVotes.has(report.fingerprint)) {
    addText(controls, 'span', `${text('myVote')}: ${text(state.myVotes.get(report.fingerprint) === 'relevant' ? 'relevant' : 'notRelevant')}`);
    const revoke = document.createElement('button'); revoke.type = 'button'; revoke.textContent = text('revokeVote');
    revoke.dataset.fingerprint = report.fingerprint;
    revoke.dataset.vote = 'revoke';
    revoke.addEventListener('click', () => submitVoteAction(report, 'undo', state.myVotes.get(report.fingerprint), revoke));
    controls.append(revoke);
  }
  return controls;
}

function currentFilters() {
  const params = new URLSearchParams({ page: String(state.page), page_size: String(state.pageSize), sort: state.sort });
  const query = $('#query').value.trim();
  if (query) params.set('q', query);
  document.querySelectorAll('[data-filter]').forEach((control) => { if (control.value) params.set(control.dataset.filter, control.value); });
  return params;
}

async function loadReports({ voteContext = null } = {}) {
  if (!state.user?.approved || reportAccessBlocked) return { kind: 'failure' };
  const requestId = ++reportRequestId;
  const list = $('#reports');
  if (!voteContext) list.replaceChildren();
  list.setAttribute('aria-busy', 'true');
  if (!voteContext) {
    addText(list, 'p', text('loading'));
    showAction('');
  }
  try {
    const result = await fetchJson(`/api/reports?${currentFilters()}`);
    if (requestId !== reportRequestId) return { kind: 'superseded' };
    if (!state.user?.approved || reportAccessBlocked) return { kind: 'superseded' };
    if (result.data.length) {
      list.replaceChildren(...result.data.map(reportCard));
      positionReportSourceLinks(list);
    }
    else {
      const empty = document.createElement('div'); empty.className = 'empty-state';
      addText(empty, 'p', text('noReports'));
      const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'quiet-button'; reset.textContent = text('resetFilters');
      reset.addEventListener('click', resetSearch);
      empty.append(reset); list.replaceChildren(empty);
    }
    $('#page-status').textContent = `${result.page} / ${Math.max(result.pages, 1)} · ${result.total} ${text('reports')}`;
    $('#previous').disabled = result.page <= 1;
    $('#next').disabled = result.page >= result.pages;
    delete list.dataset.rankingStale;
    const focusResult = voteContext
      ? restoreVoteFocus({ fingerprint: voteContext.fingerprint, vote: voteContext.vote }, voteContext.position)
      : null;
    return { kind: 'success', focused: focusResult?.focused || null };
  } catch (error) {
    if ([401, 403].includes(error.status)) {
      return handleReportAccessDenied({ committed: Boolean(voteContext), action: voteContext?.action || null });
    }
    if (requestId !== reportRequestId) return { kind: 'superseded' };
    if (!state.user?.approved || reportAccessBlocked) return { kind: 'superseded' };
    if (voteContext) return { kind: 'failure' };
    list.replaceChildren();
    const errorState = document.createElement('div'); errorState.className = 'empty-state';
    addText(errorState, 'p', text('loadError'));
    const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = text('retry');
    retry.addEventListener('click', async () => {
      retry.disabled = true;
      const refreshed = await loadReports();
      if (refreshed?.kind === 'success') {
        if (currentView === 'reports') {
          const heading = $('#heading');
          heading.tabIndex = -1;
          heading.focus();
        }
      } else if (refreshed?.kind === 'failure' && currentView === 'reports') {
        $('#reports .empty-state button')?.focus();
      }
    });
    errorState.append(retry); list.append(errorState);
    $('#page-status').textContent = '';
    return { kind: 'failure' };
  } finally {
    if (requestId === reportRequestId) list.setAttribute('aria-busy', 'false');
  }
}

function resetSearch() {
  const resetTrigger = document.activeElement;
  $('#query').value = '';
  document.querySelectorAll('[data-filter]').forEach((control) => { control.value = ''; });
  $('#sort').value = 'date'; state.sort = 'date'; state.page = 1;
  loadReports().then((result) => {
    if (result?.kind === 'success' && currentView === 'reports' && document.activeElement === document.body) {
      const heading = $('#heading');
      heading.tabIndex = -1;
      heading.focus();
    }
  });
}

async function initialize() {
  updateLanguageButton();
  await refreshAuth();
  await loadDatabaseData();
  setInterval(async () => {
    if (document.hidden || visibilityAuthUnconfirmed) return;
    const wasApproved = Boolean(state.user?.approved);
    await refreshAuth();
    if (wasApproved !== Boolean(state.user?.approved)) {
      if (state.user?.approved) await loadDatabaseData();
      else renderDatabaseAccess();
    }
  }, 30_000);
}

$('#language-toggle').addEventListener('click', () => {
  state.language = state.language === 'en' ? 'zh' : 'en';
  localStorage.setItem('adas-language', state.language);
  updateLanguageButton();
  renderAuth();
  renderDatabaseAccess();
  renderSummary();
  loadReports();
  if (currentView === 'account' && state.user) loadMyFeedback();
  if (currentView === 'admin' && canManageUsers(state.user)) loadAdminUsers({ localizedRerender: true });
  if (currentView === 'feedback' && canManageUsers(state.user)) loadAdminFeedback();
  if (currentView === 'media-review' && canManageUsers(state.user)) loadMediaReview();
});
$('#account-entry').addEventListener('click', openAccount);
document.querySelectorAll('[data-view-target]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.viewTarget, true)));
$('#media-review-filter').addEventListener('change', () => loadMediaReview());
$('#media-review-refresh').addEventListener('click', () => loadMediaReview({ focusStatus: true }));
$('#auth-mode').addEventListener('click', () => {
  state.authMode = state.authMode === 'login' ? 'register' : 'login';
  $('#account-message').dataset.errorKey = '';
  $('#account-message').textContent = '';
  renderAuth();
  $(`#auth-form [name="${state.authMode === 'register' ? 'invite_code' : 'username'}"]`).focus();
});
$('#auth-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formElement = event.currentTarget;
  if (formElement.dataset.submitting === 'true') return;
  formElement.dataset.submitting = 'true';
  const submitButton = formElement.querySelector('[type="submit"]');
  const modeButton = $('#auth-mode');
  submitButton.disabled = true;
  modeButton.disabled = true;
  const form = new FormData(formElement);
  const payload = { username: form.get('username'), password: form.get('password') };
  const route = state.authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
  if (state.authMode === 'register') payload.invite_code = form.get('invite_code');
  try {
    const result = await authRequest(route, 'POST', payload);
    state.user = result.user; state.csrf = result.csrf; state.authMode = 'login'; formElement.reset();
    announceAuthChange();
    reportAccessBlocked = false; accessCheckMessage = ''; accessActionMessage = '';
    $('#account-message').dataset.errorKey = '';
    $('#account-message').textContent = '';
    renderAuth();
    if (currentView === 'account') $('#account-heading').focus();
    if (state.user.approved) await loadDatabaseData();
  } catch (error) {
    const messageKey = state.authMode === 'register'
      ? ({ invalid_invitation_code: 'invalidInviteCode', username_taken: 'usernameTaken',
        invalid_username: 'invalidUsername', invalid_password: 'invalidPassword', reserved_username: 'reservedUsername' }[error.code])
      : null;
    if (messageKey) {
      $('#account-message').dataset.errorKey = messageKey;
      $('#account-message').textContent = text(messageKey);
    } else showAccountMessage(error.message);
  }
  finally {
    delete formElement.dataset.submitting;
    submitButton.disabled = false;
    modeButton.disabled = false;
    if (currentView === 'account') {
      if (formElement.getClientRects().length) submitButton.focus();
    }
  }
});
$('#logout').addEventListener('click', async () => {
  const button = $('#logout');
  if (button.disabled) return;
  button.disabled = true;
  try { await authRequest('/api/auth/logout', 'POST', {}); state.user = null; state.csrf = null; announceAuthChange(); renderAuth(); }
  catch (error) { showAccountMessage(error.message); }
  finally {
    button.disabled = false;
    if (currentView === 'account') {
      if (button.getClientRects().length) button.focus();
      else $('#account-heading').focus();
    }
  }
});
$('#create-invite').addEventListener('click', async () => {
  const button = $('#create-invite');
  if (button.disabled) return;
  button.disabled = true;
  $('#invite-result').textContent = '';
  try { const result = await authRequest('/api/auth/invitations', 'POST', {}); $('#invite-result').textContent = `${text('inviteCreated')} ${result.code} · ${result.expires_at.slice(0, 10)}`; }
  catch (error) { showAccountMessage(error.message); }
  finally {
    button.disabled = false;
    if (currentView === 'account' && button.getClientRects().length) button.focus();
  }
});
$('#password-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formElement = event.currentTarget;
  if (formElement.dataset.submitting === 'true') return;
  formElement.dataset.submitting = 'true';
  const submitButton = formElement.querySelector('[type="submit"]');
  submitButton.disabled = true;
  const form = new FormData(formElement);
  try {
    await authRequest('/api/auth/password', 'POST', { current_password: form.get('current_password'), new_password: form.get('new_password') });
    formElement.reset();
    showAccountMessage(text('passwordChanged'));
  } catch (error) { showAccountMessage(passwordChangeErrorMessage(error)); }
  finally {
    delete formElement.dataset.submitting;
    submitButton.disabled = false;
    if (currentView === 'account' && formElement.getClientRects().length) submitButton.focus();
  }
});
$('#feedback-refresh').addEventListener('click', () => loadMyFeedback({ focusStatus: true }));
$('#feedback-filter-status').addEventListener('change', () => loadAdminFeedback({ reset: true }));
$('#feedback-filter-type').addEventListener('change', () => loadAdminFeedback({ reset: true }));
// Keep the pagination control before the queue so it remains reachable without
// traversing every request card. This stays in app.js to avoid changing the shell.
$('#feedback-admin-status').after($('#feedback-load-more'));
$('#feedback-load-more').addEventListener('click', () => {
  adminFeedbackOffset += feedbackPageSize;
  loadAdminFeedback({ focusStatus: true });
});
$('#feedback-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formElement = event.currentTarget;
  if (formElement.dataset.submitting === 'true') return;
  for (const name of ['title', 'description', 'context']) {
    const control = formElement.elements.namedItem(name);
    if (!control) continue;
    control.value = control.value.trim();
    clearValidationError(control);
    const valueLength = control.value.length;
    let message = '';
    if (control.required && valueLength === 0) message = text('validationRequired');
    else if (control.minLength >= 0 && valueLength < control.minLength) message = text('validationTooShort').replace('{minimum}', control.minLength);
    else if (control.maxLength >= 0 && valueLength > control.maxLength) message = text('validationTooLong').replace('{maximum}', control.maxLength);
    if (message) {
      showValidationError(control, message);
      // The browser does not apply minlength/maxlength validity to values set
      // programmatically. Keep this client-side normalization error explicit
      // in the DOM as well as in Constraint Validation so it is announced and
      // remains visible after the submit event returns.
      const error = validationErrorState.get(control)?.error;
      if (error) {
        error.textContent = message;
        error.hidden = false;
        control.setAttribute('aria-invalid', 'true');
        control.setAttribute('aria-describedby', [
          ...new Set([...(control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean), error.id])
        ].join(' '));
      }
      control.focus();
      return;
    }
  }
  if (!formElement.reportValidity()) return;
  formElement.dataset.submitting = 'true';
  const submitButton = $('#feedback-submit'); const message = $('#feedback-message');
  const submissionFocusTarget = document.activeElement;
  const submittingIdentityGeneration = authIdentityGeneration;
  const submittingUserId = state.user?.id;
  const submittedDraft = Object.fromEntries([...formElement.elements].filter((control) => control.name).map((control) => [control.name, control.value]));
  submitButton.disabled = true; message.classList.remove('success'); message.textContent = '';
  const form = new FormData(formElement);
  const payload = {
    type: form.get('type'), title: form.get('title'), description: form.get('description'), context: form.get('context')
  };
  const { attemptId, key: idempotencyKey } = feedbackAttemptKey(submittingUserId, payload);
  try {
    const result = await authRequest('/api/feedback', 'POST', payload, { 'Idempotency-Key': idempotencyKey });
    if (feedbackSubmissionAttempts.get(attemptId) === idempotencyKey) feedbackSubmissionAttempts.delete(attemptId);
    // Clear only the exact values this request submitted. The account may have
    // signed out and back in, or edited a newer draft while this POST was pending.
    const currentDraftIsConfirmed = state.user?.id === submittingUserId
      && !visibilityAuthUnconfirmed
      && memberFeedbackDraftIdentity === String(submittingUserId);
    const currentDraft = currentDraftIsConfirmed
      ? Object.fromEntries([...formElement.elements].filter((control) => control.name).map((control) => [control.name, control.value]))
      : null;
    const shouldResetCurrentForm = clearSubmittedFeedbackDraft(memberFeedbackDrafts, submittingUserId, submittedDraft, {
      currentAccountId: state.user?.id,
      currentDraft,
      currentFormConfirmed: currentDraftIsConfirmed
    });
    if (shouldResetCurrentForm) formElement.reset();
    if (state.user?.id !== submittingUserId) return;
    const requestId = result.data?.id;
    message.textContent = `${text('feedbackSubmitted')}${requestId ? `#${requestId}` : ''}`;
    message.classList.add('success');
    await loadMyFeedback();
  } catch (error) {
    if ([401, 403].includes(error.status)) await refreshAuth();
    if (state.user?.id !== submittingUserId) return;
    message.classList.remove('success');
    message.textContent = error.status == null
      ? text('feedbackNetworkError')
      : (error.status === 429 ? text('feedbackSubmissionLimit') : (error.message || text('feedbackError')));
  } finally {
    delete formElement.dataset.submitting;
    submitButton.disabled = false;
    const focusWasLostToDisabledButton = submissionFocusTarget === submitButton && document.activeElement === document.body;
    const focusStayedOnSubmissionTarget = document.activeElement === submissionFocusTarget;
    if (submittingIdentityGeneration === authIdentityGeneration && currentView === 'account' && formElement.getClientRects().length && (focusWasLostToDisabledButton || focusStayedOnSubmissionTarget)) submitButton.focus();
  }
});
$('#feedback-form').addEventListener('input', (event) => {
  if (memberFeedbackDraftIdentity === null || !event.target.name) return;
  memberFeedbackDrafts.set(memberFeedbackDraftIdentity, Object.fromEntries(
    [...event.currentTarget.elements].filter((control) => control.name).map((control) => [control.name, control.value])
  ));
});
$('#feedback-form').addEventListener('change', (event) => {
  if (memberFeedbackDraftIdentity === null || !event.target.name) return;
  memberFeedbackDrafts.set(memberFeedbackDraftIdentity, Object.fromEntries(
    [...event.currentTarget.elements].filter((control) => control.name).map((control) => [control.name, control.value])
  ));
});
$('#sort').addEventListener('change', (event) => { state.sort = event.target.value; state.page = 1; loadReports(); });
$('#query').addEventListener('input', () => { clearTimeout(searchTimer); state.page = 1; searchTimer = setTimeout(loadReports, 250); });
document.querySelectorAll('[data-filter]').forEach((control) => control.addEventListener('change', () => { state.page = 1; loadReports(); }));
$('#reset-filters').addEventListener('click', resetSearch);
$('#previous').addEventListener('click', () => { state.page = Math.max(1, state.page - 1); loadReports(); });
$('#next').addEventListener('click', () => { state.page += 1; loadReports(); });

initialize();
