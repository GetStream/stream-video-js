/**
 * Single entry point for publishing a workspace package to npm.
 *
 * Centralises two concerns that were previously spread across eleven
 * `release:*` one-liners in the root package.json:
 *
 * - The npm dist-tag, read from NPM_DIST_TAG (default `latest`). It cannot be
 *   declared in package.json, because yarn 4 does not read
 *   `publishConfig.tag`, and it cannot be passed on the command line, because
 *   the `publish` postTargets set `forwardAllArgs: false`.
 * - A version-shape assertion, run before the publish, so a version that does
 *   not belong to the branch's release line fails the release instead of
 *   reaching npm.
 *
 * The assertion guards two silent and irreversible mistakes:
 *
 * - Publishing a prerelease to `latest`, which downgrades every consumer that
 *   tracks the stable line.
 * - Publishing a stable version to a prerelease tag. The version executor
 *   computes a stable version whenever a package has dependency updates but no
 *   qualifying commits of its own, because `semver.inc('2.0.0-beta.3', 'patch')`
 *   is `2.0.0` - which would ship a final 2.0.0 long before it is ready.
 *
 * The expected shape is derived from the package's own version target rather
 * than hardcoded, so this file is correct on every release branch: a package
 * configured with a `preid` must publish a matching prerelease, and anything
 * published to `latest` must be stable.
 *
 * Written as TypeScript executed natively via Node's type stripping (Node 24+).
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import semver from 'semver';

import { loadWorkspacePackages } from './lib/workspace.mts';

export const DEFAULT_DIST_TAG = 'latest';

export interface AssertPublishableInput {
  packageName: string;
  version: string;
  distTag: string;
  // The `preid` configured on the package's version target, when it releases on
  // a prerelease line. Null for packages that release stable versions.
  preid: string | null;
}

// Read the `preid` from a package's nx version target, or null when unset.
export function readPreid(projectJsonPath: string): string | null {
  if (!existsSync(projectJsonPath)) return null;
  const project = JSON.parse(readFileSync(projectJsonPath, 'utf8')) as {
    targets?: { version?: { options?: { preid?: string } } };
  };
  return project.targets?.version?.options?.preid ?? null;
}

// Throw unless `version` belongs on `distTag` for this package. Kept pure so
// the release-blocking rules are directly testable.
export function assertPublishable({
  packageName,
  version,
  distTag,
  preid,
}: AssertPublishableInput): void {
  if (!distTag) {
    throw new Error(
      `Refusing to publish ${packageName}: no npm dist-tag resolved. ` +
        `Set NPM_DIST_TAG for this branch.`,
    );
  }

  const parsed = semver.parse(version);
  if (!parsed) {
    throw new Error(
      `Refusing to publish ${packageName}: "${version}" is not a valid semver version.`,
    );
  }

  const prerelease = parsed.prerelease;

  if (distTag === DEFAULT_DIST_TAG && prerelease.length > 0) {
    throw new Error(
      `Refusing to publish ${packageName}@${version} to "${DEFAULT_DIST_TAG}": ` +
        `it is a prerelease, and publishing it would move "${DEFAULT_DIST_TAG}" ` +
        `off the stable line and downgrade consumers.`,
    );
  }

  if (preid === null) return;

  if (prerelease.length === 0) {
    throw new Error(
      `Refusing to publish ${packageName}@${version} to "${distTag}": ` +
        `this package releases on the "${preid}" prerelease line, but the ` +
        `computed version is stable. This usually means the version executor ` +
        `fell back to a plain patch bump, which drops the prerelease suffix.`,
    );
  }

  if (prerelease[0] !== preid) {
    throw new Error(
      `Refusing to publish ${packageName}@${version} to "${distTag}": ` +
        `expected a "${preid}" prerelease, got "${prerelease[0]}".`,
    );
  }
}

function main(): void {
  const packageName = process.argv[2];
  if (!packageName) {
    console.error('usage: node scripts/release/publish.mts <package-name>');
    process.exit(1);
  }

  const distTag = process.env.NPM_DIST_TAG ?? DEFAULT_DIST_TAG;
  const workspace = loadWorkspacePackages(join(process.cwd(), 'packages'));
  const pkg = workspace.get(packageName);
  if (!pkg) {
    console.error(`Unknown workspace package: ${packageName}`);
    process.exit(1);
  }
  if (!pkg.manifest.version) {
    console.error(`${packageName} has no version in its package.json`);
    process.exit(1);
  }

  assertPublishable({
    packageName,
    version: pkg.manifest.version,
    distTag,
    preid: readPreid(join(pkg.dir, 'project.json')),
  });

  console.log(
    `Publishing ${packageName}@${pkg.manifest.version} to dist-tag "${distTag}"`,
  );

  const result = spawnSync(
    'yarn',
    [
      'workspace',
      packageName,
      'npm',
      'publish',
      '--access=public',
      `--tag=${distTag}`,
    ],
    { stdio: 'inherit' },
  );
  process.exit(result.status ?? 1);
}

// Only run when invoked directly, so the assertions stay importable from tests.
if (process.argv[1]?.endsWith('publish.mts')) main();
