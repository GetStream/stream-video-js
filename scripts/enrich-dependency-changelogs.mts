#!/usr/bin/env node

/**
 * Enrich SDK changelogs with the upstream changes behind a dependency bump.
 *
 * @jscutlery/semver emits a bare "### Dependency Updates" block when a package
 * is versioned only because a workspace dependency changed, e.g.
 *
 *   ### Dependency Updates
 *   - `@stream-io/video-client` updated to version `1.53.2`
 *
 * That tells a customer nothing about what actually changed. This script reads
 * the upstream package's own CHANGELOG.md and inlines the relevant Features /
 * Bug Fixes underneath each runtime dependency line, so the dependent SDK's
 * changelog explains the change.
 *
 * Modes:
 *   --package <name>   Enrich one package's working-tree CHANGELOG.md top entry
 *                      in place (used as a pre-publish step so the npm tarball
 *                      ships the enriched file). No git, no GitHub.
 *   --finalize         Enrich every package released in the current run, make a
 *                      single follow-up commit, push, then update each GitHub
 *                      release body. Run after `nx run-many --target version`.
 *
 * The transform is additive and idempotent: the bare dependency lines are the
 * source of truth and are never removed; nested detail is regenerated on every
 * run. Any failure for a dependency leaves its bare line untouched.
 *
 * Written as TypeScript executed natively via Node's type stripping (Node 24+).
 */

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChangelogEntry {
  version: string;
  date: string;
  headerLine: string;
  body: string;
}

interface DependencyUpdate {
  name: string;
  version: string;
}

interface OwnChanges {
  Features: string[];
  'Bug Fixes': string[];
  other: string[];
}

interface ChangeGroups {
  Features: string[];
  'Bug Fixes': string[];
  Other: string[];
}

interface EnrichOptions {
  depChangelogs?: Record<string, string>;
  runtimeDeps?: string[];
}

interface PackageManifest {
  name?: string;
  dependencies?: Record<string, string>;
}

interface WorkspacePackage {
  dir: string;
  manifest: PackageManifest;
}

type Workspace = Map<string, WorkspacePackage>;

interface ReleasedPackage {
  name: string;
  version: string;
}

// ---------------------------------------------------------------------------
// Pure changelog transform (unit-tested)
// ---------------------------------------------------------------------------

const VERSION_HEADER_RE =
  /^## \[(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\]\([^)]*\)(?:\s*\(([^)]*)\))?/;
