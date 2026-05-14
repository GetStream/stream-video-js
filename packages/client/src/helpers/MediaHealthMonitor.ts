import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { videoLoggerSystem } from '../logger';
import type { RemoteAudioTrackChange } from '../rtc';
import { Tracer } from '../stats';
import { setCurrentValue, setCurrentValueAsync } from '../store/rxUtils';
import { withoutConcurrency } from './concurrency';
import {
  PausedElementsTracker,
  resumeMediaElements,
} from './PausedElementsTracker';
import { RecoveryLoop } from './RecoveryLoop';
import {
  HOST_AUDIO_SESSION_EVENT,
  type AudioHealthInfo,
  type AudioSession,
  type AudioSessionState,
  type AudioSessionType,
  type HostAudioSessionEvent,
} from './types';

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
  private readonly logger = videoLoggerSystem.getLogger('MediaHealthMonitor');
  private readonly tracer: Tracer;
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

  private readonly pausedAudio: PausedElementsTracker;
  private readonly pausedVideo: PausedElementsTracker;

  private probeAudioContextRecovery = new RecoveryLoop({
    canRun: () => this.canAutoResumeProbeAudioContext(),
    isComplete: () => !this.canAutoResumeProbeAudioContext(),
    run: () => this.resumeAudioContext(),
    onCompletion: () => this.restartPausedRecoveries(),
  });

  private remoteAudioMutedSubject = new BehaviorSubject(
    new Map<MediaStreamTrack, boolean>(),
  );

  private blockedAudioElementsSubject = new BehaviorSubject(
    new Set<HTMLAudioElement>(),
  );

  /**
   * `true` when the browser's autoplay policy is currently blocking
   * audio playback. Recover via `call.resumeMedia()` from a user gesture.
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
    this.pausedAudio = new PausedElementsTracker({
      kind: 'audio',
      tracer: this.tracer,
      canResume: this.canAutoResumePausedElements,
      onChange: this.updateAudioHealth,
    });
    this.pausedVideo = new PausedElementsTracker({
      kind: 'video',
      tracer: this.tracer,
      canResume: this.canAutoResumePausedElements,
    });
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
      this.pausedAudio.clear();
      this.pausedVideo.clear();
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
      if (blocked) elements.add(audioElement);
      else elements.delete(audioElement);
      return elements;
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
    setCurrentValue(this.remoteAudioMutedSubject, (tracks) => {
      if (change === 'ended') tracks.delete(track);
      else tracks.set(track, change === 'muted');
      return tracks;
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
    this.pausedAudio.setPaused(audioElement, paused);
  };

  /**
   * Registers a bound `<video>` element that fired `'pause'` while its
   * `srcObject` still had a live video track.
   */
  updateVideoElementPausedState = (
    videoElement: HTMLVideoElement,
    paused: boolean,
  ) => {
    this.pausedVideo.setPaused(videoElement, paused);
  };

  /**
   * Retries `.play()` on every blocked/paused audio element and every
   * paused video element. Blocked elements may still require a user
   * gesture; paused-live elements can often resume automatically after
   * transient OS audio-session interruptions. Resolved elements are
   * removed from their tracking sets.
   */
  resumeMedia = async () => {
    this.tracer.trace('mediaHealth.resumeMedia', null);
    await this.resumeAudioContext();
    await Promise.all([
      this.resumeBlockedAudioElements(),
      this.pausedAudio.resume(),
      this.pausedVideo.resume(),
    ]);
    this.probeAudioContextRecovery.restart();
    this.restartPausedRecoveries();
    this.updateAudioHealth();
  };

  private resumeBlockedAudioElements = async () => {
    await setCurrentValueAsync(this.blockedAudioElementsSubject, (elements) => {
      const { size } = elements;
      this.tracer.trace('mediaHealth.resumeBlockedAudioElements', { size });
      return resumeMediaElements(elements, this.logger);
    });
  };

  private restartPausedRecoveries = () => {
    this.pausedAudio.restart();
    this.pausedVideo.restart();
  };

  private canAutoResumePausedElements = () => {
    if (!this.started) return false;
    if (this.hostAudioSession?.interruption?.type === 'began') return false;
    if (this.audioSessionState === 'interrupted') return false;
    return this.audioContext?.state !== 'interrupted';
  };

  private canAutoResumeProbeAudioContext = () => {
    const probe = this.audioContext;
    if (!this.started || !probe) return false;
    if (probe.state !== 'interrupted') return false;
    if (this.hostAudioSession?.interruption?.type === 'began') return false;
    return this.audioSessionState !== 'interrupted';
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
      this.tracer.trace('mediaHealth.audioSession.type', audioSession.type);
    } catch (err) {
      this.tracer.trace('mediaHealth.audioSession.typeError', String(err));
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
    this.tracer.trace('mediaHealth.audioSession.state', audioSession.state);
    this.updateAudioHealth();
    if (audioSession.state === 'active') {
      this.probeAudioContextRecovery.restart();
      this.restartPausedRecoveries();
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
    this.tracer.trace('mediaHealth.hostAudioSession', detail);
    this.updateAudioHealth();
    if (detail.interruption?.type !== 'began') {
      this.probeAudioContextRecovery.restart();
      this.restartPausedRecoveries();
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
      this.tracer.trace('mediaHealth.probeAudioContext.create', probe.state);
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
        'mediaHealth.probeAudioContext.createError',
        String(err),
      );
      this.logger.warn(`Failed to create probe AudioContext`, err);
    }
  };

  private onAudioContextStateChange = () => {
    const state = this.audioContext?.state;
    this.tracer.trace('mediaHealth.probeAudioContext.state', state);
    this.updateAudioHealth();
    if (state === 'interrupted') {
      this.probeAudioContextRecovery.restart();
    } else if (state) {
      this.restartPausedRecoveries();
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
      this.tracer.trace('mediaHealth.probeAudioContext.resume', probe.state);
      document.removeEventListener('click', this.resumeAudioContext);
      this.updateAudioHealth();
      if (probe.state !== 'interrupted') {
        this.restartPausedRecoveries();
      }
      return true;
    } catch (err) {
      this.tracer.trace('mediaHealth.probeAudioContext.resumeError', {
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
    this.tracer.trace('mediaHealth.update', next);
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
    if (this.pausedAudio.elements.size > 0) {
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
