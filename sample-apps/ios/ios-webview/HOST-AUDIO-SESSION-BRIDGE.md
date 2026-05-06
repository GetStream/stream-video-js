# Host audio-session bridge - iOS integration guide

Reference for iOS host applications embedding the Stream React Video SDK
in a `WKWebView`. Explains how to implement a host audio-session bridge
that forwards `AVAudioSession` ground truth into the page so the SDK's
`AudioHealthMonitor` can surface accurate interruption signals.

> 📘 For the conceptual model - why this matters, who owns
> `AVAudioSession`, what the host should and shouldn't do - see
> [`AUDIO-SESSIONS.md`](./AUDIO-SESSIONS.md). This file focuses on the
> bridge contract and integration details.

## Why the bridge exists

A `WKWebView` shares the **process-wide** `AVAudioSession` with its host
app. WebKit's internal `RTCAudioSession` reacts to system interruption
notifications, but a host that silently clobbers the session
(`setCategory(.playback)`, `setActive(true)` for a sound effect, an ad
SDK that claims audio, …) can leave WebRTC stuck without WebKit firing
any W3C-level interruption that the page can detect on its own.

The host is the only party that sees these `AVAudioSession` notifications
directly. The bridge forwards them into the page as a `CustomEvent` so
the SDK can treat them as ground truth.

```
┌────────────────────────────┐    CustomEvent     ┌──────────────────────────┐
│   iOS host (your app)      │   on `window`      │   React Video SDK        │
│                            │ ─────────────────► │   (AudioHealthMonitor)   │
│  AVAudioSession.*Notif.    │ stream-video:      │                          │
│  ─────────────────────►    │   host-audio-session                          │
│  AudioSessionBridge        │                    │  → host-audio-session-*  │
│  (NotificationCenter +     │                    │    reason codes in       │
│   evaluateJavaScript)      │                    │    useAudioHealth()      │
└────────────────────────────┘                    └──────────────────────────┘
```

## Event name + payload contract

The bridge fires exactly one event name on `window`:

```
stream-video:host-audio-session
```

Payload (`event.detail`), TypeScript schema:

```ts
interface HostAudioSessionEvent {
  /** Bumps on any breaking change. SDK ignores unknown versions. */
  schemaVersion: 1;

  /** Epoch ms when the snapshot was captured (Date.now() equivalent). */
  timestamp: number;

  /** Snapshot of the native audio session at `timestamp`. */
  session: {
    /** Normalized AVAudioSession.Category. */
    category:
      | 'ambient'
      | 'soloAmbient'
      | 'playback'
      | 'record'
      | 'playAndRecord'
      | 'multiRoute';

    /** Normalized AVAudioSession.Mode. */
    mode:
      | 'default'
      | 'voiceChat'
      | 'gameChat'
      | 'videoRecording'
      | 'measurement'
      | 'moviePlayback'
      | 'videoChat'
      | 'spokenAudio'
      | 'voicePrompt';

    /** AVAudioSession.CategoryOptions decomposed into a list of names.
     *  Empty array if none are set. */
    options: Array<
      | 'mixWithOthers'
      | 'duckOthers'
      | 'allowBluetoothA2DP'
      | 'allowAirPlay'
      | 'defaultToSpeaker'
      | 'interruptSpokenAudioAndMixWithOthers'
      | 'overrideMutedMicrophoneInterruption'
      | 'allowBluetoothHFP'
    >;
  };

  /** Latest interruption observed; null if none yet. Sticky - once set
   *  on `.began`, stays until cleared by an `.ended`. */
  interruption: {
    type: 'began' | 'ended';
    /** Normalized AVAudioSessionInterruptionReason; null on iOS < 14.5
     *  or when the system did not provide one. */
    reason:
      | 'default'
      | 'appWasSuspended'
      | 'builtInMicMuted'
      | 'routeDisconnected'
      | null;
  } | null;

  /** Most recent route change; null if none observed since startup. */
  routeChange: {
    reason:
      | 'unknown'
      | 'newDeviceAvailable'
      | 'oldDeviceUnavailable'
      | 'categoryChange'
      | 'override'
      | 'wakeFromSleep'
      | 'noSuitableRouteForCategory'
      | 'routeConfigurationChange';
  } | null;
}
```

