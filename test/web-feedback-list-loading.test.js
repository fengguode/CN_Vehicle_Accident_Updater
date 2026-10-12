import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const appSource = fs.readFileSync(new URL('../apps/web/app.js', import.meta.url), 'utf8');

function sourceBetween(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  assert.notEqual(start, -1, `source contains ${startMarker}`);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(end, -1, `source contains ${endMarker} after ${startMarker}`);
  return appSource.slice(start, end);
}

test('successful login uses the auth-identity feedback-list load only once', () => {
  const renderAuth = sourceBetween('function renderAuth() {', '\nfunction showView(');
  const loginSubmit = sourceBetween("$('#auth-form').addEventListener('submit'", "$('#logout').addEventListener('click'");

  // renderAuth already loads the member list when login changes auth identity
  // while Account is open; the login handler must not trigger a second GET.
  assert.match(renderAuth, /if \(loggedIn && currentView === 'account'\) loadMyFeedback\(\);/);
  assert.doesNotMatch(loginSubmit, /loadMyFeedback\(/);

  // Keep list invalidation on identity transitions and intentional entry and
  // explicit refresh paths intact.
  assert.match(renderAuth, /myFeedbackRequestId \+= 1;\s*\$\('#my-feedback-list'\)\.replaceChildren\(\);/);
  const showView = sourceBetween('function showView(', '\nfunction renderDatabaseAccess(');
  assert.match(showView, /if \(name === 'account' && state\.user\) loadMyFeedback\(\);/);
  assert.match(appSource, /\$\('#feedback-refresh'\)\.addEventListener\('click', \(\) => loadMyFeedback\(\{ focusStatus: true \}\)\);/);
});
