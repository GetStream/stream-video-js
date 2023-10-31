import {
  ConfigPlugin,
  InfoPlist,
  withDangerousMod,
  withPlugins,
} from '@expo/config-plugins';
import plist from '@expo/plist';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigProps } from '../common/types';

const withFilesMod: ConfigPlugin<ConfigProps> = (config) =>
  withPlugins(config, [
    withBroadcastExtensionHandler,
    withBroadcastExtensionPlist,
  ]);

export default withFilesMod;

// creates the extension handler directory and adds the SampleHandler.swift file
const withBroadcastExtensionHandler: ConfigPlugin = (configuration) => {
  return withDangerousMod(configuration, [
    'ios',
    (config) => {
      const extensionRootPath = path.join(
        config.modRequest.platformProjectRoot,
        'broadcast',
      );
      fs.mkdirSync(extensionRootPath, { recursive: true });
      fs.copyFileSync(
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
    (config) => {
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

      fs.mkdirSync(path.dirname(extensionPlistPath), {
        recursive: true,
      });
      fs.writeFileSync(extensionPlistPath, plist.build(extensionPlist));

      return config;
    },
  ]);
};
