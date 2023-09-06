import { ConfigPlugin, withAppDelegate } from '@expo/config-plugins';
import {
  MergeResults,
  mergeContents,
} from '@expo/config-plugins/build/utils/generateCode';
import { addObjcImports } from '@expo/config-plugins/build/ios/codeMod';

const commentFormat = '//';

export const addStreamVideoReactNativeSDKAppDelegateSetup = (
  src: string,
): MergeResults => {
  const newSrc = '[StreamVideoReactNative setup];';
  const StreamVideoReactNativeSDKAppDelegateSetup =
    /^(?:- \(BOOL\)application:\(UIApplication \*\)application didFinishLaunchingWithOptions:\(NSDictionary \*\)launchOptions|\{)$/gm;
  return mergeContents({
    tag: 'video-react-native-sdk-app-delegate-setup',
    src,
    newSrc,
    anchor: StreamVideoReactNativeSDKAppDelegateSetup,
    offset: 2,
    comment: commentFormat,
  });
};

const withStreamVideoReactNativeSDKAppDelegate: ConfigPlugin = (config) => {
  return withAppDelegate(config, (config) => {
    if (['objc', 'objcpp'].includes(config.modResults.language)) {
      try {
        config.modResults.contents = addObjcImports(
          config.modResults.contents,
          ['"StreamVideoReactNative.h"'],
        );
        config.modResults.contents =
          addStreamVideoReactNativeSDKAppDelegateSetup(
            config.modResults.contents,
          ).contents;
      } catch (error: any) {
        if (error.code === 'ERR_NO_MATCH') {
          throw new Error(
            "Cannot add StreamVideoReactNativeSDK to the project's AppDelegate because it's malformed.",
          );
        }
        throw Error;
      }
    } else {
      throw new Error(
        'Cannot setup StreamVideoReactNativeSDK because the AppDelegate is not Objective C',
      );
    }
    return config;
  });
};

export default withStreamVideoReactNativeSDKAppDelegate;
