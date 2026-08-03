/** At most one notification per second per key. */
const THROTTLE_INTERVAL_MS = 1000;

/**
 * Rate limiter keyed by an arbitrary string, so one throttle can cover several
 * independent conditions (a keyIndex, a userId) without them muting each other.
 *
 * Lives here because throttling is a delivery rule, not a general utility -
 * every user of it is in this file.
 */
class Throttle {
  private readonly intervalMs: number;
  private lastFiredAt: Map<string, number> = new Map();

  constructor(intervalMs: number) {
    this.intervalMs = intervalMs;
  }

  /**
   * True at most once per `intervalMs` for that key, so a sustained failure
   * cannot flood the host with notifications.
   */
  tryFire = (key: string): boolean => {
    const now = Date.now();
    if (now - (this.lastFiredAt.get(key) ?? 0) > this.intervalMs) {
      this.lastFiredAt.set(key, now);
      return true;
    }
    return false;
  };
}

/**
 * Internal log-only channel: no `E2EEEventMap` entry, so the manager logs it
 * rather than emitting it to the host.
 */
export const reportError = (message: string): void => {
  self.postMessage({ type: 'e2ee.error', message });
};

/**
 * The encoder holds no key, so every outgoing frame is dropped. Without this
 * the host just sees black video with nothing to act on. Throttled per user,
 * and stops on its own once a key arrives.
 *
 * Module-scoped rather than per transform: this condition is per user by
 * definition, so every track sharing one throttle is the point.
 */
const missingKeyThrottle = new Throttle(THROTTLE_INTERVAL_MS);
export const notifyMissingEncodeKey = (userId: string): void => {
  if (missingKeyThrottle.tryFire(userId)) {
    self.postMessage({ type: 'e2ee.missing_key', userId });
  }
};

/** Encode-side signals for one track. */
export class EncodeNotifier {
  private readonly userId: string;
  private readonly trackType: string | undefined;
  /** True once a failure was reported, until {@link recovered} re-arms it. */
  private latched = false;

  constructor(userId: string, trackType: string | undefined) {
    this.userId = userId;
    this.trackType = trackType;
  }

  /** First failure of a run; silent until {@link recovered} re-arms it. */
  failed = (reason: string): void => {
    if (this.latched) return;
    this.latched = true;
    self.postMessage({
      type: 'e2ee.encryption_failed',
      userId: this.userId,
      trackType: this.trackType,
      reason,
    });
  };

  /**
   * A frame encrypted again, so the next failure is worth reporting. Re-arming
   * is deliberate: it stops one early transient error from hiding a later
   * permanent one, such as the frame-counter hard limit.
   */
  recovered = (): void => {
    this.latched = false;
  };
}

/**
 * Decode-side signals for one track.
 *
 * One notifier is one track, so `userId` is constant: each throttle holds a
 * single entry and limits that track alone.
 */
export class DecodeNotifier {
  private readonly userId: string;
  private readonly trackType: string | undefined;
  private readonly failureThrottle = new Throttle(THROTTLE_INTERVAL_MS);
  /**
   * A key in flight, or a rotation whose keyIndex has not arrived, are both
   * normal. Keyed by keyIndex: one signal per key epoch.
   */
  private readonly missingKeyThrottle = new Throttle(THROTTLE_INTERVAL_MS);
  private readonly cleartextThrottle = new Throttle(THROTTLE_INTERVAL_MS);
  /**
   * True once a `decryption_failed` reached the host. Pairs the two signals:
   * only a delivered failure needs clearing, and clearing it re-arms this.
   */
  private failureReported = false;

  constructor(userId: string, trackType: string | undefined) {
    this.userId = userId;
    this.trackType = trackType;
  }

  /** GCM tag failure. Throttled; records that a failure reached the host. */
  failed = (): void => {
    if (!this.failureThrottle.tryFire(this.userId)) return;
    this.failureReported = true;
    self.postMessage({
      type: 'e2ee.decryption_failed',
      userId: this.userId,
      trackType: this.trackType,
    });
  };

  /** Paired with {@link failed}: no-op unless a failure was delivered. */
  resumed = (): void => {
    if (!this.failureReported) return;
    this.failureReported = false;
    self.postMessage({
      type: 'e2ee.decryption_resumed',
      userId: this.userId,
      trackType: this.trackType,
    });
  };

  /** A frame named a key this peer does not hold. Throttled per keyIndex. */
  missingKey = (keyIndex: number): void => {
    if (!this.missingKeyThrottle.tryFire(String(keyIndex))) return;
    self.postMessage({
      type: 'e2ee.missing_key',
      userId: this.userId,
      keyIndex,
      trackType: this.trackType,
    });
  };

  /** A frame carried no E2EE framing and was forwarded as-is. Throttled. */
  unencrypted = (): void => {
    if (!this.cleartextThrottle.tryFire(this.userId)) return;
    self.postMessage({
      type: 'e2ee.unencrypted_frame',
      userId: this.userId,
      trackType: this.trackType,
    });
  };

  /** Consecutive failures crossed the tolerance. Already once-per-run. */
  broken = (keyIndex: number): void => {
    self.postMessage({
      type: 'e2ee.broken',
      userId: this.userId,
      keyIndex,
      trackType: this.trackType,
    });
  };
}
