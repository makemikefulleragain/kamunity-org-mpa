import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../site/js/read-aloud.js', import.meta.url), 'utf8');

function reader({ supported = true } = {}) {
  const spoken = [], events = {}, audio = { paused: false, pause() { this.paused = true; } };
  const context = {
    window: { addEventListener(name, callback) { events[name] = callback; } },
    document: {
      createElement(tag) { return { tag, attributes: {}, events: {}, setAttribute(name, value) { this.attributes[name] = value; }, addEventListener(name, callback) { this.events[name] = callback; } }; },
      addEventListener(name, callback) { events[name] = callback; },
      querySelectorAll() { return [audio]; },
    },
  };
  if (supported) {
    context.speechSynthesis = { speak(utterance) { spoken.push(utterance); }, cancel() {} };
    context.SpeechSynthesisUtterance = function (text) { this.text = text; };
  }
  runInNewContext(source, context);
  return { ...context.window.KamunityReadAloud, spoken, events, audio };
}

test('Read aloud sends the headline and entire published body, including the final paragraph, to browser speech', () => {
  const api = reader();
  const body = 'Opening paragraph.\n\n' + 'Full publication detail. '.repeat(100) + '\n\nFinal published paragraph.';
  const button = api.createButton({ title: "A community's story", body_text: body, summary: 'Only a short card summary.' });
  assert.equal(api.spoken.length, 0, 'speech starts only after a user click');
  assert.equal(button.textContent, 'Read aloud');
  button.events.click();
  assert.equal(api.spoken[0].text, "A community's story. " + body);
  assert.equal(api.spoken[0].lang, 'en-AU');
  assert.equal(api.audio.paused, true);
  assert.equal(button.textContent, 'Stop');
  assert.equal(button.attributes['aria-pressed'], 'true');
  api.spoken[0].onend();
  assert.equal(button.textContent, 'Read aloud');
  assert.equal(button.attributes['aria-pressed'], 'false');
});

test('spoken websites become a single original-source instruction while facts, attribution and final paragraphs remain', () => {
  const api = reader();
  const item = { title: 'Community planning in 2026', body_text: 'The report covers 17.5% of costs and $2.50 fees, using version 1.1.0.\n\nSource: Community Research\nhttps://example.org/reports/2026?tracking=long-details#page\n\nLearn more: www.other.org.au/some/long/path.\n\nAlso see community.org.au/report?id=42.\n\nFinal published paragraph.' };
  const original = JSON.stringify(item);
  api.createButton(item, true).events.click();
  const text = api.spoken[0].text;
  for (const value of ['17.5%', '$2.50', '1.1.0', 'Source: Community Research', 'Final published paragraph.']) assert.ok(text.includes(value), value);
  assert.doesNotMatch(text, /https?:|www\.|example\.org|other\.org|community\.org|tracking|long-details/);
  assert.equal(text.split('To read the original article, click the Open original source link.').length, 2);
  assert.ok(text.endsWith('To read the original article, click the Open original source link.'));
  assert.equal(JSON.stringify(item), original, 'published wording stays unchanged');
});

test('inline and markdown URLs are excluded without losing surrounding text, labels or punctuation', () => {
  const api = reader();
  api.createButton({ title: 'Read the full story', body_text: 'Check [the research](https://example.org/long/path). Plans (https://example.org/plans) support community work.\n\nThe full account is available at: http://example.net/account\n\nSource: https://example.org/source' }, true).events.click();
  const text = api.spoken[0].text;
  assert.ok(text.includes('Check the research.'));
  assert.ok(text.includes('Plans support community work.'));
  assert.ok(text.includes('The full account is available'));
  assert.doesNotMatch(text, /https?:|example\.|Source:\s*\n|available at:|\(\s*\)/);
});

test('source prompt is offered only when a real original-source link is rendered', () => {
  const api = reader();
  api.createButton({ title: 'Story', body_text: 'Full story with no embedded address.' }, true).events.click();
  assert.ok(api.spoken.at(-1).text.endsWith('To read the original article, click the Open original source link.'));
  api.createButton({ title: 'Story without a source link', body_text: 'Full story.\nhttps://example.org/a-reference' }, false).events.click();
  assert.doesNotMatch(api.spoken.at(-1).text, /https?:|example\.org|click the Open original source link/);
});

test('web addresses in titles and repeated source instructions are handled without reading or repeating them', () => {
  const api = reader();
  const prompt = 'To read the original article, click the Open original source link.';
  api.createButton({ title: 'A report at https://example.org/report', body_text: 'Final detail.\n\n' + prompt }, true).events.click();
  assert.doesNotMatch(api.spoken[0].text, /https?:|example\.org/);
  assert.equal(api.spoken[0].text.split(prompt).length, 2);
});

test('Stop and switching stories reset the right controls without stale speech callbacks', () => {
  const api = reader();
  const first = api.createButton({ title: 'First', body_text: 'First full story.' });
  const second = api.createButton({ title: 'Second', body_text: 'Second full story.' });
  first.events.click();
  second.events.click();
  assert.equal(api.spoken.length, 2);
  assert.equal(first.textContent, 'Read aloud');
  assert.equal(second.textContent, 'Stop');
  api.spoken[0].onerror();
  assert.equal(second.textContent, 'Stop');
  second.events.click();
  assert.equal(second.textContent, 'Read aloud');
  assert.equal(api.spoken.length, 2, 'Stop does not restart speech');
});

test('speech errors, navigating away and playing audio restore the Read aloud control', () => {
  const api = reader();
  const button = api.createButton({ title: 'Story', body_text: 'Complete story.' });
  button.events.click(); api.spoken.at(-1).onerror();
  assert.equal(button.textContent, 'Read aloud');
  button.events.click(); api.events.pagehide();
  assert.equal(button.textContent, 'Read aloud');
  button.events.click(); api.events.play({ target: { tagName: 'AUDIO' } });
  assert.equal(button.textContent, 'Read aloud');
});

test('unsupported speech and missing full text never offer to read a summary as a full story', () => {
  assert.equal(reader({ supported: false }).createButton({ body_text: 'Complete story.' }), null);
  assert.equal(reader().createButton({ summary: 'A summary without the story.' }), null);
});

test('homepage and News load the same full-story reading control before their card renderers', () => {
  for (const [page, script] of [['index.html', 'supabase-feed.js'], ['news.html', 'news.js']]) {
    const html = readFileSync(new URL('../site/' + page, import.meta.url), 'utf8');
    assert.ok(html.indexOf('js/read-aloud.js') < html.indexOf('js/' + script));
    const client = readFileSync(new URL('../site/js/' + script, import.meta.url), 'utf8');
    assert.match(client, /KamunityReadAloud\.createButton\(item, Boolean\(sourceUrl\)\)/);
  }
});
