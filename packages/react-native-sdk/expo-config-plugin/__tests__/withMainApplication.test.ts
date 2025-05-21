import { getFixture } from '../fixtures/index';
import withMainApplication from '../src/withMainApplication';
import { ExpoConfig } from '@expo/config-types';
import { ConfigProps } from '../src/common/types';

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
  it('should modify config as per props', () => {
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'java',
        contents: ExpoModulesMainApplication,
      },
    };

    const props: ConfigProps = {
      addNoiseCancellation: true,
    };

    const updatedConfig = withMainApplication(
      config,
      props,
    ) as CustomExpoConfig;

    expect(updatedConfig.modResults.contents).toMatch(
      /NoiseCancellationReactNative.registerProcessor/,
    );

    const props2: ConfigProps = {
      addNoiseCancellation: false,
    };

    const config2: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'java',
        contents: ExpoModulesMainApplication,
      },
    };

    const updatedConfig2 = withMainApplication(
      config2,
      props2,
    ) as CustomExpoConfig;

    expect(updatedConfig2.modResults.contents).not.toMatch(
      /NoiseCancellationReactNative.registerProcessor/,
    );
  });
});
