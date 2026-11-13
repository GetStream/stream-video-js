# `ios-webview` - Stream Video React SDK inside a WKWebView

A minimal native iOS companion to
[`sample-apps/react/stream-video-react-tutorial`](../../react/stream-video-react-tutorial/).
It embeds the tutorial in a `WKWebView` and exposes **audio-session scenarios**
so we can reproduce and triage the audio-interruption issues customers hit when
the React Video SDK runs inside an iOS webview.

> **This is a troubleshooting tool, not a production pattern.** It enables
> `NSAllowsArbitraryLoads` for ATS - fine for dev against a local tunnel,
> never for a shipped app.

## Prereqs

- Xcode 15+ with command-line tools.
- A **physical iPhone** running iOS 15 or newer. In the Simulator the
  WKWebView only sees WebKit's mock devices (a synthetic mic tone) and the
  host `AVAudioSession` never leaves `.soloAmbient`, so the audio-session
  scenarios can't break anything there. The Simulator is still fine for
  page-level checks (visibility, network events, in-page audio).
- Apple Developer account (free tier is fine) - Xcode will prompt for it the
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
# terminal 1 - run the React tutorial's dev server
cd sample-apps/react/stream-video-react-tutorial
yarn dev

# terminal 2 - expose it over HTTPS
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

- **URL bar** - persists the last value in `UserDefaults`.
- **Scenarios** (nav) → single `UIMenu` of audio-session scenarios.
- **Debug overlay** - tap `▲ Debug` to expand. Three tabs:
  - **Console** - mirrors `window.console.*` from the tutorial.
  - **Errors** - captures `window.onerror`, `unhandledrejection`, and
    `getUserMedia` failures.
  - **Lifecycle** - audio route changes and interruption notifications.
    Native `AVAudioSession` transitions from `WKWebView+Observation.swift`
    land here too, so you can see the host-side ground truth that the SDK
    consumes via the `stream-video:host-audio-session` `CustomEvent`.
    UIApplication transitions (`didBecomeActive`, `willResignActive`,
    `didEnterBackground`, `willEnterForeground`) are forwarded into the
    page as `stream-video:host-lifecycle`.
- **Host audio-session bridge** -
  [`WKWebView+Observation.swift`](./IOSWebView/WKWebView+Extensions/WKWebView+Observation.swift)
  observes `AVAudioSession` and `UIApplication` notifications and forwards
  snapshots into the page. The SDK doesn't consume these events; they are
  there so page-side logs can be correlated with native transitions.
  WebKit captures and plays audio from its own process, so the host app's
  `AVAudioSession` category isn't the one WebRTC runs under (it can read
  `.soloAmbient` while the mic is live).

## Automation (Debug builds)

Debug builds register the `iowebview://` URL scheme so a test run can drive
the app from the shell. Every log entry is also printed to stdout.

```sh
# Simulator: capture logs, then send commands
xcrun simctl launch --console-pty booted io.getstream.samples.ios-webview
xcrun simctl openurl booted 'iowebview://scenario?name=ding-exclusive'

# Device: same commands through devicectl
xcrun devicectl device process launch --device <udid> --console io.getstream.samples.ios-webview
xcrun devicectl device process launch --device <udid> \
  --payload-url 'iowebview://scenario?name=dump' io.getstream.samples.ios-webview
```

- `load?url=<percent-encoded URL>` loads a page.
- `scenario?name=<id>` runs a scenario: `restore`, `ding-mix`,
  `ding-exclusive`, `ding-auto-restore`, `ding-no-restore`,
  `ringtone-start`, `ringtone-stop`, `notification`, `dump`,
  `stale-offline`, `category-<ambient|soloAmbient|playback|record|playAndRecord|multiRoute>`,
  `sample-rate-<16000|44100|48000>`, `io-buffer-<5|23|93>`.
- `eval?js=<percent-encoded function body>` runs JS in the page
  (`await` works; `return` a value to log it). `simctl openurl` caps URLs
  at about 2 KB, so send longer scripts in chunks or use
  `eval?src=<percent-encoded http URL>`, which the app fetches natively.

Each `devicectl ... --payload-url` call briefly sends the app through
`willResignActive` / `didBecomeActive`; that alone doesn't affect the call.

## Scenarios reference

Single nav-bar menu (**Scenarios**):

| Group          | Action                                         | What it exercises                                                                                                                                                        |
| -------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Network        | Stale offline event (online → offline 0.5s)    | Dispatches `online`, then `offline` 0.5 s later, while the network keeps working. The call should stay `joined` (or be back within about 2 s) without reconnecting.      |
| Audio session  | Live state row                                 | Read-only category / mode / route from `AVAudioSession.sharedInstance()`.                                                                                                |
| Recovery       | Restore audio (native)                         | `setActive(false, .notifyOthersOnDeactivation)` → `setCategory(.playAndRecord, .videoChat)` → `setActive(true)`, then posts a synthetic `interruption=ended` in-process. |
| 🎛 Set category | `.ambient` … `.multiRoute`                     | `setCategory(<category>, .default, [])` + `setActive(true)`.                                                                                                             |
| Sounds         | Play ding (mix / exclusive)                    | `ding.caf` through `AVAudioPlayer` with `.playback`, with or without `.mixWithOthers`. Nothing is restored afterwards.                                                   |
|                | Play ding (exclusive, auto-restore)            | Exclusive `.playback`, then the three-step restore when the ding finishes.                                                                                               |
|                | Play ding (exclusive, NO restore)              | Exclusive `.playback`, then only `setActive(false, .notifyOthersOnDeactivation)`; the category stays `.playback`.                                                        |
|                | Ringtone loop start / stop                     | Loops `ringtone.caf` with an exclusive `.playback` claim (a second incoming call ringing). Stop doesn't restore the session.                                             |
|                | Local notification (2s)                        | Schedules a notification with the default sound, presented in the foreground too.                                                                                        |
| 🎚 Sample rate  | Preferred sample rate 16000 / 44100 / 48000 Hz | `setPreferredSampleRate` + `setActive(true)`; logs the rate iOS actually granted (the built-in route stays at 48 kHz).                                                   |
|                | Preferred IO buffer 5 / 23 / 93 ms             | `setPreferredIOBufferDuration` + `setActive(true)`.                                                                                                                      |
| Diagnostics    | Dump session state                             | Logs category / mode / options / sample rate / IO buffer / route to the Lifecycle tab.                                                                                   |

