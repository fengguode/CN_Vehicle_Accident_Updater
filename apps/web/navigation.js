export function canManageUsers(user) {
  return Boolean(user && user.role === 'admin' && user.approved);
}

export function resolveWorkspaceView(requestedView, user) {
  if (['admin', 'feedback', 'media-review'].includes(requestedView) && !canManageUsers(user)) return 'account';
  return ['reports', 'account', 'admin', 'feedback', 'media-review'].includes(requestedView) ? requestedView : 'reports';
}
