/**
 * Unit tests for the pure formatting / rendering core of the bundle-size script.
 * No filesystem, no `gh`, no minify - just the math and markdown.
 *
 * Run via `yarn test:scripts` (node --test 'scripts/**\/*.test.mts').
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  COMMENT_MARKER,
  displayName,
  formatDelta,
  formatKB,
  renderComment,
  rowKey,
  type SizeReport,
} from './measure.mts';

test('formatKB renders bytes as one-decimal KB', () => {
  assert.equal(formatKB(0), '0.0 KB');
  assert.equal(formatKB(1024), '1.0 KB');
  assert.equal(formatKB(745472), '728.0 KB');
});

test('formatDelta returns n/a without a baseline value', () => {
  assert.equal(formatDelta(1000, undefined), 'n/a');
});

test('formatDelta returns 0 KB when unchanged', () => {
  assert.equal(formatDelta(2048, 2048), '0 KB');
});

test('formatDelta signs an increase', () => {
  assert.equal(formatDelta(2048, 1024), '+1.0 KB (+100.0%)');
});

test('formatDelta signs a decrease', () => {
  assert.equal(formatDelta(1024, 2048), '-1.0 KB (-50.0%)');
});

test('rowKey and displayName', () => {
  assert.equal(
    rowKey({ package: 'p', entry: 'embedded', flavour: 'esm' }),
    'p|embedded|esm',
  );
  assert.equal(rowKey({ package: 'p', flavour: 'cjs' }), 'p||cjs');
  assert.equal(displayName({ package: 'p' }), 'p');
  assert.equal(
    displayName({ package: 'p', entry: 'embedded' }),
    'p (embedded)',
  );
});

test('renderComment without a baseline shows the note and n/a deltas', () => {
  const report: SizeReport = {
    targets: [
      { package: '@x/a', flavour: 'esm', unminified: 2048, minified: 1024 },
    ],
  };
  const body = renderComment(report);
  assert.match(body, /No `main` baseline available/);
  assert.match(body, /\| @x\/a \| esm \| 2\.0 KB \| 1\.0 KB \| n\/a \|/);
  assert.ok(body.includes(COMMENT_MARKER));
});

test('renderComment computes the minified delta against the baseline', () => {
  const report: SizeReport = {
    targets: [
      { package: '@x/a', flavour: 'esm', unminified: 4096, minified: 2048 },
    ],
  };
  const baseline: SizeReport = {
    targets: [
      { package: '@x/a', flavour: 'esm', unminified: 2048, minified: 1024 },
    ],
  };
  const body = renderComment(report, { baseline });
  assert.doesNotMatch(body, /No `main` baseline available/);
  assert.match(
    body,
    /\| @x\/a \| esm \| 4\.0 KB \| 2\.0 KB \| \+1\.0 KB \(\+100\.0%\) \|/,
  );
});

test('renderComment marks new and removed rows', () => {
  const report: SizeReport = {
    targets: [
      { package: '@x/new', flavour: 'esm', unminified: 2048, minified: 1024 },
    ],
  };
  const baseline: SizeReport = {
    targets: [
      { package: '@x/gone', flavour: 'esm', unminified: 4096, minified: 2000 },
    ],
  };
  const body = renderComment(report, { baseline });
  assert.match(body, /\| @x\/new \| esm \| 2\.0 KB \| 1\.0 KB \| new \|/);
  assert.match(body, /\| @x\/gone \| esm \| - \| 2\.0 KB \| removed \|/);
});

test('renderComment includes the baseline ref footnote when provided', () => {
  const report: SizeReport = {
    targets: [
      { package: '@x/a', flavour: 'esm', unminified: 2048, minified: 1024 },
    ],
  };
  const body = renderComment(report, {
    baseline: report,
    baselineRef: 'main@abc1234',
  });
  assert.match(body, /Baseline: main@abc1234\./);
});
