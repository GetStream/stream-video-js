/**
 * Regression guard: the SDK's entry point re-exports the encryption module, so
 * an app whose `@stream-io/react-native-webrtc` predates E2EE must still be able
 * to import it. Reading the native enums at module scope would crash such an app
 * on startup even if it never touches E2EE.
 *
 * Its own file so the stripped mock is the only copy in this module registry.
 */
jest.mock('@stream-io/react-native-webrtc', () => ({
  // what a pre-E2EE version exports: no RTCEncryptionManager, no enums
  registerGlobals: () => {},
  MediaStream: undefined,
}));

describe('with a pre-E2EE @stream-io/react-native-webrtc', () => {
  it('imports the encryption module without throwing', () => {
    expect(() =>
      require('../../src/modules/encryption/EncryptionManager'),
    ).not.toThrow();
    expect(() =>
      require('../../src/modules/encryption/eventMapping'),
    ).not.toThrow();
  });

  it('reports E2EE as unsupported instead of crashing', () => {
    const {
      EncryptionManager,
    } = require('../../src/modules/encryption/EncryptionManager');
    expect(EncryptionManager.isSupported()).toBe(false);
  });

  it('rejects create with an actionable message', async () => {
    const {
      EncryptionManager,
    } = require('../../src/modules/encryption/EncryptionManager');
    await expect(EncryptionManager.create('alice')).rejects.toThrow(
      /@stream-io\/react-native-webrtc/,
    );
  });

  // The mapping helpers do read the enums, but only ever with a created manager
  // in hand - `create` rejects here, so that path is unreachable and needs no
  // fallback of its own.
});