## Customer test scenarios - crosswalk

A customer-supplied test plan covers Live Calls (and, separately, Webinars

- deferred). Where each item maps in this app:

| Customer scenario                                                              | How to exercise it                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Phone call received during a live call**                                     | Manual - call the device from another phone, then end the call. On the Simulator there is no equivalent; the exclusive ding and category scenarios produce the same WebKit interruption.                                                   |
| **BUG: ending the phone call leaves user in bugged audio state**               | Same scenario as above - see the "Bug A repro" section below for the read.                                                                                                                                                                 |
| **External notification with sound during a call (notif audio plays quietly)** | `Scenarios → Local notification`. Watch the Console + Lifecycle tabs for `bridge` snapshots; the audio should keep flowing.                                                                                                                |
| **Screen locked while unmuted (member should auto-mute)**                      | Manual - physically lock the device. Lifecycle tab will log `transition=willResignActive` (and route changes if the lock removes the headset). The page receives the same via `stream-video:host-lifecycle`.                               |
| **Switching apps / minimized while unmuted**                                   | Manual - Cmd+H (or swipe up on physical device). Lifecycle tab logs `transition=didEnterBackground` followed by `transition=willEnterForeground` + `transition=didBecomeActive` on return.                                                 |
| **Force-quit app**                                                             | Manual - swipe up from app switcher. Audio cuts immediately for the local member; other participants observe the WebSocket-disconnect timeout. Not directly observable from the app itself (the process is killed); rely on web-side logs. |
| **Members can hear remote audio / mute/unmute**                                | Use the running React tutorial in the WKWebView with a second participant on the web.                                                                                                                                                      |
| **Toggle additional microphone / audio outputs**                               | Manual - iOS Control Center route picker, or plug / pair a headset.                                                                                                                                                                        |
| **Hi-fi audio toggle / noise cancellation toggle**                             | Web-side responsibility (`@stream-io/video-react-sdk` settings); not exposed from the native side.                                                                                                                                         |

### Stale offline event - repro instructions

A resumed page can receive `online` and `offline` out of order. Before the
fix, the call went to `offline` on a working network and stayed there.

1. Load the React tutorial and wait for the call to join.
2. Tap `Scenarios → Stale offline event (online → offline 0.5s)`.
3. Watch the page. The tutorial renders the call only while it is
   `joined` and shows "Loading..." otherwise.
   - **Fixed**: the call stays on screen (or returns within about 2 s),
     with no reconnect.
   - **Bug reproduced**: the page switches to "Loading..." and stays there
     until a later `online` event.

### Bug A - repro instructions (live call, post-phone-call audio drift)

The customer's confirmed bug: after a phone call interrupts a live call
and ends, the live-call audio stays in a "bugged" state.

1. Paste a Cloudflare tunnel URL pointing at the React tutorial → **Load**
   → wait for auto-join. Confirm two-way audio with a second participant
   on the web.
2. Open the debug overlay → **Lifecycle** tab.
3. Call the device from another phone, talk for a few seconds, end the call.
4. Check both directions from the web participant's side:
   - **No bug**: within a few seconds the web participant hears you again
     and you hear them.
   - **Bug A reproduced**: either direction stays silent. A stuck outbound
     side shows up as the local mic track staying `muted` in the Console
     tab; toggling the mic off and on recovers it.
5. Repeat with a longer call to confirm the bug isn't timing-sensitive.

The host `AVAudioSession` snapshots aren't a reliable read here: WebKit runs
audio from its own process, so the host category doesn't track WebRTC's.

When you file a ticket, paste the entire Lifecycle-tab transcript (it
already contains `audio-session[…]:` snapshots, `bridge` events, and the
new `lifecycle` transitions in chronological order).

## Debugging tips

- **Safari Web Inspector** - on iOS 16.4+ the webview is `isInspectable`.
  Mac: Safari → Settings → Advanced → "Show features for web developers",
  then Develop → [your iPhone] → [the page title].
- **Console tab** mirrors `console.*` from the tutorial, so you don't need
  Web Inspector for basic debugging.

## Observe-only phenomena

A few iOS behaviors cannot be programmatically forced from the app but are
still instrumented - trigger them manually and the Lifecycle tab timestamps
everything so you can correlate:

- **Siri** (say "Hey Siri" during a call) - audio-session interruption
  notification + route change.
- **Real incoming phone call** - see the Bug A repro above.
- **AirPods tap / plug / unplug** - route-change log with
  `newDeviceAvailable` / `oldDeviceUnavailable`.

## Known limitations

- `NSAllowsArbitraryLoads: true` in `Info.plist` is **dev-only**.
- Quick Tunnel URLs rotate on every `cloudflared` run. For a stable URL,
  create a named Cloudflare tunnel (out of scope for this sample).
- `ding.caf` / `ringtone.caf` assets are bundled under `Resources/`; if
  missing, the sound scenarios fall back to `AudioServicesPlaySystemSound` /
  a synthesized tone and log the fallback.
