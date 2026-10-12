import test from 'node:test';
import assert from 'node:assert/strict';
import { captureViewport, restoreVoteInteraction } from '../apps/web/viewport.js';

test('vote refresh restores the viewport and focus to the corresponding control', () => {
  const focused = [];
  const body = { tagName: 'BODY' };
  let activeElement = body;
  const buttons = [
    { dataset: { fingerprint: 'other', vote: 'relevant' }, focus: (options) => focused.push(options) },
    { dataset: { fingerprint: 'selected', vote: 'not_relevant' }, disabled: false, focus(options) { focused.push(options); activeElement = this; } }
  ];
  buttons[0].closest = () => null;
  buttons[1].closest = () => null;
  const otherCard = { dataset: { reportFingerprint: 'other' }, querySelectorAll: () => [buttons[0]] };
  const selectedCard = { dataset: { reportFingerprint: 'selected' }, querySelectorAll: () => [buttons[1]] };
  const scrollCalls = [];
  const windowObject = {
    scrollX: 0,
    scrollY: 1840,
    scrollTo: (...coordinates) => scrollCalls.push(coordinates)
  };
  const reportList = { querySelectorAll: () => [otherCard, selectedCard] };
  const heading = { tabIndex: 0, focus: () => { activeElement = heading; } };
  const position = captureViewport(windowObject);

  const result = restoreVoteInteraction(windowObject, reportList, heading, position, { fingerprint: 'selected', vote: 'not_relevant' });

  assert.deepEqual(position, { x: 0, y: 1840 });
  assert.deepEqual(result, { focused: 'vote' });
  assert.equal(selectedCard.dataset.reportFingerprint, 'selected');
  assert.equal(otherCard.dataset.reportFingerprint, 'other');
  assert.equal(activeElement, buttons[1]);
  assert.notEqual(activeElement, body);
  assert.deepEqual(focused, [{ preventScroll: true }]);
  assert.deepEqual(scrollCalls, [[0, 1840]]);
});
