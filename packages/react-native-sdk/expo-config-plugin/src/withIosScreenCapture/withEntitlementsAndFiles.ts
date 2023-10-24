import {
  withXcodeProject,
  ConfigPlugin,
  InfoPlist,
  withEntitlementsPlist,
  withInfoPlist,
  XcodeProject,
} from '@expo/config-plugins';
import plist from '@expo/plist';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigProps } from '../common/types';

const withEntitlementsAndFiles: ConfigPlugin<ConfigProps> = (
  config,
  _props,
) => {
  config = withAppEntitlements(config);
  config = withBroadcastEntitlements(config);
  config = withInfoPlistRTC(config);
  config = withBroadcastSources(config);
  return config;
};

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

// adds the extension's entitlements file
const withBroadcastEntitlements: ConfigPlugin = (configuration) => {
  return withXcodeProject(configuration, async (config) => {
    const appGroupIdentifier = `group.${config.ios!
      .bundleIdentifier!}.appgroup`;
    const extensionRootPath = path.join(
      config.modRequest.platformProjectRoot,
      'broadcast',
    );
    const entitlementsPath = path.join(
      extensionRootPath,
      'broadcast.entitlements',
    );

    const extensionEntitlements: InfoPlist = {
      'com.apple.security.application-groups': [appGroupIdentifier],
    };

    // create file
    await fs.promises.mkdir(path.dirname(entitlementsPath), {
      recursive: true,
    });
    await fs.promises.writeFile(
      entitlementsPath,
      plist.build(extensionEntitlements),
    );

    // add file to extension group
    const proj = config.modResults;
    const targetUuid = proj.findTargetKey('broadcast');
    console.log({ proj, targetUuid });
    const groupUuid = proj.findPBXGroupKey({ name: 'broadcast' });

    proj.addFile('broadcast.entitlements', groupUuid, {
      target: targetUuid,
      lastKnownFileType: 'text.plist.entitlements',
    });

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

const withBroadcastSources: ConfigPlugin = (configuration) => {
  return withXcodeProject(configuration, async (config) => {
    const appGroupIdentifier = `group.${config.ios!
      .bundleIdentifier!}.appgroup`;
    const extensionRootPath = path.join(
      config.modRequest.platformProjectRoot,
      'broadcast',
    );
    await fs.promises.mkdir(extensionRootPath, { recursive: true });
    await fs.promises.copyFile(
      path.join(__dirname, '..', '..', 'static', 'Atomic.swift'),
      path.join(extensionRootPath, 'Atomic.swift'),
    );
    await fs.promises.copyFile(
      path.join(
        __dirname,
        '..',
        '..',
        'static',
        'DarwinNotificationCenter.swift',
      ),
      path.join(extensionRootPath, 'DarwinNotificationCenter.swift'),
    );
    await fs.promises.copyFile(
      path.join(__dirname, '..', '..', 'static', 'SampleUploader.swift'),
      path.join(extensionRootPath, 'SampleUploader.swift'),
    );
    await fs.promises.copyFile(
      path.join(__dirname, '..', '..', 'static', 'SocketConnection.swift'),
      path.join(extensionRootPath, 'SocketConnection.swift'),
    );

    // Update app group bundle id in SampleHandler code
    const code = await fs.promises.readFile(
      path.join(extensionRootPath, 'SampleHandler.swift'),
      { encoding: 'utf-8' },
    );
    await fs.promises.writeFile(
      path.join(extensionRootPath, 'SampleHandler.swift'),
      code.replace('group.com.example.broadcast.appgroup', appGroupIdentifier),
    );

    addSourceFiles(config.modResults);

    return config;
  });
};

const addSourceFiles = (proj: XcodeProject) => {
  const targetUuid = proj.findTargetKey('broadcast');
  const groupUuid = proj.findPBXGroupKey({ name: 'broadcast' });

  if (!targetUuid) {
    console.error('Failed to find "broadcast" target!');
    return;
  }
  if (!groupUuid) {
    console.error('Failed to find "broadcast" group!');
    return;
  }

  proj.addSourceFile(
    'Atomic.swift',
    {
      target: targetUuid,
    },
    groupUuid,
  );

  proj.addSourceFile(
    'DarwinNotificationCenter.swift',
    {
      target: targetUuid,
    },
    groupUuid,
  );

  proj.addSourceFile(
    'SampleUploader.swift',
    {
      target: targetUuid,
    },
    groupUuid,
  );

  proj.addSourceFile(
    'SocketConnection.swift',
    {
      target: targetUuid,
    },
    groupUuid,
  );
};

export default withEntitlementsAndFiles;
