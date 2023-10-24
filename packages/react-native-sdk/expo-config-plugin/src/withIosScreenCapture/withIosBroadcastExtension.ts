import {
  withXcodeProject,
  ConfigPlugin,
  InfoPlist,
  withDangerousMod,
} from '@expo/config-plugins';
import plist from '@expo/plist';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigProps } from '../common/types';
import addBroadcastExtensionXcodeTarget from './addBroadcastExtensionXcodeTarget';

const withIosBroadcastExtension: ConfigPlugin<ConfigProps> = (config) => {
  config = withBroadcastExtensionHandler(config);
  config = withBroadcastExtensionPlist(config);
  config = withBroadcastExtensionXcodeTarget(config);
  return config;
};

// creates the extension handler directory and adds the SampleHandler.swift file
const withBroadcastExtensionHandler: ConfigPlugin = (configuration) => {
  return withDangerousMod(configuration, [
    'ios',
    async (config) => {
      const extensionRootPath = path.join(
        config.modRequest.platformProjectRoot,
        'broadcast',
      );
      await fs.promises.mkdir(extensionRootPath, { recursive: true });
      await fs.promises.copyFile(
        path.join(__dirname, '..', '..', 'static', 'SampleHandler.swift'),
        path.join(extensionRootPath, 'SampleHandler.swift'),
      );
      return config;
    },
  ]);
};

// adds the Info.plist to the extension handler directory
const withBroadcastExtensionPlist: ConfigPlugin = (configuration) => {
  return withDangerousMod(configuration, [
    'ios',
    async (config) => {
      const extensionRootPath = path.join(
        config.modRequest.platformProjectRoot,
        'broadcast',
      );
      const extensionPlistPath = path.join(extensionRootPath, 'Info.plist');

      const extensionPlist: InfoPlist = {
        NSExtension: {
          NSExtensionPointIdentifier: 'com.apple.broadcast-services-upload',
          NSExtensionPrincipalClass: '$(PRODUCT_MODULE_NAME).SampleHandler',
          RPBroadcastProcessMode: 'RPBroadcastProcessModeSampleBuffer',
        },
      };

      await fs.promises.mkdir(path.dirname(extensionPlistPath), {
        recursive: true,
      });
      await fs.promises.writeFile(
        extensionPlistPath,
        plist.build(extensionPlist),
      );

      return config;
    },
  ]);
};

const withBroadcastExtensionXcodeTarget: ConfigPlugin = (configuration) => {
  return withXcodeProject(configuration, async (config) => {
    const appName = config.modRequest.projectName!;
    const extensionName = 'broadcast';
    const extensionBundleIdentifier = `${config.ios!
      .bundleIdentifier!}.broadcast`;
    const currentProjectVersion = config.ios!.buildNumber || '1';
    const marketingVersion = config.version!;

    await addBroadcastExtensionXcodeTarget(config.modResults, {
      appName,
      extensionName,
      extensionBundleIdentifier,
      currentProjectVersion,
      marketingVersion,
    });

    return config;
  });
};

export default withIosBroadcastExtension;
