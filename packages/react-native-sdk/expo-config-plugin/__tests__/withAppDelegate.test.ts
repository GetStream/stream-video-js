import { withAppDelegate } from '@expo/config-plugins';
import { getFixture } from '../fixtures/index';
import withStreamVideoReactNativeSDKAppDelegate from '../src/withAppDelegate';
import { ExpoConfig } from '@expo/config-types';
import { insertContentsInsideObjcFunctionBlock } from '@expo/config-plugins/build/ios/codeMod';

// Define a custom type that extends ExpoConfig
interface CustomExpoConfig extends ExpoConfig {
  modResults: {
    language: string;
    contents: string;
  };
}

jest.mock('@expo/config-plugins', () => {
  const originalModule = jest.requireActual('@expo/config-plugins');
  return {
    ...originalModule,
    withAppDelegate: jest.fn(),
  };
});

const ExpoModulesAppDelegate = getFixture('AppDelegate.mm');

describe('withStreamVideoReactNativeSDKAppDelegate', () => {
  beforeEach(() => {
    // Mock the behavior of withAppDelegate
    (withAppDelegate as jest.Mock).mockImplementationOnce(
      (config, callback) => {
        const updatedConfig: CustomExpoConfig = callback(
          config as CustomExpoConfig,
        );
        return updatedConfig;
      },
    );
  });
  it('should modify config for Objective-C AppDelegate', () => {
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'objc',
        contents: ExpoModulesAppDelegate,
      },
    };

    const updatedConfig = withStreamVideoReactNativeSDKAppDelegate(
      config,
    ) as CustomExpoConfig;

    // Assert that withAppDelegate was called with the correct arguments
    expect(withAppDelegate).toHaveBeenCalledWith(config, expect.any(Function));

    expect(updatedConfig.modResults.contents).toMatch(
      /#import "StreamVideoReactNative.h"/,
    );

    // Assert that the updated config contains the expected changes
    expect(updatedConfig.modResults.contents).toContain(
      '[StreamVideoReactNative setup]',
    );
  });

  it('should not modify config for Objective-C AppDelegate when the content is already present', () => {
    const setupMethod = '[StreamVideoReactNative setup];';
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'objc',
        contents: insertContentsInsideObjcFunctionBlock(
          ExpoModulesAppDelegate,
          'application:didFinishLaunchingWithOptions:',
          setupMethod,
          { position: 'head' },
        ),
      },
    };

    const updatedConfig = withStreamVideoReactNativeSDKAppDelegate(
      config,
    ) as CustomExpoConfig;

    // Assert that withAppDelegate was called with the correct arguments
    expect(withAppDelegate).toHaveBeenCalledWith(config, expect.any(Function));

    const count =
      updatedConfig.modResults.contents.split(setupMethod).length - 1;

    // Assert that the updated config contains the expected changes only once
    expect(count).toBe(1);
  });

  it('should throw error for different language AppDelegate', () => {
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'java',
        contents: ExpoModulesAppDelegate,
      },
    };

    expect(() => withStreamVideoReactNativeSDKAppDelegate(config)).toThrow(
      'Cannot setup StreamVideoReactNativeSDK because the AppDelegate is not Objective C',
    );
  });
});
