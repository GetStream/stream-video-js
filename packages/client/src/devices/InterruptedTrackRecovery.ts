export type InterruptedTrackRecoveryOptions = {
  /**
   * Re-acquires the device. Rejects when capture is still unavailable.
   */
  recover: () => Promise<void>;
  /**
   * Whether the interruption is still in progress.
   */
  isInterrupted: () => boolean;
  /**
   * Subscribes to signals that the interruption may be over.
   *
   * @returns a function that unsubscribes.
   */
  watch: (onMaybeOver: () => void) => () => void;
  trace: (phase: string, attempt?: number) => void;
  /**
   * How long to wait after arming before the first attempt.
   */
  settleDelayMs?: number;
  /**
   * How long to wait after a failed attempt before the next one.
   */
  retryDelayMs?: number;
  maxAttempts?: number;
  /**
   * How long after the last attempt a new arm gets a fresh attempt budget.
   */
  budgetResetMs?: number;
};

/**
 * Re-acquires a capture device whose track the system ended during an
 * interruption (a phone call, Siri, another app taking the device), once
 * the interruption is over. It tries a bounded number of times and stops
 * for good when cancelled.
 */
export class InterruptedTrackRecovery {
  private recover: () => Promise<void>;
  private isInterrupted: () => boolean;
  private watch: (onMaybeOver: () => void) => () => void;
  private trace: (phase: string, attempt?: number) => void;
  private settleDelayMs: number;
  private retryDelayMs: number;
  private maxAttempts: number;
  private budgetResetMs: number;

  private timer: ReturnType<typeof setTimeout> | undefined;
  private unwatch: (() => void) | undefined;
  private attempts = 0;
  private lastAttemptAt: number | undefined;
  private inFlight = false;
  private armed = false;
  private generation = 0;

  constructor(opts: InterruptedTrackRecoveryOptions) {
    this.recover = opts.recover;
    this.isInterrupted = opts.isInterrupted;
    this.watch = opts.watch;
    this.trace = opts.trace;
    this.settleDelayMs = opts.settleDelayMs ?? 1000;
    this.retryDelayMs = opts.retryDelayMs ?? 2000;
    this.maxAttempts = opts.maxAttempts ?? 3;
    this.budgetResetMs = opts.budgetResetMs ?? 30_000;
  }

  /**
   * Starts waiting for the interruption to end. Does nothing while armed.
   * Attempts count across arms that follow each other closely, so a device
   * that keeps ending right after it was re-acquired isn't retried forever.
   */
  arm = () => {
    if (this.armed) return;
    const { lastAttemptAt } = this;
    if (
      lastAttemptAt === undefined ||
      Date.now() - lastAttemptAt >= this.budgetResetMs
    ) {
      this.attempts = 0;
    }
    if (this.attempts >= this.maxAttempts) {
      this.trace('gaveUp', this.attempts);
      return;
    }
    this.armed = true;
    this.generation += 1;
    this.trace('armed');
    this.unwatch = this.watch(this.onSignal);
    this.timer = setTimeout(this.onTimer, this.settleDelayMs);
  };

  /**
   * Stops waiting. The result of an attempt in flight is ignored.
   */
  cancel = () => {
    if (!this.armed) return;
    this.trace('cancelled');
    this.disarm();
  };

  isArmed = () => this.armed;

  private disarm = () => {
    this.armed = false;
    this.generation += 1;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.unwatch?.();
    this.unwatch = undefined;
  };

  /**
   * A scheduled attempt runs on its own, so a signal only matters once no
   * timer is pending.
   */
  private onSignal = () => {
    if (this.timer) return;
    this.tryRecover().catch(() => {});
  };

  private onTimer = () => {
    this.timer = undefined;
    if (this.inFlight) {
      // an attempt of an earlier arm is still running, try after it
      this.timer = setTimeout(this.onTimer, this.retryDelayMs);
      return;
    }
    this.tryRecover().catch(() => {});
  };

  private tryRecover = async () => {
    if (!this.armed || this.inFlight || this.isInterrupted()) return;
    const generation = this.generation;
    const attempt = ++this.attempts;
    this.lastAttemptAt = Date.now();
    this.inFlight = true;
    this.trace('attempt', attempt);
    let recovered = true;
    try {
      await this.recover();
    } catch {
      recovered = false;
    } finally {
      this.inFlight = false;
    }
    if (generation !== this.generation) return;
    if (recovered) {
      this.trace('recovered', attempt);
      return this.disarm();
    }
    if (attempt >= this.maxAttempts) {
      this.trace('gaveUp', attempt);
      return this.disarm();
    }
    this.timer = setTimeout(this.onTimer, this.retryDelayMs);
  };
}
