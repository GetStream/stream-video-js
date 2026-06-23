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
  type InstallGroup,
  renderComment,
  rowKey,
  type SizeReport,
} from './measure.mts';

const CLIENT = '@stream-io/video-client';
const BINDINGS = '@stream-io/video-react-bindings';
const REACT_SDK = '@stream-io/video-react-sdk';

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

test('formatDelta signs KB and sub-KB byte magnitudes', () => {
  assert.equal(formatDelta(2048, 1024), '+1.0 KB (+100.0%)');
  assert.equal(formatDelta(1024, 2048), '-1.0 KB (-50.0%)');
  assert.equal(formatDelta(1048, 1000), '+48 B (+4.8%)');
  assert.equal(formatDelta(952, 1000), '-48 B (-4.8%)');
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

// A single-flavour report hides the Flavour column; with no baseline every
// package is shown with absolute sizes.
test('renderComment (single flavour, no baseline) hides Flavour column', () => {
  const report: SizeReport = {
    targets: [
      { package: '@x/a', flavour: 'esm', unminified: 2048, minified: 1024 },
    ],
  };
  const body = renderComment(report);
  assert.match(body, /Built package output\. Sizes in KB; delta vs `main`\./);
  assert.match(body, /No `main` baseline available/);
  assert.ok(body.includes('| Package | Unminified | Minified |'));
  assert.ok(!body.includes('| Flavour |'));
  assert.match(body, /\| @x\/a \| 2\.0 KB \| 1\.0 KB \| n\/a \|/);
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
  assert.match(
    body,
    /\| @x\/a \| 4\.0 KB \| 2\.0 KB \| \+1\.0 KB \(\+100\.0%\) \|/,
  );
});

test('renderComment drops rows whose minified delta is under the threshold', () => {
  const report: SizeReport = {
    targets: [
      { package: '@x/big', flavour: 'esm', unminified: 10000, minified: 5000 },
      { package: '@x/tiny', flavour: 'esm', unminified: 2000, minified: 1008 },
    ],
  };
  const baseline: SizeReport = {
    targets: [
      { package: '@x/big', flavour: 'esm', unminified: 9000, minified: 3000 },
      { package: '@x/tiny', flavour: 'esm', unminified: 2000, minified: 1000 },
    ],
  };
  const body = renderComment(report, { baseline });
  assert.match(body, /@x\/big/);
  assert.doesNotMatch(body, /@x\/tiny/); // +8 bytes is below the 16-byte floor
});

test('renderComment shows a friendly message when nothing changed enough', () => {
  const report: SizeReport = {
    targets: [
      { package: '@x/a', flavour: 'esm', unminified: 2000, minified: 1005 },
    ],
  };
  const baseline: SizeReport = {
    targets: [
      { package: '@x/a', flavour: 'esm', unminified: 2000, minified: 1000 },
    ],
  };
  const body = renderComment(report, { baseline });
  assert.match(body, /No significant package size increase/);
  assert.doesNotMatch(body, /\| Package \|/);
});

test('renderComment always keeps new and removed rows', () => {
  const report: SizeReport = {
    targets: [
      { package: '@x/new', flavour: 'esm', unminified: 2048, minified: 1024 },
      { package: '@x/same', flavour: 'esm', unminified: 2048, minified: 1024 },
    ],
  };
  const baseline: SizeReport = {
    targets: [
      { package: '@x/same', flavour: 'esm', unminified: 2048, minified: 1024 },
      { package: '@x/gone', flavour: 'esm', unminified: 4096, minified: 2000 },
    ],
  };
  const body = renderComment(report, { baseline });
  assert.match(body, /\| @x\/new \| 2\.0 KB \| 1\.0 KB \| new \|/);
  assert.match(body, /\| @x\/gone \| - \| 2\.0 KB \| removed \|/);
  assert.doesNotMatch(body, /@x\/same/);
});

// Non-esm builds (e.g. the cjs-only audio-filters-web) are tagged inline; there
// is no separate Flavour column.
test('renderComment tags non-esm builds inline', () => {
  const report: SizeReport = {
    targets: [
      {
        package: '@stream-io/video-client',
        flavour: 'esm',
        unminified: 4096,
        minified: 2048,
      },
      {
        package: '@stream-io/audio-filters-web',
        flavour: 'cjs',
        unminified: 5000,
        minified: 4900,
      },
    ],
  };
  const body = renderComment(report);
  assert.ok(!body.includes('| Flavour |'));
  assert.match(
    body,
    /\| @stream-io\/audio-filters-web \(cjs\) \| 4\.9 KB \| 4\.8 KB \| n\/a \|/,
  );
  assert.match(
    body,
    /\| @stream-io\/video-client \| 4\.0 KB \| 2\.0 KB \| n\/a \|/,
  );
});

test('renderComment orders packages by the preferred list, then alphabetically', () => {
  const mk = (pkg: string): SizeReport['targets'][number] => ({
    package: pkg,
    flavour: 'esm',
    unminified: 1000,
    minified: 500,
  });
  const report: SizeReport = {
    targets: [
      mk('@stream-io/video-filters-web'),
      mk('@stream-io/video-react-native-sdk'),
      mk(REACT_SDK),
      mk(CLIENT),
      mk(BINDINGS),
    ],
  };
  const body = renderComment(report);
  const positions = [
    'video-client',
    'video-react-bindings',
    'video-react-sdk',
    'video-react-native-sdk',
    'video-filters-web',
  ].map((p) => body.indexOf(`| @stream-io/${p} |`));
  assert.ok(
    positions.every((p, i) => i === 0 || (p > positions[i - 1] && p !== -1)),
    `rows out of preferred order: ${positions.join(', ')}`,
  );
});

// Clean multiples of 1024 so the rendered KB values are exact.
const uiReport: SizeReport = {
  targets: [
    { package: CLIENT, flavour: 'esm', unminified: 716800, minified: 262144 },
    { package: BINDINGS, flavour: 'esm', unminified: 30720, minified: 8192 },
    { package: REACT_SDK, flavour: 'esm', unminified: 184320, minified: 92160 },
  ],
};
const uiGroups: InstallGroup[] = [
  { package: REACT_SDK, members: [REACT_SDK, CLIENT, BINDINGS] },
];

test('renderComment adds an install-total sub-row for a UI SDK', () => {
  const body = renderComment(uiReport, { installGroups: uiGroups });
  // own row (no baseline -> n/a)
  assert.match(
    body,
    /\| @stream-io\/video-react-sdk \| 180\.0 KB \| 90\.0 KB \| n\/a \|/,
  );
  // 180 + 700 + 30 = 910 unminified; 90 + 256 + 8 = 354 minified
  assert.match(
    body,
    /\| ↳ install total \(\+ client \+ react-bindings\) \| 910\.0 KB \| 354\.0 KB \| n\/a \|/,
  );
});

test('renderComment shows a UI SDK when only a dependency changed', () => {
  // react-sdk + bindings unchanged; only client grew by 2048 bytes.
  const baseline: SizeReport = {
    targets: [
      { package: CLIENT, flavour: 'esm', unminified: 716800, minified: 260096 },
      { package: BINDINGS, flavour: 'esm', unminified: 30720, minified: 8192 },
      {
        package: REACT_SDK,
        flavour: 'esm',
        unminified: 184320,
        minified: 92160,
      },
    ],
  };
  const body = renderComment(uiReport, { baseline, installGroups: uiGroups });
  // react-sdk's own size is unchanged, but it is shown because its total moved.
  assert.match(
    body,
    /\| @stream-io\/video-react-sdk \| 180\.0 KB \| 90\.0 KB \| 0 KB \|/,
  );
  assert.match(
    body,
    /\| ↳ install total \(\+ client \+ react-bindings\) \| 910\.0 KB \| 354\.0 KB \| \+2\.0 KB \(\+0\.6%\) \|/,
  );
  // bindings did not change -> its own row is filtered out.
  assert.doesNotMatch(body, /\| @stream-io\/video-react-bindings \|/);
});

test('renderComment hides a UI SDK whose whole install is unchanged', () => {
  const body = renderComment(uiReport, {
    baseline: uiReport,
    installGroups: uiGroups,
  });
  assert.match(body, /No significant package size increase/);
  assert.doesNotMatch(body, /install total/);
});

test('renderComment puts the baseline ref in the header line', () => {
  const body = renderComment(uiReport, {
    baseline: uiReport,
    baselineRef: 'main@abc1234',
  });
  assert.match(body, /delta vs `main@abc1234`\./);
});
