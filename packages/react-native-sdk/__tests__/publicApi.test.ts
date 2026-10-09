import * as sdk from '../src';

describe('public API', () => {
  it.each([
    'useAndroidKeepCallAliveEffect',
    'useScreenShareAudioMixing',
    'usePushRegisterEffect',
  ])('does not expose %s, which the SDK providers already run', (name) => {
    expect(sdk).not.toHaveProperty(name);
  });
});
