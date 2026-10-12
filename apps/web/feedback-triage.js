const FIELD_NAMES = Object.freeze(['status', 'priority', 'public_update', 'internal_notes', 'backlog_ids', 'duplicate_of']);

export function feedbackTriageValues(request) {
  return {
    status: ['Submitted', 'Under review', 'Added to backlog', 'In progress', 'Complete', 'Blocked', 'Not planned', 'Duplicate'].includes(request.status)
      ? request.status : 'Under review',
    priority: request.priority || 'normal',
    // This is a new update to publish, not the request's existing latest update.
    public_update: '',
    internal_notes: request.internal_notes || '',
    backlog_ids: Array.isArray(request.backlog_ids) ? request.backlog_ids.join(', ') : '',
    duplicate_of: request.duplicate_of || ''
  };
}

export function changedFeedbackTriageFields(baseline, values) {
  const changed = {};
  for (const name of FIELD_NAMES) {
    const rawValue = String(values[name] ?? '');
    const value = name === 'backlog_ids'
      ? rawValue.split(',').map((id) => id.trim()).filter(Boolean).join(', ')
      : ['internal_notes', 'duplicate_of', 'public_update'].includes(name) ? rawValue.trim() : rawValue;
    const baselineValue = name === 'backlog_ids'
      ? String(baseline[name] ?? '').split(',').map((id) => id.trim()).filter(Boolean).join(', ')
      : ['internal_notes', 'duplicate_of', 'public_update'].includes(name) ? String(baseline[name] ?? '').trim() : String(baseline[name] ?? '');
    if (name === 'public_update') {
      if (value.trim()) changed[name] = value.trim();
    } else if (value !== baselineValue) {
      changed[name] = name === 'duplicate_of' ? value.trim() || null : value;
    }
  }
  if (Object.hasOwn(changed, 'backlog_ids')) {
    changed.backlog_ids = String(changed.backlog_ids).split(',').map((id) => id.trim()).filter(Boolean);
  }
  return changed;
}

export function rebaseFeedbackTriageDraft(baseline, latestRequest, values) {
  const edits = changedFeedbackTriageFields(baseline, values);
  if (edits.duplicate_of === null) edits.duplicate_of = '';
  return { ...feedbackTriageValues(latestRequest), ...edits };
}
