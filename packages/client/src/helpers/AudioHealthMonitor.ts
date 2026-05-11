import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { videoLoggerSystem } from '../logger';
import type { RemoteAudioTrackChange } from '../rtc';
import { Tracer } from '../stats';
import { setCurrentValue } from '../store/rxUtils';
import { withoutConcurrency } from './concurrency';
import {
  HOST_AUDIO_SESSION_EVENT,
  type AudioSession,
  type AudioSessionState,
  type AudioSessionType,
  type HostAudioSessionEvent,
} from './types';

/**
 * Coarse audio-pipeline status.
 * Treat `'unknown'` as "no actionable signal" - don't render failure UX,
 * but don't render a green "all clear" either.
 */
export type AudioHealthStatus = 'healthy' | 'unhealthy' | 'unknown';

/**
 * Which direction(s) of the audio pipeline a signal speaks to.
 * `capture`: mic / outgoing only,
 * `playback`: renderer / incoming only,
 * `both`: signal does not separate the two (most OS-level interruptions,
 *   healthy reasons, and the pre-start state).
 */
export type AudioHealthDirection = 'capture' | 'playback' | 'both';

/**
 * Specific cause of the current {@link AudioHealthStatus}.
 *
 * - `'host-audio-session-interrupted'` - iOS host bridge reports an
 *   active `AVAudioSession` interruption. Ground truth on iOS.
 * - `'audio-session-interrupted'` - W3C `navigator.audioSession.state`
 *   is `'interrupted'` (Safari 16.4+).
 * - `'audio-context-interrupted'` - probe `AudioContext.state` is
 *   `'interrupted'`. Redundant with the W3C signal on Safari; kept
 *   distinct in case the two ever diverge.
 * - `'autoplay-blocked'` - browser refused `<audio>.play()` without a
 *   prior user gesture. Recoverable via `call.resumeAudio()` from a
 *   click handler.
 * - `'remote-tracks-muted'` - >=2 remote audio tracks all reported
 *   `muted: true` simultaneously. Cross-browser proxy for "audio
 *   pipeline broken"; single mutes are ignored to avoid confusing
 *   them with a remote sender's own problem.
 * - `'element-paused'` - a bound `<audio>` element fired `'pause'`
 *   while its `srcObject` still had live tracks. The monitor retries
 *   `.play()` automatically and also via `call.resumeAudio()`.
 * - `'host-audio-session-active'` - iOS host bridge confirms no
 *   active interruption.
 * - `'audio-session-active'` - Safari confirms the session is active.
 * - `'playback-verified'` - Chrome / Firefox positive-healthy signal:
 *   at least one remote audio track is unmuted and no bound element
 *   is paused.
 * - `'not-started'` - monitor hasn't been started, or has been stopped.
 * - `'pending'` - monitor is running but no signal has resolved yet.
 *   Normal on Chrome / Firefox before remote audio arrives, on Safari
 *   without W3C Audio Session, and during transient Safari activation.
 *   Not an error; render neutral UX.
 */
export type AudioHealthReason =
  | 'host-audio-session-interrupted'
  | 'audio-session-interrupted'
  | 'audio-context-interrupted'
  | 'autoplay-blocked'
  | 'remote-tracks-muted'
  | 'element-paused'
  | 'host-audio-session-active'
  | 'audio-session-active'
  | 'playback-verified'
  | 'not-started'
  | 'pending';

/**
 * Structured audio-health signal emitted on
 * {@link AudioHealthMonitor.audioHealth$}. `status` is the coarse UX
 * bucket; `reason` carries the specific cause for targeted messaging
 * or recovery; `direction` says which side of the pipeline is affected
 * (or `'both'` when bidirectional / healthy).
 */
export interface AudioHealthInfo {
  status: AudioHealthStatus;
  reason: AudioHealthReason;
  direction: AudioHealthDirection;
}

