const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPrompt, extractCitations } = require('../lib/rag');

const chunks = [
  { page: 3, text: 'alpha text' },
  { page: 9, text: 'beta text' },
  { page: 9, text: 'gamma text' },
];

test('buildPrompt numbers sources and includes their pages', () => {
  const p = buildPrompt('What is alpha?', chunks, 'doc.pdf');
  assert.match(p, /\[1\] \(page 3\)\nalpha text/);
  assert.match(p, /\[2\] \(page 9\)\nbeta text/);
  assert.match(p, /QUESTION\nWhat is alpha\?/);
});

test('buildPrompt tells the model sources are untrusted', () => {
  assert.match(buildPrompt('q', chunks, 'd.pdf'), /untrusted/);
});

test('extractCitations finds single and grouped markers', () => {
  const r = extractCitations('A is true [1]. B is true [2, 3].', chunks);
  assert.deepEqual(r.map((c) => c.n), [1, 2, 3]);
});

test('extractCitations keeps page and text from the retrieved chunk', () => {
  const [c] = extractCitations('See [2].', chunks);
  assert.equal(c.page, 9);
  assert.equal(c.text, 'beta text');
});

test('extractCitations ignores numbers that are not real sources', () => {
  assert.deepEqual(extractCitations('x [7] y [0]', chunks), []);
});

test('extractCitations dedupes repeated markers', () => {
  assert.equal(extractCitations('[2] and again [2]', chunks).length, 1);
});

test('extractCitations returns nothing when the answer has no markers', () => {
  assert.deepEqual(extractCitations('I could not find that.', chunks), []);
});