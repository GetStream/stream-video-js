import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { videoLoggerSystem } from '../logger';
import type { RemoteAudioTrackChange } from '../rtc';
import { Tracer } from '../stats';
import { setCurrentValue } from '../store/rxUtils';
import {
  HOST_AUDIO_SESSION_EVENT,
  type AudioSession,
  type AudioSessionState,
  type AudioSessionType,
  type HostAudioSessionEvent,
} from './types';

/**
 * Coarse audio-pipeline status.
 *
 * - `'healthy'` — we have a positive signal that audio is working
 *   (`navigator.audioSession.state === 'active'` on Safari 16.4+).
 * - `'unhealthy'` — we have a specific failure signal: OS audio-session
 *   interruption or browser autoplay block.
 * - `'unknown'` — no confident signal either way. Normal on Chrome/Firefox
 *   (no audio-session API to confirm healthy) and before `start()` runs.
 *
 * Consumers should treat `'unknown'` as "no actionable signal" — don't show
 * failure UX, but also don't show a green "all clear" indicator.
 */
export type AudioHealthStatus = 'healthy' | 'unhealthy' | 'unknown';

/**
 * Specific cause of the current {@link AudioHealthStatus}. Lets consumers
 * dispatch on the reason for tailored UX (e.g. "click to enable audio"
 * for autoplay blocks vs. "another app is using your audio" for session
 * interruption).
 *
 * - `'host-audio-session-interrupted'` — an iOS WebView host reported a
 *   native `AVAudioSession` interruption via the
 *   {@link HOST_AUDIO_SESSION_EVENT} bridge. Ground truth on iOS when
 *   the bridge is present; beats the W3C reason below.
 * - `'audio-session-interrupted'` — `navigator.audioSession.state` is
 *   `'interrupted'` (Safari/iOS WebView; another app took the session).
 * - `'audio-context-interrupted'` — probe `AudioContext.state` is
 *   `'interrupted'`. Same root cause as above on Safari; listed separately
 *   so we don't lose the signal if the two probes ever diverge.
 * - `'autoplay-blocked'` — browser refused `<audio>.play()` without a
 *   prior user gesture. Recoverable by `call.resumeAudio()` inside a click
 *   handler.
 * - `'remote-tracks-muted'` — **two or more** remote audio tracks
 *   reported `muted: true` simultaneously (browser/OS-imposed silence,
 *   not user toggling). Cross-browser proxy for "client-wide audio
 *   pipeline broken" — single-track mutes (1:1 calls, per-sender
 *   hiccups) are deliberately ignored because they can't be
 *   distinguished from a remote sender's own problem.
 * - `'element-paused'` — at least one bound `<audio>` element fired a
 *   `'pause'` event while its `srcObject` was still a live `MediaStream`.
 *   Cross-browser proxy for "renderer auto-paused on us."
 * - `'host-audio-session-active'` — an iOS WebView host reported no
 *   active interruption via the {@link HOST_AUDIO_SESSION_EVENT} bridge.
 *   Strongest healthy signal on iOS when the bridge is present.
 * - `'audio-session-active'` — Safari positively confirms the audio
 *   session is active. The strongest "healthy" signal we can observe in
 *   the page when no native bridge is available.
 * - `'playback-verified'` — Chrome/Firefox positive-healthy signal: at
 *   least one remote audio track is known and not muted, and no bound
 *   element is paused. Derived from the same inputs as
 *   `'remote-tracks-muted'` and `'element-paused'`, only fires when no
 *   other signal claimed the slot first.
 * - `'not-started'` — monitor hasn't been started (or has been stopped).
 * - `'unsupported'` — monitor is running, but no browser API gives a
 *   positive health signal (Chrome / Firefox before any remote audio
 *   track has been registered, older Safari, or transient
 *   pre-activation state on Safari).
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
  | 'unsupported';

/**
 * Structured audio-health signal emitted on
 * {@link AudioHealthMonitor.audioHealth$}. `status` is the coarse bucket
 * consumers bind to for UX state; `reason` identifies the specific cause
 * so they can render targeted messaging or choose an appropriate recovery
 * action.
 */
export interface AudioHealthInfo {
  status: AudioHealthStatus;
  reason: AudioHealthReason;
}

const UNKNOWN_NOT_STARTED: AudioHealthInfo = {
  status: 'unknown',
  reason: 'not-started',
};

