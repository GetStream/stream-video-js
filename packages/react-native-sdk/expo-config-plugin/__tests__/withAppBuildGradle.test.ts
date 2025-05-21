import { getFixture } from '../fixtures';
import withAppBuildGradle from '../src/withAppBuildGradle';
import { ExpoConfig } from '@expo/config-types';

interface CustomExpoConfig extends ExpoConfig {
  modResults: {
    contents: string;
  };
}

const sampleGradle = getFixture('app-build.gradle');

// the real withAndroidManifest doesnt return the updated config
// so we mock it to return the updated config using the callback we pass in the actual implementation
jest.mock('@expo/config-plugins', () => {
  const originalModule = jest.requireActual('@expo/config-plugins');
  return {
    ...originalModule,
    withAppBuildGradle: jest.fn((config, callback) => {
      const updatedConfig: CustomExpoConfig = callback(
        config as CustomExpoConfig,
      );
      return updatedConfig;
    }),
  };
});

describe('withStreamVideoReactNativeSDKAndroidPermissions', () => {
  it('should add compile options', () => {
    const inputConfig: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        contents: sampleGradle,
      },
    };

    const updatedConfig = withAppBuildGradle(inputConfig) as CustomExpoConfig;

    expect(
      updatedConfig.modResults.contents.includes('compileOptions'),
    ).toBeTruthy();
  });
});
