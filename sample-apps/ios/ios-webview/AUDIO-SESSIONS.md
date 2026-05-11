# Audio sessions when embedding the React Video SDK in a WKWebView

A reference for anyone hosting the Stream React Video SDK inside a native iOS
app. Covers how iOS audio sessions interact with WebRTC inside `WKWebView`,
who owns what, the failure modes we've reproduced, and how to detect them
early.

## TL;DR

- iOS `AVAudioSession` is a **process-global singleton**. A `WKWebView` hosted
  inside a native app shares one session with the host - there is no
  isolation.
- When a native host changes the session (`setCategory`, `setMode`,
  `setActive`, `overrideOutputAudioPort`), it affects WebRTC audio inside the
  webview.
- The **host app owns the restore**. If it interrupts the session, it must
  hand it back with `setActive(false, options: .notifyOthersOnDeactivation)`.
- The web side can **detect** interruptions (`AudioContext.statechange`,
  `MediaStreamTrack.onmute`) but cannot **override** a native host still
  holding the session.
- A clean embedder uses `.mixWithOthers` whenever possible, uses `.voiceChat`
  / `.videoChat` modes for voice calls, and treats CallKit as the one
  legitimate "take over the audio" API.

## Primer - how iOS audio sessions work

Every iOS process has one audio session:

```swift
AVAudioSession.sharedInstance()
```

It has four knobs:

| Property                | What it controls                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `category`              | Coarse role: `playback`, `playAndRecord`, `ambient`, `soloAmbient`, `multiRoute`                                                     |
| `mode`                  | Fine tuning of routing + processing: `default`, `voiceChat`, `videoChat`, `gameChat`, `videoRecording`, `measurement`, `spokenAudio` |
| `categoryOptions`       | Flags: `mixWithOthers`, `duckOthers`, `allowBluetooth`, `allowBluetoothA2DP`, `allowAirPlay`, `defaultToSpeaker`, …                  |
| `setActive(_:options:)` | Whether the session is currently engaged                                                                                             |

WebKit, inside the webview, configures `playAndRecord` + `voiceChat` when
WebRTC needs both mic and speaker. As long as the host doesn't fight that
configuration, everything works.

## Why embedding WebRTC is tricky

Everything the host does flows through the same session:

1. **Direct calls** - `session.setCategory(.playback)` reconfigures _the_
   session, not a per-webview session. WebRTC sees it immediately.
2. **Transitive claims** - `AVAudioPlayer`, `AVAudioRecorder`,
   `AVSpeechSynthesizer`, `AVPlayer`, `CallKit`, and more will call
   `setCategory` / `setActive` on the host's behalf. The host didn't write
   the offending line; a dependency did.
3. **System events** - phone calls, Siri, alarms, AirPods handoff - all
   interrupt the session whether or not the host code does anything wrong.

## Responsibility split

| Side                | Responsibility                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Host native app** | Coordinate with embedded WebRTC. Restore the session after any interruption it initiates. Audit dependencies. |
| **SDK / web app**   | Detect interruptions. Recover opportunistically once the session is free again. Surface diagnostics.          |
| **Both**            | Emit correlated timestamped logs so a support engineer can line up cause and effect.                          |

## What the host app should do

### Prefer mixing over exclusivity

For ambient sounds, notification chimes, UI feedback - anything that doesn't
require silencing WebRTC - use a category that mixes:

```swift
func playChime(url: URL) throws {
  let s = AVAudioSession.sharedInstance()
  try s.setCategory(.ambient, options: [.mixWithOthers])
  try s.setActive(true)
  let player = try AVAudioPlayer(contentsOf: url)
  player.play()
  // No explicit restore needed - .ambient + .mixWithOthers doesn't interrupt.
}
```

### If you must play exclusively, restore afterward

For sounds that genuinely need to silence WebRTC (e.g., a full-screen native
ringtone UI), you must tell the OS your work is done **and** put the
session back into the configuration WebRTC wants:

