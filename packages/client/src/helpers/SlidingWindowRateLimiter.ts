/**
 * A generic sliding-window rate limiter.
 *
 * Allows at most `maxAttempts` registrations inside a rolling `windowMs`.
 * Attempts spaced further apart than `windowMs` are always allowed.
 */
export class SlidingWindowRateLimiter {
  private maxAttempts: number;
  private windowMs: number;
  private timestamps: number[] = [];

  constructor(maxAttempts: number, windowMs: number) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Attempts to register a new event at `now`. Returns `true` if the attempt
   * fits inside the budget (and records it), or `false` if the budget is
   * exhausted (in which case no timestamp is recorded).
   */
  tryRegister = (now: number = Date.now()): boolean => {
    this.prune(now);
    if (this.timestamps.length >= this.maxAttempts) return false;
    this.timestamps.push(now);
    return true;
  };

  /**
   * Clears the attempt history.
   */
  reset = (): void => {
    this.timestamps = [];
  };

  /**
   * Updates the budget and window size. Existing timestamps are kept; they
   * will be pruned by the next `tryRegister` call.
   */
  setLimits = (maxAttempts: number, windowMs: number): void => {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  };

  private prune = (now: number): void => {
    const cutoff = now - this.windowMs;
    this.timestamps = this.timestamps.filter((t) => t >= cutoff);
  };
}
