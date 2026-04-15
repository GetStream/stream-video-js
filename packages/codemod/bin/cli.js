#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');

const TRANSFORMS = {
  'use-call-state-hooks': 'use-call-state-hooks-transform.js',
};

function printUsage() {
  console.log(`
    Usage:
      npx @stream-io/video-codemod <transform> <path> [options]

    Transforms:
      ${Object.keys(TRANSFORMS).join('\n  ')}

    Options:
      --extensions=ts,tsx
      --parser=tsx
      --run-prettier     Run prettier on transformed files (requires prettier in your project)
    `);
}

function main() {
  const [, , transformName, targetPath, ...rest] = process.argv;

  if (!transformName || !targetPath) {
    printUsage();
    process.exit(1);
  }

  const transformFile = TRANSFORMS[transformName];
  if (!transformFile) {
    console.error(`Unknown transform: ${transformName}`);
    printUsage();
    process.exit(1);
  }

  const runPrettier = rest.includes('--run-prettier');
  const jscodeshiftArgs = rest.filter((arg) => arg !== '--run-prettier');

  const transformPath = path.join(__dirname, '../transforms', transformFile);

  const jscodeshiftBin = require.resolve('jscodeshift/bin/jscodeshift.js');

  const args = [
    jscodeshiftBin,
    targetPath,
    `--transform=${transformPath}`,
    '--extensions=ts,tsx',
    ...jscodeshiftArgs,
  ];

  const result = spawnSync(process.execPath, args, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  if (runPrettier) {
    console.log('\nRunning prettier on transformed files...');

    let prettierBin;
    try {
      const prettierPkgPath = require.resolve('prettier/package.json', {
        paths: [process.cwd()],
      });
      const prettierPkg = require(prettierPkgPath);
      const binPath = prettierPkg.bin.prettier || prettierPkg.bin;
      prettierBin = path.join(path.dirname(prettierPkgPath), binPath);
    } catch {
      console.error(
        'Could not find prettier. Please install it in your project.',
      );
      process.exit(1);
    }

    spawnSync(process.execPath, [prettierBin, '--write', '.'], {
      stdio: 'inherit',
    });
  }

  process.exit(0);
}

main();