```swift
final class Chime: NSObject, AVAudioPlayerDelegate {
  func play(url: URL) throws {
    let s = AVAudioSession.sharedInstance()
    try s.setCategory(.playback, options: [])   // exclusive
    try s.setActive(true)
    player = try AVAudioPlayer(contentsOf: url)
    player?.delegate = self
    player?.play()
  }

  func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully: Bool) {
    // All three lines matter when embedding WebRTC. See the note below.
    let s = AVAudioSession.sharedInstance()
    try? s.setActive(false, options: [.notifyOthersOnDeactivation])
    try? s.setCategory(.playAndRecord,
                       mode: .videoChat,
                       options: [.allowBluetoothHFP, .allowBluetoothA2DP, .defaultToSpeaker])
    try? s.setActive(true)
  }
}
```

#### Why the single `setActive(false)` isn't enough for embedded WebRTC

Outside a `WKWebView` you'll see guidance that
`setActive(false, options: .notifyOthersOnDeactivation)` is sufficient -
it's what fires `AVAudioSession.interruptionNotification(.ended +
.shouldResume)` to whoever was interrupted. In the WKWebView case that
**isn't reliable**:

- iOS frequently only posts `interruption=began` to other sessions for
  category-conflict interruptions and never delivers a matching `.ended`.
  Reproducible from `ios-webview`'s **Play ding (exclusive,
  auto-restore)** scenario - the bridge sees `.began` from the
  `setCategory(.playback)` claim but no `.ended` after the deactivation.
- `setActive(false)` does not change the session category. So even if
  the session is deactivated, `AVAudioSession.category` stays at
  `.playback`. WKWebView's `RTCAudioSession` is conservative and does
  _not_ re-assert `.playAndRecord` on its own without the `.ended`
  trigger above, so audio stays dead.

The pattern that recovers reliably is the 3-step explicit restore
above: release with `.notifyOthersOnDeactivation`, set the category back
to `.playAndRecord/.videoChat` with the WebRTC-friendly options, and
reactivate. The `restoreForWebRTC()` action and the **Play ding
(exclusive, auto-restore)** scenario in `ios-webview` both use this
exact sequence.

If the host can't run the 3-step restore (e.g., the conflicting session
goes away on its own without an in-app trigger), the bridge itself
recovers the page-side health signal by synthesizing
`interruption.ended` once the audio session is observably back. See
[`HOST-AUDIO-SESSION-BRIDGE.md`](./HOST-AUDIO-SESSION-BRIDGE.md) for the
integration contract and
[`WKWebView+Observation.swift`](./IOSWebView/WKWebView+Extensions/WKWebView+Observation.swift)
for the recovery logic.

> 🧪 The `ios-webview` sample exposes both variants side-by-side as
> scenarios so you can see the difference in `audioHealth$` live:
> **Play ding (exclusive)** clobbers the session and never releases
> (audio stays dead, bridge stuck at `interruption=began`, until you tap
> **Restore audio (native)**); **Play ding (exclusive, auto-restore)**
> runs the 3-step from the delegate above, and `audioHealth$` recovers
> when the ding finishes.

### Use CallKit correctly

CallKit is the one legitimate "take over the audio" API. It's the right tool
when you actually have an incoming call.

```swift
// Good - real incoming VoIP call
provider.reportNewIncomingCall(with: uuid, update: update) { ... }
// CallKit handles session activation / deactivation cleanly.

// Bad - using CallKit for UI-state calls (voicemail, tutorials, reminders)
// This hijacks audio for the duration of the "call" and often misbehaves.
```

### Match WebRTC's expected configuration

When the host does need `.playAndRecord`, match what WebRTC uses:

```swift
try session.setCategory(
  .playAndRecord,
  mode: .voiceChat,     // critical - enables AEC, AGC, NS
  options: [.allowBluetooth, .allowBluetoothA2DP, .defaultToSpeaker]
)
```

`mode: .default` on a `.playAndRecord` session _disables_ echo cancellation
and automatic gain control. Symptoms: echo, loud clipped audio, feedback
loops. Always use `.voiceChat` or `.videoChat` for voice.

### Audit your dependencies

Grep your source tree:

```sh
# Direct audio-session calls
rg -n 'AVAudioSession|setCategory|setActive|overrideOutputAudioPort|setMode\(' Sources/

