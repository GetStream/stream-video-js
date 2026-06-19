import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  COMMENT_MARKER,
  extractPrNumbers,
  buildReleaseRollup,
  sameRepoIssueNumbers,
  renderPrComment,
  renderIssueComment,
  type VersionLink,
} from './comment-released-prs.mts';

// Mirrors real @jscutlery/semver + prettier output: PR refs are linked as
// "([#2284](.../issues/2284))" and commit hashes as "([4403348](.../commit/...))".
const CLIENT_CL = `# Changelog

## [1.54.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.53.2...@stream-io/video-client-1.54.0) (2026-06-19)

### Bug Fixes

- **client:** fix a thing ([#2290](https://github.com/GetStream/stream-video-js/issues/2290)) ([4403348](https://github.com/GetStream/stream-video-js/commit/4403348115500499cd60919a417d97659546bb8b))

## [1.53.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.53.1...@stream-io/video-client-1.53.2) (2026-06-12)

### Bug Fixes

- **client:** older change ([#2284](https://github.com/GetStream/stream-video-js/issues/2284)) ([1111111](https://github.com/GetStream/stream-video-js/commit/1111111111111111111111111111111111111111))
`;

// react-sdk top entry: one own fix plus a dependency bump whose nested bullet
// carries the client PR (#2290), exactly as #2297 enriches it.
const REACT_SDK_CL = `# Changelog

## [1.38.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.37.7...@stream-io/video-react-sdk-1.38.0) (2026-06-19)

### Bug Fixes

- **react-sdk:** own fix ([#2291](https://github.com/GetStream/stream-video-js/issues/2291)) ([2222222](https://github.com/GetStream/stream-video-js/commit/2222222222222222222222222222222222222222))

### Dependency Updates

- \`@stream-io/video-client\` updated to version \`1.54.0\`
  - **client:** fix a thing ([#2290](https://github.com/GetStream/stream-video-js/issues/2290)) ([4403348](https://github.com/GetStream/stream-video-js/commit/4403348115500499cd60919a417d97659546bb8b))
`;

test('extractPrNumbers picks up linked PR refs, not commit hashes', () => {
  assert.deepEqual(
    extractPrNumbers(
      '- foo ([#2290](https://x/issues/2290)) ([4403348](https://x/commit/4403348))',
    ),
    [2290],
  );
});

test('extractPrNumbers dedupes across bullets and sorts', () => {
  assert.deepEqual(
    extractPrNumbers('- a [#30]\n- b [#10]\n- c [#10]\n- d [#20]'),
    [10, 20, 30],
  );
});

test('extractPrNumbers takes the PR ref per bullet and ignores trailing "closes [#N]" issue refs', () => {
  const body = [
    '- fix a thing ([#2048](https://github.com/GetStream/stream-video-js/issues/2048)) ([76eadd1](https://github.com/GetStream/stream-video-js/commit/76eadd1)), closes [#1962](https://github.com/GetStream/stream-video-js/issues/1962)',
    '- another fix ([#2050](https://github.com/GetStream/stream-video-js/issues/2050)) ([abc1234](https://github.com/GetStream/stream-video-js/commit/abc1234))',
  ].join('\n');
  assert.deepEqual(extractPrNumbers(body), [2048, 2050]);
});

test('buildReleaseRollup splits source vs carrier and ignores older entries', () => {
  const released = [
    { name: '@stream-io/video-client', version: '1.54.0' },
    { name: '@stream-io/video-react-sdk', version: '1.38.0' },
  ];
  const rollup = buildReleaseRollup(released, {
    '@stream-io/video-client': CLIENT_CL,
    '@stream-io/video-react-sdk': REACT_SDK_CL,
  });

  // #2290: source = client@1.54.0, carrier = react-sdk@1.38.0
  assert.deepEqual(rollup.get(2290), {
    sources: [{ name: '@stream-io/video-client', version: '1.54.0' }],
    carriers: [{ name: '@stream-io/video-react-sdk', version: '1.38.0' }],
  });
  // #2291: react-sdk's own change -> source only
  assert.deepEqual(rollup.get(2291), {
    sources: [{ name: '@stream-io/video-react-sdk', version: '1.38.0' }],
    carriers: [],
  });
  // #2284 lived in an OLDER client entry (1.53.2), not the released top entry
  assert.equal(rollup.has(2284), false);
});

test('buildReleaseRollup classifies a PR under a Chores section as a source', () => {
  const cl = `# Changelog

## [1.0.0](https://github.com/GetStream/stream-video-js/compare/x...y) (2026-06-19)

### Chores

- **client:** bump something ([#4242](https://github.com/GetStream/stream-video-js/issues/4242)) ([abc1234](https://github.com/GetStream/stream-video-js/commit/abc1234))
`;
  const rollup = buildReleaseRollup(
    [{ name: '@stream-io/video-client', version: '1.0.0' }],
    { '@stream-io/video-client': cl },
  );
  assert.deepEqual(rollup.get(4242), {
    sources: [{ name: '@stream-io/video-client', version: '1.0.0' }],
    carriers: [],
  });
});

