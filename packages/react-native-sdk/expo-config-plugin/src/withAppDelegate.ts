import {
  type ConfigPlugin,
  withAppDelegate as withAppDelegateUtil,
} from '@expo/config-plugins';
import {
  addSwiftImports,
  insertContentsInsideSwiftFunctionBlock,
  findSwiftFunctionCodeBlock,
  addObjcImports,
  findObjcFunctionCodeBlock,
  insertContentsInsideObjcFunctionBlock,
} from '@expo/config-plugins/build/ios/codeMod';

import {
  type ConfigProps,
  type RingingPushNotifications,
} from './common/types';
import addNewLinesToAppDelegateObjc from './common/addNewLinesToAppDelegateObjc';
import addNewLinesToAppDelegateSwift from './common/addNewLinesToAppDelegateSwift';
import { addToSwiftBridgingHeaderFile } from './common/addToSwiftBridgingHeaderFile';

const withAppDelegate: ConfigPlugin<ConfigProps> = (configuration, props) => {
  return withAppDelegateUtil(configuration, (config) => {
    if (
      !props?.ringingPushNotifications &&
      !props?.iOSEnableMultitaskingCameraAccess
    ) {
      // quit early if no change is necessary
      return config;
    }
    if (['objc', 'objcpp'].includes(config.modResults.language)) {
      try {
        config.modResults.contents = addDidFinishLaunchingWithOptionsObjc(
          config.modResults.contents,
          props.iOSEnableMultitaskingCameraAccess,
        );
        if (props?.ringingPushNotifications) {
          config.modResults.contents = addObjcImports(
            config.modResults.contents,
            [
              '"RNCallKeep.h"',
              '<PushKit/PushKit.h>',
              '"RNVoipPushNotificationManager.h"',
              '"StreamVideoReactNative.h"',
              '<WebRTC/RTCAudioSession.h>',
            ],
          );

          config.modResults.contents =
            addDidFinishLaunchingWithOptionsRingingObjc(
              config.modResults.contents,
              props.ringingPushNotifications,
            );

          config.modResults.contents = addDidUpdatePushCredentialsObjc(
            config.modResults.contents,
          );

          config.modResults.contents = addDidReceiveIncomingPushCallbackObjc(
            config.modResults.contents,
          );

          config.modResults.contents = addAudioSessionMethodsObjc(
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
        config.modResults.contents = addDidFinishLaunchingWithOptionsSwift(
          config.modResults.contents,
          props.iOSEnableMultitaskingCameraAccess,
        );
        if (props?.ringingPushNotifications) {
          config.modResults.contents = addSwiftImports(
            config.modResults.contents,
            ['RNCallKeep', 'PushKit', 'RNVoipPushNotification'],
          );
          config.modResults.contents =
            addDidFinishLaunchingWithOptionsRingingSwift(
              config.modResults.contents,
              props.ringingPushNotifications,
            );

          config.modResults.contents = addDidUpdatePushCredentialsSwift(
            config.modResults.contents,
          );

          config.modResults.contents = addDidReceiveIncomingPushCallbackSwift(
            config.modResults.contents,
          );

          config.modResults.contents = addAudioSessionMethodsSwift(
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
) {
  if (iOSEnableMultitaskingCameraAccess) {
    const functionSelector = 'application(_:didFinishLaunchingWithOptions:)';
    const setupMethod = `let options = WebRTCModuleOptions.sharedInstance()
    options.enableMultitaskingCameraAccess = true`;

    if (!contents.includes('options.enableMultitaskingCameraAccess = true')) {
      contents = insertContentsInsideSwiftFunctionBlock(
        contents,
        functionSelector,
        setupMethod,
        { position: 'tailBeforeLastReturn' },
      );
    }
  }
  return contents;
}

function addDidFinishLaunchingWithOptionsObjc(
  contents: string,
  iOSEnableMultitaskingCameraAccess: boolean | undefined,
) {
  if (iOSEnableMultitaskingCameraAccess) {
    const functionSelector = 'application:didFinishLaunchingWithOptions:';
    contents = addObjcImports(contents, ['<WebRTCModuleOptions.h>']);

    const setupMethod = `WebRTCModuleOptions *options = [WebRTCModuleOptions sharedInstance];
  options.enableMultitaskingCameraAccess = YES;`;

    if (!contents.includes('options.enableMultitaskingCameraAccess = YES')) {
      contents = insertContentsInsideObjcFunctionBlock(
        contents,
        functionSelector,
        setupMethod,
        { position: 'tailBeforeLastReturn' },
      );
    }
  }
  return contents;
}

function addDidFinishLaunchingWithOptionsRingingSwift(
  contents: string,
  ringingPushNotifications: RingingPushNotifications,
) {
  const functionSelector = 'application(_:didFinishLaunchingWithOptions:)';
  const supportsVideoString = ringingPushNotifications.disableVideoIos
    ? 'false'
    : 'true';
  const includesCallsInRecents =
    ringingPushNotifications.includesCallsInRecentsIos ? 'false' : 'true';
  const setupCallKeep = `  let localizedAppName = Bundle.main.localizedInfoDictionary?["CFBundleDisplayName"] as? String
    let appName = Bundle.main.infoDictionary?["CFBundleDisplayName"] as? String
    RNCallKeep.setup([
      "appName": localizedAppName != nil ? localizedAppName! : appName as Any,
      "supportsVideo": ${supportsVideoString},
      "includesCallsInRecents": ${includesCallsInRecents},
    ])`;
  if (!contents.includes('RNCallKeep.setup')) {
    contents = insertContentsInsideSwiftFunctionBlock(
      contents,
      functionSelector,
      setupCallKeep,
      { position: 'head' },
    );
  }
  // call the setup of voip push notification
  const voipSetupMethod = 'RNVoipPushNotificationManager.voipRegistration()';
  if (!contents.includes(voipSetupMethod)) {
    contents = insertContentsInsideSwiftFunctionBlock(
      contents,
      functionSelector,
      '  ' /* indentation */ + voipSetupMethod,
      { position: 'head' },
    );
  }
  return contents;
}

function addDidFinishLaunchingWithOptionsRingingObjc(
  contents: string,
  ringingPushNotifications: RingingPushNotifications,
) {
  const functionSelector = 'application:didFinishLaunchingWithOptions:';
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
      functionSelector,
      setupCallKeep,
      { position: 'head' },
    );
  }
  // call the setup of voip push notification
  const voipSetupMethod = '[RNVoipPushNotificationManager voipRegistration];';
  if (!contents.includes(voipSetupMethod)) {
    contents = insertContentsInsideObjcFunctionBlock(
      contents,
      functionSelector,
      voipSetupMethod,
      { position: 'head' },
    );
  }
  return contents;
}

function addDidUpdatePushCredentialsSwift(contents: string) {
  const updatedPushCredentialsMethod =
    'RNVoipPushNotificationManager.didUpdate(credentials, forType: type.rawValue)';

  if (!contents.includes(updatedPushCredentialsMethod)) {
    const functionSelector = 'pushRegistry(_:didUpdate:for:)';
    const codeblock = findSwiftFunctionCodeBlock(contents, functionSelector);
    if (!codeblock) {
      return addNewLinesToAppDelegateSwift(contents, [
        'func pushRegistry(',
        '  _ registry: PKPushRegistry,',
        '  didUpdate credentials: PKPushCredentials,',
        '  for type: PKPushType',
        ') {',
        '  ' /* indentation */ + updatedPushCredentialsMethod,
        '}',
      ]);
    } else {
      return insertContentsInsideSwiftFunctionBlock(
        contents,
        functionSelector,
        updatedPushCredentialsMethod,
        { position: 'tail' },
      );
    }
  }
  return contents;
}

function addDidUpdatePushCredentialsObjc(contents: string) {
  const updatedPushCredentialsMethod =
    '[RNVoipPushNotificationManager didUpdatePushCredentials:credentials forType:(NSString *)type];';
  if (!contents.includes(updatedPushCredentialsMethod)) {
    const functionSelector = 'pushRegistry:didUpdatePushCredentials:forType:';
    const codeblock = findObjcFunctionCodeBlock(contents, functionSelector);
    if (!codeblock) {
      return addNewLinesToAppDelegateObjc(contents, [
        '- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(PKPushType)type {',
        '  ' /* indentation */ + updatedPushCredentialsMethod,
        '}',
      ]);
    } else {
      return insertContentsInsideObjcFunctionBlock(
        contents,
        functionSelector,
        updatedPushCredentialsMethod,
        { position: 'tail' },
      );
    }
  }
  return contents;
}

function addAudioSessionMethodsSwift(contents: string) {
  const audioSessionDidActivateMethod =
    'RTCAudioSession.sharedInstance().audioSessionDidActivate(AVAudioSession.sharedInstance())';
  if (!contents.includes(audioSessionDidActivateMethod)) {
    const functionSelector = 'provider(_:didActivate:)';
    const codeblock = findSwiftFunctionCodeBlock(contents, functionSelector);
    if (!codeblock) {
      contents = addNewLinesToAppDelegateSwift(contents, [
        'func provider(_ provider: CXProvider, didActivateAudioSession audioSession: AVAudioSession) {',
        '  ' /* indentation */ + audioSessionDidActivateMethod,
        '}',
      ]);
    } else {
      contents = insertContentsInsideSwiftFunctionBlock(
        contents,
        functionSelector,
        audioSessionDidActivateMethod,
        { position: 'tail' },
      );
    }
  }
  const audioSessionDidDeactivateMethod =
    'RTCAudioSession.sharedInstance().audioSessionDidDeactivate(AVAudioSession.sharedInstance())';

  if (!contents.includes(audioSessionDidDeactivateMethod)) {
    const functionSelector = 'provider(_:didDeactivate:)';
    const codeblock = findSwiftFunctionCodeBlock(contents, functionSelector);
    if (!codeblock) {
      contents = addNewLinesToAppDelegateSwift(contents, [
        'func provider(_ provider: CXProvider, didDeactivateAudioSession audioSession: AVAudioSession) {',
        '  ' /* indentation */ + audioSessionDidDeactivateMethod,
        '}',
      ]);
    } else {
      contents = insertContentsInsideSwiftFunctionBlock(
        contents,
        functionSelector,
        audioSessionDidDeactivateMethod,
        { position: 'tail' },
      );
    }
  }
  return contents;
}

function addAudioSessionMethodsObjc(contents: string) {
  const audioSessionDidActivateMethod =
    '[[RTCAudioSession sharedInstance] audioSessionDidActivate:[AVAudioSession sharedInstance]];';
  if (!contents.includes(audioSessionDidActivateMethod)) {
    const functionSelector = 'provider:didActivateAudioSession:audioSession:';
    const codeblock = findObjcFunctionCodeBlock(contents, functionSelector);
    if (!codeblock) {
      contents = addNewLinesToAppDelegateObjc(contents, [
        '- (void) provider:(CXProvider *) provider didActivateAudioSession:(AVAudioSession *) audioSession {',
        '  ' /* indentation */ + audioSessionDidActivateMethod,
        '}',
      ]);
    } else {
      contents = insertContentsInsideObjcFunctionBlock(
        contents,
        functionSelector,
        audioSessionDidActivateMethod,
        { position: 'tail' },
      );
    }
  }
  const audioSessionDidDeactivateMethod =
    '[[RTCAudioSession sharedInstance] audioSessionDidDeactivate:[AVAudioSession sharedInstance]];';

  if (!contents.includes(audioSessionDidDeactivateMethod)) {
    const functionSelector = 'provider:didDeactivateAudioSession:audioSession:';
    const codeblock = findObjcFunctionCodeBlock(contents, functionSelector);
    if (!codeblock) {
      contents = addNewLinesToAppDelegateObjc(contents, [
        '- (void) provider:(CXProvider *) provider didDeactivateAudioSession:(AVAudioSession *) audioSession {',
        '  ' /* indentation */ + audioSessionDidDeactivateMethod,
        '}',
      ]);
    } else {
      contents = insertContentsInsideObjcFunctionBlock(
        contents,
        functionSelector,
        audioSessionDidDeactivateMethod,
        { position: 'tail' },
      );
    }
  }
  return contents;
}

function addDidReceiveIncomingPushCallbackSwift(contents: string) {
  const onIncomingPush = `
  guard let stream = payload.dictionaryPayload["stream"] as? [String: Any],
          let createdCallerName = stream["created_by_display_name"] as? String,
          let cid = stream["call_cid"] as? String else {
      completion()
      return
    }
    
    let uuid = UUID().uuidString
    
    StreamVideoReactNative.registerIncomingCall(cid, uuid: uuid)
    
    RNVoipPushNotificationManager.addCompletionHandler(uuid, completionHandler: completion)
    
    RNVoipPushNotificationManager.didReceiveIncomingPush(with: payload, forType: type.rawValue)
    
    RNCallKeep.reportNewIncomingCall(uuid,
                                     handle: createdCallerName,
                                     handleType: "generic",
                                     hasVideo: true,
                                     localizedCallerName: createdCallerName,
                                     supportsHolding: true,
                                     supportsDTMF: true,
                                     supportsGrouping: true,
                                     supportsUngrouping: true,
                                     fromPushKit: true,
                                     payload: stream,
                                     withCompletionHandler: nil)
  if (
    !contents.includes('RNVoipPushNotificationManager.didReceiveIncomingPush')
  ) {
    const functionSelector =
      'pushRegistry(_:didReceiveIncomingPushWith:for:completion:)';
    const codeblock = findSwiftFunctionCodeBlock(contents, functionSelector);
    if (!codeblock) {
      return addNewLinesToAppDelegateSwift(contents, [
        'func pushRegistry(',
        '  _ registry: PKPushRegistry,',
        '  didReceiveIncomingPushWith payload: PKPushPayload,',
        '  for type: PKPushType,',
        '  completion: @escaping () -> Void',
        ') {',
        '  ' /* indentation */ + onIncomingPush,
        '}',
      ]);
    } else {
      return insertContentsInsideSwiftFunctionBlock(
        contents,
        functionSelector,
        onIncomingPush,
        { position: 'tail' },
      );
    }
  }
  return contents;
}

function addDidReceiveIncomingPushCallbackObjc(contents: string) {
  const onIncomingPush = `
  // process the payload and store it in the native module's cache
  NSDictionary *stream = payload.dictionaryPayload[@"stream"];
  NSString *uuid = [[NSUUID UUID] UUIDString];
  NSString *createdCallerName = stream[@"created_by_display_name"];
  NSString *cid = stream[@"call_cid"];

  // store the call cid and uuid in the native module's cache
  [StreamVideoReactNative registerIncomingCall:cid uuid:uuid];

  // set the completion handler - this one is called by the JS SDK
  [RNVoipPushNotificationManager addCompletionHandler:uuid completionHandler:completion];

  // send event to JS - the JS SDK will handle the rest and call the 'completionHandler'
  [RNVoipPushNotificationManager didReceiveIncomingPushWithPayload:payload forType:(NSString *)type];

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
    const functionSelector =
      'pushRegistry:didReceiveIncomingPushWithPayload:forType:withCompletionHandler:';
    const codeblock = findObjcFunctionCodeBlock(contents, functionSelector);
    if (!codeblock) {
      return addNewLinesToAppDelegateObjc(contents, [
        '- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type withCompletionHandler:(void (^)(void))completion {',
        ...onIncomingPush.trim().split('\n'),
        '}',
      ]);
    } else {
      return insertContentsInsideObjcFunctionBlock(
        contents,
        functionSelector,
        onIncomingPush,
        { position: 'tail' },
      );
    }
  }
  return contents;
}

export default withAppDelegate;
