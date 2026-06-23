#!/usr/bin/env node

/**
 * Measure the built bundle size of each publishable package (its esm build, or
 * cjs where there is no esm) and - on a pull request - post or update a single
 * sticky comment with the unminified size, the minified size, and the delta of
 * the minified size against the `main` baseline. UI SDKs also get an "install
 * total" (the SDK plus its @stream-io workspace deps). Rows whose minified size
 * barely moved are dropped as noise. All sizes render in KB.
 *
 * The minified figure is computed in-process from the already-built `dist/`
 * files via vite's Rolldown/Oxc minifier (`minifySync`); the packages still ship
 * unminified.
 * Nothing here is allowed to fail CI: `main()` swallows errors and exits 0, and
 * the GitHub steps that call it run with `continue-on-error`.
 *
 * Usage:
 *   node scripts/bundle-size/measure.mts --out bundle-sizes.json
 *   node scripts/bundle-size/measure.mts --out bundle-sizes.json \
 *     --baseline baseline/bundle-sizes.json --pr <N> [--dry-run]
 *
 * Written as TypeScript executed natively via Node's type stripping (Node 24+).
 */

// ---------------------------------------------------------------------------
// Pure core (unit-tested)
// ---------------------------------------------------------------------------

export type Flavour = 'esm' | 'cjs' | 'browser';

export interface SizeEntry {
  package: string;
  entry?: string;
  flavour: Flavour;
  unminified: number;
  minified: number;
}

export interface SizeReport {
  targets: SizeEntry[];
}

export interface InstallGroup {
  package: string;
  // Package names whose main build sums into this package's install total
  // (the package itself plus its @stream-io workspace deps).
  members: string[];
}

export const COMMENT_MARKER = '<!-- stream-bundle-size-comment -->';

// Build flavours in preference order. Used to sort rows and, in measureAll, to
// pick each package's reported build: the first of these it actually ships
// (esm preferred; audio-filters-web ships cjs only).
const FLAVOUR_ORDER: Flavour[] = ['esm', 'cjs', 'browser'];

export function rowKey(e: {
  package: string;
  entry?: string;
  flavour: Flavour;
}): string {
  return `${e.package}|${e.entry ?? ''}|${e.flavour}`;
}

export function displayName(e: { package: string; entry?: string }): string {
  return e.entry ? `${e.package} (${e.entry})` : e.package;
}

// Bytes -> "728.0 KB". 1024 bytes per KB, one decimal.
export function formatKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// Signed minified delta + percent, e.g. "+1.2 KB (+0.4%)" or "+48 B (+0.1%)".
// Sub-KB magnitudes render in bytes so a small but real change never shows as
// "0.0 KB". Returns "n/a" without a baseline value, "0 KB" when unchanged.
export function formatDelta(
  current: number,
  baseline: number | undefined,
): string {
  if (baseline === undefined) return 'n/a';
  const diff = current - baseline;
  if (diff === 0) return '0 KB';
  const sign = diff > 0 ? '+' : '-';
  const pct = baseline === 0 ? 100 : (Math.abs(diff) / baseline) * 100;
  const magnitude =
    Math.abs(diff) < 1024 ? `${Math.abs(diff)} B` : formatKB(Math.abs(diff));
  return `${sign}${magnitude} (${sign}${pct.toFixed(1)}%)`;
}

// Preferred row order: the core + UI SDKs first, in this sequence; every other
// package follows, alphabetically.
const PREFERRED_ORDER = [
  '@stream-io/video-client',
  '@stream-io/video-react-bindings',
  '@stream-io/video-react-sdk',
  '@stream-io/video-react-native-sdk',
];

function packageRank(pkg: string): number {
  const i = PREFERRED_ORDER.indexOf(pkg);
  return i === -1 ? PREFERRED_ORDER.length : i;
}

function sortEntries(entries: SizeEntry[]): SizeEntry[] {
  return [...entries].sort(
    (a, b) =>
      packageRank(a.package) - packageRank(b.package) ||
      a.package.localeCompare(b.package) ||
      (a.entry ?? '').localeCompare(b.entry ?? '') ||
      FLAVOUR_ORDER.indexOf(a.flavour) - FLAVOUR_ORDER.indexOf(b.flavour),
  );
}

// Minified deltas smaller than this (in bytes) are treated as noise and their
// rows are dropped from the comment. 0 is therefore always dropped.
export const MIN_DELTA_BYTES = 16;

const shortName = (pkg: string): string =>
  pkg.replace('@stream-io/', '').replace(/^video-/, '');

