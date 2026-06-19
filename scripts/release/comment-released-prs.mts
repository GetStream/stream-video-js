#!/usr/bin/env node

/**
 * Post a "shipped in release" comment on every released PR and the GitHub
 * issues it closes, with a consumer-facing roll-up of the versions that ship
 * the change.
 *
 * Runs as a tail step of the root `release` script, after `nx run-many` (so npm
 * publish and the GitHub releases exist and the SDK working-tree changelogs are
 * already enriched by the enrich-changelog postTargets) and before the enrich
 * `--finalize` commit (so `packagesReleasedInThisRun` still sees the release
 * commits at HEAD).
 *
 * The roll-up is read straight out of the changelogs without needing them to be
 * enriched: a PR in a package's own changes (Features / Bug Fixes / Chores /
 * ...) makes that package a "source"; a package whose bare `Dependency Updates`
 * line bumps a released source package to its released version is a "carrier" of
 * that source's PRs.
 *
 * Written as TypeScript executed natively via Node's type stripping (Node 24+).
 */

import {
  parseDependencyUpdates,
  parseEntries,
  parseOwnChanges,
} from './lib/changelog.mts';
import type { ReleasedPackage } from './lib/released-packages.mts';

// ---------------------------------------------------------------------------
// Pure core (unit-tested)
// ---------------------------------------------------------------------------

export const COMMENT_MARKER = '<!-- stream-release-comment -->';

export interface PkgVersion {
  name: string;
  version: string;
}

export interface VersionLink {
  name: string;
  version: string;
  releaseUrl: string;
  npmUrl: string;
}

export interface PrRollup {
  sources: PkgVersion[];
  carriers: PkgVersion[];
}

