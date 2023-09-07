import withStreamVideoReactNativeSDKManifest from '../src/withAndroidManifest';
import { ExpoConfig } from '@expo/config-types';
import { AndroidConfig } from '@expo/config-plugins';
import { getFixturePath } from '../fixtures';

// Define a custom type that extends ExpoConfig
interface CustomExpoConfig extends ExpoConfig {
  modResults: AndroidConfig.Manifest.AndroidManifest;
}

// the real withAndroidManifest doesnt return the updated config
// so we mock it to return the updated config using the callback we pass in the actual implementation
jest.mock('@expo/config-plugins', () => {
  const originalModule = jest.requireActual('@expo/config-plugins');
  return {
    ...originalModule,
    withAndroidManifest: jest.fn((config, callback) => {
      const updatedConfig: CustomExpoConfig = callback(
        config as CustomExpoConfig,
      );
      return updatedConfig;
    }),
  };
});

const readAndroidManifestAsync =
  AndroidConfig.Manifest.readAndroidManifestAsync;

const getMainApplicationOrThrow =
  AndroidConfig.Manifest.getMainApplicationOrThrow;

const sampleManifestPath = getFixturePath('AndroidManifest.xml');

describe('withStreamVideoReactNativeSDKManifest', () => {
  let modifiedConfig: CustomExpoConfig | undefined;
  it('should modify Android Manifest', async () => {
    const manifest = await readAndroidManifestAsync(sampleManifestPath);
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: manifest,
    };

    const updatedConfig = withStreamVideoReactNativeSDKManifest(
      config,
    ) as CustomExpoConfig;

    const mainApp = getMainApplicationOrThrow(updatedConfig.modResults);

    expect(
      mainApp.service?.some(
        (service) =>
          service.$['android:name'] === 'app.notifee.core.ForegroundService',
      ),
    ).toBe(true);

    modifiedConfig = updatedConfig;
  });

  it('should not create duplicates', () => {
    expect(modifiedConfig?.modResults).toBeDefined();

    const updatedConfig = withStreamVideoReactNativeSDKManifest(
      modifiedConfig!,
    ) as CustomExpoConfig;

    const mainApp = getMainApplicationOrThrow(updatedConfig.modResults);

    expect(
      mainApp.service?.filter(
        (service) =>
          service.$['android:name'] === 'app.notifee.core.ForegroundService',
      ).length,
    ).toBe(1);

    modifiedConfig = updatedConfig;
  });

  it('should throw error for malformed manifest', () => {
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        // @ts-expect-error: we are testing malformed manifest
        bla: 'blabla',
      },
    };
    expect(() => withStreamVideoReactNativeSDKManifest(config)).toThrow();
  });
});
