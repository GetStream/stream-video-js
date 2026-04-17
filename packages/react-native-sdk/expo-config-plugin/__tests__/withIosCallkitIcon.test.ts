import withIosCallkitIcon from '../src/withCallResources/withIosCallkitIcon';
import { deriveImageSetName } from '../src/withCallResources/withIosCallkitIcon';
import { ExpoConfig } from '@expo/config-types';
import { ConfigProps } from '../src/common/types';
import * as fs from 'fs';

interface CustomExpoConfig extends ExpoConfig {
  modRequest: {
    projectRoot: string;
    platformProjectRoot: string;
    projectName: string;
  };
}

jest.mock('fs');

jest.mock('@expo/config-plugins', () => {
  return {
    withDangerousMod: jest.fn((config, [_platform, callback]) => {
      return callback(config as CustomExpoConfig);
    }),
  };
});

const mockedFs = fs as jest.Mocked<typeof fs>;

const baseConfig: CustomExpoConfig = {
  name: 'test-app',
  slug: 'test-app',
  modRequest: {
    projectRoot: '/project',
    platformProjectRoot: '/project/ios',
    projectName: 'TestApp',
  },
};

describe('withIosCallkitIcon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.existsSync.mockReturnValue(true);
  });

  it('should skip when iosCallkitIcon is not set', () => {
    const props: ConfigProps = {};
    const result = withIosCallkitIcon(baseConfig, props);
    expect(result).toBe(baseConfig);
    expect(mockedFs.copyFileSync).not.toHaveBeenCalled();
  });

  it('should create imageset directory and copy icon', () => {
    const props: ConfigProps = {
      iosCallkitIcon: './assets/callkit_icon.png',
    };

    withIosCallkitIcon(baseConfig, props);

    expect(mockedFs.mkdirSync).toHaveBeenCalledWith(
      '/project/ios/TestApp/Images.xcassets/CallkitIcon.imageset',
      { recursive: true },
    );
    expect(mockedFs.copyFileSync).toHaveBeenCalledWith(
      '/project/assets/callkit_icon.png',
      '/project/ios/TestApp/Images.xcassets/CallkitIcon.imageset/callkit_icon.png',
    );
  });

  it('should write Contents.json with template rendering intent', () => {
    const props: ConfigProps = {
      iosCallkitIcon: './assets/callkit_icon.png',
    };

    withIosCallkitIcon(baseConfig, props);

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      '/project/ios/TestApp/Images.xcassets/CallkitIcon.imageset/Contents.json',
      expect.stringContaining('"template-rendering-intent": "template"'),
    );

    const writtenJson = JSON.parse(
      (mockedFs.writeFileSync as jest.Mock).mock.calls[0][1],
    );
    expect(writtenJson.images).toEqual([
      { filename: 'callkit_icon.png', idiom: 'universal' },
    ]);
    expect(writtenJson.info).toEqual({ author: 'expo', version: 1 });
    expect(writtenJson.properties).toEqual({
      'template-rendering-intent': 'template',
    });
  });

  it('should throw when file does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false);
    const props: ConfigProps = {
      iosCallkitIcon: './assets/missing.png',
    };

    expect(() => withIosCallkitIcon(baseConfig, props)).toThrow(
      /iOS CallKit icon file not found/,
    );
  });

  it('should throw on non-PNG file', () => {
    const props: ConfigProps = {
      iosCallkitIcon: './assets/icon.jpg',
    };

    expect(() => withIosCallkitIcon(baseConfig, props)).toThrow(
      /iOS CallKit icon must be a PNG file/,
    );
  });
});

describe('deriveImageSetName', () => {
  it('should convert underscored names to PascalCase', () => {
    expect(deriveImageSetName('callkit_icon.png')).toBe('CallkitIcon');
  });

  it('should convert hyphenated names to PascalCase', () => {
    expect(deriveImageSetName('my-app-icon.png')).toBe('MyAppIcon');
  });

  it('should handle single word names', () => {
    expect(deriveImageSetName('icon.png')).toBe('Icon');
  });

  it('should handle mixed separators', () => {
    expect(deriveImageSetName('my_app-icon.png')).toBe('MyAppIcon');
  });
});