The bridge normalizes Apple's raw enum values (`AVAudioSessionCategoryPlayAndRecord`, integer route-change reasons, the `categoryOptions` bitmask) into self-describing strings before dispatch. The normalization happens host-side so the page-side code is platform-agnostic and console logs are immediately readable.

### Versioning

- The SDK validates `schemaVersion === 1` and discards anything else.
- To evolve the payload non-trivially, **bump `schemaVersion`** and keep
  the old shape live until the SDK side adds support - never rewrite the
  v1 shape in place.

### How to listen from the page (sanity check)

```js
window.addEventListener('stream-video:host-audio-session', (event) => {
  console.log('host audio session:', event.detail);
});
```

If you see snapshots on the console after every `setCategory`,
`setActive`, route change or interruption, the bridge is wired
correctly.

## What the bridge must observe

Subscribe to **four** `NotificationCenter` notifications and re-snapshot
the session on each. Send an additional snapshot at startup so the page
has ground truth before any event fires.

The first two are the primary signal sources. The last two exist solely
to recover from the case where iOS does not deliver `.ended` after a
category-conflict interruption (see "When iOS does not deliver `.ended`"
below).

### 1. `AVAudioSession.interruptionNotification`

Fires when the system interrupts the session - phone call, Siri, alarm,
another app/session activating with a conflicting category, etc.

- **`AVAudioSessionInterruptionTypeKey`** → `.began` or `.ended`. Map to
  `'began'` / `'ended'` strings in the payload.
- **`AVAudioSessionInterruptionReasonKey`** (iOS 14.5+) → integer reason
  code. Forward as `interruption.reason`. Optional - older iOS versions
  don't include it.