// Sum the main (non-entry) build sizes of the given member packages, or null if
// any member is missing from the map.
function sumInstall(
  mainByPackage: Map<string, SizeEntry>,
  members: string[],
): { unminified: number; minified: number } | null {
  let unminified = 0;
  let minified = 0;
  for (const m of members) {
    const e = mainByPackage.get(m);
    if (!e) return null;
    unminified += e.unminified;
    minified += e.minified;
  }
  return { unminified, minified };
}

// Render the sticky PR comment. When a baseline exists, rows whose minified size
// moved by less than MIN_DELTA_BYTES (including no change) are dropped as noise;
// "new" and "removed" packages are always kept. A UI SDK (per installGroups) is
// also shown when its install total moved, and gets a "↳ install total" sub-row.
// Without a baseline every row is shown with an "n/a" delta. Non-esm builds
// (e.g. audio-filters-web's cjs) are tagged inline in the package name.
export function renderComment(
  report: SizeReport,
  opts: {
    baseline?: SizeReport;
    baselineRef?: string;
    omitted?: string[];
    installGroups?: InstallGroup[];
  } = {},
): string {
  const hasBaseline = opts.baseline !== undefined;
  const baseMap = new Map<string, SizeEntry>();
  if (opts.baseline) {
    for (const e of opts.baseline.targets) baseMap.set(rowKey(e), e);
  }
  const curMain = new Map(
    report.targets.filter((e) => !e.entry).map((e) => [e.package, e]),
  );
  const baseMain = new Map(
    (opts.baseline?.targets ?? [])
      .filter((e) => !e.entry)
      .map((e) => [e.package, e]),
  );
  const groupByPackage = new Map(
    (opts.installGroups ?? []).map((g) => [g.package, g.members]),
  );

  const label = (e: SizeEntry): string =>
    e.flavour === 'esm' ? displayName(e) : `${displayName(e)} (${e.flavour})`;

  const rows: string[] = [];
  for (const e of sortEntries(report.targets)) {
    const base = baseMap.get(rowKey(e));
    baseMap.delete(rowKey(e));
    const members = e.entry ? undefined : groupByPackage.get(e.package);

    if (members) {
      // UI SDK: show it when its own size OR its install total moved enough.
      const curTotal = sumInstall(curMain, members);
      const baseTotal = hasBaseline ? sumInstall(baseMain, members) : null;
      const ownDiff = base ? e.minified - base.minified : null;
      const totalDiff =
        curTotal && baseTotal ? curTotal.minified - baseTotal.minified : null;
      const significant =
        !hasBaseline ||
        !base ||
        (ownDiff !== null && Math.abs(ownDiff) >= MIN_DELTA_BYTES) ||
        (totalDiff !== null && Math.abs(totalDiff) >= MIN_DELTA_BYTES);
      if (!significant) continue;
      const ownDelta = !hasBaseline
        ? 'n/a'
        : base
          ? formatDelta(e.minified, base.minified)
          : 'new';
      rows.push(
        `| ${label(e)} | ${formatKB(e.unminified)} | ${formatKB(e.minified)} | ${ownDelta} |`,
      );
      if (curTotal) {
        const totalDelta = !hasBaseline
          ? 'n/a'
          : baseTotal
            ? formatDelta(curTotal.minified, baseTotal.minified)
            : 'new';
        const added = members
          .filter((m) => m !== e.package)
          .map(shortName)
          .join(' + ');
        rows.push(
          `| ↳ install total (+ ${added}) | ${formatKB(curTotal.unminified)} | ${formatKB(curTotal.minified)} | ${totalDelta} |`,
        );
      }
      continue;
    }

    let delta: string;
    if (!hasBaseline) delta = 'n/a';
    else if (!base) delta = 'new';
    else if (Math.abs(e.minified - base.minified) >= MIN_DELTA_BYTES)
      delta = formatDelta(e.minified, base.minified);
    else continue; // change below the noise floor
    rows.push(
      `| ${label(e)} | ${formatKB(e.unminified)} | ${formatKB(e.minified)} | ${delta} |`,
    );
  }
  // Anything left in the baseline map is a package that no longer builds.
  for (const e of sortEntries([...baseMap.values()])) {
    rows.push(`| ${label(e)} | - | ${formatKB(e.minified)} | removed |`);
  }

  const lines: string[] = [
    '## Bundle size',
    '',
    `Built package output. Sizes in KB; delta vs \`${opts.baselineRef ?? 'main'}\`.`,
    '',
  ];
  if (!hasBaseline) {
    lines.push(
      '> No `main` baseline available yet - showing absolute sizes only.',
      '',
    );
  }
  if (rows.length === 0) {
    lines.push(`_No significant package size increase vs \`main\`._`);
  } else {
    lines.push(
      '| Package | Unminified | Minified | Δ min vs `main` |',
      '|---|--:|--:|--:|',
      ...rows,
    );
  }

  lines.push('', COMMENT_MARKER);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Measurement config
// ---------------------------------------------------------------------------

// A measured artifact is either an exact file or a whole directory tree whose
// `.js` files are summed (the bob React Native packages ship a multi-file tree
// rather than a single bundle).
type FileSpec = { file: string } | { tree: string };

interface PackageConfig {
  package: string;
  entries: { entry?: string; files: Partial<Record<Flavour, FileSpec[]>> }[];
}

const file = (path: string): FileSpec => ({ file: path });
const tree = (dir: string): FileSpec => ({ tree: dir });

// React Native (bob) packages all share the same shape: a `dist/module` ESM tree
// and a `dist/commonjs` CJS tree.
const rnPackage = (name: string): PackageConfig => ({
  package: name,
  entries: [
    { files: { esm: [tree('dist/module')], cjs: [tree('dist/commonjs')] } },
  ],
});

const CONFIG: PackageConfig[] = [
  {
    package: '@stream-io/video-client',
    entries: [
      {
        files: {
          esm: [file('dist/index.es.js')],
          cjs: [file('dist/index.cjs.js')],
          browser: [file('dist/index.browser.es.js')],
        },
      },
    ],
  },
  {
    package: '@stream-io/video-react-bindings',
    entries: [
      {
        files: {
          esm: [file('dist/index.es.js')],
          cjs: [file('dist/index.cjs.js')],
        },
      },
    ],
  },
  {
    package: '@stream-io/video-react-sdk',
    entries: [
      {
        files: {
          esm: [file('dist/index.es.js')],
          cjs: [file('dist/index.cjs.js')],
        },
      },
      {
        entry: 'embedded',
        files: {
          esm: [file('dist/embedded.es.js')],
          cjs: [file('dist/embedded.cjs.js')],
        },
      },
    ],
  },
  {
    package: '@stream-io/video-filters-web',
    entries: [
      {
        files: {
          esm: [file('dist/index.es.js')],
          cjs: [file('dist/index.cjs.js')],
        },
      },
    ],
  },
  {
    package: '@stream-io/audio-filters-web',
    entries: [{ files: { cjs: [file('dist/cjs/index.js')] } }],
  },
  rnPackage('@stream-io/video-react-native-sdk'),
  rnPackage('@stream-io/video-filters-react-native'),
  rnPackage('@stream-io/noise-cancellation-react-native'),
  // react-native-callingx ships an ESM (dist/module) build only.
  {
    package: '@stream-io/react-native-callingx',
    entries: [{ files: { esm: [tree('dist/module')] } }],
  },
];

// ---------------------------------------------------------------------------
// Impure shell + CLI
// ---------------------------------------------------------------------------

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

import { gh } from '../release/lib/exec.mts';
import { loadWorkspacePackages } from '../release/lib/workspace.mts';

const REPO = process.env.GITHUB_REPOSITORY ?? 'GetStream/stream-video-js';

// Resolve a FileSpec to the absolute `.js` files it covers (source maps and type
// declarations excluded). Missing paths resolve to nothing so a package that did
// not build simply drops out of the report.
function collectFiles(packageDir: string, spec: FileSpec): string[] {
  if ('file' in spec) {
    const abs = join(packageDir, spec.file);
    return existsSync(abs) ? [abs] : [];
  }
  const root = join(packageDir, spec.tree);
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const dirent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, dirent.name);
      if (dirent.isDirectory()) walk(p);
      else if (dirent.name.endsWith('.js')) out.push(p);
    }
  };
  walk(root);
  return out;
}

