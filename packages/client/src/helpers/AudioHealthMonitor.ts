import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { videoLoggerSystem } from '../logger';
import { Tracer } from '../stats';
import { setCurrentValue } from '../store/rxUtils';
import type {
  AudioSession,
  AudioSessionState,
  AudioSessionType,
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
 * - `'audio-session-interrupted'` — `navigator.audioSession.state` is
 *   `'interrupted'` (Safari/iOS WebView; another app took the session).
 * - `'audio-context-interrupted'` — probe `AudioContext.state` is
 *   `'interrupted'`. Same root cause as above on Safari; listed separately
 *   so we don't lose the signal if the two probes ever diverge.
 * - `'autoplay-blocked'` — browser refused `<audio>.play()` without a
 *   prior user gesture. Recoverable by `call.resumeAudio()` inside a click
 *   handler.
 * - `'audio-session-active'` — Safari positively confirms the audio
 *   session is active. The strongest "healthy" signal we can observe.
 * - `'not-started'` — monitor hasn't been started (or has been stopped).
 * - `'unsupported'` — monitor is running, but no browser API gives a
 *   positive health signal (Chrome, Firefox, older Safari, or transient
 *   pre-activation state on Safari).
 */
export type AudioHealthReason =
  | 'audio-session-interrupted'
  | 'audio-context-interrupted'
  | 'autoplay-blocked'
  | 'audio-session-active'
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
 * Detects OS-level audio-session interruption and browser autoplay blocks
 * for a call, and exposes coarse health via `audioHealth$`. Also owns the
 * recovery path for autoplay blocks via `resumeAudio()`.
 *
 * The detection pipeline merges three signal sources:
 *
 * 1. `navigator.audioSession.state` transitions (Safari 16.4+) — the
 *    primary signal. `'interrupted'` → unhealthy, `'active'` → healthy.
 * 2. A probe `AudioContext` kept alive by a silent `ConstantSourceNode`
 *    so `AudioContext.state === 'interrupted'` fires reliably even on
 *    pages using `<audio srcObject>` rendering with no other AudioContext.
 *    Acts as a redundant check for (1) on Safari.
 * 3. The set of `<audio>` elements that hit a browser autoplay block
 *    (`NotAllowedError` on `.play()`). Registered by `DynascaleManager`'s
 *    `bindAudioElement` via `registerBlockedAudioElement()`; cleared on
 *    `unregisterBlockedAudioElement()` or a successful `resumeAudio()`.
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
 *   restores `audioSession.type`, clears the blocked-elements set, and
 *   resets `audioHealth$` to `{ status: 'unknown', reason: 'not-started' }`.
 * - `setSfuClient(undefined)` in the owner is deliberately NOT a stop
 *   trigger: transient SFU disconnects during reconnection/migration must
 *   not thrash the probe.
 *
 * TODO (chrome-coverage): the current signal set is Safari-biased. On
 * Chrome/Firefox `audioHealth$` can only flip `unhealthy` via
 * `autoplay-blocked`; OS-level interruption and positive-healthy signals
 * don't exist on those browsers. Two browser-agnostic signals were
 * deferred from the original detection plan and should be added here as
 * new `AudioHealthReason` values, mirroring the `autoplay-blocked`
 * pattern (internal subject + register/unregister methods called by the
 * owner, reducer reads via `.getValue()`).
 *
 * 1. **`MediaStreamTrack.muted === true` aggregated across all remote
 *    audio tracks.** Chrome/Firefox surface pipeline/hardware-level
 *    interruption via `'mute'` / `'unmute'` events on the track — iOS
 *    Safari uses this too when a different app takes the mic.
 *    - *Integration point:* `Subscriber.handleOnTrack()`
 *      (`packages/client/src/rtc/Subscriber.ts:83–94`) already attaches
 *      `mute`/`unmute`/`ended` listeners and only logs. Extend those
 *      listeners to call a new public monitor method like
 *      `registerRemoteTrack(track)` / `unregisterRemoteTrack(track)`.
 *      `Call.ts` already threads `dynascaleManager` to Subscriber — use
 *      an optional callback in `BasePeerConnectionOpts`, same pattern as
 *      other Subscriber-side callbacks.
 *    - *Aggregation:* "**all** remote audio tracks muted" → unhealthy,
 *      not "any" — a single track muting is usually a per-sender
 *      SFU/network issue, not a client-side audio interruption. An
 *      OS-level interruption takes out the whole audio unit, so every
 *      remote track goes muted simultaneously.
 *    - *`muted` vs `enabled`:* key on `track.muted` (browser/OS-imposed)
 *      only. `track.enabled === false` is user-toggled intentional
 *      silence and must NOT flip health.
 *    - *Edge case:* a remote participant leaving while muted — recompute
 *      "all muted?" from the remaining tracks so a single remaining
 *      unmuted track clears the signal.
 *    - *New reason code:* `'remote-tracks-muted'`.
 *
 * 2. **`HTMLMediaElement.paused === true` with a live `MediaStream`
 *    `srcObject`.** Strong signal that the browser auto-paused a
 *    render-side element (OS interruption, tab backgrounded, or element
 *    hit a stall).
 *    - *Integration point:* `AudioBindingsWatchdog.register()`
 *      (`packages/client/src/helpers/AudioBindingsWatchdog.ts`) already
 *      holds a map of bound elements. Extend it to install `pause`/`play`
 *      listeners and forward paused-state changes to the monitor via
 *      another new public method pair (`registerPausedAudioElement` /
 *      `unregisterPausedAudioElement`).
 *    - *Guard conditions:* only flag when `element.srcObject` is a live
 *      `MediaStream` AND the stream has at least one `live` track.
 *      Ignores benign pauses: `srcObject = null` on unbind,
 *      user-initiated `audio.pause()`, natural end-of-stream.
 *    - *Aggregation:* "**any** bound element paused under the above
 *      conditions" is enough — the user would hear the gap.
 *    - *New reason code:* `'element-paused'`.
 *
 * Both new signals feed `computeAudioHealthInfo()` at the same priority
 * tier as `autoplay-blocked` (after `*-interrupted`, before the healthy
 * check). Once added, promote Chrome/Firefox from
 * `{ 'unknown', 'unsupported' }` to `{ 'healthy', 'playback-verified' }`
 * in the fallback branch when at least one remote track is known to be
 * unmuted AND no bound element is paused AND the monitor is started.
 *
 * Tests to add when shipping (mirror existing patterns in
 * `AudioHealthMonitor.test.ts`):
 * - `registerRemoteTrack` + all tracks muted → `remote-tracks-muted`.
 * - Single track muted out of N → stays healthy (aggregation correctness).
 * - `track.enabled = false` does NOT flip health (user-mute ignored).
 * - `registerPausedAudioElement` with live stream → `element-paused`.
 * - `srcObject = null` path is a no-op (benign-pause filter).
 * - Priority: `*-interrupted` still wins over both new reasons.
 *
 * Out of scope for chrome-coverage and deferred again:
 * - Local mic / Publisher-side mute signal — duplicates what the probe +
 *   `audioSession` already report for solo calls and adds risk to the
 *   concurrency-sensitive Publisher transceiver cache.
 * - React Native parity — RN surfaces interruption through the native
 *   bridge, not `MediaStreamTrack` / `HTMLMediaElement`. Separate plan.
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
   * Set of audio elements whose `.play()` was refused by the browser's
   * autoplay policy. Populated by `registerBlockedAudioElement()`, drained
   * by `unregisterBlockedAudioElement()` / `resumeAudio()` / `stop()`.
   */
  private blockedAudioElementsSubject = new BehaviorSubject<
    Set<HTMLAudioElement>
  >(new Set());

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
   * (`navigator.audioSession` hint+observer, probe `AudioContext`). Must be
   * called when the call becomes active (has an SFU connection); calling
   * before then would mutate page-global audio state unnecessarily.
   */
  start = () => {
    if (this.started) return;
    this.started = true;
    this.declarePlayAndRecordAudioSession();
    this.installAudioSessionObserver();
    this.setupProbeAudioContext();
    this.updateAudioHealth();
  };

  /**
   * Idempotent: tears down everything `start()` installed. Removes the
   * `navigator.audioSession` listener, restores the original
   * `audioSession.type`, closes the probe `AudioContext`, drops the
   * click-to-resume listener, clears the blocked-elements set, and resets
   * `audioHealth$` to `{ status: 'unknown', reason: 'not-started' }`.
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
   * Retries `.play()` on every blocked audio element. Must be called from
   * within a user gesture (e.g. a click handler) for the browser's autoplay
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

    // Priority order: failure signals win over healthy signals.
    // 1. Explicit OS interruption (Safari native).
    if (this.audioSessionState === 'interrupted') {
      return { status: 'unhealthy', reason: 'audio-session-interrupted' };
    }
    // 2. Probe AudioContext interrupted (same root cause as (1) on Safari;
    //    listed separately so we don't lose the signal if they diverge).
    if (this.audioContext?.state === 'interrupted') {
      return { status: 'unhealthy', reason: 'audio-context-interrupted' };
    }
    // 3. Browser autoplay policy block — fires on all browsers. Read the
    //    subject directly since the monitor owns it.
    if (this.blockedAudioElementsSubject.getValue().size > 0) {
      return { status: 'unhealthy', reason: 'autoplay-blocked' };
    }
    // 4. Positive healthy signal: Safari confirms the session is active.
    if (this.audioSessionState === 'active') {
      return { status: 'healthy', reason: 'audio-session-active' };
    }
    // 5. Fallback: no failure, no positive confirmation. Normal on
    //    Chrome/Firefox (no audioSession API) and during transient
    //    pre-activation states on Safari.
    return { status: 'unknown', reason: 'unsupported' };
  };
}
