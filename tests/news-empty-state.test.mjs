import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const script = readFileSync(new URL('../site/js/supabase-feed.js', import.meta.url), 'utf8');

async function renderWith(response) {
  const elements = {
    'latest-publications': { innerHTML: '', setAttribute() {} },
    'hero-contact': { innerHTML: 'Have a question or an idea? <a href="mailto:mike@kamunityconsulting.com">Email Mike.</a>' },
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

  assert.match(elements['latest-publications'].innerHTML, /No publications available right now/);
  assert.doesNotMatch(elements['latest-publications'].innerHTML, /loading/);
  assert.match(elements['hero-contact'].innerHTML, /Have a question or an idea\?/);
  assert.match(elements['hero-contact'].innerHTML, /mailto:mike@kamunityconsulting\.com/);
});

test('a failed news request is not described as still loading', async () => {
  const elements = await renderWith({ ok: false, status: 503 });
  assert.match(elements['latest-publications'].innerHTML, /temporarily unavailable/);
  assert.match(elements['hero-contact'].innerHTML, /mailto:mike@kamunityconsulting\.com/);
});
