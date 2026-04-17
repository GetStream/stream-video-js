import { type ConfigPlugin, withXcodeProject } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';
import type { ConfigProps } from '../common/types';

const SUPPORTED_EXTENSIONS = ['.caf', '.aiff', '.m4a', '.wav'];

const withIosRingtone: ConfigPlugin<ConfigProps> = (config, props) => {
  if (!props?.iosRingtone) {
    return config;
  }

  return withXcodeProject(config, (xCodeConfig) => {
    const projectRoot = xCodeConfig.modRequest.projectRoot;
    const sourcePath = path.resolve(projectRoot, props.iosRingtone!);

    if (!fs.existsSync(sourcePath)) {
      throw new Error(
        `[StreamVideo] iOS ringtone file not found: ${sourcePath}. ` +
          `Check that the "iosCallkitRingtone" path in your plugin config is correct.`,
      );
    }

    const ext = path.extname(sourcePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      throw new Error(
        `[StreamVideo] Invalid iOS ringtone format "${ext}". ` +
          `Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`,
      );
    }

    const fileName = path.basename(sourcePath);
    const appName = xCodeConfig.modRequest.projectName!;
    const destDir = path.join(
      xCodeConfig.modRequest.platformProjectRoot,
      appName,
    );
    const destPath = path.join(destDir, fileName);
    // Path relative to the ios/ directory — Xcode needs this to locate the file
    const projectFilePath = path.join(appName, fileName);

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(sourcePath, destPath);

    const proj = xCodeConfig.modResults;
    if (!proj.hasFile(fileName)) {
      // Find the main app group by name (Expo projects don't have a "Resources" group,
      // so we can't use addResourceFile which crashes on correctForResourcesPath)
      const appGroupKey = proj.findPBXGroupKey({ name: appName });
      const file = proj.addFile(projectFilePath, appGroupKey, {
        target: proj.getFirstTarget().uuid,
      });
      if (file) {
        file.uuid = proj.generateUuid();
        file.target = proj.getFirstTarget().uuid;
        proj.addToPbxBuildFileSection(file);
        proj.addToPbxResourcesBuildPhase(file);
      }
    }

    return xCodeConfig;
  });
};

export default withIosRingtone;
