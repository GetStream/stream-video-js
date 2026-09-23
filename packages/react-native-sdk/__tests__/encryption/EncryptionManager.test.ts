/**
 * Tests for the React Native EncryptionManager: the wrapper that makes the
 * native encryption manager satisfy the core `E2EEManager` contract with the
 * same public semantics as the web manager.
 *
 * The failure mode this guards against is silently publishing plaintext, so the
 * assertions are deliberately exact about validation, fail-closed throwing, and
 * that no key material leaves the process.
 */
import {
  RTCEncryptionAlgorithm,
  RTCEncryptionManager,
  RTCEncryptionTrackType,
} from '@stream-io/react-native-webrtc';
import * as client from '@stream-io/video-client';
import { EncryptionManager } from '../../src/modules/encryption/EncryptionManager';

const NativeManager = RTCEncryptionManager as unknown as {
  supported: boolean;
  instances: any[];
  isSupported: jest.Mock;
  create: jest.Mock;
};

/** Replace the manager's logger with a recording stub. */
const stubLogger = () => {
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
  };
  jest
    .spyOn(client.videoLoggerSystem, 'getLogger')
    .mockReturnValue(logger as never);
  return logger;
};

const key = (length: number) => new Uint8Array(length).fill(7).buffer;

const createManager = async (options?: {
  algorithm?: 'AES-128-GCM' | 'AES-256-GCM';
}) => {
  const manager = await EncryptionManager.create('alice', options);
  return { manager, native: NativeManager.instances.at(-1)! };
};

