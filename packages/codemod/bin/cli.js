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

  const transformPath = path.join(__dirname, '../transforms', transformFile);

  const jscodeshiftBin = require.resolve('jscodeshift/bin/jscodeshift.js');

  const args = [
    jscodeshiftBin,
    targetPath,
    `--transform=${transformPath}`,
    ...rest,
  ];

  const result = spawnSync(process.execPath, args, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  process.exit(result.status ?? 1);
}

main();
