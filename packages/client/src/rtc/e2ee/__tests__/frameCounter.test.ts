import { beforeEach, describe, expect, it, vi } from 'vitest';
import { COUNTER_HARD_LIMIT } from '../e2ee-worker/constants';

// The counter itself posts nothing, but importing a key to prove a rekey does
// not reset it goes through notifications.ts on failure.
const postMessage = vi.fn();
vi.stubGlobal('self', { postMessage });

import {
  __resetFrameCounterForTest,
  __setFrameCounterForTest,
  nextFrameCounter,
} from '../e2ee-worker/frameCounter';
import { keyStore } from '../e2ee-worker/keyStore';

const rawKey = (seed = 0xab): ArrayBuffer => {
  const buf = new ArrayBuffer(16);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < 16; i++) bytes[i] = (seed + i) & 0xff;
  return buf;
};

beforeEach(() => {
  __resetFrameCounterForTest();
  keyStore.clear();
  postMessage.mockClear();
});

describe('nextFrameCounter', () => {
  it('increments monotonically, shared across every track', () => {
    // One counter per worker, drawn from by every encode transform. Separate
    // counters per track would let two of this sender's tracks land on the
    // same (ivPrefix, counter) pair under one key.
    expect(nextFrameCounter()).toBe(1);
    expect(nextFrameCounter()).toBe(2);
    expect(nextFrameCounter()).toBe(3);
  });

  it('survives removeKeys — counter is never rolled back', async () => {
    await keyStore.importKey('alice', 1, rawKey());
    expect(nextFrameCounter()).toBe(1);
    expect(nextFrameCounter()).toBe(2);

    keyStore.removeKeys('alice');

    // Re-import the same raw key. Counter must NOT restart — otherwise
    // we'd reuse IVs on the new import's first frames.
    await keyStore.importKey('alice', 1, rawKey());
    expect(nextFrameCounter()).toBe(3);
  });

  it('throws at the 32-bit hard limit and stays exhausted', () => {
    __setFrameCounterForTest(COUNTER_HARD_LIMIT);
    expect(() => nextFrameCounter()).toThrow(/counter exhausted/);
    // Every later frame must fail identically rather than wrapping into a
    // counter that was already used with this ivPrefix.
    expect(() => nextFrameCounter()).toThrow(/counter exhausted/);
    expect(() => nextFrameCounter()).toThrow(/counter exhausted/);
  });

  it('a rekey does not recover an exhausted counter', async () => {
    __setFrameCounterForTest(COUNTER_HARD_LIMIT);
    expect(() => nextFrameCounter()).toThrow();

    // Importing fresh key material is the remedy an integrator would reach
    // for first. It gives a new ivPrefix, but the counter is scoped to the
    // worker rather than to the key, so encryption stays dead.
    await keyStore.importKey('alice', 7, rawKey());
    expect(() => nextFrameCounter()).toThrow(/counter exhausted/);

    // Same after dropping the user's keys entirely.
    keyStore.removeKeys('alice');
    await keyStore.importKey('alice', 8, rawKey());
    expect(() => nextFrameCounter()).toThrow(/counter exhausted/);
  });

  it('never posts a rotation warning ahead of the hard limit', () => {
    // The 2^31 soft threshold and its `e2ee.rotation_needed` event were
    // removed: rotating cannot buy back counter budget, so the signal named a
    // remedy that does nothing. Only the fail-closed ceiling remains.
    __setFrameCounterForTest(0x80000000 - 1);
    nextFrameCounter();
    nextFrameCounter();
    expect(
      postMessage.mock.calls.filter(([msg]) =>
        String(msg?.type).startsWith('e2ee.'),
      ),
    ).toHaveLength(0);
  });
});
