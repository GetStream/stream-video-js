import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { videoLoggerSystem } from '../logger';
import type { RemoteAudioTrackChange } from '../rtc';
import { Tracer } from '../stats';
import { setCurrentValue } from '../store/rxUtils';
import { withoutConcurrency } from './concurrency';
import { RecoveryLoop } from './RecoveryLoop';
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
 *   prior user gesture. Recoverable via `call.resumeMedia()` from a
 *   click handler.
 * - `'remote-tracks-muted'` - >=2 remote audio tracks all reported
 *   `muted: true` simultaneously. Cross-browser proxy for "audio
 *   pipeline broken"; single mutes are ignored to avoid confusing
 *   them with a remote sender's own problem.
 * - `'element-paused'` - a bound `<audio>` element fired `'pause'`
 *   while its `srcObject` still had live tracks. The monitor retries
 *   `.play()` automatically and also via `call.resumeMedia()`.
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
 * {@link MediaHealthMonitor.audioHealth$}. `status` is the coarse UX
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

/**
 * Detects audio-pipeline failure signals and owns the autoplay-recovery
 * path via `resumeMedia()`. Exposes coarse health on `audioHealth$` for
 * consumer UX and a derived `autoplayBlocked$` for the click-to-resume indicator.
 *
 * Also owns silent auto-resume for bound `<audio>` AND `<video>` elements
 * that the iOS WebView pauses during an `AVAudioSession` interruption.
 * Video pause recovery does NOT emit on `audioHealth$` (the signal stays
 * audio-only); it just retries `.play()` with the same bounded strategy
 * gated by the same interruption predicates.
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
export class MediaHealthMonitor {
  private logger = videoLoggerSystem.getLogger('MediaHealthMonitor');
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

  private blockedAudioElementsSubject = new BehaviorSubject(
    new Set<HTMLAudioElement>(),
  );

  private remoteAudioMutedSubject = new BehaviorSubject(
    new Map<MediaStreamTrack, boolean>(),
  );

  private pausedAudioElementsSubject = new BehaviorSubject(
    new Set<HTMLAudioElement>(),
  );

  private pausedVideoElementsSubject = new BehaviorSubject(
    new Set<HTMLVideoElement>(),
  );

  private pausedAudioRecovery = new RecoveryLoop({
    canRun: () => this.canAutoResumePausedAudioElements(),
    isComplete: () => this.pausedAudioElementsSubject.getValue().size === 0,
    run: () => this.resumePausedAudioElements(),
  });

  private pausedVideoRecovery = new RecoveryLoop({
    canRun: () => this.canAutoResumePausedVideoElements(),
    isComplete: () => this.pausedVideoElementsSubject.getValue().size === 0,
    run: () => this.resumePausedVideoElements(),
  });

  private probeAudioContextRecovery = new RecoveryLoop({
    canRun: () => this.canAutoResumeProbeAudioContext(),
    isComplete: () => !this.canAutoResumeProbeAudioContext(),
    run: () => this.resumeAudioContext(),
    onCompletion: () => {
      this.pausedAudioRecovery.restart();
      this.pausedVideoRecovery.restart();
    },
  });

  /**
   * `true` when the browser's autoplay policy is currently blocking
   * audio playback. Recover via `call.resumeMedia()` from a user
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
   * Constructs a new MediaHealthMonitor instance.
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
      setCurrentValue(this.pausedVideoElementsSubject, new Set());
      this.pausedAudioRecovery.clear();
      this.pausedVideoRecovery.clear();
      this.probeAudioContextRecovery.clear();
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
      this.pausedAudioRecovery.restart();
    } else {
      setCurrentValue(this.pausedAudioElementsSubject, (elements) => {
        if (!elements.has(audioElement)) return elements;
        const next = new Set(elements);
        next.delete(audioElement);
        return next;
      });
      if (this.pausedAudioElementsSubject.getValue().size === 0) {
        this.pausedAudioRecovery.clear();
      }
    }
    this.updateAudioHealth();
  };

  /**
   * Registers a bound `<video>` element that fired `'pause'` while its
   * `srcObject` still had a live video track. Silent recovery: does
   * NOT emit on {@link audioHealth$}; only kicks the bounded video
   * recovery loop.
   */
  updateVideoElementPausedState = (
    videoElement: HTMLVideoElement,
    paused: boolean,
  ) => {
    if (paused) {
      setCurrentValue(this.pausedVideoElementsSubject, (elements) => {
        if (elements.has(videoElement)) return elements;
        const next = new Set(elements);
        next.add(videoElement);
        return next;
      });
      this.pausedVideoRecovery.restart();
    } else {
      setCurrentValue(this.pausedVideoElementsSubject, (elements) => {
        if (!elements.has(videoElement)) return elements;
        const next = new Set(elements);
        next.delete(videoElement);
        return next;
      });
      if (this.pausedVideoElementsSubject.getValue().size === 0) {
        this.pausedVideoRecovery.clear();
      }
    }
  };

  /**
   * Retries `.play()` on every blocked/paused audio element and every
   * paused video element. Blocked elements may still require a user
   * gesture; paused-live elements can often resume automatically after
   * transient OS audio-session interruptions. Resolved elements are
   * removed from their tracking sets.
   */
  resumeMedia = async () => {
    this.tracer.trace('audioHealth.resumeMedia', null);
    await this.resumeAudioContext();
    await Promise.all([
      this.resumeBlockedAudioElements(),
      this.resumePausedAudioElements(),
      this.resumePausedVideoElements(),
    ]);
    this.probeAudioContextRecovery.restart();
    this.pausedAudioRecovery.restart();
    this.pausedVideoRecovery.restart();
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

  private resumePausedVideoElements = async () => {
    const elements = Array.from(this.pausedVideoElementsSubject.getValue());
    this.tracer.trace('audioHealth.resumePausedVideoElements', {
      count: elements.length,
    });
    const resumed = new Set<HTMLVideoElement>();
    const inactive = new Set<HTMLVideoElement>();
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
          this.logger.warn(`Can't resume paused video element: `, element);
        }
      }),
    );
    setCurrentValue(this.pausedVideoElementsSubject, (current) => {
      if (!resumed.size && !inactive.size) return current;
      const next = new Set(current);
      resumed.forEach((element) => next.delete(element));
      inactive.forEach((element) => next.delete(element));
      return next;
    });
  };

  private canAutoResumePausedAudioElements = () => {
    if (!this.started) return false;
    if (this.pausedAudioElementsSubject.getValue().size === 0) return false;
    if (this.hostAudioSession?.interruption?.type === 'began') return false;
    if (this.audioSessionState === 'interrupted') return false;
    return this.audioContext?.state !== 'interrupted';
  };

  private canAutoResumePausedVideoElements = () => {
    if (!this.started) return false;
    if (this.pausedVideoElementsSubject.getValue().size === 0) return false;
    if (this.hostAudioSession?.interruption?.type === 'began') return false;
    if (this.audioSessionState === 'interrupted') return false;
    return this.audioContext?.state !== 'interrupted';
  };

  private canAutoResumeProbeAudioContext = () => {
    const probe = this.audioContext;
    if (!this.started || !probe) return false;
    if (probe.state !== 'interrupted') return false;
    if (this.hostAudioSession?.interruption?.type === 'began') return false;
    if (this.audioSessionState === 'interrupted') return false;
    return true;
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
      this.probeAudioContextRecovery.restart();
      this.pausedAudioRecovery.restart();
      this.pausedVideoRecovery.restart();
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
      this.probeAudioContextRecovery.restart();
      this.pausedAudioRecovery.restart();
      this.pausedVideoRecovery.restart();
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
      this.probeAudioContextRecovery.restart();
    } else if (state) {
      this.pausedAudioRecovery.restart();
      this.pausedVideoRecovery.restart();
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
        this.pausedAudioRecovery.restart();
        this.pausedVideoRecovery.restart();
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
