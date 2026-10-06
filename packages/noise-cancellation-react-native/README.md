# @stream-io/noise-cancellation-react-native

Noise Cancellation for React Native WebRTC

## Requirements

- React Native `>=0.79.0` with the [New Architecture](https://reactnative.dev/architecture/landing-page)
  enabled. This package ships as a TurboModule only: it is registered through the codegen
  module provider that React Native 0.79 introduced, so older versions cannot link it. On
  React Native 0.79–0.81 make sure the New Architecture is turned on; from 0.82 it is always on.
- `@stream-io/react-native-webrtc` `^145.3.1` installed as a peer dependency.

## Installation

```sh
npm install @stream-io/noise-cancellation-react-native @stream-io/react-native-webrtc
```

See the [Stream Video React Native documentation](https://getstream.io/video/docs/reactnative/)
for the native setup steps and usage.

## Direct helpers and SDK adapter

The native controls and directly exported `isEnabled()`, `setEnabled(enabled)`, and
`deviceSupportsAdvancedAudioProcessing()` helpers run synchronously and return booleans.

For these helpers, replace `.then()` / `.catch()` chains with direct calls and
`try` / `catch`:

```ts
import {
  isEnabled,
  setEnabled,
} from '@stream-io/noise-cancellation-react-native';

try {
  setEnabled(true);
  const enabled = isEnabled();
} catch (error) {
  // Handle setup errors, such as a missing native processor registration.
}
```

Errors are thrown synchronously instead of rejecting a Promise. Native exceptions
do not guarantee the former Promise rejection's `code` property. Existing `await`
calls still work, but are unnecessary for these methods. A successful setter updates
the enabled state; it does not wait for internal DSP initialization or an audio frame.

The `NoiseCancellation` class remains a Promise-based adapter for the shared Video SDK
interface. Its `isEnabled()` and `canAutoEnable()` methods return `Promise<boolean>`;
`enable()`, `disable()`, `init()`, and `dispose()` return `Promise<void>`. Native errors
become rejected Promises, and change events are dispatched after successful native
calls. Existing SDK integrations using this class do not need to change.
