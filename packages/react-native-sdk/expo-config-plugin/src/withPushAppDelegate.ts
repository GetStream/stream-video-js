import { ConfigPlugin, withAppDelegate } from '@expo/config-plugins';
import {
  addObjcImports,
  insertContentsInsideObjcFunctionBlock,
  findObjcFunctionCodeBlock,
} from '@expo/config-plugins/build/ios/codeMod';

import { ConfigProps, RingingPushNotifications } from './common/types';
import addNewLinesToAppDelegate from './common/addNewLinesToAppDelegate';

const DID_FINISH_LAUNCHING_WITH_OPTIONS =
  'application:didFinishLaunchingWithOptions:';
const DID_UPDATE_PUSH_CREDENTIALS =
  'pushRegistry:didUpdatePushCredentials:forType:';
const DID_RECEIVE_INCOMING_PUSH =
  'pushRegistry:didReceiveIncomingPushWithPayload:forType:withCompletionHandler:';

const withPushAppDelegate: ConfigPlugin<ConfigProps> = (
  configuration,
  props,
) => {
  return withAppDelegate(configuration, (config) => {
    if (!props?.ringingPushNotifications) {
      // user doesnt want to use ringing push notifications, so quit early
      return config;
    }
    if (['objc', 'objcpp'].includes(config.modResults.language)) {
      try {
        // all the imports that are needed
        config.modResults.contents = addObjcImports(
          config.modResults.contents,
          [
            '"RNCallKeep.h"',
            '<PushKit/PushKit.h>',
            '"RNVoipPushNotificationManager.h"',
            '"StreamVideoReactNative.h"',
          ],
        );

        config.modResults.contents = addDidFinishLaunchingWithOptions(
          config.modResults.contents,
          props.ringingPushNotifications,
        );

        config.modResults.contents = addDidUpdatePushCredentials(
          config.modResults.contents,
        );

        config.modResults.contents = addDidReceiveIncomingPushCallback(
          config.modResults.contents,
        );
        return config;
      } catch (error: any) {
        throw new Error(
          'Cannot setup StreamVideoReactNativeSDK because the AppDelegate is malformed',
        );
      }
    } else {
      throw new Error(
        'Cannot setup StreamVideoReactNativeSDK because the language is not supported',
      );
    }
  });
};

function addDidFinishLaunchingWithOptions(
  contents: string,
  ringingPushNotifications: RingingPushNotifications,
) {
  // call the setup RNCallKeep
  const supportsVideoString = ringingPushNotifications.disableVideoIos
    ? '@NO'
    : '@YES';
  const includesCallsInRecents =
    ringingPushNotifications.includesCallsInRecentsIos ? '@YES' : '@NO';
  const setupCallKeep = `NSString *localizedAppName = [[[NSBundle mainBundle] localizedInfoDictionary] objectForKey:@"CFBundleDisplayName"];
  NSString *appName = [[[NSBundle mainBundle] infoDictionary]objectForKey :@"CFBundleDisplayName"];
  [RNCallKeep setup:@{
    @"appName": localizedAppName != nil ? localizedAppName : appName,
    @"supportsVideo": ${supportsVideoString},
    @"includesCallsInRecents": ${includesCallsInRecents},
  }];`;
  if (!contents.includes('[RNCallKeep setup:@')) {
    contents = insertContentsInsideObjcFunctionBlock(
      contents,
      DID_FINISH_LAUNCHING_WITH_OPTIONS,
      setupCallKeep,
      { position: 'head' },
    );
  }
  // call the setup of voip push notification
  const voipSetupMethod = '[RNVoipPushNotificationManager voipRegistration];';
  if (!contents.includes(voipSetupMethod)) {
    contents = insertContentsInsideObjcFunctionBlock(
      contents,
      DID_FINISH_LAUNCHING_WITH_OPTIONS,
      voipSetupMethod,
      { position: 'head' },
    );
  }
  return contents;
}

function addDidUpdatePushCredentials(contents: string) {
  const updatedPushCredentialsMethod =
    '[RNVoipPushNotificationManager didUpdatePushCredentials:credentials forType:(NSString *)type];';
  if (!contents.includes(updatedPushCredentialsMethod)) {
    const codeblock = findObjcFunctionCodeBlock(
      contents,
      DID_UPDATE_PUSH_CREDENTIALS,
    );
    if (!codeblock) {
      return addNewLinesToAppDelegate(contents, [
        '- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(PKPushType)type {',
        '  ' /* indentation */ + updatedPushCredentialsMethod,
        '}',
      ]);
    } else {
      return insertContentsInsideObjcFunctionBlock(
        contents,
        DID_UPDATE_PUSH_CREDENTIALS,
        updatedPushCredentialsMethod,
        { position: 'tail' },
      );
    }
  }
  return contents;
}

function addDidReceiveIncomingPushCallback(contents: string) {
  const onIncomingPush = `
  // send event to JS
  [RNVoipPushNotificationManager didReceiveIncomingPushWithPayload:payload forType:(NSString *)type];

  // process the payload
  NSDictionary *stream = payload.dictionaryPayload[@"stream"];
  NSString *uuid = [[NSUUID UUID] UUIDString];
  NSString *createdCallerName = stream[@"created_by_display_name"];
  NSString *cid = stream[@"call_cid"];

  [StreamVideoReactNative registerIncomingCall:cid uuid:uuid];

  [RNVoipPushNotificationManager addCompletionHandler:uuid completionHandler:completion];

  // display the incoming call notification
  [RNCallKeep reportNewIncomingCall: uuid
                             handle: createdCallerName
                         handleType: @"generic"
                           hasVideo: YES
                localizedCallerName: createdCallerName
                    supportsHolding: YES
                       supportsDTMF: YES
                   supportsGrouping: YES
                 supportsUngrouping: YES
                        fromPushKit: YES
                            payload: stream
              withCompletionHandler: nil];
`;
  if (
    !contents.includes(
      '[RNVoipPushNotificationManager didReceiveIncomingPushWithPayload',
    )
  ) {
    const codeblock = findObjcFunctionCodeBlock(
      contents,
      DID_RECEIVE_INCOMING_PUSH,
    );
    if (!codeblock) {
      return addNewLinesToAppDelegate(contents, [
        '- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type withCompletionHandler:(void (^)(void))completion {',
        ...onIncomingPush.trim().split('\n'),
        '}',
      ]);
    } else {
      return insertContentsInsideObjcFunctionBlock(
        contents,
        DID_RECEIVE_INCOMING_PUSH,
        onIncomingPush,
        { position: 'tail' },
      );
    }
  }
  return contents;
}

export default withPushAppDelegate;
