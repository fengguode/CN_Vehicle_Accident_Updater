import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreVoteInteraction } from '../apps/web/viewport.js';

function makeWindow() {
  const windowObject = {
    scrollX: 12,
    scrollY: 1840,
    scrollCalls: [],
    document: { activeElement: null },
    scrollTo(x, y) { this.scrollCalls.push([x, y]); }
  };
  const body = { tagName: 'BODY' };
  windowObject.document.body = body;
  windowObject.document.activeElement = body;
  return { windowObject, body };
}

function makeFocusTarget(windowObject, properties = {}) {
  return {
    ...properties,
    focus(options) {
      this.focusOptions = options;
      windowObject.document.activeElement = this;
    }
  };
}

function makeDisclosure(fingerprint, buttons, open = false) {
  const disclosure = {
    dataset: { reportFingerprint: fingerprint },
    open,
    querySelectorAll() { return buttons; }
  };
  buttons.forEach((button) => { button.closest = (selector) => selector === 'details' ? disclosure : null; });
  return disclosure;
}

function makeCard(fingerprint, buttons, disclosure = null) {
  buttons.forEach((button) => { button.closest ||= (selector) => selector === 'details' ? disclosure : null; });
  return {
    dataset: { reportFingerprint: fingerprint },
    querySelectorAll(selector) {
      assert.equal(selector, 'button[data-fingerprint][data-vote]');
      return buttons;
    },
    querySelector(selector) {
      assert.equal(selector, 'details');
      return disclosure;
    }
  };
}

function makeReportList(cards) {
  return { querySelectorAll(selector) {
    assert.equal(selector, 'article[data-report-fingerprint]');
    return cards;
  } };
}

test('vote focus restoration targets the matching card control without opening unrelated details', () => {
  for (const vote of ['relevant', 'not_relevant']) {
    const { windowObject, body } = makeWindow();
    const otherValue = vote === 'relevant' ? 'not_relevant' : 'relevant';
    const otherVote = makeFocusTarget(windowObject, {
      dataset: { fingerprint: 'selected', vote: otherValue }, disabled: false
    });
    const matchingVote = makeFocusTarget(windowObject, {
      dataset: { fingerprint: 'selected', vote }, disabled: false
    });
    const unrelated = makeCard('other', []);
    const selected = makeCard('selected', [otherVote, matchingVote]);
    const resultsHeading = makeFocusTarget(windowObject, { tabIndex: 0 });

    const result = restoreVoteInteraction(
      windowObject,
      makeReportList([unrelated, selected]),
      resultsHeading,
      { x: 12, y: 1840 },
      { fingerprint: 'selected', vote }
    );

    assert.deepEqual(result, { focused: 'vote' }, vote);
    assert.equal(matchingVote.closest('details'), null, 'external vote controls do not need the details disclosure opened');
    assert.equal(windowObject.document.activeElement, matchingVote);
    assert.deepEqual(matchingVote.focusOptions, { preventScroll: true });
    assert.equal(otherVote.focusOptions, undefined);
    assert.equal(resultsHeading.focusOptions, undefined);
    assert.notEqual(windowObject.document.activeElement, body);
    assert.deepEqual(windowObject.scrollCalls, [[12, 1840]]);
  }
});

test('external vote controls restore focus for save, change, undo, failed write, and failed refresh targets', () => {
  for (const vote of ['relevant', 'not_relevant', 'revoke']) {
    const { windowObject } = makeWindow();
    const control = makeFocusTarget(windowObject, { dataset: { fingerprint: 'selected', vote }, disabled: false });
    control.closest = () => null;
    const card = makeCard('selected', [control]);
    const result = restoreVoteInteraction(windowObject, makeReportList([card]), null, { x: 12, y: 34 }, { fingerprint: 'selected', vote });
    assert.deepEqual(result, { focused: 'vote' }, vote);
    assert.equal(windowObject.document.activeElement, control, vote);
    assert.deepEqual(windowObject.scrollCalls, [[12, 34]], vote);
  }
});

test('missing or disabled vote target focuses the visible Results heading instead of body', () => {
  for (const scenario of ['missing report', 'disabled vote']) {
    const { windowObject, body } = makeWindow();
    const disabledButton = makeFocusTarget(windowObject, {
      dataset: { fingerprint: 'selected', vote: 'relevant' }, disabled: true
    });
    const disclosures = scenario === 'missing report'
      ? []
      : [makeDisclosure('selected', [disabledButton], false)];
    const heading = makeFocusTarget(windowObject, { tabIndex: 0, visible: true });

    const result = restoreVoteInteraction(
      windowObject,
      makeReportList(disclosures),
      heading,
      { x: 4, y: 730 },
      { fingerprint: 'selected', vote: 'relevant' }
    );

    assert.deepEqual(result, { focused: 'heading' }, scenario);
    assert.equal(heading.tabIndex, -1, 'fallback heading should be programmatically focusable');
    assert.equal(windowObject.document.activeElement, heading);
    assert.notEqual(windowObject.document.activeElement, body);
    assert.equal(heading.focusOptions, undefined, 'fallback focus should allow the browser to reveal the heading');
    assert.deepEqual(windowObject.scrollCalls, [], 'fallback must not restore the old viewport over the visible heading');
    assert.equal(disabledButton.focusOptions, undefined);
  }
});