const UNKNOWN_NOT_STARTED: AudioHealthInfo = {
  status: 'unknown',
  reason: 'not-started',
  direction: 'both',
};

const PAUSED_AUDIO_RECOVERY_RETRY_INTERVAL_MS = 500;
const PAUSED_AUDIO_RECOVERY_MAX_ATTEMPTS = 6;
const PROBE_AUDIO_CONTEXT_RECOVERY_RETRY_INTERVAL_MS = 500;
const PROBE_AUDIO_CONTEXT_RECOVERY_MAX_ATTEMPTS = 6;

/**
 * Detects audio-pipeline failure signals and owns the autoplay-recovery
 * path via `resumeAudio()`. Exposes coarse health on `audioHealth$` for
 * consumer UX and a derived `autoplayBlocked$` for the click-to-resume indicator.
 *
 * Signal sources, in priority order (first match wins):
 *
 * 1. iOS host bridge ({@link HOST_AUDIO_SESSION_EVENT}) - ground truth
 *    from native `AVAudioSession`. Beats the in-page W3C signal because
 *    the host sees hostile category / mode changes WebKit silently ignores.
 * 2. `navigator.audioSession.state` (Safari 16.4+) - primary in-page signal.
 * 3. Probe `AudioContext.state === 'interrupted'` - kept alive by a silent
 *    `ConstantSourceNode` so it fires on `<audio srcObject>` pages with no other AudioContext.
 * 4. Autoplay-blocked `<audio>` elements registered by `DynascaleManager`.
 * 5. Aggregated `MediaStreamTrack.muted` across remote audio tracks (forwarded by `Subscriber`).
 *    Fires only with >=2 tracked tracks all muted; keys on `track.muted` only
 *    (`enabled === false` is user-toggled silence).
 * 6. Bound `<audio>` elements paused while srcObject is live. These are
 *    retried automatically because post-interruption `.play()` often succeeds
 *    without a fresh user gesture once the element was already playing.
 *
 * `start()` writes `navigator.audioSession.type = 'play-and-record'`
 * (snapshotting the previous value); `stop()` restores the snapshot.
 *
 * Lifecycle:
 * - `start()` and `stop()` are both idempotent and serialized via
 *   `withoutConcurrency`. Call `start()` only when an SFU connection
 *   exists; calling earlier mutates page-global audio state needlessly.
 * - `setSfuClient(undefined)` in the owner is deliberately NOT a stop
 *   trigger - transient SFU disconnects must not thrash the probe.
 */
export class AudioHealthMonitor {
  private logger = videoLoggerSystem.getLogger('AudioHealthMonitor');
  private tracer: Tracer;
  private started = false;

  private readonly lifecycleTag = Symbol();

  /** Probe context kept live via a silent `ConstantSourceNode`. */
  private audioContext?: AudioContext;
  private silentSource?: ConstantSourceNode;

  private readonly audioSession?: AudioSession;
  private audioSessionState?: AudioSessionState;
  private originalAudioSessionType?: AudioSessionType;

  /** Latest valid payload from the iOS host bridge, if any. */
  private hostAudioSession?: HostAudioSessionEvent;

  private remoteAudioMutedSubject = new BehaviorSubject(
    new Map<MediaStreamTrack, boolean>(),
  );

  private pausedAudioElementsSubject = new BehaviorSubject(
    new Set<HTMLAudioElement>(),
  );

  private blockedAudioElementsSubject = new BehaviorSubject(
    new Set<HTMLAudioElement>(),
  );

  private pausedAudioRecoveryTimer?: ReturnType<typeof setTimeout>;
  private pausedAudioRecoveryAttempts = 0;
  private pausedAudioRecoveryInFlight = false;
  private probeAudioContextRecoveryTimer?: ReturnType<typeof setTimeout>;
  private probeAudioContextRecoveryAttempts = 0;
  private probeAudioContextRecoveryInFlight = false;