# APIs that transitively touch the session
rg -n 'AVAudioPlayer|AVAudioRecorder|AVAudioEngine|AVSpeechSynthesizer|CXProvider|UNNotificationSound|ReplayKit' Sources/

# Third-party SDKs known to claim audio
rg -n 'GADMobileAds|FBAdSettings|AppLovinSDK|AVPlayerViewController|SPTSession' Podfile Package.resolved
```

Common offenders:

- **Ad SDKs** - AdMob, Meta Audience, AppLovin video ads claim audio during
  playback.
- **Video player SDKs** - Brightcove, JW Player, Bitmovin configure their
  own sessions.
- **Voice/dictation SDKs** - Deepgram, AssemblyAI native wrappers.
- **Music SDKs** - Apple Music, Spotify.
- **TTS features** - any `AVSpeechSynthesizer` usage ducks audio by default.

### Info.plist essentials

```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need the microphone for video calls.</string>
<key>NSCameraUsageDescription</key>
<string>We need the camera for video calls.</string>
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
  <!-- Only add "voip" if you actually use CallKit + PushKit -->
</array>
```

## What the SDK (and customers building on top) should do

### What already works

- WebKit's `RTCAudioSession` listens for
  `AVAudioSession.interruptionNotification` with `.ended + .shouldResume`
  and reactivates automatically.
- The SDK doesn't aggressively self-reactivate - doing so would fight
  legitimate interruptions (phone calls, Siri).

### What the SDK provides for detection & recovery

The client SDK (`@stream-io/video-client`, surfaced via
`@stream-io/video-react-sdk`) ships an `AudioHealthMonitor` owned by each
`Call`'s `DynascaleManager`. It exposes:

- **`audioHealth$` observable + `useAudioHealth()` React hook** returning
  `AudioHealthInfo = { status, reason }`:
  - `status: 'healthy' | 'unhealthy' | 'unknown'` - bind UX to this.
  - `reason` classifies the cause:
    `'host-audio-session-interrupted'` / `'host-audio-session-active'`
    (ground truth from a native iOS host bridge when present - see below),
    `'audio-session-interrupted'` / `'audio-context-interrupted'`
    (Safari OS interruption),
    `'autoplay-blocked'` (any browser),
    `'remote-tracks-muted'` (cross-browser: every remote audio track muted
    by the browser/OS),
    `'element-paused'` (cross-browser: a bound `<audio>` auto-paused while
    its `srcObject` was a live `MediaStream`),
    `'audio-session-active'` (the positive W3C healthy signal on Safari),
    `'playback-verified'` (cross-browser positive: at least one remote
    audio track is unmuted and no bound element is paused - flips
    Chrome/Firefox out of `'unsupported'`),
    `'not-started'` / `'unsupported'` (pre-start or no usable signal yet).
- **`call.resumeAudio()`** - iterates every `<audio>` element the SDK
  tracked as autoplay-blocked and retries `.play()` on each. Must be
  called from within a user gesture. Wire to a "tap to enable audio"
  button.
- **Automatic `navigator.audioSession.type = 'play-and-record'` hint** -
  the monitor writes this on call-join and restores the original on
  leave, nudging WebKit toward a WebRTC-friendly `AVAudioSession`
  category. No action needed from customer code.

Typical React consumer:

```tsx
import { useAudioHealth } from '@stream-io/video-react-sdk';

