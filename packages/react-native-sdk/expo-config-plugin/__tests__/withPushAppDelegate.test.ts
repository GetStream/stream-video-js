import { getFixture } from '../fixtures/index';
import withPushAppDelegate from '../src/withPushAppDelegate';
import { ExpoConfig } from '@expo/config-types';
import { ConfigProps } from '../src/common/types';

// Define a custom type that extends ExpoConfig
interface CustomExpoConfig extends ExpoConfig {
  modResults: {
    language: string;
    contents: string;
  };
}

// the real withAppDelegate doesnt return the updated config
// so we mock it to return the updated config using the callback we pass in the actual implementation
jest.mock('@expo/config-plugins', () => {
  const originalModule = jest.requireActual('@expo/config-plugins');
  return {
    ...originalModule,
    withAppDelegate: jest.fn((config, callback) => {
      const updatedConfig: CustomExpoConfig = callback(
        config as CustomExpoConfig,
      );
      return updatedConfig;
    }),
  };
});

const ExpoModulesAppDelegate = getFixture('AppDelegate.mm');

describe('withStreamVideoReactNativeSDKAppDelegate', () => {
  it('should not modify config if push is not enabled', () => {
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'objc',
        contents: ExpoModulesAppDelegate,
      },
    };

    const props: ConfigProps = {};
    const updatedConfig = withPushAppDelegate(
      config,
      props,
    ) as CustomExpoConfig;

    expect(
      updatedConfig.modResults.contents === config.modResults.contents,
    ).toBeTruthy();
  });

  let modifiedConfig: CustomExpoConfig | undefined;
  it('should modify config as per props', () => {
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'objc',
        contents: ExpoModulesAppDelegate,
      },
    };

    const props: ConfigProps = {
      ringingPushNotifications: {
        disableVideo: true,
        includesCallsInRecents: true,
      },
    };

    const updatedConfig = withPushAppDelegate(
      config,
      props,
    ) as CustomExpoConfig;

    expect(updatedConfig.modResults.contents).toMatch(/#import "RNCallKeep.h"/);
    expect(updatedConfig.modResults.contents).toMatch(
      /#import <PushKit\/PushKit.h>/,
    );
    expect(updatedConfig.modResults.contents).toMatch(/#import "RNCallKeep.h"/);
    expect(updatedConfig.modResults.contents).toMatch(/@"supportsVideo": @NO/);
    expect(updatedConfig.modResults.contents).toMatch(
      /@"includesCallsInRecents": @YES/,
    );
    expect(updatedConfig.modResults.contents).toMatch(
      /didUpdatePushCredentials:credentials/,
    );
    expect(updatedConfig.modResults.contents).toMatch(
      /didReceiveIncomingPushWithPayload:payload/,
    );
    expect(updatedConfig.modResults.contents).toMatch(/reportNewIncomingCall/);

    modifiedConfig = updatedConfig;
  });

  it('should not modify config if already added', () => {
    const props: ConfigProps = {
      ringingPushNotifications: {
        disableVideo: true,
        includesCallsInRecents: true,
      },
    };

    const updatedConfig = withPushAppDelegate(
      modifiedConfig!,
      props,
    ) as CustomExpoConfig;

    expect(
      modifiedConfig!.modResults.contents === updatedConfig.modResults.contents,
    ).toBeTruthy();
  });

  it('should throw error for malformed manifest', () => {
    // Prepare a mock config
    const config: CustomExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      modResults: {
        language: 'objc',
        contents: 'blabla',
      },
    };
    const props: ConfigProps = {
      ringingPushNotifications: {
        disableVideo: true,
        includesCallsInRecents: false,
      },
    };
    expect(() => withPushAppDelegate(config, props)).toThrow();
  });
});
