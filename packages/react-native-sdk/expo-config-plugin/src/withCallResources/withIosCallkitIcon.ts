import { type ConfigPlugin, withDangerousMod } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';
import type { ConfigProps } from '../common/types';

/**
 * Derive an xcassets image set name from a filename.
 * e.g. "callkit_icon.png" -> "CallkitIcon"
 * e.g. "my-app-icon.png" -> "MyAppIcon"
 */
function deriveImageSetName(fileName: string): string {
  const baseName = path.basename(fileName, path.extname(fileName));
  return baseName
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

const withIosCallkitIcon: ConfigPlugin<ConfigProps> = (config, props) => {
  if (!props?.iosCallKitIcon) {
    return config;
  }

  return withDangerousMod(config, [
    'ios',
    (dangerousConfig) => {
      const projectRoot = dangerousConfig.modRequest.projectRoot;
      const sourcePath = path.resolve(projectRoot, props.iosCallKitIcon!);

      if (!fs.existsSync(sourcePath)) {
        throw new Error(
          `[StreamVideo] iOS CallKit icon file not found: ${sourcePath}. ` +
            `Check that the "iosCallkitIcon" path in your plugin config is correct.`,
        );
      }

      const ext = path.extname(sourcePath).toLowerCase();
      if (ext !== '.png') {
        throw new Error(
          `[StreamVideo] iOS CallKit icon must be a PNG file, got "${ext}".`,
        );
      }

      const imageSetName = deriveImageSetName(path.basename(sourcePath));
      const appName = dangerousConfig.modRequest.projectName!;
      const imageSetDir = path.join(
        dangerousConfig.modRequest.platformProjectRoot,
        appName,
        'Images.xcassets',
        `${imageSetName}.imageset`,
      );

      fs.mkdirSync(imageSetDir, { recursive: true });

      const destFileName = path.basename(sourcePath);
      fs.copyFileSync(sourcePath, path.join(imageSetDir, destFileName));

      const contentsJson = {
        images: [
          {
            filename: destFileName,
            idiom: 'universal',
          },
        ],
        info: {
          author: 'expo',
          version: 1,
        },
        properties: {
          'template-rendering-intent': 'template',
        },
      };

      fs.writeFileSync(
        path.join(imageSetDir, 'Contents.json'),
        JSON.stringify(contentsJson, null, 2),
      );

      return dangerousConfig;
    },
  ]);
};

export default withIosCallkitIcon;
export { deriveImageSetName };
