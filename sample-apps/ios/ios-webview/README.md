# `ios-webview` — Stream Video React SDK inside a WKWebView

A minimal native iOS companion to
[`sample-apps/react/stream-video-react-tutorial`](../../react/stream-video-react-tutorial/).
It embeds the tutorial in a `WKWebView` and exposes **audio-session scenarios**
so we can reproduce and triage the audio-interruption issues customers hit when
the React Video SDK runs inside an iOS webview.

> **This is a troubleshooting tool, not a production pattern.** It enables
> `NSAllowsArbitraryLoads` for ATS — fine for dev against a local tunnel,
> never for a shipped app.

> 📘 For the concepts behind the audio scenarios — who owns `AVAudioSession`,
> what the host app should and shouldn't do, how to detect interruptions from
> JS, and a troubleshooting runbook — see
> [**AUDIO-SESSIONS.md**](./AUDIO-SESSIONS.md).

## Prereqs

- Xcode 15+ with command-line tools.
- A **physical iPhone** running iOS 15 or newer. The simulator has no camera
  or microphone, so WebRTC won't work there.
- Apple Developer account (free tier is fine) — Xcode will prompt for it the
  first time you run on a device.
- Node + Yarn per the repo root (see `.nvmrc`).
- `cloudflared` for exposing the laptop's dev server over HTTPS:
  ```
  brew install cloudflared
  ```
- `xcodegen` for regenerating `IOSWebView.xcodeproj` from `project.yml`:
  ```
  brew install xcodegen
  ```
  The generated `.xcodeproj` is committed too, so you can skip this unless
  `project.yml` has changed.

## Golden path

```sh
# terminal 1 — run the React tutorial's dev server
cd sample-apps/react/stream-video-react-tutorial
yarn dev

# terminal 2 — expose it over HTTPS
cloudflared tunnel --url http://localhost:5173
# copy the https://<slug>.trycloudflare.com URL it prints
```

Open the iOS project:

```sh
cd sample-apps/ios/ios-webview
xcodegen generate          # only if project.yml has changed
open IOSWebView.xcodeproj
```

In Xcode:

1. Select the `IOSWebView` target → **Signing & Capabilities** → pick a
   development team.
2. Pick your iPhone as the run destination.
3. Cmd+R.

On the phone:

1. Paste the Cloudflare URL into the URL field, tap **Load**.
2. Grant camera and microphone when prompted.
3. The tutorial auto-joins a call with its hardcoded demo credentials.

## What's in the app

```
┌─────────────────────────────────────────┐
│  IOSWebView                  Scenarios  │
│  ─────────────────────────────────────  │
│  [ URL bar                 ] Load  ↻    │
│                                         │
│        <WKWebView fills this>           │
│                                         │
│  ─────────────────────────────────────  │
│  ▲ Debug  [Console|Errors|Lifecycle]    │
└─────────────────────────────────────────┘
```

- **URL bar** — persists the last value in `UserDefaults`.
- **Scenarios** (nav) → single `UIMenu` of audio-session scenarios.
- **Debug overlay** — tap `▲ Debug` to expand. Three tabs:
  - **Console** — mirrors `window.console.*` from the tutorial.
  - **Errors** — captures `window.onerror`, `unhandledrejection`, and
    `getUserMedia` failures.
  - **Lifecycle** — audio route changes and interruption notifications.
    Native `AVAudioSession` transitions from `AudioSessionBridge.swift`
    land here too (tagged `bridge`), so you can see the host-side ground
    truth that the SDK consumes via the
    `stream-video:host-audio-session` `CustomEvent`.
- **Host audio-session bridge** —
  [`AudioSessionBridge.swift`](./IOSWebView/WebView/AudioSessionBridge.swift)
  observes `AVAudioSession` notifications and forwards each snapshot into
  the page. The SDK's `AudioHealthMonitor` consumes those events and
  emits the `host-audio-session-interrupted` /
  `host-audio-session-active` reason codes. See
  [`AUDIO-SESSIONS.md`](./AUDIO-SESSIONS.md) for the protocol contract.

The client SDK exposes audio-health transitions via the `useAudioHealth()`
React hook (and `call.dynascaleManager.audioHealthMonitor?.audioHealth$`
directly). With the bridge in place, `useAudioHealth()` sees native
ground-truth signals here that pure in-page detection would miss. The
React tutorial doesn't render it by default; to correlate transitions
with the native scenarios here, add a one-line `useEffect` that logs
`useAudioHealth()` results in your React consumer — `console.*` calls
are mirrored into the **Console** tab via `console-mirror.js`.

## Scenarios reference

Single nav-bar menu (`🔊 Audio & session`):

