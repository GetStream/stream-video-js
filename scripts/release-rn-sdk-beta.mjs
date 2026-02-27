#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const RN_SDK_NAME = '@stream-io/video-react-native-sdk';
const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];
const RN_PIN_FIELDS = ['dependencies', 'devDependencies'];
const DEFAULT_BASE_REF = 'origin/main';
const DEFAULT_TAG = 'beta';
const VERIFY_ATTEMPTS = 15;
const VERIFY_DELAY_MS = 4000;

// Read a required value for a flag and validate shape.
function readFlagValue(argv, index, flagName) {
  const value = argv[index + 1];
  if (!value || value.startsWith('-')) {
    printHelpAndExit(1, `Missing or invalid value for ${flagName}.`);
  }
  return value;
}

// Parse CLI flags and apply defaults.
function parseArgs(argv) {
  const options = {
    baseRef: DEFAULT_BASE_REF,
    tag: DEFAULT_TAG,
    dryRun: false,
    allowEmpty: false,
    keepChanges: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--base-ref') {
      options.baseRef = readFlagValue(argv, i, '--base-ref');
      i += 1;
    } else if (arg === '--tag') {
      options.tag = readFlagValue(argv, i, '--tag');
      i += 1;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--allow-empty') {
      options.allowEmpty = true;
    } else if (arg === '--keep-changes') {
      options.keepChanges = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelpAndExit(0);
    } else {
      printHelpAndExit(1, `Unknown argument: ${arg}`);
    }
  }

  if (!options.baseRef || !options.tag) {
    printHelpAndExit(1, 'Both --base-ref and --tag must have values.');
  }

  return options;
}

// Print usage text and terminate the process.
function printHelpAndExit(code, errorMessage) {
  if (errorMessage) {
    console.error(errorMessage);
    console.error('');
  }

  console.log(`Release React Native SDK beta with dependency orchestration.

Usage:
  node scripts/release-rn-sdk-beta.mjs [options]

Options:
  --base-ref <git-ref>   Base ref for change detection (default: ${DEFAULT_BASE_REF})
  --tag <npm-tag>        Prerelease tag name (default: ${DEFAULT_TAG})
  --dry-run              Print release plan without publishing
  --allow-empty          Release RN SDK even if no package changed
  --keep-changes         Keep mutated package.json files after script exits
  --help, -h             Show this help
`);
  process.exit(code);
}

// Execute a shell command and normalize failure output.
function run(command, args, { capture = true } = {}) {
  try {
    if (capture) {
      return execFileSync(command, args, { encoding: 'utf8' }).trim();
    }

    execFileSync(command, args, { stdio: 'inherit' });
    return '';
  } catch (error) {
    const stdout = error.stdout ? error.stdout.toString() : '';
    const stderr = error.stderr ? error.stderr.toString() : '';
    const details = [stdout, stderr].filter(Boolean).join('\n');
    const commandText = [command, ...args].join(' ');
    throw new Error(
      `Command failed: ${commandText}${details ? `\n${details}` : ''}`,
    );
  }
}

// Read and parse a JSON file.
function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// Write a JSON file with stable formatting.
function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

// Prevent accidental releases from a dirty workspace.
function ensureCleanWorkingTree() {
  const status = run('git', ['status', '--porcelain']);
  if (status) {
    throw new Error(
      'Working tree is not clean. Commit or stash local changes before running the release script.',
    );
  }
}

// Ensure the user-provided base ref exists.
function ensureGitRefExists(ref) {
  run('git', ['rev-parse', '--verify', ref]);
}

// Fail early when npm auth is missing.
function ensureNpmAuth() {
  run('npm', ['whoami']);
}

