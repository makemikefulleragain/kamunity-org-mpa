import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const script = readFileSync(new URL('../site/js/supabase-feed.js', import.meta.url), 'utf8');
const metadata = readFileSync(new URL('../site/js/publication-metadata.js', import.meta.url), 'utf8');

function element(tag) {
  return { tag, children: [], attributes: {}, textContent: '', innerHTML: '',
    appendChild(child) { this.children.push(child); },
    setAttribute(name, value) { this.attributes[name] = value; } };
}

async function render(items) {
  const list = element('ol');
  let requested;
  const context = {
    window: { location: { hostname: 'kamunity-org-mpa.netlify.app' } },
    document: { getElementById: id => id === 'latest-publications' ? list : null, createElement: element },
    fetch: async url => { requested = url; return { ok: true, json: async () => ({ schema_version: 'phoenix-mpa-news/v1', items }) }; },
    AbortSignal, Date,
  };
  runInNewContext(metadata, context);
  runInNewContext(script, context);
  await new Promise(resolve => setImmediate(resolve));
  return { list, requested };
}

test('one list displays six newest publications across classifications, ignoring priority and edit dates', async () => {
  const items = ['article', 'tool', 'opportunity', 'discussion', 'article', 'article', 'article'].map((type, i) => ({
    id: String(i), title: 'Publication ' + i, response_type: type,
    published_at: `2026-11-${String(10 + i).padStart(2, '0')}T23:00:00Z`,
    updated_at: i === 0 ? '2026-12-01T00:00:00Z' : null,
    editorial: { priority: i === 0 ? 100 : 0 },
  }));
  const { list, requested } = await render(items);
  assert.equal(new URL(requested).searchParams.get('limit'), '6');
  assert.deepEqual(list.children.map(card => card.children.find(child => child.tag === 'h3').textContent),
    ['Publication 6', 'Publication 5', 'Publication 4', 'Publication 3', 'Publication 2', 'Publication 1']);
  assert.deepEqual(list.children.map(card => card.children[0].textContent),
    ['Article', 'Article', 'Article', 'Discussion proposal', 'Opportunity notice', 'Tool proposal']);
  const card = list.children[0];
  assert.equal(card.tag, 'li');
  assert.equal(card.children.find(child => child.className === 'signal-card-date').children[0].dateTime, items[6].published_at);
  assert.match(card.children.find(child => child.className === 'signal-card-date').children[0].textContent, /17 Nov 2026/);
  assert.equal(list.attributes['aria-busy'], 'false');
  assert.match(list.children[3].children.find(child => child.className === 'news-card-status').textContent, /not yet available/);
  assert.equal(card.children.at(-1).children[0].href, '/news?story=6');
  assert.equal(card.children.find(child => child.className === 'signal-card-date').textContent, 'Published ');
  assert.equal(card.children.at(-1).children.some(child => /mailto:/.test(child.href || '')), false);
});

test('a short feed renders only available publications without duplicate filler', async () => {
  const { list } = await render([{ id: 'one', title: 'Only publication', response_type: 'article', published_at: '2026-11-19T00:00:00Z' }]);
  assert.equal(list.children.length, 1);
});
