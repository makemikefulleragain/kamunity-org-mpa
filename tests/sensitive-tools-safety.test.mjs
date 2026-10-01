import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL(`../site/tools/${path}`, import.meta.url), 'utf8');
const inlineScript = html => [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].at(-1)?.[1];

test('housing mapper requires real scoring and identifies every export as a draft', () => {
  const html = read('housing-crisis-pressure-mapper/index.html');
  const elements = new Map([
    ['orgName', { value: 'Example NFP' }],
    ['flashMessage', { textContent: '', style: {} }],
    ['reportSection', { style: { display: 'none' } }],
  ]);
  const document = {
    getElementById: id => elements.get(id),
    addEventListener: () => {},
  };
  const context = vm.createContext({ document, setTimeout: () => {}, console });
  vm.runInContext(inlineScript(html), context);
  vm.runInContext('assessmentData = Object.fromEntries(dimensions.map(d => [d.id, { score: null, notes: "" }]))', context);
  assert.equal(vm.runInContext('readyForReport()', context), false);
  assert.match(elements.get('flashMessage').textContent, /choose a score for every dimension/i);
  vm.runInContext('for (const value of Object.values(assessmentData)) value.score = 6', context);
  assert.equal(vm.runInContext('readyForReport()', context), true);
  assert.match(html, /reviewStatus: 'DRAFT: self-reported scores, not verified evidence'/);
  assert.doesNotMatch(html, /advocacy-ready evidence/i);
});

test('welfare mapper escapes entered HTML and treats one observation as unverified', () => {
  const html = read('welfare-compliance-misalignment-mapper.html');
  const elements = new Map(['findingsText', 'misalignmentEvidence', 'recommendations'].map(id => [id, { innerHTML: '' }]));
  const document = {
    getElementById: id => elements.get(id) ?? { addEventListener: () => {} },
  };
  const context = vm.createContext({ document, console });
  vm.runInContext(inlineScript(html), context);
  assert.equal(vm.runInContext('escapeHtml("<img onerror=alert(1)>")', context), '&lt;img onerror=alert(1)&gt;');
  vm.runInContext('observations = [{ scores: { dignity: 2, wellbeing: 3, housing: 2, employment: 3 } }]; generateEvidenceSummary()', context);
  assert.match(elements.get('findingsText').innerHTML, /does not establish a systemic pattern/i);
  assert.doesNotMatch(elements.get('findingsText').innerHTML, /reveals systematic misalignment/i);
  assert.match(html, /Do not enter names, case numbers, precise dates/i);
});