// Minified byte length of a single file via vite's Rolldown/Oxc minifier. vite
// is imported lazily so the pure core (and its tests) never pay the cost of
// loading it. A file that fails to minify falls back to its raw size (with a
// warning) so the row still reports.
async function minifiedBytes(filename: string, code: string): Promise<number> {
  try {
    const { minifySync } = await import('vite');
    return Buffer.byteLength(minifySync(filename, code).code);
  } catch (error) {
    console.warn(
      `WARN: minify failed for ${filename}: ${(error as Error).message.split('\n')[0]}`,
    );
    return Buffer.byteLength(code);
  }
}

async function measureRow(
  packageDir: string,
  pkg: string,
  entry: string | undefined,
  flavour: Flavour,
  specs: FileSpec[],
): Promise<SizeEntry | null> {
  const files = specs.flatMap((s) => collectFiles(packageDir, s));
  if (files.length === 0) return null;
  let unminified = 0;
  let minified = 0;
  for (const abs of files) {
    const code = readFileSync(abs, 'utf8');
    unminified += Buffer.byteLength(code);
    minified += await minifiedBytes(abs, code);
  }
  return { package: pkg, entry, flavour, unminified, minified };
}

async function measureAll(repoRoot: string): Promise<SizeReport> {
  const packages = loadWorkspacePackages(join(repoRoot, 'packages'));
  const targets: SizeEntry[] = [];
  for (const cfg of CONFIG) {
    const info = packages.get(cfg.package);
    if (!info) {
      console.warn(`WARN: package not found in workspace: ${cfg.package}`);
      continue;
    }
    for (const ent of cfg.entries) {
      let measured = false;
      // Report the first flavour the package actually ships (esm preferred).
      for (const flavour of FLAVOUR_ORDER) {
        const specs = ent.files[flavour];
        if (!specs) continue;
        const row = await measureRow(
          info.dir,
          cfg.package,
          ent.entry,
          flavour,
          specs,
        );
        if (row) {
          targets.push(row);
          measured = true;
          break;
        }
      }
      if (!measured)
        console.warn(
          `WARN: no built output for ${displayName({ package: cfg.package, entry: ent.entry })}`,
        );
    }
  }
  return { targets };
}

