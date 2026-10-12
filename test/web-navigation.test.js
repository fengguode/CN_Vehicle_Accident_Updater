import test from 'node:test';
import assert from 'node:assert/strict';
import { canManageUsers, resolveWorkspaceView } from '../apps/web/navigation.js';

test('only an approved administrator can enter user management', () => {
  assert.equal(canManageUsers({ role: 'admin', approved: true }), true);
  assert.equal(canManageUsers({ role: 'admin', approved: false }), false);
  assert.equal(canManageUsers({ role: 'member', approved: true }), false);
  assert.equal(canManageUsers(null), false);
  assert.equal(resolveWorkspaceView('admin', { role: 'member', approved: true }), 'account');
  assert.equal(resolveWorkspaceView('admin', { role: 'admin', approved: false }), 'account');
  assert.equal(resolveWorkspaceView('admin', { role: 'admin', approved: true }), 'admin');
  assert.equal(resolveWorkspaceView('feedback', { role: 'member', approved: true }), 'account');
  assert.equal(resolveWorkspaceView('feedback', { role: 'admin', approved: false }), 'account');
  assert.equal(resolveWorkspaceView('feedback', { role: 'admin', approved: true }), 'feedback');
  assert.equal(resolveWorkspaceView('media-review', { role: 'member', approved: true }), 'account');
  assert.equal(resolveWorkspaceView('media-review', { role: 'admin', approved: false }), 'account');
  assert.equal(resolveWorkspaceView('media-review', { role: 'admin', approved: true }), 'media-review');
});

test('workspace navigation falls back safely for unknown views', () => {
  assert.equal(resolveWorkspaceView('unknown', { role: 'admin', approved: true }), 'reports');
  assert.equal(resolveWorkspaceView('account', null), 'account');
});
