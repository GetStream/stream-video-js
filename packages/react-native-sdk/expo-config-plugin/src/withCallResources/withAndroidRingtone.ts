import { type ConfigPlugin, withDangerousMod } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';
import type { ConfigProps } from '../common/types';

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
  return normalized + ext.toLowerCase();
}

const withAndroidRingtone: ConfigPlugin<ConfigProps> = (config, props) => {
  if (!props?.androidRingtone) {
    return config;
  }

  return withDangerousMod(config, [
    'android',
    (dangerousConfig) => {
      const projectRoot = dangerousConfig.modRequest.projectRoot;
      const sourcePath = path.resolve(projectRoot, props.androidRingtone!);

      if (!fs.existsSync(sourcePath)) {
        throw new Error(
          `[StreamVideo] Android ringtone file not found: ${sourcePath}. ` +
            `Check that the "androidRingtone" path in your plugin config is correct.`,
        );
      }

      const ext = path.extname(sourcePath).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        throw new Error(
          `[StreamVideo] Invalid Android ringtone format "${ext}". ` +
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

export default withAndroidRingtone;
export { normalizeAndroidResourceName };
