import '../../__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EncryptionManager } from '../EncryptionManager';

// Mock the worker module so create() doesn't need the real source
vi.mock('../worker', () => ({
  WORKER_SOURCE: 'self.onmessage = () => {}',
}));

// Default to non-Chrome so pipe() uses RTCRtpScriptTransform path
vi.mock('../../../helpers/browsers', () => ({
  isChrome: vi.fn(() => false),
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

    it('rejects AV1 codec', () => {
      const sender = { transform: null } as unknown as RTCRtpSender;
      expect(() => manager.encrypt(sender, 'av1')).toThrow(/AV1/);
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

  describe('Chrome insertable streams path', () => {
    const withChromePath = async (fn: () => void) => {
      const { isChrome } = await import('../../../helpers/browsers');
      vi.mocked(isChrome).mockReturnValue(true);
      Object.assign(RTCRtpSender.prototype, { createEncodedStreams: vi.fn() });
      try {
        fn();
      } finally {
        // @ts-expect-error - cleaning up non-standard property from mock prototype
        delete RTCRtpSender.prototype.createEncodedStreams;
        vi.mocked(isChrome).mockReturnValue(false);
      }
    };

    it('uses createEncodedStreams when in Chrome', async () => {
      const readable = {};
      const writable = {};
      const receiver = {
        createEncodedStreams: vi.fn(() => ({ readable, writable })),
      } as unknown as RTCRtpReceiver;

      await withChromePath(() => {
        manager.decrypt(receiver, 'remote-user');

        expect(receiver.createEncodedStreams).toHaveBeenCalled();
        const worker = getWorker(manager);
        expect(worker.postMessage).toHaveBeenCalledWith(
          {
            operation: 'decode',
            userId: 'remote-user',
            readable,
            writable,
          },
          [readable, writable],
        );
      });
    });

    it('prevents double-piping on the same receiver (Chrome path)', async () => {
      const readable = {};
      const writable = {};
      const receiver = {
        createEncodedStreams: vi.fn(() => ({ readable, writable })),
      } as unknown as RTCRtpReceiver;

      await withChromePath(() => {
        manager.decrypt(receiver, 'user-a');
        manager.decrypt(receiver, 'user-b');

        expect(receiver.createEncodedStreams).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('worker message handling', () => {
    it('invokes onDecryptionFailed callback', () => {
      const callback = vi.fn();
      manager.onDecryptionFailed = callback;

      const worker = getWorker(manager);
      const messageHandler = getEventHandler(worker, 'message');
      messageHandler({ data: { type: 'decryptionFailed', userId: 'bob' } });

      expect(callback).toHaveBeenCalledWith('bob');
    });

    it('does not throw when onDecryptionFailed is not set', () => {
      const worker = getWorker(manager);
      const messageHandler = getEventHandler(worker, 'message');

      expect(() =>
        messageHandler({ data: { type: 'decryptionFailed', userId: 'bob' } }),
      ).not.toThrow();
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
