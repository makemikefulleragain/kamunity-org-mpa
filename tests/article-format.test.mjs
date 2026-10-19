import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const script = readFileSync(new URL('../site/js/news.js', import.meta.url), 'utf8');
const formatter = readFileSync(new URL('../site/js/article-format.js', import.meta.url), 'utf8');
const page = readFileSync(new URL('../site/news.html', import.meta.url), 'utf8');
const context = { window: {}, URL };
runInNewContext(formatter, context);
const format = context.window.KamunityArticleFormat;
const body = 'Opening with **important context**.\n\n**Why this matters**\n\nSecond paragraph.\n\n## Next steps\n\n- Check the source\n- Keep the limits\n\n1. Review\n2. Decide';

class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.attributes = {}; this._text = ''; }
  appendChild(child) { this.children.push(child); }
  replaceChildren() { this.children = []; this._text = ''; }
  set textContent(value) { this._text = value; this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  removeAttribute(key) { delete this.attributes[key]; }
}
function render(story) {
  const elements = new Map();
  const document = { getElementById: id => { if (!elements.has(id)) elements.set(id, new Element('div')); return elements.get(id); }, createElement: tag => new Element(tag), createTextNode: text => { const node = new Element('#text'); node.textContent = text; return node; } };
  const modal = script.match(/function renderStoryModal\(story\) \{[\s\S]*?\n    \}/)[0];
  const inline = script.match(/function appendArticleText\(element, text\) \{[\s\S]*?\n    \}/)[0];
  const safeUrl = script.match(/function safeOriginalSourceUrl\(value\) \{[\s\S]*?\n    \}/)[0];
  runInNewContext(`${inline}\n${safeUrl}\n(${modal})(story)`, { ...context, story, document, escWh: value => String(value).replace(/[<>&"]/g, '') });
  return elements.get('sm-body');
}

test('formatter loads before the reader and its formatting stylesheet exists', () => {
  assert.ok(page.indexOf('/js/article-format.js') < page.indexOf('/js/news.js'));
  assert.match(page, /css\/article-format\.css/);
  const css = readFileSync(new URL('../site/css/article-format.css', import.meta.url), 'utf8');
  assert.match(css, /white-space:pre-line/);
  assert.match(css, /margin:1\.6rem 0 \.7rem/);
});
test('published structured articles render real paragraphs, headings, bold and lists', () => {
  const article = format.parseArticle(body);
  const root = render({ title: 'Formatted story', body_format: article.format, body_blocks: article.blocks, body_text: article.text });
  assert.equal(root.children.map(child => child.tag).join(','), 'p,h2,p,h2,ul,ol');
  assert.equal(root.children[0].children.find(child => child.tag === 'strong').textContent, 'important context');
  assert.equal(root.children[1].textContent, 'Why this matters');
  assert.equal(root.children[4].children.length, 2);
  assert.equal(root.children[5].start, 1);
  assert.equal(root.textContent.includes('**'), false);
  assert.equal(root.innerHTML, undefined, 'article wording must not be assigned as HTML');
});
test('old plain-text feeds retain paragraph breaks and malformed block data falls back safely', () => {
  assert.equal(render({ body_text: 'First.\n\nSecond.' }).children.map(child => child.tag).join(','), 'p,p');
  const bad = { body_format: format.ARTICLE_FORMAT, body_blocks: [{ type: 'heading', level: '2 onclick=alert(1)', text: 'Bad' }], body_text: 'Safe fallback.' };
  assert.equal(render(bad).children[0].tag, 'p');
  assert.equal(render(bad).textContent, 'Safe fallback.');
});
test('raw scripts, HTML and executable markdown links never create executable nodes', () => {
  const root = render({ body_text: '<script>alert(1)</script><p>Hello</p><img src=x onerror=alert(2)>\n\n[Read](javascript:alert(3))' });
  const tags = root.children.flatMap(node => [node.tag, ...node.children.map(child => child.tag)]);
  assert.equal(tags.some(tag => ['script', 'img', 'a', 'iframe', 'svg'].includes(tag)), false);
  assert.equal(root.textContent.includes('javascript:'), false);
  const hostileBlocks = render({ body_format: format.ARTICLE_FORMAT, body_blocks: [{ type: 'paragraph', text: '<img src=x onerror=alert(1)>' }] });
  assert.equal(hostileBlocks.children[0].children[0].tag, '#text');
});
