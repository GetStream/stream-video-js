import withIosRingtone from '../src/withCallResources/withIosRingtone';
import { ExpoConfig } from '@expo/config-types';
import { ConfigProps } from '../src/common/types';
import * as fs from 'fs';

interface CustomExpoConfig extends ExpoConfig {
  modRequest: {
    projectRoot: string;
    platformProjectRoot: string;
    projectName: string;
  };
  modResults: {
    hasFile: jest.Mock;
    addFile: jest.Mock;
    findPBXGroupKey: jest.Mock;
    getFirstTarget: jest.Mock;
    generateUuid: jest.Mock;
    addToPbxBuildFileSection: jest.Mock;
    addToPbxResourcesBuildPhase: jest.Mock;
  };
}

jest.mock('fs');

jest.mock('@expo/config-plugins', () => {
  return {
    withXcodeProject: jest.fn((config, callback) => {
      return callback(config as CustomExpoConfig);
    }),
  };
});

const mockedFs = fs as jest.Mocked<typeof fs>;

function createMockFile() {
  return { uuid: 'file-uuid', fileRef: 'file-ref', target: undefined };
}

function createConfig(
  overrides?: Partial<CustomExpoConfig['modResults']>,
): CustomExpoConfig {
  return {
    name: 'test-app',
    slug: 'test-app',
    modRequest: {
      projectRoot: '/project',
      platformProjectRoot: '/project/ios',
      projectName: 'TestApp',
    },
    modResults: {
      hasFile: jest.fn().mockReturnValue(false),
      addFile: jest.fn().mockReturnValue(createMockFile()),
      findPBXGroupKey: jest.fn().mockReturnValue('app-group-key'),
      getFirstTarget: jest.fn().mockReturnValue({ uuid: 'target-uuid' }),
      generateUuid: jest.fn().mockReturnValue('generated-uuid'),
      addToPbxBuildFileSection: jest.fn(),
      addToPbxResourcesBuildPhase: jest.fn(),
      ...overrides,
    },
  };
}

describe('withIosRingtone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.existsSync.mockReturnValue(true);
  });

  it('should skip when iosCallkitRingtone is not set', () => {
    const config = createConfig();
    const props: ConfigProps = {};
    const result = withIosRingtone(config, props);
    expect(result).toBe(config);
    expect(mockedFs.copyFileSync).not.toHaveBeenCalled();
  });

  it('should copy ringtone and add to Xcode project', () => {
    const config = createConfig();
    const props: ConfigProps = {
      iosCallkitRingtone: './assets/ringtone.caf',
    };

    withIosRingtone(config, props);

    expect(mockedFs.mkdirSync).toHaveBeenCalledWith('/project/ios/TestApp', {
      recursive: true,
    });
    expect(mockedFs.copyFileSync).toHaveBeenCalledWith(
      '/project/assets/ringtone.caf',
      '/project/ios/TestApp/ringtone.caf',
    );
    expect(config.modResults.findPBXGroupKey).toHaveBeenCalledWith({
      name: 'TestApp',
    });
    expect(config.modResults.addFile).toHaveBeenCalledWith(
      'TestApp/ringtone.caf',
      'app-group-key',
      { target: 'target-uuid' },
    );
    expect(config.modResults.addToPbxBuildFileSection).toHaveBeenCalled();
    expect(config.modResults.addToPbxResourcesBuildPhase).toHaveBeenCalled();
  });

  it('should not add resource file if it already exists in Xcode project', () => {
    const config = createConfig({
      hasFile: jest.fn().mockReturnValue(true),
    });
    const props: ConfigProps = {
      iosCallkitRingtone: './assets/ringtone.caf',
    };

    withIosRingtone(config, props);

    expect(mockedFs.copyFileSync).toHaveBeenCalled();
    expect(config.modResults.addFile).not.toHaveBeenCalled();
  });

  it('should throw when file does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false);
    const config = createConfig();
    const props: ConfigProps = {
      iosCallkitRingtone: './assets/missing.caf',
    };

    expect(() => withIosRingtone(config, props)).toThrow(
      /iOS ringtone file not found/,
    );
  });

  it('should throw on invalid extension', () => {
    const config = createConfig();
    const props: ConfigProps = {
      iosCallkitRingtone: './assets/ringtone.mp3',
    };

    expect(() => withIosRingtone(config, props)).toThrow(
      /Invalid iOS ringtone format/,
    );
  });

  it('should accept .aiff extension', () => {
    const config = createConfig();
    const props: ConfigProps = {
      iosCallkitRingtone: './assets/ringtone.aiff',
    };

    withIosRingtone(config, props);

    expect(mockedFs.copyFileSync).toHaveBeenCalledWith(
      '/project/assets/ringtone.aiff',
      '/project/ios/TestApp/ringtone.aiff',
    );
  });
});