// A "UI SDK" depends on the bindings layer; its install total is the SDK plus
// the core @stream-io packages it pulls in (video-client, video-react-bindings).
const CORE_INSTALL_DEPS = [
  '@stream-io/video-client',
  '@stream-io/video-react-bindings',
];

function buildInstallGroups(repoRoot: string): InstallGroup[] {
  const packages = loadWorkspacePackages(join(repoRoot, 'packages'));
  const groups: InstallGroup[] = [];
  for (const [name, info] of packages) {
    const deps = Object.keys(info.manifest.dependencies ?? {});
    if (!deps.includes('@stream-io/video-react-bindings')) continue;
    groups.push({
      package: name,
      members: [name, ...CORE_INSTALL_DEPS.filter((d) => deps.includes(d))],
    });
  }
  return groups;
}

function loadBaseline(path: string | undefined): SizeReport | undefined {
  if (!path || !existsSync(path)) return undefined;
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as SizeReport;
    return Array.isArray(parsed?.targets) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function printHuman(report: SizeReport): void {
  for (const e of sortEntries(report.targets)) {
    console.log(
      `${displayName(e).padEnd(42)} ${e.flavour.padEnd(8)} raw ${formatKB(e.unminified).padStart(11)}  min ${formatKB(e.minified).padStart(11)}`,
    );
  }
}

// Find the id of the existing sticky comment (by marker), if any.
function findCommentId(pr: number): string | undefined {
  const out = gh(
    [
      'api',
      `repos/${REPO}/issues/${pr}/comments`,
      '--paginate',
      '--jq',
      `.[] | select(.body | contains("${COMMENT_MARKER}")) | .id`,
    ],
    { allowFailure: true },
  );
  const id = out
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)[0];
  return id || undefined;
}

// Update the sticky comment in place if it exists, otherwise create it.
function upsertComment(pr: number, body: string): void {
  const id = findCommentId(pr);
  if (id) {
    gh([
      'api',
      '--method',
      'PATCH',
      `repos/${REPO}/issues/comments/${id}`,
      '-f',
      `body=${body}`,
    ]);
    console.log(`Updated bundle-size comment on PR #${pr}`);
  } else {
    gh(['pr', 'comment', String(pr), '--body', body]);
    console.log(`Created bundle-size comment on PR #${pr}`);
  }
}

interface Args {
  out?: string;
  baseline?: string;
  pr?: number;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') args.out = argv[++i];
    else if (a === '--baseline') args.baseline = argv[++i];
    else if (a === '--pr') args.pr = Number(argv[++i]);
    else if (a === '--dry-run') args.dryRun = true;
  }
  return args;
}

async function run(args: Args): Promise<void> {
  const repoRoot = process.cwd();
  const report = await measureAll(repoRoot);

  if (args.out) {
    writeFileSync(
      resolve(repoRoot, args.out),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(`Wrote ${report.targets.length} measurements to ${args.out}`);
  }

  // No PR number: measurement-only (the `main` baseline producer + local runs).
  if (args.pr === undefined || Number.isNaN(args.pr)) {
    printHuman(report);
    return;
  }

  const baseline = loadBaseline(args.baseline);
  const measured = new Set(report.targets.map((t) => t.package));
  const omitted = CONFIG.map((c) => c.package).filter((p) => !measured.has(p));
  const body = renderComment(report, {
    baseline,
    baselineRef: process.env.BASELINE_REF || undefined,
    omitted,
    installGroups: buildInstallGroups(repoRoot),
  });

  if (args.dryRun || args.pr <= 0) {
    console.log(body);
    return;
  }
  upsertComment(args.pr, body);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  run(args).catch((error) => {
    // Non-fatal: a size report must never fail CI.
    console.warn(
      `WARN: bundle-size measure failed: ${(error as Error).message}`,
    );
  });
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === invokedPath) {
  main();
}
