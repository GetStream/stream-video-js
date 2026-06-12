import { describe, expect, it } from 'vitest';
import {
  E2EE_VERSION,
  IV_PREFIX_LEN,
  MAGIC,
  MAX_CLEAR_BYTES,
  TRAILER_LEN,
} from '../e2ee-worker/constants';
import { enqueue, readTrailer, writeTrailer } from '../e2ee-worker/utils';

const makeFrame = (bodyLen: number): Uint8Array =>
  new Uint8Array(bodyLen + TRAILER_LEN);

const randomPrefix = (): Uint8Array => {
  const p = new Uint8Array(IV_PREFIX_LEN);
  for (let i = 0; i < p.length; i++) p[i] = (i * 17 + 3) & 0xff;
  return p;
};

describe('writeTrailer + readTrailer', () => {
  it('round-trips the full trailer payload', () => {
    const body = 32;
    const dst = makeFrame(body);
    const prefix = randomPrefix();
    writeTrailer(dst, body, 123456, prefix, 7, 10, false);

    const trailer = readTrailer(dst);
    expect(trailer).not.toBeNull();
    expect(trailer!.frameCounter).toBe(123456);
    expect(trailer!.keyIndex).toBe(7);
    expect(trailer!.clearBytes).toBe(10);
    expect(trailer!.isRbsp).toBe(false);
    expect(trailer!.version).toBe(E2EE_VERSION);
    expect(Array.from(trailer!.ivPrefix)).toEqual(Array.from(prefix));
  });

  it('round-trips with the RBSP flag set', () => {
    const dst = makeFrame(20);
    writeTrailer(dst, 20, 1, randomPrefix(), 3, 5, true);
    const trailer = readTrailer(dst);
    expect(trailer!.isRbsp).toBe(true);
    expect(trailer!.clearBytes).toBe(5);
  });

  it('rejects clearBytes over the 15-bit maximum', () => {
    const dst = makeFrame(100);
    expect(() =>
      writeTrailer(dst, 100, 1, randomPrefix(), 0, MAX_CLEAR_BYTES + 1, false),
    ).toThrow(/15-bit/);
  });

  it('rejects ivPrefix of wrong length', () => {
    const dst = makeFrame(20);
    const badPrefix = new Uint8Array(IV_PREFIX_LEN - 1);
    expect(() => writeTrailer(dst, 20, 1, badPrefix, 0, 0, false)).toThrow(
      /ivPrefix/,
    );
  });

  it('returns null for frames shorter than the trailer', () => {
    expect(readTrailer(new Uint8Array(TRAILER_LEN - 1))).toBeNull();
  });

  it('returns null when MAGIC does not match', () => {
    const dst = makeFrame(16);
    writeTrailer(dst, 16, 1, randomPrefix(), 0, 0, false);
    dst[dst.length - 1] ^= 0x01; // corrupt the magic
    expect(readTrailer(dst)).toBeNull();
  });

  it('returns null for an unknown version (even if MAGIC is valid)', () => {
    const dst = makeFrame(16);
    writeTrailer(dst, 16, 1, randomPrefix(), 0, 0, false);
    // Bump the version byte to something we don't know.
    dst[dst.length - 5] = 99;
    expect(readTrailer(dst)).toBeNull();
  });

  it('returns null when the declared clearBytes overruns the body', () => {
    // Craft a frame where the trailer claims clearBytes > bodyLen.
    const body = 5;
    const dst = makeFrame(body);
    writeTrailer(dst, body, 1, randomPrefix(), 0, 0, false);
    const view = new DataView(dst.buffer);
    // Rewrite clearBytes field to body + 1 (still within the 15-bit limit).
    view.setUint16(dst.length - 7, body + 1);
    expect(readTrailer(dst)).toBeNull();
  });

  it('MAGIC constant matches the on-wire value', () => {
    const dst = makeFrame(16);
    writeTrailer(dst, 16, 1, randomPrefix(), 0, 0, false);
    const view = new DataView(dst.buffer);
    expect(view.getUint32(dst.length - 4)).toBe(MAGIC);
  });
});

describe('enqueue', () => {
  it('resolves with the task return value', async () => {
    await expect(enqueue(async () => 42)).resolves.toBe(42);
  });

  it('rejects when the task throws', async () => {
    await expect(
      enqueue(async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });

  it('preserves task ordering', async () => {
    const order: number[] = [];
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        enqueue(async () => {
          await Promise.resolve();
          order.push(i);
        }),
      );
    }
    await Promise.all(promises);
    expect(order).toEqual([0, 1, 2, 3, 4]);
  });

  it('runs tasks serially, never overlapping a previous task still in flight', async () => {
    // Serialization, not just emission order: each task body yields several
    // microtasks while "active". If two ran concurrently, active would exceed 1.
    let active = 0;
    let maxActive = 0;
    const task = () =>
      enqueue(async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await Promise.resolve();
        await Promise.resolve();
        active--;
      });
    await Promise.all([task(), task(), task()]);
    expect(maxActive).toBe(1);
  });

  it('continues running later tasks after one rejects', async () => {
    const seen: string[] = [];
    const ok1 = enqueue(async () => {
      seen.push('a');
    });
    const bad = enqueue(async () => {
      seen.push('b');
      throw new Error('fail');
    });
    const ok2 = enqueue(async () => {
      seen.push('c');
    });
    await Promise.all([ok1, bad.catch(() => {}), ok2]);
    expect(seen).toEqual(['a', 'b', 'c']);
  });
});
