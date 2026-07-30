import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * SPEC.md §11 conformance vectors, pinned byte-for-byte.
 *
 * These lock the wire format: a refactor of the trailer writer, IV derivation,
 * clear-byte rules or RBSP escaping that changes any output byte breaks
 * interop with every other SDK, and the symmetric round-trip tests would not
 * notice. Any intentional change here is a wire break: bump the trailer
 * `version` and regenerate the vectors in SPEC.md §11.
 */

// The worker registers its listeners at import time and uses self.postMessage;
// capture both so the tests can drive it through its real message interface.
const handlers: Record<string, (e: { data: unknown }) => void> = {};
vi.stubGlobal(
  'addEventListener',
  (type: string, h: (e: { data: unknown }) => void) => {
    handlers[type] = h;
  },
);
vi.stubGlobal('self', { postMessage: () => undefined });

// The vectors fix `ivPrefix` = 11 11 11 11 11 11 11 11, but the prefix is
// drawn from the CSPRNG on key import, so pin the RNG. SubtleCrypto stays real:
// the ciphertext bytes come from actual AES-GCM.
const realCrypto = globalThis.crypto;
vi.stubGlobal('crypto', {
  subtle: realCrypto.subtle,
  getRandomValues: (arr: Uint8Array) => arr.fill(0x11),
});

await import('../e2ee-worker/e2ee-worker-impl');
const { enqueue } = await import('../e2ee-worker/utils');
const { dispose } = await import('../e2ee-worker/crypto');

type Frame = {
  data: ArrayBuffer;
  type?: 'key' | 'delta' | 'empty';
  timestamp: number;
};

// key = 000102030405060708090a0b0c0d0e0f (AES-128-GCM), keyIndex = 0.
const KEY = Array.from({ length: 16 }, (_, i) => i);

const hex = (s: string): Uint8Array => {
  const clean = s.replace(/\s+/g, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
};
const toHex = (b: Uint8Array): string =>
  Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

const message = (data: unknown) => handlers.message({ data });
const flush = () => enqueue(async () => undefined);

const setKey = async (userId: string) => {
  message({
    type: 'cmd.set_key',
    userId,
    keyIndex: 0,
    rawKey: new Uint8Array(KEY).buffer,
  });
  await flush();
};

const drive = async (
  operation: 'encode' | 'decode',
  userId: string,
  codec: string | undefined,
  frames: Frame[],
): Promise<Frame[]> => {
  const out: Frame[] = [];
  const readable = new ReadableStream<Frame>({
    start(c) {
      for (const f of frames) c.enqueue(f);
      c.close();
    },
  });
  let resolveDone!: () => void;
  const done = new Promise<void>((r) => (resolveDone = r));
  const writable = new WritableStream<Frame>({
    write(f) {
      out.push(f);
    },
    close: () => resolveDone(),
    abort: () => resolveDone(),
  });
  message({
    type: 'cmd.setup_transform',
    readable,
    writable,
    operation,
    userId,
    codec,
  });
  await done;
  return out;
};

let nextUser = 0;
// A fresh user starts at frame counter 0, so the first frame uses counter 1,
// matching the vectors.
const freshUser = () => `vector-user-${nextUser++}`;

afterEach(async () => {
  await flush();
  dispose();
});

interface Vector {
  codec: string;
  frameType: Frame['type'];
  input: string;
  output: string;
}

const VECTORS: Record<string, Vector> = {
  'opus (audio, clearBytes 1)': {
    codec: 'opus',
    frameType: undefined,
    input: '78aabbccdd',
    output:
      '78' +
      'd02bf795e85c0bed034f7b282ca617cf76d57eb0' +
      '00000001 1111111111111111 00 0001 01 e2eefeed',
  },
  'vp8 keyframe (clearBytes 10)': {
    codec: 'vp8',
    frameType: 'key',
    input: '10111213141516171819aabb',
    output:
      '10111213141516171819' +
      'd02b0484ce4aa2b21a4a83cbfe2ed6511c68' +
      '00000001 1111111111111111 00 000a 01 e2eefeed',
  },
  'h264 IDR (clearBytes 6, RBSP escaping)': {
    codec: 'h264',
    frameType: 'key',
    input: '00000001 65 8884deadbe',
    output:
      '000000016588' +
      'fe4e96f631df11f57a43ed2003eaad0c5d6db632' +
      // Escaped trailer: 0x03 inserted into the counter's 00 00 00 01 run,
      // and clearBytes carries the RBSP flag (0x8006).
      '0000030001 1111111111111111 00 8006 01 e2eefeed',
  },
};

describe('SPEC §11 conformance vectors', () => {
  it.each(Object.entries(VECTORS))(
    'encodes %s to the exact spec bytes',
    async (_label, v) => {
      const user = freshUser();
      await setKey(user);
      const [encrypted] = await drive('encode', user, v.codec, [
        { data: hex(v.input).buffer, type: v.frameType, timestamp: 1 },
      ]);
      expect(encrypted).toBeDefined();
      expect(toHex(new Uint8Array(encrypted.data))).toBe(toHex(hex(v.output)));
    },
  );

  it.each(Object.entries(VECTORS))(
    'decodes the %s spec bytes back to the input',
    async (_label, v) => {
      const user = freshUser();
      await setKey(user);
      // Decode the pinned bytes, not this build's encode output, so the
      // decoder is checked against the format other SDKs will send.
      const [decrypted] = await drive('decode', user, undefined, [
        { data: hex(v.output).buffer, type: v.frameType, timestamp: 1 },
      ]);
      expect(decrypted).toBeDefined();
      expect(toHex(new Uint8Array(decrypted.data))).toBe(toHex(hex(v.input)));
    },
  );
});
