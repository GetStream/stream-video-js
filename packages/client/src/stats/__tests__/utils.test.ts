import { describe, expect, it } from 'vitest';
import { getStreamClientId } from '../utils';
import { SdkType } from '../../gen/video/sfu/models/models';

describe('getStreamClientId', () => {
  const sdk = (type: SdkType) => ({
    type,
    major: '1',
    minor: '43',
    patch: '1',
  });

  it('names the React SDK', () => {
    expect(getStreamClientId(sdk(SdkType.REACT))).toBe(
      'stream-video-react-v1.43.1',
    );
  });

  it('names the React Native SDK', () => {
    expect(getStreamClientId(sdk(SdkType.REACT_NATIVE))).toBe(
      'stream-video-react-native-v1.43.1',
    );
  });

  it('falls back to the plain JS client for every other SDK type', () => {
    expect(getStreamClientId(sdk(SdkType.PLAIN_JAVASCRIPT))).toBe(
      'stream-video-js-v1.43.1',
    );
    expect(getStreamClientId(undefined)).toBe(
      'stream-video-js-v0.0.0-development',
    );
  });
});