beforeEach(() => {
  NativeManager.supported = true;
  NativeManager.instances = [];
  NativeManager.isSupported.mockClear();
  NativeManager.create.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('platform dispatch', () => {
  it('creates a native-backed manager bound to the local user', async () => {
    const { manager, native } = await createManager();
    expect(native.userId).toBe('alice');
    expect(manager).toBeDefined();
  });

  it('defaults to AES-128 and maps the algorithm to the native enum', async () => {
    const { native } = await createManager();
    expect(native.options).toEqual({
      algorithm: RTCEncryptionAlgorithm.AES_128_GCM,
    });
    const { native: native256 } = await createManager({
      algorithm: 'AES-256-GCM',
    });
    expect(native256.options).toEqual({
      algorithm: RTCEncryptionAlgorithm.AES_256_GCM,
    });
  });

  it('reports support from the native module', () => {
    expect(EncryptionManager.isSupported()).toBe(true);
    NativeManager.supported = false;
    expect(EncryptionManager.isSupported()).toBe(false);
  });

  it('rejects rather than degrading to plaintext when unsupported', async () => {
    NativeManager.supported = false;
    await expect(EncryptionManager.create('alice')).rejects.toThrow(
      'E2EE is not supported on this device',
    );
    expect(NativeManager.create).not.toHaveBeenCalled();
  });

  it('propagates a native create failure', async () => {
    NativeManager.create.mockImplementationOnce(() => {
      throw new Error('native boom');
    });
    await expect(EncryptionManager.create('alice')).rejects.toThrow(
      'native boom',
    );
  });
});

describe('key validation', () => {
  it.each([15, 17, 0, 32])('rejects a %s-byte AES-128 key', async (length) => {
    const { manager, native } = await createManager();
    expect(() => manager.setSharedKey(0, key(length))).toThrow(
      'Key must be exactly 16 bytes (AES-128)',
    );
    expect(() => manager.setKey('bob', 0, key(length))).toThrow(
      'Key must be exactly 16 bytes (AES-128)',
    );
    expect(native.setSharedKey).not.toHaveBeenCalled();
    expect(native.setKey).not.toHaveBeenCalled();
  });

  it.each([31, 33, 16])('rejects a %s-byte AES-256 key', async (length) => {
    const { manager } = await createManager({ algorithm: 'AES-256-GCM' });
    expect(() => manager.setSharedKey(0, key(length))).toThrow(
      'Key must be exactly 32 bytes (AES-256)',
    );
  });

  it('accepts the exact key length for each algorithm', async () => {
    const { manager, native } = await createManager();
    manager.setSharedKey(0, key(16));
    expect(native.setSharedKey).toHaveBeenCalledTimes(1);

    const { manager: m256, native: n256 } = await createManager({
      algorithm: 'AES-256-GCM',
    });
    m256.setKey('bob', 3, key(32));
    expect(n256.setKey).toHaveBeenCalledWith('bob', 3, expect.any(Uint8Array));
  });

  it.each([-1, 256, 1.5, NaN, Infinity])(
    'rejects keyIndex %s at the API boundary',
    async (keyIndex) => {
      const { manager, native } = await createManager();
      const message = `keyIndex must be an integer between 0 and 255, got ${keyIndex}`;
      expect(() => manager.setSharedKey(keyIndex, key(16))).toThrow(message);
      expect(() => manager.setKey('bob', keyIndex, key(16))).toThrow(message);
      expect(() => manager.removeKey('bob', keyIndex)).toThrow(message);
      expect(() => manager.removeSharedKey(keyIndex)).toThrow(message);
      expect(native.setSharedKey).not.toHaveBeenCalled();
      expect(native.removeKey).not.toHaveBeenCalled();
    },
  );

  it.each([0, 255])('accepts keyIndex %s', async (keyIndex) => {
    const { manager, native } = await createManager();
    manager.setSharedKey(keyIndex, key(16));
    manager.removeSharedKey(keyIndex);
    expect(native.setSharedKey).toHaveBeenCalledWith(
      keyIndex,
      expect.any(Uint8Array),
    );
    expect(native.removeSharedKey).toHaveBeenCalledWith(keyIndex);
  });

  it('validates the key index before the key length', async () => {
    // Otherwise a caller with two mistakes fixes the length and hits the index.
    const { manager } = await createManager();
    expect(() => manager.setSharedKey(999, key(3))).toThrow(
      'keyIndex must be an integer between 0 and 255, got 999',
    );
  });

  it('does not validate a key index it does not send', async () => {
    const { manager, native } = await createManager();
    manager.removeAllKeys('bob');
    expect(native.removeAllKeys).toHaveBeenCalledWith('bob');
  });
});

describe('key hygiene', () => {
  it('copies the caller buffer instead of aliasing it', async () => {
    const { manager, native } = await createManager();
    const buffer = new Uint8Array(16).fill(1);
    manager.setSharedKey(0, buffer.buffer);
    const handed: Uint8Array = native.setSharedKey.mock.calls[0][1];
    expect(Array.from(handed)).toEqual(Array(16).fill(1));

    // The caller keeps ownership and may re-import the same bytes, so mutating
    // its buffer afterwards must not reach into the installed key.
    buffer.fill(9);
    expect(Array.from(handed)).toEqual(Array(16).fill(1));
    expect(handed.buffer).not.toBe(buffer.buffer);
  });

  it('never puts key material in a log line', async () => {
    const logger = stubLogger();
    const { manager } = await createManager();
    manager.setSharedKey(0, key(16));
    manager.setKey('bob', 1, key(16));
    manager.requestKeyState();
    manager.enablePerformanceReporting(true);
    await new Promise(process.nextTick);

    const logged = JSON.stringify(
      Object.values(logger).flatMap((level) => level.mock.calls),
    );
    // the key bytes are 7s; a leak would serialize them either as the array or
    // as the base64 the bridge uses
    expect(logged).not.toContain('7,7,7');
    expect(logged).not.toContain(
      Buffer.from(new Uint8Array(16).fill(7)).toString('base64'),
    );
  });
});

describe('attach', () => {
  it.each([
    ['AUDIO', RTCEncryptionTrackType.AUDIO],
    ['VIDEO', RTCEncryptionTrackType.VIDEO],
    ['SCREEN_SHARE', RTCEncryptionTrackType.SCREEN_SHARE],
    ['SCREEN_SHARE_AUDIO', RTCEncryptionTrackType.SCREEN_SHARE_AUDIO],
  ])('passes the %s track type through to native', async (name, native) => {
    const { manager, native: nativeManager } = await createManager();
    const sender = { id: 'sender' } as never;
    const receiver = { id: 'receiver' } as never;
    manager.encrypt(sender, 'vp8', name);
    manager.decrypt(receiver, 'bob', name);
    expect(nativeManager.encrypt).toHaveBeenCalledWith(sender, 'vp8', native);
    expect(nativeManager.decrypt).toHaveBeenCalledWith(receiver, 'bob', native);
  });

  it('passes the sender and codec through untouched', async () => {
    // The core lowercases the codec already, and native pins it exactly.
    const { manager, native } = await createManager();
    const sender = {} as never;
    manager.encrypt(sender, undefined, undefined);
    expect(native.encrypt).toHaveBeenCalledWith(sender, undefined, undefined);
  });

  it('lets native infer the track type when the name is unknown', async () => {
    const { manager, native } = await createManager();
    manager.encrypt({} as never, 'opus', 'UNSPECIFIED');
    expect(native.encrypt).toHaveBeenCalledWith(
      expect.anything(),
      'opus',
      undefined,
    );
  });

  it('propagates a native attach failure rather than publishing plaintext', async () => {
    const { manager, native } = await createManager();
    native.encrypt.mockImplementationOnce(() => {
      throw new Error('attach failed');
    });
    expect(() => manager.encrypt({} as never, 'vp8', 'VIDEO')).toThrow(
      'attach failed',
    );
  });
});

describe('events', () => {
  it('emits the web-shaped payload for a native event', async () => {
    const { manager, native } = await createManager();
    const onStalled = jest.fn();
    manager.on('e2ee.decryption_stalled', onStalled);
    native.emitNative({
      type: 'e2ee.decryption_stalled',
      userId: 'bob',
      keyIndex: 2,
      trackType: RTCEncryptionTrackType.SCREEN_SHARE_AUDIO,
    });
    expect(onStalled).toHaveBeenCalledWith({
      userId: 'bob',
      keyIndex: 2,
      trackType: 'SCREEN_SHARE_AUDIO',
    });
  });

  it('subscribes to every native event type', async () => {
    const { native } = await createManager();
    expect(native.on.mock.calls.map(([type]: [string]) => type).sort()).toEqual(
      [
        'e2ee.decryption_failed',
        'e2ee.decryption_resumed',
        'e2ee.decryption_stalled',
        'e2ee.encryption_failed',
        'e2ee.key_state',
        'e2ee.missing_key',
        'e2ee.perf_report',
        'e2ee.unencrypted_frame',
        'e2ee.unsupported_version',
      ],
    );
  });

  it('unsubscribes through the returned function and through off()', async () => {
    const { manager, native } = await createManager();
    const listener = jest.fn();
    const unsubscribe = manager.on('e2ee.decryption_failed', listener);
    unsubscribe();
    native.emitNative({
      type: 'e2ee.decryption_failed',
      userId: 'bob',
    });
    expect(listener).not.toHaveBeenCalled();

    manager.on('e2ee.decryption_failed', listener);
    manager.off('e2ee.decryption_failed', listener);
    native.emitNative({ type: 'e2ee.decryption_failed', userId: 'bob' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps dispatching when one listener throws', async () => {
    const { manager, native } = await createManager();
    const second = jest.fn();
    manager.on('e2ee.decryption_failed', () => {
      throw new Error('bad listener');
    });
    manager.on('e2ee.decryption_failed', second);
    expect(() =>
      native.emitNative({ type: 'e2ee.decryption_failed', userId: 'bob' }),
    ).not.toThrow();
    expect(second).toHaveBeenCalled();
  });

  it('ignores an event name it does not know', async () => {
    const { manager, native } = await createManager();
    const listener = jest.fn();
    manager.on('e2ee.key_state', listener);
    native.listeners
      .get('e2ee.key_state')
      ?.forEach((fn: any) => fn({ type: 'e2ee.brand_new', userId: 'bob' }));
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('observational calls', () => {
  it('returns void and swallows a native rejection', async () => {
    // The web manager returns void here, so these stay void rather than
    // exposing the bridge's promises.
    const logger = stubLogger();
    const { manager, native } = await createManager();
    native.enablePerformanceReporting.mockRejectedValueOnce(
      new Error('no dice'),
    );
    native.requestKeyState.mockRejectedValueOnce(new Error('no dice'));

    expect(manager.enablePerformanceReporting(true)).toBeUndefined();
    expect(manager.requestKeyState()).toBeUndefined();
    await new Promise(process.nextTick);

    expect(native.enablePerformanceReporting).toHaveBeenCalledWith(true);
    expect(logger.warn).toHaveBeenCalledTimes(2);
  });
});

describe('dispose', () => {
  const guarded = (manager: any) => [
    () => manager.setKey('bob', 0, key(16)),
    () => manager.setSharedKey(0, key(16)),
    () => manager.removeKey('bob', 0),
    () => manager.removeAllKeys('bob'),
    () => manager.removeSharedKey(0),
    () => manager.encrypt({} as never, 'vp8', 'VIDEO'),
    () => manager.decrypt({} as never, 'bob', 'VIDEO'),
    () => manager.enablePerformanceReporting(true),
    () => manager.requestKeyState(),
  ];

  it('makes every key and attach method throw afterwards', async () => {
    const { manager } = await createManager();
    manager.dispose();
    for (const call of guarded(manager)) {
      expect(call).toThrow('EncryptionManager is disposed');
    }
  });

  it('is idempotent and releases the native manager once', async () => {
    const { manager, native } = await createManager();
    manager.dispose();
    manager.dispose();
    expect(native.dispose).toHaveBeenCalledTimes(1);
  });

  it('detaches every bridged native listener', async () => {
    const { manager, native } = await createManager();
    manager.dispose();
    expect(native.off).toHaveBeenCalledTimes(9);
    expect(native.listeners.get('e2ee.key_state')?.size ?? 0).toBe(0);
  });

  it('finishes local cleanup even when native dispose throws', async () => {
    const logger = stubLogger();
    const { manager, native } = await createManager();
    native.dispose.mockImplementationOnce(() => {
      throw new Error('native gone');
    });
    const listener = jest.fn();
    manager.on('e2ee.decryption_failed', listener);
    expect(() => manager.dispose()).not.toThrow();
    expect(logger.warn).toHaveBeenCalled();
    expect(native.off).toHaveBeenCalledTimes(9);
    expect(() => manager.setSharedKey(0, key(16))).toThrow(
      'EncryptionManager is disposed',
    );
  });

  it('leaves the listener API callable, as the web manager does', async () => {
    const { manager } = await createManager();
    manager.dispose();
    const listener = jest.fn();
    expect(() => manager.on('e2ee.key_state', listener)()).not.toThrow();
    expect(() => manager.off('e2ee.key_state', listener)).not.toThrow();
    expect(() => manager.removeAllListeners()).not.toThrow();
  });

  it('stops emitting events after dispose', async () => {
    const { manager, native } = await createManager();
    const listener = jest.fn();
    manager.on('e2ee.decryption_failed', listener);
    manager.dispose();
    native.emitNative({ type: 'e2ee.decryption_failed', userId: 'bob' });
    expect(listener).not.toHaveBeenCalled();
  });
});