- **Stickiness:** once `.began` arrives, keep the snapshot at
  `interruption.type === 'began'` for every subsequent dispatch until
  an `.ended` arrives. The SDK relies on this to know the session is
  _still_ interrupted between events. Don't overwrite with `null` on
  unrelated dispatches. iOS does not always deliver `.ended`; see
  ["When iOS does not deliver `.ended`"](#when-ios-does-not-deliver-ended)
  below for the required recovery behavior.

### 2. `AVAudioSession.routeChangeNotification`

Fires whenever the audio route changes - headphones plugged/unplugged,
Bluetooth connect/disconnect, speaker override, _and_ any time the
category itself changes (`reason = .categoryChange`).

- **`AVAudioSessionRouteChangeReasonKey`** → integer reason code.
  Forward as `state.routeChangeReason`. The SDK uses this to detect
  category changes that don't surface as interruptions.

### 3. `AVAudioSession.silenceSecondaryAudioHintNotification`

Fires when the OS-level "another session should silence me" hint
flips. This is a recovery trigger only: the bridge clears a stale
`began` (see below) when this notification arrives with
`secondaryAudioShouldBeSilencedHint == false` and the session is
back on a record-capable category. No new `routeChange` field is
written from this handler - the snapshot still carries the most
recent route change observed.

### 4. `UIApplication.didBecomeActiveNotification`

Last-chance verification when the user returns to the app. iOS
coalesces or drops some notifications while the app is suspended,
so the bridge may have missed the terminal event for an
interruption that resolved in the background. Same recovery rules
as (3); fires once on every foreground transition.

### 5. Initial snapshot at startup

Dispatch one snapshot after the bridge starts (with `interruption: null`,
`routeChange: null`, but the current `session.category` / `session.mode` /
`session.options`). This gives the SDK ground truth at page load - useful
for the audio-health UI to show a healthy signal immediately rather than
waiting for the first event.

## When iOS does not deliver `.ended`

The "Stickiness" rule above keeps `interruption.type === 'began'` until
`.ended` arrives. iOS does not always deliver `.ended` for
category-conflict interruptions (another app activates `.playback`
exclusive, then goes away without the host running an explicit restore).
Without a recovery path the page would stay at
`host-audio-session-interrupted` forever even though audio is back.

Hosts implementing this contract MUST synthesize `.ended` (i.e., set
`latestInterruption = nil`, then dispatch a fresh snapshot) when **all**
of these are true:

1. `latestInterruption?.type == "began"`.
2. The current `audioSession.category` is record-capable -
   `.playAndRecord` or `.record`.
3. `audioSession.secondaryAudioShouldBeSilencedHint == false` (no
   conflicting session is currently asking us to be silenced).

Run the check on these triggers, in addition to dispatching on
interruption / route-change events:

- Every `routeChangeNotification`, regardless of `reason` - any of
  `.categoryChange`, `.override`, `.oldDeviceUnavailable`,
  `.routeConfigurationChange`, `.newDeviceAvailable` can correlate
  with the conflicting session releasing audio.
- Every `silenceSecondaryAudioHintNotification` (the hint flipping
  false directly indicates the conflict resolved).
- Every `UIApplication.didBecomeActiveNotification` (recovery for
  events the OS dropped while the app was suspended).

To avoid noise, only dispatch a fresh snapshot from the hint and
foreground triggers if the helper actually cleared a stale `began`.
Route-change handlers always dispatch (the route change itself is
worth surfacing).

The SDK reducer treats absence of `interruption` (or
`interruption: null`) as the terminal signal. Sending a fresh
snapshot with `interruption` cleared is sufficient - no other
side-effects on the bridge are required.

## Required supporting setup

The bridge alone won't get audio working. Make sure your host also has:

- `NSMicrophoneUsageDescription` and `NSCameraUsageDescription` in
  `Info.plist` with meaningful copy.
- `UIBackgroundModes` includes `audio` if you need playback while
  backgrounded.
- `WKWebViewConfiguration` configured for inline media:
  ```swift
  config.allowsInlineMediaPlayback = true
  config.mediaTypesRequiringUserActionForPlayback = []
  ```
- A `WKUIDelegate` that auto-grants media-capture permissions:
  ```swift
  func webView(_ webView: WKWebView,
               requestMediaCapturePermissionFor origin: WKSecurityOrigin,
               initiatedByFrame frame: WKFrameInfo,
               type: WKMediaCaptureType,
               decisionHandler: @escaping (WKPermissionDecision) -> Void) {
    decisionHandler(.grant)
  }
  ```

See
[`PermissionCoordinator.swift`](./IOSWebView/WebView/PermissionCoordinator.swift)
for a reference implementation of the permission delegate.

---

## UIKit reference implementation

Drop-in minimal version of the bridge. The sample's
[`AudioSessionBridge.swift`](./IOSWebView/WebView/AudioSessionBridge.swift)
adds a few sample-app-only extras on top of this skeleton: a Combine
`snapshotPublisher` so the SwiftUI debug overlay can mirror native
transitions, DI-friendly init parameters (`audioSession`,
`notificationCenter`) for unit tests, `Equatable` conformance on the
snapshot types, and `JSONEncoder.outputFormatting = .withoutEscapingSlashes`
for readable console payloads. None of those are required for a host
integration - the version below is everything the SDK needs.

```swift
import AVFoundation
import Combine
import Foundation
import UIKit
import WebKit

final class AudioSessionBridge: @unchecked Sendable {
    struct Snapshot: Encodable {
        let schemaVersion: Int
        let timestamp: Int64
        let session: Session
        let interruption: Interruption?
        let routeChange: RouteChange?

        struct Session: Encodable {
            let category: String
            let mode: String
            let options: [String]
        }

        struct Interruption: Encodable {
            let type: String  // "began" | "ended"
            let reason: String?
        }

        struct RouteChange: Encodable {
            let reason: String
        }
    }

    private weak var webView: WKWebView?
    private let audioSession = AVAudioSession.sharedInstance()
    private let notificationCenter = NotificationCenter.default
    private var cancellables = Set<AnyCancellable>()
    private var latestInterruption: Snapshot.Interruption?
    private var latestRouteChange: Snapshot.RouteChange?
    private var started = false
    private let processingQueue = DispatchQueue(label: "com.streamvideo.audioSessionObserver")
    private let encoder = JSONEncoder()

    init(webView: WKWebView) { self.webView = webView }
    deinit { stop() }

    func start() {
        guard !started else { return }
        started = true

        notificationCenter.publisher(for: AVAudioSession.interruptionNotification)
            .receive(on: processingQueue)
            .sink { [weak self] in self?.handleInterruption($0) }
            .store(in: &cancellables)

        notificationCenter.publisher(for: AVAudioSession.routeChangeNotification)
            .receive(on: processingQueue)
            .sink { [weak self] in self?.handleRouteChange($0) }
            .store(in: &cancellables)

        // Recovery triggers: see `clearStaleInterruptionIfRecovered()`.
        notificationCenter.publisher(for: AVAudioSession.silenceSecondaryAudioHintNotification)
            .receive(on: processingQueue)
            .sink { [weak self] _ in self?.handleSecondaryAudioHintChange() }
            .store(in: &cancellables)

        notificationCenter.publisher(for: UIApplication.didBecomeActiveNotification)
            .receive(on: processingQueue)
            .sink { [weak self] _ in self?.handleAppDidBecomeActive() }
            .store(in: &cancellables)

        // Initial snapshot - gives the SDK ground truth at page load,
        // before any interruption or route-change event happens.
        dispatch()
    }

    func stop() {
        guard started else { return }
        started = false
        cancellables.forEach { $0.cancel() }
        cancellables.removeAll()
        latestInterruption = nil
        latestRouteChange = nil
    }

    // MARK: handlers

    private func handleInterruption(_ note: Notification) {
        guard
            let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
            let type = AVAudioSession.InterruptionType(rawValue: raw)
        else { return }

        let typeString: String
        switch type {
        case .began: typeString = "began"
        case .ended: typeString = "ended"
        @unknown default: return
        }

        var reasonString: String?
        if #available(iOS 14.5, *),
           let raw = note.userInfo?[AVAudioSessionInterruptionReasonKey] as? UInt,
           let reason = AVAudioSession.InterruptionReason(rawValue: raw) {
            reasonString = Self.describe(interruptionReason: reason)
        }

        latestInterruption = .init(type: typeString, reason: reasonString)
        dispatch()
    }

    private func handleRouteChange(_ note: Notification) {
        guard
            let raw = note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
            let reason = AVAudioSession.RouteChangeReason(rawValue: raw)
        else { return }
        latestRouteChange = .init(reason: Self.describe(routeChangeReason: reason))
        _ = clearStaleInterruptionIfRecovered()
        dispatch()
    }

    private func handleSecondaryAudioHintChange() {
        // Dispatch only if this resolves a stale `began`, to avoid
        // spamming the page on healthy hint flips.
        guard clearStaleInterruptionIfRecovered() else { return }
        dispatch()
    }

    private func handleAppDidBecomeActive() {
        // Last-chance verification when the user returns to the app.
        guard clearStaleInterruptionIfRecovered() else { return }
        dispatch()
    }

    /// Synthesizes `interruption.ended` when the audio session is
    /// observably back: category is record-capable AND no secondary
    /// session asks us to be silenced. Returns `true` if the stale
    /// `began` was cleared so callers can decide whether to dispatch.
    @discardableResult
    private func clearStaleInterruptionIfRecovered() -> Bool {
        guard latestInterruption?.type == "began" else { return false }
        let category = audioSession.category
        guard category == .playAndRecord || category == .record else { return false }
        guard !audioSession.secondaryAudioShouldBeSilencedHint else { return false }
        latestInterruption = .init(type: "ended", reason: nil)
        return true
    }

    // MARK: dispatch

    private func dispatch() {
        let snapshot = Snapshot(
            schemaVersion: 1,
            timestamp: Int64(Date().timeIntervalSince1970 * 1000),
            session: .init(
                category: Self.describe(category: audioSession.category),
                mode: Self.describe(mode: audioSession.mode),
                options: Self.describe(options: audioSession.categoryOptions)
            ),
            interruption: latestInterruption,
            routeChange: latestRouteChange
        )
        guard let webView,
              let data = try? encoder.encode(snapshot),
              let json = String(data: data, encoding: .utf8) else { return }

        let script = """
        window.dispatchEvent(new CustomEvent('stream-video:host-audio-session', { detail: \(json) }));
        """

        Task { @MainActor [weak webView] in
            try await webView?.evaluateJavaScript(script)
        }
    }

    // MARK: string mappers
    //
    // Switch-based for predictability: a `default` fallback to the raw
    // value means an Apple-added enum case still produces a sensible
    // string instead of dropping the snapshot.

    private static func describe(category: AVAudioSession.Category) -> String {
        switch category {
        case .ambient: return "ambient"
        case .soloAmbient: return "soloAmbient"
        case .playback: return "playback"
        case .record: return "record"
        case .playAndRecord: return "playAndRecord"
        case .multiRoute: return "multiRoute"
        default: return category.rawValue
        }
    }

    private static func describe(mode: AVAudioSession.Mode) -> String {
        switch mode {
        case .default: return "default"
        case .voiceChat: return "voiceChat"
        case .gameChat: return "gameChat"
        case .videoRecording: return "videoRecording"
        case .measurement: return "measurement"
        case .moviePlayback: return "moviePlayback"
        case .videoChat: return "videoChat"
        case .spokenAudio: return "spokenAudio"
        case .voicePrompt: return "voicePrompt"
        default: return mode.rawValue
        }
    }

    private static func describe(options: AVAudioSession.CategoryOptions) -> [String] {
        var parts: [String] = []
        if options.contains(.mixWithOthers) { parts.append("mixWithOthers") }
        if options.contains(.duckOthers) { parts.append("duckOthers") }
        if options.contains(.allowBluetoothA2DP) { parts.append("allowBluetoothA2DP") }
        if options.contains(.allowAirPlay) { parts.append("allowAirPlay") }
        if options.contains(.defaultToSpeaker) { parts.append("defaultToSpeaker") }
        if options.contains(.interruptSpokenAudioAndMixWithOthers) {
            parts.append("interruptSpokenAudioAndMixWithOthers")
        }
        if #available(iOS 14.5, *),
           options.contains(.overrideMutedMicrophoneInterruption) {
            parts.append("overrideMutedMicrophoneInterruption")
        }
        // `.allowBluetoothHFP` is iOS 17+; the same bit on earlier iOS is
        // exposed as the deprecated `.allowBluetooth`. We always emit the
        // new name; check the bit directly to silence the deprecation.
        let bluetoothHFPBit = AVAudioSession.CategoryOptions(rawValue: 1 << 2)
        if options.contains(bluetoothHFPBit) { parts.append("allowBluetoothHFP") }
        return parts
    }

    @available(iOS 14.5, *)
    private static func describe(
        interruptionReason reason: AVAudioSession.InterruptionReason
    ) -> String {
        switch reason {
        case .default: return "default"
        case .appWasSuspended: return "appWasSuspended"
        case .builtInMicMuted: return "builtInMicMuted"
        case .routeDisconnected: return "routeDisconnected"
        @unknown default: return "default"
        }
    }

    private static func describe(
        routeChangeReason reason: AVAudioSession.RouteChangeReason
    ) -> String {
        switch reason {
        case .unknown: return "unknown"
        case .newDeviceAvailable: return "newDeviceAvailable"
        case .oldDeviceUnavailable: return "oldDeviceUnavailable"
        case .categoryChange: return "categoryChange"
        case .override: return "override"
        case .wakeFromSleep: return "wakeFromSleep"
        case .noSuitableRouteForCategory: return "noSuitableRouteForCategory"
        case .routeConfigurationChange: return "routeConfigurationChange"
        @unknown default: return "unknown"
        }
    }
}
```

### Wiring into a UIKit view controller

The sample app itself is SwiftUI-only (see the next section), but for
hosts that embed the WebView in a UIKit view controller, the wiring is:

```swift
final class WebViewController: UIViewController {
    private var webView: WKWebView!
    private var audioBridge: AudioSessionBridge?

    override func viewDidLoad() {
        super.viewDidLoad()
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.uiDelegate = permissionCoordinator
        view.addSubview(webView)

        let bridge = AudioSessionBridge(webView: webView)
        bridge.start()
        self.audioBridge = bridge

        webView.load(URLRequest(url: URL(string: "https://your.app/")!))
    }

    deinit { audioBridge?.stop() }
}
```

---

## SwiftUI reference implementation

`WKWebView` isn't natively SwiftUI - wrap it in a `UIViewRepresentable`.
The sample app's pattern (and the recommended one) is to hold the
`WKWebView` and the bridges in an `ObservableObject` controller owned
by the parent view as a `@StateObject`. That keeps the same `WKWebView`
instance alive across SwiftUI body re-evaluations and gives the bridge
a stable lifetime.

See [`WebViewRepresentable.swift`](./IOSWebView/WebView/WebViewRepresentable.swift)
for the version used by the sample (which also wires a debug-overlay
log subscriber via `snapshotPublisher`). A minimal host-only version
looks like:

```swift
import AVFoundation
import Combine
import SwiftUI
import WebKit

/// Owns the WKWebView and the audio bridge. Held by the parent view as
/// `@StateObject` so the same WKWebView survives SwiftUI body
/// re-evaluations and the bridge's lifetime tracks the view.
final class WebController: ObservableObject {
    let webView: WKWebView
    let permissionCoordinator = PermissionCoordinator()
    private var audioBridge: AudioSessionBridge?

    init() {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let wv = WKWebView(frame: .zero, configuration: config)
        wv.uiDelegate = permissionCoordinator
        self.webView = wv

        let bridge = AudioSessionBridge(webView: wv)
        bridge.start()
        self.audioBridge = bridge
    }

    deinit { audioBridge?.stop() }

    func load(_ url: URL) { webView.load(URLRequest(url: url)) }
}

/// Auto-grants mic/camera so the SDK's getUserMedia call succeeds without
/// the WebKit-internal permission prompt firing.
final class PermissionCoordinator: NSObject, WKUIDelegate {
    func webView(_ webView: WKWebView,
                 requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo,
                 type: WKMediaCaptureType,
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        decisionHandler(.grant)
    }
}

struct WebViewRepresentable: UIViewRepresentable {
    let controller: WebController

    func makeUIView(context: Context) -> WKWebView { controller.webView }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup { ContentView() }
    }
}

struct ContentView: View {
    @StateObject private var web = WebController()

    var body: some View {
        WebViewRepresentable(controller: web)
            .ignoresSafeArea()
            .onAppear { web.load(URL(string: "https://your.app/")!) }
    }
}
```

The bridge code (`AudioSessionBridge` class) is the same in both
hosting styles - copy it verbatim. The only thing that changes is
_who owns the bridge_: a `UIViewController` in UIKit, an
`ObservableObject` controller (held as `@StateObject`) in SwiftUI.

---

## Verifying with the SDK

The React SDK's `AudioHealthMonitor` consumes the event automatically.
You can observe it through `useAudioHealth()` in any component below
`<StreamCall>`:

```tsx
import { useCallStateHooks } from '@stream-io/video-react-sdk';

const AudioHealthLog = () => {
  const { useAudioHealth } = useCallStateHooks();
  const { status, reason } = useAudioHealth();
  useEffect(() => {
    console.info('audioHealth →', status, reason);
  }, [status, reason]);
  return null;
};
```

While the bridge is wired, you should see reasons that include:

- `host-audio-session-active` - bridge has emitted a snapshot, no
  current interruption. Healthy.
- `host-audio-session-interrupted` - most recent snapshot has
  `interruption.type === 'began'` without a matching `.ended`.
  Unhealthy. Highest priority of any health reason.

Both win over the W3C-level reasons (`audio-session-interrupted`,
`audio-context-interrupted`, …) because the native observer sees
transitions WebKit silently ignores.

If you don't see any `host-audio-session-*` reason after the page
loads, the bridge isn't reaching the SDK. Common causes:

- Bridge `start()` never called, or called before the page navigates.
- `evaluateJavaScript` running on a non-main thread (the snippet above
  hops to `@MainActor` via `Task { @MainActor in try await … }` to
  guarantee main-thread delivery).
- Page-side error swallowed the `dispatchEvent` call - check the
  WebView's console.

---

## Recovering from host-initiated interruptions

The bridge subscribes to exactly two `NotificationCenter` events:
`AVAudioSession.interruptionNotification` and
`AVAudioSession.routeChangeNotification`. That covers most things iOS
posts on its own, but **not every state mutation triggers one of them**.
In particular, after a host self-restore the bridge can stay silent:

- `setActive(false, .notifyOthersOnDeactivation)` notifies _other_
  processes' sessions; it does not post `.ended` on the same-process
  session.
- `setActive(true)` is silent.
- `setMode()` alone may post a `routeChangeNotification(.routeConfigurationChange)`
  but is not guaranteed across iOS versions.
- `setCategory()` to a new value should post
  `routeChangeNotification(.categoryChange)`, but iOS sometimes
  coalesces it with the prior `.began` or skips it entirely if the
  underlying routing graph didn't change.

The practical result: a host that runs the documented 3-step restore
(`setActive(false, .notifyOthersOnDeactivation)` ->
`setCategory(.playAndRecord, ...)` -> `setActive(true)`) often finishes
with the bridge's `latestInterruption` still set to `began`, and the
page stuck at `host-audio-session-interrupted` even though the session
is healthy. The bridge has nothing new to dispatch because it never
saw an event.

### Make the recovery deterministic: synthesize `.ended`

After a successful self-restore, post
`AVAudioSession.interruptionNotification` with
`interruptionType = .ended` and
`interruptionOption = .shouldResume` to the local
`NotificationCenter`. Every in-process observer (the bridge, WebKit's
`RTCAudioSession`, anything else listening) treats it as a normal
end-of-interruption. Because the session is already in
`.playAndRecord/.videoChat + active=true` at this point, no observer's
reactivation path has anything left to do; the only practical effect
is that the bridge runs `handleInterruption`, sets `latestInterruption`
to `ended`, and dispatches a fresh snapshot.

```swift
/// Call at the end of every successful host-initiated restore (3-step
/// pattern, AVAudioPlayerDelegate finish, ringtone-finish, etc).
func synthesizeInterruptionEnded() {
    let info: [AnyHashable: Any] = [
        AVAudioSessionInterruptionTypeKey:
            AVAudioSession.InterruptionType.ended.rawValue,
        AVAudioSessionInterruptionOptionKey:
            AVAudioSession.InterruptionOptions.shouldResume.rawValue,
    ]
    NotificationCenter.default.post(
        name: AVAudioSession.interruptionNotification,
        object: AVAudioSession.sharedInstance(),
        userInfo: info)
}
```

The reference implementation lives in
[`AudioScenarios.swift`](./IOSWebView/Scenarios/AudioScenarios.swift):
both `restoreForWebRTC()` and `handleAutoRestoreDingFinished()` (the
`AVAudioPlayerDelegate` finish handler for the auto-restoring ding)
run the 3-step and then call `synthesizeInterruptionEnded()`. A
sibling scenario, `handleNoRestoreDingFinished()`, deliberately omits
both the re-set to `.playAndRecord` and the synthesize call so the
"Play ding (exclusive, NO restore)" menu entry can demonstrate the
bridge's belt-and-suspenders recovery triggers (route-change,
secondary-audio hint flip, foreground) clearing the stale `began` on
their own.

