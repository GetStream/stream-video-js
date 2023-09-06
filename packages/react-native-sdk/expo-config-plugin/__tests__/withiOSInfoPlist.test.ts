import { withInfoPlist } from '@expo/config-plugins';
import withStreamVideoReactNativeSDKiOSInfoPList from '../src/withiOSInfoPlist';
import { ExpoConfig } from '@expo/config-types';

// Define a custom type that extends ExpoConfig
interface CustomExpoConfig extends ExpoConfig {
  modResults: {
    UIBackgroundModes?: string[];
  };
}

jest.mock('@expo/config-plugins', () => {
  const originalModule = jest.requireActual('@expo/config-plugins');
  return {
    ...originalModule,
    withInfoPlist: jest.fn(),
  };
});

describe('withStreamVideoReactNativeSDKiOSInfoPList', () => {
  beforeEach(() => {
    // Mock the behavior of withAppDelegate
    (withInfoPlist as jest.Mock).mockImplementationOnce((config, callback) => {
      const updatedConfig: CustomExpoConfig = callback(
        config as CustomExpoConfig,
      );
      return updatedConfig;
    });
  });

  it('should add UIBackgroundModes to config', async () => {
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

  it('should remove existing UIBackgroundModes', async () => {
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        UIBackgroundModes: ['voip'],
      },
    };

    expect(config.modResults.UIBackgroundModes).toEqual(['voip']);

    const modifiedConfig = withStreamVideoReactNativeSDKiOSInfoPList(
      config,
    ) as CustomExpoConfig;

    expect(modifiedConfig.modResults.UIBackgroundModes).toEqual(['audio']);
  });

  it('should not remove existing UIBackgroundModes if UIBackgroundModes is undefined', async () => {
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
