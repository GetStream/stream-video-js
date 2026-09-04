import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guards the v2 prerelease configuration.
 *
 * The five packages that carry the v2 major release together on the
 * `2.0.0-beta.N` line; every other package keeps its own independent version
 * line. Both halves of that split are easy to break silently in a project.json,
 * so they are asserted here.
 */

const V2_PACKAGES = [
  'client',
  'react-sdk',
  'react-bindings',
  'react-native-sdk',
  'styling',
];

// Packages that must stay on their own version line, never the v2 beta line.
const INDEPENDENT_PACKAGES = [
  'audio-filters-web',
  'video-filters-web',
  'video-filters-react-native',
  'noise-cancellation-react-native',
  'react-native-callingx',
  'codemod',
  'typescript-config',
];

interface ProjectJson {
  targets?: {
    version?: { options?: { releaseAs?: string; preid?: string } };
    github?: { options?: { prerelease?: boolean } };
  };
}

function readProject(pkg: string): ProjectJson {
  const path = join(process.cwd(), 'packages', pkg, 'project.json');
  return JSON.parse(readFileSync(path, 'utf8')) as ProjectJson;
}

test('every v2 package releases on the beta preid', () => {
  for (const pkg of V2_PACKAGES) {
    const options = readProject(pkg).targets?.version?.options;
    assert.equal(
      options?.preid,
      'beta',
      `packages/${pkg} must set preid "beta" to release on the v2 line`,
    );
  }
});

// The bootstrap is done: 2.0.0-beta.0 is published, so `premajor` must no
// longer appear. From 2.0.0-beta.0 it would yield 3.0.0-beta.0. `prerelease` is
// the steady state and increments beta.N.
test('every v2 package uses the steady-state releaseAs', () => {
  for (const pkg of V2_PACKAGES) {
    const releaseAs = readProject(pkg).targets?.version?.options?.releaseAs;
    assert.equal(
      releaseAs,
      'prerelease',
      `packages/${pkg} has releaseAs "${releaseAs}"; the v2 line is bootstrapped, so it must be "prerelease"`,
    );
  }
});

// Drift here would split the five across two majors, and because workspace:*
// publishes as an exact pin, a mismatched set is a broken install.
test('the v2 packages share one releaseAs', () => {
  const values = new Set(
    V2_PACKAGES.map(
      (pkg) => readProject(pkg).targets?.version?.options?.releaseAs,
    ),
  );
  assert.equal(
    values.size,
    1,
    `the v2 packages must all use the same releaseAs, found: ${[...values].join(', ')}`,
  );
});

test('v2 GitHub releases are marked as prereleases', () => {
  for (const pkg of V2_PACKAGES) {
    assert.equal(
      readProject(pkg).targets?.github?.options?.prerelease,
      true,
      `packages/${pkg} must set prerelease on its github target, or beta releases outrank the 1.x releases on the repo page`,
    );
  }
});

test('independent packages stay off the v2 beta line', () => {
  for (const pkg of INDEPENDENT_PACKAGES) {
    const options = readProject(pkg).targets?.version?.options;
    assert.equal(
      options?.preid,
      undefined,
      `packages/${pkg} keeps its own version line and must not set a preid`,
    );
    assert.equal(
      options?.releaseAs,
      undefined,
      `packages/${pkg} keeps its own version line and must not set releaseAs`,
    );
  }
});
