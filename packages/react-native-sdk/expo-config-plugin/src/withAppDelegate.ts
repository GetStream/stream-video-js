import {
  type ConfigPlugin,
  WarningAggregator,
  withAppDelegate as withAppDelegateUtil,
} from '@expo/config-plugins';
import {
  addSwiftImports,
  findSwiftFunctionCodeBlock,
  insertContentsInsideSwiftFunctionBlock,
  addObjcImports,
} from '@expo/config-plugins/build/ios/codeMod';

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
        config.modResults.contents = addContinueUserActivitySwift(
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

const continueUserActivityMethod = `

  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    _ = StreamVideoReactNative.handle(userActivity)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler)
  }`;

/**
 * Forwards CallKit Recents call-backs (`INStartCallIntent`) to the SDK. With the UIScene
 * lifecycle, `ExpoAppSceneDelegate` re-feeds user activities (cold start and warm) to this
 * method, so one injection covers both. Templates that override the method (Expo 53-57) get
 * the call added to it; templates without it (Expo 58+) get the override added to the class.
 */
function addContinueUserActivitySwift(contents: string) {
  // Swift imports `+[StreamVideoReactNative handleUserActivity:]` as `handle(_:)`.
  if (contents.includes('StreamVideoReactNative.handle(')) {
    return contents;
  }
  // Matched by signature: insertContentsInsideSwiftFunctionBlock resolves overloaded
  // `application(...)` methods by name and can pick the wrong one.
  const signature =
    /func application\(\s*_ \w+: UIApplication,\s*continue (\w+): NSUserActivity,[\s\S]*?\)\s*->\s*Bool\s*\{/;
  const match = signature.exec(contents);
  if (match) {
    const insertAt = match.index + match[0].length;
    const handleMethod = `\n    _ = StreamVideoReactNative.handle(${match[1]})`;
    return (
      contents.slice(0, insertAt) + handleMethod + contents.slice(insertAt)
    );
  }

  // No continue method: add an override right after didFinishLaunchingWithOptions. It has to
  // be in the class body: ExpoAppDelegate's method isn't `dynamic`, so an extension can't override it.
  const didFinishLaunching = findSwiftFunctionCodeBlock(
    contents,
    'application(_:didFinishLaunchingWithOptions:)',
  );
  if (!didFinishLaunching) {
    WarningAggregator.addWarningIOS(
      'stream-video-react-native-sdk',
      'Could not add application(_:continue:restorationHandler:) to AppDelegate. Call backs ' +
        'from CallKit Recents will not be delivered unless you call ' +
        'StreamVideoReactNative.handle(userActivity) yourself.',
    );
    return contents;
  }
  const insertAt = didFinishLaunching.end + 1;
  return (
    contents.slice(0, insertAt) +
    continueUserActivityMethod +
    contents.slice(insertAt)
  );
}

export default withAppDelegate;
