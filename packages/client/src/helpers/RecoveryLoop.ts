import { videoLoggerSystem } from '../logger';

export type RecoveryLoopOptions = {
  canRun: () => boolean;
  isComplete: () => boolean;
  run: () => Promise<any>;
  onCompletion?: () => void;
  /** Defaults to 500ms. */
  intervalMs?: number;
  /** Defaults to 6. */
  maxAttempts?: number;
};

/**
 * Bounded retry loop with a guarded predicate.
 */
export class RecoveryLoop {
  private attempts = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private inFlight = false;
  private readonly options: RecoveryLoopOptions;

  constructor(options: RecoveryLoopOptions) {
    this.options = options;
  }

  restart = () => {
    this.attempts = 0;
    this.clear();
    this.schedule(0);
  };

  clear = () => {
    clearTimeout(this.timer);
    this.timer = undefined;
  };

  private schedule = (delayInMs: number) => {
    if (!this.options.canRun()) return;
    if (this.timer || this.inFlight) return;
    if (this.attempts >= (this.options.maxAttempts ?? 6)) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.runOnce().catch((err) => {
        const logger = videoLoggerSystem.getLogger('RecoveryLoop');
        logger.error('RecoveryLoop failed', err);
      });
    }, delayInMs);
  };

  private runOnce = async () => {
    if (!this.options.canRun()) return;
    this.attempts += 1;
    this.inFlight = true;
    try {
      await this.options.run();
    } finally {
      this.inFlight = false;
    }
    if (this.options.isComplete()) {
      this.attempts = 0;
      this.options.onCompletion?.();
      return;
    }
    this.schedule(this.options.intervalMs ?? 500);
  };
}
