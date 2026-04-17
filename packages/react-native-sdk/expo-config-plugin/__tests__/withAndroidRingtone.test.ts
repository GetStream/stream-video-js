import withAndroidRingtone from '../src/withCallResources/withAndroidRingtone';
import { normalizeAndroidResourceName } from '../src/withCallResources/withAndroidRingtone';
import { ExpoConfig } from '@expo/config-types';
import { ConfigProps } from '../src/common/types';
import * as fs from 'fs';

interface CustomExpoConfig extends ExpoConfig {
  modRequest: {
    projectRoot: string;
    platformProjectRoot: string;
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

describe('withAndroidRingtone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.existsSync.mockReturnValue(true);
  });

  const baseConfig: CustomExpoConfig = {
    name: 'test-app',
    slug: 'test-app',
    modRequest: {
      projectRoot: '/project',
      platformProjectRoot: '/project/android',
    },
  };

  it('should skip when androidRingtone is not set', () => {
    const props: ConfigProps = {};
    const result = withAndroidRingtone(baseConfig, props);
    expect(result).toBe(baseConfig);
    expect(mockedFs.copyFileSync).not.toHaveBeenCalled();
  });

  it('should copy ringtone to res/raw/', () => {
    const props: ConfigProps = {
      androidRingtone: './assets/ringtone.mp3',
    };

    withAndroidRingtone(baseConfig, props);

    expect(mockedFs.mkdirSync).toHaveBeenCalledWith(
      '/project/android/app/src/main/res/raw',
      { recursive: true },
    );
    expect(mockedFs.copyFileSync).toHaveBeenCalledWith(
      '/project/assets/ringtone.mp3',
      '/project/android/app/src/main/res/raw/ringtone.mp3',
    );
  });

  it('should throw when file does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false);
    const props: ConfigProps = {
      androidRingtone: './assets/missing.mp3',
    };

    expect(() => withAndroidRingtone(baseConfig, props)).toThrow(
      /Android ringtone file not found/,
    );
  });

  it('should throw on invalid extension', () => {
    const props: ConfigProps = {
      androidRingtone: './assets/ringtone.aac',
    };

    expect(() => withAndroidRingtone(baseConfig, props)).toThrow(
      /Invalid Android ringtone format/,
    );
  });

  it('should normalize filename with hyphens', () => {
    const props: ConfigProps = {
      androidRingtone: './assets/my-ringtone.mp3',
    };

    withAndroidRingtone(baseConfig, props);

    expect(mockedFs.copyFileSync).toHaveBeenCalledWith(
      '/project/assets/my-ringtone.mp3',
      '/project/android/app/src/main/res/raw/my_ringtone.mp3',
    );
  });
});

describe('normalizeAndroidResourceName', () => {
  it('should lowercase the filename', () => {
    expect(normalizeAndroidResourceName('MyRingtone.MP3')).toBe(
      'myringtone.mp3',
    );
  });

  it('should replace hyphens with underscores', () => {
    expect(normalizeAndroidResourceName('my-ringtone.mp3')).toBe(
      'my_ringtone.mp3',
    );
  });

  it('should remove invalid characters', () => {
    expect(normalizeAndroidResourceName('my ringtone (1).mp3')).toBe(
      'myringtone1.mp3',
    );
  });

  it('should handle already valid names', () => {
    expect(normalizeAndroidResourceName('ringtone.mp3')).toBe('ringtone.mp3');
  });
});
