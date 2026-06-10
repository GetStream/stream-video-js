import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OBU_FRAME, writeLeb128 } from '../e2ee-worker/av1-obu';
import {
  COUNTER_HARD_LIMIT,
  FAILURE_TOLERANCE,
  TRAILER_LEN,
} from '../e2ee-worker/constants';

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
// Test seam to position the per-user frame counter so we can hit the low
// values whose big-endian encoding forms Annex-B start codes.
const { __setFrameCounterForTest } = await import('../e2ee-worker/crypto');

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

  // --- authenticate-before-mutate (review findings 1 & 3) ------------------

  it('a forged max-counter frame does not freeze the track (finding 1)', async () => {
    const user = freshUser();
    await setKey(user);
    // Two genuine frames (counters 1 and 2 for this user).
    const [g1, g2] = await drive('encode', user, 'vp8', [
      frame([1, 2, 3, 4, 5, 6, 7, 8], 'delta'),
      frame([9, 10, 11, 12, 13, 14, 15, 16], 'delta'),
    ]);
    // Forge a frame: copy g1 (real ivPrefix + keyIndex), rewrite the trailer
    // counter to the 32-bit max, and corrupt the body so GCM rejects it.
    const forged = new Uint8Array(g1.data.slice(0));
    new DataView(forged.buffer).setUint32(
      forged.length - TRAILER_LEN,
      COUNTER_HARD_LIMIT,
    );
    forged[5] ^= 0xff;
    posted.length = 0;
    // The forged frame arrives first, then the genuine frames. With the old
    // mutate-before-auth window the forged max counter advanced `highest` to
    // 2^32-1, dropping every later genuine frame as "older than the window".
    const out = await drive('decode', user, undefined, [
      { ...g1, data: forged.buffer },
      g1,
      g2,
    ]);
    expect(out).toHaveLength(2);
    expect(Array.from(new Uint8Array(out[0].data))).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(Array.from(new Uint8Array(out[1].data))).toEqual([
      9, 10, 11, 12, 13, 14, 15, 16,
    ]);
  });

  it('keeps attempting decryption after the failure tolerance is exceeded (finding 3)', async () => {
    const user = freshUser();
    await setKey(user);
    // Encode FAILURE_TOLERANCE + 2 genuine frames with distinct rising
    // counters, then tamper all but the last.
    const n = FAILURE_TOLERANCE + 2;
    const plaintexts = Array.from({ length: n }, (_, i) => [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      i & 0xff,
    ]);
    const encrypted = await drive(
      'encode',
      user,
      'vp8',
      plaintexts.map((p) => frame(p, 'delta')),
    );
    expect(encrypted).toHaveLength(n);
    const garbage = encrypted.slice(0, n - 1).map((f) => {
      const bytes = new Uint8Array(f.data.slice(0));
      bytes[5] ^= 0xff; // flip a ciphertext byte; trailer/counter stay intact
      return { ...f, data: bytes.buffer };
    });
    const genuine = encrypted[n - 1];
    posted.length = 0;
    const out = await drive('decode', user, undefined, [...garbage, genuine]);
    // The genuine final frame still decrypts — the key was NOT latched invalid
    // by the preceding failure burst.
    expect(out).toHaveLength(1);
    expect(Array.from(new Uint8Array(out[0].data))).toEqual(plaintexts[n - 1]);
    // The break is surfaced once (on the tolerance crossing) and recovery once.
    expect(posted.filter((m) => m.type === 'e2ee.broken')).toHaveLength(1);
    expect(posted.some((m) => m.type === 'e2ee.decryption_resumed')).toBe(true);
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

  it('fails closed and signals encryption_failed on an unsupported codec (finding 14)', async () => {
    const user = freshUser();
    await setKey(user);
    // A codec the worker can't split must not be published in the clear and
    // must not stall the encoder (the old behavior left frames buffering with
    // no signal). The pipeline drains - nothing is emitted - and the failure is
    // observable via e2ee.encryption_failed.
    const out = await drive('encode', user, 'theora', [
      frame([1, 2, 3, 4, 5], 'delta'),
    ]);
    expect(out).toHaveLength(0);
    expect(posted.some((m) => m.type === 'e2ee.encryption_failed')).toBe(true);
  }, 3000);
});

describe('h264 trailer start-code safety (finding 11)', () => {
  // SPS NALU, then an IDR slice NALU. h264ClearBytes leaves the start code +
  // NALU header + 2 slice-header bytes in the clear (14 bytes here) and
  // encrypts the rest.
  const H264_KEYFRAME = [
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
    0x40, // IDR slice: start code + NALU header + 1 byte
    0xaa,
    0xbb,
    0xcc,
    0xdd,
    0xee, // encrypted body
  ];
  const H264_CLEAR_BYTES = 14;

  const hasAnnexBStartCode = (b: Uint8Array): boolean => {
    for (let i = 0; i + 2 < b.length; i++) {
      if (b[i] === 0 && b[i + 1] === 0 && b[i + 2] === 1) return true;
    }
    return false;
  };

  it.each([
    ['counter 1 -> 00 00 00 01', 0],
    ['counter 256 -> 00 00 01 00', 255],
  ])(
    'leaves no fake Annex-B start code in the encrypted region (%s)',
    async (_label, seed) => {
      const user = freshUser();
      await setKey(user);
      __setFrameCounterForTest(user, seed);
      const [encrypted] = await drive('encode', user, 'h264', [
        frame(H264_KEYFRAME, 'key'),
      ]);
      expect(encrypted).toBeDefined();
      const bytes = new Uint8Array(encrypted.data);
      // The clear NALU header legitimately carries start codes; only the
      // encrypted region after it must be start-code free, or libwebrtc's H264
      // packetizer would split a spurious NALU and corrupt the frame.
      expect(hasAnnexBStartCode(bytes.subarray(H264_CLEAR_BYTES))).toBe(false);
    },
  );

  it('round-trips an h264 frame whose counter would form a start code', async () => {
    const user = freshUser();
    await setKey(user);
    __setFrameCounterForTest(user, 0); // next counter = 1 -> trailer 00 00 00 01
    const [encrypted] = await drive('encode', user, 'h264', [
      frame(H264_KEYFRAME, 'key'),
    ]);
    const [decrypted] = await drive('decode', user, undefined, [encrypted]);
    expect(Array.from(new Uint8Array(decrypted.data))).toEqual(H264_KEYFRAME);
  });
});
