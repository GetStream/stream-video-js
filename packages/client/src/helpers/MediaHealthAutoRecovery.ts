import { Observable } from 'rxjs';
import { CameraManager, MicrophoneManager } from '../devices';
import { videoLoggerSystem } from '../logger';
import { Tracer } from '../stats';
import { createSafeAsyncSubscription } from '../store/rxUtils';
import type {
  AudioHealthInfo,
  AudioHealthReason,
  AudioHealthStatus,
  MediaHealthAutoRecoveryConfig,
} from './mediaHealthTypes';

/**
 * Reacts to `MediaHealthMonitor.audioHealth$` transitions and applies
 * recovery actions to the local mic and camera.
 *
 * Two transition triggers:
 *
 * - `healthy → unhealthy` with a `direction` of `'capture'` or `'both'`
 *   and mic currently enabled → `microphone.disable()`. Debounced to
 *   avoid flapping. Respects user mute (skips if mic was already
 *   disabled). `'playback'`-only failures don't trigger auto-mute
 *   because muting in response to a renderer-side issue hurts UX.
 * - `unhealthy → healthy` → for each enabled device whose cycle flag
 *   is set, run `disable() → enable()` to force fresh `MediaStreamTrack`
 *   acquisition. Skips disabled devices so a previously auto-muted user
 *   stays muted (no auto-unmute).
 *
 * Lifecycle mirrors {@link MediaHealthMonitor}: `start()` is idempotent
 * and called by `Call` on SFU connect; `stop()` is idempotent and called
 * on SFU disconnect/leave.
 */
export class MediaHealthAutoRecovery {
  private logger = videoLoggerSystem.getLogger('MediaHealthAutoRecovery');
  private readonly audioHealth$: Observable<AudioHealthInfo>;
  private readonly microphone: MicrophoneManager;
  private readonly camera: CameraManager;
  private readonly tracer: Tracer;
  private readonly config: Required<MediaHealthAutoRecoveryConfig> = {
    autoMuteOnInterruption: true,
    autoCycleMic: true,
    autoCycleCamera: false,
    autoMuteDebounceMs: 1000,
  };

  /** `unsubscribe !== undefined` is the single source of truth for "started". */
  private unsubscribe?: () => void;
  private previousStatus?: AudioHealthStatus;
  // Sentinel: -Infinity means "never auto-muted." Using 0 would conflate
  // "never" with "at epoch 0," which trips fake-timer tests and is
  // theoretically wrong even in production (`Date.now() - 0` happens to
  // be much larger than any debounce window, but the intent is unclear).
  private lastAutoMuteAt = Number.NEGATIVE_INFINITY;

  constructor(
    audioHealth$: Observable<AudioHealthInfo>,
    microphone: MicrophoneManager,
    camera: CameraManager,
    tracer: Tracer,
    config: MediaHealthAutoRecoveryConfig,
  ) {
    this.audioHealth$ = audioHealth$;
    this.microphone = microphone;
    this.camera = camera;
    this.tracer = tracer;
    this.updateConfig(config);
  }

  /**
   * Idempotent. Subscribes to `audioHealth$` and starts reacting to
   * transitions. The current value of `audioHealth$` is captured as the
   * initial `previousStatus` so the first emission isn't compared
   * against `undefined` (which would skip via the transition-from-unknown
   * guard regardless, but seeding makes the intent explicit).
   */
  start = () => {
    if (this.unsubscribe) return;
    // `createSafeAsyncSubscription` serializes handler invocations via
    // `withoutConcurrency`, so we can `await` device operations directly:
    // a follow-up emission queues behind the in-flight handler instead of
    // racing it. That's what protects the user from being silently
    // un-muted on a fast `unhealthy → healthy` flap right after auto-mute
    // - by the time the recovery handler runs, `microphone.state.status`
    // already reads `disabled` and the cycle skips.
    this.unsubscribe = createSafeAsyncSubscription(
      this.audioHealth$,
      this.onAudioHealth,
    );
  };

  /**
   * Idempotent. Unsubscribes and resets transition-tracking state. A
   * subsequent `start()` re-seeds `previousStatus` from the current
   * `audioHealth$` value.
   */
  stop = () => {
    if (!this.unsubscribe) return;
    this.unsubscribe();
    this.unsubscribe = undefined;
    this.previousStatus = undefined;
    this.lastAutoMuteAt = Number.NEGATIVE_INFINITY;
  };

  /**
   * Replaces the active config without tearing down the subscription.
   */
  updateConfig = (next: MediaHealthAutoRecoveryConfig) => {
    Object.assign(this.config, next);
  };

  private onAudioHealth = async (info: AudioHealthInfo): Promise<void> => {
    const prev = this.previousStatus;
    this.previousStatus = info.status;

    // Skip transitions involving `unknown`: not real events, just
    // initial-state noise (call start, post-stop). Without this guard
    // every user gets auto-muted at call start before the host bridge
    // has snapshotted ground truth.
    if (prev === undefined || prev === 'unknown' || info.status === 'unknown') {
      return;
    }

    if (prev === 'healthy' && info.status === 'unhealthy') {
      await this.handleDegraded(info);
    } else if (prev === 'unhealthy' && info.status === 'healthy') {
      await this.handleRecovered(info.reason);
    }
  };

  private handleDegraded = async (info: AudioHealthInfo): Promise<void> => {
    if (!this.config.autoMuteOnInterruption) return;
    const { direction, reason } = info;
    if (direction !== 'capture' && direction !== 'both') return;
    if (this.microphone.state.status !== 'enabled') return;

    const now = Date.now();
    if (now - this.lastAutoMuteAt < this.config.autoMuteDebounceMs) return;
    this.lastAutoMuteAt = now;

    this.tracer.trace('audioHealth.autoRecovery.muted', { reason });
    try {
      await this.microphone.disable();
    } catch (err) {
      this.logger.warn('audio-health auto-mute failed', err);
    }
  };

  private handleRecovered = async (
    reason: AudioHealthReason,
  ): Promise<void> => {
    const { autoCycleCamera, autoCycleMic } = this.config;
    if (autoCycleMic) {
      await this.cycleDevice('mic', this.microphone, reason);
    }
    if (autoCycleCamera) {
      await this.cycleDevice('camera', this.camera, reason);
    }
  };

  private cycleDevice = async (
    kind: 'mic' | 'camera',
    device: MicrophoneManager | CameraManager,
    reason: AudioHealthReason,
  ): Promise<void> => {
    if (device.state.status !== 'enabled') return;
    this.tracer.trace('audioHealth.autoRecovery.cycled', { kind, reason });
    try {
      await device.disable();
      await device.enable();
    } catch (err) {
      this.logger.warn(`audio-health cycle ${kind} failed`, err);
    }
  };
}
