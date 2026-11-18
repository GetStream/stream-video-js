// Copies the FastEnhancer models from @stream-io/audio-filters-web into
// public/fastenhancer/models, so that the app serves them itself.
import { cpSync, existsSync, readFileSync, realpathSync, rmSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const packageName = '@stream-io/audio-filters-web';
const require = createRequire(import.meta.url);

// The package exports only its entry point, which may not be built yet,
// so look for its directory along the module resolution paths instead.
const findPackageDir = () => {
  for (const nodeModules of require.resolve.paths(packageName) ?? []) {
    const packageJson = join(nodeModules, packageName, 'package.json');
    if (!existsSync(packageJson)) continue;
    if (JSON.parse(readFileSync(packageJson, 'utf8')).name !== packageName) {
      continue;
    }
    return realpathSync(dirname(packageJson));
  }
  return undefined;
};

const packageDir = findPackageDir();
if (!packageDir) {
  console.error(`[copy-fastenhancer-models] ${packageName} is not installed.`);
  process.exit(1);
}

const source = join(packageDir, 'src', 'fastenhancer', 'models');
if (!existsSync(source)) {
  console.error(
    `[copy-fastenhancer-models] FastEnhancer models not found at ${source}.`,
  );
  process.exit(1);
}

const appDir = dirname(dirname(fileURLToPath(import.meta.url)));
const destination = join(appDir, 'public', 'fastenhancer', 'models');
rmSync(destination, { recursive: true, force: true });
cpSync(source, destination, { recursive: true });
console.log(`[copy-fastenhancer-models] copied ${source} to ${destination}`);
