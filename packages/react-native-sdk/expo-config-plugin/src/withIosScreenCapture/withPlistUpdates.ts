import {
  ConfigPlugin,
  withEntitlementsPlist,
  withInfoPlist,
  withPlugins,
} from '@expo/config-plugins';
import { ConfigProps } from '../common/types';

const withPlistUpdates: ConfigPlugin<ConfigProps> = (config, _props) =>
  withPlugins(config, [withAppEntitlements, withInfoPlistRTC]);

export default withPlistUpdates;

// adds the app group identifier to the app's entitlements file
const withAppEntitlements: ConfigPlugin = (configuration) => {
  return withEntitlementsPlist(configuration, (config) => {
    const appGroupIdentifier = `group.${config.ios!
      .bundleIdentifier!}.appgroup`;
    config.modResults['com.apple.security.application-groups'] = [
      appGroupIdentifier,
    ];
    return config;
  });
};

const withInfoPlistRTC: ConfigPlugin = (configuration) => {
  return withInfoPlist(configuration, (config) => {
    const appGroupIdentifier = `group.${config.ios!
      .bundleIdentifier!}.appgroup`;
    const extensionBundleIdentifier = `${config.ios!
      .bundleIdentifier!}.broadcast`;

    config.modResults.RTCAppGroupIdentifier = appGroupIdentifier;
    config.modResults.RTCScreenSharingExtension = extensionBundleIdentifier;

    if (!config.modResults.UIBackgroundModes) {
      config.modResults.UIBackgroundModes = [];
    }

    if (!config.modResults.UIBackgroundModes.includes('voip')) {
      config.modResults.UIBackgroundModes.push('voip');
    }

    return config;
  });
};