  /**
   * `true` when the browser's autoplay policy is currently blocking
   * audio playback. Recover via `call.resumeAudio()` from a user
   * gesture.
   */
  autoplayBlocked$ = this.blockedAudioElementsSubject.pipe(
    map((elements) => elements.size > 0),
    distinctUntilChanged(),
  );

  private audioHealthSubject = new BehaviorSubject(UNKNOWN_NOT_STARTED);

  /** The main public API: exposes structured audio health to consumers. */
  audioHealth$ = this.audioHealthSubject.asObservable();

  /**
   * Constructs a new AudioHealthMonitor instance.
   * @param tracer the tracer instance to use.
   */
  constructor(tracer: Tracer) {
    this.tracer = tracer;
    this.audioSession =
      typeof navigator !== 'undefined' ? navigator.audioSession : undefined;
  }

  /**
   * Idempotent. Installs the signal sources (W3C hint + observer, probe
   * `AudioContext`, host-bridge listener). Call only when the SFU
   * connection exists.
   */
  start = () => {
    return withoutConcurrency(this.lifecycleTag, async () => {
      if (this.started) return;
      this.started = true;
      this.declarePlayAndRecordAudioSession();
      this.installAudioSessionObserver();
      this.installHostAudioSessionObserver();
      this.setupProbeAudioContext();
      this.updateAudioHealth();
    });
  };

  /**
   * Idempotent. Tears down everything `start()` installed and resets
   * `audioHealth$` to `{ status: 'unknown', reason: 'not-started' }`.
   */
  stop = () => {
    return withoutConcurrency(this.lifecycleTag, async () => {
      if (!this.started) return;
      this.started = false;

      const audioSession = this.audioSession;
      if (audioSession) {
        audioSession.removeEventListener(
          'statechange',
          this.onAudioStateChange,
        );
        if (this.originalAudioSessionType !== undefined) {
          audioSession.type = this.originalAudioSessionType;
        }
      }
      this.originalAudioSessionType = undefined;
      this.audioSessionState = undefined;

      if (typeof window !== 'undefined') {
        window.removeEventListener(
          HOST_AUDIO_SESSION_EVENT,
          this.onHostAudioSessionEvent,
        );
      }
      this.hostAudioSession = undefined;

      if (typeof document !== 'undefined') {
        document.removeEventListener('click', this.resumeAudioContext);
      }
      this.silentSource?.stop();
      this.silentSource?.disconnect();
      this.silentSource = undefined;

      const probe = this.audioContext;
      if (probe) {
        probe.removeEventListener(
          'statechange',
          this.onAudioContextStateChange,
        );
        if (probe.state !== 'closed') {
          try {
            await probe.close();
          } catch (err) {
            this.logger.warn('Failed to close probe AudioContext', err);
          }
        }
      }
      this.audioContext = undefined;

      setCurrentValue(this.blockedAudioElementsSubject, new Set());
      setCurrentValue(this.remoteAudioMutedSubject, new Map());
      setCurrentValue(this.pausedAudioElementsSubject, new Set());
      this.clearPausedAudioRecoveryTimer();
      this.clearProbeAudioContextRecoveryTimer();
      this.audioHealthSubject.next(UNKNOWN_NOT_STARTED);
    });
  };

  /**
   * Registers an audio element whose `.play()` was refused by the
   * browser's autoplay policy.
   */
  updateAutoplayBlockedState = (
    audioElement: HTMLAudioElement,
    blocked: boolean,
  ) => {
    setCurrentValue(this.blockedAudioElementsSubject, (elements) => {
      const next = new Set(elements);
      if (blocked) next.add(audioElement);
      else next.delete(audioElement);
      return next;
    });
    this.updateAudioHealth();
  };

  /**
   * Forwards a remote audio `MediaStreamTrack` event from `Subscriber`.
   */
  handleRemoteAudioTrackChange = (
    track: MediaStreamTrack,
    change: RemoteAudioTrackChange,
  ) => {
    setCurrentValue(this.remoteAudioMutedSubject, (prev) => {
      const next = new Map(prev);
      if (change === 'ended') next.delete(track);
      else next.set(track, change === 'muted');
      return next;
    });
    this.updateAudioHealth();
  };

