import withStreamVideoReactNativeSDKiOSInfoPList from '../src/withiOSInfoPlist';
import { ExpoConfig } from '@expo/config-types';

// Define a custom type that extends ExpoConfig
interface CustomExpoConfig extends ExpoConfig {
  modResults: {
    UIBackgroundModes?: string[];
  };
}

// the real withInfoPlist doesnt return the updated config
// so we mock it to return the updated config using the callback we pass in the actual implementation
jest.mock('@expo/config-plugins', () => {
  const originalModule = jest.requireActual('@expo/config-plugins');
  return {
    ...originalModule,
    withInfoPlist: jest.fn((config, callback) => {
      const updatedConfig: CustomExpoConfig = callback(
        config as CustomExpoConfig,
      );
      return updatedConfig;
    }),
  };
});

describe('withStreamVideoReactNativeSDKiOSInfoPList', () => {
  it('should add audio to UIBackgroundModes of info.plist', async () => {
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        UIBackgroundModes: [],
      },
    };
    const modifiedConfig = withStreamVideoReactNativeSDKiOSInfoPList(
      config,
    ) as CustomExpoConfig;

    expect(modifiedConfig?.modResults?.UIBackgroundModes).toEqual(['audio']);
  });

  it('should not add audio to UIBackgroundModes of info.plist if audio already exists', async () => {
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        UIBackgroundModes: ['audio'],
      },
    };
    const modifiedConfig = withStreamVideoReactNativeSDKiOSInfoPList(
      config,
    ) as CustomExpoConfig;

    expect(modifiedConfig?.modResults?.UIBackgroundModes).toEqual(['audio']);
  });

  it('should change UIBackgroundModes to [] and add audio if UIBackgroundModes is undefined', async () => {
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        UIBackgroundModes: undefined,
      },
    };

    const modifiedConfig = withStreamVideoReactNativeSDKiOSInfoPList(
      config,
    ) as CustomExpoConfig;

    expect(modifiedConfig.modResults.UIBackgroundModes).toEqual(['audio']);
  });
});
