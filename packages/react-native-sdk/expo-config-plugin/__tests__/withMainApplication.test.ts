import { getFixture } from '../fixtures/index';
import withStreamVideoReactNativeSDKMainApplication from '../src/withMainApplication';
import { ExpoConfig } from '@expo/config-types';
import { appendContentsInsideDeclarationBlock } from '@expo/config-plugins/build/android/codeMod';

// Define a custom type that extends ExpoConfig
interface CustomExpoConfig extends ExpoConfig {
  modResults: {
    language: string;
    contents: string;
  };
}

// the real withMainApplication doesnt return the updated config
// so we mock it to return the updated config using the callback we pass in the actual implementation
jest.mock('@expo/config-plugins', () => {
  const originalModule = jest.requireActual('@expo/config-plugins');
  return {
    ...originalModule,
    withMainApplication: jest.fn((config, callback) => {
      const updatedConfig: CustomExpoConfig = callback(
        config as CustomExpoConfig,
      );
      return updatedConfig;
    }),
  };
});

const ExpoModulesMainApplication = getFixture('MainApplication.java');

describe('withStreamVideoReactNativeSDKMainApplication', () => {
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

    expect(updatedConfig.modResults.contents).toMatch(
      'com.streamvideo.reactnative.StreamVideoReactNative',
    );

    // Assert that the updated config contains the expected changes
    expect(updatedConfig.modResults.contents).toContain(
      'StreamVideoReactNative.setup();',
    );
  });

  it('should not modify config for Java MainApplication when the content is already present', () => {
    const setupMethod = 'StreamVideoReactNative.setup();\n';
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'java',
        contents: appendContentsInsideDeclarationBlock(
          ExpoModulesMainApplication,
          'onCreate',
          setupMethod,
        ),
      },
    };

    const updatedConfig = withStreamVideoReactNativeSDKMainApplication(
      config,
    ) as CustomExpoConfig;

    const count =
      updatedConfig.modResults.contents.split(setupMethod).length - 1;

    // Assert that the updated config contains the expected changes
    expect(count).toBe(1);
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
