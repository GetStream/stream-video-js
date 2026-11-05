#!/usr/bin/env node
// Vendors the FastEnhancer runtime assets from an unpacked `fastenhancer-web`
// npm package into `src/fastenhancer`. No dependencies.
//
// Runs directly on Node.js 22.18+ (type stripping), no build step:
//   node vendor-fastenhancer.mts --package <unpacked package dir> \
//     --lock <Denoiser/models/upstream.lock.json> --out <src/fastenhancer>
//
// Type-checked by `tsc -p scripts` (part of the package build).

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

type Model = 'tiny' | 'base' | 'small';
type Variant = 'simd' | 'scalar';

/** One pretrained weights file, as pinned in Denoiser's upstream lock. */
type LockedWeights = {
  file: string;
  bytes: number;
  sha256: string;
};

/** The parts of `Denoiser/models/upstream.lock.json` this script reads. */
type UpstreamLock = {
  repository: string;
  commit: string;
  license: string;
  weights: LockedWeights[];
};

/** The WASM export map: `_fe_*` symbol name -> minified export name. */
type ExportMap = Record<string, string>;

const MODELS: readonly Model[] = ['tiny', 'base', 'small'];
const VARIANTS: readonly Variant[] = ['simd', 'scalar'];

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isLockedWeights = (value: unknown): value is LockedWeights =>
  isRecord(value) &&
  typeof value.file === 'string' &&
  typeof value.bytes === 'number' &&
  typeof value.sha256 === 'string';

const isUpstreamLock = (value: unknown): value is UpstreamLock =>
  isRecord(value) &&
  typeof value.repository === 'string' &&
  typeof value.commit === 'string' &&
  typeof value.license === 'string' &&
  Array.isArray(value.weights) &&
  value.weights.every(isLockedWeights);

const isExportMap = (value: unknown): value is ExportMap =>
  isRecord(value) && Object.values(value).every((v) => typeof v === 'string');

const { values } = parseArgs({
  options: {
    package: { type: 'string' },
    lock: { type: 'string' },
    out: { type: 'string' },
  },
});
const requireArg = (key: keyof typeof values): string => {
  const value = values[key];
  if (!value) {
    console.error(`Missing required argument --${key}`);
    process.exit(2);
  }
  return value;
};

const packageDir = resolve(requireArg('package'));
const lockPath = resolve(requireArg('lock'));
const outDir = resolve(requireArg('out'));
const modelsDir = join(outDir, 'models');
const embeddedDir = join(packageDir, 'dist', 'embedded');

const sha256 = (bytes: Buffer | string): string =>
  createHash('sha256').update(bytes).digest('hex');

const readJson = (path: string): unknown => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    return fail(`${path}: cannot read JSON: ${(e as Error).message}`);
  }
};

/** Decodes the `const _b64 = "…"` payload of a generated embedded module. */
const readB64Module = (file: string): Buffer => {
  const source = readFileSync(join(embeddedDir, file), 'utf8');
  const match = source.match(/const _b64 = "([A-Za-z0-9+/=]*)"/);
  if (!match) fail(`${file}: no "const _b64" string found`);
  return Buffer.from(match[1], 'base64');
};

/** Parses the `exportMap` object literal of a generated embedded module. */
const readExportMap = (file: string): ExportMap => {
  const source = readFileSync(join(embeddedDir, file), 'utf8');
  const match = source.match(/exportMap\s*=\s*(\{[\s\S]*?\})\s*;?/);
  if (!match) fail(`${file}: no exportMap object literal found`);
  // The literal uses double-quoted keys/values and a trailing comma.
  const json = match[1].replace(/,(\s*\})$/, '$1');
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return fail(`${file}: cannot parse exportMap: ${(e as Error).message}`);
  }
  if (!isExportMap(parsed)) fail(`${file}: exportMap is not a string map`);
  return parsed;
};

const lock = readJson(lockPath);
if (!isUpstreamLock(lock)) fail(`${lockPath}: unexpected lock file shape`);
const lockedWeights = new Map(lock.weights.map((w) => [w.file, w]));

mkdirSync(modelsDir, { recursive: true });

/** Output path (relative to `--out`) -> file content. */
const outputs = new Map<string, Buffer | string>();

for (const model of MODELS) {
  const name = `fe_${model}_48k.bin`;
  const bytes = readB64Module(`weights-${model}.js`);
  const locked = lockedWeights.get(name);
  if (!locked) fail(`${name}: missing from lock file`);
  const actual = sha256(bytes);
  if (actual !== locked.sha256 || bytes.length !== locked.bytes) {
    fail(
      `${name}: mismatch (got ${bytes.length} bytes sha256 ${actual}, ` +
        `expected ${locked.bytes} bytes sha256 ${locked.sha256})`,
    );
  }
  outputs.set(`models/${name}`, bytes);

  for (const variant of VARIANTS) {
    const wasm = readB64Module(`wasm-${model}-${variant}.js`);
    if (wasm.subarray(0, 4).toString('latin1') !== '\0asm') {
      fail(`wasm-${model}-${variant}: not a WASM binary`);
    }
    outputs.set(`models/fe_${model}_${variant}.wasm`, wasm);
    outputs.set(
      `models/fe_${model}_${variant}.exports.json`,
      JSON.stringify(readExportMap(`exports-${model}-${variant}.js`), null, 2) +
        '\n',
    );
  }
}

outputs.set(
  'processor.js',
  readFileSync(join(packageDir, 'dist', 'worklet', 'processor.js')),
);

for (const [path, content] of outputs) {
  writeFileSync(join(outDir, path), content);
}

const pkg = readJson(join(packageDir, 'package.json'));
if (
  !isRecord(pkg) ||
  typeof pkg.name !== 'string' ||
  typeof pkg.version !== 'string'
) {
  fail(`${packageDir}/package.json: missing name or version`);
}
const rows = [...outputs]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, content]) => `| \`${path}\` | \`${sha256(content)}\` |`);

const readme = `# Vendored FastEnhancer runtime

Generated by \`scripts/vendor-fastenhancer.mts\`. Do not edit by hand.

- Runtime package: \`${pkg.name}@${pkg.version}\`
- Upstream repository: ${lock.repository}
- Upstream commit: \`${lock.commit}\`
- License: ${lock.license} (see \`LICENSE.md\`)

The model weights were verified against \`weights[].sha256\` in the upstream
lock file (\`Denoiser/models/upstream.lock.json\`) while vendoring.

## Reproduce

\`\`\`sh
mkdir /tmp/fe && cd /tmp/fe
npm pack ${pkg.name}@${pkg.version}
tar xzf ${pkg.name}-${pkg.version}.tgz
cd <repo>
node packages/audio-filters-web/scripts/vendor-fastenhancer.mts \\
  --package /tmp/fe/package \\
  --lock <path-to>/Denoiser/models/upstream.lock.json \\
  --out packages/audio-filters-web/src/fastenhancer
\`\`\`

## Files

| File | SHA-256 |
| --- | --- |
${rows.join('\n')}
`;
writeFileSync(join(outDir, 'README.md'), readme);

console.log(`Wrote ${outputs.size} files and README.md to ${outDir}`);
