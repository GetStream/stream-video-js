import { getFixture } from '../fixtures/index';
import withMainActivity from '../src/withMainActivity';
import { ExpoConfig } from '@expo/config-types';
import { ConfigProps } from '../src/common/types';

// Define a custom type that extends ExpoConfig
interface CustomExpoConfig extends ExpoConfig {
  modResults: {
    language: string;
    contents: string;
  };
}

// the real withMainActivity doesnt return the updated config
// so we mock it to return the updated config using the callback we pass in the actual implementation
jest.mock('@expo/config-plugins', () => {
  const originalModule = jest.requireActual('@expo/config-plugins');
  return {
    ...originalModule,
    withMainActivity: jest.fn((config, callback) => {
      const updatedConfig: CustomExpoConfig = callback(
        config as CustomExpoConfig,
      );
      return updatedConfig;
    }),
  };
});

const ExpoModulesMainActivity = getFixture('MainActivity.java');

describe('withStreamVideoReactNativeSDKAppDelegate', () => {
  it('should modify config as per props', () => {
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'java',
        contents: ExpoModulesMainActivity,
      },
    };

    const props: ConfigProps = {
      androidPictureInPicture: {
        enableAutomaticEnter: true,
      },
    };

    const updatedConfig = withMainActivity(config, props) as CustomExpoConfig;

    expect(updatedConfig.modResults.contents).toMatch(
      /StreamVideoReactNative.onPictureInPictureModeChanged/,
    );

    expect(updatedConfig.modResults.contents).toMatch(
      /StreamVideoReactNative.canAutoEnterPictureInPictureMode/,
    );

    const props2: ConfigProps = {
      androidPictureInPicture: {
        enableAutomaticEnter: false,
      },
    };

    const config2: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'java',
        contents: ExpoModulesMainActivity,
      },
    };

    const updatedConfig2 = withMainActivity(
      config2,
      props2,
    ) as CustomExpoConfig;

    expect(updatedConfig2.modResults.contents).not.toMatch(
      /StreamVideoReactNative.canAutoEnterPictureInPictureMode/,
    );
  });

  it('should throw error for malformed manifest and unsupported language', () => {
    // Prepare a mock config
    let config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'java',
        // malformed contents
        contents: 'blabla',
      },
    };
    const props: ConfigProps = {
      androidPictureInPicture: {
        enableAutomaticEnter: true,
      },
    };
    expect(() => withMainActivity(config, props)).toThrow();
  });
});
