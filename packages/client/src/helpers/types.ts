export type AudioSessionState = 'inactive' | 'active' | 'interrupted';

export type AudioSessionType =
  | 'auto'
  | 'playback'
  | 'transient'
  | 'transient-solo'
  | 'ambient'
  | 'play-and-record';

export interface AudioSession extends EventTarget {
  type: AudioSessionType;
  state: AudioSessionState;

  onstatechange: EventListenerOrEventListenerObject;
}

declare global {
  interface Navigator {
    /**
     * `audioSession` is available in Safari only. See:
     * https://github.com/w3c/audio-session/blob/main/explainer.md
     */
    audioSession?: AudioSession;
  }

  interface WindowEventMap {
    'stream-video:host-audio-session': CustomEvent<HostAudioSessionEvent>;
  }
}

/**
 * Name of the `CustomEvent` an iOS `WKWebView` host dispatches on `window`
 * to report `AVAudioSession` state into the embedded page. The SDK's
 * `MediaHealthMonitor` listens for this event and treats its payload as
 * the authoritative ground-truth signal for audio-session health on iOS,
 * beating the in-page W3C `navigator.audioSession.state` signal when both
 * are available.
 */
export const HOST_AUDIO_SESSION_EVENT = 'stream-video:host-audio-session';

/**
 * Normalized `AVAudioSession.Category`. The host-side bridge maps Apple's
 * `AVAudioSessionCategory*` raw values to these short names so the
 * payload is platform-agnostic and self-describing in console logs.
 */
export type HostAudioSessionCategory =
  | 'ambient'
  | 'soloAmbient'
  | 'playback'
  | 'record'
  | 'playAndRecord'
  | 'multiRoute';

/**
 * Normalized `AVAudioSession.Mode`. Same normalization rules as
 * {@link HostAudioSessionCategory}.
 */
export type HostAudioSessionMode =
  | 'default'
  | 'voiceChat'
  | 'gameChat'
  | 'videoRecording'
  | 'measurement'
  | 'moviePlayback'
  | 'videoChat'
  | 'spokenAudio'
  | 'voicePrompt';

/**
 * Normalized `AVAudioSession.CategoryOptions` flag names. The host-side
 * bridge decomposes the raw bitmask into a list of these strings.
 */
export type HostAudioSessionCategoryOption =
  | 'mixWithOthers'
  | 'duckOthers'
  | 'allowBluetooth'
  | 'allowBluetoothA2DP'
  | 'allowAirPlay'
  | 'defaultToSpeaker'
  | 'interruptSpokenAudioAndMixWithOthers'
  | 'overrideMutedMicrophoneInterruption'
  | 'allowBluetoothHFP';

/**
 * Normalized `AVAudioSession.InterruptionReason`. Available iOS 14.5+;
 * older iOS versions report `null`. Some values are version-gated by
 * Apple (e.g. `builtInMicMuted` is iOS 17+).
 */
export type HostAudioSessionInterruptionReason =
  | 'default'
  | 'appWasSuspended'
  | 'builtInMicMuted'
  | 'routeDisconnected';

/**
 * One leg of `AVAudioSession.currentRoute`. The host bridge reports
 * inputs (active capture devices) and outputs (active playback devices)
 * as parallel lists so the page can label which device is currently
 * driving mic / speaker.
 *
 * `name` is `AVAudioSessionPortDescription.portName` (human-readable,
 * e.g. "OL AirPods Pro 3", "iPhone Microphone"). `type` is
 * `AVAudioSession.Port` raw value (well-known values include
 * `BluetoothHFP`, `BluetoothA2DPOutput`, `MicrophoneBuiltIn`,
 * `Receiver`, `Speaker`, `Headphones`, `HeadsetMicrophone`,
 * `LineIn`, `LineOut`, `USBAudio`, `HDMI`, `AirPlay`, `CarAudio`,
 * `BluetoothLE`).
 */
export interface HostAudioSessionPort {
  name: string;
  type: string;
}

/**
 * Snapshot of `AVAudioSession.currentRoute` carried by
 * {@link HostAudioSessionEvent}. Lists the active capture and playback
 * ports the OS reports for the call. Empty arrays are valid mid-
 * transition; consumers should treat both lists as "what the device is
 * driving right now" rather than as enumerations of available devices.
 */
export interface HostAudioSessionRoute {
  inputs: HostAudioSessionPort[];
  outputs: HostAudioSessionPort[];
}

/**
 * Normalized `AVAudioSession.RouteChangeReason`.
 */
export type HostAudioSessionRouteChangeReason =
  | 'unknown'
  | 'newDeviceAvailable'
  | 'oldDeviceUnavailable'
  | 'categoryChange'
  | 'override'
  | 'wakeFromSleep'
  | 'noSuitableRouteForCategory'
  | 'routeConfigurationChange';

/**
 * Payload carried by the {@link HOST_AUDIO_SESSION_EVENT} `CustomEvent`.
 *
 * iOS WebView hosts embedding the SDK can implement a native bridge that
 * observes `AVAudioSession.interruptionNotification` and
 * `AVAudioSession.routeChangeNotification` and forwards each transition
 * into the page via
 * `window.dispatchEvent(new CustomEvent('stream-video:host-audio-session', { detail }))`.
 * See
 * `sample-apps/ios/ios-webview/IOSWebView/WKWebView+Extensions/WKWebView+Observation.swift`
 * for the reference implementation.
 *
 * Dispatch contract (host side):
 *
 * - Fire on every interruption notification (`began` / `ended`).
 * - Fire on every route-change notification.
 * - Fire once at page load so late subscribers see the current state.
 *
 * Consumer contract (SDK side):
 *
 * - The event is idempotent ground truth: only the latest event is
 *   retained.
 * - Unknown `schemaVersion` → event is ignored with a single warning.
 *   Bump `schemaVersion` when adding / removing required fields.
 * - Missing or malformed required fields → event is ignored with a
 *   warning, no throw.
 */
export interface HostAudioSessionEvent {
  /** Schema version. Increment when required fields change shape. */
  schemaVersion: 1;
  /** Epoch milliseconds when the native snapshot was captured. */
  timestamp: number;
  /** Snapshot of the native audio session at `timestamp`. */
  session: {
    category: HostAudioSessionCategory;
    mode: HostAudioSessionMode;
    /** Active category options as a list of names (empty array if none). */
    options: HostAudioSessionCategoryOption[];
  };
  /**
   * Latest interruption event, or `null` if no interruption is active.
   * `type: 'began'` without a later `'ended'` means the session is
   * currently interrupted. `reason` is `null` on iOS < 14.5 or when the
   * system did not provide one.
   */
  interruption: {
    type: 'began' | 'ended';
    reason: HostAudioSessionInterruptionReason | null;
  } | null;
  /**
   * Most recent route change, or `null` if no route change has been
   * observed since the bridge started.
   */
  routeChange: {
    reason: HostAudioSessionRouteChangeReason;
  } | null;
  /**
   * Snapshot of the active route at `timestamp`. Lists the input
   * (capture) and output (playback) ports `AVAudioSession` reports as
   * currently active, so the page can label them in the UI (e.g.
   * `mic: AirPods`, `spk: Earpiece`).
   *
   * Optional on the wire: older host builds predate this field and
   * will omit it. New host builds always populate it (empty arrays if
   * the route is momentarily empty, e.g. between transitions).
   */
  route?: HostAudioSessionRoute;
}

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
