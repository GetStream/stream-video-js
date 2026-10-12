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
      expect(result).not.toMatch(/ProcessorProvider/);
      expect(result).toMatch(/#import "StreamVideoReactNative.h"/);
      expect(result).toMatch(/#import <WebRTCModuleOptions.h>/);
      expect(result).toMatch(/#import "ExistingImport.h"/);
    },
  ),
}));

const ExpoModulesAppDelegateSwift = getFixture('AppDelegate.swift');

describe('withStreamVideoReactNativeSDKAppDelegate', () => {
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

  let modifiedConfigSwift: CustomExpoConfig | undefined;
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
      addNoiseCancellation: true,
      ringing: true,
    };

    const updatedConfig = withAppDelegate(config, props) as CustomExpoConfig;

    // Check Swift imports
    expect(updatedConfig.modResults.contents).toMatch(
      /^import stream_io_noise_cancellation_react_native/m,
    );
    expect(updatedConfig.modResults.contents).toMatch(
      /NoiseCancellationManager.getInstance/,
    );
    expect(updatedConfig.modResults.contents).toMatch(/^import WebRTC/m);
    expect(updatedConfig.modResults.contents).toMatch(
      /^import stream_video_react_native/m,
    );
    // Check Swift implementation
    expect(updatedConfig.modResults.contents).toMatch(
      /options.enableMultitaskingCameraAccess = true/,
    );

    // Managed-mode VoIP registration: the SDK owns the PKPushRegistry delegate
    // internally, so the AppDelegate shouldn't have PushKit imports,
    // PKPushRegistryDelegate conformance, or any pushRegistry(...) methods.
    expect(updatedConfig.modResults.contents).toMatch(
      /StreamVideoReactNative\.voipRegistration\(\)/,
    );
    expect(updatedConfig.modResults.contents).not.toMatch(/^import PushKit/m);
    expect(updatedConfig.modResults.contents).not.toContain(
      'PKPushRegistryDelegate',
    );
    expect(updatedConfig.modResults.contents).not.toContain(
      'func pushRegistry(',
    );

    // Recents redial: forwarded at the head of the existing continue override
    expect(updatedConfig.modResults.contents).toMatch(
      /restorationHandler: @escaping \(\[UIUserActivityRestoring\]\?\) -> Void\n {2}\) -> Bool \{\n {4}_ = StreamVideoReactNative\.handleUserActivity\(userActivity\)/,
    );
    expect(
      updatedConfig.modResults.contents.match(/handleUserActivity\(/g),
    ).toHaveLength(1);

    modifiedConfigSwift = updatedConfig;
  });

  it('swift - should not modify config if already added', () => {
    const props: ConfigProps = {
      iOSEnableMultitaskingCameraAccess: true,
      ringing: true,
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

  it('swift - should add a continue override when the template has none', () => {
    const contents = ExpoModulesAppDelegateSwift.replace(
      /\s*\/\/ Universal Links[\s\S]*?super\.application\(application, continue[^\n]*\n {2}\}\n/,
      '\n',
    );
    expect(contents).not.toContain('continue userActivity');
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: { language: 'swift', contents },
      modRequest: { projectRoot: '.' },
    };
    const updated = withAppDelegate(config, {
      ringing: true,
    }) as CustomExpoConfig;
    expect(updated.modResults.contents).toMatch(
      /continue userActivity: NSUserActivity[\s\S]*_ = StreamVideoReactNative\.handleUserActivity\(userActivity\)[\s\S]*return super\.application\(application, continue: userActivity/,
    );
    // still inside AppDelegate (before ReactNativeDelegate)
    expect(
      updated.modResults.contents.indexOf('handleUserActivity('),
    ).toBeLessThan(
      updated.modResults.contents.indexOf('class ReactNativeDelegate'),
    );
  });

  it('should throw a descriptive error for an Objective-C AppDelegate', () => {
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'objcpp',
        contents: '@implementation AppDelegate\n@end',
      },
      modRequest: {
        projectRoot: '.',
      },
    };
    expect(() => withAppDelegate(config, { ringing: true })).toThrow(/Swift/);
  });

  it('swift - should throw error for a malformed AppDelegate', () => {
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'swift',
        // malformed contents
        contents: 'blabla',
      },
      modRequest: {
        projectRoot: '.',
      },
    };
    expect(() => withAppDelegate(config, { ringing: true })).toThrow();
  });
});
