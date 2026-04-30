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

Subscribe to **two** `NotificationCenter` notifications and re-snapshot
the session on each. Send an additional snapshot at startup so the page
has ground truth before any event fires.

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
  unrelated dispatches.

### 2. `AVAudioSession.routeChangeNotification`

Fires whenever the audio route changes - headphones plugged/unplugged,
Bluetooth connect/disconnect, speaker override, _and_ any time the
category itself changes (`reason = .categoryChange`).

- **`AVAudioSessionRouteChangeReasonKey`** → integer reason code.
  Forward as `state.routeChangeReason`. The SDK uses this to detect
  category changes that don't surface as interruptions.

### 3. Initial snapshot at startup

Dispatch one snapshot after the bridge starts (with `interruption: null`,
`routeChange: null`, but the current `session.category` / `session.mode` /
`session.options`). This gives the SDK ground truth at page load - useful
for the audio-health UI to show a healthy signal immediately rather than
waiting for the first event.

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

Drop-in. Mirrors
[`AudioSessionBridge.swift`](./IOSWebView/WebView/AudioSessionBridge.swift)
in the sample.

```swift
import AVFoundation
import Combine
import Foundation
import WebKit

final class AudioSessionBridge {
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

    init(webView: WKWebView) { self.webView = webView }
    deinit { stop() }

    func start() {
        guard !started else { return }
        started = true

        notificationCenter.publisher(for: AVAudioSession.interruptionNotification)
            .sink { [weak self] in self?.handleInterruption($0) }
            .store(in: &cancellables)

        notificationCenter.publisher(for: AVAudioSession.routeChangeNotification)
            .sink { [weak self] in self?.handleRouteChange($0) }
            .store(in: &cancellables)

        // Initial snapshot - gives the SDK ground truth at page load,
        // before any interruption or route-change event happens.
        dispatch()
    }

    func stop() {
        guard started else { return }
        started = false
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
        dispatch()
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
              let data = try? JSONEncoder().encode(snapshot),
              let json = String(data: data, encoding: .utf8) else { return }

        let script = """
        window.dispatchEvent(new CustomEvent('stream-video:host-audio-session', { detail: \(json) }));
        """
        DispatchQueue.main.async { [weak webView] in
            webView?.evaluateJavaScript(script, completionHandler: nil)
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
The bridge lifecycle is owned by the `Coordinator`, which is created
once per representable instance and torn down with the view.

```swift
import AVFoundation
import Combine
import SwiftUI
import WebKit

struct WebView: UIViewRepresentable {
    let url: URL

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.uiDelegate = context.coordinator

        // Start the bridge once we have the WKWebView.
        context.coordinator.startAudioBridge(on: webView)

        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        // No reactive props in this minimal example. Pass new URLs / state
        // through here if you need to drive the WebView from SwiftUI state.
    }

    /// Owns the bridge so its lifetime tracks the SwiftUI view.
    final class Coordinator: NSObject, WKUIDelegate {
        private var audioBridge: AudioSessionBridge?

        func startAudioBridge(on webView: WKWebView) {
            let bridge = AudioSessionBridge(webView: webView)
            bridge.start()
            self.audioBridge = bridge
        }

        deinit { audioBridge?.stop() }

        // Auto-grant mic/camera so the SDK's getUserMedia call succeeds.
        func webView(_ webView: WKWebView,
                     requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                     initiatedByFrame frame: WKFrameInfo,
                     type: WKMediaCaptureType,
                     decisionHandler: @escaping (WKPermissionDecision) -> Void) {
            decisionHandler(.grant)
        }
    }
}

@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            WebView(url: URL(string: "https://your.app/")!)
                .ignoresSafeArea()
        }
    }
}
```

The bridge code (`AudioSessionBridge` class) is identical to the UIKit
version - copy it verbatim. The only thing that changes between hosting
styles is _who owns the bridge_: a UIViewController in UIKit, a
Coordinator in SwiftUI.

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
  hops to `DispatchQueue.main` to be safe).
- Page-side error swallowed the `dispatchEvent` call - check the
  WebView's console.

---

## Common pitfalls

| Symptom                                                                | Likely cause                                                                                                   | Fix                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audioHealth` stuck at `host-audio-session-interrupted` after recovery | Bridge received `.began` but iOS never posted a matching `.ended` (common for category-conflict interruptions) | Either restore the session yourself with the 3-step pattern (`setActive(false, .notifyOthersOnDeactivation)` → reset category → `setActive(true)`), or - if you control the bridge - clear `latestInterruption` when a `routeChangeNotification(reason: .categoryChange)` brings the category back to `.playAndRecord`. |
| No events firing at all                                                | Listener attached before page loaded                                                                           | Attach the page-side listener inside the React app (the SDK does this automatically); native bridge dispatch queues the JS until the page is ready.                                                                                                                                                                     |
| Events fire but `audioHealth` doesn't react                            | Wrong event name or `schemaVersion !== 1`                                                                      | Use exactly `'stream-video:host-audio-session'` and `schemaVersion: 1`. The SDK silently drops anything else.                                                                                                                                                                                                           |
| Bridge crashes after webview teardown                                  | Strong reference to the WebView                                                                                | Always `weak var webView` + remove observers in `deinit` or a `stop()` method called from the owning view controller / coordinator.                                                                                                                                                                                     |
| Interruption reason is missing on iOS < 14.5                           | `AVAudioSessionInterruptionReasonKey` wasn't added until iOS 14.5                                              | Gate the read behind `#available(iOS 14.5, *)`; the field is optional in the payload.                                                                                                                                                                                                                                   |

## References

- [`AUDIO-SESSIONS.md`](./AUDIO-SESSIONS.md) - conceptual model + host-app guidance.
- [`AudioSessionBridge.swift`](./IOSWebView/WebView/AudioSessionBridge.swift) - reference implementation in the sample app.
- [`LifecycleBridge.swift`](./IOSWebView/WebView/LifecycleBridge.swift) - companion bridge for UIApplication transitions, separate event (`stream-video:host-lifecycle`).
- Apple - [Configuring the audio session](https://developer.apple.com/documentation/avfaudio/avaudiosession), [Responding to audio interruptions](https://developer.apple.com/documentation/avfaudio/avaudiosession/responding_to_audio_interruptions).
