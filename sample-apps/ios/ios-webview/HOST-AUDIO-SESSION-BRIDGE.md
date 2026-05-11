# Host audio-session bridge - iOS integration

The drop-in extension in this sample turns a `WKWebView` into a host
bridge that forwards iOS `AVAudioSession` ground truth into the page.
The Stream React Video SDK's `AudioHealthMonitor` consumes the events
to surface accurate interruption signals (phone calls, Siri, ad SDKs,
conflicting audio sessions) that the W3C-level audio events don't
reliably catch.

> 📘 For the conceptual model - who owns `AVAudioSession`, what a host
> should and shouldn't do - see [`AUDIO-SESSIONS.md`](./AUDIO-SESSIONS.md).
> This file covers integration only.

## What the extension does

- [`WKWebView+Observation.swift`](./IOSWebView/WKWebView+Extensions/WKWebView+Observation.swift)
  adds `WKWebView.configureStreamVideoHostBridge(configuration:)`. It attaches an audio-session
  observer to the `WKWebView` via Objective-C associated objects, so the
  observer's lifetime tracks the `WKWebView`. The observer subscribes to
  every relevant `AVAudioSession` notification (interruption, route
  change, media-services reset, secondary-audio hint), to app lifecycle
  notifications, and to short self-disarming polling windows around events
  that can hide `AVAudioSession` mutations. On each event it builds a
  normalized snapshot and dispatches it to the page as a
  `stream-video:host-audio-session` or `stream-video:host-lifecycle`
  `CustomEvent` on `window`.

## Integration

1. Copy `WKWebView+Observation.swift` into your iOS host project.

2. Call `configureStreamVideoHostBridge(configuration:)` once, after you build your `WKWebView`:

   ```swift
   let wv = WKWebView(frame: .zero, configuration: config)
   wv.uiDelegate = permissionCoordinator
   wv.navigationDelegate = navigationInterceptor
   wv.configureStreamVideoHostBridge()
   ```

   No `start()` / `stop()` and no retain - the observer is held by the
   `WKWebView` and goes away with it.

   Optional configuration makes side effects explicit:

   ```swift
   wv.configureStreamVideoHostBridge(
       configuration: .init(
           logsEnabled: true,
           setPrefersNoInterruptionsFromSystemAlerts: true,
           audioSessionPollingInterval: .milliseconds(250),
           stableAudioSessionPollingTicks: 4
       )
   )
   ```

3. Configure the `WKWebView` for inline media:

   ```swift
   config.allowsInlineMediaPlayback = true
   config.mediaTypesRequiringUserActionForPlayback = []
   ```

4. `Info.plist` requirements:
   - `NSMicrophoneUsageDescription` and `NSCameraUsageDescription` (required for `getUserMedia`).
   - `UIBackgroundModes` containing `audio` (and `voip` if you do calls,
     `processing` so the recovery timer keeps ticking briefly while the
     app is suspended).

5. Provide a `WKUIDelegate` that grants media-capture permissions. See
   [`PermissionCoordinator.swift`](./IOSWebView/WebView/PermissionCoordinator.swift)
   for a reference implementation.

That's the host side. The SDK wires the page-side listener automatically.

## Page-side event contract

The bridge fires these events on `window`:

```
stream-video:host-audio-session
stream-video:host-lifecycle
```

Payload, TypeScript schema:

```ts
interface HostAudioSessionEvent {
  schemaVersion: 1; // SDK drops anything else
  timestamp: number; // epoch ms
  session: {
    category:
      | 'ambient'
      | 'soloAmbient'
      | 'playback'
      | 'record'
      | 'playAndRecord'
      | 'multiRoute';
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
    options: string[]; // mixWithOthers, allowBluetoothHFP, defaultToSpeaker, ...
  };
  interruption: { type: 'began' | 'ended'; reason: string | null } | null;
  routeChange: { reason: string } | null;
  route?: {
    inputs: Array<{ name: string; type: string }>;
    outputs: Array<{ name: string; type: string }>;
  };
}
```

