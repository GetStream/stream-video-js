/**
 * Detect the packages versioned in the current release run, shared by the
 * release scripts. @jscutlery/semver appends one "chore(<scope>): release
 * version <x>" commit per package during `nx run-many --target version`, so the
 * trailing block of such commits at HEAD is exactly this run's releases.
 *
 * Written as TypeScript executed natively via Node's type stripping (Node 24+).
 */

import { run } from './exec.mts';

export interface ReleasedPackage {
  name: string;
  version: string;
}

const RELEASE_COMMIT_RE = /^chore\((.+)\): release version (.+)$/;

// Packages released in this run: the trailing block of release commits at HEAD.
export function packagesReleasedInThisRun(): ReleasedPackage[] {
  const log = run('git', ['log', '--format=%s', '-n', '60']);
  const released: ReleasedPackage[] = [];
  for (const subject of log.split('\n')) {
    const match = subject.match(RELEASE_COMMIT_RE);
    if (!match) break;
    released.push({ name: match[1], version: match[2] });
  }
  return released;
}
