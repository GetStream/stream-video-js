import { REPLAY_WINDOW } from './constants';

/** Length-safe byte comparison, for matching a frame's prefix to an epoch. */
const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

const REPLAY_WINDOW_WORDS = REPLAY_WINDOW >>> 5;

/**
 * One sender IV-prefix epoch: a high-water mark plus a bitmap over the
 * preceding {@link REPLAY_WINDOW} counters, where bit `counter % REPLAY_WINDOW`
 * marks a seen counter. O(1) checks and in-order advance, where a `Set` would
 * need an O(REPLAY_WINDOW) prune per frame.
 */
class ReplayEpoch {
  /** Copied, since the caller's view points into a frame buffer that is reused. */
  readonly prefix: Uint8Array;
  private highest: number;
  private bitmap: Uint32Array = new Uint32Array(REPLAY_WINDOW_WORDS);

  constructor(prefix: Uint8Array, counter: number) {
    this.prefix = prefix.slice();
    this.highest = counter;
    this.mark(counter);
  }

  /** Above the high-water mark, or inside the window and not yet seen. */
  accepts = (counter: number): boolean => {
    if (counter > this.highest) return true;
    if (counter <= this.highest - REPLAY_WINDOW) return false;
    return !this.isMarked(counter);
  };

  record = (counter: number): void => {
    if (counter > this.highest) {
      // Slots repeat every REPLAY_WINDOW counters, so skipped ones can hold a
      // stale bit and must be cleared. In-order frames skip none; a large jump
      // makes the whole bitmap stale.
      if (counter - this.highest >= REPLAY_WINDOW) {
        this.bitmap.fill(0);
      } else {
        for (let c = this.highest + 1; c < counter; c++) this.clear(c);
      }
      this.highest = counter;
    }
    this.mark(counter);
  };

  private slot = (counter: number) => {
    const idx = counter % REPLAY_WINDOW;
    return { word: idx >>> 5, mask: 1 << (idx & 31) };
  };

  private isMarked = (counter: number): boolean => {
    const { word, mask } = this.slot(counter);
    return (this.bitmap[word] & mask) !== 0;
  };

  private mark = (counter: number): void => {
    const { word, mask } = this.slot(counter);
    this.bitmap[word] |= mask;
  };

  private clear = (counter: number): void => {
    const { word, mask } = this.slot(counter);
    this.bitmap[word] &= ~mask;
  };
}

/**
 * Sender IV-prefix "epochs" one track's guard keeps. One is normal; a second or
 * third appears briefly around a key re-import or sender restart, while old and
 * new prefixes interleave in the jitter buffer.
 *
 * Eviction is safe because the sender never reuses an (ivPrefix, counter) pair.
 * Only `commit` creates and evicts epochs, and only authenticated frames reach
 * it, so a relay cannot forge new-prefix frames to evict a genuine epoch.
 */
const REPLAY_EPOCHS = 3;

/**
 * Replay guard for one remote track.
 *
 * Shared across tracks it would couple them: independent SSRCs and jitter
 * buffers mean delivery skew could advance the high-water mark far enough to
 * reject a lagging track's frames, dropping media and reporting false failures.
 *
 * Inside a track the sender's IV prefix partitions the window further, so a
 * sender restart (fresh prefix, counter near 0) opens a clean window instead of
 * losing its low counters to a stale mark.
 *
 * Only receive-side bookkeeping is per track. The sender's counter stays global
 * per user (see `frameCounter.ts`), which is what keeps IVs unique across a
 * user's tracks and the wire format identical for other SDKs.
 */
export class ReplayWindow {
  private epochs: ReplayEpoch[] = [];

  private find = (ivPrefix: Uint8Array): ReplayEpoch | undefined =>
    this.epochs.find((e) => bytesEqual(e.prefix, ivPrefix));

  /**
   * True when this prefix can accept `counter`: new prefix, above the
   * high-water mark, or inside the window and not yet committed.
   *
   * Changes no state. A relay can forge the trailer fields this reads, so only
   * an authenticated frame advances the window. See {@link commit}.
   */
  peek = (counter: number, ivPrefix: Uint8Array): boolean => {
    // A prefix with no committed frame yet opens a clean window.
    return this.find(ivPrefix)?.accepts(counter) ?? true;
  };

  /**
   * Record `counter` as seen, advancing the high-water mark. Call it only after
   * AES-GCM authenticates, so unauthenticated bytes cannot wedge the window or
   * evict a genuine epoch.
   */
  commit = (counter: number, ivPrefix: Uint8Array): void => {
    const epoch = this.find(ivPrefix);
    if (epoch) {
      epoch.record(counter);
      return;
    }
    this.epochs.unshift(new ReplayEpoch(ivPrefix, counter));
    if (this.epochs.length > REPLAY_EPOCHS) this.epochs.pop();
  };
}