// Extract the PR number from each changelog bullet. Conventional-changelog links
// the PR as "[#2284](.../issues/2284)" and the commit hash as "[4403348](...)"
// (no leading "#", so it never matches). A bullet can also carry trailing
// "closes [#N]" issue references; those are not the PR that shipped the change,
// so only the first "[#N]" per line (the PR ref) is taken.
export function extractPrNumbers(text: string): number[] {
  const found = new Set<number>();
  for (const line of text.split('\n')) {
    const match = line.match(/\[#(\d+)\]/);
    if (match) found.add(Number(match[1]));
  }
  return [...found].sort((a, b) => a - b);
}

// Map each released PR to the versions that ship it. A "source" is a package
// whose own changes list the PR. A "carrier" is a package whose top entry bumps
// a released source package to its released version, read from the bare
// `Dependency Updates` lines so no changelog enrichment is required.
export function buildReleaseRollup(
  released: ReleasedPackage[],
  changelogs: Record<string, string>,
): Map<number, PrRollup> {
  const releasedVersion = new Map<string, string>();
  const ownPrs = new Map<string, number[]>();
  const depBumps = new Map<string, { name: string; version: string }[]>();

  for (const { name, version } of released) {
    releasedVersion.set(name, version);
    const entries = changelogs[name] ? parseEntries(changelogs[name]) : [];
    const body = entries[0]?.body ?? '';
    const own = parseOwnChanges(body);
    const ownText = [...own.Features, ...own['Bug Fixes'], ...own.other].join(
      '\n',
    );
    ownPrs.set(name, extractPrNumbers(ownText));
    depBumps.set(name, parseDependencyUpdates(body));
  }

  const result = new Map<number, PrRollup>();
  const add = (pr: number, role: 'sources' | 'carriers', pkg: PkgVersion) => {
    let entry = result.get(pr);
    if (!entry) {
      entry = { sources: [], carriers: [] };
      result.set(pr, entry);
    }
    const bucket = entry[role];
    if (!bucket.some((p) => p.name === pkg.name)) bucket.push(pkg);
  };

  // Sources: each released package owns its own PRs.
  for (const { name, version } of released) {
    for (const pr of ownPrs.get(name) ?? []) {
      add(pr, 'sources', { name, version });
    }
  }

  // Carriers: a package that bumps a released source package to its released
  // version ships that source package's PRs.
  for (const { name, version } of released) {
    for (const dep of depBumps.get(name) ?? []) {
      if (releasedVersion.get(dep.name) !== dep.version) continue;
      for (const pr of ownPrs.get(dep.name) ?? []) {
        add(pr, 'carriers', { name, version });
      }
    }
  }

  for (const entry of result.values()) {
    const sourceNames = new Set(entry.sources.map((p) => p.name));
    entry.carriers = entry.carriers.filter((p) => !sourceNames.has(p.name));
    entry.sources.sort((a, b) => a.name.localeCompare(b.name));
    entry.carriers.sort((a, b) => a.name.localeCompare(b.name));
  }
  return result;
}

function renderVersionLine(link: VersionLink): string {
  return `- \`${link.name}@${link.version}\` - [release notes](${link.releaseUrl}) | [npm](${link.npmUrl})`;
}

function renderComment(lead: string, versions: VersionLink[]): string {
  return [
    lead,
    '',
    '**Shipped with:**',
    ...versions.map(renderVersionLine),
    '',
    COMMENT_MARKER,
  ].join('\n');
}

export function renderPrComment(versions: VersionLink[]): string {
  return renderComment(
    '🎉 The changes from this pull request have been released.',
    versions,
  );
}

export function renderIssueComment(versions: VersionLink[]): string {
  return renderComment(
    '🎉 The fix for this issue has been released.',
    versions,
  );
}

// Keep only the closing-issue numbers that live in `repo`, parsed from the JSON
// that `gh pr view --json closingIssuesReferences` emits. A PR can close an
// issue in another repository (changelogs here reference other GetStream repos);
// commenting on a same-number issue in this repo would be wrong, so cross-repo
// references are dropped.
export function sameRepoIssueNumbers(
  closingRefsJson: string,
  repo: string,
): number[] {
  try {
    const data = JSON.parse(closingRefsJson) as {
      closingIssuesReferences?: { number?: number; url?: string }[];
    };
    const prefix = `https://github.com/${repo}/`;
    return (data.closingIssuesReferences ?? [])
      .filter(
        (ref) => typeof ref.url === 'string' && ref.url.startsWith(prefix),
      )
      .map((ref) => ref.number)
      .filter((n): n is number => typeof n === 'number');
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Impure shell + CLI (validated via --dry-run)
// ---------------------------------------------------------------------------

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

import { gh } from './lib/exec.mts';
import { loadWorkspacePackages, type Workspace } from './lib/workspace.mts';
import { packagesReleasedInThisRun } from './lib/released-packages.mts';

const REPO = 'GetStream/stream-video-js';

function npmUrl(name: string, version: string): string {
  return `https://www.npmjs.com/package/${name}/v/${version}`;
}

// Resolve the canonical GitHub release URL for a package version; fall back to
// the deterministic tag URL if gh is unavailable. Tags are `<name>-<version>`.
function resolveReleaseUrl(name: string, version: string): string {
  const tag = `${name}-${version}`;
  const url = gh(['release', 'view', tag, '--json', 'url', '-q', '.url'], {
    allowFailure: true,
  });
  return (
    url || `https://github.com/${REPO}/releases/tag/${encodeURIComponent(tag)}`
  );
}

function toVersionLink(pkg: PkgVersion): VersionLink {
  return {
    name: pkg.name,
    version: pkg.version,
    releaseUrl: resolveReleaseUrl(pkg.name, pkg.version),
    npmUrl: npmUrl(pkg.name, pkg.version),
  };
}

// Issue numbers a PR closes, restricted to this repository (cross-repo closing
// references are dropped by sameRepoIssueNumbers).
function linkedIssues(pr: number): number[] {
  const out = gh(
    ['pr', 'view', String(pr), '--json', 'closingIssuesReferences'],
    { allowFailure: true },
  );
  return out ? sameRepoIssueNumbers(out, REPO) : [];
}

function alreadyCommented(kind: 'pr' | 'issue', number: number): boolean {
  const out = gh(
    [
      kind,
      'view',
      String(number),
      '--json',
      'comments',
      '-q',
      '.comments[].body',
    ],
    { allowFailure: true },
  );
  return out.includes(COMMENT_MARKER);
}

function postComment(
  kind: 'pr' | 'issue',
  number: number,
  body: string,
  dryRun: boolean,
): void {
  if (dryRun) {
    console.log(`\n--- ${kind} #${number} (dry run) ---\n${body}\n`);
    return;
  }
  if (alreadyCommented(kind, number)) {
    console.log(`= ${kind} #${number}: already announced, skipping`);
    return;
  }
  try {
    gh([kind, 'comment', String(number), '--body', body]);
    console.log(`+ ${kind} #${number}: comment posted`);
  } catch (error) {
    // One bad target (a number that is an issue rather than a PR, or a
    // transient GitHub error) must not abort the remaining notifications.
    console.warn(
      `WARN: failed to comment on ${kind} #${number}: ${(error as Error).message}`,
    );
  }
}

function readTopChangelogs(
  released: ReleasedPackage[],
  packages: Workspace,
): Record<string, string> {
  const changelogs: Record<string, string> = {};
  for (const { name } of released) {
    const info = packages.get(name);
    if (!info) continue;
    const changelogPath = join(info.dir, 'CHANGELOG.md');
    if (existsSync(changelogPath)) {
      changelogs[name] = readFileSync(changelogPath, 'utf8');
    }
  }
  return changelogs;
}

function run(dryRun: boolean): void {
  const repoRoot = process.cwd();
  const packages = loadWorkspacePackages(resolve(repoRoot, 'packages'));

  const released = packagesReleasedInThisRun().filter(
    (p) => !packages.get(p.name)?.manifest.private,
  );
  if (released.length === 0) {
    console.log('No published packages released at HEAD. Nothing to comment.');
    return;
  }
  console.log(
    `Released this run: ${released.map((r) => `${r.name}@${r.version}`).join(', ')}`,
  );

  const changelogs = readTopChangelogs(released, packages);
  const rollup = buildReleaseRollup(released, changelogs);
  if (rollup.size === 0) {
    console.log('No PR references found in the released changelogs.');
    return;
  }

  // Resolve each unique package version's links once.
  const linkCache = new Map<string, VersionLink>();
  const linkFor = (pkg: PkgVersion): VersionLink => {
    const key = `${pkg.name}@${pkg.version}`;
    let link = linkCache.get(key);
    if (!link) {
      link = toVersionLink(pkg);
      linkCache.set(key, link);
    }
    return link;
  };

  for (const [pr, { sources, carriers }] of rollup) {
    // Sources first (where the change originated), then the packages that carry
    // it; they are disjoint, so the merged list has no duplicate package.
    const versions = [...sources, ...carriers].map(linkFor);
    postComment('pr', pr, renderPrComment(versions), dryRun);
    for (const issue of linkedIssues(pr)) {
      postComment('issue', issue, renderIssueComment(versions), dryRun);
    }
  }
}

function main(): void {
  const dryRun = process.argv.includes('--dry-run');
  try {
    run(dryRun);
  } catch (error) {
    // Non-fatal: the release already succeeded. Never fail CI over a comment.
    console.warn(
      `WARN: comment-released-prs failed: ${(error as Error).message}`,
    );
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === invokedPath) {
  main();
}