  /**
   * Registers a bound `<audio>` element that fired `'pause'` while its
   * `srcObject` still had a live track.
   */
  updateElementPausedState = (
    audioElement: HTMLAudioElement,
    paused: boolean,
  ) => {
    if (paused) {
      setCurrentValue(this.pausedAudioElementsSubject, (elements) => {
        if (elements.has(audioElement)) return elements;
        const next = new Set(elements);
        next.add(audioElement);
        return next;
      });
      this.restartPausedAudioElementRecovery();
    } else {
      setCurrentValue(this.pausedAudioElementsSubject, (elements) => {
        if (!elements.has(audioElement)) return elements;
        const next = new Set(elements);
        next.delete(audioElement);
        return next;
      });
      if (this.pausedAudioElementsSubject.getValue().size === 0) {
        this.clearPausedAudioRecoveryTimer();
      }
    }
    this.updateAudioHealth();
  };

  /**
   * Retries `.play()` on every blocked or paused audio element. Blocked
   * elements may still require a user gesture; paused-live elements can often
   * resume automatically after transient OS audio-session interruptions.
   * Resolved elements are removed from their tracking sets.
   */
  resumeAudio = async () => {
    this.tracer.trace('audioHealth.resumeAudio', null);
    await this.resumeAudioContext();
    await Promise.all([
      this.resumeBlockedAudioElements(),
      this.resumePausedAudioElements(),
    ]);
    this.restartProbeAudioContextRecovery();
    this.restartPausedAudioElementRecovery();
    this.updateAudioHealth();
  };

  private resumeBlockedAudioElements = async () => {
    const stillBlocked = new Set<HTMLAudioElement>();
    await Promise.all(
      Array.from(
        this.blockedAudioElementsSubject.getValue(),
        async (element) => {
          try {
            if (element.srcObject) await element.play();
          } catch {
            this.logger.warn(`Can't resume audio for element: `, element);
            stillBlocked.add(element);
          }
        },
      ),
    );
    setCurrentValue(this.blockedAudioElementsSubject, stillBlocked);
  };

  private resumePausedAudioElements = async () => {
    const elements = Array.from(this.pausedAudioElementsSubject.getValue());
    this.tracer.trace('audioHealth.resumePausedAudioElements', {
      count: elements.length,
    });
    const resumed = new Set<HTMLAudioElement>();
    const inactive = new Set<HTMLAudioElement>();
    await Promise.all(
      elements.map(async (element) => {
        try {
          if (!element.srcObject) {
            inactive.add(element);
            return;
          }
          await element.play();
          resumed.add(element);
        } catch {
          this.logger.warn(`Can't resume paused audio element: `, element);
        }
      }),
    );
    setCurrentValue(this.pausedAudioElementsSubject, (current) => {
      if (!resumed.size && !inactive.size) return current;
      const next = new Set(current);
      resumed.forEach((element) => next.delete(element));
      inactive.forEach((element) => next.delete(element));
      return next;
    });
    this.updateAudioHealth();
  };

  private restartPausedAudioElementRecovery = () => {
    this.pausedAudioRecoveryAttempts = 0;
    this.schedulePausedAudioElementRecovery(0);
  };

  private schedulePausedAudioElementRecovery = (delayInMs: number) => {
    if (!this.canAutoResumePausedAudioElements()) return;
    if (this.pausedAudioRecoveryTimer || this.pausedAudioRecoveryInFlight) {
      return;
    }
    if (
      this.pausedAudioRecoveryAttempts >= PAUSED_AUDIO_RECOVERY_MAX_ATTEMPTS
    ) {
      return;
    }
    this.pausedAudioRecoveryTimer = setTimeout(() => {
      this.pausedAudioRecoveryTimer = undefined;
      void this.runPausedAudioElementRecovery();
    }, delayInMs);
  };

