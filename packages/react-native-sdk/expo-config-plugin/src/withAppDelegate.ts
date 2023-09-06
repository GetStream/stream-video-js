import { ConfigPlugin, withAppDelegate } from '@expo/config-plugins';
import {
  addObjcImports,
  insertContentsInsideObjcFunctionBlock,
} from '@expo/config-plugins/build/ios/codeMod';

const withStreamVideoReactNativeSDKAppDelegate: ConfigPlugin = (
  configuration,
) => {
  return withAppDelegate(configuration, (config) => {
    if (['objc', 'objcpp'].includes(config.modResults.language)) {
      config.modResults.contents = addObjcImports(config.modResults.contents, [
        '"StreamVideoReactNative.h"',
      ]);
      const setupMethod = '[StreamVideoReactNative setup];';
      config.modResults.contents = insertContentsInsideObjcFunctionBlock(
        config.modResults.contents,
        'application:didFinishLaunchingWithOptions:',
        setupMethod,
        { position: 'head' },
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
