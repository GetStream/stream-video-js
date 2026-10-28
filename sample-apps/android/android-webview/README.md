# `android-webview` - Stream Video React SDK inside an Android WebView

The Android counterpart of [`sample-apps/ios/ios-webview`](../../ios/ios-webview/).
It loads [`sample-apps/react/stream-video-react-tutorial`](../../react/stream-video-react-tutorial/)
(or any URL) in an `android.webkit.WebView` and provides **audio scenarios** that
disturb the native audio stack, so we can reproduce and triage the audio issues
customers hit when the React Video SDK runs inside an Android WebView.

> **This is a troubleshooting tool, not a production pattern.** It allows
> cleartext HTTP to any host (`res/xml/network_security_config.xml`), which is
> fine for local dev servers and never for a shipped app.

## Prereqs

- JDK 17 (`brew install openjdk@17`, then `export JAVA_HOME=/opt/homebrew/opt/openjdk@17`).
- Android SDK with platform 37 (`ANDROID_HOME`, or `sdk.dir` in `local.properties`).
- A physical device with Android 10+ (minSdk 29), **or an emulator**: unlike the
  iOS simulator, the Android emulator has a virtual camera and forwards the
  host microphone, so WebRTC works there.
- Node + Yarn per the repo root (see `.nvmrc`).

## Golden path

```sh
# terminal 1 - run the React tutorial's dev server
yarn sample:react:tutorial

# terminal 2 - build, install and open the app
cd sample-apps/android/android-webview
./gradlew :app:installDebug
adb reverse tcp:5173 tcp:5173
adb shell am start -n io.getstream.samples.androidwebview/.MainActivity -d http://localhost:5173
```

`adb reverse` makes the laptop's port 5173 available as `localhost:5173` on the
device. `localhost` is a secure context, so `getUserMedia` works over plain HTTP
and no tunnel is needed. Passing a URL with `-d` loads it directly; you can also
type it into the URL bar and tap **Load**. For a device without USB, expose the
dev server with `cloudflared tunnel --url http://localhost:5173` and load the
`https://<slug>.trycloudflare.com` URL instead.

The app asks for camera, microphone, phone state and notification permissions
on first launch. Grant all of them (or run
`adb shell pm grant io.getstream.samples.androidwebview android.permission.<NAME>`).

## What's in the app

```
┌─────────────────────────────────────────┐
│  AndroidWebView              Scenarios  │
│  [ URL bar                 ] Load  ↻    │
│                                         │
│          <WebView fills this>           │
│                                         │
│  ▲ Debug  Console Errors Lifecycle ...  │
└─────────────────────────────────────────┘
```

- **URL bar** - persists the last value in `SharedPreferences`. Back navigates
  the WebView history.
- **Scenarios** (top bar) - see the table below.
- **Debug panel** - tap `▲ Debug` to expand. Four tabs, each with Copy / Clear:
  - **Console** - mirrors `window.console.*` from the page.
  - **Errors** - `window.onerror`, `unhandledrejection`, failed main-frame
    loads and renderer crashes.
  - **Lifecycle** - every host-bridge signal and dispatched event, focus changes
    and audio-state dumps.
  - **Scenarios** - what each scenario did, permission grants, page loads.

  Every entry is also written to logcat under the `AndroidWebView` tag:
  `adb logcat -s AndroidWebView`.

- **Remote debugging** - WebView debugging is enabled; open `chrome://inspect`
  in desktop Chrome to get DevTools for the page.

### How the page plumbing works

| iOS sample                                | This app                                                                                                                   |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `WKUserScript` + `WKScriptMessageHandler` | `WebViewCompat.addDocumentStartJavaScript` + `addWebMessageListener` (`window.streamHostBridge`), see `assets/WebScripts/` |
| `WKUIDelegate` media-capture permission   | `WebChromeClient.onPermissionRequest`: requests the runtime permission if needed, then grants camera/mic to the page       |
| `webViewWebContentProcessDidTerminate`    | `WebViewClient.onRenderProcessGone`: logs the crash and swaps in a fresh WebView (tap ↻ to reload the last URL)            |
| `WKWebView+Observation.swift`             | [`HostBridge.kt`](./app/src/main/java/io/getstream/samples/androidwebview/webview/HostBridge.kt), described below          |

## Host bridge

[`HostBridge.kt`](./app/src/main/java/io/getstream/samples/androidwebview/webview/HostBridge.kt)
is a self-contained file that can be copied into another app:

```kotlin
webView.configureStreamVideoHostBridge()
// before webView.destroy():
webView.releaseStreamVideoHostBridge()
```

It dispatches the same two `CustomEvent`s as the iOS bridge, with
`source: "android"`:

```js
window.addEventListener('stream-video:host-audio-session', (e) =>
  console.log(e.detail),
);
window.addEventListener('stream-video:host-lifecycle', (e) =>
  console.log(e.detail),
);
```

`stream-video:host-audio-session` keeps the iOS top-level shape
(`schemaVersion`, `timestamp`, `session`, `interruption`, `routeChange`, `route`),
with Android values:

```json
{
  "schemaVersion": 1,
  "source": "android",
  "timestamp": 1793183886549,
  "session": {
    "mode": "inCall",
    "communicationDevice": { "name": "Pixel 10", "type": "builtinSpeaker" },
    "speakerphoneOn": true,
    "musicActive": false,
    "micMuted": false,
    "micSilenced": false,
    "callState": "offhook"
  },
  "interruption": { "type": "began", "reason": "phoneCall" },
  "routeChange": { "reason": "modeChanged" },
  "route": {
    "inputs": [{ "name": "Pixel 10", "type": "builtinMic" }],
    "outputs": []
  }
}
```

