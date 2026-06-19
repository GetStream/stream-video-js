import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveOldDepVersion,
  collectUpstreamRange,
  bulletIdentity,
  enrichTopEntry,
  enrichAllEntries,
} from './enrich-dependency-changelogs.mts';
import { parseEntries } from './lib/changelog.mts';
import {
  CLIENT_CL,
  REACT_SDK_CL,
  BINDINGS_CL,
  RUNTIME_DEPS,
} from './lib/changelog.fixtures.mts';

test('resolveOldDepVersion finds the dep version from the previous mentioning entry', () => {
  const entries = parseEntries(REACT_SDK_CL);
  // top entry (index 0) has client 1.53.2; previous entry has client 1.53.0
  const old = resolveOldDepVersion(entries, '@stream-io/video-client', 0);
  assert.equal(old, '1.53.0');
});

test('resolveOldDepVersion returns null when no prior entry mentions the dep', () => {
  const entries = parseEntries(REACT_SDK_CL);
  const old = resolveOldDepVersion(entries, '@stream-io/video-filters-web', 0);
  assert.equal(old, null);
});

test('collectUpstreamRange returns (old, new] newest-first', () => {
  const entries = parseEntries(CLIENT_CL);
  const range = collectUpstreamRange(entries, '1.53.0', '1.53.2');
  assert.deepEqual(
    range.map((e) => e.version),
    ['1.53.2', '1.53.1'],
  );
});

test('collectUpstreamRange is empty when old === new', () => {
  const entries = parseEntries(CLIENT_CL);
  assert.equal(collectUpstreamRange(entries, '1.53.2', '1.53.2').length, 0);
});

test('bulletIdentity extracts the commit hash', () => {
  const bullet =
    '- **client:** x ([#2284](https://github.com/GetStream/stream-video-js/issues/2284)) ([4403348](https://github.com/GetStream/stream-video-js/commit/4403348115500499cd60919a417d97659546bb8b))';
  assert.equal(
    bulletIdentity(bullet),
    '4403348115500499cd60919a417d97659546bb8b',
  );
});