// Load all workspace manifests keyed by package name.
function getWorkspaceInfo() {
  const raw = run('yarn', ['workspaces', 'list', '--json']);
  const lines = raw ? raw.split('\n').filter(Boolean) : [];
  const workspaces = lines.map((line) => JSON.parse(line));

  const infoByName = new Map();
  for (const workspace of workspaces) {
    const packageJsonPath = resolve(
      process.cwd(),
      workspace.location,
      'package.json',
    );
    infoByName.set(workspace.name, {
      name: workspace.name,
      location: workspace.location,
      packageJsonPath,
      manifest: readJson(packageJsonPath),
    });
  }

  if (!infoByName.has(RN_SDK_NAME)) {
    throw new Error(`Required workspace package not found: ${RN_SDK_NAME}`);
  }

  return infoByName;
}

// Resolve direct internal dependencies for a workspace package.
function getDirectWorkspaceDependencies(workspaceInfoByName, packageName) {
  const workspaceInfo = workspaceInfoByName.get(packageName);
  if (!workspaceInfo) {
    throw new Error(`Workspace package not found: ${packageName}`);
  }

  const deps = new Set();
  for (const field of DEPENDENCY_FIELDS) {
    const entries = workspaceInfo.manifest[field] ?? {};
    for (const depName of Object.keys(entries)) {
      if (workspaceInfoByName.has(depName)) {
        deps.add(depName);
      }
    }
  }

  return [...deps].sort();
}

// Detect which release-scope packages changed since the base ref.
function getChangedPackages(baseRef, workspaceInfoByName, releaseScope) {
  const diffRaw = run('git', ['diff', '--name-only', `${baseRef}...HEAD`]);
  const changedFiles = diffRaw ? diffRaw.split('\n').filter(Boolean) : [];
  const changedPackages = new Set();

  for (const packageName of releaseScope) {
    const workspaceInfo = workspaceInfoByName.get(packageName);
    if (!workspaceInfo) {
      throw new Error(`Release package not found in workspace: ${packageName}`);
    }

    const prefix = `${workspaceInfo.location}/`;
    const changed = changedFiles.some(
      (path) => path === workspaceInfo.location || path.startsWith(prefix),
    );
    if (changed) {
      changedPackages.add(workspaceInfo.name);
    }
  }

  return changedPackages;
}

// Build dependency edges within the selected release scope.
function buildDependencyGraph(workspaceInfoByName, releaseScope) {
  const graph = new Map();
  for (const name of releaseScope) {
    if (!workspaceInfoByName.has(name)) {
      throw new Error(`Release package not found in workspace: ${name}`);
    }
    graph.set(name, new Set());
  }

  for (const packageName of releaseScope) {
    const workspaceInfo = workspaceInfoByName.get(packageName);
    for (const field of DEPENDENCY_FIELDS) {
      const deps = workspaceInfo.manifest[field] ?? {};
      for (const depName of Object.keys(deps)) {
        if (!graph.has(depName) || depName === workspaceInfo.name) {
          continue;
        }
        graph.get(depName).add(workspaceInfo.name);
      }
    }
  }

  return graph;
}

