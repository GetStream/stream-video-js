import { videoLoggerSystem } from '../logger';
import { Tracer } from '../stats';
import { retryInterval, timeboxed } from '../coordinator/connection/utils';

type MediaKind = 'audio' | 'video';

export type MediaPlaybackWatchdogOptions = {
  element: HTMLMediaElement;
  kind: MediaKind;
  tracer: Tracer;
  sessionId?: string;
  trackType?: string;
  isBlocked?: () => boolean;
  isInterrupted?: () => boolean;
  retryOnPause?: boolean;
  rearmDelay?: number;
  onGiveUp?: () => void;
  onPlayBlocked?: () => void;
};

/**
 * Watches a single audio or video element and attempts to recover playback
 * after the element transitions to a paused or suspended state unexpectedly.
 */
export class MediaPlaybackWatchdog {
  private logger = videoLoggerSystem.getLogger('MediaPlaybackWatchdog');
  readonly kind: MediaKind;
  private readonly traceInfo: {
    kind: MediaKind;
    sessionId?: string;
    trackType?: string;
  };
  private readonly isBlocked: () => boolean;
  private readonly isInterrupted: () => boolean;
  private readonly retryOnPause: boolean;
  private readonly rearmDelay: number;
  private readonly onGiveUp: () => void;
  private readonly onPlayBlocked: () => void;
  private element: HTMLMediaElement;
  private tracer: Tracer;
  private controller = new AbortController();
  private pendingTimer: ReturnType<typeof setTimeout> | undefined;
  private settleTimer: ReturnType<typeof setTimeout> | undefined;
  private attempt = 0;
  private ownPause = false;
  private disposed = false;
  private stopped = false;

  constructor(opts: MediaPlaybackWatchdogOptions) {
    this.element = opts.element;
    this.kind = opts.kind;
    this.traceInfo = {
      kind: opts.kind,
      sessionId: opts.sessionId,
      trackType: opts.trackType,
    };
    this.tracer = opts.tracer;
    this.isBlocked = opts.isBlocked ?? (() => false);
    this.isInterrupted = opts.isInterrupted ?? (() => false);
    this.retryOnPause = opts.retryOnPause ?? true;
    this.rearmDelay = opts.rearmDelay ?? 0;
    this.onGiveUp = opts.onGiveUp ?? (() => {});
    this.onPlayBlocked = opts.onPlayBlocked ?? (() => {});
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

  /**
   * Starts a fresh recovery cycle, e.g. after a media interruption ended.
   * Unlike a regular pause-triggered recovery, it also tries elements that
   * were skipped as blocked or not ready, since those conditions may have
   * cleared together with the interruption.
   */
  rearm = () => {
    if (this.disposed) return;
    this.clearTimers();
    this.attempt = 0;
    this.stopped = false;
    const { paused, srcObject, ended } = this.element;
    if (!paused || !srcObject || ended) return;
    this.pendingTimer = setTimeout(this.attemptPlay, this.rearmDelay);
  };

  /**
   * Cancels a scheduled recovery attempt, e.g. one a restart replaces.
   */
  cancel = () => {
    this.clearTimers();
  };

  /**
   * Pauses a playing element as the first half of a restart, without that
   * pause starting a recovery. {@link playNow} completes the restart.
   */
  pauseForRestart = () => {
    if (this.disposed) return;
    this.clearTimers();
    const { paused, srcObject, ended } = this.element;
    if (paused || !srcObject || ended) return;
    this.tracer.trace('mediaPlayback.recover.restart', this.traceInfo);
    this.ownPause = true;
    this.element.pause();
  };

  /**
   * Plays a paused element right away, with a fresh recovery budget.
   */
  playNow = () => {
    if (this.disposed) return;
    this.clearTimers();
    this.attempt = 0;
    this.stopped = false;
    const { paused, srcObject, ended } = this.element;
    if (!paused || !srcObject || ended) return;
    void this.attemptPlay();
  };

  /**
   * Plays a paused element inside a user gesture, unless a recovery attempt
   * is already scheduled. Unlike {@link playNow}, it keeps the recovery
   * budget, so repeated gestures don't restart a failing recovery.
   */
  playOnGesture = () => {
    if (this.disposed || this.pendingTimer) return;
    const { paused, srcObject, ended } = this.element;
    if (!paused || !srcObject || ended) return;
    void this.attemptPlay();
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
      ...this.traceInfo,
      attempts: this.attempt,
    });
    this.attempt = 0;
    this.stopped = false;
  };

  /**
   * Media elements backed by a MediaStream fire `suspend` routinely (after
   * the initial load, on source swaps, on layer switches), so a `suspend`
   * that needs no recovery is ignored without a trace. An explicit `pause`
   * is rare and always traced, along with the reason recovery was skipped.
   */
  private onPauseOrSuspend = (event: Event) => {
    if (event.type === 'pause' && this.ownPause) {
      this.ownPause = false;
      return;
    }
    if (this.disposed || this.stopped || this.pendingTimer) return;
    const skipReason = this.computeSkipReason();
    if (skipReason) {
      if (event.type === 'pause') {
        this.tracer.trace('mediaPlayback.paused', {
          ...this.traceInfo,
          reason: event.type,
          skipped: skipReason,
        });
      }
      return;
    }
    if (!this.retryOnPause) {
      if (event.type === 'pause') {
        this.tracer.trace('mediaPlayback.paused', {
          ...this.traceInfo,
          reason: event.type,
          skipped: 'awaitingRearm',
        });
      }
      return;
    }
    this.tracer.trace('mediaPlayback.paused', {
      ...this.traceInfo,
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
        ...this.traceInfo,
        reason: skipReason,
      });
      return;
    }

    if (this.attempt >= 10) {
      this.stopped = true;
      this.clearTimers();
      this.tracer.trace('mediaPlayback.recover.giveUp', {
        ...this.traceInfo,
        attempts: this.attempt,
      });
      this.onGiveUp();
      return;
    }
    const delay = this.attempt === 0 ? 0 : retryInterval(this.attempt);
    this.pendingTimer = setTimeout(this.attemptPlay, delay);
  };

  private computeSkipReason = (): string | undefined => {
    if (this.disposed) return 'disposed';
    if (!this.element.srcObject) return 'noSrc';
    if (this.element.ended) return 'ended';
    if (this.isInterrupted()) return 'interrupted';
    if (this.isBlocked()) return 'blocked';
    const HAVE_CURRENT_DATA = 2;
    if (this.element.readyState < HAVE_CURRENT_DATA) return 'notReady';
    if (!this.element.paused) return 'notPaused';
    return undefined;
  };

  private attemptPlay = async () => {
    this.pendingTimer = undefined;
    if (this.disposed) return;
    if (this.isInterrupted()) {
      this.tracer.trace('mediaPlayback.recover.skipped', {
        ...this.traceInfo,
        reason: 'interrupted',
      });
      return;
    }
    this.attempt += 1;
    this.tracer.trace('mediaPlayback.recover.attempt', {
      ...this.traceInfo,
      attempt: this.attempt,
    });
    try {
      await timeboxed([this.element.play()], 2000);
    } catch (err) {
      if (this.disposed) return;
      this.logger.warn(`Failed to recover ${this.kind} playback`, err);
      if (
        this.kind === 'audio' &&
        (err as Error | undefined)?.name === 'NotAllowedError'
      ) {
        this.tracer.trace('mediaPlayback.recover.blocked', this.traceInfo);
        this.onPlayBlocked();
        return;
      }
      this.scheduleRecovery();
    }
  };
}
