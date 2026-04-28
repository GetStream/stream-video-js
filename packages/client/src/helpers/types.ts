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
  /** Host platform identifier. iOS-only today; more may be added later. */
  source: 'ios';
  /** Epoch milliseconds when the native snapshot was captured. */
  timestamp: number;
  /** Native audio-session snapshot at `timestamp`. */
  state: {
    /** `AVAudioSession.Category` raw value (e.g. `'AVAudioSessionCategoryPlayAndRecord'`). */
    category: string;
    /** `AVAudioSession.Mode` raw value (e.g. `'AVAudioSessionModeVideoChat'`). */
    mode: string;
    /** `AVAudioSession.CategoryOptions` raw value (bitmask). */
    categoryOptions: number;
    /**
     * Latest interruption event, or `null` if no interruption is active.
     * `type: 'began'` without a later `'ended'` means the session is
     * currently interrupted. `reason` is the raw value of
     * `AVAudioSessionInterruptionReasonKey` (iOS 14.5+).
     */
    interruption: { type: 'began' | 'ended'; reason?: number } | null;
    /** Raw value of the last `AVAudioSessionRouteChangeReasonKey`, if any. */
    routeChangeReason: number | null;
  };
}
