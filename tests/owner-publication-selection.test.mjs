import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { handler as kaiHandler } from '../site/netlify/functions/kai-proxy.mjs';

const source = (path) => readFileSync(new URL(`../site/${path}`, import.meta.url), 'utf8');
const allHtml = (directory = new URL('../site/', import.meta.url)) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const child = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
  return entry.isDirectory() ? allHtml(child) : entry.name.endsWith('.html') ? [[child, readFileSync(child, 'utf8')]] : [];
});

test('illustrative door cannot call public Kai or pretend to show verified signals', () => {
  const html = source('door-gen-template.html');
  assert.doesNotMatch(html, /kai-proxy|fetch\(/i);
  assert.match(html, /Illustrative template only/);
  assert.match(html, /Not live evidence/);
  assert.match(html, /mailto:mike@kamunityconsulting\.com/);
});

test('Kai handout describes a future concept rather than an available chat', () => {
  const html = source('tools/handout-kai.html');
  assert.match(html, /public chat is not currently offered/i);
  assert.doesNotMatch(html, /Completely Free to use at kamunity\.org/i);
});

test('compliance observation tool matches its purpose and does not expose build prompt', () => {
  const html = source('tools/compliance-harm-observations/index.html');
  assert.match(html, /Anonymised observation/);
  assert.match(html, /Evidence and limitations/);
  assert.match(html, /not a verified finding/i);
  assert.doesNotMatch(html, /FACTORY ROUTE CONTRACT|AI governance readiness|api\.anthropic\.com/i);
});

test('Warehouse discovers selected planner and excludes rejected cards and opt-in interaction', () => {
  const html = source('warehouse.html');
  assert.match(html, /href="\/tools\/corporate-volunteering-planner\.html"/);
  assert.match(html, /href="\/tools\/compliance-harm-observations\/"/);
  assert.doesNotMatch(html, /href="\/tools\/handout-reflection\.html"/);
  assert.doesNotMatch(html, /candid-donut-4ec289/);
  assert.doesNotMatch(html, /id="optin-modal"|onclick="openOptinModal/);
  assert.match(html, /Historical example/);
  assert.match(html, /Community Signal/);
  assert.doesNotMatch(html, /href="https:\/\/community-signal\.netlify\.app"/);
  assert.match(html, /Community%20Signal%20walkthrough/);
});

test('corporate planner contains wide tables within horizontal scroll regions', () => {
  const html = source('tools/corporate-volunteering-planner.html');
  assert.match(html, /\.layout > div, section\s*\{\s*min-width:\s*0;\s*\}/);
  assert.match(html, /section > table\s*\{\s*display:\s*block;\s*overflow-x:\s*auto;/);
});

test('Warehouse tool actions never reveal local paths or open non-HTTPS links', () => {
  const html = source('warehouse.html');
  assert.doesNotMatch(html, /data-output-url|downloadFactoryTool|openEmbeddedTool|Tool staged locally at|Open this folder in Finder/i);
  assert.match(html, /\^https:\\\/\\\//);
});

test('public Kai endpoint is fail-closed without an external provider call', async () => {
  const response = await kaiHandler({ httpMethod: 'POST', body: '{"messages":[{"role":"user","content":"hello"}]}' });
  assert.equal(response.statusCode, 410);
  assert.equal(JSON.parse(response.body).error, 'feature_not_available');
  assert.doesNotMatch(source('netlify/functions/kai-proxy.mjs'), /api\.anthropic\.com|ANTHROPIC_API_KEY/);
});

test('rejected standalone pages are absent from the publish directory', () => {
  for (const path of ['kai.html', 'kai/reflection.html', 'tools/handout-reflection.html']) {
    assert.equal(existsSync(new URL(`../site/${path}`, import.meta.url)), false, path);
  }
});

test('selected HTML has no active Kai controls, Netlify forms or rejected-page links', () => {
  for (const [path, html] of allHtml()) {
    assert.doesNotMatch(html, /data-kai-modal|data-netlify\s*=\s*["']true["']|kai-proxy|kai-modal\.js/i, `${path}`);
    assert.doesNotMatch(html, /href\s*=\s*["'](?:\/kai(?:\.html|\/reflection(?:\.html)?)?|\/tools\/handout-reflection\.html)["']/i, `${path}`);
  }
  assert.doesNotMatch(source('warehouse.html'), /optin-modal|openOptinModal|optin-notify-btn/i);
});

test('Ring Zero is presented as an unconfirmed pilot without conflicting prices', () => {
  for (const path of ['ring-zero.html', 'index.html', 'services.html', 'my-kamunity.html', 'tools/handout-consulting.html']) {
    const html = source(path);
    assert.doesNotMatch(html, /six weeks to constitutional independence|\$0 Hard-to-Love Fund|\$4,500(?![^<]*audit)|Founding Community Rate/i, path);
  }
  assert.match(source('ring-zero.html'), /not yet a fixed-price public offer/i);
  assert.doesNotMatch(source('ring-zero.html'), /Free forever/i);
});

test('public privacy copy describes client-side answers without promising zero operational data', () => {
  for (const path of ['index.html', 'news.html', 'warehouse.html', 'about.html', 'constitution.html', 'my-kamunity.html']) {
    const html = source(path);
    assert.match(html, /Basic hosting logs may be processed/, path);
    assert.doesNotMatch(html, /No data collection\. Constitutional commitment/, path);
  }
  assert.match(source('tools.html'), /No account or answer submission/);
});

test('discovery files identify the separate MPA origin and exclude rejected pages', () => {
  const sitemap = source('sitemap.xml');
  assert.equal([...sitemap.matchAll(/<loc>/g)].length, 26);
  assert.doesNotMatch(sitemap, /https:\/\/kamunity\.org|\/kai(?:\.html|\/reflection)|handout-reflection|door-gen-template/i);
  assert.match(source('robots.txt'), /https:\/\/kamunity-org-mpa\.netlify\.app\/sitemap\.xml/);
  assert.doesNotMatch(source('llms.txt'), /Kai is available for chat|Mycelium is an active/i);
});