test('enrichTopEntry inlines upstream client changes under the client dep line', () => {
  const out = enrichTopEntry(REACT_SDK_CL, {
    depChangelogs: {
      '@stream-io/video-client': CLIENT_CL,
      '@stream-io/video-react-bindings': BINDINGS_CL,
    },
    runtimeDeps: RUNTIME_DEPS,
  });
  // The bare dep line is preserved
  assert.match(
    out,
    /- `@stream-io\/video-client` updated to version `1\.53\.2`/,
  );
  // Upstream client bullets are inlined (range 1.53.0 -> 1.53.2 => 1.53.2 + 1.53.1)
  assert.match(out, /keep user_id populated/);
  assert.match(out, /Send call data in JoinInitiated event/);
  // Nested (indented) under the dependency line
  assert.match(out, /\n {2,}- \*\*client:\*\* keep user_id populated/);
  // Historical entries are untouched
  assert.match(out, /## \[1\.37\.6\]/);
});

test('enrichTopEntry groups Features and Bug Fixes with labels when both exist', () => {
  const dep = `# Changelog

## [2.0.0](compare) (2026-01-02)

### Features

- **x:** big feature ([#10](https://h/i/issues/10)) ([aaaaaaa](https://h/i/commit/aaaaaaaaaa))

### Bug Fixes

- **x:** small fix ([#11](https://h/i/issues/11)) ([bbbbbbb](https://h/i/commit/bbbbbbbbbb))
`;
  const sdk = `# Changelog

## [1.1.0](compare) (2026-01-02)

### Dependency Updates

- \`@stream-io/video-client\` updated to version \`2.0.0\`

## [1.0.0](compare) (2026-01-01)

### Dependency Updates

- \`@stream-io/video-client\` updated to version \`1.0.0\`
`;
  const out = enrichTopEntry(sdk, {
    depChangelogs: { '@stream-io/video-client': dep },
    runtimeDeps: ['@stream-io/video-client'],
  });
  assert.match(out, /\n {2}- \*\*Features\*\*\n {4}- \*\*x:\*\* big feature/);
  assert.match(out, /\n {2}- \*\*Bug Fixes\*\*\n {4}- \*\*x:\*\* small fix/);
});

test('enrichTopEntry is idempotent', () => {
  const opts = {
    depChangelogs: {
      '@stream-io/video-client': CLIENT_CL,
      '@stream-io/video-react-bindings': BINDINGS_CL,
    },
    runtimeDeps: RUNTIME_DEPS,
  };
  const once = enrichTopEntry(REACT_SDK_CL, opts);
  const twice = enrichTopEntry(once, opts);
  assert.equal(twice, once);
});

test('enrichTopEntry collapses a pure-passthrough dep (no duplicate client bullets)', () => {
  const out = enrichTopEntry(REACT_SDK_CL, {
    depChangelogs: {
      '@stream-io/video-client': CLIENT_CL,
      '@stream-io/video-react-bindings': BINDINGS_CL,
    },
    runtimeDeps: RUNTIME_DEPS,
  });
  // "keep user_id populated" comes from client; bindings forwarded it, so it must appear once.
  const occurrences = out.split('keep user_id populated').length - 1;
  assert.equal(occurrences, 1);
  // bindings bare line still present
  assert.match(
    out,
    /- `@stream-io\/video-react-bindings` updated to version `1\.16\.5`/,
  );
});

test('enrichTopEntry does not duplicate a change already in the SDK own sections', () => {
  // The same commit can land in both the upstream changelog and the SDK's own
  // sections (e.g. an ios fix in client AND react-native-sdk). It must not be
  // inlined under the dependency when the SDK already lists it.
  const dep = `# Changelog

## [1.53.1](compare) (2026-06-12)

### Bug Fixes

- **ios:** joining a call muted ([#2282](https://h/i/issues/2282)) ([dc672a6](https://h/i/commit/dc672a69971d6ca46648696c242609c687cb42d7))
- **client:** brand new client fix ([#9001](https://h/i/issues/9001)) ([abc1234](https://h/i/commit/abc1234def567890))
`;
  const sdk = `# Changelog

## [1.38.1](compare) (2026-06-12)

### Dependency Updates

- \`@stream-io/video-client\` updated to version \`1.53.1\`

### Bug Fixes

- **ios:** joining a call muted ([#2282](https://h/i/issues/2282)) ([dc672a6](https://h/i/commit/dc672a69971d6ca46648696c242609c687cb42d7))

## [1.38.0](compare) (2026-06-11)

### Dependency Updates

- \`@stream-io/video-client\` updated to version \`1.53.0\`
`;
  const out = enrichTopEntry(sdk, {
    depChangelogs: { '@stream-io/video-client': dep },
    runtimeDeps: ['@stream-io/video-client'],
  });
  // already in the SDK's own Bug Fixes -> must appear exactly once (not inlined again)
  const occurrences =
    out.split('dc672a69971d6ca46648696c242609c687cb42d7').length - 1;
  assert.equal(occurrences, 1);
  // the genuinely new upstream fix IS inlined
  assert.match(out, /brand new client fix/);
});

test('enrichTopEntry skips dev-only deps (not in runtimeDeps)', () => {
  const sdk = `# Changelog

## [1.0.1](compare) (2026-06-12)

### Dependency Updates

- \`@stream-io/audio-filters-web\` updated to version \`0.8.2\`
`;
  const depCl = `# Changelog

## [0.8.2](compare) (2026-06-12)

### Features

- **filters:** secret dev feature ([#1](https://github.com/x/y/issues/1)) ([deadbee](https://github.com/x/y/commit/deadbeef))
`;
  const out = enrichTopEntry(sdk, {
    depChangelogs: { '@stream-io/audio-filters-web': depCl },
    runtimeDeps: RUNTIME_DEPS, // audio-filters-web NOT included
  });
  assert.doesNotMatch(out, /secret dev feature/);
  assert.equal(out, sdk); // unchanged
});

test('enrichTopEntry is fail-safe: missing dep changelog leaves the bare line untouched', () => {
  const out = enrichTopEntry(REACT_SDK_CL, {
    depChangelogs: {}, // no changelogs available
    runtimeDeps: RUNTIME_DEPS,
  });
  assert.equal(out, REACT_SDK_CL);
});

test('enrichTopEntry returns input unchanged when top entry has no Dependency Updates', () => {
  const out = enrichTopEntry(CLIENT_CL, {
    depChangelogs: {},
    runtimeDeps: RUNTIME_DEPS,
  });
  assert.equal(out, CLIENT_CL);
});

// Backfill fixtures: a dependent with three historical entries, each bumping
// the client, and a client changelog with one entry per bumped version.
const SDK_MULTI = `# Changelog

## [1.2.0](compare) (2026-01-03)

### Dependency Updates

- \`@stream-io/video-client\` updated to version \`3.0.0\`

## [1.1.0](compare) (2026-01-02)

### Dependency Updates

- \`@stream-io/video-client\` updated to version \`2.0.0\`

## [1.0.0](compare) (2026-01-01)

### Dependency Updates

- \`@stream-io/video-client\` updated to version \`1.0.0\`
`;

const DEP_MULTI = `# Changelog

## [3.0.0](compare) (2026-01-03)

### Features

- **client:** feature three ([#3](https://h/i/issues/3)) ([ccc3333](https://h/i/commit/ccc3333000))

## [2.0.0](compare) (2026-01-02)

### Bug Fixes

- **client:** fix two ([#2](https://h/i/issues/2)) ([bbb2222](https://h/i/commit/bbb2222000))

## [1.0.0](compare) (2026-01-01)

### Features

- **client:** initial ([#1](https://h/i/issues/1)) ([aaa1111](https://h/i/commit/aaa1111000))
`;

test('enrichAllEntries enriches historical entries, not just the top', () => {
  const out = enrichAllEntries(SDK_MULTI, {
    depChangelogs: { '@stream-io/video-client': DEP_MULTI },
    runtimeDeps: ['@stream-io/video-client'],
  });
  // top entry (client 2.0.0 -> 3.0.0)
  assert.match(out, /feature three/);
  // historical middle entry (client 1.0.0 -> 2.0.0)
  assert.match(out, /fix two/);
  // oldest entry has no prior entry to resolve OLD from -> stays bare
  assert.doesNotMatch(out, /initial/);
  // every version header is preserved
  assert.match(out, /## \[1\.2\.0\]/);
  assert.match(out, /## \[1\.1\.0\]/);
  assert.match(out, /## \[1\.0\.0\]/);
});

test('enrichAllEntries is idempotent', () => {
  const opts = {
    depChangelogs: { '@stream-io/video-client': DEP_MULTI },
    runtimeDeps: ['@stream-io/video-client'],
  };
  const once = enrichAllEntries(SDK_MULTI, opts);
  assert.equal(enrichAllEntries(once, opts), once);
});
