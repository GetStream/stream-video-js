import { Observable } from 'rxjs';
import { CameraManager, MicrophoneManager } from '../devices';
import { videoLoggerSystem } from '../logger';
import { Tracer } from '../stats';
import { createSafeAsyncSubscription } from '../store/rxUtils';
import type {
  AudioHealthInfo,
  AudioHealthReason,
  AudioHealthStatus,
} from './AudioHealthMonitor';

/**
 * Tunable configuration for {@link AudioHealthAutoRecovery}.
 *
 * @experimental
 */
export interface AudioHealthAutoRecoveryConfig {
  /**
   * Auto-mute the local mic on `healthy → unhealthy` transitions caused
   * by a *local-capture* reason (`host-audio-session-interrupted`,
   * `audio-session-interrupted`, `audio-context-interrupted`). Surfaces
   * a real mute signal to the SFU so remote participants see the user
   * as explicitly muted instead of broken.
   *
   * Default `true`.
   */
  autoMuteOnInterruption?: boolean;

  /**
   * Cycle the local mic (`disable() → enable()`) on `unhealthy → healthy`
   * transitions if the mic is currently `enabled`. Forces fresh
   * `MediaStreamTrack` acquisition since WebRTC senders still hold stale
   * track references after the underlying `MediaStream` got yanked by the OS.
   *
   * Default `true`.
   */
  autoCycleMic?: boolean;

  /**
   * Cycle the local camera on `unhealthy → healthy` transitions if the
   * camera is currently `enabled`. Off by default - camera cycling
   * causes a visible flicker. Enable only if you have evidence the
   * camera path is also affected by audio-session interruptions
   * (occasionally true on iOS where AVAudioSession and AVCaptureSession
   * share state).
   *
   * Default `false`.
   */
  autoCycleCamera?: boolean;

  /**
   * Minimum time between successive auto-mutes, in milliseconds.
   * Prevents oscillation during network glitches that cause rapid
   * `healthy ↔ unhealthy` flapping.
   *
   * Default `1000`.
   */
  autoMuteDebounceMs?: number;
}

/**
 * Reasons for which auto-mute is sensible - i.e., the *local mic* is the
 * thing that's broken. Other unhealthy reasons (autoplay-blocked,
 * remote-tracks-muted, element-paused) describe remote-side or
 * renderer-side issues; muting the local mic in response would actively
 * hurt UX.
 */
const LOCAL_CAPTURE_REASONS: ReadonlySet<AudioHealthReason> = new Set([
  'host-audio-session-interrupted',
  'audio-session-interrupted',
  'audio-context-interrupted',
]);

/**
 * Reacts to `AudioHealthMonitor.audioHealth$` transitions and applies
 * recovery actions to the local mic and camera.
 *
 * @experimental
 *
 * Two transition triggers:
 *
 * - `healthy → unhealthy` with a *local-capture* reason and mic
 *   currently enabled → `microphone.disable()`. Debounced to avoid
 *   flapping. Respects user mute (skips if mic was already disabled).
 * - `unhealthy → healthy` → for each enabled device whose cycle flag
 *   is set, run `disable() → enable()` to force fresh `MediaStreamTrack`
 *   acquisition. Skips disabled devices so a previously auto-muted user
 *   stays muted (no auto-unmute).
 *
 * Lifecycle mirrors {@link AudioHealthMonitor}: `start()` is idempotent
 * and called by `Call` on SFU connect; `stop()` is idempotent and called
 * on SFU disconnect/leave.
 */
export class AudioHealthAutoRecovery {
  private logger = videoLoggerSystem.getLogger('AudioHealthAutoRecovery');
  private readonly audioHealth$: Observable<AudioHealthInfo>;
  private readonly microphone: MicrophoneManager;
  private readonly camera: CameraManager;
  private readonly tracer: Tracer;
  private readonly config: Required<AudioHealthAutoRecoveryConfig> = {
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
    config: AudioHealthAutoRecoveryConfig,
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
  updateConfig = (next: AudioHealthAutoRecoveryConfig) => {
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
      await this.handleDegraded(info.reason);
    } else if (prev === 'unhealthy' && info.status === 'healthy') {
      await this.handleRecovered(info.reason);
    }
  };

  private handleDegraded = async (reason: AudioHealthReason): Promise<void> => {
    if (!this.config.autoMuteOnInterruption) return;
    if (!LOCAL_CAPTURE_REASONS.has(reason)) return;
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
