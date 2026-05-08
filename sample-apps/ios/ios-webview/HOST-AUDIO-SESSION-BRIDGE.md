# Host audio-session bridge - iOS integration

The two extension files in this sample turn a `WKWebView` into a host
bridge that forwards iOS `AVAudioSession` ground truth into the page.
The Stream React Video SDK's `AudioHealthMonitor` consumes the events
to surface accurate interruption signals (phone calls, Siri, ad SDKs,
conflicting audio sessions) that the W3C-level audio events don't
reliably catch.

> 📘 For the conceptual model - who owns `AVAudioSession`, what a host
> should and shouldn't do - see [`AUDIO-SESSIONS.md`](./AUDIO-SESSIONS.md).
> This file covers integration only.

## What the extensions do

- [`WKWebView+Observaton.swift`](./IOSWebView/WKWebView+Extensions/WKWebView+Observaton.swift)
  adds `WKWebView.configureObservation()`. It attaches an audio-session
  observer to the `WKWebView` via Objective-C associated objects, so the
  observer's lifetime tracks the `WKWebView`. The observer subscribes to
  every relevant `AVAudioSession` notification (interruption, route
  change, media-services reset, secondary-audio hint), to
  `UIApplication.didBecomeActive`, and to a self-disarming 1s recovery
  timer. On each event it builds a normalized snapshot and dispatches it
  to the page as a `stream-video:host-audio-session` `CustomEvent` on
  `window`.

- [`AVAudioSession+Observer.swift`](./IOSWebView/WebView/AVAudioSession+Observer.swift)
  is a companion `AVAudioSession.Snapshot` value type plus a 250 ms
  polling observer the sample uses for diagnostic logging. Drop it if
  you don't need the diagnostics; the page-side bridge contract doesn't
  depend on it.

## Integration

1. Copy the two files into your iOS host project.

2. Call `configureObservation()` once, after you build your `WKWebView`:

   ```swift
   let wv = WKWebView(frame: .zero, configuration: config)
   wv.uiDelegate = permissionCoordinator
   wv.navigationDelegate = navigationInterceptor
   wv.configureObservation()  // attaches the audio-session observer
   ```

   No `start()` / `stop()` and no retain - the observer is held by the
   `WKWebView` and goes away with it.

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

The bridge fires exactly one event on `window`:

```
stream-video:host-audio-session
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

If your host code runs its own 3-step restore -
`setActive(false, .notifyOthersOnDeactivation)` →
`setCategory(.playAndRecord, ...)` → `setActive(true)` - iOS often does
not post `.ended` for it, leaving the bridge stuck on `began`.
Synthesize one yourself afterward so every in-process observer (the
bridge included) sees the recovery:

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

- [`AUDIO-SESSIONS.md`](./AUDIO-SESSIONS.md) - conceptual model and host-app guidance.
- [`WKWebView+Observaton.swift`](./IOSWebView/WKWebView+Extensions/WKWebView+Observaton.swift) - observer implementation, including the recovery logic and the string mappers.
- Apple - [AVAudioSession](https://developer.apple.com/documentation/avfaudio/avaudiosession), [Responding to audio interruptions](https://developer.apple.com/documentation/avfaudio/avaudiosession/responding_to_audio_interruptions).
