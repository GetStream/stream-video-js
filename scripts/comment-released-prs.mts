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
 * The roll-up is read straight out of the enriched changelogs: a PR found in a
 * package's own Features / Bug Fixes is a "source" of that package; a PR found
 * only under the enriched `Dependency Updates` nested bullets is a "carrier".
 *
 * Written as TypeScript executed natively via Node's type stripping (Node 24+).
 */

import {
  parseEntries,
  parseOwnChanges,
} from './enrich-dependency-changelogs.mts';

// ---------------------------------------------------------------------------
// Pure core (unit-tested)
// ---------------------------------------------------------------------------

export const COMMENT_MARKER = '<!-- stream-release-comment -->';

export interface ReleasedPackage {
  name: string;
  version: string;
}

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

// Conventional-changelog links PR/issue refs as "[#2284](.../issues/2284)".
// Commit hashes use the same bracket form without the leading "#", so the "#"
// in the pattern keeps them out.
export function extractPrNumbers(text: string): number[] {
  const found = new Set<number>();
  const re = /\[#(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    found.add(Number(match[1]));
  }
  return [...found].sort((a, b) => a - b);
}

// Map each PR reference in the released packages' changelog top entries to the
// versions that ship it, split into source (own changes) and carrier
// (dependency-update nested bullets) roles.
export function buildReleaseRollup(
  released: ReleasedPackage[],
  changelogs: Record<string, string>,
): Map<number, PrRollup> {
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

  for (const { name, version } of released) {
    const text = changelogs[name];
    if (!text) continue;
    const entries = parseEntries(text);
    if (entries.length === 0) continue;
    const body = entries[0].body;

    const own = parseOwnChanges(body);
    const ownText = [...own.Features, ...own['Bug Fixes'], ...own.other].join(
      '\n',
    );
    const ownPrs = new Set(extractPrNumbers(ownText));
    const allPrs = extractPrNumbers(body);

    const pkg: PkgVersion = { name, version };
    for (const pr of allPrs) {
      add(pr, ownPrs.has(pr) ? 'sources' : 'carriers', pkg);
    }
  }

  for (const entry of result.values()) {
    entry.sources.sort((a, b) => a.name.localeCompare(b.name));
    entry.carriers.sort((a, b) => a.name.localeCompare(b.name));
  }
  return result;
}

function renderVersionLine(link: VersionLink): string {
  return `- \`${link.name}@${link.version}\` - [release notes](${link.releaseUrl}) | [npm](${link.npmUrl})`;
}

function renderGroups(sources: VersionLink[], carriers: VersionLink[]): string {
  const parts: string[] = [];
  if (sources.length) {
    parts.push('**Shipped in**', ...sources.map(renderVersionLine));
  }
  if (carriers.length) {
    if (parts.length) parts.push('');
    parts.push(
      '**Available to SDK users in**',
      ...carriers.map(renderVersionLine),
    );
  }
  return parts.join('\n');
}

function renderComment(
  lead: string,
  sources: VersionLink[],
  carriers: VersionLink[],
): string {
  return [
    lead,
    '',
    renderGroups(sources, carriers),
    '',
    '<sub>Posted automatically when the release went out. 🤖</sub>',
    COMMENT_MARKER,
  ].join('\n');
}

export function renderPrComment(
  sources: VersionLink[],
  carriers: VersionLink[],
): string {
  return renderComment(
    '🎉 The changes from this pull request have been released.',
    sources,
    carriers,
  );
}

export function renderIssueComment(
  sources: VersionLink[],
  carriers: VersionLink[],
): string {
  return renderComment(
    '🎉 The fix for this issue has been released.',
    sources,
    carriers,
  );
}

// ---------------------------------------------------------------------------
// Impure shell + CLI (validated via --dry-run)
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

import { packagesReleasedInThisRun } from './enrich-dependency-changelogs.mts';

const REPO = 'GetStream/stream-video-js';

interface PackageInfo {
  dir: string;
  private: boolean;
}

// Run `gh`, returning trimmed stdout. Read calls pass allowFailure so a missing
// gh / network / auth degrades to a fallback rather than aborting the release.
function gh(args: string[], { allowFailure = false } = {}): string {
  try {
    return execFileSync('gh', args, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    if (allowFailure) return '';
    throw error;
  }
}

// name -> { dir, private } for every workspace package.
function loadPackages(packagesDir: string): Map<string, PackageInfo> {
  const map = new Map<string, PackageInfo>();
  for (const entry of readdirSync(packagesDir)) {
    const manifestPath = join(packagesDir, entry, 'package.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (manifest.name) {
      map.set(manifest.name, {
        dir: join(packagesDir, entry),
        private: manifest.private === true,
      });
    }
  }
  return map;
}

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

// Issues a PR closes (from "Fixes #N" / linked issues), same repo only.
function linkedIssues(pr: number): number[] {
  const out = gh(
    [
      'pr',
      'view',
      String(pr),
      '--json',
      'closingIssuesReferences',
      '-q',
      '.closingIssuesReferences[].number',
    ],
    { allowFailure: true },
  );
  return out ? out.split('\n').filter(Boolean).map(Number) : [];
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
  gh([kind, 'comment', String(number), '--body', body]);
  console.log(`+ ${kind} #${number}: comment posted`);
}

function readTopChangelogs(
  released: ReleasedPackage[],
  packages: Map<string, PackageInfo>,
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
  const packages = loadPackages(resolve(repoRoot, 'packages'));

  const released = packagesReleasedInThisRun().filter(
    (p) => !packages.get(p.name)?.private,
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
    const srcLinks = sources.map(linkFor);
    const carLinks = carriers.map(linkFor);
    postComment('pr', pr, renderPrComment(srcLinks, carLinks), dryRun);
    for (const issue of linkedIssues(pr)) {
      postComment(
        'issue',
        issue,
        renderIssueComment(srcLinks, carLinks),
        dryRun,
      );
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