  private runPausedAudioElementRecovery = async () => {
    if (!this.canAutoResumePausedAudioElements()) return;
    this.pausedAudioRecoveryAttempts += 1;
    this.pausedAudioRecoveryInFlight = true;
    try {
      await this.resumePausedAudioElements();
    } finally {
      this.pausedAudioRecoveryInFlight = false;
    }
    if (this.pausedAudioElementsSubject.getValue().size === 0) {
      this.pausedAudioRecoveryAttempts = 0;
      return;
    }
    this.schedulePausedAudioElementRecovery(
      PAUSED_AUDIO_RECOVERY_RETRY_INTERVAL_MS,
    );
  };

  private canAutoResumePausedAudioElements = () => {
    if (!this.started) return false;
    if (this.pausedAudioElementsSubject.getValue().size === 0) return false;
    if (this.hostAudioSession?.interruption?.type === 'began') return false;
    if (this.audioSessionState === 'interrupted') return false;
    if (this.audioContext?.state === 'interrupted') return false;
    return true;
  };

  private clearPausedAudioRecoveryTimer = () => {
    clearTimeout(this.pausedAudioRecoveryTimer);
    this.pausedAudioRecoveryTimer = undefined;
  };

  private restartProbeAudioContextRecovery = () => {
    this.probeAudioContextRecoveryAttempts = 0;
    this.clearProbeAudioContextRecoveryTimer();
    this.scheduleProbeAudioContextRecovery(0);
  };

  private scheduleProbeAudioContextRecovery = (delayInMs: number) => {
    if (!this.canAutoResumeProbeAudioContext()) return;
    if (
      this.probeAudioContextRecoveryTimer ||
      this.probeAudioContextRecoveryInFlight
    ) {
      return;
    }
    if (
      this.probeAudioContextRecoveryAttempts >=
      PROBE_AUDIO_CONTEXT_RECOVERY_MAX_ATTEMPTS
    ) {
      return;
    }
    this.probeAudioContextRecoveryTimer = setTimeout(() => {
      this.probeAudioContextRecoveryTimer = undefined;
      void this.runProbeAudioContextRecovery();
    }, delayInMs);
  };

  private runProbeAudioContextRecovery = async () => {
    if (!this.canAutoResumeProbeAudioContext()) return;
    this.probeAudioContextRecoveryAttempts += 1;
    this.probeAudioContextRecoveryInFlight = true;
    try {
      await this.resumeAudioContext();
    } finally {
      this.probeAudioContextRecoveryInFlight = false;
    }
    if (!this.canAutoResumeProbeAudioContext()) {
      this.probeAudioContextRecoveryAttempts = 0;
      this.restartPausedAudioElementRecovery();
      return;
    }
    this.scheduleProbeAudioContextRecovery(
      PROBE_AUDIO_CONTEXT_RECOVERY_RETRY_INTERVAL_MS,
    );
  };

  private canAutoResumeProbeAudioContext = () => {
    const probe = this.audioContext;
    if (!this.started || !probe) return false;
    if (probe.state !== 'interrupted') return false;
    if (this.hostAudioSession?.interruption?.type === 'began') return false;
    if (this.audioSessionState === 'interrupted') return false;
    return true;
  };

  private clearProbeAudioContextRecoveryTimer = () => {
    clearTimeout(this.probeAudioContextRecoveryTimer);
    this.probeAudioContextRecoveryTimer = undefined;
  };

  /**
   * Hints WebKit (via the W3C Audio Session API) that the page's
   * intended role is play-and-record. Nudges `AVAudioSession` back to
   * a WebRTC-friendly category after a host mutates it elsewhere.
   * Spec: https://www.w3.org/TR/audio-session/
   */
  private declarePlayAndRecordAudioSession = () => {
    const audioSession = this.audioSession;
    if (!audioSession) return;
    try {
      this.originalAudioSessionType = audioSession.type;
      audioSession.type = 'play-and-record';
      this.tracer.trace('audioHealth.audioSession.type', audioSession.type);
    } catch (err) {
      this.tracer.trace('audioHealth.audioSession.typeError', String(err));
    }
  };

