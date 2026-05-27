import {
  type ConfigPlugin,
  withAppDelegate as withAppDelegateUtil,
} from '@expo/config-plugins';
import {
  addSwiftImports,
  insertContentsInsideSwiftFunctionBlock,
  addObjcImports,
  insertContentsInsideObjcFunctionBlock,
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
    if (['objc', 'objcpp'].includes(config.modResults.language)) {
      try {
        if (props?.addNoiseCancellation) {
          config.modResults.contents = addObjcImports(
            config.modResults.contents,
            ['"NoiseCancellationManagerObjc.h"'],
          );
        }
        config.modResults.contents = addDidFinishLaunchingWithOptionsObjc(
          config.modResults.contents,
          props.iOSEnableMultitaskingCameraAccess,
          props.addNoiseCancellation,
        );
        if (props?.ringing) {
          config.modResults.contents = addObjcImports(
            config.modResults.contents,
            ['"StreamVideoReactNative.h"'],
          );

          config.modResults.contents =
            addDidFinishLaunchingWithOptionsRingingObjc(
              config.modResults.contents,
            );
        }
        return config;
      } catch (error: any) {
        throw new Error(
          `Cannot setup StreamVideoReactNativeSDK because the AppDelegate(objc) is malformed ${error}`,
        );
      }
    } else {
      try {
        config.modResults.contents = addSwiftImports(
          config.modResults.contents,
          ['WebRTC'],
        );
        addToSwiftBridgingHeaderFile(
          config.modRequest.projectRoot,
          (headerFileContents) => {
            headerFileContents = addObjcImports(headerFileContents, [
              '"ProcessorProvider.h"',
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
        }
        return config;
      } catch (error: any) {
        throw new Error(
          `Cannot setup StreamVideoReactNativeSDK because the AppDelegate(swift) is malformed ${error}`,
        );
      }
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

function addDidFinishLaunchingWithOptionsObjc(
  contents: string,
  iOSEnableMultitaskingCameraAccess: boolean | undefined,
  enableNoiseCancellation: boolean | undefined,
) {
  const functionSelector = 'application:didFinishLaunchingWithOptions:';
  if (iOSEnableMultitaskingCameraAccess) {
    contents = addObjcImports(contents, ['<WebRTCModuleOptions.h>']);

    const setupMethod = `WebRTCModuleOptions *options = [WebRTCModuleOptions sharedInstance];
  options.enableMultitaskingCameraAccess = YES;`;

    if (!contents.includes('options.enableMultitaskingCameraAccess = YES')) {
      contents = insertContentsInsideObjcFunctionBlock(
        contents,
        functionSelector,
        setupMethod,
        { position: 'head' },
      );
    }
  }
  if (enableNoiseCancellation) {
    const setupMethod = `[[NoiseCancellationManagerObjc sharedInstance] registerProcessor];`;
    if (!contents.includes(setupMethod)) {
      contents = insertContentsInsideObjcFunctionBlock(
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
  const voipSetupMethod = 'StreamVideoReactNative.voipRegistrationManaged()';
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

function addDidFinishLaunchingWithOptionsRingingObjc(contents: string) {
  const functionSelector = 'application:didFinishLaunchingWithOptions:';
  const voipSetupMethod = '[StreamVideoReactNative voipRegistrationManaged];';
  if (contents.includes(voipSetupMethod)) {
    return contents;
  }
  const updated = insertContentsInsideObjcFunctionBlock(
    contents,
    functionSelector,
    voipSetupMethod,
    { position: 'head' },
  );
  if (!updated.includes(voipSetupMethod)) {
    throw new Error(
      `Could not find ${functionSelector} in AppDelegate to inject ${voipSetupMethod}`,
    );
  }
  return updated;
}

export default withAppDelegate;
