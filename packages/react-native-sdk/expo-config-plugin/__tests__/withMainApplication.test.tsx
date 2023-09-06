import { withMainApplication } from '@expo/config-plugins';
import { getFixture } from '../fixtures/index';
import withStreamVideoReactNativeSDKMainApplication from '../src/withMainApplication';
import { ExpoConfig } from '@expo/config-types';

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
    withMainApplication: jest.fn(),
  };
});

const ExpoModulesMainApplication = getFixture('MainApplication.java');

describe('withStreamVideoReactNativeSDKMainApplication', () => {
  beforeEach(() => {
    // Mock the behavior of withAppDelegate
    (withMainApplication as jest.Mock).mockImplementationOnce(
      (config, callback) => {
        const updatedConfig: CustomExpoConfig = callback(
          config as CustomExpoConfig,
        );
        return updatedConfig;
      },
    );
  });

  it('should modify config for Java MainApplication', () => {
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'java',
        contents: ExpoModulesMainApplication,
      },
    };

    const updatedConfig = withStreamVideoReactNativeSDKMainApplication(
      config,
    ) as CustomExpoConfig;

    // Assert that withAppDelegate was called with the correct arguments
    expect(withMainApplication).toHaveBeenCalledWith(
      config,
      expect.any(Function),
    );

    expect(updatedConfig.modResults.contents).toMatch(
      'com.streamvideo.reactnative.StreamVideoReactNative',
    );

    // Assert that the updated config contains the expected changes
    expect(updatedConfig.modResults.contents).toContain(
      'StreamVideoReactNative.setup();',
    );
  });

  it('should throw error for different language MainApplication', () => {
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'objc',
        contents: ExpoModulesMainApplication,
      },
    };

    expect(() => withStreamVideoReactNativeSDKMainApplication(config)).toThrow(
      'Cannot setup StreamVideoReactNativeSDK because the MainApplication is not in Java/Kotlin',
    );
  });

  it(`fails to add to a malformed MainApplication`, () => {
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'java',
        contents: `foobar`,
      },
    };
    expect(() => withStreamVideoReactNativeSDKMainApplication(config)).toThrow(
      "Cannot add StreamVideoReactNativeSDK to the project's MainApplication because it's malformed.",
    );
  });
});