const DEP_LINE_RE = /^[-*]\s+`([^`]+)`\s+updated to version\s+`([^`]+)`\s*$/;
const SECTION_LABELS: (keyof ChangeGroups)[] = [
  'Features',
  'Bug Fixes',
  'Other',
];

// Split a CHANGELOG into version entries, newest first.
export function parseEntries(text: string): ChangelogEntry[] {
  const chunks = text.split(/^(?=## \[)/m);
  const entries: ChangelogEntry[] = [];
  for (const chunk of chunks) {
    const match = chunk.match(VERSION_HEADER_RE);
    if (!match) continue;
    const newlineIndex = chunk.indexOf('\n');
    const headerLine =
      newlineIndex === -1 ? chunk : chunk.slice(0, newlineIndex);
    const body = newlineIndex === -1 ? '' : chunk.slice(newlineIndex + 1);
    entries.push({ version: match[1], date: match[2] || '', headerLine, body });
  }
  return entries;
}

// Return the text under a "### <title>" sub-section, or null when absent.
function extractSection(body: string, title: string): string | null {
  const lines = body.split('\n');
  let found = false;
  let capturing = false;
  const out: string[] = [];
  for (const line of lines) {
    const heading = line.match(/^###\s+(.+?)\s*$/);
    if (heading) {
      capturing = heading[1] === title;
      if (capturing) found = true;
      continue;
    }
    if (capturing) out.push(line);
  }
  return found ? out.join('\n') : null;
}

// Parse the "### Dependency Updates" bullets into { name, version } pairs.
export function parseDependencyUpdates(body: string): DependencyUpdate[] {
  const section = extractSection(body, 'Dependency Updates');
  if (section === null) return [];
  const updates: DependencyUpdate[] = [];
  for (const line of section.split('\n')) {
    const match = line.match(DEP_LINE_RE);
    if (match) updates.push({ name: match[1], version: match[2] });
  }
  return updates;
}

// Normalize a bullet to a leading "- " marker and strip trailing whitespace.
function normalizeBullet(line: string): string {
  return line.replace(/^[-*]\s+/, '- ').replace(/\s+$/, '');
}

// Collect a version entry's own changes, ignoring its Dependency Updates block.
export function parseOwnChanges(body: string): OwnChanges {
  const result: OwnChanges = { Features: [], 'Bug Fixes': [], other: [] };
  let current = 'other';
  for (const line of body.split('\n')) {
    const heading = line.match(/^###\s+(.+?)\s*$/);
    if (heading) {
      current = heading[1];
      continue;
    }
    if (current === 'Dependency Updates') continue;
    if (!/^[-*]\s+/.test(line)) continue;
    const bullet = normalizeBullet(line);
    if (current === 'Features') result.Features.push(bullet);
    else if (current === 'Bug Fixes') result['Bug Fixes'].push(bullet);
    else if (current === 'other') result.other.push(bullet);
  }
  return result;
}

// Walk older entries to find the dependency version the SDK shipped before.
export function resolveOldDepVersion(
  entries: ChangelogEntry[],
  depName: string,
  fromIndex: number,
): string | null {
  for (let i = fromIndex + 1; i < entries.length; i += 1) {
    const hit = parseDependencyUpdates(entries[i].body).find(
      (dep) => dep.name === depName,
    );
    if (hit) return hit.version;
  }
  return null;
}

// Compare two semver strings by their numeric core (prerelease ignored).
function compareVersions(a: string, b: string): number {
  const pa = a.split('-')[0].split('.').map(Number);
  const pb = b.split('-')[0].split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// Upstream entries in the half-open range (oldVersion, newVersion], newest first.
export function collectUpstreamRange(
  depEntries: ChangelogEntry[],
  oldVersion: string,
  newVersion: string,
): ChangelogEntry[] {
  return depEntries.filter(
    (entry) =>
      compareVersions(entry.version, oldVersion) > 0 &&
      compareVersions(entry.version, newVersion) <= 0,
  );
}

// A stable identity for a bullet so the same change is not shown twice.
export function bulletIdentity(bullet: string): string {
  const commit = bullet.match(/\/commit\/([0-9a-f]{7,40})/);
  if (commit) return commit[1];
  const short = bullet.match(/\(\[([0-9a-f]{7,40})\]/);
  if (short) return short[1];
  return bullet.replace(/\s+/g, ' ').trim().toLowerCase();
}

// Render the nested markdown lines for one dependency's collected changes.
function renderNested(groups: ChangeGroups): string[] {
  const present = SECTION_LABELS.filter((label) => groups[label].length);
  if (present.length === 0) return [];
  const lines: string[] = [];
  if (present.length === 1) {
    for (const bullet of groups[present[0]]) {
      lines.push(`  ${normalizeBullet(bullet)}`);
    }
    return lines;
  }
  for (const label of present) {
    lines.push(`  - **${label}**`);
    for (const bullet of groups[label]) {
      lines.push(`    ${normalizeBullet(bullet)}`);
    }
  }
  return lines;
}

// Rewrite a single entry's region: normalize each dependency line, drop any
// previously injected nested lines, and inject fresh ones from renderMap.
function rewriteDependencyUpdates(
  entryText: string,
  renderMap: Map<string, string[]>,
): string {
  const lines = entryText.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const match = lines[i].match(DEP_LINE_RE);
    if (!match) {
      out.push(lines[i]);
      i += 1;
      continue;
    }
    out.push(`- \`${match[1]}\` updated to version \`${match[2]}\``);
    i += 1;
    while (i < lines.length && /^\s{2,}\S/.test(lines[i])) i += 1;
    const nested = renderMap.get(match[1]);
    if (nested && nested.length) out.push(...nested);
  }
  return out.join('\n');
}

/**
 * Enrich the top (most recent) entry of an SDK changelog by inlining the
 * upstream changes behind each runtime dependency bump. Returns the input
 * unchanged when there is nothing to enrich, and is safe to run repeatedly.
 */
export function enrichTopEntry(
  sdkText: string,
  { depChangelogs = {}, runtimeDeps = [] }: EnrichOptions = {},
): string {
  try {
    const entries = parseEntries(sdkText);
    if (entries.length === 0) return sdkText;

    const top = entries[0];
    const deps = parseDependencyUpdates(top.body);
    if (deps.length === 0) return sdkText;

    const runtimeSet = new Set(runtimeDeps);
    const seen = new Set<string>();
    // Seed with the SDK entry's own changes so an upstream change the SDK
    // already documents itself is not inlined a second time under a dependency.
    const ownTop = parseOwnChanges(top.body);
    for (const bullet of [
      ...ownTop.Features,
      ...ownTop['Bug Fixes'],
      ...ownTop.other,
    ]) {
      seen.add(bulletIdentity(bullet));
    }
    const renderMap = new Map<string, string[]>();

    for (const dep of deps) {
      if (!runtimeSet.has(dep.name)) continue;
      const depText = depChangelogs[dep.name];
      if (!depText) continue;
      const oldVersion = resolveOldDepVersion(entries, dep.name, 0);
      if (!oldVersion) continue;

      const range = collectUpstreamRange(
        parseEntries(depText),
        oldVersion,
        dep.version,
      );
      const groups: ChangeGroups = { Features: [], 'Bug Fixes': [], Other: [] };
      for (const entry of range) {
        const own = parseOwnChanges(entry.body);
        const buckets: [keyof ChangeGroups, string[]][] = [
          ['Features', own.Features],
          ['Bug Fixes', own['Bug Fixes']],
          ['Other', own.other],
        ];
        for (const [label, bullets] of buckets) {
          for (const bullet of bullets) {
            const id = bulletIdentity(bullet);
            if (seen.has(id)) continue;
            seen.add(id);
            groups[label].push(bullet);
          }
        }
      }
      const nested = renderNested(groups);
      if (nested.length) renderMap.set(dep.name, nested);
    }

    const topStart = sdkText.indexOf(top.headerLine);
    const topEnd =
      entries.length > 1
        ? sdkText.indexOf(entries[1].headerLine)
        : sdkText.length;
    const rewritten = rewriteDependencyUpdates(
      sdkText.slice(topStart, topEnd),
      renderMap,
    );
    return sdkText.slice(0, topStart) + rewritten + sdkText.slice(topEnd);
  } catch {
    return sdkText;
  }
}

// ---------------------------------------------------------------------------
// CLI orchestration (validated via --dry-run against the real changelogs)
// ---------------------------------------------------------------------------

const RELEASE_COMMIT_RE = /^chore\((.+)\): release version (.+)$/;
const TAG_PREFIX = '@stream-io/';
const COMMIT_MESSAGE =
  'chore(release): expand SDK changelogs with upstream dependency changes';

// Execute a command, returning trimmed stdout and surfacing failures clearly.
function run(
  command: string,
  args: string[],
  { allowFailure = false }: { allowFailure?: boolean } = {},
): string {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    if (allowFailure) return '';
    const err = error as { stdout?: unknown; stderr?: unknown };
    const details = [err.stdout, err.stderr].filter(Boolean).join('\n');
    throw new Error(
      `Command failed: ${[command, ...args].join(' ')}\n${details}`,
    );
  }
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function readText(path: string): string {
  return readFileSync(path, 'utf8');
}

function writeText(path: string, value: string): void {
  writeFileSync(path, value);
}

// Map every workspace package name to its directory and manifest.
function loadWorkspacePackages(packagesDir: string): Workspace {
  const map: Workspace = new Map();
  for (const entry of readdirSync(packagesDir)) {
    const manifestPath = join(packagesDir, entry, 'package.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = readJson<PackageManifest>(manifestPath);
    if (manifest.name) {
      map.set(manifest.name, { dir: join(packagesDir, entry), manifest });
    }
  }
  return map;
}

// Runtime workspace dependencies of a package (excludes devDependencies).
function runtimeWorkspaceDeps(
  manifest: PackageManifest,
  workspace: Workspace,
): string[] {
  return Object.keys(manifest.dependencies || {}).filter((name) =>
    workspace.has(name),
  );
}

// Build the depName -> CHANGELOG text map for a package's runtime deps.
function collectDepChangelogs(
  runtimeDeps: string[],
  workspace: Workspace,
): Record<string, string> {
  const changelogs: Record<string, string> = {};
  for (const name of runtimeDeps) {
    const changelogPath = join(workspace.get(name)!.dir, 'CHANGELOG.md');
    if (existsSync(changelogPath)) changelogs[name] = readText(changelogPath);
  }
  return changelogs;
}

// Best-effort prettier pass so the tarball matches the lint-staged commit.
function formatWithPrettier(changelogPath: string): void {
  try {
    run('yarn', ['prettier', '--write', changelogPath], {
      allowFailure: false,
    });
  } catch (error) {
    console.warn(
      `WARN: prettier failed for ${changelogPath}: ${(error as Error).message}`,
    );
  }
}

// Enrich one package's working-tree changelog. Returns true when it changed.
function enrichPackageChangelog(
  name: string,
  {
    workspace,
    dryRun,
    format,
  }: { workspace: Workspace; dryRun: boolean; format: boolean },
): boolean {
  const pkg = workspace.get(name);
  if (!pkg) {
    console.warn(`WARN: unknown package ${name}`);
    return false;
  }
  const changelogPath = join(pkg.dir, 'CHANGELOG.md');
  if (!existsSync(changelogPath)) return false;

  const runtimeDeps = runtimeWorkspaceDeps(pkg.manifest, workspace);
  const depChangelogs = collectDepChangelogs(runtimeDeps, workspace);
  const original = readText(changelogPath);
  const enriched = enrichTopEntry(original, { depChangelogs, runtimeDeps });

  if (enriched === original) {
    console.log(`= ${name}: no enrichment needed`);
    return false;
  }
  if (dryRun) {
    console.log(`\n--- ${name} (dry run, top entry preview) ---`);
    console.log(topEntryPreview(enriched));
    return true;
  }
  writeText(changelogPath, enriched);
  if (format) formatWithPrettier(changelogPath);
  console.log(`+ ${name}: changelog enriched`);
  return true;
}

// Reconstruct the top entry text (header + body) for previews / release notes.
function topEntryPreview(changelogText: string): string {
  const entries = parseEntries(changelogText);
  if (entries.length === 0) return '';
  const start = changelogText.indexOf(entries[0].headerLine);
  const end =
    entries.length > 1
      ? changelogText.indexOf(entries[1].headerLine)
      : changelogText.length;
  return changelogText.slice(start, end).trim();
}

// Packages released in this run: the trailing block of release commits at HEAD.
function packagesReleasedInThisRun(): ReleasedPackage[] {
  const log = run('git', ['log', '--format=%s', '-n', '60']);
  const released: ReleasedPackage[] = [];
  for (const subject of log.split('\n')) {
    const match = subject.match(RELEASE_COMMIT_RE);
    if (!match) break;
    released.push({ name: match[1], version: match[2] });
  }
  return released;
}

// Update a GitHub release body with the enriched top entry.
function updateGithubRelease(
  name: string,
  version: string,
  changelogPath: string,
  { dryRun }: { dryRun: boolean },
): void {
  const tag = `${TAG_PREFIX}${name.replace(TAG_PREFIX, '')}-${version}`;
  const notes = topEntryPreview(readText(changelogPath));
  if (dryRun) {
    console.log(`\n--- gh release edit ${tag} (dry run) ---\n${notes}`);
    return;
  }
  const tmp = mkdtempSync(join(tmpdir(), 'enrich-notes-'));
  try {
    const notesFile = join(tmp, 'notes.md');
    writeText(notesFile, `${notes}\n`);
    run('gh', ['release', 'edit', tag, '--notes-file', notesFile]);
    console.log(`+ updated GitHub release ${tag}`);
  } catch (error) {
    console.warn(
      `WARN: could not update release ${tag}: ${(error as Error).message}`,
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function finalize({
  workspace,
  dryRun,
}: {
  workspace: Workspace;
  dryRun: boolean;
}): void {
  const released = packagesReleasedInThisRun();
  if (released.length === 0) {
    console.log('No release commits at HEAD. Nothing to enrich.');
    return;
  }
  console.log(
    `Released this run: ${released.map((r) => `${r.name}@${r.version}`).join(', ')}`,
  );

  const changed: { name: string; changelogPath: string }[] = [];
  for (const { name } of released) {
    const pkg = workspace.get(name);
    if (!pkg) continue;
    if (enrichPackageChangelog(name, { workspace, dryRun, format: true })) {
      changed.push({ name, changelogPath: join(pkg.dir, 'CHANGELOG.md') });
    }
  }

  if (changed.length === 0) {
    console.log('No changelogs needed enrichment.');
    return;
  }

  if (dryRun) {
    console.log(
      `\n[dry run] would commit ${changed.length} changelog(s) and update releases`,
    );
  } else {
    run('git', ['add', ...changed.map((c) => c.changelogPath)]);
    run('git', ['commit', '-m', COMMIT_MESSAGE]);
    run('git', ['push']);
    console.log(`+ committed and pushed enriched changelogs`);
  }

  for (const { name, version } of released) {
    const pkg = workspace.get(name);
    if (!pkg) continue;
    if (!changed.some((c) => c.name === name)) continue;
    updateGithubRelease(name, version, join(pkg.dir, 'CHANGELOG.md'), {
      dryRun,
    });
  }
}

interface CliOptions {
  mode: 'package' | 'finalize' | null;
  package: string | null;
  dryRun: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { mode: null, package: null, dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--package') {
      options.mode = 'package';
      options.package = argv[i + 1] ?? null;
      i += 1;
    } else if (arg === '--finalize') {
      options.mode = 'finalize';
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelpAndExit(0);
    } else {
      printHelpAndExit(1, `Unknown argument: ${arg}`);
    }
  }
  if (!options.mode)
    printHelpAndExit(1, 'Specify --package <name> or --finalize.');
  if (options.mode === 'package' && !options.package) {
    printHelpAndExit(1, 'Missing value for --package.');
  }
  return options;
}

function printHelpAndExit(code: number, errorMessage?: string): never {
  if (errorMessage) console.error(`${errorMessage}\n`);
  console.log(`Enrich SDK changelogs with upstream dependency changes.

Usage:
  node scripts/enrich-dependency-changelogs.mts --package <name> [--dry-run]
  node scripts/enrich-dependency-changelogs.mts --finalize [--dry-run]

Options:
  --package <name>   Enrich one package's working-tree CHANGELOG.md (pre-publish).
  --finalize         Enrich released packages, commit, push, update GitHub releases.
  --dry-run          Print what would change without writing, committing, or pushing.
  --help, -h         Show this help.
`);
  process.exit(code);
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = process.cwd();
  const packagesDir = resolve(repoRoot, 'packages');
  const workspace = loadWorkspacePackages(packagesDir);

  if (options.mode === 'package') {
    enrichPackageChangelog(options.package!, {
      workspace,
      dryRun: options.dryRun,
      format: true,
    });
  } else {
    finalize({ workspace, dryRun: options.dryRun });
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === invokedPath) {
  main();
}
