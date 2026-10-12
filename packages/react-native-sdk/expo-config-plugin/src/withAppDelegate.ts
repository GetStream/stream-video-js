import {
  type ConfigPlugin,
  withAppDelegate as withAppDelegateUtil,
} from '@expo/config-plugins';
import {
  addSwiftImports,
  insertContentsInsideSwiftFunctionBlock,
  addObjcImports,
} from '@expo/config-plugins/build/ios/codeMod';

import { findMatchingBracketPosition } from '@expo/config-plugins/build/utils/matchBrackets';

import { type ConfigProps } from './common/types';
import { addToSwiftBridgingHeaderFile } from './common/addToSwiftBridgingHeaderFile';

const withAppDelegate: ConfigPlugin<ConfigProps> = (configuration, props) => {
  return withAppDelegateUtil(configuration, (config) => {
    if (
      !props?.ringing &&
      !props?.iOSEnableMultitaskingCameraAccess &&
      !props?.addNoiseCancellation
    ) {
      // quit early if no change is necessary
      return config;
    }
    if (config.modResults.language !== 'swift') {
      throw new Error(
        `Cannot setup StreamVideoReactNativeSDK: a Swift AppDelegate is required (the default since Expo SDK 53), found ${config.modResults.language}`,
      );
    }
    try {
      config.modResults.contents = addSwiftImports(config.modResults.contents, [
        'WebRTC',
      ]);
      addToSwiftBridgingHeaderFile(
        config.modRequest.projectRoot,
        (headerFileContents) => {
          headerFileContents = addObjcImports(headerFileContents, [
            '"StreamVideoReactNative.h"',
            '<WebRTCModuleOptions.h>',
          ]);
          return headerFileContents;
        },
      );
      if (props?.addNoiseCancellation) {
        config.modResults.contents = addSwiftImports(
          config.modResults.contents,
          ['stream_io_noise_cancellation_react_native'],
        );
      }
      config.modResults.contents = addDidFinishLaunchingWithOptionsSwift(
        config.modResults.contents,
        props.iOSEnableMultitaskingCameraAccess,
        props.addNoiseCancellation,
      );
      if (props?.ringing) {
        config.modResults.contents = addSwiftImports(
          config.modResults.contents,
          ['stream_video_react_native'],
        );
        config.modResults.contents =
          addDidFinishLaunchingWithOptionsRingingSwift(
            config.modResults.contents,
          );
        config.modResults.contents = addContinueUserActivityRingingSwift(
          config.modResults.contents,
        );
      }
      return config;
    } catch (error: any) {
      throw new Error(
        `Cannot setup StreamVideoReactNativeSDK because the AppDelegate(swift) is malformed ${error}`,
      );
    }
  });
};

function addDidFinishLaunchingWithOptionsSwift(
  contents: string,
  iOSEnableMultitaskingCameraAccess: boolean | undefined,
  enableNoiseCancellation: boolean | undefined,
) {
  const functionSelector = 'application(_:didFinishLaunchingWithOptions:)';
  if (iOSEnableMultitaskingCameraAccess) {
    const setupMethod = `let options = WebRTCModuleOptions.sharedInstance()
    options.enableMultitaskingCameraAccess = true`;

    if (!contents.includes('options.enableMultitaskingCameraAccess = true')) {
      contents = insertContentsInsideSwiftFunctionBlock(
        contents,
        functionSelector,
        setupMethod,
        { position: 'head' },
      );
    }
  }
  if (enableNoiseCancellation) {
    const setupMethod = `NoiseCancellationManager.getInstance().registerProcessor()`;
    if (!contents.includes(setupMethod)) {
      contents = insertContentsInsideSwiftFunctionBlock(
        contents,
        functionSelector,
        setupMethod,
        { position: 'head' },
      );
    }
  }
  return contents;
}

function addDidFinishLaunchingWithOptionsRingingSwift(contents: string) {
  const functionSelector = 'application(_:didFinishLaunchingWithOptions:)';
  const voipSetupMethod = 'StreamVideoReactNative.voipRegistration()';
  if (contents.includes(voipSetupMethod)) {
    return contents;
  }
  const updated = insertContentsInsideSwiftFunctionBlock(
    contents,
    functionSelector,
    '  ' + voipSetupMethod,
    { position: 'head' },
  );
  if (!updated.includes(voipSetupMethod)) {
    throw new Error(
      `Could not find ${functionSelector} in AppDelegate to inject ${voipSetupMethod}`,
    );
  }
  return updated;
}

// Forwards Recents redial (INStartCallIntent) user activities to callingx.
function addContinueUserActivityRingingSwift(contents: string) {
  const functionSelector = 'application(_:continue:restorationHandler:)';
  const handleActivityCall =
    '_ = StreamVideoReactNative.handleUserActivity(userActivity)';
  if (contents.includes('StreamVideoReactNative.handleUserActivity(')) {
    return contents;
  }
  // insertContentsInsideSwiftFunctionBlock matches by name + param count only,
  // which would hit application(_:open:options:), so locate the function here
  const funcMatch =
    /func\s+application\(\s*_\s+\w+:\s*UIApplication,\s*continue\s+userActivity\b[^{]*\{/.exec(
      contents,
    );
  if (funcMatch) {
    const bodyStart = funcMatch.index + funcMatch[0].length;
    return (
      contents.slice(0, bodyStart) +
      `\n    ${handleActivityCall}` +
      contents.slice(bodyStart)
    );
  }
  // the template has no such override: add one that defers to super
  const classMatch = /class\s+AppDelegate\b[^{]*\{/.exec(contents);
  if (!classMatch) {
    throw new Error(
      `Could not find the AppDelegate class to add ${functionSelector}`,
    );
  }
  const classStart = classMatch.index + classMatch[0].length - 1;
  const classEnd = findMatchingBracketPosition(contents, '{', classStart);
  const override = `
  // Recents redial (INStartCallIntent) and Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    ${handleActivityCall}
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler)
  }
`;
  return contents.slice(0, classEnd) + override + contents.slice(classEnd);
}

export default withAppDelegate;
