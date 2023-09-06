import withStreamVideoReactNativeSDKManifest from '../src/withAndroidManifest';
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

const sampleManifestPath = getFixturePath('AndroidManifest.xml');

describe('withStreamVideoReactNativeSDKManifest', () => {
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
  });
});
