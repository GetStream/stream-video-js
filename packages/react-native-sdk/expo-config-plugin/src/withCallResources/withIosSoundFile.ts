import { type ConfigPlugin, withXcodeProject } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

const SUPPORTED_EXTENSIONS = ['.caf', '.aiff', '.m4a', '.wav'];

/**
 * Copies a sound file into the iOS app directory and adds it to the Xcode project's
 * resources, so it can be resolved by name at runtime. Takes the path relative to the
 * project root.
 */
const withIosSoundFile: ConfigPlugin<string> = (config, relativeSourcePath) => {
  return withXcodeProject(config, (xCodeConfig) => {
    const projectRoot = xCodeConfig.modRequest.projectRoot;
    const sourcePath = path.resolve(projectRoot, relativeSourcePath);

    if (!fs.existsSync(sourcePath)) {
      throw new Error(
        `[StreamVideo] iOS sound file not found: ${sourcePath}. ` +
          `Check the sound paths in your plugin config.`,
      );
    }

    const ext = path.extname(sourcePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      throw new Error(
        `[StreamVideo] Invalid iOS sound format "${ext}". ` +
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
        proj.addToPbxBuildFileSection(file);
        proj.addToPbxResourcesBuildPhase(file);
      }
    }

    return xCodeConfig;
  });
};

export default withIosSoundFile;
