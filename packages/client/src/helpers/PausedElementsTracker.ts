import { ScopedLogger, videoLoggerSystem } from '../logger';
import { Tracer } from '../stats';
import { RecoveryLoop } from './RecoveryLoop';

export interface PausedElementsTrackerOptions {
  kind: 'audio' | 'video';
  tracer: Tracer;
  canResume: () => boolean;
  onChange?: () => void;
}

/**
 * Owns the set of bound media elements that fired `pause` while their
 * `srcObject` still had a live track, plus the bounded {@link RecoveryLoop}
 * that retries `.play()` on them. Generic over `<audio>` / `<video>`.
 */
export class PausedElementsTracker {
  private readonly logger = videoLoggerSystem.getLogger('MediaHealthMonitor');

  private readonly kind: string;
  private readonly tracer: Tracer;
  private readonly onChange?: () => void;
  private readonly recovery: RecoveryLoop;

  readonly elements = new Set<HTMLMediaElement>();

  constructor(opts: PausedElementsTrackerOptions) {
    this.kind = opts.kind;
    this.tracer = opts.tracer;
    this.onChange = opts.onChange;
    this.recovery = new RecoveryLoop({
      canRun: () => this.elements.size > 0 && opts.canResume(),
      isComplete: () => this.elements.size === 0,
      run: () => this.resume(),
    });
  }

  setPaused = (element: HTMLMediaElement, paused: boolean) => {
    if (paused === this.elements.has(element)) return;
    if (paused) {
      this.elements.add(element);
      this.recovery.restart();
    } else {
      this.elements.delete(element);
      if (this.elements.size === 0) this.recovery.clear();
    }
    this.onChange?.();
  };

  restart = () => {
    this.recovery.restart();
  };

  resume = async () => {
    this.tracer.trace(`mediaHealth.resumePausedElements`, {
      kind: this.kind,
      count: this.elements.size,
    });
    await resumeMediaElements(this.elements, this.logger);
    this.onChange?.();
  };

  clear = () => {
    this.elements.clear();
    this.recovery.clear();
  };
}

/**
 * Iterates `elements`, calls `.play()` on every member with a live
 * `srcObject`, and removes resolved (or src-less) entries from the set.
 */
export const resumeMediaElements = async (
  elements: Set<HTMLMediaElement>,
  logger: ScopedLogger,
): Promise<void> => {
  await Promise.all(
    Array.from(elements, async (element) => {
      if (!element.srcObject) return elements.delete(element);
      try {
        await element.play();
        elements.delete(element);
      } catch (err) {
        logger.warn(`Can't resume playback`, element, err);
      }
    }),
  );
};
