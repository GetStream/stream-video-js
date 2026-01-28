import { test, type TestContext } from 'node:test';
import { normalizeString } from './normalizeString';

test('removes acute accents', (t: TestContext) => {
  t.assert.strictEqual(normalizeString('Éva'), 'eva');
  t.assert.strictEqual(normalizeString('café'), 'cafe');
  t.assert.strictEqual(normalizeString('résumé'), 'resume');
});

test('removes grave accents', (t: TestContext) => {
  t.assert.strictEqual(normalizeString('à'), 'a');
  t.assert.strictEqual(normalizeString('è'), 'e');
  t.assert.strictEqual(normalizeString('Père'), 'pere');
});

test('removes circumflex accents', (t: TestContext) => {
  t.assert.strictEqual(normalizeString('château'), 'chateau');
  t.assert.strictEqual(normalizeString('forêt'), 'foret');
});

test('removes umlaut/diaeresis', (t: TestContext) => {
  t.assert.strictEqual(normalizeString('Müller'), 'muller');
  t.assert.strictEqual(normalizeString('naïve'), 'naive');
  t.assert.strictEqual(normalizeString('Zoë'), 'zoe');
});

test('removes tilde', (t: TestContext) => {
  t.assert.strictEqual(normalizeString('señor'), 'senor');
  t.assert.strictEqual(normalizeString('São Paulo'), 'sao paulo');
});

test('removes cedilla', (t: TestContext) => {
  t.assert.strictEqual(normalizeString('François'), 'francois');
  t.assert.strictEqual(normalizeString('façade'), 'facade');
});

test('handles mixed diacritics', (t: TestContext) => {
  t.assert.strictEqual(normalizeString('Éva Raposa'), 'eva raposa');
  t.assert.strictEqual(normalizeString('Jürgen Müller'), 'jurgen muller');
  t.assert.strictEqual(normalizeString('Crème brûlée'), 'creme brulee');
});

test('preserves non-accented characters', (t: TestContext) => {
  t.assert.strictEqual(normalizeString('hello world'), 'hello world');
  t.assert.strictEqual(normalizeString('test123'), 'test123');
  t.assert.strictEqual(normalizeString('user@email.com'), 'user@email.com');
});

test('handles empty string', (t: TestContext) => {
  t.assert.strictEqual(normalizeString(''), '');
});
