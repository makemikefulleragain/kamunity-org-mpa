import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync(new URL('../site/js/news.js', import.meta.url), 'utf8');
const metadata = readFileSync(new URL('../site/js/publication-metadata.js', import.meta.url), 'utf8');
const page = readFileSync(new URL('../site/news.html', import.meta.url), 'utf8');
const context = { window: {}, URL, Date };
runInNewContext(metadata, context);
const api = context.window.KamunityPublication;
test('four response types retain distinct labels and proposals never promise a working room or tool', () => {
  for (const type of ['article', 'opportunity', 'discussion', 'tool']) {
    const card = api.cardPresentation({ response_type: type, topics: ['ai-tech'], summary: 'Useful context.' });
    assert.equal(card.type, type);
    assert.deepEqual(Array.from(card.topics), ['ai-tech']);
    if (type === 'tool' || type === 'discussion') {
      assert.match(card.state, /not yet available/);
      assert.match(card.action, /proposal/);
      assert.doesNotMatch(card.action, /Open tool|Join room/);
    }
  }
});
test('canonical topic matching uses explicit topics and recovers old category/tag feeds', () => {
  assert.deepEqual(Array.from(api.publicationTopics({ topics: ['ai-tech', 'policy-funding'] })), ['ai-tech', 'policy-funding']);
  assert.deepEqual(Array.from(api.publicationTopics({ category: 'community-practice', tags: [] })), ['community-practice']);
  assert.ok(api.publicationTopics({ tags: ['digital-tools', 'governance', 'sector-policy'] }).includes('ai-tech'));
  assert.equal(api.publicationTopics({ tags: ['PRIVATE_SOURCE_CANARY'] }).includes('PRIVATE_SOURCE_CANARY'), false);
});
test('real filtering functions combine type and topic rather than the display-label substring', () => {
  const snippets = ['itemMatchesTab', 'getFilteredItems'].map(name => source.match(new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n    \\}'))[0]).join('\n');
  const fixtures = ['article', 'opportunity', 'discussion', 'tool'].map((type, i) => ({ response_type: type, topics: i % 2 ? ['community-practice'] : ['ai-tech'], published_at: '2026-10-20T01:00:00Z' }));
  const values = { ...context, allItems: fixtures, activeTab: 'latest', filterType: { value: 'tool' }, filterCat: { value: '' }, filterSort: { value: 'newest' }, TAB_TAGS: {} };
  assert.equal(runInNewContext(snippets + ';getFilteredItems()', values)[0].response_type, 'tool');
  values.filterType.value = ''; values.filterCat.value = 'ai-tech';
  assert.equal(runInNewContext(snippets + ';getFilteredItems()', values).length, 2);
});
test('opportunities expire at the end of the stated Perth closing date and unconfirmed offers stay potential', () => {
  assert.match(api.publicationState({ response_type: 'opportunity' }), /Potential/);
  assert.match(api.publicationState({ response_type: 'opportunity', availability: 'open', deadline: '2026-10-20' }, new Date('2026-10-20T15:59:59Z')), /Open/);
  assert.equal(api.publicationState({ response_type: 'opportunity', availability: 'open', deadline: '2026-10-20' }, new Date('2026-10-20T16:00:00Z')), 'Closed');
});
test('public controls and proposal discovery links use the same vocabulary', () => {
  assert.ok(page.indexOf('/js/publication-metadata.js') < page.indexOf('/js/news.js'));
  assert.match(page, /value="article"/); assert.match(page, /value="tool"/);
  assert.doesNotMatch(page, /value="pulse-video"|value="story"|id="news-tab-bar"/);
  const home = readFileSync(new URL('../site/index.html', import.meta.url), 'utf8');
  const warehouse = readFileSync(new URL('../site/warehouse.html', import.meta.url), 'utf8');
  assert.match(home, /\/news\?type=discussion/); assert.match(home, /\/news\?type=tool/);
  assert.match(warehouse, /\/news\?type=tool/);
});
