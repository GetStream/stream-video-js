import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import semver from 'semver';

/**
 * Guards the v2 prerelease configuration.
 *
 * Every publishable package on `main` releases on a `beta` prerelease line, so
 * its versions can never collide with what `release-v1` publishes from the same
 * tag namespace. The two lines carry different majors:
 *
 * - the core SDK packages on `2.0.0-beta.N`
 * - the satellites on `1.0.0-beta.N`, while `release-v1` keeps them on 0.x
 *
 * The collision this prevents is not hypothetical: before the satellites moved,
 * both branches computed `video-filters-web@0.9.0` and `callingx@0.11.1`, and
 * whichever published second would have been rejected as an overwrite.
 *
 * Each of these is a single line in a project.json that is easy to break
 * silently, so every part of the split is asserted here.
 */

// Carry the v2 major together on the 2.0.0-beta.N line.
const CORE_PACKAGES = [
  'client',
  'react-sdk',
  'react-bindings',
  'react-native-sdk',
  'styling',
];

// On their own 1.0.0-beta.N line, disjoint from release-v1's 0.x.
const SATELLITE_PACKAGES = [
  'audio-filters-web',
  'video-filters-web',
  'video-filters-react-native',
  'noise-cancellation-react-native',
  'react-native-callingx',
  'codemod',
];

// Never publishes, so it cannot collide and needs no prerelease line.
const UNPUBLISHED_PACKAGES = ['typescript-config'];

const BETA_LINE_PACKAGES = [...CORE_PACKAGES, ...SATELLITE_PACKAGES];

// The satellite peers that react-native-sdk declares as literal ranges. Yarn
// only rewrites `workspace:` specs at pack time, so these ship verbatim and
// must admit the satellites' prerelease versions.
const RN_SATELLITE_PEERS = [
  '@stream-io/noise-cancellation-react-native',
  '@stream-io/react-native-callingx',
  '@stream-io/video-filters-react-native',
];

interface ProjectJson {
  targets?: {
    version?: {
      options?: {
        releaseAs?: string;
        preid?: string;
        preset?: string | { preMajor?: boolean };
      };
    };
    github?: { options?: { prerelease?: boolean } };
  };
}

function readProject(pkg: string): ProjectJson {
  const path = join(process.cwd(), 'packages', pkg, 'project.json');
  return JSON.parse(readFileSync(path, 'utf8')) as ProjectJson;
}

function readManifest(pkg: string): {
  peerDependencies?: Record<string, string>;
} {
  const path = join(process.cwd(), 'packages', pkg, 'package.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}

test('every beta-line package releases on the beta preid', () => {
  for (const pkg of BETA_LINE_PACKAGES) {
    assert.equal(
      readProject(pkg).targets?.version?.options?.preid,
      'beta',
      `packages/${pkg} must set preid "beta" to release on a v2 prerelease line`,
    );
  }
});

// `premajor` is single-use: it establishes the new major's beta.0, but applied
// again it walks the major forward. `prerelease` is the steady state and
// increments beta.N. Anything else silently leaves the beta line.
test('every beta-line package uses a supported releaseAs', () => {
  for (const pkg of BETA_LINE_PACKAGES) {
    const releaseAs = readProject(pkg).targets?.version?.options?.releaseAs;
    assert.ok(
      releaseAs === 'premajor' || releaseAs === 'prerelease',
      `packages/${pkg} has releaseAs "${releaseAs}", expected "premajor" (bootstrap) or "prerelease" (steady state)`,
    );
  }
});

// The core line is already bootstrapped at 2.0.0-beta.0, so `premajor` there
// would compute 3.0.0-beta.0.
test('the core packages use the steady-state releaseAs', () => {
  for (const pkg of CORE_PACKAGES) {
    const releaseAs = readProject(pkg).targets?.version?.options?.releaseAs;
    assert.equal(
      releaseAs,
      'prerelease',
      `packages/${pkg} has releaseAs "${releaseAs}"; the core v2 line is bootstrapped, so it must be "prerelease"`,
    );
  }
});

// Drift within a group would split it across two majors, and because
// workspace:* publishes as an exact pin, a mismatched set is a broken install.
test('each group shares one releaseAs', () => {
  for (const [label, group] of [
    ['core', CORE_PACKAGES],
    ['satellite', SATELLITE_PACKAGES],
  ] as const) {
    const values = new Set(
      group.map((pkg) => readProject(pkg).targets?.version?.options?.releaseAs),
    );
    assert.equal(
      values.size,
      1,
      `the ${label} packages must all use the same releaseAs, found: ${[...values].join(', ')}`,
    );
  }
});

test('beta-line GitHub releases are marked as prereleases', () => {
  for (const pkg of BETA_LINE_PACKAGES) {
    assert.equal(
      readProject(pkg).targets?.github?.options?.prerelease,
      true,
      `packages/${pkg} must set prerelease on its github target, or beta releases outrank the 1.x releases on the repo page`,
    );
  }
});

// preMajor demotes a bump one level, treating BREAKING CHANGE as minor and feat
// as patch. That is a sub-1.0.0 assumption and is wrong once a package is on a
// 1.x line.
test('no beta-line package still assumes a pre-1.0 version', () => {
  for (const pkg of BETA_LINE_PACKAGES) {
    const preset = readProject(pkg).targets?.version?.options?.preset;
    if (typeof preset === 'string') continue;
    assert.notEqual(
      preset?.preMajor,
      true,
      `packages/${pkg} is on a 1.x or later line, so preset.preMajor must not be true`,
    );
  }
});

test('unpublished packages stay off the beta line', () => {
  for (const pkg of UNPUBLISHED_PACKAGES) {
    const options = readProject(pkg).targets?.version?.options;
    assert.equal(
      options?.preid,
      undefined,
      `packages/${pkg} never publishes and must not set a preid`,
    );
    assert.equal(
      options?.releaseAs,
      undefined,
      `packages/${pkg} never publishes and must not set releaseAs`,
    );
  }
});

// A prerelease only satisfies a range carrying a prerelease at the same version
// tuple, so the old `>=0.1.0` peers silently excluded every 1.0.0-beta.N
// satellite and would have left consumers with unmet peer dependencies.
test('the RN SDK peer ranges admit the satellite beta line', () => {
  const peers = readManifest('react-native-sdk').peerDependencies ?? {};
  for (const dep of RN_SATELLITE_PEERS) {
    const range = peers[dep];
    assert.ok(range, `react-native-sdk must declare a peer range for ${dep}`);
    assert.ok(
      semver.satisfies('1.0.0-beta.0', range),
      `react-native-sdk peer range "${range}" for ${dep} excludes 1.0.0-beta.0`,
    );
    // Must keep working once the satellites graduate to stable.
    assert.ok(
      semver.satisfies('1.0.0', range),
      `react-native-sdk peer range "${range}" for ${dep} excludes the stable 1.0.0`,
    );
  }
});
