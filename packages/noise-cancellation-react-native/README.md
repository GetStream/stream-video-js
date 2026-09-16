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
