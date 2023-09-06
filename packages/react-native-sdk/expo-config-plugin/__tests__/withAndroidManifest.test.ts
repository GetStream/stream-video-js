import { withAndroidManifest } from '@expo/config-plugins';
import withStreamVideoReactNativeSDKManifest from '../src/withMainApplication';
import { ExpoConfig } from '@expo/config-types';
import { AndroidConfig } from '@expo/config-plugins';
import { getFixturePath } from '../fixtures';

// Define a custom type that extends ExpoConfig
interface CustomExpoConfig extends ExpoConfig {
  modResults: AndroidConfig.Manifest.AndroidManifest;
}

const readAndroidManifestAsync =
  AndroidConfig.Manifest.readAndroidManifestAsync;

const getMainApplicationOrThrow =
  AndroidConfig.Manifest.getMainApplicationOrThrow;

jest.mock('@expo/config-plugins', () => {
  const originalModule = jest.requireActual('@expo/config-plugins');
  return {
    ...originalModule,
    withMainApplication: jest.fn(),
  };
});

jest.mock('@expo/config-plugins', () => {
  const originalModule = jest.requireActual('@expo/config-plugins');
  return {
    ...originalModule,
    withAndroidManifest: jest.fn(),
  };
});

const sampleManifestPath = getFixturePath('AndroidManifest.xml');

describe('withStreamVideoReactNativeSDKManifest', () => {
  beforeEach(() => {
    // Mock the behavior of withAndroidManifest
    (withAndroidManifest as jest.Mock).mockImplementationOnce(
      (config, callback) => {
        const updatedConfig: CustomExpoConfig = callback(
          config as CustomExpoConfig,
        );
        return updatedConfig;
      },
    );
  });

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

    // Assert that withAndroidManifest was called with the correct arguments
    expect(withAndroidManifest).toHaveBeenCalledWith(
      config,
      expect.any(Function),
    );

    // Assert that the updated config contains the expected changes
    expect(
      mainApp.service?.some(
        (service) =>
          service.$['android:name'] === 'app.notifee.core.ForegroundService',
      ),
    ).toBe(true);
  });
});