- `interruption` - Android has no audio-session interruption callback, so it is
  derived from state: `began` with reason `ringing` (call ringing or
  `MODE_RINGTONE`), `phoneCall` (call off-hook, `MODE_IN_CALL` or
  `MODE_CALL_SCREENING`) or `micSilenced` (one of this app's recordings was
  silenced by the system), and `ended` once the condition clears. Call state
  needs `READ_PHONE_STATE` on Android 12+; without it, only the audio mode is
  used.
- `routeChange.reason` - `deviceAdded`, `deviceRemoved`, `becomingNoisy`,
  `modeChanged`, `communicationDeviceChanged`.
- `route` - the **available** input/output devices. Android has no single
  "current route"; the device in use for calls is `session.communicationDevice`
  (Android 12+).

`stream-video:host-lifecycle` uses the iOS transition names, mapped from the
process lifecycle: `willEnterForeground` (start), `didBecomeActive` (resume),
`willResignActive` (pause), `didEnterBackground` (stop).

> The client SDK on `main` does not consume these events yet; today they are
> diagnostic only. They are kept in step with the iOS bridge so a future
> consumer can handle both platforms.

## Scenarios reference

| Group       | Action                                                       | What it exercises                                                                                                                              |
| ----------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Audio state | (header line)                                                | Mode, communication device, music active, focus held by the app, active recordings and how many are silenced. Re-read on every open.           |
|             | Dump state to Lifecycle                                      | One-line dump of mode, devices, volumes, focus and recordings.                                                                                 |
| Recovery    | Restore audio (native)                                       | Abandons any focus the app still holds, sets `MODE_IN_COMMUNICATION` and clears a forced communication device.                                 |
| 🎛 Set mode  | normal / ringtone / inCall / inCommunication / callScreening | `AudioManager.setMode`. Logs when the OS ignores the request. Counterpart of the iOS category switcher.                                        |
| Sounds      | Play ding (mix)                                              | Plays `res/raw/ding` with `USAGE_MEDIA` and no focus request: mixes with WebRTC audio.                                                         |
|             | Play ding (exclusive)                                        | Requests `AUDIOFOCUS_GAIN` and never abandons it: the "webview audio goes quiet after a native sound" repro. Use Restore afterwards.           |
|             | Play ding (exclusive, auto-restore)                          | `AUDIOFOCUS_GAIN_TRANSIENT`, abandoned on completion and the mode set back to `MODE_IN_COMMUNICATION`: the "right way".                        |
|             | Play ding (exclusive, NO restore)                            | `AUDIOFOCUS_GAIN`, abandoned on completion without restoring the mode: does WebView recover on its own?                                        |
|             | Ringtone loop / Stop ringtone                                | Looping `USAGE_NOTIFICATION_RINGTONE` playback with transient focus: app-owned audio overlapping WebRTC for a long time.                       |
|             | Notification with sound (2s)                                 | Posts a high-importance notification with the default sound after 2 seconds.                                                                   |
| Android     | Start / Stop second mic capture (meter)                      | A second `VOICE_COMMUNICATION` `AudioRecord` next to the WebView's; logs its level twice a second and shows whether a capture is silenced.     |
|             | Toggle route (speaker ↔ earpiece)                            | `setCommunicationDevice` (Android 12+) or `setSpeakerphoneOn`. The emulator has no earpiece.                                                   |
|             | Start / Stop foreground service (mic\|camera)                | Android blocks background capture unless a typed foreground service was started while visible. Compare minimizing the app with and without it. |
|             | Crash renderer                                               | Loads `chrome://crash` to exercise renderer-crash handling.                                                                                    |

## Customer test scenarios - crosswalk

| Customer scenario                                   | How to exercise it                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phone call received during a live call**          | Emulator: `adb emu gsm call 5551234`, then `adb emu gsm accept 5551234` and `adb emu gsm cancel 5551234`. Device: call it. Lifecycle shows `interruption began: ringing` → `phoneCall` → `ended`. |
| **External notification with sound during a call**  | `Scenarios → Notification with sound (2s)`; audio should keep flowing.                                                                                                                            |
| **Screen locked while unmuted**                     | Manual: lock the device. Lifecycle logs `willResignActive` / `didEnterBackground`. Try with and without the foreground service.                                                                   |
| **Switching apps / minimized while unmuted**        | Manual: press Home and come back. Same transitions as above, then `willEnterForeground` / `didBecomeActive`.                                                                                      |
| **Force-quit app**                                  | Manual: swipe the app away. Other participants observe the WebSocket-disconnect timeout.                                                                                                          |
| **Members can hear remote audio / mute and unmute** | Use the tutorial in the WebView. `Scenarios → Start second mic capture` proves the mic works outside WebRTC.                                                                                      |
| **Toggle additional microphone / audio outputs**    | `Scenarios → Toggle route`, or plug in / pair a headset (logged as `deviceAdded` / `deviceRemoved`).                                                                                              |

## Known limitations

- Cleartext traffic is allowed for every host. Dev only.
- `READ_PHONE_STATE` is needed for call-state interruptions on Android 12+.
- Mode and communication-device listeners exist from Android 12; on Android
  10-11 the bridge polls briefly after each signal instead.
