import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  COUNTER_HARD_LIMIT,
  E2EE_VERSION,
  FAILURE_TOLERANCE,
  MAGIC,
  MAX_CLEAR_BYTES,
  RBSP_FLAG,
  TRAILER_LEN,
} from '../e2ee-worker/constants';

type Posted = {
  type?: string;
  userId?: string;
  keyIndex?: number;
  trackType?: string;
};
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

const setKey = async (userId: string, keyIndex = 0) => {
  message({
    type: 'cmd.set_key',
    userId,
    keyIndex,
    rawKey: new Uint8Array(KEY).buffer,
  });
  await flush();
};
const removeKeys = async (userId: string) => {
  message({ type: 'cmd.remove_keys', userId });
  await flush();
};

// `type` is required, and `undefined` is meaningful: the absence of a key/delta
// type is exactly how the worker recognizes an audio frame, so a default here
// would silently turn audio cases into delta video ones.
const frame = (bytes: number[], type: Frame['type']): Frame => ({
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
  trackType?: string,
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
    trackType,
  });
  await done;
  return out;
};

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

  it('opus (audio, 1 clear byte)', async () => {
    const pt = [0x78, 0xaa, 0xbb, 0xcc, 0xdd];
    // An audio frame is recognized by the ABSENCE of a key/delta type, and that
    // is what selects the 1-byte Opus TOC clear header.
    const user = freshUser();
    await setKey(user);
    const [encrypted] = await drive('encode', user, 'opus', [
      frame(pt, undefined),
    ]);
    const bytes = Array.from(new Uint8Array(encrypted.data));
    // TOC byte in the clear (the SFU reads it), everything after it encrypted.
    expect(bytes[0]).toBe(0x78);
    expect(bytes.slice(1, pt.length)).not.toEqual(pt.slice(1));
    const [decrypted] = await drive('decode', user, undefined, [encrypted]);
    expect(Array.from(new Uint8Array(decrypted.data))).toEqual(pt);
  });
});

