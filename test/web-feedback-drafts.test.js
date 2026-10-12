import test from 'node:test';
import assert from 'node:assert/strict';
import { createFeedbackDraftStore, clearSubmittedFeedbackDraft } from '../apps/web/feedback-drafts.js';

test('feedback drafts are isolated by immutable account ID and remain in memory', () => {
  const drafts = createFeedbackDraftStore();
  const memberDraft = { type: 'Feature', title: 'New filter', description: 'Add a filter', context: 'Optional context' };
  drafts.set(12, memberDraft);

  assert.deepEqual(drafts.get('12'), memberDraft);
  assert.equal(drafts.get(13), undefined);
  assert.equal(drafts.get(null), undefined);

  // Role/approval is deliberately not part of the key.
  assert.deepEqual(drafts.get(12), memberDraft);
  drafts.delete(12);
  assert.equal(drafts.get(12), undefined);
});

test('stored values are copied so later form mutations do not change a draft', () => {
  const drafts = createFeedbackDraftStore();
  const value = { type: 'Issue', title: 'Original' };
  drafts.set('account-a', value);
  value.title = 'Changed';
  assert.equal(drafts.get('account-a').title, 'Original');
});

test('a successful submission snapshot does not match a newer draft', () => {
  const submitted = { type: 'Issue', title: 'Old title', description: 'Original description', context: '' };
  const unchanged = { ...submitted };
  const newerEdit = { ...submitted, title: 'Newer title' };

  const drafts = createFeedbackDraftStore();
  drafts.set(12, submitted);
  assert.equal(clearSubmittedFeedbackDraft(drafts, 12, submitted, {
    currentAccountId: 12, currentDraft: unchanged, currentFormConfirmed: true
  }), true);
  assert.equal(drafts.get(12), undefined);

  drafts.set(12, submitted);
  assert.equal(clearSubmittedFeedbackDraft(drafts, 12, submitted, {
    currentAccountId: 12, currentDraft: newerEdit, currentFormConfirmed: true
  }), false);
  assert.deepEqual(drafts.get(12), newerEdit, 'newer same-account edits replace the submitted snapshot');

  drafts.set(12, newerEdit);
  assert.equal(clearSubmittedFeedbackDraft(drafts, 12, submitted, {
    currentAccountId: 13, currentDraft: undefined, currentFormConfirmed: false
  }), false);
  assert.deepEqual(drafts.get(12), newerEdit, 'another account cannot clear the newer cached draft');

  drafts.set(12, submitted);
  assert.equal(clearSubmittedFeedbackDraft(drafts, 12, submitted, {
    currentAccountId: 13, currentDraft: undefined, currentFormConfirmed: false
  }), false);
  assert.equal(drafts.get(12), undefined, 'successful request clears only its unchanged submitter draft');
});