  private installAudioSessionObserver = () => {
    const audioSession = this.audioSession;
    if (!audioSession) return;
    this.audioSessionState = audioSession.state;
    audioSession.addEventListener('statechange', this.onAudioStateChange);
  };

  private onAudioStateChange = () => {
    const audioSession = this.audioSession;
    if (!audioSession) return;
    this.audioSessionState = audioSession.state;
    this.tracer.trace('audioHealth.audioSession.state', audioSession.state);
    this.updateAudioHealth();
    if (audioSession.state === 'active') {
      this.restartProbeAudioContextRecovery();
      this.restartPausedAudioElementRecovery();
    }
  };

  private installHostAudioSessionObserver = () => {
    if (typeof window === 'undefined') return;
    window.addEventListener(
      HOST_AUDIO_SESSION_EVENT,
      this.onHostAudioSessionEvent,
    );
  };

  /**
   * Validates the schema and stores the payload as the latest native
   * snapshot. Malformed events are dropped silently - the host owns
   * the shape.
   */
  private onHostAudioSessionEvent = (
    customEvent: WindowEventMap[typeof HOST_AUDIO_SESSION_EVENT],
  ) => {
    const detail = customEvent.detail;
    if (!detail || typeof detail !== 'object') return;
    if (detail.schemaVersion !== 1) return;
    if (!detail.session || typeof detail.session !== 'object') return;
    this.hostAudioSession = detail;
    this.tracer.trace('audioHealth.hostAudioSession', detail);
    this.updateAudioHealth();
    if (detail.interruption?.type !== 'began') {
      this.restartProbeAudioContextRecovery();
      this.restartPausedAudioElementRecovery();
    }
  };

  /**
   * Creates the probe `AudioContext`. A silent `ConstantSourceNode`
   * keeps the render graph live so `state === 'interrupted'` fires on
   * pages that render audio via `<audio srcObject>`. Piggybacks on a
   * one-shot `document.click` to flip out of the initial `suspended`.
   */
  private setupProbeAudioContext = () => {
    if (typeof AudioContext === 'undefined') return;
    try {
      const probe = new AudioContext();
      this.tracer.trace('audioHealth.probeAudioContext.create', probe.state);
      const source = probe.createConstantSource();
      source.offset.value = 0;
      source.connect(probe.destination);
      source.start();
      probe.addEventListener('statechange', this.onAudioContextStateChange);
      if (probe.state === 'suspended') {
        document.addEventListener('click', this.resumeAudioContext);
      }
      this.audioContext = probe;
      this.silentSource = source;
      this.updateAudioHealth();
    } catch (err) {
      this.tracer.trace(
        'audioHealth.probeAudioContext.createError',
        String(err),
      );
      this.logger.warn(`Failed to create probe AudioContext`, err);
    }
  };

  private onAudioContextStateChange = () => {
    const state = this.audioContext?.state;
    this.tracer.trace('audioHealth.probeAudioContext.state', state);
    this.updateAudioHealth();
    if (state === 'interrupted') {
      this.restartProbeAudioContextRecovery();
    } else if (state) {
      this.restartPausedAudioElementRecovery();
    }
  };

  private resumeAudioContext = async () => {
    const probe = this.audioContext;
    if (!probe) return false;
    if (probe.state !== 'suspended' && probe.state !== 'interrupted') {
      return false;
    }
    try {
      await probe.resume();
      this.tracer.trace('audioHealth.probeAudioContext.resume', probe.state);
      document.removeEventListener('click', this.resumeAudioContext);
      this.updateAudioHealth();
      if (probe.state !== 'interrupted') {
        this.restartPausedAudioElementRecovery();
      }
      return true;
    } catch (err) {
      this.tracer.trace('audioHealth.probeAudioContext.resumeError', {
        state: probe.state,
        error: String(err),
      });
      this.logger.warn(`Can't resume probe audio context`, err);
      return false;
    }
  };

