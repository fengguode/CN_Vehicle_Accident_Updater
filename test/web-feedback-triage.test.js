import test from 'node:test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { changedFeedbackTriageFields, feedbackTriageValues, rebaseFeedbackTriageDraft } from '../apps/web/feedback-triage.js';

const appSource = fs.readFileSync(new URL('../apps/web/app.js', import.meta.url), 'utf8');

test('triage conflict rebase preserves only fields edited since the stale baseline', () => {
  const stale = {
    status: 'Submitted', priority: 'normal', public_update: '', internal_notes: 'Before',
    backlog_ids: [], duplicate_of: null
  };
  const baseline = feedbackTriageValues(stale);
  const local = { ...baseline, internal_notes: 'Edited in tab B' };
  const latest = {
    ...stale, status: 'Under review', priority: 'high', public_update: 'Editor A update.',
    internal_notes: 'Edited in tab A', backlog_ids: ['FEEDBACK-02'], duplicate_of: null, triage_version: 2
  };

  const rebased = rebaseFeedbackTriageDraft(baseline, latest, local);
  assert.equal(rebased.status, 'Under review');
  assert.equal(rebased.priority, 'high');
  assert.equal(rebased.public_update, '', 'a blank new-update field does not replay the previous public update');
  assert.equal(rebased.internal_notes, 'Edited in tab B');
  assert.equal(rebased.backlog_ids, 'FEEDBACK-02');
  assert.deepEqual(changedFeedbackTriageFields(feedbackTriageValues(latest), rebased), { internal_notes: 'Edited in tab B' });
});

test('same-field conflict keeps the local edit visible but requires a new explicit save', () => {
  const baseline = feedbackTriageValues({ status: 'Submitted', priority: 'normal' });
  const local = { ...baseline, priority: 'low' };
  const latest = { status: 'Under review', priority: 'high', internal_notes: 'New note', backlog_ids: [], duplicate_of: null };
  const rebased = rebaseFeedbackTriageDraft(baseline, latest, local);

  assert.equal(rebased.priority, 'low', 'the local edit stays visible');
  assert.deepEqual(changedFeedbackTriageFields(feedbackTriageValues(latest), rebased), { priority: 'low' }, 'only the deliberate same-field edit is sent after rebase');
});

test('legacy status fallback does not send stale status when another field changed', () => {
  const baseline = feedbackTriageValues({ status: 'Needs information', priority: null, internal_notes: '' });
  assert.equal(baseline.status, 'Under review');
  assert.deepEqual(changedFeedbackTriageFields(baseline, { ...baseline, internal_notes: 'Clarification note' }), { internal_notes: 'Clarification note' });
});

test('whitespace-only note and backlog edits normalize to no changes', () => {
  const baseline = feedbackTriageValues({
    status: 'Under review', priority: 'normal', internal_notes: 'Keep this note',
    backlog_ids: ['FEEDBACK-02'], duplicate_of: null
  });
  assert.deepEqual(changedFeedbackTriageFields(baseline, {
    ...baseline, internal_notes: '  Keep this note  ', backlog_ids: ' FEEDBACK-02  '
  }), {});
});

test('triage PATCH server errors use localized messages and preserve unknown errors', () => {
  const mappingMatch = appSource.match(/const feedbackTriageErrorKeys = (\{[\s\S]*?\n\});/);
  assert.ok(mappingMatch, 'app.js declares the server-message localization map');
  const errorKeys = new Function(`return (${mappingMatch[1]});`)();
  const functionStart = appSource.indexOf('function localizeFeedbackTriageError(error) {');
  assert.notEqual(functionStart, -1, 'app.js declares the feedback error localizer');
  const functionEnd = appSource.indexOf('\n}', functionStart) + 2;
  const localizerFactory = new Function('text', 'feedbackTriageErrorKeys', `${appSource.slice(functionStart, functionEnd)}; return localizeFeedbackTriageError;`);

  for (const locale of ['en', 'zh']) {
    const localize = localizerFactory((key) => `${locale}:${key}`, errorKeys);
    for (const [messageOrCode, key] of Object.entries(errorKeys)) {
      assert.equal(localize({ message: messageOrCode }), `${locale}:${key}`, `${messageOrCode} is localized in ${locale}`);
      assert.ok(appSource.includes(`${key}:`), `both locale tables define ${key}`);
    }
    assert.equal(localize({ code: 'feedback_conflict', message: 'This feedback request changed in another session.' }), `${locale}:triageErrorConflict`);
    assert.equal(localize({ code: 'same_origin_required', message: 'same_origin_required' }), `${locale}:triageErrorSameOrigin`);
    assert.equal(localize({ code: 'internal_error', message: 'internal_error' }), `${locale}:feedbackError`);
    assert.equal(localize({ message: 'Unexpected API failure' }), 'Unexpected API failure', 'unknown server text remains the fallback');
    assert.equal(localize({}), `${locale}:feedbackError`, 'missing server text falls back to localized generic feedback error');
  }
  assert.match(appSource, /result\.textContent = localizeFeedbackTriageError\(error\); result\.classList\.add\('feedback-error'\);/);
});
