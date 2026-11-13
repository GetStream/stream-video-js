// Copies the app's own noise cancellation model builds (noise-cancellation/models,
// vendored from GetStream/mol) into public/noise-cancellation/models, so that
// the app serves them itself. See noise-cancellation/README.md.
import { cpSync, existsSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const appDir = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(appDir, 'noise-cancellation', 'models');
if (!existsSync(source)) {
  console.error(
    `[copy-noise-cancellation-models] Noise cancellation models not found at ${source}.`,
  );
  process.exit(1);
}

const destination = join(appDir, 'public', 'noise-cancellation', 'models');
rmSync(destination, { recursive: true, force: true });
cpSync(source, destination, { recursive: true });
console.log(
  `[copy-noise-cancellation-models] copied ${source} to ${destination}`,
);
