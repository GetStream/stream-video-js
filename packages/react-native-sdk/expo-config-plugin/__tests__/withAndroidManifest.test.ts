import withStreamVideoReactNativeSDKManifest from '../src/withAndroidManifest';
import { ExpoConfig } from '@expo/config-types';
import { AndroidConfig } from '@expo/config-plugins';
import { getFixturePath } from '../fixtures';
import { ConfigProps } from '../src/common/types';

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

const getMainActivityOrThrow = AndroidConfig.Manifest.getMainActivityOrThrow;

const sampleManifestPath = getFixturePath('AndroidManifest.xml');

const props: ConfigProps = {
  androidPictureInPicture: {
    enableAutomaticEnter: true,
  },
};

describe('withStreamVideoReactNativeSDKManifest', () => {
  let modifiedConfig: CustomExpoConfig | undefined;
  it('should modify Android Manifest as per props', async () => {
    const manifest = await readAndroidManifestAsync(sampleManifestPath);
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: manifest,
    };

    const updatedConfig = withStreamVideoReactNativeSDKManifest(
      config,
      props,
    ) as CustomExpoConfig;

    const mainApp = getMainApplicationOrThrow(updatedConfig.modResults);

    expect(
      mainApp.service?.some(
        (service) =>
          service.$['android:name'] === 'app.notifee.core.ForegroundService',
      ),
    ).toBeTruthy();

    const mainActivity = getMainActivityOrThrow(updatedConfig.modResults);

    expect(
      mainActivity.$['android:supportsPictureInPicture'] === 'true',
    ).toBeTruthy();

    modifiedConfig = updatedConfig;

    const manifest2 = await readAndroidManifestAsync(sampleManifestPath);

    const config2: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: manifest2,
    };

    const props2: ConfigProps = {};

    const updatedConfig2 = withStreamVideoReactNativeSDKManifest(
      config2,
      props2,
    ) as CustomExpoConfig;

    const mainActivity2 = getMainActivityOrThrow(updatedConfig2.modResults);

    expect(
      mainActivity2.$['android:supportsPictureInPicture'] === 'true',
    ).toBeFalsy();
  });

  it('should not create duplicates', () => {
    expect(modifiedConfig?.modResults).toBeDefined();

    const updatedConfig = withStreamVideoReactNativeSDKManifest(
      modifiedConfig!,
      props,
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
    expect(() =>
      withStreamVideoReactNativeSDKManifest(config, props),
    ).toThrow();
  });
});
