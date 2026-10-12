export function captureViewport(windowObject = window) {
  return { x: windowObject.scrollX, y: windowObject.scrollY };
}

export function restoreVoteInteraction(windowObject, reportList, resultsHeading, position, target) {
  const card = [...reportList.querySelectorAll('article[data-report-fingerprint]')]
    .find((candidate) => candidate.dataset.reportFingerprint === target?.fingerprint);
  const button = card && [...card.querySelectorAll('button[data-fingerprint][data-vote]')]
    .find((candidate) => candidate.dataset.fingerprint === target.fingerprint &&
      candidate.dataset.vote === target.vote && !candidate.disabled);

  if (card && button) {
    const disclosure = button.closest('details');
    if (disclosure) disclosure.open = true;
    button.focus({ preventScroll: true });
    windowObject.scrollTo(position.x, position.y);
    return { focused: 'vote' };
  }

  if (resultsHeading) {
    resultsHeading.tabIndex = -1;
    resultsHeading.focus();
  }
  return { focused: 'heading' };
}