Once `interruption.type === 'began'` arrives, the snapshot stays sticky
on `began` until an `.ended` (real or synthesized by the recovery logic)
clears it. To bump the schema, increment `schemaVersion` and keep the
old shape live until the SDK side adds support.

Sanity-check from the page:

```js
window.addEventListener('stream-video:host-audio-session', (e) => {
  console.log(e.detail);
});
```

## Note: host-initiated session restore

## What the bridge must observe

Subscribe to the relevant `NotificationCenter` notifications and re-snapshot
the session on each.

The first two are the primary signal sources. The last three exist
solely to recover from the case where iOS does not deliver `.ended`
after a category-conflict interruption (see "When iOS does not deliver
`.ended`" below).

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

### 5. `AVAudioSession.mediaServicesWereResetNotification`

Fires when `mediaserverd` resets — coincides with WebKit's internal
`RTCAudioSession` reactivating its category after a category-conflict
interruption. WebKit's `setCategory(.playAndRecord, ...)` during that
reactivation does not always post `routeChangeNotification` the bridge
can observe, leaving the bridge stuck on `category=playback /
interruption=began` long after the session is observably back. This
notification fills the gap. Same recovery rules as (3); fires only on
actual media-services resets, so dispatching from it is safe.

### 6. Initial snapshot at startup

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
- Every `mediaServicesWereResetNotification` (covers WebKit's silent
  category reactivation, which `routeChangeNotification` does not
  always surface).
- A periodic 1s timer that arms while `latestInterruption?.type ==
"began"` and disarms on a successful clear or after a 30s budget.
  Final safety net for cases where none of the notification triggers
  above fire — the most common one observed in practice is WebKit's
  internal `RTCAudioSession` reactivation completing after every
  in-process notification has already been delivered, leaving the
  bridge sitting on `category=playback / began`.

To avoid noise, only dispatch a fresh snapshot from the hint,
foreground, and media-services-reset triggers if the helper actually
cleared a stale `began`. Route-change handlers always dispatch (the
route change itself is worth surfacing). The periodic timer is
self-disarming: it runs at most once per second for 30s and stops as
soon as the stale `began` clears, so it doesn't add ongoing wakeups.

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
[`WKWebView+Observation.swift`](./IOSWebView/WKWebView+Extensions/WKWebView+Observation.swift)
adds lifecycle forwarding and a few sample-app-only details on top of this
skeleton: DI-friendly init parameters (`audioSession`, `notificationCenter`)
for unit tests, `Equatable` conformance on the snapshot types, and
`JSONEncoder.outputFormatting = .withoutEscapingSlashes` for readable console
payloads. None of those are required for a host
integration - the version below is everything the SDK needs.

```swift
NotificationCenter.default.post(
    name: AVAudioSession.interruptionNotification,
    object: AVAudioSession.sharedInstance(),
    userInfo: [
        AVAudioSessionInterruptionTypeKey:
            AVAudioSession.InterruptionType.ended.rawValue,
        AVAudioSessionInterruptionOptionKey:
            AVAudioSession.InterruptionOptions.shouldResume.rawValue,
    ])
```

Only call this after the restore actually completed - posting it
speculatively misleads every observer. Reference:
[`AudioScenarios.swift::synthesizeInterruptionEnded()`](./IOSWebView/Scenarios/AudioScenarios.swift).

## References

- [`AUDIO-SESSIONS.md`](./AUDIO-SESSIONS.md) - conceptual model + host-app guidance.
- [`WKWebView+Observation.swift`](./IOSWebView/WKWebView+Extensions/WKWebView+Observation.swift) - reference implementation in the sample app.
- Apple - [Configuring the audio session](https://developer.apple.com/documentation/avfaudio/avaudiosession), [Responding to audio interruptions](https://developer.apple.com/documentation/avfaudio/avaudiosession/responding_to_audio_interruptions).
