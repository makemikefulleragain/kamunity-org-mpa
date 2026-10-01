import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const script = readFileSync(new URL('../site/js/supabase-feed.js', import.meta.url), 'utf8');

async function renderWith(response) {
  const elements = {
    'signals-col': { innerHTML: '' },
    'pulse-col': { innerHTML: '' },
    'signal-teaser': { textContent: '' },
  };

  runInNewContext(script, {
    window: { location: { hostname: 'kamunity-org-mpa.netlify.app' } },
    document: { getElementById: (id) => elements[id] || null },
    fetch: async () => response,
    AbortSignal,
    Date,
  });
  await new Promise((resolve) => setImmediate(resolve));
  return elements;
}

test('an empty approved news feed shows an honest empty state', async () => {
  const elements = await renderWith({
    ok: true,
    json: async () => ({ schema_version: 'phoenix-mpa-news/v1', items: [] }),
  });

  for (const id of ['signals-col', 'pulse-col']) {
    assert.match(elements[id].innerHTML, /No reviewed Phoenix stories available right now/);
    assert.doesNotMatch(elements[id].innerHTML, /loading/);
  }
  assert.match(elements['signal-teaser'].textContent, /will appear here when available/);
});

test('a failed news request is not described as still loading', async () => {
  const elements = await renderWith({ ok: false, status: 503 });
  assert.match(elements['signals-col'].innerHTML, /temporarily unavailable/);
  assert.match(elements['pulse-col'].innerHTML, /temporarily unavailable/);
});
