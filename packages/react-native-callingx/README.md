# react-native-callingx

A React Native Turbo Module for seamless native calling integration. This library provides a unified API to integrate with **CallKit** on iOS and the **Telecom/ConnectionService** API on Android, enabling your app to display system-level calling UI and interact with native call controls.

## Features

- 📞 **Incoming call UI** — Display native incoming call screens (even when the app is killed)
- 📲 **Outgoing call registration** — Register outgoing calls with the system
- 🎛️ **Call controls** — Mute, hold, end calls with native system integration
- 🔔 **Custom notifications** — Configurable Android notification channels
- ⚡ **Turbo Module** — Built with the New Architecture for optimal performance
- 📱 **Background support** — Handle calls when the app is backgrounded or killed

## Requirements

- React Native 0.73+ (New Architecture / Turbo Modules)
- iOS 13.0+
- Android API 26+ (Android 8.0 Oreo)

## Installation

```sh
npm install react-native-callingx
# or
yarn add react-native-callingx
```

### iOS Setup

1. Add the required background modes to your `Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>voip</string>
  <string>audio</string>
</array>
```

2. Run pod install:

```sh
cd ios && pod install
```

3. For VoIP push notifications, configure your `AppDelegate` to report incoming calls:

```objc
#import <Callingx/CallingxPublic.h>

- (void)pushRegistry:(PKPushRegistry *)registry
didReceiveIncomingPushWithPayload:(PKPushPayload *)payload
             forType:(PKPushType)type
withCompletionHandler:(void (^)(void))completion {

    // Extract call information from payload
    NSString *callId = payload.dictionaryPayload[@"call_id"];
    NSString *callerName = payload.dictionaryPayload[@"caller_name"];
    NSString *handle = payload.dictionaryPayload[@"handle"];
    BOOL hasVideo = [payload.dictionaryPayload[@"has_video"] boolValue];

    [Callingx reportNewIncomingCall:callId
                             handle:handle
                         handleType:@"generic"
                           hasVideo:hasVideo
                localizedCallerName:callerName
                    supportsHolding:YES
                       supportsDTMF:NO
                   supportsGrouping:NO
                 supportsUngrouping:NO
                        fromPushKit:YES
                            payload:payload.dictionaryPayload
              withCompletionHandler:completion];
}
```

### Android Setup

## Usage

### Setup

Initialize the module with platform-specific configuration:

```typescript
import { CallingxModule } from 'react-native-callingx';

// Setup must be called before any other method
CallingxModule.setup({
  ios: {
    appName: 'My App',
    supportsVideo: true,
    maximumCallsPerCallGroup: 1,
    maximumCallGroups: 1,
    handleType: 'generic', // 'generic' | 'number' | 'phone' | 'email'
  },
  android: {
    incomingChannel: {
      id: 'incoming_calls',
      name: 'Incoming Calls',
      sound: 'ringtone', // optional custom sound
      vibration: true,
    },
    outgoingChannel: {
      id: 'ongoing_calls',
      name: 'Ongoing Calls',
    },
    // Optional: transform display text
    titleTransformer: (name) => `Call from ${name}`,
    subtitleTransformer: (phoneNumber) => phoneNumber,
  },
});
```

### Request Permissions

Before displaying calls, request the required permissions:

```typescript
const permissions = await CallingxModule.requestPermissions();
console.log('Audio permission:', permissions.recordAudio);
console.log('Notification permission:', permissions.postNotifications);
```

### Display Incoming Call

Show the native incoming call UI:

```typescript
await CallingxModule.displayIncomingCall(
  'unique-call-id',
  '+1234567890', // phone number / handle
  'John Doe', // caller name
  true, // has video
);
```

### Start Outgoing Call

Register an outgoing call with the system:

```typescript
await CallingxModule.startCall(
  'unique-call-id',
  '+1234567890',
  'John Doe',
  false, // audio only
);
```

### Answer Call

Answer an incoming call programmatically:

```typescript
await CallingxModule.answerIncomingCall('unique-call-id');
```

### Activate Call

Mark a call as active (connected):

```typescript
await CallingxModule.setCurrentCallActive('unique-call-id');
```

### End Call

End a call with a specific reason:

```typescript
import type { EndCallReason } from 'react-native-callingx';

// Available reasons: 'local' | 'remote' | 'rejected' | 'busy' |
//                    'answeredElsewhere' | 'missed' | 'error'
await CallingxModule.endCallWithReason('unique-call-id', 'remote');
```

### Mute/Unmute

Toggle call mute state:

```typescript
await CallingxModule.setMutedCall('unique-call-id', true); // mute
await CallingxModule.setMutedCall('unique-call-id', false); // unmute
```

### Hold/Unhold

Toggle call hold state:

```typescript
await CallingxModule.setOnHoldCall('unique-call-id', true); // hold
await CallingxModule.setOnHoldCall('unique-call-id', false); // unhold
```

### Update Display

Update the caller information during a call:

```typescript
await CallingxModule.updateDisplay(
  'unique-call-id',
  '+1234567890',
  'Updated Name',
);
```

### Event Listeners

Subscribe to call events:

```typescript
import { CallingxModule } from 'react-native-callingx';
import type { EventName } from 'react-native-callingx';

// Answer event - user answered from system UI
const answerSubscription = CallingxModule.addEventListener(
  'answerCall',
  (params) => {
    console.log('Call answered:', params.callId);
  },
);

// End event - call ended
const endSubscription = CallingxModule.addEventListener('endCall', (params) => {
  console.log('Call ended:', params.callId, 'Cause:', params.cause);
});

// Hold toggle event
const holdSubscription = CallingxModule.addEventListener(
  'didToggleHoldCallAction',
  (params) => {
    console.log('Hold toggled:', params.callId, 'On hold:', params.hold);
  },
);

// Mute toggle event
const muteSubscription = CallingxModule.addEventListener(
  'didPerformSetMutedCallAction',
  (params) => {
    console.log('Mute toggled:', params.callId, 'Muted:', params.muted);
  },
);

// Start call action (outgoing call initiated from system)
const startSubscription = CallingxModule.addEventListener(
  'didReceiveStartCallAction',
  (params) => {
    console.log('Start call action:', params.callId);
  },
);

// Clean up when done
answerSubscription.remove();
endSubscription.remove();
// ... remove other subscriptions
```

### Handle Initial Events

When the app is launched from a killed state by a call action, retrieve queued events:

```typescript
// Get events that occurred before the module was initialized
const initialEvents = CallingxModule.getInitialEvents();
initialEvents.forEach((event) => {
  console.log('Initial event:', event.eventName, event.params);
});

// Clear initial events after processing
await CallingxModule.clearInitialEvents();
```

### Background Tasks (Android)

Run background tasks for call-related operations:

```typescript
// Start a managed background task
await CallingxModule.startBackgroundTask(async (taskData, stopTask) => {
  try {
    // Perform background work (e.g., connect to call server)
    await connectToCallServer();
  } finally {
    stopTask(); // Always call when done
  }
});

// Or stop manually
await CallingxModule.stopBackgroundTask();
```

## API Reference

### CallingxModule

| Method                                                           | Description                                          |
| ---------------------------------------------------------------- | ---------------------------------------------------- |
| `setup(options)`                                                 | Initialize the module with platform-specific options |
| `requestPermissions()`                                           | Request required permissions (audio, notifications)  |
| `checkPermissions()`                                             | Check current permission status                      |
| `displayIncomingCall(callId, phoneNumber, callerName, hasVideo)` | Display incoming call UI                             |
| `answerIncomingCall(callId)`                                     | Answer an incoming call                              |
| `startCall(callId, phoneNumber, callerName, hasVideo)`           | Register an outgoing call                            |
| `setCurrentCallActive(callId)`                                   | Mark call as active/connected                        |
| `updateDisplay(callId, phoneNumber, callerName)`                 | Update caller display info                           |
| `endCallWithReason(callId, reason)`                              | End call with specified reason                       |
| `setMutedCall(callId, isMuted)`                                  | Toggle call mute state                               |
| `setOnHoldCall(callId, isOnHold)`                                | Toggle call hold state                               |
| `addEventListener(eventName, callback)`                          | Subscribe to call events                             |
| `getInitialEvents()`                                             | Get queued events from app launch                    |
| `clearInitialEvents()`                                           | Clear queued initial events                          |
| `startBackgroundTask(taskProvider)`                              | Start Android background task                        |
| `stopBackgroundTask()`                                           | Stop Android background task                         |
| `log(message, level)`                                            | Log message to native console                        |

### Events

| Event                          | Parameters          | Description                       |
| ------------------------------ | ------------------- | --------------------------------- |
| `answerCall`                   | `{ callId }`        | User answered call from system UI |
| `endCall`                      | `{ callId, cause }` | Call ended                        |
| `didToggleHoldCallAction`      | `{ callId, hold }`  | Hold state changed                |
| `didPerformSetMutedCallAction` | `{ callId, muted }` | Mute state changed                |
| `didReceiveStartCallAction`    | `{ callId }`        | Outgoing call action received     |

### Types

```typescript
type EndCallReason =
  | 'local' // Call ended by local user
  | 'remote' // Call ended by remote party
  | 'rejected' // Call was rejected
  | 'busy' // Remote party is busy
  | 'answeredElsewhere' // Answered on another device
  | 'missed' // Call was missed
  | 'error'; // Call failed due to error

type CallingExpiOSOptions = {
  appName: string;
  supportsVideo?: boolean;
  maximumCallsPerCallGroup?: number;
  maximumCallGroups?: number;
  handleType?: 'generic' | 'number' | 'phone' | 'email';
};

type CallingExpAndroidOptions = {
  incomingChannel?: {
    id: string;
    name: string;
    sound?: string;
    vibration?: boolean;
  };
  outgoingChannel?: {
    id: string;
    name: string;
    sound?: string;
    vibration?: boolean;
  };
};

type PermissionsResult = {
  recordAudio: boolean;
  postNotifications: boolean;
};
```

## Troubleshooting

### iOS

- **Incoming call not showing**: Ensure `voip` background mode is enabled and VoIP push certificate is configured
- **CallKit errors**: Check that `appName` is set in setup options
- **Audio issues**: The module automatically configures the audio session, but ensure no conflicts with other audio libraries

### Android

- **Notifications not showing**: Check POST_NOTIFICATIONS permission on Android 13+
- **Call not answered on tap**: Ensure `handleCallingIntent` is called in both `onCreate` and `onNewIntent` in your MainActivity

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
