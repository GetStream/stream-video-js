import {
  ConfigPlugin,
  withXcodeProject,
  InfoPlist,
  XcodeProject,
} from '@expo/config-plugins';
import { ConfigProps } from '../common/types';
import plist from '@expo/plist';
import * as fs from 'fs';
import * as path from 'path';
import addBroadcastExtensionXcodeTarget from './addBroadcastExtensionXcodeTarget';

// adds the extension's entitlements file
const withTarget: ConfigPlugin<ConfigProps> = (configuration, _props) => {
  return withXcodeProject(configuration, (config) => {
    const appName = config.modRequest.projectName!;
    const extensionName = 'broadcast';
    const extensionBundleIdentifier = `${config.ios!
      .bundleIdentifier!}.broadcast`;
    const currentProjectVersion = config.ios!.buildNumber || '1';
    const marketingVersion = config.version!;

    addBroadcastExtensionXcodeTarget(config.modResults, {
      appName,
      extensionName,
      extensionBundleIdentifier,
      currentProjectVersion,
      marketingVersion,
    });

    const proj = config.modResults;
    const appGroupIdentifier = `group.${config.ios!
      .bundleIdentifier!}.appgroup`;
    const extensionRootPath = path.join(
      config.modRequest.platformProjectRoot,
      'broadcast',
    );

    addBroadcastEntitlementsFile({
      proj,
      extensionRootPath,
      appGroupIdentifier,
    });

    addBroadcastSourceFiles({
      proj,
      extensionRootPath,
      appGroupIdentifier,
    });

    return config;
  });
};

export default withTarget;

const addBroadcastEntitlementsFile = ({
  proj,
  extensionRootPath,
  appGroupIdentifier,
}: {
  proj: XcodeProject;
  extensionRootPath: string;
  appGroupIdentifier: string;
}) => {
  const entitlementsPath = path.join(
    extensionRootPath,
    'broadcast.entitlements',
  );

  const extensionEntitlements: InfoPlist = {
    'com.apple.security.application-groups': [appGroupIdentifier],
  };

  // create file
  fs.mkdirSync(path.dirname(entitlementsPath), {
    recursive: true,
  });
  fs.writeFileSync(entitlementsPath, plist.build(extensionEntitlements));

  // add file to extension group
  const targetUuid = proj.findTargetKey('broadcast');
  const groupUuid = proj.findPBXGroupKey({ name: 'broadcast' });

  proj.addFile('broadcast.entitlements', groupUuid, {
    target: targetUuid,
    lastKnownFileType: 'text.plist.entitlements',
  });
};

const addBroadcastSourceFiles = ({
  proj,
  extensionRootPath,
  appGroupIdentifier,
}: {
  proj: XcodeProject;
  extensionRootPath: string;
  appGroupIdentifier: string;
}) => {
  fs.mkdirSync(extensionRootPath, { recursive: true });
  fs.copyFileSync(
    path.join(__dirname, '..', '..', 'static', 'Atomic.swift'),
    path.join(extensionRootPath, 'Atomic.swift'),
  );
  fs.copyFileSync(
    path.join(
      __dirname,
      '..',
      '..',
      'static',
      'DarwinNotificationCenter.swift',
    ),
    path.join(extensionRootPath, 'DarwinNotificationCenter.swift'),
  );
  fs.copyFileSync(
    path.join(__dirname, '..', '..', 'static', 'SampleUploader.swift'),
    path.join(extensionRootPath, 'SampleUploader.swift'),
  );
  fs.copyFileSync(
    path.join(__dirname, '..', '..', 'static', 'SocketConnection.swift'),
    path.join(extensionRootPath, 'SocketConnection.swift'),
  );

  // Update app group bundle id in SampleHandler code
  const code = fs.readFileSync(
    path.join(extensionRootPath, 'SampleHandler.swift'),
    { encoding: 'utf-8' },
  );
  fs.writeFileSync(
    path.join(extensionRootPath, 'SampleHandler.swift'),
    code.replace('group.com.example.broadcast.appgroup', appGroupIdentifier),
  );

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
