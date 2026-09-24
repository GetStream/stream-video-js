import { type ConfigPlugin, withDangerousMod } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

const SUPPORTED_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.m4a'];

/**
 * Normalize a filename for Android resources:
 * - lowercase
 * - replace hyphens with underscores
 * - remove characters that are not alphanumeric or underscores (except the dot before extension)
 */
function normalizeAndroidResourceName(fileName: string): string {
  const ext = path.extname(fileName);
  const baseName = path.basename(fileName, ext);
  const normalized = baseName
    .toLowerCase()
    .replace(/-/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  if (normalized.length === 0) {
    throw new Error(
      `[StreamVideo] Android sound name "${fileName}" contains no valid characters after normalization. ` +
        `The name must contain at least one lowercase letter, digit, or underscore.`,
    );
  }

  if (!/^[a-z]/.test(normalized)) {
    throw new Error(
      `[StreamVideo] Android sound name "${fileName}" starts with a non-letter after normalization ("${normalized}"). ` +
        `Android resource names must start with a lowercase letter.`,
    );
  }

  return normalized + ext.toLowerCase();
}

/**
 * Copies a sound file into `android/app/src/main/res/raw/`, normalizing its name so it is a
 * valid Android resource name. Takes the path relative to the project root.
 */
const withAndroidSoundFile: ConfigPlugin<string> = (
  config,
  relativeSourcePath,
) => {
  return withDangerousMod(config, [
    'android',
    (dangerousConfig) => {
      const projectRoot = dangerousConfig.modRequest.projectRoot;
      const sourcePath = path.resolve(projectRoot, relativeSourcePath);

      if (!fs.existsSync(sourcePath)) {
        throw new Error(
          `[StreamVideo] Android sound file not found: ${sourcePath}. ` +
            `Check the sound paths in your plugin config.`,
        );
      }

      const ext = path.extname(sourcePath).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        throw new Error(
          `[StreamVideo] Invalid Android sound format "${ext}". ` +
            `Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`,
        );
      }

      const fileName = path.basename(sourcePath);
      const normalizedName = normalizeAndroidResourceName(fileName);

      const rawDir = path.join(
        dangerousConfig.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'raw',
      );
      fs.mkdirSync(rawDir, { recursive: true });

      const destPath = path.join(rawDir, normalizedName);
      fs.copyFileSync(sourcePath, destPath);

      return dangerousConfig;
    },
  ]);
};

export default withAndroidSoundFile;
export { normalizeAndroidResourceName };