  /**
   * Recomputes audio health from the current signal set and emits on
   * `audioHealth$` when `status` or `reason` changes.
   */
  private updateAudioHealth = () => {
    const next = this.computeAudioHealthInfo();
    const prev = this.audioHealthSubject.getValue();
    if (next.status === prev.status && next.reason === prev.reason) return;
    this.tracer.trace('audioHealth.update', next);
    this.logger.info(
      `audioHealth: ${prev.status}/${prev.reason} → ${next.status}/${next.reason} (direction: ${next.direction})`,
    );
    this.audioHealthSubject.next(next);
  };

  private computeAudioHealthInfo = (): AudioHealthInfo => {
    if (!this.started) return UNKNOWN_NOT_STARTED;

    // Priority: unhealthy beats healthy; native ground truth beats
    // in-page heuristics at the same tier. See class JSDoc for the
    // signal-source list.

    // Direction is 'both' for host-bridge interruption: WebKit's
    // RTCAudioSession stops the audio unit entirely while interrupted,
    // regardless of the host-claimed category.
    if (this.hostAudioSession?.interruption?.type === 'began') {
      return {
        status: 'unhealthy',
        reason: 'host-audio-session-interrupted',
        direction: 'both',
      };
    }
    // W3C `audioSession.state === 'interrupted'` is bidirectional per
    // spec ("lost permission to produce or capture audio").
    if (this.audioSessionState === 'interrupted') {
      return {
        status: 'unhealthy',
        reason: 'audio-session-interrupted',
        direction: 'both',
      };
    }
    // AudioContext is an output-side API per W3C, so the direct signal
    // is playback-only; the W3C tier above catches the bidirectional
    // case on iOS 16.4+.
    if (this.audioContext?.state === 'interrupted') {
      return {
        status: 'unhealthy',
        reason: 'audio-context-interrupted',
        direction: 'playback',
      };
    }
    // Autoplay-blocked goes first within the cross-browser tier
    // because it's the only user-recoverable reason here.
    if (this.blockedAudioElementsSubject.getValue().size > 0) {
      return {
        status: 'unhealthy',
        reason: 'autoplay-blocked',
        direction: 'playback',
      };
    }
    // Threshold is > 1 to avoid false positives on 1:1 calls where a
    // single mute is indistinguishable from a remote sender's problem.
    const remoteAudioMuted = this.remoteAudioMutedSubject.getValue();
    if (
      remoteAudioMuted.size > 1 &&
      Array.from(remoteAudioMuted.values()).every(Boolean)
    ) {
      return {
        status: 'unhealthy',
        reason: 'remote-tracks-muted',
        direction: 'playback',
      };
    }
    if (this.pausedAudioElementsSubject.getValue().size > 0) {
      return {
        status: 'unhealthy',
        reason: 'element-paused',
        direction: 'playback',
      };
    }
    if (this.hostAudioSession) {
      return {
        status: 'healthy',
        reason: 'host-audio-session-active',
        direction: 'both',
      };
    }
    if (this.audioSessionState === 'active') {
      return {
        status: 'healthy',
        reason: 'audio-session-active',
        direction: 'both',
      };
    }
    // Cross-browser positive signal that flips Chrome / Firefox out of
    // `pending` once at least one remote track is unmuted.
    const someUnmuted = Array.from(remoteAudioMuted.values()).some((m) => !m);
    if (someUnmuted) {
      return {
        status: 'healthy',
        reason: 'playback-verified',
        direction: 'both',
      };
    }
    return { status: 'unknown', reason: 'pending', direction: 'both' };
  };
}
