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
