import { videoLoggerSystem } from '../logger';
import { Tracer } from '../stats';
import { retryInterval, timeboxed } from '../coordinator/connection/utils';

type MediaKind = 'audio' | 'video';

export type MediaPlaybackWatchdogOptions = {
  element: HTMLMediaElement;
  kind: MediaKind;
  tracer: Tracer;
  isBlocked?: () => boolean;
};

/**
 * Watches a single audio or video element and attempts to recover playback
 * after the element transitions to a paused or suspended state unexpectedly.
 */
export class MediaPlaybackWatchdog {
  private logger = videoLoggerSystem.getLogger('MediaPlaybackWatchdog');
  private readonly kind: MediaKind;
  private readonly isBlocked: () => boolean;
  private element: HTMLMediaElement;
  private tracer: Tracer;
  private controller = new AbortController();
  private pendingTimer: ReturnType<typeof setTimeout> | undefined;
  private settleTimer: ReturnType<typeof setTimeout> | undefined;
  private attempt = 0;
  private disposed = false;
  private stopped = false;

  constructor(opts: MediaPlaybackWatchdogOptions) {
    this.element = opts.element;
    this.kind = opts.kind;
    this.tracer = opts.tracer;
    this.isBlocked = opts.isBlocked ?? (() => false);
    this.attach();
  }

  private attach = () => {
    if (this.disposed) return;
    const { signal } = this.controller;
    this.element.addEventListener('pause', this.onPauseOrSuspend, { signal });
    this.element.addEventListener('suspend', this.onPauseOrSuspend, { signal });
    this.element.addEventListener('playing', this.onPlaying, { signal });
  };

  dispose = () => {
    if (this.disposed) return;
    this.disposed = true;
    this.controller.abort();
    this.clearTimers();
  };

  private clearTimers = () => {
    if (this.pendingTimer) clearTimeout(this.pendingTimer);
    this.pendingTimer = undefined;
    if (this.settleTimer) clearTimeout(this.settleTimer);
    this.settleTimer = undefined;
  };

  private onPlaying = () => {
    if (this.pendingTimer) clearTimeout(this.pendingTimer);
    this.pendingTimer = undefined;
    if (this.attempt === 0 || this.settleTimer) return;
    this.settleTimer ??= setTimeout(this.onSettled, 1000);
  };

  private onSettled = () => {
    this.settleTimer = undefined;
    if (this.element.paused) return;
    this.tracer.trace('mediaPlayback.recover.success', {
      kind: this.kind,
      attempts: this.attempt,
    });
    this.attempt = 0;
    this.stopped = false;
  };

  private onPauseOrSuspend = (event: Event) => {
    if (this.disposed || this.stopped) return;
    this.tracer.trace('mediaPlayback.paused', {
      kind: this.kind,
      reason: event.type,
    });
    if (this.settleTimer) clearTimeout(this.settleTimer);
    this.settleTimer = undefined;
    this.scheduleRecovery();
  };

  private scheduleRecovery = () => {
    if (this.disposed || this.stopped || this.pendingTimer) return;
    const skipReason = this.computeSkipReason();
    if (skipReason) {
      this.tracer.trace('mediaPlayback.recover.skipped', {
        kind: this.kind,
        reason: skipReason,
      });
      return;
    }

    if (this.attempt >= 10) {
      this.stopped = true;
      this.clearTimers();
      this.tracer.trace('mediaPlayback.recover.giveUp', {
        kind: this.kind,
        attempts: this.attempt,
      });
      return;
    }
    const delay = this.attempt === 0 ? 0 : retryInterval(this.attempt);
    this.pendingTimer = setTimeout(this.attemptPlay, delay);
  };

  private computeSkipReason = (): string | undefined => {
    if (this.disposed) return 'disposed';
    if (!this.element.srcObject) return 'noSrc';
    if (this.element.ended) return 'ended';
    if (this.isBlocked()) return 'blocked';
    const HAVE_CURRENT_DATA = 2;
    if (this.element.readyState < HAVE_CURRENT_DATA) return 'notReady';
    if (!this.element.paused) return 'notPaused';
    return undefined;
  };

  private attemptPlay = async () => {
    this.pendingTimer = undefined;
    if (this.disposed) return;
    this.attempt += 1;
    this.tracer.trace('mediaPlayback.recover.attempt', {
      kind: this.kind,
      attempt: this.attempt,
    });
    try {
      await timeboxed([this.element.play()], 2000);
    } catch (err) {
      if (this.disposed) return;
      this.logger.warn(`Failed to recover ${this.kind} playback`, err);
      this.scheduleRecovery();
    }
  };
}
