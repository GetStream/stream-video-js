import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OBU_FRAME, writeLeb128 } from '../e2ee-worker/av1-obu';

type Posted = { type?: string; userId?: string; keyIndex?: number };
const posted: Posted[] = [];

// The worker registers its 'message' / 'rtctransform' listeners at import time
// and uses self.postMessage. Capture the listeners and the posted messages so
// the tests can drive the worker through its real message interface.
const handlers: Record<string, (e: { data: unknown }) => void> = {};
vi.stubGlobal(
  'addEventListener',
  (type: string, h: (e: { data: unknown }) => void) => {
    handlers[type] = h;
  },
);
vi.stubGlobal('self', { postMessage: (m: Posted) => void posted.push(m) });

// Import AFTER stubbing so the top-level addEventListener calls are captured.
await import('../e2ee-worker/e2ee-worker-impl');
// `enqueue` is the worker's own serial message queue; awaiting a no-op task
// flushes everything queued before it (e.g. an async setKey).
const { enqueue } = await import('../e2ee-worker/utils');

type Frame = {
  data: ArrayBuffer;
  type?: 'key' | 'delta' | 'empty';
  timestamp: number;
};

const KEY = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

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
const removeKeys = async (userId: string) => {
  message({ type: 'cmd.remove_keys', userId });
  await flush();
};

const frame = (bytes: number[], type: Frame['type'] = 'delta'): Frame => ({
  data: new Uint8Array(bytes).buffer,
  type,
  timestamp: 1,
});

// Attach a transform via the real worker message path (Insertable Streams
// setup branch) and run frames through it, returning what it emits.
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

const codedObu = (payload: number[]): number[] => [
  (OBU_FRAME << 3) | 0x04 | 0x02,
  0x00,
  ...Array.from(writeLeb128(payload.length)),
  ...payload,
];
const td = [(2 << 3) | 0x02, 0x00];

let nextUser = 0;
const freshUser = () => `user-${nextUser++}`;

const roundTrip = async (
  codec: string,
  plaintext: number[],
  type: Frame['type'],
): Promise<number[]> => {
  const user = freshUser();
  await setKey(user);
  const [encrypted] = await drive('encode', user, codec, [
    frame(plaintext, type),
  ]);
  expect(encrypted).toBeDefined();
  expect(Array.from(new Uint8Array(encrypted.data))).not.toEqual(plaintext);
  // The decode side is codec-blind: it detects the format from the bytes.
  const [decrypted] = await drive('decode', user, undefined, [encrypted]);
  expect(decrypted).toBeDefined();
  return Array.from(new Uint8Array(decrypted.data));
};

beforeEach(() => {
  posted.length = 0;
});
afterEach(async () => {
  message({ type: 'cmd.dispose' });
  await flush();
});

describe('encode -> decode pipeline round-trips', () => {
  it('vp8 (clear-prefix + trailer path)', async () => {
    const pt = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    expect(await roundTrip('vp8', pt, 'delta')).toEqual(pt);
  });

  it('h264 with a slice NALU (RBSP-escape path)', async () => {
    const pt = [
      0,
      0,
      0,
      1,
      0x67,
      0x42,
      0x00,
      0x0a, // SPS
      0,
      0,
      0,
      1,
      0x65,
      0xb8,
      0x40, // slice start code + NALU type 5 + 2 bytes
      0xaa,
      0xbb,
      0xcc,
      0xdd,
      0xee, // body (encrypted)
    ];
    expect(await roundTrip('h264', pt, 'key')).toEqual(pt);
  });

  it('h264 with no slice NALU (clearBytes 0 path)', async () => {
    const pt = [0, 0, 0, 1, 0x67, 0x42, 0x00, 0x0a];
    expect(await roundTrip('h264', pt, 'key')).toEqual(pt);
  });

  it('av1 (inline-OBU path)', async () => {
    const pt = [...td, ...codedObu([0xde, 0xad, 0xbe, 0xef, 0x55])];
    expect(await roundTrip('av1', pt, 'key')).toEqual(pt);
  });
});

describe('decode pipeline edge behaviors', () => {
  it('passes an unencrypted (non-AV1) frame through untouched', async () => {
    const user = freshUser();
    const bytes = [9, 9, 9, 9, 9];
    const [out] = await drive('decode', user, undefined, [
      frame(bytes, 'delta'),
    ]);
    expect(Array.from(new Uint8Array(out.data))).toEqual(bytes);
    expect(posted).toHaveLength(0);
  });

  it('drops and signals decryption_failed when the key is gone', async () => {
    const user = freshUser();
    await setKey(user);
    const [encrypted] = await drive('encode', user, 'vp8', [
      frame([1, 2, 3, 4, 5, 6, 7, 8], 'delta'),
    ]);
    await removeKeys(user);
    posted.length = 0;
    const out = await drive('decode', user, undefined, [encrypted]);
    expect(out).toHaveLength(0);
    expect(posted.some((m) => m.type === 'e2ee.decryption_failed')).toBe(true);
  });

  it('drops a replayed frame silently (no failure event)', async () => {
    const user = freshUser();
    await setKey(user);
    const [encrypted] = await drive('encode', user, 'vp8', [
      frame([1, 2, 3, 4, 5, 6, 7, 8], 'delta'),
    ]);
    const clone: Frame = { ...encrypted, data: encrypted.data.slice(0) };
    posted.length = 0;
    // Both frames go through ONE decode transform (shared replay window).
    const out = await drive('decode', user, undefined, [encrypted, clone]);
    expect(out).toHaveLength(1); // first decrypts, second is a replay
    expect(posted.some((m) => m.type === 'e2ee.decryption_failed')).toBe(false);
  });

  it('signals decryption_failed on a tampered frame', async () => {
    const user = freshUser();
    await setKey(user);
    const [encrypted] = await drive('encode', user, 'vp8', [
      frame([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 'delta'),
    ]);
    const tampered = new Uint8Array(encrypted.data);
    tampered[5] ^= 0xff; // flip a ciphertext byte
    posted.length = 0;
    const out = await drive('decode', user, undefined, [
      { ...encrypted, data: tampered.buffer },
    ]);
    expect(out).toHaveLength(0);
    expect(posted.some((m) => m.type === 'e2ee.decryption_failed')).toBe(true);
  });
});

describe('encode pipeline edge behaviors', () => {
  it('drops and signals missing_key when no key is set', async () => {
    const user = freshUser();
    const out = await drive('encode', user, 'vp8', [
      frame([1, 2, 3, 4, 5], 'delta'),
    ]);
    expect(out).toHaveLength(0);
    expect(posted.some((m) => m.type === 'e2ee.missing_key')).toBe(true);
  });
});
