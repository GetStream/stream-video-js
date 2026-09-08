import { test } from 'node:test';
import assert from 'node:assert/strict';

import { assertPublishable, DEFAULT_DIST_TAG } from './publish.mts';

const base = { packageName: '@stream-io/video-client' };

test('a stable version publishes to latest', () => {
  assertPublishable({
    ...base,
    version: '1.59.0',
    distTag: DEFAULT_DIST_TAG,
    preid: null,
  });
});

test('a 0.x satellite publishes its stable version to latest', () => {
  assertPublishable({
    ...base,
    packageName: '@stream-io/video-filters-web',
    version: '0.8.7',
    distTag: DEFAULT_DIST_TAG,
    preid: null,
  });
});

test('a prerelease is refused on the latest dist-tag', () => {
  assert.throws(
    () =>
      assertPublishable({
        ...base,
        version: '2.0.0-beta.0',
        distTag: DEFAULT_DIST_TAG,
        preid: 'beta',
      }),
    /prerelease.*downgrade consumers/s,
  );
});

test('a matching prerelease publishes to its prerelease tag', () => {
  assertPublishable({
    ...base,
    version: '2.0.0-beta.3',
    distTag: 'beta',
    preid: 'beta',
  });
});

// The regression this guard exists for: semver.inc('2.0.0-beta.3', 'patch') is
// '2.0.0', so a dependency-only bump on the beta line yields a stable version.
test('a stable version is refused when the package releases on a prerelease line', () => {
  assert.throws(
    () =>
      assertPublishable({
        ...base,
        version: '2.0.0',
        distTag: 'beta',
        preid: 'beta',
      }),
    /computed version is stable/,
  );
});

test('a prerelease with the wrong preid is refused', () => {
  assert.throws(
    () =>
      assertPublishable({
        ...base,
        version: '2.0.0-alpha.1',
        distTag: 'beta',
        preid: 'beta',
      }),
    /expected a "beta" prerelease, got "alpha"/,
  );
});

test('a satellite on a stable line may publish to a prerelease tag', () => {
  // Packages without a configured preid keep their own stable line even when
  // the branch publishes under a prerelease dist-tag.
  assertPublishable({
    ...base,
    packageName: '@stream-io/react-native-callingx',
    version: '0.11.0',
    distTag: 'beta',
    preid: null,
  });
});

test('an unresolved dist-tag is refused', () => {
  assert.throws(
    () =>
      assertPublishable({
        ...base,
        version: '1.59.0',
        distTag: '',
        preid: null,
      }),
    /no npm dist-tag resolved/,
  );
});

test('an invalid version is refused', () => {
  assert.throws(
    () =>
      assertPublishable({
        ...base,
        version: 'not-a-version',
        distTag: DEFAULT_DIST_TAG,
        preid: null,
      }),
    /not a valid semver version/,
  );
});
