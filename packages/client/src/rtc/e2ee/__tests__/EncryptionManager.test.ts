import '../../__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EncryptionManager } from '../EncryptionManager';

// Mock the worker module so create() doesn't need the real bundled function
vi.mock('../e2ee-worker', () => ({
  e2eeWorker: function () {
    self.onmessage = () => {};
  },
}));

describe('EncryptionManager', () => {
  let manager: EncryptionManager;

  beforeEach(async () => {
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
  });

  describe('setKey', () => {
    it('posts a setKey message to the worker', () => {
      const rawKey = new ArrayBuffer(16);
      manager.setKey('remote-user', 0, rawKey);

      const worker = getWorker(manager);
      expect(worker.postMessage).toHaveBeenCalledWith(
        { type: 'setKey', userId: 'remote-user', keyIndex: 0, rawKey },
        [rawKey],
      );
    });

    it('rejects keys that are not 16 bytes', () => {
      expect(() => manager.setKey('user', 0, new ArrayBuffer(32))).toThrow(
        /16 bytes/,
      );
    });
  });

  describe('setSharedKey', () => {
    it('posts a setSharedKey message to the worker', () => {
      const rawKey = new ArrayBuffer(16);
      manager.setSharedKey(0, rawKey);

      const worker = getWorker(manager);
      expect(worker.postMessage).toHaveBeenCalledWith(
        { type: 'setSharedKey', keyIndex: 0, rawKey },
        [rawKey],
      );
    });

    it('rejects keys that are not 16 bytes', () => {
      expect(() => manager.setSharedKey(0, new ArrayBuffer(8))).toThrow(
        /16 bytes/,
      );
    });
  });

  describe('removeKeys', () => {
    it('posts a removeKeys message to the worker', () => {
      manager.removeKeys('remote-user');

      const worker = getWorker(manager);
      expect(worker.postMessage).toHaveBeenCalledWith({
        type: 'removeKeys',
        userId: 'remote-user',
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

    it('attaches a transform for AV1', () => {
      const sender: Record<string, unknown> = { transform: null };
      manager.encrypt(sender as unknown as RTCRtpSender, 'av1');

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

  describe('Insertable Streams (opt-in / fallback) path', () => {
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

    it('defaults to RTCRtpScriptTransform even when createEncodedStreams exists', async () => {
      await withInsertableStreams(() => {
        const receiver: Record<string, unknown> = {
          transform: null,
          createEncodedStreams: vi.fn(),
        };
        manager.decrypt(receiver as unknown as RTCRtpReceiver, 'remote-user');

        expect(receiver.transform).toBeDefined();
        expect(receiver.createEncodedStreams).not.toHaveBeenCalled();
        expect(manager.shouldUseInsertableStreams()).toBe(false);
      });
    });

    it('uses createEncodedStreams when forceInsertableStreams is set', async () => {
      const readable = {};
      const writable = {};
      const receiver = {
        createEncodedStreams: vi.fn(() => ({ readable, writable })),
      } as unknown as RTCRtpReceiver;

      await withInsertableStreams(async () => {
        const mgr = await EncryptionManager.create('local-user', {
          forceInsertableStreams: true,
        });
        try {
          expect(mgr.shouldUseInsertableStreams()).toBe(true);
          mgr.decrypt(receiver, 'remote-user');

          // @ts-expect-error not present in the standard lib
          expect(receiver.createEncodedStreams).toHaveBeenCalled();
          const worker = getWorker(mgr);
          expect(worker.postMessage).toHaveBeenCalledWith(
            { operation: 'decode', userId: 'remote-user', readable, writable },
            [readable, writable],
          );
        } finally {
          mgr.dispose();
        }
      });
    });

    it('falls back to Insertable Streams when RTCRtpScriptTransform is unavailable', async () => {
      const original = globalThis.RTCRtpScriptTransform;
      delete globalThis.RTCRtpScriptTransform;
      const readable = {};
      const writable = {};
      const receiver = {
        createEncodedStreams: vi.fn(() => ({ readable, writable })),
      } as unknown as RTCRtpReceiver;

      try {
        await withInsertableStreams(async () => {
          const mgr = await EncryptionManager.create('local-user');
          try {
            expect(mgr.shouldUseInsertableStreams()).toBe(true);
            mgr.decrypt(receiver, 'remote-user');

            // @ts-expect-error not present in the standard lib
            expect(receiver.createEncodedStreams).toHaveBeenCalled();
          } finally {
            mgr.dispose();
          }
        });
      } finally {
        globalThis.RTCRtpScriptTransform = original;
      }
    });

    it('prevents double-piping the same receiver on the Insertable Streams path', async () => {
      const readable = {};
      const writable = {};
      const receiver = {
        createEncodedStreams: vi.fn(() => ({ readable, writable })),
      } as unknown as RTCRtpReceiver;

      await withInsertableStreams(async () => {
        const mgr = await EncryptionManager.create('local-user', {
          forceInsertableStreams: true,
        });
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
    it('emits e2ee.decryption_failed', () => {
      const callback = vi.fn();
      manager.on('e2ee.decryption_failed', callback);

      const worker = getWorker(manager);
      const messageHandler = getEventHandler(worker, 'message');
      messageHandler({
        data: { type: 'e2ee.decryption_failed', userId: 'bob' },
      });

      expect(callback).toHaveBeenCalledWith('bob');
    });

    it('does not throw when no e2ee.decryption_failed listener is subscribed', () => {
      const worker = getWorker(manager);
      const messageHandler = getEventHandler(worker, 'message');

      expect(() =>
        messageHandler({
          data: { type: 'e2ee.decryption_failed', userId: 'bob' },
        }),
      ).not.toThrow();
    });

    it('emits e2ee.rotation_needed on rekeyRequested', () => {
      const callback = vi.fn();
      manager.on('e2ee.rotation_needed', callback);

      const worker = getWorker(manager);
      const messageHandler = getEventHandler(worker, 'message');
      messageHandler({
        data: { type: 'e2ee.rotation_needed', userId: 'local-user' },
      });

      expect(callback).toHaveBeenCalledWith({ userId: 'local-user' });
    });

    it('emits e2ee.broken', () => {
      const callback = vi.fn();
      manager.on('e2ee.broken', callback);

      const worker = getWorker(manager);
      const messageHandler = getEventHandler(worker, 'message');
      messageHandler({
        data: { type: 'e2ee.broken', userId: 'bob', keyIndex: 3 },
      });

      expect(callback).toHaveBeenCalledWith({ userId: 'bob', keyIndex: 3 });
    });

    it('does not throw when no e2ee.rotation_needed / e2ee.broken listeners are subscribed', () => {
      const worker = getWorker(manager);
      const messageHandler = getEventHandler(worker, 'message');
      expect(() =>
        messageHandler({
          data: { type: 'e2ee.rotation_needed', userId: 'local-user' },
        }),
      ).not.toThrow();
      expect(() =>
        messageHandler({
          data: { type: 'e2ee.broken', userId: 'bob', keyIndex: 1 },
        }),
      ).not.toThrow();
    });

    it('emits e2ee.decryption_resumed', () => {
      const callback = vi.fn();
      manager.on('e2ee.decryption_resumed', callback);

      const worker = getWorker(manager);
      const messageHandler = getEventHandler(worker, 'message');
      messageHandler({
        data: { type: 'e2ee.decryption_resumed', userId: 'bob' },
      });

      expect(callback).toHaveBeenCalledWith('bob');
    });

    it('does not throw when no e2ee.decryption_resumed listener is subscribed', () => {
      const worker = getWorker(manager);
      const messageHandler = getEventHandler(worker, 'message');

      expect(() =>
        messageHandler({
          data: { type: 'e2ee.decryption_resumed', userId: 'bob' },
        }),
      ).not.toThrow();
    });

    it('emits e2ee.encryption_failed', () => {
      const callback = vi.fn();
      manager.on('e2ee.encryption_failed', callback);

      const worker = getWorker(manager);
      const messageHandler = getEventHandler(worker, 'message');
      messageHandler({
        data: {
          type: 'e2ee.encryption_failed',
          reason: 'clear-bytes-too-large',
        },
      });

      expect(callback).toHaveBeenCalledWith('clear-bytes-too-large');
    });

    it('emits e2ee.missing_key', () => {
      const callback = vi.fn();
      manager.on('e2ee.missing_key', callback);

      const worker = getWorker(manager);
      const messageHandler = getEventHandler(worker, 'message');
      messageHandler({
        data: { type: 'e2ee.missing_key', userId: 'local-user' },
      });

      expect(callback).toHaveBeenCalledWith({ userId: 'local-user' });
    });

    it('emits e2ee.perf_report', () => {
      const callback = vi.fn();
      manager.on('e2ee.perf_report', callback);

      const worker = getWorker(manager);
      const messageHandler = getEventHandler(worker, 'message');
      const encode = { fps: 30, maxCryptoMs: 2 };
      const decode = [{ userId: 'bob', fps: 29 }];
      messageHandler({
        data: {
          type: 'e2ee.perf_report',
          encode,
          decode,
          decodeMaxCryptoMs: 3,
        },
      });

      expect(callback).toHaveBeenCalledWith({
        encode,
        decode,
        decodeMaxCryptoMs: 3,
      });
    });

    it('supports multiple listeners per event', () => {
      const a = vi.fn();
      const b = vi.fn();
      manager.on('e2ee.decryption_failed', a);
      manager.on('e2ee.decryption_failed', b);

      const worker = getWorker(manager);
      const messageHandler = getEventHandler(worker, 'message');
      messageHandler({
        data: { type: 'e2ee.decryption_failed', userId: 'bob' },
      });

      expect(a).toHaveBeenCalledWith('bob');
      expect(b).toHaveBeenCalledWith('bob');
    });

    it('supports unsubscribe via the returned function', () => {
      const callback = vi.fn();
      const unsubscribe = manager.on('e2ee.decryption_failed', callback);
      unsubscribe();

      const worker = getWorker(manager);
      const messageHandler = getEventHandler(worker, 'message');
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
