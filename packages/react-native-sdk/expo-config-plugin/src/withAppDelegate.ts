import { ConfigPlugin, withAppDelegate } from '@expo/config-plugins';
import {
  addObjcImports,
  insertContentsInsideObjcFunctionBlock,
} from '@expo/config-plugins/build/ios/codeMod';

export const addStreamVideoReactNativeSDKAppDelegateSetup = (
  contents: string,
): string => {
  const setupMethod = '[StreamVideoReactNative setup];';

  return insertContentsInsideObjcFunctionBlock(
    contents,
    'application:didFinishLaunchingWithOptions:',
    setupMethod,
    { position: 'head' },
  );
};

const withStreamVideoReactNativeSDKAppDelegate: ConfigPlugin = (
  configuration,
) => {
  return withAppDelegate(configuration, (config) => {
    if (['objc', 'objcpp'].includes(config.modResults.language)) {
      config.modResults.contents = addObjcImports(config.modResults.contents, [
        '"StreamVideoReactNative.h"',
      ]);
      config.modResults.contents = addStreamVideoReactNativeSDKAppDelegateSetup(
        config.modResults.contents,
      );
    } else {
      throw new Error(
        'Cannot setup StreamVideoReactNativeSDK because the AppDelegate is not Objective C',
      );
    }
    return config;
  });
};

export default withStreamVideoReactNativeSDKAppDelegate;