| Group          | Action                                                                              | What it exercises                                                                                                                                                                                                                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live state     | 📊 category / mode / options / route                                                | Read-only status from `AVAudioSession.sharedInstance()`, re-read on every menu open                                                                                                                                                                                                                                          |
| Recovery       | Restore audio (native)                                                              | `setActive(false, .notifyOthersOnDeactivation)` → `setCategory(.playAndRecord, .videoChat)` → `setActive(true)`. The three-step native-side recovery WebKit's RTCAudioSession listens for.                                                                                                                                   |
|                | Restore audio (JS-only)                                                             | Writes `navigator.audioSession.type = 'play-and-record'` via `WKWebView.evaluateJavaScript`. The closest a webview-embedded customer can get without reaching into SDK internals. For the richer recovery path (autoplay retry, `replaceTrack`), the SDK exposes `call.resumeAudio()` — wire it to a button in the tutorial. |
| Set category   | `.ambient`, `.soloAmbient`, `.playback`, `.record`, `.playAndRecord`, `.multiRoute` | Generic category switcher (`mode=.default`, `options=[]`). For hostile single-knob variants, see "Dangerous".                                                                                                                                                                                                                |
| Sounds         | Play ding (mix / exclusive)                                                         | Plays `Resources/ding.caf` through `AVAudioPlayer` with `.playback` category, with / without `.mixWithOthers`. The **exclusive** variant is the canonical repro for "webview audio goes silent after a native sound."                                                                                                        |
|                | Ringtone loop / stop                                                                | App-owned audio overlapping WebRTC for an extended period.                                                                                                                                                                                                                                                                   |
|                | Local notification (2s)                                                             | Schedules a notification with `.default` sound — fires a few seconds later and interrupts.                                                                                                                                                                                                                                   |
| CallKit        | Incoming / End                                                                      | Full audio-session hijack and recovery via CallKit's normal lifecycle.                                                                                                                                                                                                                                                       |
|                | Toggle route                                                                        | `overrideOutputAudioPort(.speaker / .none)` — verify speaker vs. earpiece routing.                                                                                                                                                                                                                                           |
| 🔍 Diagnostics | Dump session state                                                                  | One-tap diagnostic of category/mode/options/route to the Lifecycle tab.                                                                                                                                                                                                                                                      |
|                | Mic meter start / stop                                                              | Streams `AVAudioRecorder.averagePower(forChannel:)` samples to the log. Proves mic hardware works outside WebRTC.                                                                                                                                                                                                            |
|                | Record + play 3s                                                                    | 3s record → immediate playback. End-to-end round trip outside WebRTC.                                                                                                                                                                                                                                                        |
| 🔊 Dangerous   | Force `.playback`                                                                   | Category switch to playback without restoring. Breaks mic capture in the webview.                                                                                                                                                                                                                                            |
|                | Force `mode=.default`                                                               | Strips `.voiceChat` / `.videoChat` mode — AEC + noise suppression off.                                                                                                                                                                                                                                                       |
|                | `setActive(false)`                                                                  | Silent deactivation with no `.notifyOthersOnDeactivation`. Hostile: other audio sessions don't know to resume.                                                                                                                                                                                                               |
|                | 440 Hz tone start / stop                                                            | `AVAudioEngine` sine source routed to the mixer — AEC test tone.                                                                                                                                                                                                                                                             |

## Debugging tips

- **Safari Web Inspector** — on iOS 16.4+ the webview is `isInspectable`.
  Mac: Safari → Settings → Advanced → "Show features for web developers",
  then Develop → [your iPhone] → [the page title].
- **Console tab** mirrors `console.*` from the tutorial, so you don't need
  Web Inspector for basic debugging.

## Observe-only phenomena

A few iOS behaviors cannot be programmatically forced from the app but are
still instrumented — trigger them manually and the Lifecycle tab timestamps
everything so you can correlate:

- **Siri** (say "Hey Siri" during a call) — audio-session interruption
  notification + route change.
- **Real incoming phone call** — like the CallKit scenario, with real hardware.
- **AirPods tap / plug / unplug** — route-change log with
  `newDeviceAvailable` / `oldDeviceUnavailable`.

## Known limitations

- `NSAllowsArbitraryLoads: true` in `Info.plist` is **dev-only**.
- Quick Tunnel URLs rotate on every `cloudflared` run. For a stable URL,
  create a named Cloudflare tunnel (out of scope for this sample).
- `ding.caf` / `ringtone.caf` assets are bundled under `Resources/`; if
  missing, the sound scenarios fall back to `AudioServicesPlaySystemSound` /
  a synthesized tone and log the fallback.
