import { getFixture } from '../fixtures/index';
import withAppDelegate from '../src/withAppDelegate';
import { ExpoConfig } from '@expo/config-types';
import { ConfigProps } from '../src/common/types';

// Define a custom type that extends ExpoConfig
interface CustomExpoConfig extends ExpoConfig {
  modResults: {
    language: string;
    contents: string;
  };
  modRequest: {
    projectRoot: string;
  };
}

// the real withAppDelegate doesnt return the updated config
// so we mock it to return the updated config using the callback we pass in the actual implementation
jest.mock('@expo/config-plugins', () => {
  const originalModule = jest.requireActual('@expo/config-plugins');
  return {
    ...originalModule,
    withAppDelegate: jest.fn((config, callback) => {
      const updatedConfig: CustomExpoConfig = callback(
        config as CustomExpoConfig,
      );
      return updatedConfig;
    }),
  };
});

jest.mock('../src/common/addToSwiftBridgingHeaderFile', () => ({
  addToSwiftBridgingHeaderFile: jest.fn(
    (_: string, action: (headerFileContents: string) => string) => {
      const result = action('#import "ExistingImport.h"');
      expect(result).toMatch(/#import "ProcessorProvider.h"/);
      expect(result).toMatch(/#import "StreamVideoReactNative.h"/);
      expect(result).toMatch(/#import <WebRTCModuleOptions.h>/);
      expect(result).toMatch(/#import "ExistingImport.h"/);
    },
  ),
}));

// Expo 53 and above
const ExpoModulesAppDelegateSwift = getFixture('AppDelegate.swift');

// Expo 52 and below
const ExpoModulesAppDelegate = getFixture('AppDelegate.mm');

describe('withStreamVideoReactNativeSDKAppDelegate', () => {
  it('objc - should not modify config if push is not enabled', () => {
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'objc',
        contents: ExpoModulesAppDelegate,
      },
      modRequest: {
        projectRoot: '.',
      },
    };

    const props: ConfigProps = {};
    const updatedConfig = withAppDelegate(config, props) as CustomExpoConfig;

    expect(
      updatedConfig.modResults.contents === config.modResults.contents,
    ).toBeTruthy();
  });

  it('swift - should not modify config if push is not enabled', () => {
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'swift',
        contents: ExpoModulesAppDelegateSwift,
      },
      modRequest: {
        projectRoot: '.',
      },
    };

    const props: ConfigProps = {};
    const updatedConfig = withAppDelegate(config, props) as CustomExpoConfig;

    expect(
      updatedConfig.modResults.contents === config.modResults.contents,
    ).toBeTruthy();
  });

  let modifiedConfigObjC: CustomExpoConfig | undefined;
  let modifiedConfigSwift: CustomExpoConfig | undefined;
  it('objc - should modify config as per props', () => {
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'objc',
        contents: ExpoModulesAppDelegate,
      },
      modRequest: {
        projectRoot: '.',
      },
    };

    const props: ConfigProps = {
      iOSEnableMultitaskingCameraAccess: true,
      ringingPushNotifications: {
        disableVideoIos: true,
        includesCallsInRecentsIos: true,
      },
    };

    const updatedConfig = withAppDelegate(config, props) as CustomExpoConfig;

    expect(updatedConfig.modResults.contents).toMatch(
      /#import <WebRTCModuleOptions.h>/,
    );
    expect(updatedConfig.modResults.contents).toMatch(
      /options.enableMultitaskingCameraAccess = YES/,
    );
    expect(updatedConfig.modResults.contents).toMatch(/#import "RNCallKeep.h"/);
    expect(updatedConfig.modResults.contents).toMatch(
      /#import <PushKit\/PushKit.h>/,
    );
    expect(updatedConfig.modResults.contents).toMatch(
      /#import "RNVoipPushNotificationManager.h"/,
    );
    expect(updatedConfig.modResults.contents).toMatch(/@"supportsVideo": @NO/);
    expect(updatedConfig.modResults.contents).toMatch(
      /@"includesCallsInRecents": @YES/,
    );
    expect(updatedConfig.modResults.contents).toMatch(
      /didUpdatePushCredentials:credentials/,
    );
    expect(updatedConfig.modResults.contents).toMatch(
      /didReceiveIncomingPushWithPayload:payload/,
    );
    expect(updatedConfig.modResults.contents).toMatch(/reportNewIncomingCall/);

    expect(updatedConfig.modResults.contents).toMatch(
      /#import <WebRTC\/RTCAudioSession.h>/,
    );

    expect(updatedConfig.modResults.contents).toMatch(
      /audioSessionDidActivate/,
    );
    expect(updatedConfig.modResults.contents).toMatch(
      /audioSessionDidDeactivate/,
    );

    modifiedConfigObjC = updatedConfig;
  });

  it('swift - should modify config as per props', () => {
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'swift',
        contents: ExpoModulesAppDelegateSwift,
      },
      modRequest: {
        projectRoot: '.',
      },
    };

    const props: ConfigProps = {
      iOSEnableMultitaskingCameraAccess: true,
      ringingPushNotifications: {
        disableVideoIos: true,
        includesCallsInRecentsIos: true,
      },
    };

    const updatedConfig = withAppDelegate(config, props) as CustomExpoConfig;

    // Check Swift imports
    expect(updatedConfig.modResults.contents).toMatch(/import WebRTC/);
    expect(updatedConfig.modResults.contents).toMatch(/import RNCallKeep/);
    expect(updatedConfig.modResults.contents).toMatch(/import PushKit/);
    expect(updatedConfig.modResults.contents).toMatch(
      /import RNVoipPushNotification/,
    );
    expect(updatedConfig.modResults.contents).toMatch(
      /import StreamVideoReactNative.h/,
    );

    // Check Swift implementation
    expect(updatedConfig.modResults.contents).toMatch(
      /options.enableMultitaskingCameraAccess = true/,
    );
    expect(updatedConfig.modResults.contents).toMatch(/"supportsVideo": false/);
    expect(updatedConfig.modResults.contents).toMatch(
      /"includesCallsInRecents": false/,
    );
    expect(updatedConfig.modResults.contents).toMatch(
      /RNVoipPushNotificationManager.didUpdate/,
    );
    expect(updatedConfig.modResults.contents).toMatch(
      /RNVoipPushNotificationManager.didReceiveIncomingPush/,
    );
    expect(updatedConfig.modResults.contents).toMatch(
      /RNCallKeep.reportNewIncomingCall/,
    );

    expect(updatedConfig.modResults.contents).toMatch(
      /audioSessionDidActivate/,
    );
    expect(updatedConfig.modResults.contents).toMatch(
      /audioSessionDidDeactivate/,
    );

    modifiedConfigSwift = updatedConfig;
  });

  it('objc - should not modify config if already added', () => {
    const props: ConfigProps = {
      iOSEnableMultitaskingCameraAccess: true,
      ringingPushNotifications: {
        disableVideoIos: true,
        includesCallsInRecentsIos: true,
      },
    };

    const updatedConfig = withAppDelegate(
      modifiedConfigObjC!,
      props,
    ) as CustomExpoConfig;

    expect(
      modifiedConfigObjC!.modResults.contents ===
        updatedConfig.modResults.contents,
    ).toBeTruthy();
  });

  it('swift - should not modify config if already added', () => {
    const props: ConfigProps = {
      iOSEnableMultitaskingCameraAccess: true,
      ringingPushNotifications: {
        disableVideoIos: true,
        includesCallsInRecentsIos: true,
      },
    };

    const updatedConfig = withAppDelegate(
      modifiedConfigSwift!,
      props,
    ) as CustomExpoConfig;

    expect(
      modifiedConfigSwift!.modResults.contents ===
        updatedConfig.modResults.contents,
    ).toBeTruthy();
  });

  it('objc - should throw error for malformed manifest and unsupported language', () => {
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'objc',
        // malformed contents
        contents: 'blabla',
      },
      modRequest: {
        projectRoot: '.',
      },
    };
    const props: ConfigProps = {
      ringingPushNotifications: {
        disableVideoIos: true,
        includesCallsInRecentsIos: false,
      },
    };
    expect(() => withAppDelegate(config, props)).toThrow();
  });

  it('swift - should throw error for malformed manifest and unsupported language', () => {
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'objc',
        // malformed contents
        contents: 'blabla',
      },
      modRequest: {
        projectRoot: '.',
      },
    };
    const props: ConfigProps = {
      ringingPushNotifications: {
        disableVideoIos: true,
        includesCallsInRecentsIos: false,
      },
    };
    expect(() => withAppDelegate(config, props)).toThrow();
  });
});
