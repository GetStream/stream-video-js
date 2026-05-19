# Integration guide: audio health for iOS WebView apps

This guide introduces the two APIs available for integrating audio-health monitoring into an iOS `WKWebView` application that embeds the Stream React Video SDK.

---

## Part 1 - iOS host

1. Add
   [`WKWebView+Observation.swift`](./IOSWebView/WKWebView+Extensions/WKWebView+Observation.swift)
   to your iOS project.
2. After constructing your `WKWebView`, invoke the bridge:

   ```swift
   webView.configureStreamVideoHostBridge()
   ```

The bridge is attached to the web view and forwards `AVAudioSession` events into the page. It is released automatically when the web view is deallocated.

---

## Part 2 - Web UI

The React SDK exposes two hooks and one method on `Call` for surfacing audio-health state in your interface.

### `useAudioHealth()`

Returns `{ status, reason, direction }`. UI should be rendered when `status` is `unhealthy`.
The `unknown` value indicates that no signal has resolved yet and should be treated as neutral rather than as a healthy state.

```tsx
const { useAudioHealth } = useCallStateHooks();
const { status, reason } = useAudioHealth();

if (status === 'unhealthy') {
  // render a banner; map `reason` to user-facing copy
}
```

This hook is well suited for banners, badges, or directional indicators for the microphone and speaker.
We recommend binding user-facing messages to `reason` rather than `status`, so the wording remains specific to the underlying condition.

### `useIsAutoplayBlocked()` and `call.resumeMedia()`

The SDK already performs several layers of recovery automatically:

- Media elements that were playing before an interruption are retried internally once the interruption ends, with no application code required.
- When configured, the SDK can also auto-mute the local microphone on a capture interruption and refresh the underlying `MediaStreamTrack`s when the call recovers.

There is one case the SDK cannot handle on its own: when the browser's autoplay policy refuses an element that has never received a user gesture
(typically on initial page load). Browsers require a genuine user gesture in this scenario and reject programmatic `.play()` calls regardless of retries.

`useIsAutoplayBlocked()` surfaces this specific case so your application can prompt the user.
The `call.resumeMedia()` call must be invoked from within the resulting click handler, so the browser attributes the gesture to it.

```tsx
const isBlocked = useIsAutoplayBlocked();
const call = useCall();

if (isBlocked) {
  return (
    <button onClick={() => call?.resumeMedia()}>Tap to enable sound</button>
  );
}
```

The hook returns to `false` automatically once playback resumes, so the button hides itself.

> A reference implementation is available in the dogfood sample's
> [`ActiveCallHeader.tsx`](../../react/react-dogfood/components/ActiveCallHeader.tsx),
> which can be used as a starting point.

---

## Verifying the integration

The integration can be verified on a physical iPhone with Safari Web Inspector attached:

1. During an active call, trigger an incoming CallKit call.
2. In the console, observe `audioHealth` transitioning to `unhealthy` with a reason, for example, `host-audio-session-interrupted`.
3. End the CallKit call. The status should return to `healthy` and audio should resume without user input.

A `host-` prefix on the reason confirms that the native bridge is active.
If you see a reason without that prefix, the SDK has fallen back to its in-page signal sources.
Please verify that `configureStreamVideoHostBridge()` was invoked on the same `WKWebView` instance that loaded the page.

---

## Tested scenarios

The following scenarios have been verified end-to-end on iOS using the integration described above.

- **App moves to the background.** iOS suspends video playback while audio continues uninterrupted.
- **App returns to the foreground.** Video playback resumes automatically without application intervention.
- **Device screen locked.** Video playback is suspended while audio continues. Video resumes once the device is unlocked.
- **Incoming phone call rejected.** Audio is interrupted during the ringing phase and recovers after the call is dismissed. See the note on WKWebView below.
- **External device connection prompt** (for example, the AirPods first-pair dialog). Both audio and video recover after the prompt is dismissed.
- **Switching the audio input or output device** during an active call. Audio and video remain functional and no application-level recovery is required.

> **Note on WKWebView behavior.**
> WKWebView applies its own rules to how media is suspended and resumed during system-level interruptions.
> The bridge mitigates most of these cases, but minor delays in `<video>` resumption may occur on certain iOS builds, particularly during phone-call interruptions.
