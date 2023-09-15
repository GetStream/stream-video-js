import { ConfigPlugin, withAppDelegate } from '@expo/config-plugins';
import {
  addObjcImports,
  insertContentsInsideObjcFunctionBlock,
} from '@expo/config-plugins/build/ios/codeMod';
import { ConfigProps } from './common/types';

const DID_FINISH_LAUNCHING_WITH_OPTIONS =
  'application:didFinishLaunchingWithOptions:';

const withPushAppDelegate: ConfigPlugin<ConfigProps> = (
  configuration,
  props,
) => {
  return withAppDelegate(configuration, (config) => {
    if (!props.ringingPushNotifications) {
      // user doesnt want to use ringing push notifications, so quit early
      return config;
    }
    if (['objc', 'objcpp'].includes(config.modResults.language)) {
      // all the imports that are needed
      config.modResults.contents = addObjcImports(config.modResults.contents, [
        '"RNCallKeep.h"',
        '<PushKit/PushKit.h>',
        '"RNVoipPushNotificationManager.h"',
      ]);
      // call the setup RNCallKeep
      const supportsVideoString = props.ringingPushNotifications.disableVideo
        ? '@NO'
        : '@YES';
      const includesCallsInRecents = props.ringingPushNotifications
        .includesCallsInRecents
        ? '@YES'
        : '@NO';
      const setupCallKeep = `NSString *localizedAppName = [[[NSBundle mainBundle] localizedInfoDictionary] objectForKey:@"CFBundleDisplayName"];
  NSString *appName = [[[NSBundle mainBundle] infoDictionary]objectForKey :@"CFBundleDisplayName"];
  [RNCallKeep setup:@{
    @"appName": localizedAppName != nil ? localizedAppName : appName,
    @"supportsVideo": ${supportsVideoString},
    @"includesCallsInRecents": ${includesCallsInRecents},
  }];`;
      if (!config.modResults.contents.includes('[RNCallKeep setup:@')) {
        config.modResults.contents = insertContentsInsideObjcFunctionBlock(
          config.modResults.contents,
          DID_FINISH_LAUNCHING_WITH_OPTIONS,
          setupCallKeep,
          { position: 'head' },
        );
      }
      // call the setup of voip push notification
      const voipSetupMethod =
        '[RNVoipPushNotificationManager voipRegistration];';
      if (!config.modResults.contents.includes(voipSetupMethod)) {
        config.modResults.contents = insertContentsInsideObjcFunctionBlock(
          config.modResults.contents,
          DID_FINISH_LAUNCHING_WITH_OPTIONS,
          voipSetupMethod,
          { position: 'head' },
        );
      }
    } else {
      throw new Error(
        'Cannot setup StreamVideoReactNativeSDK because the AppDelegate is malformed',
      );
    }
    return config;
  });
};

export default withPushAppDelegate;
