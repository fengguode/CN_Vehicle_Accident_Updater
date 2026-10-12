// Per-tab draft state. Callers supply the immutable account ID; no identity
// value is persisted outside this in-memory store.
export function createFeedbackDraftStore() {
  const drafts = new Map();
  return {
    get(accountId) {
      return accountId == null ? undefined : drafts.get(String(accountId));
    },
    set(accountId, draft) {
      if (accountId == null) return;
      drafts.set(String(accountId), { ...draft });
    },
    delete(accountId) {
      if (accountId != null) drafts.delete(String(accountId));
    }
  };
}

export function feedbackDraftsEqual(left, right) {
  if (!left || !right) return false;
  return ['type', 'title', 'description', 'context'].every((field) => left[field] === right[field]);
}

export function clearSubmittedFeedbackDraft(store, accountId, submitted, { currentAccountId, currentDraft, currentFormConfirmed = false } = {}) {
  const isCurrentAccount = accountId != null && currentAccountId != null && String(accountId) === String(currentAccountId);
  if (isCurrentAccount && currentFormConfirmed) {
    if (feedbackDraftsEqual(currentDraft, submitted)) {
      store.delete(accountId);
      return true;
    }
    store.set(accountId, currentDraft);
    return false;
  }
  if (feedbackDraftsEqual(store.get(accountId), submitted)) store.delete(accountId);
  return false;
}