/**
 * Detects OS-level audio-session interruption, browser autoplay blocks,
 * and cross-browser remote-audio-pipeline failures for a call, and
 * exposes coarse health via `audioHealth$`. Also owns the recovery path
 * for autoplay blocks via `resumeAudio()`.
 *
 * The detection pipeline merges six signal sources:
 *
 * 1. The {@link HOST_AUDIO_SESSION_EVENT} host bridge (iOS WebView
 *    embedders only) — ground truth from native `AVAudioSession`
 *    notifications. `interruption.type === 'began'` → unhealthy,
 *    otherwise → healthy. Beats the in-page W3C signal when both are
 *    available (the host sees hostile category/mode changes WebKit
 *    silently ignores). See `HostAudioSessionEvent` in `./types` for the
 *    protocol contract.
 * 2. `navigator.audioSession.state` transitions (Safari 16.4+) — the
 *    primary in-page signal. `'interrupted'` → unhealthy, `'active'` →
 *    healthy.
 * 3. A probe `AudioContext` kept alive by a silent `ConstantSourceNode`
 *    so `AudioContext.state === 'interrupted'` fires reliably even on
 *    pages using `<audio srcObject>` rendering with no other AudioContext.
 *    Acts as a redundant check for (2) on Safari.
 * 4. The set of `<audio>` elements that hit a browser autoplay block
 *    (`NotAllowedError` on `.play()`). Registered by `DynascaleManager`'s
 *    `bindAudioElement` via `registerBlockedAudioElement()`; cleared on
 *    `unregisterBlockedAudioElement()` or a successful `resumeAudio()`.
 * 5. Aggregated `MediaStreamTrack.muted` across remote audio tracks —
 *    cross-browser proxy for "client-wide audio pipeline broken."
 *    Forwarded by `Subscriber` via `handleRemoteAudioTrackChange()`.
 *    Fires only when **two or more** remote audio tracks are tracked
 *    AND every one is muted simultaneously. A single muted track
 *    (1:1 calls, per-sender hiccups) is deliberately ignored — it
 *    can't be distinguished from a remote sender's own problem, so
 *    treating it as client-wide failure produces false positives.
 *    Keys on `track.muted` only — `track.enabled === false` is
 *    user-toggled silence and must NOT flip health.
 * 6. Bound `<audio>` elements that fire `'pause'` while their
 *    `srcObject` is still a live `MediaStream` — cross-browser proxy
 *    for "renderer auto-paused on us." Forwarded by
 *    `AudioBindingsWatchdog` via `registerPausedAudioElement()` /
 *    `unregisterPausedAudioElement()`. Benign pauses (no `srcObject`,
 *    no live tracks) are filtered at the source.
 *
 * Also writes `navigator.audioSession.type = 'play-and-record'` on
 * `start()` (snapshotting the previous value) to hint WebKit towards the
 * WebRTC-friendly `AVAudioSession` category. `stop()` restores the
 * snapshot so the host page returns to its original preference.
 *
 * Lifecycle:
 * - `start()` is idempotent. Must be called when a call becomes active
 *   (typically from `DynascaleManager.setSfuClient(truthy)`); calling it
 *   before a call joins would mutate page-global audio state
 *   unnecessarily.
 * - `stop()` is idempotent. Removes listeners, closes the probe context,
 *   restores `audioSession.type`, clears the blocked-elements,
 *   remote-track, and paused-element collections, and resets
 *   `audioHealth$` to `{ status: 'unknown', reason: 'not-started' }`.
 * - `setSfuClient(undefined)` in the owner is deliberately NOT a stop
 *   trigger: transient SFU disconnects during reconnection/migration must
 *   not thrash the probe.
 */
export class AudioHealthMonitor {
  private logger = videoLoggerSystem.getLogger('AudioHealthMonitor');
  private tracer: Tracer;
  private started = false;

  /** Probe context kept live via a silent `ConstantSourceNode`. */
  private audioContext?: AudioContext;
  private silentSource?: ConstantSourceNode;

  private readonly audioSession?: AudioSession;
  private audioSessionState?: AudioSessionState;
  private originalAudioSessionType?: AudioSessionType;

  /**
   * Latest payload received from the iOS host-bridge `CustomEvent`
   * ({@link HOST_AUDIO_SESSION_EVENT}). `undefined` until the first valid
   * event arrives, or after `stop()`. The reducer reads this to derive
   * the `host-audio-session-*` reasons.
   */
  private hostAudioSession?: HostAudioSessionEvent;
  /**
   * Whether we've already warned about an unknown `schemaVersion`. Used
   * to throttle the log so a misconfigured host doesn't spam the console.
   */
  private hostAudioSessionSchemaWarned = false;

