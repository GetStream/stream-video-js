# @stream-io/react-native-callingx

React Native native-calling bridge for:

- iOS CallKit (default) or LiveCommunicationKit (opt-in, iOS 17.4+)
- Android Telecom/ConnectionService

## Install

```sh
yarn add @stream-io/react-native-callingx
```

Then run iOS pods:

```sh
cd ios && pod install
```

Requires iOS 15.1+.

### iOS backends

callingx has two iOS system-call backends behind one JS API. Events, payloads and the native `Callingx` ObjC methods are identical for both.

- **CallKit** (default): `CXProvider` / `CXCallController`. Works on every supported iOS version.
- **LiveCommunicationKit** (opt-in): Apple's `ConversationManager`. Requires iOS 17.4+; it is weak-linked, so apps keep their lower deployment target.

Opt in with `useLiveCommunicationKit: true`:

```ts
CallingxModule.setup({ ios: { useLiveCommunicationKit: true } });
```

With the Stream Video React Native SDK, set `push.ios.useLiveCommunicationKit` in `StreamVideoRN.setPushConfig(...)`.

- Defaults to `false`. On iOS below 17.4 the flag is ignored and CallKit is used.
- The backend is chosen once per app launch from the persisted settings. Changing the flag takes effect on the next launch.

### Known issues (iOS)

- Apple FB16655952 (LiveCommunicationKit): the incoming-call report is async-only, but PushKit needs it entered before the delegate returns. Worked around with Apple DTS's documented approach (start the report in a detached `Task`, stall 50 ms, then call the PushKit completion).
- Apple FB24933340 (LiveCommunicationKit): the system call UI shows `Handle.value` and ignores `displayName` (seen on iPadOS 27.0.1). Worked around: callingx puts the caller name in the handle value.

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

`phoneNumber` is the call handle. On iOS with CallKit the handle value is `phoneNumber` and the caller name is `localizedCallerName`. With LiveCommunicationKit the `Handle` value is the caller name when one is given (the system UI shows the value and ignores `displayName`, Apple FB24933340), otherwise `phoneNumber`. Android always wraps it as the opaque Telecom address `<packageName>:<phoneNumber>` (a scheme-less address reboots ColorOS devices); it is never displayed or dialed. The Stream Video SDK passes the caller's user id on iOS and the call id on Android.

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
- `didPerformDTMFAction`
- `didActivateAudioSession`
- `didDeactivateAudioSession`

VoIP events:

- `voipNotificationsRegistered`
- `voipNotificationReceived`

## Skip the system call UI when the app is in the foreground (iOS 26.4+)

Set `skipIncomingPushInForeground: true` in `setup()` to hide the system call UI for
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
