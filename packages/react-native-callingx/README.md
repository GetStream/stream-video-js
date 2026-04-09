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
    ongoingChannel: {
      id: 'ongoing_calls_channel',
      name: 'Ongoing calls',
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

## Notes

- Import from `@stream-io/react-native-callingx`.
- iOS-only helpers: `registerVoipToken`, `fulfillAnswerCallAction`, `fulfillEndCallAction`.
- Android helpers: `canPostNotifications`, `isOngoingCallsEnabled`.