  private remoteAudioMutedSubject = new BehaviorSubject(
    new Map<MediaStreamTrack, boolean>(),
  );

  private pausedAudioElementsSubject = new BehaviorSubject(
    new Set<HTMLAudioElement>(),
  );

  private blockedAudioElementsSubject = new BehaviorSubject(
    new Set<HTMLAudioElement>(),
  );

  /**
   * Whether the browser's autoplay policy is currently blocking audio
   * playback. `true` when the browser blocks autoplay (e.g., no prior user
   * interaction). Use `call.resumeAudio()` within a user gesture to unblock.
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
   * Idempotent: wires the audio-health signal sources
   * (`navigator.audioSession` hint+observer, probe `AudioContext`,
   * host-bridge `CustomEvent` listener). Must be called when the call
   * becomes active (has an SFU connection); calling before then would
   * mutate page-global audio state unnecessarily.
   */
  start = () => {
    if (this.started) return;
    this.started = true;
    this.declarePlayAndRecordAudioSession();
    this.installAudioSessionObserver();
    this.installHostAudioSessionObserver();
    this.setupProbeAudioContext();
    this.updateAudioHealth();
  };

  /**
   * Idempotent: tears down everything `start()` installed. Removes the
   * `navigator.audioSession` listener, restores the original
   * `audioSession.type`, closes the probe `AudioContext`, drops the
   * click-to-resume listener, removes the host-bridge listener, clears
   * the blocked-elements set, and resets `audioHealth$` to
   * `{ status: 'unknown', reason: 'not-started' }`.
   */
  stop = async () => {
    if (!this.started) return;
    this.started = false;

    const audioSession = this.audioSession;
    if (audioSession) {
      audioSession.removeEventListener('statechange', this.onAudioStateChange);
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
    this.hostAudioSessionSchemaWarned = false;

    document.removeEventListener('click', this.resumeAudioContext);
    this.silentSource?.stop();
    this.silentSource?.disconnect();
    this.silentSource = undefined;

    const probe = this.audioContext;
    if (probe) {
      probe.removeEventListener('statechange', this.onAudioContextStateChange);
      if (probe.state !== 'closed') {
        await probe.close();
      }
    }
    this.audioContext = undefined;

    setCurrentValue(this.blockedAudioElementsSubject, new Set());
    setCurrentValue(this.remoteAudioMutedSubject, new Map());
    setCurrentValue(this.pausedAudioElementsSubject, new Set());
    this.audioHealthSubject.next(UNKNOWN_NOT_STARTED);
  };

  /**
   * Registers an audio element whose `.play()` was refused by the browser's
   * autoplay policy. Flips `audioHealth$` to
   * `{ status: 'unhealthy', reason: 'autoplay-blocked' }` if this is the
   * first blocked element.
   */
  registerBlockedAudioElement = (audioElement: HTMLAudioElement) => {
    setCurrentValue(this.blockedAudioElementsSubject, (elements) => {
      const next = new Set(elements);
      next.add(audioElement);
      return next;
    });
    this.updateAudioHealth();
  };

  /**
   * Unregisters an audio element from the blocked set (e.g., because its
   * `srcObject` was cleared or the element itself is being torn down).
   * Clears `'autoplay-blocked'` if no blocked elements remain.
   */
  unregisterBlockedAudioElement = (audioElement: HTMLAudioElement) => {
    setCurrentValue(this.blockedAudioElementsSubject, (elements) => {
      const next = new Set(elements);
      next.delete(audioElement);
      return next;
    });
    this.updateAudioHealth();
  };

  /**
   * Forwards a `'mute'` / `'unmute'` / `'ended'` event observed on a
   * remote audio `MediaStreamTrack` from the Subscriber.
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
   * `srcObject` was still a live `MediaStream`.
   */
  registerPausedAudioElement = (audioElement: HTMLAudioElement) => {
    setCurrentValue(this.pausedAudioElementsSubject, (elements) => {
      if (elements.has(audioElement)) return elements;
      const next = new Set(elements);
      next.add(audioElement);
      return next;
    });
    this.updateAudioHealth();
  };

  /**
   * Removes an element from the paused set (because it fired `'play'`,
   * was unbound, or is being torn down).
   */
  unregisterPausedAudioElement = (audioElement: HTMLAudioElement) => {
    setCurrentValue(this.pausedAudioElementsSubject, (elements) => {
      if (!elements.has(audioElement)) return elements;
      const next = new Set(elements);
      next.delete(audioElement);
      return next;
    });
    this.updateAudioHealth();
  };

  /**
   * Retries `.play()` on every blocked audio element. Must be called from
   * within a user gesture (e.g., a click handler) for the browser's autoplay
   * policy to permit playback. Elements whose playback resolves are removed
   * from the blocked set; those that still reject stay blocked.
   */
  resumeAudio = async () => {
    this.tracer.trace('resumeAudio', null);
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
    this.updateAudioHealth();
  };

  /**
   * Hints to WebKit that the page's intended audio role is play-and-record.
   *
   * Safari's Web Audio Session API
   * ({@link https://www.w3.org/TR/audio-session/ spec})
   * lets a page declare its audio role. Setting `type = 'play-and-record'`
   * tells WebKit to configure the underlying `AVAudioSession` to a
   * WebRTC-friendly category, which in practice nudges the session back
   * after a native host (an app embedding the webview) mutates it to a
   * non-record category (e.g. `.playback` without `.mixWithOthers`).
   */
  private declarePlayAndRecordAudioSession = () => {
    const audioSession = this.audioSession;
    if (!audioSession) return;
    try {
      this.originalAudioSessionType = audioSession.type;
      audioSession.type = 'play-and-record';
      this.tracer.trace('audioSession.type', audioSession.type);
    } catch (err) {
      this.tracer.trace('audioSession.typeError', String(err));
    }
  };

  /** Observer that feeds the audio-health reducer. */
  private installAudioSessionObserver = () => {
    const audioSession = this.audioSession;
    if (!audioSession) return;
    this.audioSessionState = audioSession.state;
    audioSession.addEventListener('statechange', this.onAudioStateChange);
  };

  /** Handles the `statechange` event from `navigator.audioSession`. */
  private onAudioStateChange = () => {
    const audioSession = this.audioSession;
    if (!audioSession) return;
    this.audioSessionState = audioSession.state;
    this.tracer.trace('audioSession.state', audioSession.state);
    this.updateAudioHealth();
  };

  /**
   * Attaches the `window` listener for the host-bridge `CustomEvent`.
   * No-op outside browser environments. The listener itself validates the
   * payload's `schemaVersion` before feeding it into the reducer.
   */
  private installHostAudioSessionObserver = () => {
    if (typeof window === 'undefined') return;
    window.addEventListener(
      HOST_AUDIO_SESSION_EVENT,
      this.onHostAudioSessionEvent,
    );
  };

  /**
   * Handles a single host-bridge event. Validates the schema version and
   * required fields, then stores the payload as the latest native
   * snapshot. Unknown schema versions warn once; malformed payloads warn
   * every time (they should never occur in practice — the host owns the
   * shape).
   */
  private onHostAudioSessionEvent = (
    event: WindowEventMap[typeof HOST_AUDIO_SESSION_EVENT],
  ) => {
    const detail = event.detail;
    if (!detail || typeof detail !== 'object') {
      this.logger.warn('Host audio-session event had no detail payload');
      return;
    }
    if (detail.schemaVersion !== 1) {
      if (!this.hostAudioSessionSchemaWarned) {
        this.hostAudioSessionSchemaWarned = true;
        this.logger.warn(
          `Host audio-session event has unknown schemaVersion: ${detail.schemaVersion}`,
        );
      }
      return;
    }
    if (!detail.state || typeof detail.state !== 'object') {
      this.logger.warn('Host audio-session event missing `state` field');
      return;
    }
    this.hostAudioSession = detail;
    this.tracer.trace('hostAudioSession', detail);
    this.updateAudioHealth();
  };

  /**
   * Creates the probe `AudioContext`. A silent `ConstantSourceNode` keeps
   * the render graph live so `AudioContext.state === 'interrupted'` fires
   * reliably even on pages using `<audio srcObject>` rendering with no
   * other AudioContext.
   *
   * Needs one user-gesture `resume()` to flip out of the initial
   * `suspended` state; piggybacks on `document.click` once.
   */
  private setupProbeAudioContext = () => {
    if (typeof AudioContext === 'undefined') return;
    try {
      const probe = new AudioContext();
      this.tracer.trace('probeAudioContext.create', probe.state);
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
      this.tracer.trace('probeAudioContext.createError', String(err));
      this.logger.warn(`Failed to create probe AudioContext`, err);
    }
  };

  private onAudioContextStateChange = () => {
    const state = this.audioContext?.state;
    this.tracer.trace('probeAudioContext.state', state);
    this.updateAudioHealth();
  };

  private resumeAudioContext = () => {
    const probe = this.audioContext;
    if (!probe) return;
    if (probe.state !== 'suspended' && probe.state !== 'interrupted') return;
    probe.resume().then(
      () => {
        this.tracer.trace('probeAudioContext.resume', probe.state);
        document.removeEventListener('click', this.resumeAudioContext);
      },
      (err) => {
        this.tracer.trace('probeAudioContext.resumeError', probe.state);
        this.logger.warn(`Can't resume probe audio context`, err);
      },
    );
  };

  /**
   * Merges the three signals into a single {@link AudioHealthInfo} value
   * and emits on `audioHealth$` when either `status` or `reason` changes.
   */
  private updateAudioHealth = () => {
    const next = this.computeAudioHealthInfo();
    const prev = this.audioHealthSubject.getValue();
    if (next.status === prev.status && next.reason === prev.reason) return;
    this.tracer.trace('audioHealth', next);
    this.audioHealthSubject.next(next);
  };

  private computeAudioHealthInfo = (): AudioHealthInfo => {
    if (!this.started) return UNKNOWN_NOT_STARTED;

    // Priority order: failure signals win over healthy signals; native
    // ground truth beats in-page heuristics at the same tier.
    //
    // 1. Host bridge reports an active `AVAudioSession` interruption.
    //    Ground truth on iOS: the host sees hostile category/mode
    //    changes WebKit silently ignores.
    if (this.hostAudioSession?.state.interruption?.type === 'began') {
      return { status: 'unhealthy', reason: 'host-audio-session-interrupted' };
    }
    // 2. Explicit OS interruption via W3C (Safari native).
    if (this.audioSessionState === 'interrupted') {
      return { status: 'unhealthy', reason: 'audio-session-interrupted' };
    }
    // 3. Probe AudioContext interrupted (same root cause as (2) on Safari;
    //    listed separately so we don't lose the signal if they diverge).
    if (this.audioContext?.state === 'interrupted') {
      return { status: 'unhealthy', reason: 'audio-context-interrupted' };
    }
    // 4. Browser autoplay policy block, fires on all browsers. Goes first
    // within the cross-browser tier because it's the only user-recoverable reason in the group
    // ("click to enable audio" is more actionable UX than "audio interrupted").
    if (this.blockedAudioElementsSubject.getValue().size > 0) {
      return { status: 'unhealthy', reason: 'autoplay-blocked' };
    }
    // 5. Two or more remote audio tracks all muted by browser/OS.
    //    Threshold is `> 1` not `> 0`: with a single tracked track
    //    (1:1 call), a mute can't be distinguished from a per-sender
    //    SFU/network hiccup, so treating it as client-wide failure
    //    would produce too many false positives. `every` over the
    //    multi-track set is the cross-browser proxy for "the local
    //    audio unit was taken away."
    const remoteAudioMuted = this.remoteAudioMutedSubject.getValue();
    if (
      remoteAudioMuted.size > 1 &&
      Array.from(remoteAudioMuted.values()).every(Boolean)
    ) {
      return { status: 'unhealthy', reason: 'remote-tracks-muted' };
    }
    // 6. Any bound `<audio>` element auto-paused while its srcObject
    //    is a live MediaStream — renderer-side stall.
    if (this.pausedAudioElementsSubject.getValue().size > 0) {
      return { status: 'unhealthy', reason: 'element-paused' };
    }
    // 7. Positive healthy signal from the host bridge — ground truth
    //    (native confirms the session is not interrupted).
    if (this.hostAudioSession) {
      return { status: 'healthy', reason: 'host-audio-session-active' };
    }
    // 8. Positive healthy signal: Safari confirms the session is active.
    if (this.audioSessionState === 'active') {
      return { status: 'healthy', reason: 'audio-session-active' };
    }
    // 9. Cross-browser positive healthy signal: at least one remote
    //    audio track is known and not muted, and no bound element is
    //    paused. This is what flips Chrome/Firefox out of `unsupported`
    //    once playback is verified.
    const someUnmuted = Array.from(remoteAudioMuted.values()).some((m) => !m);
    if (someUnmuted) {
      return { status: 'healthy', reason: 'playback-verified' };
    }
    // 10. Fallback: no failure, no positive confirmation. Normal on
    //     Chrome/Firefox before any remote audio track is registered,
    //     and during transient pre-activation states on Safari.
    return { status: 'unknown', reason: 'unsupported' };
  };
}
