/**
 * Optional throughput reporting for the E2EE transforms: per-track frame rates
 * and worst-case crypto time, posted once per second while enabled.
 *
 * Diagnostics only - nothing here affects framing or crypto. While reporting is
 * off every entry point is a no-op, so the transforms can call them per frame
 * without a guard of their own.
 */

/** Labels a perf sample carries. `codec` is known on the encode side only. */
type StatLabels = { userId: string; trackType: string; codec?: string };

/** Accumulator for one track, reset by each {@link StatsRegistry.flush}. */
type StatEntry = StatLabels & { count: number; maxCryptoMs: number };

/** One track's rates, as reported to the host. */
type StatSample = StatLabels & { fps: number; maxCryptoMs: number };

/**
 * Whether reporting is on. Module-scoped rather than per registry: the worker
 * has exactly one of each, and a single flag keeps encode and decode from
 * drifting apart.
 */
let perfEnabled = false;
let perfInterval: ReturnType<typeof setInterval> | null = null;
let perfLastTick = 0;

/**
 * Counter handle for one track, held by that track's transform for its
 * lifetime. Every method no-ops while reporting is off.
 */
class TrackStats {
  private stats: Map<string, StatEntry>;
  private readonly key: string;
  private readonly labels: StatLabels;

  constructor(stats: Map<string, StatEntry>, key: string, labels: StatLabels) {
    this.stats = stats;
    this.key = key;
    this.labels = labels;
  }

  /**
   * This track's accumulator, created on first use. Lazy on purpose: the entry
   * is what puts a row in the next report, so a track that goes idle after a
   * flush drops out instead of reporting 0 fps forever.
   */
  private entry = (): StatEntry | undefined => {
    if (!perfEnabled) return undefined;
    let stat = this.stats.get(this.key);
    if (!stat) {
      stat = { ...this.labels, count: 0, maxCryptoMs: 0 };
      this.stats.set(this.key, stat);
    }
    return stat;
  };

  /** Count one frame through the transform. */
  bump = (): void => {
    const stat = this.entry();
    if (stat) stat.count++;
  };

  /** Timestamp to hand back to {@link endCrypto}; 0 while disabled. */
  startCrypto = (): number => (perfEnabled ? performance.now() : 0);

  endCrypto = (startedAt: number): void => {
    const stat = this.entry();
    if (!stat) return;
    stat.maxCryptoMs = Math.max(
      stat.maxCryptoMs,
      performance.now() - startedAt,
    );
  };
}

/**
 * Per-track counters for one direction. The key is unique per track, so a vp8
 * camera and a vp8 screen share (encode), or a peer's audio and video (decode),
 * are reported apart instead of summed.
 */
class StatsRegistry {
  private stats: Map<string, StatEntry> = new Map();

  track = (key: string, labels: StatLabels): TrackStats =>
    new TrackStats(this.stats, key, labels);

  /** Drain all accumulators into per-track rates. */
  flush = (dtSec: number): StatSample[] => {
    const samples = Array.from(
      this.stats.values(),
      ({ count, maxCryptoMs, ...labels }) => ({
        ...labels,
        fps: count / dtSec,
        maxCryptoMs,
      }),
    );
    this.stats.clear();
    return samples;
  };

  clear = (): void => this.stats.clear();

  removeUser = (userId: string): void => {
    for (const [key, stat] of this.stats) {
      if (stat.userId === userId) this.stats.delete(key);
    }
  };
}

export const encodeStats = new StatsRegistry();
export const decodeStats = new StatsRegistry();

export const startPerfReport = () => {
  if (perfInterval) return; // a second interval would leak
  perfEnabled = true;
  perfLastTick = performance.now();
  perfInterval = setInterval(() => {
    const now = performance.now();
    const dtSec = Math.max(0.001, (now - perfLastTick) / 1000);
    perfLastTick = now;
    self.postMessage({
      type: 'e2ee.perf_report',
      encode: encodeStats.flush(dtSec),
      decode: decodeStats.flush(dtSec),
    });
  }, 1000);
};

export const stopPerfReport = () => {
  perfEnabled = false;
  if (perfInterval) {
    clearInterval(perfInterval);
    perfInterval = null;
  }
  encodeStats.clear();
  decodeStats.clear();
};
