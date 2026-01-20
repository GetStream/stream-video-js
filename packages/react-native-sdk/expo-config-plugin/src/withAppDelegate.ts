import {
  type ConfigPlugin,
  withAppDelegate as withAppDelegateUtil,
} from '@expo/config-plugins';
import {
  addSwiftImports,
  insertContentsInsideSwiftClassBlock,
  insertContentsInsideSwiftFunctionBlock,
  findSwiftFunctionCodeBlock,
  addObjcImports,
  findObjcFunctionCodeBlock,
  insertContentsInsideObjcFunctionBlock,
} from '@expo/config-plugins/build/ios/codeMod';

import { type ConfigProps } from './common/types';
import addNewLinesToAppDelegateObjc from './common/addNewLinesToAppDelegateObjc';
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
            ['<PushKit/PushKit.h>', '"StreamVideoReactNative.h"'],
          );

          config.modResults.contents =
            addDidFinishLaunchingWithOptionsRingingObjc(
              config.modResults.contents,
            );

          config.modResults.contents = addDidUpdatePushCredentialsObjc(
            config.modResults.contents,
          );

          config.modResults.contents = addDidReceiveIncomingPushCallbackObjc(
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
        if (props?.ringing) {
          // make it public class AppDelegate: ExpoAppDelegate, PKPushRegistryDelegate {
          const regex = /(class\s+AppDelegate[^{]*)(\s*\{)/;
          config.modResults.contents = config.modResults.contents.replace(
            regex,
            (match, declarationPart, openBrace) => {
              // Check if PKPushRegistryDelegate is already in the declaration part
              if (declarationPart.includes('PKPushRegistryDelegate')) {
                return match; // Already present, no change needed
              }

              const trimmedDecl = declarationPart.trimRight();

              // If the declaration already has a colon (superclass or other protocols)
              if (trimmedDecl.includes(':')) {
                return `${trimmedDecl}, PKPushRegistryDelegate${openBrace}`;
              } else {
                // No colon, so AppDelegate is the first thing to be listed after :
                // This means the class declaration was like "class AppDelegate {"
                return `${trimmedDecl}: PKPushRegistryDelegate${openBrace}`;
              }
            },
          );
        }
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
            ['PushKit', 'stream_video_react_native'],
          );
          config.modResults.contents =
            addDidFinishLaunchingWithOptionsRingingSwift(
              config.modResults.contents,
            );

          config.modResults.contents = addDidUpdatePushCredentialsSwift(
            config.modResults.contents,
          );

          config.modResults.contents = addDidReceiveIncomingPushCallbackSwift(
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
  // call the setup of voip push notification
  const voipSetupMethod = 'StreamVideoReactNative.voipRegistration()';
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

function addDidFinishLaunchingWithOptionsRingingObjc(contents: string) {
  const functionSelector = 'application:didFinishLaunchingWithOptions:';
  // call the setup of voip push notification
  const voipSetupMethod = '[StreamVideoReactNative voipRegistration];';
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
    'StreamVideoReactNative.didUpdate(credentials, forType: type.rawValue)';

  if (!contents.includes(updatedPushCredentialsMethod)) {
    const functionSelector = 'pushRegistry(_:didUpdate:for:)';
    const codeblock = findSwiftFunctionCodeBlock(contents, functionSelector);
    if (!codeblock) {
      return insertContentsInsideSwiftClassBlock(
        contents,
        'class AppDelegate',
        `
    public func pushRegistry(
      _ registry: PKPushRegistry,
      didUpdate credentials: PKPushCredentials,
      for type: PKPushType
    ) {
      ${updatedPushCredentialsMethod}
    }
            `,
        { position: 'tail' },
      );
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
    '[StreamVideoReactNative didUpdatePushCredentials:credentials forType: (NSString *) type];';
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

function addDidReceiveIncomingPushCallbackSwift(contents: string) {
  const onIncomingPush = `
    StreamVideoReactNative.didReceiveIncomingPush(payload, forType: type.rawValue, completionHandler: completion)`;
  if (!contents.includes('StreamVideoReactNative.didReceiveIncomingPush')) {
    const functionSelector =
      'pushRegistry(_:didReceiveIncomingPushWith:for:completion:)';
    const codeblock = findSwiftFunctionCodeBlock(contents, functionSelector);
    if (!codeblock) {
      return insertContentsInsideSwiftClassBlock(
        contents,
        'class AppDelegate',
        `
  public func pushRegistry(
    _ registry: PKPushRegistry,
    didReceiveIncomingPushWith payload: PKPushPayload,
    for type: PKPushType,
    completion: @escaping () -> Void
  ) {
    ${onIncomingPush}
  }
        `,
        { position: 'tail' },
      );
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
  // process the payload and display the incoming call notification
  [StreamVideoReactNative didReceiveIncomingPush:payload forType: (NSString *)type completionHandler:completion];
`;
  if (!contents.includes('[StreamVideoReactNative didReceiveIncomingPush')) {
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
