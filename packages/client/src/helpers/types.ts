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
 * `AudioHealthMonitor` listens for this event and treats its payload as
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
 * See `sample-apps/ios/ios-webview/IOSWebView/WebView/AudioSessionBridge.swift`
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
}
