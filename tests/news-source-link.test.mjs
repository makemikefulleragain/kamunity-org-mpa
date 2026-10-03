import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const newsScript = readFileSync(new URL('../site/js/news.js', import.meta.url), 'utf8');
const newsPage = readFileSync(new URL('../site/news.html', import.meta.url), 'utf8');

const helper = newsScript.match(/function safeOriginalSourceUrl\(value\) \{[\s\S]*?\n    \}/)?.[0];
assert.ok(helper, 'the news view should validate original-source URLs');
const safeOriginalSourceUrl = runInNewContext(`(${helper})`, { URL });

test('the story modal offers an external source link only for reviewed HTTPS URLs', () => {
  assert.match(newsPage, /id="sm-source-link"[^>]*rel="noopener noreferrer"[^>]*hidden/);
  assert.match(newsScript, /sourceLink\.href = sourceUrl/);
  assert.match(newsScript, /sourceLink\.hidden = !sourceUrl/);
  assert.equal(safeOriginalSourceUrl('https://example.org/report?email=private%40example.org#part'), 'https://example.org/report');
  for (const url of [
    'javascript:alert(1)',
    'http://example.org/report',
    'https://user:secret@example.org/report',
    'https://localhost/report',
    'https://preview.test/report',
    'https://127.0.0.1/report',
    'not a URL',
  ]) {
    assert.equal(safeOriginalSourceUrl(url), '', `must reject ${url}`);
  }
});
