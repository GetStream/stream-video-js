import { COUNTER_HARD_LIMIT } from './constants';

/**
 * Monotonic, and deliberately shared across every track and codec this sender
 * publishes: the IV is `ivPrefix ∥ counter`, so two tracks drawing from
 * separate counters would encrypt different frames under the same IV.
 *
 * Survives `removeKeys` on purpose - if the same raw key is imported again the
 * counter keeps climbing, so no (ivPrefix, counter) pair repeats. Second guard
 * against IV reuse, after the per-import random prefix.
 */
let counter = 0;

export const nextFrameCounter = (): number => {
  const next = counter + 1;
  if (next > COUNTER_HARD_LIMIT) throw new Error('frame counter exhausted');
  counter = next;
  return next;
};

/**
 * @internal Test-only. Reaches counter values that would otherwise need 2^32
 * frames. Unused in production, so the bundler drops it.
 */
export const __setFrameCounterForTest = (value: number) => {
  counter = value;
};

/**
 * @internal Test-only. Resets between test cases. Production teardown is
 * `Worker.terminate()`, which reclaims the whole worker.
 */
export const __resetFrameCounterForTest = () => {
  counter = 0;
};
