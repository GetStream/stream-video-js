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

- `setup(options)` - required before any call action.
- `displayIncomingCall(callId, phoneNumber, callerName, hasVideo)`.
- `startCall(callId, phoneNumber, callerName, hasVideo)`.
- `setCurrentCallActive(callId)`.
- `updateDisplay(callId, phoneNumber, callerName, incoming)`.
- `endCallWithReason(callId, reason)`.
- `setMutedCall(callId, isMuted)`.
- `setOnHoldCall(callId, isOnHold)`.
- `addEventListener(eventName, callback)`.
- `getInitialEvents()` and `getInitialVoipEvents()`.
- `registerBackgroundTask(taskProvider)` / `startBackgroundTask()` / `stopBackgroundTask()` (Android).

## Event names

Call events:

- `answerCall`
- `endCall`
- `didDisplayIncomingCall`
- `didToggleHoldCallAction`
- `didPerformSetMutedCallAction`
- `didChangeAudioRoute`
- `didReceiveStartCallAction`
- `didActivateAudioSession`
- `didDeactivateAudioSession`

VoIP events:

- `voipNotificationsRegistered`
- `voipNotificationReceived`

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