describe('decode pipeline edge behaviors', () => {
  it('passes an unencrypted frame through, but signals it', async () => {
    const user = freshUser();
    const bytes = [9, 9, 9, 9, 9];
    const [out] = await drive(
      'decode',
      user,
      undefined,
      [frame(bytes, 'delta')],
      'SCREEN_SHARE',
    );
    expect(Array.from(new Uint8Array(out.data))).toEqual(bytes);
    // Forwarded as-is (a peer may publish plain), but never silently: the host
    // needs a signal to notice a downgrade on a call where everyone should encrypt.
    expect(posted).toEqual([
      {
        type: 'e2ee.unencrypted_frame',
        userId: user,
        trackType: 'SCREEN_SHARE',
      },
    ]);
  });

  it('drops and signals missing_key when the key is gone', async () => {
    const user = freshUser();
    await setKey(user);
    const [encrypted] = await drive('encode', user, 'vp8', [
      frame([1, 2, 3, 4, 5, 6, 7, 8], 'delta'),
    ]);
    await removeKeys(user);
    posted.length = 0;
    const out = await drive('decode', user, undefined, [encrypted], 'AUDIO');
    expect(out).toHaveLength(0);
    // Not holding the key is reported apart from a failed decrypt, so a host can
    // tell key distribution lag from a mismatched or tampered frame.
    expect(posted).toEqual([
      {
        type: 'e2ee.missing_key',
        userId: user,
        keyIndex: 0,
        trackType: 'AUDIO',
      },
    ]);
    expect(posted.some((m) => m.type === 'e2ee.decryption_failed')).toBe(false);
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

  it('pairs every delivered decryption_failed with a decryption_resumed', async () => {
    const user = freshUser();
    await setKey(user);
    const pt = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const [encrypted] = await drive('encode', user, 'vp8', [
      frame(pt, 'delta'),
    ]);
    const corrupt = (): Frame => {
      const b = new Uint8Array(encrypted.data.slice(0));
      b[5] ^= 0xff;
      return { ...encrypted, data: b.buffer };
    };
    const valid = (): Frame => ({
      ...encrypted,
      data: encrypted.data.slice(0),
    });
    posted.length = 0;
    // Two full fail -> recover cycles inside one throttle window. `resumed` is
    // an edge, so throttling it would drop a transition permanently and leave
    // the host latched on `failed` for a track that is fine.
    await drive(
      'decode',
      user,
      undefined,
      [corrupt(), valid(), corrupt(), valid()],
      'VIDEO',
    );
    const signals = posted
      .map((m) => m.type)
      .filter(
        (t) =>
          t === 'e2ee.decryption_failed' || t === 'e2ee.decryption_resumed',
      );
    // Never more recoveries than failures, never fewer, and the run ends on the
    // recovery - so the host's last signal matches the track's real state.
    const failed = signals.filter((t) => t === 'e2ee.decryption_failed').length;
    const resumed = signals.filter(
      (t) => t === 'e2ee.decryption_resumed',
    ).length;
    expect(resumed).toBe(failed);
    expect(signals.at(-1)).toBe('e2ee.decryption_resumed');
  });

  it('clears a reported failure when the track recovers on a NEW keyIndex', async () => {
    const user = freshUser();
    await setKey(user, 0);
    const pt = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const [atKey0] = await drive('encode', user, 'vp8', [frame(pt, 'delta')]);
    await setKey(user, 1);
    const [atKey1] = await drive('encode', user, 'vp8', [frame(pt, 'delta')]);
    const tampered = new Uint8Array(atKey0.data.slice(0));
    tampered[5] ^= 0xff;

    posted.length = 0;
    // The failure count is per keyIndex, but the host was told "this TRACK is
    // failing" with no index, so a rotation that fixes the track has to clear
    // it. Gating recovery on the failing key's own count would latch forever.
    await drive(
      'decode',
      user,
      undefined,
      [{ ...atKey0, data: tampered.buffer }, atKey1],
      'VIDEO',
    );
    expect(posted.filter((m) => m.type === 'e2ee.decryption_failed')).toEqual([
      { type: 'e2ee.decryption_failed', userId: user, trackType: 'VIDEO' },
    ]);
    expect(posted.filter((m) => m.type === 'e2ee.decryption_resumed')).toEqual([
      { type: 'e2ee.decryption_resumed', userId: user, trackType: 'VIDEO' },
    ]);
  });

  it('survives an RBSP frame that unescapes shorter than the trailer', async () => {
    const user = freshUser();
    await setKey(user);
    const [genuine] = await drive('encode', user, 'h264', [
      frame([0, 0, 0, 1, 0x65, 0x88, 0x11, 0x22, 0x33, 0x44], 'key'),
    ]);
    // Forge a frame that readTrailer accepts as RBSP - valid magic, version and
    // clearBytes in the start-code-safe tail - whose escaped region unescapes to
    // fewer than TRAILER_LEN bytes. Reading the trailer at a negative offset
    // throws, and an unguarded throw out of transform() errors the stream and
    // kills this track's pipeline for good.
    const forged = new Uint8Array(40);
    const view = new DataView(forged.buffer);
    const clearBytes = 20;
    for (let i = 0; i < 3; i++) {
      forged.set([0x00, 0x00, 0x03, 0x00], clearBytes + i * 4);
    }
    view.setUint16(forged.length - 7, RBSP_FLAG | clearBytes);
    forged[forged.length - 5] = E2EE_VERSION;
    view.setUint32(forged.length - 4, MAGIC);
    posted.length = 0;
    // The forged frame arrives first; the genuine frame must still decrypt.
    const out = await drive('decode', user, undefined, [
      { ...genuine, data: forged.buffer },
      genuine,
    ]);
    expect(out).toHaveLength(1);
    expect(posted.some((m) => m.type === 'e2ee.error')).toBe(false);
  });

  // --- authenticate-before-mutate ------------------------------------------

  it('a forged max-counter frame does not freeze the track', async () => {
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

  it('keeps attempting decryption after the failure tolerance is exceeded', async () => {
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
    const out = await drive(
      'decode',
      user,
      undefined,
      [...garbage, genuine],
      'VIDEO',
    );
    // The genuine final frame still decrypts — the key was NOT latched invalid
    // by the preceding failure burst.
    expect(out).toHaveLength(1);
    expect(Array.from(new Uint8Array(out[0].data))).toEqual(plaintexts[n - 1]);
    // The break is surfaced once (on the tolerance crossing) and recovery once.
    // Both name the track: a peer's audio and video are separate transforms
    // reported under one userId, so a host cannot pair them up without this.
    expect(posted.filter((m) => m.type === 'e2ee.broken')).toEqual([
      { type: 'e2ee.broken', userId: user, keyIndex: 0, trackType: 'VIDEO' },
    ]);
    expect(posted.filter((m) => m.type === 'e2ee.decryption_resumed')).toEqual([
      { type: 'e2ee.decryption_resumed', userId: user, trackType: 'VIDEO' },
    ]);
    expect(posted.filter((m) => m.type === 'e2ee.decryption_failed')).toEqual([
      { type: 'e2ee.decryption_failed', userId: user, trackType: 'VIDEO' },
    ]);
  });

  it('scopes failure accounting per track so a healthy track cannot mask a broken one', async () => {
    const user = freshUser();
    await setKey(user);
    // A video track and an audio track for the SAME user + keyIndex. Encode
    // FAILURE_TOLERANCE + 1 video frames (then tamper them so each fails GCM)
    // and one genuine audio frame on the same shared key.
    const n = FAILURE_TOLERANCE + 1;
    const videoPts = Array.from({ length: n }, (_, i) => [
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
    const videoEnc = await drive(
      'encode',
      user,
      'vp8',
      videoPts.map((p) => frame(p, 'delta')),
    );
    const [audioEnc] = await drive('encode', user, 'opus', [
      frame([0x01, 0x02, 0x03, 0x04], undefined),
    ]);
    const tamperedVideo = videoEnc.map((f) => {
      const bytes = new Uint8Array(f.data.slice(0));
      bytes[5] ^= 0xff;
      return { ...f, data: bytes.buffer };
    });

    // Video decode transform: every frame fails, so the break surfaces once.
    posted.length = 0;
    const vOut = await drive('decode', user, undefined, tamperedVideo);
    expect(vOut).toHaveLength(0);
    expect(posted.filter((m) => m.type === 'e2ee.broken')).toHaveLength(1);

    // Audio decode transform (a SEPARATE track): the genuine frame decrypts and
    // must NOT emit decryption_resumed - this track never failed. With the old
    // per-(user, keyIndex) counter shared across tracks, the audio success reset
    // the video failures and spuriously "resumed" (and kept e2ee.broken from
    // ever firing).
    posted.length = 0;
    const aOut = await drive('decode', user, undefined, [audioEnc]);
    expect(aOut).toHaveLength(1);
    expect(posted.some((m) => m.type === 'e2ee.decryption_resumed')).toBe(
      false,
    );
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

  it('fails closed and signals encryption_failed on an unsupported codec', async () => {
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

  it('fails closed on a video frame whose codec was not supplied', async () => {
    const user = freshUser();
    await setKey(user);
    // Without a codec there is no clear-byte rule and no escaping decision for
    // video. Encrypting it whole would blind the SFU to the frame headers, and
    // an unescaped H264 payload would be split by the packetizer on a random
    // start code in the ciphertext - silently, since nothing would signal it.
    const out = await drive('encode', user, undefined, [
      frame([1, 2, 3, 4, 5, 6, 7, 8], 'key'),
    ]);
    expect(out).toHaveLength(0);
    expect(posted.some((m) => m.type === 'e2ee.encryption_failed')).toBe(true);
  }, 3000);

  it('still encrypts an audio frame whose codec was not supplied', async () => {
    const user = freshUser();
    await setKey(user);
    // The counterpart to the case above: an audio frame carries no key/delta
    // type, and the 1-byte TOC rule holds for any audio codec, so an unlabeled
    // audio track must keep working.
    const pt = [0x78, 0xaa, 0xbb, 0xcc, 0xdd];
    const [encrypted] = await drive('encode', user, undefined, [
      frame(pt, undefined),
    ]);
    expect(encrypted).toBeDefined();
    expect(new Uint8Array(encrypted.data)[0]).toBe(0x78);
    expect(posted.some((m) => m.type === 'e2ee.encryption_failed')).toBe(false);
    const [decrypted] = await drive('decode', user, undefined, [encrypted]);
    expect(Array.from(new Uint8Array(decrypted.data))).toEqual(pt);
  });

  it('re-signals encryption_failed after recovery instead of latching for the worker lifetime', async () => {
    const user = freshUser();
    await setKey(user);
    // One h264 encode transform: a frame whose clear header exceeds the
    // trailer's 15-bit clearBytes field fails to encrypt, a normal keyframe then
    // encrypts (recovering the track), and a second bad frame must signal AGAIN.
    // The old worker-lifetime latch emitted only the first signal and then went
    // silent forever - so a later permanent fail-closed dropped every frame with
    // no event.
    const bad = () => {
      // Zero padding, then an IDR slice start code far enough in that
      // h264ClearBytes reports a clear header past MAX_CLEAR_BYTES.
      const bytes = new Array(MAX_CLEAR_BYTES + 8).fill(0);
      bytes.splice(MAX_CLEAR_BYTES, 6, 0, 0, 1, 0x65, 0xaa, 0xbb);
      return frame(bytes, 'key');
    };
    const good = () =>
      frame([0, 0, 0, 1, 0x65, 0x88, 0x11, 0x22, 0x33, 0x44], 'key');
    posted.length = 0;
    const out = await drive('encode', user, 'h264', [bad(), good(), bad()]);
    // Only the valid frame is emitted; both bad frames are dropped (fail closed).
    expect(out).toHaveLength(1);
    // Signaled on the first bad frame, re-armed by the good frame, signaled
    // again on the second bad frame.
    expect(
      posted.filter((m) => m.type === 'e2ee.encryption_failed'),
    ).toHaveLength(2);
  });
});

describe('h264 trailer start-code safety', () => {
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
    const [encrypted] = await drive('encode', user, 'h264', [
      frame(H264_KEYFRAME, 'key'),
    ]);
    const [decrypted] = await drive('decode', user, undefined, [encrypted]);
    expect(Array.from(new Uint8Array(decrypted.data))).toEqual(H264_KEYFRAME);
  });
});
