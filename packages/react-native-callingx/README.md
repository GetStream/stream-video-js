# @stream-io/react-native-callingx

React Native native-calling bridge for:

- iOS CallKit
- Android Telecom/ConnectionService

## Install

```sh
yarn add @stream-io/react-native-callingx
```

Then run iOS pods:

```sh
cd ios && pod install
```

## Quick start

```ts
import { CallingxModule } from '@stream-io/react-native-callingx';

CallingxModule.setup({
  ios: {
    supportsVideo: true,
    callsHistory: false,
  },
  android: {
    incomingChannel: {
      id: 'incoming_calls_channel',
      name: 'Incoming calls',
    },
    // Android 16 QPR2 (API 36.1)+ only
    callsHistory: false,
  },
});

await CallingxModule.displayIncomingCall(
  'call-id',
  '+123456789',
  'John Doe',
  true,
);
```

## Main APIs

`displayIncomingCall` and `startCall` return a Promise. The other call controls run synchronously and throw synchronously if the native call fails; `getAvailableAudioEndpoints` and `releaseBackgroundTask` never throw.

- `setup(options)` - required before any call action.
- `displayIncomingCall(callId, phoneNumber, callerName, hasVideo)` (async).
- `startCall(callId, phoneNumber, callerName, hasVideo)` (async).
- `setCurrentCallActive(callId)` (sync).
- `answerIncomingCall(callId)` (sync).
- `updateDisplay(callId, phoneNumber, callerName, incoming)` (sync).
- `endCallWithReason(callId, reason)` (sync).
- `setMutedCall(callId, isMuted)` (sync).
- `setOnHoldCall(callId, isOnHold)` (sync).
- `getAvailableAudioEndpoints(callId)` (sync, never throws) - returns `{ endpoints: [], currentEndpoint: null }` on iOS, for unknown calls, or on native errors.
- `requestAudioEndpointChange(callId, endpointId)` (Android, sync).
- `addEventListener(eventName, callback)`.
- `getInitialEvents()` and `getInitialVoipEvents()`.
- `acquireBackgroundTask(owner)` / `releaseBackgroundTask(owner)` (Android, sync) — ref-counted keep-alive task that keeps the JS runtime/timers alive in the background; the underlying HeadlessJS task starts on the first acquire and stops once all owners release.
- `stopService()` (Android, sync) — asks the call service to stop. A request, not a command: the service hosts every call, so it stays alive while any call is registered or is being registered. Use `endCallWithReason(callId, reason)` to tear down an individual call.

`phoneNumber` is the call handle. iOS uses it as the CallKit `CXHandle`. Android always wraps it as the opaque Telecom address `<packageName>:<phoneNumber>` (a scheme-less address reboots ColorOS devices); it is never displayed or dialed. The Stream Video SDK passes the caller's user id on iOS and the call id on Android.

## Migrating from Promise-based call controls

These methods used to return Promises and are now synchronous: `setCurrentCallActive`, `answerIncomingCall`, `updateDisplay`, `endCallWithReason`, `setMutedCall`, `setOnHoldCall`, `getAvailableAudioEndpoints`, `requestAudioEndpointChange`, `acquireBackgroundTask`, `releaseBackgroundTask` and `stopService`.

They return (or throw) synchronously. Replace `await`, `.then()` and `.catch()` with direct calls and `try`/`catch`:

```ts
// before
await CallingxModule.endCallWithReason('call-id', 'local').catch(handleError);

// after
try {
  CallingxModule.endCallWithReason('call-id', 'local');
} catch (e) {
  handleError(e);
}
```

`displayIncomingCall` and `startCall` are unchanged and still return Promises.

## Event names

Call events:

- `answerCall`
- `endCall`
- `didDisplayIncomingCall`
- `didToggleHoldCallAction`
- `didPerformSetMutedCallAction`
- `didReceiveStartCallAction`
- `didActivateAudioSession`
- `didDeactivateAudioSession`
- `callBackRequested` (see below)

VoIP events:

- `voipNotificationsRegistered`
- `voipNotificationReceived`

## Calls history and call-back

With `ios.callsHistory` / `android.callsHistory` enabled, calls appear in the system call history
(iOS Recents; Android 16 QPR2+ call log, where the dialer supports VoIP calls). Tapping an entry
opens the app and emits `callBackRequested`:

```ts
CallingxModule.addEventListener('callBackRequested', ({ callId, isVideo }) => {
  // callId: the cid of the original call. Fetch it to get its members and ring them again
  // in a new call. On iOS, calls are reported to CallKit with the cid as their handle.
});
```

The event is sticky: when the tap launched the app, it's delivered to the first listener,
even if that listener subscribes after the event arrived.

On iOS, forward user activities to callingx:

```swift
// application(_:continue:restorationHandler:), and with UIScene also
// scene(_:willConnectTo:options:) (connectionOptions.userActivities) and scene(_:continue:)
_ = Callingx.handle(userActivity) // or StreamVideoReactNative.handle(userActivity)
// (ObjC: +[Callingx handleUserActivity:]; Swift imports it as handle(_:))
```

and add `INStartCallIntent` to `NSUserActivityTypes` in `Info.plist`.

## Skip CallKit when the app is in the foreground (iOS 26.4+)

Set `skipIncomingPushInForeground: true` in `setup()` to hide CallKit for
ringing pushes that arrive while the user is already inside your app. The
push is still delivered to JS via `voipNotificationReceived`, so the app
must show its own ringing UI. Background pushes are unaffected.

Requires iOS 26.4+ (no-op on older versions). Also add this delegate to your
`AppDelegate.swift`:

```swift title="AppDelegate.swift"
private func pushRegistry(
  _ registry: PKPushRegistry,
  didReceiveIncomingVoIPPushWith payload: PKPushPayload,
  metadata: AnyObject,
  withCompletionHandler completion: @escaping () -> Void
) {
  StreamVideoReactNative.didReceiveIncomingVoIPPush(
    payload,
    metadata: metadata,
    completionHandler: completion
  )
}
```

## Notes

- Import from `@stream-io/react-native-callingx`.
- iOS-only helpers: `registerVoipToken`, `fulfillAnswerCallAction`, `fulfillEndCallAction`.
- Android helpers: `canPostNotifications`, `isOngoingCallsEnabled`.