function AudioHealthBadge({ call }) {
  const { status, reason } = useAudioHealth();
  if (reason === 'autoplay-blocked') {
    return (
      <button onClick={() => call.resumeAudio()}>Tap to enable audio</button>
    );
  }
  if (status === 'unhealthy')
    return <span>Audio interrupted - reconnecting…</span>;
  return null;
}
```

### Host audio-session bridge (iOS hosts)

The detection pipeline above is blind to a specific hostile-host pattern:
when the embedding iOS app silently clobbers the shared `AVAudioSession`
(forces `.playback`, strips `.videoChat`, deactivates without
`.notifyOthersOnDeactivation`), WebKit doesn't fire a W3C interruption -
from its perspective nothing changed. The only way to learn about it in
the page is a native → JS bridge where the host reports `AVAudioSession`
notifications directly.

The sample app ships a drop-in bridge as a `WKWebView` extension. The
host wires it with one line after building the `WKWebView`:

```swift
wv.configureStreamVideoHostBridge()
```

The observer subscribes to every relevant `AVAudioSession` notification,
normalizes the snapshot, and dispatches it to the page as a
`stream-video:host-audio-session` `CustomEvent`. See
[`HOST-AUDIO-SESSION-BRIDGE.md`](./HOST-AUDIO-SESSION-BRIDGE.md) for the
integration steps and the page-side event contract.

The SDK consumes the event automatically (no app code required) and
augments `WindowEventMap` so a typed listener works without importing
anything:

```ts
window.addEventListener('stream-video:host-audio-session', (event) => {
  // event.detail is typed as HostAudioSessionEvent.
  console.log(event.detail.session.category);
});
```

When `interruption.type === 'began'` arrives without a later `'ended'`,
`AudioHealthMonitor` flips to
`{ status: 'unhealthy', reason: 'host-audio-session-interrupted' }`.
Otherwise it reports `host-audio-session-active`. Both beat the W3C
reason codes at the same healthy/unhealthy tier - the native observer
sees transitions WebKit silently ignores.

Precedence inside `computeAudioHealthInfo`:

1. `host-audio-session-interrupted` (native ground truth)
2. `audio-session-interrupted` (W3C)
3. `audio-context-interrupted`
4. `autoplay-blocked`
5. `host-audio-session-active` (native ground truth)
6. `audio-session-active` (W3C)
7. `unsupported`

Any unhealthy reason beats any healthy reason - that's why a W3C
interruption is trusted even when the host bridge reports active.

**Reference host implementation:**
[`sample-apps/ios/ios-webview/IOSWebView/WKWebView+Extensions/WKWebView+Observation.swift`](./IOSWebView/WKWebView+Extensions/WKWebView+Observation.swift)
wires `NotificationCenter.publisher(for:)` to
`webView.evaluateJavaScript(...)` and forwards audio-session snapshots into
the page.

Third-party iOS WebView hosts embedding the SDK can copy
`WKWebView+Observation.swift` verbatim or reimplement the contract - the JS
event names and payloads are the stable part, the Swift extension is
illustrative.

### Host → page lifecycle bridge (iOS hosts)

`AVAudioSession` interruption events are not enough to triage every
audio bug. A common customer-reported pattern: a phone call interrupts a
live call, ends, and the
`AVAudioSession.interruptionNotification(.ended + .shouldResume)` fires
_while the host app is still in the background_. WebKit's
`RTCAudioSession` reactivates correctly, but the in-page SDK has no way
to know "the user just returned to the app" and trigger any recovery it
might owe (autoplay retries, `replaceTrack`, mic permission re-checks).

To bridge that gap, the iOS host can forward UIApplication transitions
into the page as a parallel `CustomEvent`:

```ts
// 'stream-video:host-lifecycle'
interface HostLifecycleEvent {
  schemaVersion: 1;
  source: 'ios';
  timestamp: number; // epoch ms
  state: {
    transition:
      | 'didBecomeActive'
      | 'willResignActive'
      | 'didEnterBackground'
      | 'willEnterForeground';
  };
}
```

**Contract:**

- **Host side** fires once per `UIApplication.*Notification` it observes.
  The four notifications above are sufficient - `applicationProtectedDataWillBecomeUnavailable`
  and friends are not currently bridged.
- **SDK side** does not yet consume this event as a first-class signal
  (no reason code is derived from it). It is exposed today purely for
  correlation in support logs and as a hook customers can listen to from
  their React app to drive their own recovery flows. Wiring it into
  `AudioHealthMonitor` is tracked under "Still open" below.

**Reference host implementation:**
[`sample-apps/ios/ios-webview/IOSWebView/WKWebView+Extensions/WKWebView+Observation.swift`](./IOSWebView/WKWebView+Extensions/WKWebView+Observation.swift).
It dispatches lifecycle events beside the audio-session snapshots.

### Still open

Open items on the backlog:

- **`getStats()`-based anomaly logs** - detect `audioLevel=0` on all
  inbound streams while connection state is `connected`, for cases the
  six signals above miss.
- **Configurable auto-retry** - a background loop that calls
  `replaceTrack` periodically while health is `unhealthy`. Needs product
  input on aggression vs. race-condition risk.
- **Unified public `recoverAudio()`** - today `call.resumeAudio()`
  handles only autoplay. A single method that also triggers
  `navigator.audioSession.type` writes + `getUserMedia` + `replaceTrack`
  would simplify customer code.
- **React Native parity** for the cross-browser `'remote-tracks-muted'`
  / `'element-paused'` signals. RN already has native-level access via
  `stream-video-react-native-sdk`; the JS-layer signals are scoped to
  the WebView path.

### What the SDK _can't_ do

No matter how sophisticated the SDK, it cannot:

- Force a host's session to deactivate. Only the host can release its
  exclusive claim.
- See what `AVAudioSession.category` is currently set to - the Web Audio
  Session API is read-only-ish for inspection.
- Distinguish the _cause_ of an interruption (phone call vs ad SDK vs
  `setCategory(.playback)`) from the web side.

## Detection strategies

### From the web side (applies inside the SDK or on top of it)

> ℹ️ Customers of the React Video SDK should prefer `useAudioHealth()` -
> it aggregates the strategies below into a single `{status, reason}`
> signal with a tested classification. The patterns here document the
> underlying mechanisms and are useful if you're building outside of
> `@stream-io/video-react-sdk` or extending the monitor.

**1. `AudioContext` state - the cleanest single signal**

This is exactly what `AudioHealthMonitor`'s probe `AudioContext` does
internally. Use it directly only if you need the raw transition events.

```javascript
const probe = new AudioContext();
probe.addEventListener('statechange', () => {
  if (probe.state === 'interrupted') {
    // Webkit-specific: the OS audio session was yanked
    onInterruption();
  } else if (probe.state === 'suspended') {
    // Cross-browser fallback; also fires on tab backgrounding
  } else if (probe.state === 'running') {
    onRecovered();
  }
});
```

The probe context doesn't need to own any audio - iOS interrupts _every_
live `AudioContext` in the process when the session is disrupted.

**2. Per-track mute events**

Not yet aggregated by `AudioHealthMonitor` - tracked in the
chrome-coverage TODO as the future `'remote-tracks-muted'` reason code.
Today it's a useful DIY signal on Chrome / Firefox where the probe
`AudioContext` has no `'interrupted'` state.

```javascript
pc.getReceivers().forEach((r) => {
  const t = r.track;
  t.addEventListener('mute', () => log(`${t.kind} track muted by browser`));
  t.addEventListener('unmute', () => log(`${t.kind} track unmuted`));
  t.addEventListener('ended', () => log(`${t.kind} track ENDED (permanent)`));
});
```

`mute` means "can't produce samples temporarily." `ended` means "permanently
dead - renegotiate." Different. Key on `track.muted` (browser/OS-imposed)
not `track.enabled` (user-toggled).

**3. `getStats()` anomaly detection**

Watch `audioLevel` / `totalAudioEnergy` on all inbound-rtp reports. If
every inbound audio stream reports zero for multiple seconds while
connection state is `connected`, audio is interrupted even if no explicit
mute event fired.

### From the host side

> ℹ️ If you can afford a host bridge, drop in the `WKWebView` extension
> the sample ships and call `wv.configureStreamVideoHostBridge()` once. The SDK
> consumes the resulting `stream-video:host-audio-session` event as a
> first-class signal (`host-audio-session-interrupted` /
> `host-audio-session-active`), which makes correlation unnecessary -
> the SDK's own `audioHealth$` already reflects native ground truth.
>
> See
> [`HOST-AUDIO-SESSION-BRIDGE.md`](./HOST-AUDIO-SESSION-BRIDGE.md) for
> the integration steps.
> [`WKWebView+Observation.swift`](./IOSWebView/WKWebView+Extensions/WKWebView+Observation.swift)
> for the reference implementation.

**1. Interruption-notification observer** - log every `began` and `ended`
with the reason. If the ratio isn't 1:1, you have a bug.

```swift
NotificationCenter.default.addObserver(
  forName: AVAudioSession.interruptionNotification, object: nil, queue: .main
) { note in
  guard let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
        let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
  log("interruption \(type == .began ? "BEGAN" : "ENDED")")
}
```

**2. Route-change observer** - logs `newDeviceAvailable`,
`oldDeviceUnavailable`, `categoryChange`, `override`,
`noSuitableRouteForCategory`. Every abnormal category change appears here.

**3. Periodic state snapshots** - dump `category`, `mode`, `categoryOptions`,
`currentRoute`, `isOtherAudioPlaying`, `outputVolume` every N seconds during
an active call. Cheap, incredibly useful in a support ticket.

### Correlate both sides

Timestamp the native and web logs in the same format (ISO 8601 with
milliseconds) and ship them to the same log aggregator. When a ticket
arrives, line up:

```
12:34:56.789 [native] setCategory .playback options=[]
12:34:56.793 [native] setActive true
12:34:56.795 [bridge] category=playback mode=default options=[] interruption=began
12:34:56.801 [web]    AudioContext.state: running → interrupted
12:34:56.802 [web]    audioHealth: healthy → unhealthy (host-audio-session-interrupted)
12:34:56.805 [web]    track.mute recv audio "default" MUTED by browser
12:34:56.812 [web]    getStats inbound-rtp audio audioLevel=0
```

If the host bridge is in place, the `[bridge]` line and the
`host-audio-session-interrupted` reason code make cause and effect
unambiguous without any manual timestamp alignment.

## Hazards checklist

Audit any iOS host embedding the SDK:

**Direct AVAudioSession calls**

- [ ] Every `setCategory` call reviewed - does it need to be exclusive?
- [ ] Every `setMode` call reviewed - is `.voiceChat` preserved during voice
      work?
- [ ] Every `setActive(false, ...)` includes `.notifyOthersOnDeactivation`
- [ ] `overrideOutputAudioPort` is only used deliberately

**APIs that transitively claim the session**

- [ ] `AVAudioPlayer` usage - mixes or interrupts?
- [ ] `AVAudioRecorder` - do you actually need the mic exclusively?
- [ ] `AVAudioEngine` - configured with `.voiceChat`?
- [ ] `AVSpeechSynthesizer` - TTS ducks by default; intentional?
- [ ] `AVPlayer` video - session config reviewed?
- [ ] `UNNotificationSound` - how often does it fire during calls?
- [ ] `CallKit` - only for real VoIP calls, not UI-state?

**Third-party SDKs**

- [ ] Ad SDKs (AdMob, Meta, AppLovin)
- [ ] Video SDKs (Brightcove, JW Player, Bitmovin, AVPlayerViewController)
- [ ] Music / streaming SDKs (Apple Music, Spotify)
- [ ] Voice / dictation SDKs
- [ ] Anything that embeds another WebRTC engine in the same process

**Info.plist**

- [ ] `NSMicrophoneUsageDescription` present and meaningful
- [ ] `NSCameraUsageDescription` present and meaningful
- [ ] `UIBackgroundModes` includes `audio` only if you truly need it
- [ ] `UIBackgroundModes` does NOT include `voip` unless you use CallKit +
      PushKit correctly

## Troubleshooting runbook

| Symptom                                                    | Likely cause                                                                             | Fix                                                                                                 | Detection                                                                     |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Remote audio silent after app played a sound               | Host didn't call `setActive(false, .notifyOthersOnDeactivation)` after playback finished | Implement `AVAudioPlayerDelegate.audioPlayerDidFinishPlaying` and release the session there         | `AudioContext.state === 'interrupted'` with no subsequent return to `running` |
| Echo / distorted / loud voice                              | Mode was reset from `.voiceChat` to `.default`, disabling AEC/AGC/NS                     | Always use `.voiceChat` or `.videoChat` mode for voice                                              | Audit `setMode` calls; log categoryChange route events                        |
| No Bluetooth headset during call                           | Category options missing `.allowBluetooth` / `.allowBluetoothA2DP`                       | Include both in category options                                                                    | Route log shows no BT output with headset connected                           |
| Audio dies on phone-call interruption, doesn't return      | App doesn't handle interruption-ended                                                    | Observe `AVAudioSession.interruptionNotification` with `.ended + .shouldResume` and reactivate      | Lifecycle log: interruption-began without matching interruption-ended         |
| Mic stops after user revokes+grants permission in Settings | SDK doesn't retry the track after status change                                          | Observe app-foregrounded, re-query `AVCaptureDevice.authorizationStatus`, recreate track if changed | `track.onmute` followed by `getUserMedia` error                               |
| Audio drops briefly every few seconds                      | Route changes (BT reconnect, speaker/earpiece switching)                                 | Check headset hardware; verify `.allowBluetooth` options                                            | Rapid route-change notifications with reason `routeConfigurationChange`       |
| Audio vanishes when native plays a ringtone UI             | Ringtone set `.playback` exclusively                                                     | Use `.ambient` + `.mixWithOthers` for UI sounds, or properly restore                                | Interruption-began on category change to `.playback`                          |
| Video freezes but audio keeps working                      | Likely network / bitrate, not session - check `qualityLimitationReason` in `getStats`    | Reduce simulcast layers / bitrate                                                                   | `getStats` outbound-rtp `qualityLimitationReason !== 'none'`                  |

## Reference implementation

The [`sample-apps/ios/ios-webview`](./README.md) sample in this repo
exercises every scenario in this doc. It provides:

- A live `AVAudioSession` state panel in the Scenarios menu.
- Native-side session manipulation actions - both well-behaved
  (`Restore audio (native)`) and hostile (`Play ding (exclusive)`,
  `Play ding (exclusive, NO restore)`).
- JS-side interruption detection via the SDK's `AudioHealthMonitor`, which
  the tutorial subscribes to through `useAudioHealth()` and renders as a
  color-coded badge. The hook's `status` + `reason` flip through
  `healthy → unhealthy (audio-session-interrupted)` and back during the
  scenarios above.
- Correlated logging across native `AVAudioSession` events and the
  tutorial's `console.*` output (mirrored into the native Console tab).

Walk through it on a physical iPhone to see exactly how each failure mode
manifests and how each fix resolves it. It's the fastest way to build
intuition for these interactions without having to reproduce them in a
customer app.

## Further reading

- [Apple: Configuring the audio session](https://developer.apple.com/documentation/avfaudio/avaudiosession)
- [Apple: Responding to audio interruptions](https://developer.apple.com/documentation/avfaudio/avaudiosession/responding_to_audio_interruptions)
- [W3C: Audio Session API](https://www.w3.org/TR/audio-session/) (what
  `navigator.audioSession` implements)
- [WebKit blog: Web Audio Session](https://webkit.org/blog/15162/web-audio-session/)
- [WebRTC for the curious](https://webrtcforthecurious.com/) - background
  on how `RTCPeerConnection` interacts with the OS audio pipeline