> ⚠️ Only synthesize `.ended` when **you** know the session is back to
> a WebRTC-friendly state. Posting it speculatively (without actually
> running the 3-step first) lies to the bridge and any other observer.

### Belt-and-suspenders inside the bridge

Some recovery paths are not under your control: a third-party SDK
might do its own session work and never call your synthesize helper,
or the conflicting session may simply go away without an in-app
trigger. The reference bridge therefore runs
`clearStaleInterruptionIfRecovered()` from three additional triggers
(see ["When iOS does not deliver `.ended`"](#when-ios-does-not-deliver-ended)
above): every route-change regardless of `reason`, every
`silenceSecondaryAudioHintNotification`, and every
`UIApplication.didBecomeActiveNotification`. Together these cover the
common OS-driven recoveries; the explicit `synthesizeInterruptionEnded()`
call above covers the cases where you control the restore yourself.

---

## Common pitfalls

| Symptom                                                                | Likely cause                                                                                                                                             | Fix                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audioHealth` stuck at `host-audio-session-interrupted` after recovery | Bridge received `.began` but iOS never posted a matching `.ended`, and `setCategory(.playAndRecord, ...)` doesn't reliably fire `.categoryChange` either | Run the 3-step restore (`setActive(false, .notifyOthersOnDeactivation)` → `setCategory(.playAndRecord, ...)` → `setActive(true)`) and synthesize `.ended` afterward via `NotificationCenter.default.post(...interruptionNotification, ...)`. See [Recovering from host-initiated interruptions](#recovering-from-host-initiated-interruptions). |
| No events firing at all                                                | Listener attached before page loaded                                                                                                                     | Attach the page-side listener inside the React app (the SDK does this automatically); native bridge dispatch queues the JS until the page is ready.                                                                                                                                                                                             |
| Events fire but `audioHealth` doesn't react                            | Wrong event name or `schemaVersion !== 1`                                                                                                                | Use exactly `'stream-video:host-audio-session'` and `schemaVersion: 1`. The SDK silently drops anything else.                                                                                                                                                                                                                                   |
| Bridge crashes after webview teardown                                  | Strong reference to the WebView                                                                                                                          | Always `weak var webView` + remove observers in `deinit` or a `stop()` method called from the owning view controller / coordinator.                                                                                                                                                                                                             |
| Interruption reason is missing on iOS < 14.5                           | `AVAudioSessionInterruptionReasonKey` wasn't added until iOS 14.5                                                                                        | Gate the read behind `#available(iOS 14.5, *)`; the field is optional in the payload.                                                                                                                                                                                                                                                           |

## References

- [`AUDIO-SESSIONS.md`](./AUDIO-SESSIONS.md) - conceptual model + host-app guidance.
- [`AudioSessionBridge.swift`](./IOSWebView/WebView/AudioSessionBridge.swift) - reference implementation in the sample app.
- [`LifecycleBridge.swift`](./IOSWebView/WebView/LifecycleBridge.swift) - companion bridge for UIApplication transitions, separate event (`stream-video:host-lifecycle`).
- Apple - [Configuring the audio session](https://developer.apple.com/documentation/avfaudio/avaudiosession), [Responding to audio interruptions](https://developer.apple.com/documentation/avfaudio/avaudiosession/responding_to_audio_interruptions).