test('buildReleaseRollup derives carriers from a BARE dependency-update line (no enrichment)', () => {
  const clientCl = `# Changelog

## [1.54.0](https://github.com/GetStream/stream-video-js/compare/x...y) (2026-06-19)

### Bug Fixes

- **client:** a real fix ([#2286](https://github.com/GetStream/stream-video-js/issues/2286)) ([aaaaaaa](https://github.com/GetStream/stream-video-js/commit/aaaaaaa))
`;
  // react-sdk top entry is BARE: a dependency bump with no nested bullets, the
  // state forward-enrichment can leave behind.
  const reactSdkBare = `# Changelog

## [1.38.0](https://github.com/GetStream/stream-video-js/compare/x...y) (2026-06-19)

### Dependency Updates

- \`@stream-io/video-client\` updated to version \`1.54.0\`
`;
  const rollup = buildReleaseRollup(
    [
      { name: '@stream-io/video-client', version: '1.54.0' },
      { name: '@stream-io/video-react-sdk', version: '1.38.0' },
    ],
    {
      '@stream-io/video-client': clientCl,
      '@stream-io/video-react-sdk': reactSdkBare,
    },
  );
  assert.deepEqual(rollup.get(2286), {
    sources: [{ name: '@stream-io/video-client', version: '1.54.0' }],
    carriers: [{ name: '@stream-io/video-react-sdk', version: '1.38.0' }],
  });
});

test('buildReleaseRollup does not attribute a carrier when the bumped version is not the released one', () => {
  const clientCl = `# Changelog

## [1.54.0](https://github.com/GetStream/stream-video-js/compare/x...y) (2026-06-19)

### Bug Fixes

- **client:** a real fix ([#2286](https://github.com/GetStream/stream-video-js/issues/2286)) ([aaaaaaa](https://github.com/GetStream/stream-video-js/commit/aaaaaaa))
`;
  // react-sdk bumped client to 1.53.9 (a prior release), not this run's 1.54.0.
  const reactSdkBare = `# Changelog

## [1.38.0](https://github.com/GetStream/stream-video-js/compare/x...y) (2026-06-19)

### Dependency Updates

- \`@stream-io/video-client\` updated to version \`1.53.9\`
`;
  const rollup = buildReleaseRollup(
    [
      { name: '@stream-io/video-client', version: '1.54.0' },
      { name: '@stream-io/video-react-sdk', version: '1.38.0' },
    ],
    {
      '@stream-io/video-client': clientCl,
      '@stream-io/video-react-sdk': reactSdkBare,
    },
  );
  assert.deepEqual(rollup.get(2286), {
    sources: [{ name: '@stream-io/video-client', version: '1.54.0' }],
    carriers: [],
  });
});

test('renderPrComment groups sources and carriers and ends with the marker', () => {
  const src: VersionLink[] = [
    {
      name: '@stream-io/video-client',
      version: '1.54.0',
      releaseUrl: 'https://gh/r/client',
      npmUrl: 'https://npm/client',
    },
  ];
  const car: VersionLink[] = [
    {
      name: '@stream-io/video-react-sdk',
      version: '1.38.0',
      releaseUrl: 'https://gh/r/sdk',
      npmUrl: 'https://npm/sdk',
    },
  ];
  const body = renderPrComment(src, car);
  assert.match(body, /\*\*Shipped in\*\*/);
  assert.match(body, /\*\*Available to SDK users in\*\*/);
  assert.match(body, /`@stream-io\/video-client@1\.54\.0`/);
  assert.match(body, /\[npm\]\(https:\/\/npm\/sdk\)/);
  assert.ok(body.trimEnd().endsWith(COMMENT_MARKER));
  assert.ok(!body.includes('—')); // no em-dash
});

test('renderPrComment with only sources omits the carrier group', () => {
  const src: VersionLink[] = [
    {
      name: '@stream-io/video-react-sdk',
      version: '1.38.0',
      releaseUrl: 'r',
      npmUrl: 'n',
    },
  ];
  const body = renderPrComment(src, []);
  assert.match(body, /\*\*Shipped in\*\*/);
  assert.ok(!body.includes('Available to SDK users in'));
});

test('renderIssueComment uses the issue lead line', () => {
  const body = renderIssueComment(
    [{ name: 'p', version: '1.0.0', releaseUrl: 'r', npmUrl: 'n' }],
    [],
  );
  assert.match(body, /The fix for this issue has been released/);
  assert.ok(body.trimEnd().endsWith(COMMENT_MARKER));
});

test('sameRepoIssueNumbers keeps same-repo closing issues and drops cross-repo ones', () => {
  const json = JSON.stringify({
    closingIssuesReferences: [
      {
        number: 100,
        url: 'https://github.com/GetStream/stream-video-js/issues/100',
      },
      {
        number: 32,
        url: 'https://github.com/GetStream/react-native-webrtc/issues/32',
      },
      {
        number: 200,
        url: 'https://github.com/GetStream/stream-video-js/issues/200',
      },
    ],
  });
  assert.deepEqual(
    sameRepoIssueNumbers(json, 'GetStream/stream-video-js'),
    [100, 200],
  );
});

test('sameRepoIssueNumbers returns [] for empty, malformed, or missing input', () => {
  assert.deepEqual(sameRepoIssueNumbers('', 'GetStream/stream-video-js'), []);
  assert.deepEqual(
    sameRepoIssueNumbers('not json', 'GetStream/stream-video-js'),
    [],
  );
  assert.deepEqual(sameRepoIssueNumbers('{}', 'GetStream/stream-video-js'), []);
});
