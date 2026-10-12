import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../apps/web/styles.css', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../apps/web/index.html', import.meta.url), 'utf8');

test('narrow Account heading stays on one line and pending status wraps below it', () => {
  const mediaStart = css.indexOf('@media (max-width: 420px)');
  assert.notEqual(mediaStart, -1, 'phone layout breakpoint exists');
  const nextMedia = css.indexOf('@media ', mediaStart + 1);
  const phoneRules = css.slice(mediaStart, nextMedia === -1 ? undefined : nextMedia);

  assert.match(phoneRules, /#account-view \.view-heading\s*\{[^}]*flex-direction:\s*column/);
  assert.match(phoneRules, /#account-view \.view-heading h1\s*\{[^}]*max-width:\s*100%[^}]*white-space:\s*nowrap/);
  assert.match(phoneRules, /#account-view #auth-status\s*\{[^}]*min-width:\s*0[^}]*max-width:\s*100%[^}]*text-align:\s*left[^}]*overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(phoneRules, /#account-view[^}]*\{[^}]*overflow:\s*(?:hidden|clip)/);
  assert.match(html, /<span id="auth-status" aria-live="polite"><\/span>/, 'signed-in and pending status remains in the view heading');
});