// Topologically order dependencies before dependents.
function topoSort(nodes, graph) {
  const indegree = new Map(nodes.map((node) => [node, 0]));

  for (const from of nodes) {
    const dependents = graph.get(from) ?? new Set();
    for (const to of dependents) {
      if (!indegree.has(to)) {
        continue;
      }
      indegree.set(to, indegree.get(to) + 1);
    }
  }

  const queue = nodes.filter((node) => indegree.get(node) === 0).sort();
  const sorted = [];

  while (queue.length > 0) {
    const current = queue.shift();
    sorted.push(current);
    const dependents = graph.get(current) ?? new Set();
    for (const next of dependents) {
      if (!indegree.has(next)) {
        continue;
      }
      const nextInDegree = indegree.get(next) - 1;
      indegree.set(next, nextInDegree);
      if (nextInDegree === 0) {
        queue.push(next);
        queue.sort();
      }
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error('Dependency cycle detected in selected release packages.');
  }

  return sorted;
}

// Escape user values used inside regex patterns.
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Strip prerelease suffix from a semver string.
function stableBaseVersion(version) {
  return version.split('-')[0];
}

// Compute the next prerelease number for a package/tag pair.
function nextPrereleaseVersion(packageName, currentVersion, tag) {
  const baseVersion = stableBaseVersion(currentVersion);
  const raw = run('npm', ['view', packageName, 'versions', '--json']);
  const parsed = raw ? JSON.parse(raw) : [];
  const publishedVersions = Array.isArray(parsed) ? parsed : [parsed];
  const pattern = new RegExp(
    `^${escapeRegExp(baseVersion)}-${escapeRegExp(tag)}\\.(\\d+)$`,
  );

  let max = -1;
  for (const version of publishedVersions) {
    const match = pattern.exec(version);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }

  return `${baseVersion}-${tag}.${max + 1}`;
}

// Read a dependency version from released map or local manifest.
function getLiveVersion(workspaceInfoByName, releasedVersions, packageName) {
  return (
    releasedVersions.get(packageName) ??
    workspaceInfoByName.get(packageName).manifest.version
  );
}

// Convert workspace: specifiers to concrete publishable versions.
function resolveWorkspaceSpec(currentSpec, targetVersion) {
  if (typeof currentSpec !== 'string') {
    return currentSpec;
  }
  if (!currentSpec.startsWith('workspace:')) {
    return currentSpec;
  }

  const suffix = currentSpec.slice('workspace:'.length);
  if (suffix === '' || suffix === '*') {
    return targetVersion;
  }
  if (suffix === '^' || suffix.startsWith('^')) {
    return `^${targetVersion}`;
  }
  if (suffix === '~' || suffix.startsWith('~')) {
    return `~${targetVersion}`;
  }
  return targetVersion;
}

// Persist a manifest update with rollback backup.
function backupAndWriteManifest(workspaceInfo, nextManifest, backups) {
  backupFile(workspaceInfo.packageJsonPath, backups);
  workspaceInfo.manifest = nextManifest;
  writeJson(workspaceInfo.packageJsonPath, nextManifest);
}

// Snapshot a file once so we can restore it later.
function backupFile(path, backups) {
  if (!backups.has(path) && existsSync(path)) {
    backups.set(path, readFileSync(path, 'utf8'));
  }
}

// Pin internal workspace dependencies for publish-time manifest.
function pinWorkspaceInternalDeps(
  workspaceInfo,
  workspaceInfoByName,
  releasedVersions,
) {
  const nextManifest = structuredClone(workspaceInfo.manifest);
  for (const field of DEPENDENCY_FIELDS) {
    const deps = nextManifest[field];
    if (!deps) {
      continue;
    }

    for (const [depName, depSpec] of Object.entries(deps)) {
      if (!workspaceInfoByName.has(depName)) {
        continue;
      }

      const depVersion = getLiveVersion(
        workspaceInfoByName,
        releasedVersions,
        depName,
      );
      deps[depName] = resolveWorkspaceSpec(depSpec, depVersion);
    }
  }
  return nextManifest;
}

// Pin selected RN SDK dependency versions for publish.
function pinReactNativeSdkDeps(workspaceInfo, packagesToPin, pinnedVersions) {
  const nextManifest = structuredClone(workspaceInfo.manifest);
  for (const field of RN_PIN_FIELDS) {
    const deps = nextManifest[field];
    if (!deps) {
      continue;
    }

    for (const packageName of packagesToPin) {
      if (Object.prototype.hasOwnProperty.call(deps, packageName)) {
        deps[packageName] = pinnedVersions.get(packageName);
      }
    }
  }
  return nextManifest;
}

// Build a package through its workspace build script.
function runBuild(packageName, dryRun) {
  const bin = 'yarn';
  const args = ['workspace', packageName, 'run', 'build'];
  if (dryRun) {
    console.log(`[dry-run] ${[bin, ...args].join(' ')}`);
    return;
  }
  run(bin, args, { capture: false });
}

// Publish a workspace package to npm under a specific dist-tag.
function publishWorkspace(packageName, tag, dryRun) {
  const command = [
    'workspace',
    packageName,
    'npm',
    'publish',
    '--access=public',
    '--tag',
    tag,
  ];

  if (dryRun) {
    console.log(`[dry-run] yarn ${command.join(' ')}`);
    return;
  }
  run('yarn', command, { capture: false });
}

// Confirm npm registry sees the expected published version.
function verifyPublishedVersion(packageName, version, dryRun) {
  if (dryRun) {
    return;
  }

  let lastError = null;
  for (let attempt = 1; attempt <= VERIFY_ATTEMPTS; attempt += 1) {
    try {
      const published = run('npm', [
        'view',
        `${packageName}@${version}`,
        'version',
      ]);
      if (published === version) {
        return;
      }

      lastError = new Error(
        `Expected ${packageName}@${version}, but npm returned version "${published}".`,
      );
    } catch (error) {
      lastError = error;
    }

    if (attempt < VERIFY_ATTEMPTS) {
      console.log(
        `Waiting for npm metadata propagation (${attempt}/${VERIFY_ATTEMPTS}) for ${packageName}@${version}...`,
      );
      sleep(VERIFY_DELAY_MS);
    }
  }

  throw new Error(
    `Publish verification failed for ${packageName}@${version} after ${VERIFY_ATTEMPTS} attempts.\n${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

// Block synchronously for simple retry backoff.
function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// Restore all files modified by this script.
function restoreBackups(backups) {
  for (const [path, contents] of backups.entries()) {
    writeFileSync(path, contents);
  }
}

// Print the release execution plan before running.
function printPlan(depReleaseOrder, depVersionPlan, releaseRnSdk, rnVersion) {
  console.log('Release plan');
  console.log('------------');
  if (depReleaseOrder.length === 0) {
    console.log('- No dependency prereleases needed.');
  } else {
    for (const depName of depReleaseOrder) {
      console.log(`- ${depName} -> ${depVersionPlan.get(depName)}`);
    }
  }

  if (releaseRnSdk) {
    console.log(`- ${RN_SDK_NAME} -> ${rnVersion}`);
  } else {
    console.log(`- ${RN_SDK_NAME} -> skipped (no relevant changes)`);
  }
  console.log('');
}

// Print a short result summary for operators.
function printSummary(publishedVersions, pinnedRnVersions, options) {
  console.log('Release summary');
  console.log('---------------');
  const action = options.dryRun ? 'Planned' : 'Published';
  const preposition = options.dryRun ? 'with' : 'using';

  if (publishedVersions.size === 0) {
    console.log(`- No packages ${options.dryRun ? 'planned' : 'published'}.`);
  } else {
    for (const [packageName, version] of publishedVersions.entries()) {
      console.log(
        `- ${action} ${packageName}@${version} ${preposition} --tag ${options.tag}`,
      );
    }
  }

  if (pinnedRnVersions) {
    console.log('- RN SDK dependency pins used for publish:');
    for (const [packageName, version] of pinnedRnVersions.entries()) {
      console.log(`  - ${packageName}: ${version}`);
    }
  }

  if (
    publishedVersions.has('@stream-io/video-client') &&
    !publishedVersions.has('@stream-io/video-react-bindings')
  ) {
    console.log(
      '- Warning: client was prereleased without prereleasing react-bindings; peer dependency warnings are possible for beta consumers.',
    );
  }
}

// Orchestrate dependency and RN SDK prereleases.
function main() {
  const options = parseArgs(process.argv.slice(2));
  const backups = new Map();

  let pinnedRnVersions = null;
  const publishedVersions = new Map();

  try {
    if (!options.dryRun) {
      ensureCleanWorkingTree();
      ensureNpmAuth();
    }
    ensureGitRefExists(options.baseRef);

    const workspaceInfoByName = getWorkspaceInfo();
    const rnWorkspaceDeps = getDirectWorkspaceDependencies(
      workspaceInfoByName,
      RN_SDK_NAME,
    );
    const releaseScope = [...rnWorkspaceDeps, RN_SDK_NAME];
    const changedPackages = getChangedPackages(
      options.baseRef,
      workspaceInfoByName,
      releaseScope,
    );

    const changedDeps = rnWorkspaceDeps.filter((name) =>
      changedPackages.has(name),
    );
    const rnChanged = changedPackages.has(RN_SDK_NAME);
    const releaseRnSdk =
      rnChanged || changedDeps.length > 0 || options.allowEmpty;

    if (!releaseRnSdk) {
      console.log(
        `No changes detected in ${RN_SDK_NAME} or its workspace dependencies since ${options.baseRef}.`,
      );
      console.log(
        'Nothing to release. Use --allow-empty to force a beta publish.',
      );
      return;
    }

    const graph = buildDependencyGraph(workspaceInfoByName, releaseScope);
    const depReleaseOrder = topoSort(changedDeps, graph);

    const depVersionPlan = new Map();
    for (const depName of depReleaseOrder) {
      const currentVersion = workspaceInfoByName.get(depName).manifest.version;
      depVersionPlan.set(
        depName,
        nextPrereleaseVersion(depName, currentVersion, options.tag),
      );
    }

    const rnCurrentVersion =
      workspaceInfoByName.get(RN_SDK_NAME).manifest.version;
    const rnNextVersion = nextPrereleaseVersion(
      RN_SDK_NAME,
      rnCurrentVersion,
      options.tag,
    );

    printPlan(depReleaseOrder, depVersionPlan, releaseRnSdk, rnNextVersion);

    for (const depName of depReleaseOrder) {
      const workspaceInfo = workspaceInfoByName.get(depName);
      const depNextVersion = depVersionPlan.get(depName);

      if (!options.dryRun) {
        let nextManifest = pinWorkspaceInternalDeps(
          workspaceInfo,
          workspaceInfoByName,
          publishedVersions,
        );
        nextManifest.version = depNextVersion;
        backupAndWriteManifest(workspaceInfo, nextManifest, backups);
      }
      runBuild(depName, options.dryRun);
      publishWorkspace(depName, options.tag, options.dryRun);
      verifyPublishedVersion(depName, depNextVersion, options.dryRun);

      publishedVersions.set(depName, depNextVersion);
    }

    if (releaseRnSdk) {
      const rnInfo = workspaceInfoByName.get(RN_SDK_NAME);
      pinnedRnVersions = new Map();
      for (const depName of rnWorkspaceDeps) {
        pinnedRnVersions.set(
          depName,
          getLiveVersion(workspaceInfoByName, publishedVersions, depName),
        );
      }

      if (!options.dryRun) {
        let rnManifest = pinReactNativeSdkDeps(
          rnInfo,
          rnWorkspaceDeps,
          pinnedRnVersions,
        );
        rnManifest.version = rnNextVersion;
        backupAndWriteManifest(rnInfo, rnManifest, backups);
        backupFile(
          resolve(process.cwd(), 'packages/react-native-sdk/src/version.ts'),
          backups,
        );
      }
      runBuild(RN_SDK_NAME, options.dryRun);
      publishWorkspace(RN_SDK_NAME, options.tag, options.dryRun);
      verifyPublishedVersion(RN_SDK_NAME, rnNextVersion, options.dryRun);

      publishedVersions.set(RN_SDK_NAME, rnNextVersion);
    }

    printSummary(publishedVersions, pinnedRnVersions, options);
  } finally {
    if (!options.keepChanges && backups.size > 0) {
      restoreBackups(backups);
      console.log('\nRestored local package.json changes.');
    }
  }
}

main();
