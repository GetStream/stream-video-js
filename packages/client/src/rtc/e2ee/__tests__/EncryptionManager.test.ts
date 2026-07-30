import '../../__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EncryptionManager } from '../EncryptionManager';
import type { E2EEEventMap } from '../events';
import { isChrome } from '../../../helpers/browsers';

// Mock the worker module so create() doesn't need the real bundled function
vi.mock('../e2ee-worker', () => ({
  e2eeWorker: function () {
    self.onmessage = () => {};
  },
}));

// Mock browser detection so we can drive the Chrome vs non-Chrome transform
// selection deterministically. Defaults to non-Chrome (reset in beforeEach).
vi.mock('../../../helpers/browsers', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../helpers/browsers')>();
  return { ...actual, isChrome: vi.fn().mockReturnValue(false) };
});

describe('EncryptionManager', () => {
  let manager: EncryptionManager;

  beforeEach(async () => {
    vi.mocked(isChrome).mockReturnValue(false);
    manager = await EncryptionManager.create('local-user');
  });

  afterEach(() => {
    manager.dispose();
  });

  describe('isSupported', () => {
    it('returns true when RTCRtpScriptTransform is available', () => {
      expect(EncryptionManager.isSupported()).toBe(true);
    });

    it('returns false when neither API is available', () => {
      const original = globalThis.RTCRtpScriptTransform;
      // @ts-expect-error test case
      delete globalThis.RTCRtpScriptTransform;

      try {
        expect(EncryptionManager.isSupported()).toBe(false);
      } finally {
        globalThis.RTCRtpScriptTransform = original;
      }
    });
  });

  describe('create', () => {
    it('creates a manager with a worker', async () => {
      const mgr = await EncryptionManager.create('user-123');
      expect(mgr).toBeInstanceOf(EncryptionManager);
      mgr.dispose();
    });

    it('revokes the blob URL if the Worker constructor throws', async () => {
      // e.g. a CSP `worker-src` that disallows `blob:`. The object URL created
      // just before must not leak.
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
      const OriginalWorker = globalThis.Worker;
      // @ts-expect-error replace the global Worker for this test
      globalThis.Worker = class {
        constructor() {
          throw new Error('worker-src blocked by CSP');
        }
      };
      try {
        await expect(EncryptionManager.create('u')).rejects.toThrow(/CSP/);
        expect(revokeSpy).toHaveBeenCalled();
      } finally {
        globalThis.Worker = OriginalWorker;
        revokeSpy.mockRestore();
      }
    });
  });

  describe('setKey', () => {
    it('posts a setKey message to the worker', () => {
      const rawKey = new ArrayBuffer(16);
      manager.setKey('remote-user', 0, rawKey);

      const worker = getWorker(manager);
      // The key buffer is structured-cloned (no transfer list), so the caller's
      // ArrayBuffer is not detached and can be safely re-imported.
      expect(worker.postMessage).toHaveBeenCalledWith({
        type: 'cmd.set_key',
        userId: 'remote-user',
        keyIndex: 0,
        rawKey,
      });
    });

    it('rejects keys that are not 16 bytes', () => {
      expect(() => manager.setKey('user', 0, new ArrayBuffer(32))).toThrow(
        /16 bytes/,
      );
    });

    it('rejects a keyIndex above the 8-bit wire limit', () => {
      // The trailer carries keyIndex in a single byte; 256 would wrap to 0 on
      // the wire and the receiver would look up the wrong key.
      expect(() => manager.setKey('user', 256, new ArrayBuffer(16))).toThrow(
        /keyIndex/,
      );
    });

    it('rejects a negative or non-integer keyIndex', () => {
      expect(() => manager.setKey('user', -1, new ArrayBuffer(16))).toThrow(
        /keyIndex/,
      );
      expect(() => manager.setKey('user', 1.5, new ArrayBuffer(16))).toThrow(
        /keyIndex/,
      );
    });

    it('accepts the maximum 8-bit keyIndex (255)', () => {
      expect(() =>
        manager.setKey('user', 255, new ArrayBuffer(16)),
      ).not.toThrow();
    });
  });

  describe('setSharedKey', () => {
    it('posts a setSharedKey message to the worker', () => {
      const rawKey = new ArrayBuffer(16);
      manager.setSharedKey(0, rawKey);

      const worker = getWorker(manager);
      expect(worker.postMessage).toHaveBeenCalledWith({
        type: 'cmd.set_shared_key',
        keyIndex: 0,
        rawKey,
      });
    });

    it('does not transfer (detach) the caller key buffer', () => {
      const rawKey = new ArrayBuffer(16);
      manager.setSharedKey(0, rawKey);
      const worker = getWorker(manager);
      // No transfer list -> structured clone, caller buffer stays usable.
      const transferList = vi.mocked(worker.postMessage).mock.calls[0][1];
      expect(transferList).toBeUndefined();
    });

    it('rejects keys that are not 16 bytes', () => {
      expect(() => manager.setSharedKey(0, new ArrayBuffer(8))).toThrow(
        /16 bytes/,
      );
    });

    it('rejects a keyIndex above the 8-bit wire limit', () => {
      expect(() => manager.setSharedKey(256, new ArrayBuffer(16))).toThrow(
        /keyIndex/,
      );
    });
  });

  describe('removeKeys', () => {
    it('posts a removeKeys message to the worker', () => {
      manager.removeKeys('remote-user');

      const worker = getWorker(manager);
      expect(worker.postMessage).toHaveBeenCalledWith({
        type: 'cmd.remove_keys',
        userId: 'remote-user',
      });
    });
  });

  describe('requestKeyDump', () => {
    it('posts a cmd.dump_key_state message to the worker', () => {
      manager.requestKeyDump();

      const worker = getWorker(manager);
      expect(worker.postMessage).toHaveBeenCalledWith({
        type: 'cmd.dump_key_state',
      });
    });
  });

  describe('encrypt', () => {
    it('attaches a transform to the sender', () => {
      const sender: Record<string, unknown> = { transform: null };
      manager.encrypt(sender as unknown as RTCRtpSender, 'vp8');

      expect(sender.transform).toBeDefined();
      expect((sender.transform as Record<string, unknown>).options).toEqual({
        operation: 'encode',
        userId: 'local-user',
        codec: 'vp8',
      });
    });

    it('forwards the codec verbatim, leaving support checks to the worker', () => {
      const sender: Record<string, unknown> = { transform: null };
      manager.encrypt(sender as unknown as RTCRtpSender, 'av1');

      // The manager does not gate on the codec; the worker decides, and fails
      // closed for one it cannot frame (av1 today).
      expect(sender.transform).toBeDefined();
      expect((sender.transform as Record<string, unknown>).options).toEqual({
        operation: 'encode',
        userId: 'local-user',
        codec: 'av1',
      });
    });
  });

  describe('decrypt', () => {
    it('attaches a transform to the receiver', () => {
      const receiver: Record<string, unknown> = { transform: null };
      manager.decrypt(receiver as unknown as RTCRtpReceiver, 'remote-user');

      expect(receiver.transform).toBeDefined();
      expect((receiver.transform as Record<string, unknown>).options).toEqual({
        operation: 'decode',
        userId: 'remote-user',
      });
    });
  });

  // Which API is chosen for a given browser is preferredTransform's job and is
  // covered directly in transformSupport.test.ts. These tests only cover the
  // half the manager owns: that it wires up whichever path it was handed.
  describe('transform wiring', () => {
    /** Stub the non-standard createEncodedStreams on the sender/receiver prototypes. */
    const withInsertableStreams = async (fn: () => void | Promise<void>) => {
      Object.assign(RTCRtpSender.prototype, { createEncodedStreams: vi.fn() });
      Object.assign(RTCRtpReceiver.prototype, {
        createEncodedStreams: vi.fn(),
      });
      try {
        await fn();
      } finally {
        // @ts-expect-error - cleaning up non-standard property from mock prototype
        delete RTCRtpSender.prototype.createEncodedStreams;
        // @ts-expect-error - cleaning up non-standard property from mock prototype
        delete RTCRtpReceiver.prototype.createEncodedStreams;
      }
    };

    it('wires the script path by assigning target.transform', async () => {
      vi.mocked(isChrome).mockReturnValue(false);
      // createEncodedStreams exists here too, so this also pins that the script
      // path never touches it.
      await withInsertableStreams(() => {
        const receiver: Record<string, unknown> = {
          transform: null,
          createEncodedStreams: vi.fn(),
        };
        manager.decrypt(receiver as unknown as RTCRtpReceiver, 'remote-user');

        expect(receiver.transform).toBeDefined();
        expect(receiver.createEncodedStreams).not.toHaveBeenCalled();
      });
    });

    it('wires the insertable path by transferring the streams to the worker', async () => {
      vi.mocked(isChrome).mockReturnValue(true);
      const readable = {};
      const writable = {};
      const receiver = {
        createEncodedStreams: vi.fn(() => ({ readable, writable })),
      } as unknown as RTCRtpReceiver;

      await withInsertableStreams(async () => {
        const mgr = await EncryptionManager.create('local-user');
        try {
          mgr.decrypt(receiver, 'remote-user');

          // @ts-expect-error not present in the standard lib
          expect(receiver.createEncodedStreams).toHaveBeenCalled();
          const worker = getWorker(mgr);
          expect(worker.postMessage).toHaveBeenCalledWith(
            {
              type: 'cmd.setup_transform',
              operation: 'decode',
              userId: 'remote-user',
              readable,
              writable,
            },
            [readable, writable],
          );
        } finally {
          mgr.dispose();
        }
      });
    });

    it('prevents double-piping the same receiver on the Insertable Streams path', async () => {
      vi.mocked(isChrome).mockReturnValue(true);
      const readable = {};
      const writable = {};
      const receiver = {
        createEncodedStreams: vi.fn(() => ({ readable, writable })),
      } as unknown as RTCRtpReceiver;

      await withInsertableStreams(async () => {
        const mgr = await EncryptionManager.create('local-user');
        try {
          mgr.decrypt(receiver, 'user-a');
          mgr.decrypt(receiver, 'user-b');

          // @ts-expect-error not present in the standard lib
          expect(receiver.createEncodedStreams).toHaveBeenCalledTimes(1);
        } finally {
          mgr.dispose();
        }
      });
    });
  });

  describe('AES-256-GCM opt-in', () => {
    it('rejects 16-byte keys when created with algorithm AES-256-GCM', async () => {
      const mgr = await EncryptionManager.create('user', {
        algorithm: 'AES-256-GCM',
      });
      try {
        expect(() => mgr.setKey('remote', 0, new ArrayBuffer(16))).toThrow(
          /32 bytes \(AES-256\)/,
        );
      } finally {
        mgr.dispose();
      }
    });

    it('accepts 32-byte keys when created with algorithm AES-256-GCM', async () => {
      const mgr = await EncryptionManager.create('user', {
        algorithm: 'AES-256-GCM',
      });
      try {
        expect(() =>
          mgr.setKey('remote', 0, new ArrayBuffer(32)),
        ).not.toThrow();
        expect(() => mgr.setSharedKey(0, new ArrayBuffer(32))).not.toThrow();
      } finally {
        mgr.dispose();
      }
    });

    it('still enforces 16 bytes for the default (AES-128-GCM) manager', () => {
      expect(() => manager.setKey('remote', 0, new ArrayBuffer(32))).toThrow(
        /16 bytes \(AES-128\)/,
      );
    });
  });

  describe('worker message handling', () => {
    // The manager forwards worker messages generically: strip `type`, emit the
    // rest as the payload. One table covers every event rather than repeating
    // the same assertion per name - a new event needs a row, not a test.
    const EVENTS: Array<[keyof E2EEEventMap, Record<string, unknown>]> = [
      ['e2ee.decryption_failed', { userId: 'bob', trackType: 'VIDEO' }],
      ['e2ee.decryption_resumed', { userId: 'bob', trackType: 'VIDEO' }],
      ['e2ee.encryption_failed', { userId: 'bob', reason: 'clear-bytes' }],
      ['e2ee.missing_key', { userId: 'local-user', keyIndex: 2 }],
      ['e2ee.broken', { userId: 'bob', keyIndex: 3, trackType: 'AUDIO' }],
      ['e2ee.unencrypted_frame', { userId: 'bob', trackType: 'VIDEO' }],
      [
        'e2ee.perf_report',
        {
          encode: [
            {
              userId: 'alice',
              trackType: 'VIDEO',
              codec: 'vp8',
              fps: 30,
              maxCryptoMs: 2,
            },
          ],
          decode: [
            { userId: 'bob', trackType: 'VIDEO', fps: 29, maxCryptoMs: 3 },
          ],
        },
      ],
      [
        'e2ee.key_state',
        {
          perUserKeys: [{ userId: 'bob', keyIndex: 0, fingerprint: 'abc123' }],
          sharedKey: { keyIndex: 1, fingerprint: 'def456' },
        },
      ],
    ];

    it.each(EVENTS)('emits %s with the payload verbatim', (type, payload) => {
      const callback = vi.fn();
      manager.on(type, callback);

      const messageHandler = getEventHandler(getWorker(manager), 'message');
      messageHandler({ data: { type, ...payload } });

      expect(callback).toHaveBeenCalledWith(payload);
    });

    it('does not throw when nobody is subscribed', () => {
      // The message pump must survive an unsubscribed event: a throw here would
      // take down every later message, not just this one.
      const messageHandler = getEventHandler(getWorker(manager), 'message');
      for (const [type, payload] of EVENTS) {
        expect(() =>
          messageHandler({ data: { type, ...payload } }),
        ).not.toThrow();
      }
    });

    it('stops delivering after the returned unsubscribe is called', () => {
      const callback = vi.fn();
      const unsubscribe = manager.on('e2ee.decryption_failed', callback);
      unsubscribe();

      const messageHandler = getEventHandler(getWorker(manager), 'message');
      messageHandler({
        data: { type: 'e2ee.decryption_failed', userId: 'bob' },
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('terminates the worker and revokes the blob URL', () => {
      const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');
      const worker = getWorker(manager);
      manager.dispose();

      expect(worker.terminate).toHaveBeenCalled();
      expect(worker.removeEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );
      expect(worker.removeEventListener).toHaveBeenCalledWith(
        'error',
        expect.any(Function),
      );
      expect(revokeObjectURL).toHaveBeenCalled();
      revokeObjectURL.mockRestore();
    });

    it('is safe to call multiple times', () => {
      const worker = getWorker(manager);
      manager.dispose();
      manager.dispose();

      expect(worker.terminate).toHaveBeenCalledTimes(1);
    });

    it('rejects every other operation once disposed', () => {
      const sender = { transform: null } as unknown as RTCRtpSender;
      const receiver = { transform: null } as unknown as RTCRtpReceiver;
      manager.dispose();

      // The worker is gone, so postMessage is a silent no-op and an attached
      // transform would stall forever. Fail loudly instead: a reused manager
      // (e.g. rejoining a Call that kept it) must not look like it is working.
      expect(() => manager.encrypt(sender, 'vp8')).toThrow(/is disposed/);
      expect(() => manager.decrypt(receiver, 'remote-user')).toThrow(
        /is disposed/,
      );
      expect(() =>
        manager.setKey('user', 0, new Uint8Array(16).buffer),
      ).toThrow(/is disposed/);
      expect(() => manager.setSharedKey(0, new Uint8Array(16).buffer)).toThrow(
        /is disposed/,
      );
      expect(() => manager.removeKeys('user')).toThrow(/is disposed/);
      expect(() => manager.requestKeyDump()).toThrow(/is disposed/);
      expect(() => manager.enablePerformanceReporting(true)).toThrow(
        /is disposed/,
      );
      expect(sender.transform).toBeNull();
      expect(receiver.transform).toBeNull();
    });
  });
});

/** Extract the private worker instance from the manager. */
function getWorker(mgr: EncryptionManager): Worker {
  return mgr['worker' as keyof EncryptionManager] as unknown as Worker;
}

/** Extract a registered event handler from a mock worker. */
function getEventHandler(worker: Worker, event: string): (e: unknown) => void {
  const calls = vi.mocked(worker.addEventListener).mock.calls;
  const match = calls.find(([name]) => name === event);
  if (!match) throw new Error(`No handler registered for '${event}'`);
  return match[1] as (e: unknown) => void;
}
