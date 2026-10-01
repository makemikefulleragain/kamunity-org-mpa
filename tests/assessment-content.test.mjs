import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const read = path => readFileSync(new URL('../site/' + path, import.meta.url), 'utf8');

test('home and tools link to canonical AI Readiness without embedded questionnaire', () => {
  for (const path of ['index.html', 'tools.html']) {
    const html = read(path);
    assert.match(html, /href="https:\/\/kamunity-ai-readiness.netlify.app\//);
    assert.doesNotMatch(html, /id="aiready-(quiz|results|embed)"/);
  }
  assert.doesNotMatch(read('js/quizzes.js'), /AIREADY_QUESTIONS|AIREADY_RESULTS|buildQuiz\('aiready/);
});

test('Org Health explains unchanged weighting without unsupported rarity claims', () => {
  for (const path of ['index.html', 'tools.html', 'tools/org-health-check.html']) {
    assert.match(read(path), /not a validated diagnostic/);
    assert.match(read(path), /Quality 2/);
    assert.match(read(path), /Governance 4/);
  }
  assert.doesNotMatch(read('js/quizzes.js'), /genuinely rare/);
  assert.doesNotMatch(read('tools/org-health-check.html'), /genuinely rare/);
});
