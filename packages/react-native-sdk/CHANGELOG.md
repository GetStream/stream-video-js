# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## [1.38.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.38.1...@stream-io/video-react-native-sdk-1.38.2) (2026-06-12)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.53.2`
  - **client:** keep user_id populated in call event telemetry when a disconnect races an in-flight join ([#2284](https://github.com/GetStream/stream-video-js/issues/2284)) ([4403348](https://github.com/GetStream/stream-video-js/commit/4403348115500499cd60919a417d97659546bb8b))
- `@stream-io/video-react-bindings` updated to version `1.16.5`

## [1.38.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.38.0...@stream-io/video-react-native-sdk-1.38.1) (2026-06-12)

### Dependency Updates

- `@stream-io/react-native-callingx` updated to version `0.5.1`
- `@stream-io/video-client` updated to version `1.53.1`
  - **client:** Send call data in JoinInitiated event ([#2283](https://github.com/GetStream/stream-video-js/issues/2283)) ([7e9ce3e](https://github.com/GetStream/stream-video-js/commit/7e9ce3e3e3c4ebe8080f86793855a39abe7e19ef))
- `@stream-io/video-react-bindings` updated to version `1.16.4`

### Bug Fixes

- avoid constraint warning log spam in iOS PiP ([ead822b](https://github.com/GetStream/stream-video-js/commit/ead822b2d12e5f09a14d8b179f1d6a49450b2491))
- **ios:** joining a call muted may break remote audio playout ([#2282](https://github.com/GetStream/stream-video-js/issues/2282)) ([dc672a6](https://github.com/GetStream/stream-video-js/commit/dc672a69971d6ca46648696c242609c687cb42d7))

## [1.38.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.37.0...@stream-io/video-react-native-sdk-1.38.0) (2026-06-11)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.8.0`
- `@stream-io/react-native-callingx` updated to version `0.5.0`
- `@stream-io/video-filters-react-native` updated to version `0.13.0`
- `@stream-io/video-client` updated to version `1.53.0`
  - **Features**
    - **client:** Call event reporting ([#2261](https://github.com/GetStream/stream-video-js/issues/2261)) ([246b8c8](https://github.com/GetStream/stream-video-js/commit/246b8c826cccd22a09cd34391e9a773e91860fa8))
  - **Bug Fixes**
    - **client:** preserve captured stage error in call event reporting ([#2281](https://github.com/GetStream/stream-video-js/issues/2281)) ([890ce0b](https://github.com/GetStream/stream-video-js/commit/890ce0b25d0f1530ba9ebd2ef56fe366f3377312))
- `@stream-io/video-react-bindings` updated to version `1.16.3`

- upgrade Expo config-plugin (react-native-webrtc) to v15 and bump Expo SDK 56 deps ([#2276](https://github.com/GetStream/stream-video-js/issues/2276)) ([af675b8](https://github.com/GetStream/stream-video-js/commit/af675b8bd6bcf08320f748cb8be1b56bedf13937))

### Features

- webrtc 145 upgrade ([#2133](https://github.com/GetStream/stream-video-js/issues/2133)) ([07825e4](https://github.com/GetStream/stream-video-js/commit/07825e402193ed07acf1d41831545326a0ad93d9)), closes [rn-webrtc#27](https://github.com/GetStream/rn-webrtc/issues/27)

### Bug Fixes

- leave call when it was cancelled during bg ([#2277](https://github.com/GetStream/stream-video-js/issues/2277)) ([6dc77a3](https://github.com/GetStream/stream-video-js/commit/6dc77a3733c3bc7f4f87c0fd0f6a20a7a0dd1d27))

## [1.37.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.36.2...@stream-io/video-react-native-sdk-1.37.0) (2026-06-04)

### Dependency Updates

- `@stream-io/react-native-callingx` updated to version `0.4.0`

### Features

- added self managed push kit delegate management ([#2263](https://github.com/GetStream/stream-video-js/issues/2263)) ([ede4671](https://github.com/GetStream/stream-video-js/commit/ede467138a4727ccdc5cf3702b16747c516775a5))

### Bug Fixes

- adjusted voip notification gate for background ws events handling ([#2272](https://github.com/GetStream/stream-video-js/issues/2272)) ([472e425](https://github.com/GetStream/stream-video-js/commit/472e4258fe057dd9f09990bfb976e0e6093fae16))
- skip notification bg->fg transition case ([#2262](https://github.com/GetStream/stream-video-js/issues/2262)) ([e5cd46f](https://github.com/GetStream/stream-video-js/commit/e5cd46fa557d83f3de1c983d1aca2adfac9ad0ee))

## [1.36.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.36.1...@stream-io/video-react-native-sdk-1.36.2) (2026-06-01)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.7.0`
- `@stream-io/react-native-callingx` updated to version `0.3.1`
- `@stream-io/video-filters-react-native` updated to version `0.12.4`
- `@stream-io/video-client` updated to version `1.52.0`
  - **Features**
    - **client:** add hasInterruptedTrack helper ([#2266](https://github.com/GetStream/stream-video-js/issues/2266)) ([c723eb6](https://github.com/GetStream/stream-video-js/commit/c723eb67bffcb00edc03e4960a0d3a600bba8687))
    - **client:** echo negotiationId in subscriber offer answer ([#2166](https://github.com/GetStream/stream-video-js/issues/2166)) ([749e0ad](https://github.com/GetStream/stream-video-js/commit/749e0ad025d579cf2a2792e6016f5eaffb9ee7a7))
  - **Bug Fixes**
    - **client:** clamp drifted getStats timestamps to wall time ([#2258](https://github.com/GetStream/stream-video-js/issues/2258)) ([9d96df5](https://github.com/GetStream/stream-video-js/commit/9d96df552337fea27285a4260a4d1d76b39eb7b7))
  - **Other**
    - **deps:** upgrade React Native 0.85, React 19.2, Vite 8/Vitest 4, and Expo 56 ([#2268](https://github.com/GetStream/stream-video-js/issues/2268)) ([2c8ab9d](https://github.com/GetStream/stream-video-js/commit/2c8ab9d9238f3700dabbd04c9ce5bf3aaa4c7a13))
- `@stream-io/video-react-bindings` updated to version `1.16.2`

- **deps:** upgrade React Native 0.85, React 19.2, Vite 8/Vitest 4, and Expo 56 ([#2268](https://github.com/GetStream/stream-video-js/issues/2268)) ([2c8ab9d](https://github.com/GetStream/stream-video-js/commit/2c8ab9d9238f3700dabbd04c9ce5bf3aaa4c7a13))

## [1.36.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.36.0...@stream-io/video-react-native-sdk-1.36.1) (2026-05-26)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.7.0`
- `@stream-io/react-native-callingx` updated to version `0.3.1`
- `@stream-io/video-filters-react-native` updated to version `0.12.3`
- `@stream-io/video-client` updated to version `1.51.0`
  - **Features**
    - **client:** Register virtual devices ([#2220](https://github.com/GetStream/stream-video-js/issues/2220)) ([c663e2d](https://github.com/GetStream/stream-video-js/commit/c663e2df9f82cf64c38a9d3e6a1e86282107b27d))
  - **Bug Fixes**
    - **client:** bail reconnects during in-flight lifecycles and clean up listeners ([#2257](https://github.com/GetStream/stream-video-js/issues/2257)) ([f6fa17e](https://github.com/GetStream/stream-video-js/commit/f6fa17e041cef1aebeba38b06d6cfba5c085e5a6))
    - **client:** stop sending RTP after track.stop() on Firefox ([#2237](https://github.com/GetStream/stream-video-js/issues/2237)) ([5b7e9b8](https://github.com/GetStream/stream-video-js/commit/5b7e9b8bd17c43f17d66586dd88617ae91bac609))
- `@stream-io/video-react-bindings` updated to version `1.16.1`

- pinned rn version ([#2259](https://github.com/GetStream/stream-video-js/issues/2259)) ([04d192e](https://github.com/GetStream/stream-video-js/commit/04d192ed9aca73705fd5eefa8184e29ebc778eea))

## [1.36.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.35.0...@stream-io/video-react-native-sdk-1.36.0) (2026-05-25)

### Dependency Updates

- `@stream-io/react-native-callingx` updated to version `0.3.0`

- non ringing pn removal ([#2206](https://github.com/GetStream/stream-video-js/issues/2206)) ([fab78b3](https://github.com/GetStream/stream-video-js/commit/fab78b3cb6f2643a121e376a6c0166fbcacac655))

### Features

- added option to skip ringing notification in foreground ([#2213](https://github.com/GetStream/stream-video-js/issues/2213)) ([8b43986](https://github.com/GetStream/stream-video-js/commit/8b43986c89d510c75668967fde46d7cb75f1636f))

### Bug Fixes

- missing callingx iOS default audio route selection ([#2251](https://github.com/GetStream/stream-video-js/issues/2251)) ([067ebf4](https://github.com/GetStream/stream-video-js/commit/067ebf4a223d3f346fdb5edaa682272f3354af6b)), closes [#2219](https://github.com/GetStream/stream-video-js/issues/2219)
- missing safe area insets usage ([#2250](https://github.com/GetStream/stream-video-js/issues/2250)) ([932e409](https://github.com/GetStream/stream-video-js/commit/932e4090831f05b432a9935c30428a40a15c8f47))

## [1.35.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.34.0...@stream-io/video-react-native-sdk-1.35.0) (2026-05-18)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.50.0`
  - **Features**
    - **client:** honor SFU degradationPreference on the publisher ([#2241](https://github.com/GetStream/stream-video-js/issues/2241)) ([85b34a3](https://github.com/GetStream/stream-video-js/commit/85b34a39ba669b59fb1842f047a5c03c4fd196f9)), closes [#1886](https://github.com/GetStream/stream-video-js/issues/1886)
  - **Bug Fixes**
    - **client:** prevent call.join() hang on silent WS handshake stall ([#2225](https://github.com/GetStream/stream-video-js/issues/2225)) ([68cf5f0](https://github.com/GetStream/stream-video-js/commit/68cf5f05bdd1b2ecb2b14814f4702c14d84dea13))
- `@stream-io/video-react-bindings` updated to version `1.16.0`

### Features

- Automatic audio recovery ([#2240](https://github.com/GetStream/stream-video-js/issues/2240)) ([8131e5b](https://github.com/GetStream/stream-video-js/commit/8131e5b35a1c87c46d99eeaab434f8889ba5d126))

### Bug Fixes

- fixed ws reject event race condition ([#2239](https://github.com/GetStream/stream-video-js/issues/2239)) ([d3f017b](https://github.com/GetStream/stream-video-js/commit/d3f017b220f86ccc448883672bc498fcf5cfa26c))

## [1.34.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.33.0...@stream-io/video-react-native-sdk-1.34.0) (2026-05-08)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.7.0`
- `@stream-io/react-native-callingx` updated to version `0.2.0`
- `@stream-io/video-filters-react-native` updated to version `0.12.2`
- `@stream-io/video-client` updated to version `1.49.0`
  - **Features**
    - **client:** bound SFU reconnection attempts and harden ICE recovery ([#2221](https://github.com/GetStream/stream-video-js/issues/2221)) ([bf837b1](https://github.com/GetStream/stream-video-js/commit/bf837b1bbabe5ff4a9a183b5581ef7963ed6cde0))
  - **Bug Fixes**
    - **client:** capture sessionId before await in updateLocalStreamState ([#2229](https://github.com/GetStream/stream-video-js/issues/2229)) ([e48ec08](https://github.com/GetStream/stream-video-js/commit/e48ec0848651ff461a18f379283edce2359ce65a))
    - **client:** prevent screen share audio loopback by default ([#2226](https://github.com/GetStream/stream-video-js/issues/2226)) ([6877fb5](https://github.com/GetStream/stream-video-js/commit/6877fb51c168cfcc1b908dfde3c088f1af4b5c27))
    - **client:** stale local publishedTracks after mute and SFU reconnect ([#2230](https://github.com/GetStream/stream-video-js/issues/2230)) ([728147a](https://github.com/GetStream/stream-video-js/commit/728147aab154247e178d4414dd8095285844f5e1))
    - **react:** Improve background filter degradation detection ([#2210](https://github.com/GetStream/stream-video-js/issues/2210)) ([391915e](https://github.com/GetStream/stream-video-js/commit/391915e1e025ce3eaf5ebe7b135f57463ead8e42))
    - **screenshare:** disable echoCancellation by default for screen share audio ([dfc95b1](https://github.com/GetStream/stream-video-js/commit/dfc95b19ca6b723573e1c5970a3ccd6048653480))
- `@stream-io/video-react-bindings` updated to version `1.15.1`

- added expo plugins ([#2207](https://github.com/GetStream/stream-video-js/issues/2207)) ([2199149](https://github.com/GetStream/stream-video-js/commit/2199149fac1ce1db1b5d6e812660a22f6b817065))

### Features

- ongoing calls adjustments ([#2209](https://github.com/GetStream/stream-video-js/issues/2209)) ([16e2331](https://github.com/GetStream/stream-video-js/commit/16e23319bb352d5b28a6a67c5fa97dbdf757ba1a))

## [1.33.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.32.4...@stream-io/video-react-native-sdk-1.33.0) (2026-04-28)

### Dependency Updates

- `@stream-io/react-native-callingx` updated to version `0.1.1`
- `@stream-io/video-filters-react-native` updated to version `0.12.1`
- `@stream-io/video-client` updated to version `1.48.0`
- `@stream-io/video-react-bindings` updated to version `1.15.0`

### Features

- audio connecting hook in bindings and RN UI ([#2214](https://github.com/GetStream/stream-video-js/issues/2214)) ([44c38fa](https://github.com/GetStream/stream-video-js/commit/44c38faaccb5327f6cd5cd6e70781bad93deafaf))
- **rn:** remove peer connection usage in speech detection ([#2200](https://github.com/GetStream/stream-video-js/issues/2200)) ([1c73d10](https://github.com/GetStream/stream-video-js/commit/1c73d10cc25761c08a8f9350e44137afaee33acf))

### Bug Fixes

- **rn:** perf and stability fixes for video-filters ([#2216](https://github.com/GetStream/stream-video-js/issues/2216)) ([db1405b](https://github.com/GetStream/stream-video-js/commit/db1405b02a5745ee14a54a76a164c47ed59f56c6))

## [1.32.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.32.3...@stream-io/video-react-native-sdk-1.32.4) (2026-04-23)

### Bug Fixes

- callingx listeners did not work on relogin ([#2215](https://github.com/GetStream/stream-video-js/issues/2215)) ([2bc02b9](https://github.com/GetStream/stream-video-js/commit/2bc02b916ba5d4143d38890b9afa9f55b943836f))

## [1.32.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.32.2...@stream-io/video-react-native-sdk-1.32.3) (2026-04-15)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.47.0`
  - **Features**
    - **client:** JoinCall with hints for high scale livestream ([#2199](https://github.com/GetStream/stream-video-js/issues/2199)) ([704681a](https://github.com/GetStream/stream-video-js/commit/704681ad9ce7a0013325b6db91644e1907d0db0b))
  - **Bug Fixes**
    - **client:** align device preference persistence with permission and track end events ([#2196](https://github.com/GetStream/stream-video-js/issues/2196)) ([b4ed7c2](https://github.com/GetStream/stream-video-js/commit/b4ed7c2c6bc6fb6777a411b69747ccc36aa82f44))
- `@stream-io/video-react-bindings` updated to version `1.14.2`

## [1.32.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.32.1...@stream-io/video-react-native-sdk-1.32.2) (2026-04-09)

### Dependency Updates

- `@stream-io/react-native-callingx` updated to version `0.1.1`

## [1.32.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.32.0...@stream-io/video-react-native-sdk-1.32.1) (2026-04-09)

### Dependency Updates

- `@stream-io/react-native-callingx` updated to version `0.1.0`
- `@stream-io/video-client` updated to version `1.46.1`
  - **Bug Fixes**
    - ignore late ICE candidates after cleanup for RN speech detector ([#2193](https://github.com/GetStream/stream-video-js/issues/2193)) ([f8735d6](https://github.com/GetStream/stream-video-js/commit/f8735d604d86fc476b9b7e01eed0af03176625be))
  - **Other**
    - remove listeners and stop even on permission error - rn speech detector ([f4fdd9e](https://github.com/GetStream/stream-video-js/commit/f4fdd9e1a008b52011ef18562152aad60a1f7936))
- `@stream-io/video-react-bindings` updated to version `1.14.1`

## [1.32.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.31.1...@stream-io/video-react-native-sdk-1.32.0) (2026-04-09)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.7.0`
- `@stream-io/react-native-callingx` updated to version `0.1.0`
- `@stream-io/video-filters-react-native` updated to version `0.12.0`
- `@stream-io/video-client` updated to version `1.46.0`
  - **Features**
    - **client:** expose blocked autoplay audio state and explicit resume API ([#2187](https://github.com/GetStream/stream-video-js/issues/2187)) ([adbec63](https://github.com/GetStream/stream-video-js/commit/adbec63a23d47cf7c1002897e242c3f2a6a7007c))
  - **Bug Fixes**
    - **client:** deduplicate mic.capture_report trace emissions ([#2189](https://github.com/GetStream/stream-video-js/issues/2189)) ([152ae90](https://github.com/GetStream/stream-video-js/commit/152ae907910616e79bc20321bc56df4cfe0dcc4a))
    - **client:** support server-side pinning on participant join ([#2190](https://github.com/GetStream/stream-video-js/issues/2190)) ([2c354a4](https://github.com/GetStream/stream-video-js/commit/2c354a4b05f688766663bd13e0da7da601c8971d))
- `@stream-io/video-react-bindings` updated to version `1.14.0`

### Features

- callkit/telecom integration ([#2028](https://github.com/GetStream/stream-video-js/issues/2028)) ([d579acd](https://github.com/GetStream/stream-video-js/commit/d579acd1975fb4945e40452b27e372694c737628))

## [1.31.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.31.0...@stream-io/video-react-native-sdk-1.31.1) (2026-04-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.45.0`
  - **Features**
    - **client:** Disconnected device event ([#2178](https://github.com/GetStream/stream-video-js/issues/2178)) ([5017ca0](https://github.com/GetStream/stream-video-js/commit/5017ca0fd53f5d203167d55227cb7fddc055705a))
  - **Bug Fixes**
    - **client:** warn about dangling audio bindings only for published audio tracks ([#2183](https://github.com/GetStream/stream-video-js/issues/2183)) ([ff47662](https://github.com/GetStream/stream-video-js/commit/ff47662484cd666cf321b61d9b49dd4eb161192f))
- `@stream-io/video-react-bindings` updated to version `1.13.15`

### Bug Fixes

- **pins:** render the "pin" indicator regardless of "unpin" capabilities ([#2179](https://github.com/GetStream/stream-video-js/issues/2179)) ([f78cf41](https://github.com/GetStream/stream-video-js/commit/f78cf4115f7fb3f3eb799ac406c3f56cc691c942))

## [1.31.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.30.5...@stream-io/video-react-native-sdk-1.31.0) (2026-03-31)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.6.0`
- `@stream-io/video-filters-react-native` updated to version `0.11.0`

### Features

- screen share audio ([#2157](https://github.com/GetStream/stream-video-js/issues/2157)) ([ba3b9d8](https://github.com/GetStream/stream-video-js/commit/ba3b9d8c2168d7c1cd66050524a5dc0a0f7e3e6e))

## [1.30.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.30.4...@stream-io/video-react-native-sdk-1.30.5) (2026-03-27)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.44.5`
  - make WebAudio opt-in, add AudioBindingsWatchdog ([#2171](https://github.com/GetStream/stream-video-js/issues/2171)) ([8d00f48](https://github.com/GetStream/stream-video-js/commit/8d00f485a37fec23dca340d32738a3cb1f7f325a))
- `@stream-io/video-react-bindings` updated to version `1.13.14`
  - **react:** reset recording toggle state and expose record button errors ([#2174](https://github.com/GetStream/stream-video-js/issues/2174)) ([2af6347](https://github.com/GetStream/stream-video-js/commit/2af63478ad9050bf339212537a6cb424f97387b8))

## [1.30.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.30.3...@stream-io/video-react-native-sdk-1.30.4) (2026-03-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.44.4`
  - **Bug Fixes**
    - **react:** remove default broken microphone notification from call controls ([#2158](https://github.com/GetStream/stream-video-js/issues/2158)) ([4a95b9c](https://github.com/GetStream/stream-video-js/commit/4a95b9c29e9d2728ae7eea764f07ec8507aa0f5a))
  - **Other**
    - trace device permission state transitions ([#2168](https://github.com/GetStream/stream-video-js/issues/2168)) ([e4203a3](https://github.com/GetStream/stream-video-js/commit/e4203a34cad1c90d1bc5612fc379dd1f0f0ebe5d))
- `@stream-io/video-react-bindings` updated to version `1.13.13`

## [1.30.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.30.2...@stream-io/video-react-native-sdk-1.30.3) (2026-03-06)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.44.3`
  - **client:** prevent concurrent SFU updateSubscriptions during reconnects ([#2155](https://github.com/GetStream/stream-video-js/issues/2155)) ([1ac32d2](https://github.com/GetStream/stream-video-js/commit/1ac32d261c9a54aa8e3636a60e3c8f3e1407ae16))
- `@stream-io/video-react-bindings` updated to version `1.13.12`

## [1.30.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.30.1...@stream-io/video-react-native-sdk-1.30.2) (2026-03-06)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.5.1`
- `@stream-io/video-filters-react-native` updated to version `0.10.1`
- `@stream-io/video-client` updated to version `1.44.2`
  - do not setup speaker early for ringing type calls ([#2154](https://github.com/GetStream/stream-video-js/issues/2154)) ([57adb90](https://github.com/GetStream/stream-video-js/commit/57adb90f03cfaceb4e6d3c050feaea239b80b1d9))
- `@stream-io/video-react-bindings` updated to version `1.13.11`

### Bug Fixes

- support prebuilt RN iOS app ([#2151](https://github.com/GetStream/stream-video-js/issues/2151)) ([372488c](https://github.com/GetStream/stream-video-js/commit/372488ce5d03a715d6670723ae593c940c3bff07))

## [1.30.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.30.0...@stream-io/video-react-native-sdk-1.30.1) (2026-03-04)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.44.1`
  - **client:** handle SFU tag changes during reconnect ([#2149](https://github.com/GetStream/stream-video-js/issues/2149)) ([5aa89d3](https://github.com/GetStream/stream-video-js/commit/5aa89d378a73d33d8e46a6eb40e688bd0f50cca9)), closes [#2121](https://github.com/GetStream/stream-video-js/issues/2121)
- `@stream-io/video-react-bindings` updated to version `1.13.10`

### Bug Fixes

- **react-native-sdk:** remove lodash.merge from theme context ([#2143](https://github.com/GetStream/stream-video-js/issues/2143)) ([d5bae28](https://github.com/GetStream/stream-video-js/commit/d5bae281585135f02a1e72425b7b4863c40a55a2))

## [1.30.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.29.4...@stream-io/video-react-native-sdk-1.30.0) (2026-02-27)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.44.0`
  - **Features**
    - **react:** Deprecate usePersistedDevicePreferences and move the logic to the SDK core ([#2108](https://github.com/GetStream/stream-video-js/issues/2108)) ([7bbbd93](https://github.com/GetStream/stream-video-js/commit/7bbbd93bdd93dd4ebed02c089b6a4ab8423135fd))
    - **react:** Embeddable/pre-built video components ([#2117](https://github.com/GetStream/stream-video-js/issues/2117)) ([11b4b9f](https://github.com/GetStream/stream-video-js/commit/11b4b9f0438877a5917c95117474cedc1f693907))
  - **Bug Fixes**
    - allow anonymous StreamVideoClientOptions to accept token fields ([#2142](https://github.com/GetStream/stream-video-js/issues/2142)) ([165a9c3](https://github.com/GetStream/stream-video-js/commit/165a9c305dda6cae0fde78c446825a7da11f302c)), closes [#2138](https://github.com/GetStream/stream-video-js/issues/2138)
    - Allow guest and anonymous users without auth options ([#2140](https://github.com/GetStream/stream-video-js/issues/2140)) ([12749ae](https://github.com/GetStream/stream-video-js/commit/12749ae2552a2b8c0442cb8beaa34e13f66cc7e6)), closes [#2138](https://github.com/GetStream/stream-video-js/issues/2138)
    - Strengthen StreamVideoClientOptions types and align React sample apps ([#2138](https://github.com/GetStream/stream-video-js/issues/2138)) ([915f990](https://github.com/GetStream/stream-video-js/commit/915f9904e045f61593c7328f790cd54516c80213))
  - **Other**
    - update agent instructions [skip ci] ([9cec4c6](https://github.com/GetStream/stream-video-js/commit/9cec4c6431ff51549fcfc870a0df935b0b8aa850))
- `@stream-io/video-react-bindings` updated to version `1.13.9`

### Features

- Enhanced Picture-in-Picture for iOS ([#2139](https://github.com/GetStream/stream-video-js/issues/2139)) ([2111607](https://github.com/GetStream/stream-video-js/commit/211160797c6e50a4d548da617cb9a57ee7825c4e))

## [1.29.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.29.3...@stream-io/video-react-native-sdk-1.29.4) (2026-02-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.43.0`
  - **Features**
    - **client:** add list recording APIs and deprecate query methods ([#2135](https://github.com/GetStream/stream-video-js/issues/2135)) ([5331cb5](https://github.com/GetStream/stream-video-js/commit/5331cb5205466dc052c729fb07d84209208af362))
  - **Bug Fixes**
    - **client:** harden flat-line no-audio detection ([#2131](https://github.com/GetStream/stream-video-js/issues/2131)) ([9c2aa22](https://github.com/GetStream/stream-video-js/commit/9c2aa222b189c5e24510430dfddbf164555abf1c))
    - **client:** prevent stale speaking-while-muted detector ([#2130](https://github.com/GetStream/stream-video-js/issues/2130)) ([e5c408d](https://github.com/GetStream/stream-video-js/commit/e5c408d73de1b8f20e775642b0b19eb0ffd979a8))
  - **Other**
    - **client:** trace updatePublishOptions overrides ([#2136](https://github.com/GetStream/stream-video-js/issues/2136)) ([bcc1e92](https://github.com/GetStream/stream-video-js/commit/bcc1e92ac89374324a57d1df85be38a2661a4c53))
- `@stream-io/video-react-bindings` updated to version `1.13.8`

## [1.29.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.29.2...@stream-io/video-react-native-sdk-1.29.3) (2026-02-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.42.3`
- `@stream-io/video-react-bindings` updated to version `1.13.7`

### Bug Fixes

- guard from parallel accept/reject invocations ([#2127](https://github.com/GetStream/stream-video-js/issues/2127)) ([621218f](https://github.com/GetStream/stream-video-js/commit/621218f4ab6b4623370fd66f1b02b8cb7cb1baad))

## [1.29.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.29.1...@stream-io/video-react-native-sdk-1.29.2) (2026-02-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.42.2`
  - improve the handling of join errors and prevent cross-socket event leaking ([#2121](https://github.com/GetStream/stream-video-js/issues/2121)) ([72d0834](https://github.com/GetStream/stream-video-js/commit/72d08343243990f14f29103734eea6f7cb6092c9))
- `@stream-io/video-react-bindings` updated to version `1.13.6`

## [1.29.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.29.0...@stream-io/video-react-native-sdk-1.29.1) (2026-02-10)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.42.1`
- `@stream-io/video-react-bindings` updated to version `1.13.5`

### Bug Fixes

- respect device permissions when detecting speech while muted ([#2115](https://github.com/GetStream/stream-video-js/issues/2115)) ([fe98768](https://github.com/GetStream/stream-video-js/commit/fe98768a9bf695fc5355905939884594c11ac2b9)), closes [#2110](https://github.com/GetStream/stream-video-js/issues/2110)
- **rn:** expose `mirror` prop for Picture-in-Picture ([#2113](https://github.com/GetStream/stream-video-js/issues/2113)) ([da72e48](https://github.com/GetStream/stream-video-js/commit/da72e4812a0177a1059aeecc54dd88894b99a610)), closes [#2106](https://github.com/GetStream/stream-video-js/issues/2106)

## [1.29.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.28.3...@stream-io/video-react-native-sdk-1.29.0) (2026-02-06)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.42.0`
  - **Features**
    - Detectors for broken microphone setup ([#2090](https://github.com/GetStream/stream-video-js/issues/2090)) ([552b3f4](https://github.com/GetStream/stream-video-js/commit/552b3f4e3c54e0b6fa67221cd510f4ea1f6f8a61))
  - **Bug Fixes**
    - **react:** apply defaultConstraints to speaking-while-muted detection stream ([#2103](https://github.com/GetStream/stream-video-js/issues/2103)) ([28b5538](https://github.com/GetStream/stream-video-js/commit/28b55380778723fc308d37396c8095a5a3ef7aa2))
    - start speaking while muted detection in pristine state too ([#2110](https://github.com/GetStream/stream-video-js/issues/2110)) ([bc093bc](https://github.com/GetStream/stream-video-js/commit/bc093bc3ac2451541524b134a9044131a69964af))
- `@stream-io/video-react-bindings` updated to version `1.13.4`

### Features

- **layouts:** overridable participant mirroring ([#2106](https://github.com/GetStream/stream-video-js/issues/2106)) ([e1c5f31](https://github.com/GetStream/stream-video-js/commit/e1c5f31f33bce4ab0636f0476263a24220811cb4))

## [1.28.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.28.2...@stream-io/video-react-native-sdk-1.28.3) (2026-01-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.41.3`
  - **react:** improve logic for calculating the lower / upper threshold for video filter degradation ([#2094](https://github.com/GetStream/stream-video-js/issues/2094)) ([5cd2d5c](https://github.com/GetStream/stream-video-js/commit/5cd2d5cb34fc7bbdfaf9529eb9f8d33a40346cab))
  - **stats:** adjust send stats frequency and include "leave reason" ([#2104](https://github.com/GetStream/stream-video-js/issues/2104)) ([0182832](https://github.com/GetStream/stream-video-js/commit/018283299bebe5d5078d4006ec86b6cd56884e77))
- `@stream-io/video-react-bindings` updated to version `1.13.3`

## [1.28.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.28.1...@stream-io/video-react-native-sdk-1.28.2) (2026-01-28)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.41.2`
  - deduplicate RN compatibility assertions ([#2101](https://github.com/GetStream/stream-video-js/issues/2101)) ([5b9e6bc](https://github.com/GetStream/stream-video-js/commit/5b9e6bc227c55b067eea6345315bca015c8a7ee4))
- `@stream-io/video-react-bindings` updated to version `1.13.2`

## [1.28.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.28.0...@stream-io/video-react-native-sdk-1.28.1) (2026-01-26)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.41.1`
  - **safari:** Handle interrupted AudioContext and AudioSession states ([#2098](https://github.com/GetStream/stream-video-js/issues/2098)) ([975901f](https://github.com/GetStream/stream-video-js/commit/975901f399b46479928ec1e9f32da7e47bba9ad3))
- `@stream-io/video-react-bindings` updated to version `1.13.1`

### Bug Fixes

- always forward callkit audio events to webrtc ([#2089](https://github.com/GetStream/stream-video-js/issues/2089)) ([767041a](https://github.com/GetStream/stream-video-js/commit/767041a54dfaaa87145cbdc931a336dbe4fee821))
- use multiple settings to determine default audio device RN-338 ([#2096](https://github.com/GetStream/stream-video-js/issues/2096)) ([19cf136](https://github.com/GetStream/stream-video-js/commit/19cf13651112b647903587a84a70a555fc68fc9c)), closes [2BSettingsPriority.swift#L19](https://github.com/GetStream/2BSettingsPriority.swift/issues/L19)

## [1.28.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.27.4...@stream-io/video-react-native-sdk-1.28.0) (2026-01-20)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.5.0`
- `@stream-io/video-filters-react-native` updated to version `0.10.0`
- `@stream-io/video-client` updated to version `1.41.0`
  - **Features**
    - **recording:** Support for Individual, Raw and Composite recording ([#2071](https://github.com/GetStream/stream-video-js/issues/2071)) ([e53269c](https://github.com/GetStream/stream-video-js/commit/e53269ce697121b70dbebaf4a6d2cf875440a2af))
  - **Bug Fixes**
    - add start bitrate even if there is no existing fmtp line ([#2088](https://github.com/GetStream/stream-video-js/issues/2088)) ([ae1f496](https://github.com/GetStream/stream-video-js/commit/ae1f4965a7ab0b00dbdea45090c6aed49eafabb7))
- `@stream-io/video-react-bindings` updated to version `1.13.0`

### Features

- stereo audio output support RN-332 ([#2038](https://github.com/GetStream/stream-video-js/issues/2038)) ([2938037](https://github.com/GetStream/stream-video-js/commit/2938037d18e70ccf112a089eb3ec44cb034aed1d))

## [1.27.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.27.3...@stream-io/video-react-native-sdk-1.27.4) (2026-01-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.40.3`
  - **react:** resolve call state race condition when using join with ring ([#2086](https://github.com/GetStream/stream-video-js/issues/2086)) ([6c2d3b3](https://github.com/GetStream/stream-video-js/commit/6c2d3b35ac96dbf7a85cadba47068a0e417d65be)), closes [#1755](https://github.com/GetStream/stream-video-js/issues/1755) [#2035](https://github.com/GetStream/stream-video-js/issues/2035)
  - **react:** resolve call state race condition when using join with ring ([#2084](https://github.com/GetStream/stream-video-js/issues/2084)) ([f9b5946](https://github.com/GetStream/stream-video-js/commit/f9b59465f22b35304dbd01601e3f6166e1d02ea0)), closes [#1755](https://github.com/GetStream/stream-video-js/issues/1755) [#2035](https://github.com/GetStream/stream-video-js/issues/2035)
- `@stream-io/video-react-bindings` updated to version `1.12.10`

### Bug Fixes

- do not disable camera on Android unnecessarily RN-335 ([#2085](https://github.com/GetStream/stream-video-js/issues/2085)) ([e4dfa39](https://github.com/GetStream/stream-video-js/commit/e4dfa39b7a001e60fee73db01d717ed8eb05d9b0))

## [1.27.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.27.2...@stream-io/video-react-native-sdk-1.27.3) (2026-01-15)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.40.2`
  - handle unrecoverable SFU join errors ([9b8198d](https://github.com/GetStream/stream-video-js/commit/9b8198d00e901a8eade169495a14d25c8d3bdf1e))
  - handle unrecoverable SFU join errors ([#2083](https://github.com/GetStream/stream-video-js/issues/2083)) ([6ffb576](https://github.com/GetStream/stream-video-js/commit/6ffb5761b3dfb8e649cfa4f16dd30d294475eeae))
- `@stream-io/video-react-bindings` updated to version `1.12.9`

## [1.27.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.27.1...@stream-io/video-react-native-sdk-1.27.2) (2026-01-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.40.1`
  - ensure proper set up of server-side preferences for mic and camera ([#2080](https://github.com/GetStream/stream-video-js/issues/2080)) ([3529c8f](https://github.com/GetStream/stream-video-js/commit/3529c8fc0233d3f9f8f21c80cffc4ec27334954f))
- `@stream-io/video-react-bindings` updated to version `1.12.8`

## [1.27.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.27.0...@stream-io/video-react-native-sdk-1.27.1) (2026-01-09)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.40.0`
  - Call Stats Map ([#2025](https://github.com/GetStream/stream-video-js/issues/2025)) ([6c784f0](https://github.com/GetStream/stream-video-js/commit/6c784f0acacce3d23d0f589ff423d6a0d04c1e95))
- `@stream-io/video-react-bindings` updated to version `1.12.7`

## [1.27.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.26.6...@stream-io/video-react-native-sdk-1.27.0) (2025-12-30)

### Features

- **react-native:** expose useModeration hook ([#2073](https://github.com/GetStream/stream-video-js/issues/2073)) ([4105ee7](https://github.com/GetStream/stream-video-js/commit/4105ee7c79aa1a1a35d75b4f5f70594eaa7eb33a)), closes [#1822](https://github.com/GetStream/stream-video-js/issues/1822)

### Bug Fixes

- correctly restore background blur if available ([b16ffc0](https://github.com/GetStream/stream-video-js/commit/b16ffc0ade1b88437b09fe918deea30d314a530b))

## [1.26.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.26.5...@stream-io/video-react-native-sdk-1.26.6) (2025-12-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.39.3`
  - adjusted shouldRejectCall implementation ([#2072](https://github.com/GetStream/stream-video-js/issues/2072)) ([2107e3d](https://github.com/GetStream/stream-video-js/commit/2107e3db65309664a7797cacae054aeb7a371f4a))
  - **rpc:** Reliable SFU request timeouts ([#2066](https://github.com/GetStream/stream-video-js/issues/2066)) ([f842b74](https://github.com/GetStream/stream-video-js/commit/f842b74109af02c8454f5ff4f6618baac650ed4e))
- `@stream-io/video-react-bindings` updated to version `1.12.6`

### Bug Fixes

- replace non-compliant foreground service types ([#2058](https://github.com/GetStream/stream-video-js/issues/2058)) ([d62ca2b](https://github.com/GetStream/stream-video-js/commit/d62ca2bb6defd58e44ed1ac135b95896b590d307))

## [1.26.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.26.4...@stream-io/video-react-native-sdk-1.26.5) (2025-12-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.39.2`
  - **Bug Fixes**
    - **safari:** verify that AudioContext supports `setSinkId` ([#2069](https://github.com/GetStream/stream-video-js/issues/2069)) ([e7fbe10](https://github.com/GetStream/stream-video-js/commit/e7fbe10d06acce52a2e3f4f7d008882fa23e9c89))
    - slow rampup on vp9/h264 codec ([#2056](https://github.com/GetStream/stream-video-js/issues/2056)) ([b5ad360](https://github.com/GetStream/stream-video-js/commit/b5ad360eab83a139198d05b4f42b777315135ab6))
  - **Other**
    - upgrade stream dependencies ([#2065](https://github.com/GetStream/stream-video-js/issues/2065)) ([04ca858](https://github.com/GetStream/stream-video-js/commit/04ca858517072f861c1ddae0876f0b425ca658e2))
- `@stream-io/video-react-bindings` updated to version `1.12.5`

### Bug Fixes

- do not set invalid BT devices as communication device ([#2064](https://github.com/GetStream/stream-video-js/issues/2064)) ([fe41a34](https://github.com/GetStream/stream-video-js/commit/fe41a349df41c11e05b673e6107788203e94fae9))

## [1.26.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.26.3...@stream-io/video-react-native-sdk-1.26.4) (2025-12-18)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.4.4`
- `@stream-io/video-filters-react-native` updated to version `0.9.3`
- `@stream-io/video-client` updated to version `1.39.1`
- `@stream-io/video-react-bindings` updated to version `1.12.4`

### Bug Fixes

- **provenance:** add repository info to every package ([4159633](https://github.com/GetStream/stream-video-js/commit/4159633b908afe6542b4be53151da6218175426c))

## [1.26.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.26.2...@stream-io/video-react-native-sdk-1.26.3) (2025-12-18)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.4.3`
- `@stream-io/video-client` updated to version `1.39.0`
  - **Features**
    - **react:** Retryable call watching ([#2046](https://github.com/GetStream/stream-video-js/issues/2046)) ([7205011](https://github.com/GetStream/stream-video-js/commit/7205011a451995585848b89388c91ae9a1b0bc64))
  - **Bug Fixes**
    - add response tracing for the SetPublisher RPC ([#2055](https://github.com/GetStream/stream-video-js/issues/2055)) ([a25d9a8](https://github.com/GetStream/stream-video-js/commit/a25d9a89870db47be046f31c85888995e43d44cd))
- `@stream-io/video-react-bindings` updated to version `1.12.3`

### Bug Fixes

- stop of android system prompt from screenshare overlay ([#2052](https://github.com/GetStream/stream-video-js/issues/2052)) ([b1a5b46](https://github.com/GetStream/stream-video-js/commit/b1a5b46553df18897126c1e59066ff79e0e0704c))

## [1.26.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.26.1...@stream-io/video-react-native-sdk-1.26.2) (2025-12-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.38.2`
  - revert usage of useSyncExternalStore ([#2043](https://github.com/GetStream/stream-video-js/issues/2043)) ([849e896](https://github.com/GetStream/stream-video-js/commit/849e8964ac90d5785a6d608443f80156d1081744)), closes [#1953](https://github.com/GetStream/stream-video-js/issues/1953) [#2034](https://github.com/GetStream/stream-video-js/issues/2034) [#2006](https://github.com/GetStream/stream-video-js/issues/2006) [#2008](https://github.com/GetStream/stream-video-js/issues/2008)
- `@stream-io/video-react-bindings` updated to version `1.12.2`

## [1.26.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.26.0...@stream-io/video-react-native-sdk-1.26.1) (2025-12-08)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.38.1`
  - added call state update for handling case when call.ring event as not triggered ([#2035](https://github.com/GetStream/stream-video-js/issues/2035)) ([3c79665](https://github.com/GetStream/stream-video-js/commit/3c79665323ad5172d3af35e9ee2f86655ac11670))
  - **state:** ensure stable empty array for participant predicates ([#2036](https://github.com/GetStream/stream-video-js/issues/2036)) ([1aa72c8](https://github.com/GetStream/stream-video-js/commit/1aa72c8daf482bd157866960b4b9a92e272ac90b)), closes [#2034](https://github.com/GetStream/stream-video-js/issues/2034) [#2008](https://github.com/GetStream/stream-video-js/issues/2008)
- `@stream-io/video-react-bindings` updated to version `1.12.1`

## [1.26.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.25.0...@stream-io/video-react-native-sdk-1.26.0) (2025-12-08)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.4.2`
- `@stream-io/video-filters-react-native` updated to version `0.9.2`
- `@stream-io/video-client` updated to version `1.38.0`
  - **react:** Extend the statistics report with audio stats ([#2020](https://github.com/GetStream/stream-video-js/issues/2020)) ([0f4df3c](https://github.com/GetStream/stream-video-js/commit/0f4df3ce5f3b865c8ef09766dd72bc33f65539f3))
- `@stream-io/video-react-bindings` updated to version `1.12.0`

- remove default sound from jsdoc comment for notifications ([8f38784](https://github.com/GetStream/stream-video-js/commit/8f38784c41808fb65a31f2e5591a71c32b201eca))
- **sample:** add benchmark environment ([#2032](https://github.com/GetStream/stream-video-js/issues/2032)) ([8bb7044](https://github.com/GetStream/stream-video-js/commit/8bb70447ca5b6fc3e0a3bad09f2bf1f91a4fa881))

### Features

- **LivestreamLayout:** Enrich with mute option and humanized participant count ([#2027](https://github.com/GetStream/stream-video-js/issues/2027)) ([cdc0c4f](https://github.com/GetStream/stream-video-js/commit/cdc0c4f985ab15a6c2e184b73432911510b43f99))

## [1.25.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.24.7...@stream-io/video-react-native-sdk-1.25.0) (2025-11-28)

### Features

- add native methods to check for hardware presence in android RN-310 ([#2023](https://github.com/GetStream/stream-video-js/issues/2023)) ([90fddbc](https://github.com/GetStream/stream-video-js/commit/90fddbc22d9c21e51e2322c69031d81a30de063f))

## [1.24.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.24.6...@stream-io/video-react-native-sdk-1.24.7) (2025-11-25)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.4.2`
- `@stream-io/video-client` updated to version `1.37.3`
  - instructions for Claude and other coding agents ([#2012](https://github.com/GetStream/stream-video-js/issues/2012)) ([08a3459](https://github.com/GetStream/stream-video-js/commit/08a345954f7cb5b1fae5a4b39b5b585bf1f631ec))
- `@stream-io/video-react-bindings` updated to version `1.11.4`

- instructions for Claude and other coding agents ([#2012](https://github.com/GetStream/stream-video-js/issues/2012)) ([08a3459](https://github.com/GetStream/stream-video-js/commit/08a345954f7cb5b1fae5a4b39b5b585bf1f631ec))

### Bug Fixes

- **noise cancellation:** delay toggling until initialization is finished ([#2014](https://github.com/GetStream/stream-video-js/issues/2014)) ([d28b8ea](https://github.com/GetStream/stream-video-js/commit/d28b8ea282322a25688ff48966b0dc10dd7e60bd))

## [1.24.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.24.5...@stream-io/video-react-native-sdk-1.24.6) (2025-11-20)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.4.1`
- `@stream-io/video-filters-react-native` updated to version `0.9.1`
- `@stream-io/video-client` updated to version `1.37.2`
  - **react-bindings:** getSnapshot caching ([#2008](https://github.com/GetStream/stream-video-js/issues/2008)) ([ed0983c](https://github.com/GetStream/stream-video-js/commit/ed0983cf2d1525a2faaa0b9e9387ac448b35c8e1)), closes [#2006](https://github.com/GetStream/stream-video-js/issues/2006) [#1953](https://github.com/GetStream/stream-video-js/issues/1953)
- `@stream-io/video-react-bindings` updated to version `1.11.3`

- update react-native to 0.81.5 ([33554fc](https://github.com/GetStream/stream-video-js/commit/33554fc31015f4af57ba19b1f925b19fbfcbe0ea))

## [1.24.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.24.4...@stream-io/video-react-native-sdk-1.24.5) (2025-11-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.37.1`
- `@stream-io/video-react-bindings` updated to version `1.11.2`

- remove outdated comment ([2323e27](https://github.com/GetStream/stream-video-js/commit/2323e27b7e50f82e8ef2a3d0d12f1012025b3e50))

### Bug Fixes

- dynascale manager doesnt pick up updated dimensions all the time ([#2001](https://github.com/GetStream/stream-video-js/issues/2001)) ([d91e008](https://github.com/GetStream/stream-video-js/commit/d91e008f27fa2a4324f22555fbe0a59afe702bbb))

## [1.24.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.24.3...@stream-io/video-react-native-sdk-1.24.4) (2025-11-14)

### Dependency Updates

- `@stream-io/video-filters-react-native` updated to version `0.9.0`
- `@stream-io/video-client` updated to version `1.37.0`
  - ring individual members ([#1755](https://github.com/GetStream/stream-video-js/issues/1755)) ([57564d6](https://github.com/GetStream/stream-video-js/commit/57564d63f21da7b95b582f74c88b24af7e77659c))
- `@stream-io/video-react-bindings` updated to version `1.11.1`

## [1.24.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.24.2...@stream-io/video-react-native-sdk-1.24.3) (2025-11-12)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.36.1`
  - enforce the client to publish options on SDP level ([#1976](https://github.com/GetStream/stream-video-js/issues/1976)) ([1d93f72](https://github.com/GetStream/stream-video-js/commit/1d93f72cb4395aaf9b487eb66e0c3b6a8111aca4))
- `@stream-io/video-react-bindings` updated to version `1.11.0`
  - **react-bindings:** integrate useSyncExternalStore in useObservableValue ([#1953](https://github.com/GetStream/stream-video-js/issues/1953)) ([ad4b147](https://github.com/GetStream/stream-video-js/commit/ad4b147713f40c96658ddaf70a01d7ca8e369a14))

### Bug Fixes

- improve android wake lock and power manager handling RN-291 ([#1990](https://github.com/GetStream/stream-video-js/issues/1990)) ([28096ad](https://github.com/GetStream/stream-video-js/commit/28096ad9b14848b352afa358dcaf655cbcfb0626)), closes [#1971](https://github.com/GetStream/stream-video-js/issues/1971)
- missing adaptive floating dimensions for landscape video ([#1983](https://github.com/GetStream/stream-video-js/issues/1983)) ([7803f2c](https://github.com/GetStream/stream-video-js/commit/7803f2cd80e9680974803fb72b3e5b4bf8caba7c))

## [1.24.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.24.1...@stream-io/video-react-native-sdk-1.24.2) (2025-11-05)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.4.1`
- `@stream-io/video-filters-react-native` updated to version `0.8.1`

### Bug Fixes

- noise cancellation webrtc 137 support and dev dep and sampleapp webrtc updates ([#1974](https://github.com/GetStream/stream-video-js/issues/1974)) ([c555695](https://github.com/GetStream/stream-video-js/commit/c555695e53018412ea8964a2e222daa99a9544e5))

## [1.24.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.24.0...@stream-io/video-react-native-sdk-1.24.1) (2025-11-04)

### Bug Fixes

- ios callkit related audio inconsistencies ([#1982](https://github.com/GetStream/stream-video-js/issues/1982)) ([112e380](https://github.com/GetStream/stream-video-js/commit/112e38090be4e41d1554a966af1f6e15965ea786))
- no video if camera is disabled on init and then enabled ([#1981](https://github.com/GetStream/stream-video-js/issues/1981)) ([b30ca34](https://github.com/GetStream/stream-video-js/commit/b30ca34eb598eb61716f3e4d389ffaf31236b90e))

## [1.24.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.23.0...@stream-io/video-react-native-sdk-1.24.0) (2025-10-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.36.0`
- `@stream-io/video-react-bindings` updated to version `1.10.4`

### Features

- Migrate logger to js-toolkit logger implementation ([#1959](https://github.com/GetStream/stream-video-js/issues/1959)) ([5a424f7](https://github.com/GetStream/stream-video-js/commit/5a424f72cec2a8cbc0bfa23147d9988ab9bfbdc1))

### Bug Fixes

- keep compatibility with older xcode versions ([#1973](https://github.com/GetStream/stream-video-js/issues/1973)) ([3b2f281](https://github.com/GetStream/stream-video-js/commit/3b2f281ac565ff4c422aa37c1eb90c58afee3bea))

## [1.23.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.22.3...@stream-io/video-react-native-sdk-1.23.0) (2025-10-27)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.35.1`
  - **deps-dev:** bump happy-dom from 20.0.0 to 20.0.2 ([#1970](https://github.com/GetStream/stream-video-js/issues/1970)) ([702f409](https://github.com/GetStream/stream-video-js/commit/702f409b2e5529e7b8f1cfc757e2e776c75deacf)), closes [#1934](https://github.com/GetStream/stream-video-js/issues/1934) [#1932](https://github.com/GetStream/stream-video-js/issues/1932) [#0](https://github.com/GetStream/stream-video-js/issues/0) [#1934](https://github.com/GetStream/stream-video-js/issues/1934) [#0](https://github.com/GetStream/stream-video-js/issues/0) [#1932](https://github.com/GetStream/stream-video-js/issues/1932)
- `@stream-io/video-react-bindings` updated to version `1.10.3`

### Features

- adaptive floating video dimensions ([#1969](https://github.com/GetStream/stream-video-js/issues/1969)) ([5a213d2](https://github.com/GetStream/stream-video-js/commit/5a213d2571610846bdcd9b4554a5a8d1a3def6c4))

### Bug Fixes

- **react-native:** restore screen wake lock and proximity sensing ([#1971](https://github.com/GetStream/stream-video-js/issues/1971)) ([f20ef70](https://github.com/GetStream/stream-video-js/commit/f20ef70a5958fddf52075233f9f3d64a2ce01895)), closes [#1840](https://github.com/GetStream/stream-video-js/issues/1840)

## [1.22.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.22.2...@stream-io/video-react-native-sdk-1.22.3) (2025-10-24)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.35.0`
  - Participant Stats ([#1922](https://github.com/GetStream/stream-video-js/issues/1922)) ([b96de03](https://github.com/GetStream/stream-video-js/commit/b96de03a2b96db2288a6d2d52a25d3deea9148d8))
- `@stream-io/video-react-bindings` updated to version `1.10.2`

### Bug Fixes

- accept `children` in LivestreamPlayer components ([#1968](https://github.com/GetStream/stream-video-js/issues/1968)) ([1558f06](https://github.com/GetStream/stream-video-js/commit/1558f060614581964b72e9627e82a8419fc3d570))

## [1.22.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.22.1...@stream-io/video-react-native-sdk-1.22.2) (2025-10-24)

### Bug Fixes

- compilation error in older kotlin versions ([cedb942](https://github.com/GetStream/stream-video-js/commit/cedb94296ca659a1ad5584d3bd3d29f6be12c3ab))

## [1.22.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.22.0...@stream-io/video-react-native-sdk-1.22.1) (2025-10-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.34.1`
  - camera toggle along with flip ([#1961](https://github.com/GetStream/stream-video-js/issues/1961)) ([2703121](https://github.com/GetStream/stream-video-js/commit/2703121d27aee7a54bdc07b99a30feea9a4e4512))
- `@stream-io/video-react-bindings` updated to version `1.10.1`

### Bug Fixes

- videorenderer didnt call update subscriptions on remote reconnect ([#1964](https://github.com/GetStream/stream-video-js/issues/1964)) ([cb85bb4](https://github.com/GetStream/stream-video-js/commit/cb85bb495fe0fbe6ab803de2765e4c38bc74cd2f))

## [1.22.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.21.2...@stream-io/video-react-native-sdk-1.22.0) (2025-10-14)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.4.0`
- `@stream-io/video-filters-react-native` updated to version `0.8.0`
- `@stream-io/video-client` updated to version `1.34.0`
  - **Bug Fixes**
    - flush rtc stats when reconnecting ([#1946](https://github.com/GetStream/stream-video-js/issues/1946)) ([fb1f6fc](https://github.com/GetStream/stream-video-js/commit/fb1f6fcb2837154a4fe746a6efe4f9a4830bca20))
  - **Other**
    - use fromPartial instead of suppressing ts-errors ([#1949](https://github.com/GetStream/stream-video-js/issues/1949)) ([95e5654](https://github.com/GetStream/stream-video-js/commit/95e5654e2bac5dc7c5126079795fca9951652290))
- `@stream-io/video-react-bindings` updated to version `1.10.0`

- add useEffectEvent shim to bindings with react 19.2 dev dep ([#1944](https://github.com/GetStream/stream-video-js/issues/1944)) ([26ca6bd](https://github.com/GetStream/stream-video-js/commit/26ca6bd7702d4960c098104e12db18f7d8afc7ce))
- update react-native peer dep to 0.73.0 ([#1958](https://github.com/GetStream/stream-video-js/issues/1958)) ([0dfcbf3](https://github.com/GetStream/stream-video-js/commit/0dfcbf36dcf5136881109bef39470e4d5d7a10e7))

### Features

- **deps:** React 19.1, React Native 0.81, NextJS 15.5, Expo 54 ([#1940](https://github.com/GetStream/stream-video-js/issues/1940)) ([30f8ce2](https://github.com/GetStream/stream-video-js/commit/30f8ce2b335189e1f77160236839bc6c6a02f634))
- move audio route manager inside SDK ([#1840](https://github.com/GetStream/stream-video-js/issues/1840)) ([847dd30](https://github.com/GetStream/stream-video-js/commit/847dd30d6240a0780fe3d58d681554bc392f6f51)), closes [#1829](https://github.com/GetStream/stream-video-js/issues/1829)

### Bug Fixes

- add useIsInPiPMode for ios ([#1947](https://github.com/GetStream/stream-video-js/issues/1947)) ([2fe1f9f](https://github.com/GetStream/stream-video-js/commit/2fe1f9fde5f0d25bdc43394b65f8eb002dea7b5f))
- compatibility with RN 0.80+ ([#1950](https://github.com/GetStream/stream-video-js/issues/1950)) ([58e0bc4](https://github.com/GetStream/stream-video-js/commit/58e0bc499117381e6f0dad977cc9a5279164179d))

## [1.21.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.21.1...@stream-io/video-react-native-sdk-1.21.2) (2025-10-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.33.1`
  - ensure ingress participants are prioritized ([#1943](https://github.com/GetStream/stream-video-js/issues/1943)) ([a51a119](https://github.com/GetStream/stream-video-js/commit/a51a119cfb9f13736395b4afb3d3947ef994a6d9))
- `@stream-io/video-react-bindings` updated to version `1.9.1`

## [1.21.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.21.0...@stream-io/video-react-native-sdk-1.21.1) (2025-09-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.33.0`
  - **Features**
    - Audio profiles and Hi-Fi stereo audio ([#1887](https://github.com/GetStream/stream-video-js/issues/1887)) ([3b60c89](https://github.com/GetStream/stream-video-js/commit/3b60c89b8c0dbc40544fe13be79c10e93bbddd3d))
  - **Bug Fixes**
    - **client:** server side pinning ([#1936](https://github.com/GetStream/stream-video-js/issues/1936)) ([cd33b9e](https://github.com/GetStream/stream-video-js/commit/cd33b9e4417e8fdc452b6d4a192e10183ddfa31b))
- `@stream-io/video-react-bindings` updated to version `1.9.0`

### Bug Fixes

- support scenario of accept second call when there is ongoing first call ([#1939](https://github.com/GetStream/stream-video-js/issues/1939)) ([1e73517](https://github.com/GetStream/stream-video-js/commit/1e7351704cebe36af8ea0833ab1725472bbedbe8))

## [1.21.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.20.16...@stream-io/video-react-native-sdk-1.21.0) (2025-09-29)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.3.0`
- `@stream-io/video-filters-react-native` updated to version `0.7.0`
- `@stream-io/video-client` updated to version `1.32.0`
  - restore calling state after unrecoverable join fail ([#1935](https://github.com/GetStream/stream-video-js/issues/1935)) ([8ab0168](https://github.com/GetStream/stream-video-js/commit/8ab01680d01cc47f9cf48078634358507f0c109d))
  - send unifiedSessionId in the initial join request ([#1934](https://github.com/GetStream/stream-video-js/issues/1934)) ([e6a533d](https://github.com/GetStream/stream-video-js/commit/e6a533d7e926086ac5930ebfb4648dade449d15a))
- `@stream-io/video-react-bindings` updated to version `1.8.4`

### Features

- 16KB page size support for noise cancellation & screenshot ([#1933](https://github.com/GetStream/stream-video-js/issues/1933)) ([7e3b046](https://github.com/GetStream/stream-video-js/commit/7e3b046820bde9d331871718a6f841bff88a73ce)), closes [#1937](https://github.com/GetStream/stream-video-js/issues/1937)
- **react-native:** reject call when busy ([#1856](https://github.com/GetStream/stream-video-js/issues/1856)) ([b60bc7c](https://github.com/GetStream/stream-video-js/commit/b60bc7cd2dc2e09d52496d7b5cb593cac4b89485))

### Bug Fixes

- dont check android.incomingCallChannel for ios voip setup ([01bd3fd](https://github.com/GetStream/stream-video-js/commit/01bd3fdb249fbdf2896c4851acd7ae5486dae88f))
- unncessary to check if viewRef is defined to register screenshot view ([f35315f](https://github.com/GetStream/stream-video-js/commit/f35315fa4e565c002a0dde54e21433ca068fbd21))

## [1.20.16](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.20.15...@stream-io/video-react-native-sdk-1.20.16) (2025-09-18)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.2.4`

### Bug Fixes

- android RN module compilation error on RN 0.81 ([#1924](https://github.com/GetStream/stream-video-js/issues/1924)) ([b02294c](https://github.com/GetStream/stream-video-js/commit/b02294c8bb85795ff5ac5fed2195e26d7e1f11a4)), closes [#1921](https://github.com/GetStream/stream-video-js/issues/1921)

## [1.20.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.20.14...@stream-io/video-react-native-sdk-1.20.15) (2025-09-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.31.0`
  - **Features**
    - introduce @stream-io/worker-timers ([94c962b](https://github.com/GetStream/stream-video-js/commit/94c962b2c5f731c152771b7803a59664fa925477))
  - **Bug Fixes**
    - **video-filters:** prevent background tab throttling ([#1920](https://github.com/GetStream/stream-video-js/issues/1920)) ([f93d5cc](https://github.com/GetStream/stream-video-js/commit/f93d5cc5785957c7f181fcaf689ec366df9e646b))
- `@stream-io/video-react-bindings` updated to version `1.8.3`

### Bug Fixes

- screenshot for iOS was broken on old arch on interop layer ([#1923](https://github.com/GetStream/stream-video-js/issues/1923)) ([9b3134b](https://github.com/GetStream/stream-video-js/commit/9b3134bb6f6380551af4c3a0a69274eada2f8d94))

## [1.20.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.20.13...@stream-io/video-react-native-sdk-1.20.14) (2025-09-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.30.1`
  - don't apply default camera state if video is off ([#1917](https://github.com/GetStream/stream-video-js/issues/1917)) ([9cf1d75](https://github.com/GetStream/stream-video-js/commit/9cf1d752d824a0527fbb187df21d8a020590d4bb))
  - **rn:** set direction state for flip after constraints are applied ([1f03c59](https://github.com/GetStream/stream-video-js/commit/1f03c59b9b3fecc0ff1f7cb6b0eccb083b4a3475))
- `@stream-io/video-react-bindings` updated to version `1.8.2`

## [1.20.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.20.12...@stream-io/video-react-native-sdk-1.20.13) (2025-09-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.30.0`
  - **Features**
    - Participant Source ([#1896](https://github.com/GetStream/stream-video-js/issues/1896)) ([b1cf710](https://github.com/GetStream/stream-video-js/commit/b1cf710ac3bfda573c0379dac1e6a107d2dbabf6))
  - **Other**
    - Skip tests for StreamVideoClient coordinator API ([aabe1d0](https://github.com/GetStream/stream-video-js/commit/aabe1d0ad3e3a95698b422991729e46289ab0277))
- `@stream-io/video-react-bindings` updated to version `1.8.1`

## [1.20.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.20.11...@stream-io/video-react-native-sdk-1.20.12) (2025-09-09)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.29.0`
  - **Features**
    - opt-out from optimistic updates ([#1904](https://github.com/GetStream/stream-video-js/issues/1904)) ([45dba34](https://github.com/GetStream/stream-video-js/commit/45dba34d38dc64f456e37b593e38e420426529f5))
  - **Bug Fixes**
    - capabilities and call grants ([#1899](https://github.com/GetStream/stream-video-js/issues/1899)) ([5725dfa](https://github.com/GetStream/stream-video-js/commit/5725dfa29b1e5fdb6fe4e26825ce7b268664d2fa))
    - graceful Axios request config overrides ([#1913](https://github.com/GetStream/stream-video-js/issues/1913)) ([a124099](https://github.com/GetStream/stream-video-js/commit/a124099f984a592750d66ac440ef6c27ae7a02d9))
- `@stream-io/video-react-bindings` updated to version `1.8.0`

- trace charging and battery level ([#1909](https://github.com/GetStream/stream-video-js/issues/1909)) ([31d7c01](https://github.com/GetStream/stream-video-js/commit/31d7c015a1b243b759b3ef8934e44c5dc521b9a2))

## [1.20.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.20.10...@stream-io/video-react-native-sdk-1.20.11) (2025-09-05)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.2.3`
- `@stream-io/video-filters-react-native` updated to version `0.6.3`

### Bug Fixes

- update webrtc peer dep to 125.4.3 ([#1908](https://github.com/GetStream/stream-video-js/issues/1908)) ([24b2f95](https://github.com/GetStream/stream-video-js/commit/24b2f958f4430212116ddd78800a1ea71adbea4d))

## [1.20.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.20.9...@stream-io/video-react-native-sdk-1.20.10) (2025-08-22)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.28.1`
  - handle pre ended calls on ringing push arrival ([#1897](https://github.com/GetStream/stream-video-js/issues/1897)) ([935e375](https://github.com/GetStream/stream-video-js/commit/935e3756035639c651b3ac4469321a64b8576a0e))
- `@stream-io/video-react-bindings` updated to version `1.7.16`

## [1.20.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.20.8...@stream-io/video-react-native-sdk-1.20.9) (2025-08-21)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.28.0`
  - Kick user from a call ([#1894](https://github.com/GetStream/stream-video-js/issues/1894)) ([32e2afc](https://github.com/GetStream/stream-video-js/commit/32e2afca0ea59e3f57e1ff9d05828c1e07fbff78))
- `@stream-io/video-react-bindings` updated to version `1.7.15`

## [1.20.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.20.7...@stream-io/video-react-native-sdk-1.20.8) (2025-08-21)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.2.2`
- `@stream-io/video-filters-react-native` updated to version `0.6.2`

### Bug Fixes

- update webrtc peer dep to 125.4.2 ([#1895](https://github.com/GetStream/stream-video-js/issues/1895)) ([9a102a9](https://github.com/GetStream/stream-video-js/commit/9a102a964d4b350eb9223272cfe294e4805c6533))

## [1.20.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.20.6...@stream-io/video-react-native-sdk-1.20.7) (2025-08-15)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.27.5`
  - synchronize ring events ([#1888](https://github.com/GetStream/stream-video-js/issues/1888)) ([0951e6d](https://github.com/GetStream/stream-video-js/commit/0951e6d4c825806937d6bdc548df9f186c531466))
- `@stream-io/video-react-bindings` updated to version `1.7.14`

## [1.20.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.20.5...@stream-io/video-react-native-sdk-1.20.6) (2025-08-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.27.4`
  - expose isSupportedBrowser() utility ([#1859](https://github.com/GetStream/stream-video-js/issues/1859)) ([f51a434](https://github.com/GetStream/stream-video-js/commit/f51a4341f57407210ab2e9ba57f41818ddbd7ed9))
- `@stream-io/video-react-bindings` updated to version `1.7.13`

## [1.20.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.20.4...@stream-io/video-react-native-sdk-1.20.5) (2025-08-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.27.3`
  - extended telemetry data for the signal websocket ([#1881](https://github.com/GetStream/stream-video-js/issues/1881)) ([984703d](https://github.com/GetStream/stream-video-js/commit/984703dabb8c6189eaf4d6925421568f6d0fd7fc))
- `@stream-io/video-react-bindings` updated to version `1.7.12`

## [1.20.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.20.3...@stream-io/video-react-native-sdk-1.20.4) (2025-08-06)

- best to not create listener before js bridge being ready ([dcb4f0a](https://github.com/GetStream/stream-video-js/commit/dcb4f0aa7d01f7822ed10ae39a52b1b83cbdd077))

## [1.20.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.20.2...@stream-io/video-react-native-sdk-1.20.3) (2025-08-05)

### Bug Fixes

- handle undefined participant in iOS pip ([#1878](https://github.com/GetStream/stream-video-js/issues/1878)) ([69c4694](https://github.com/GetStream/stream-video-js/commit/69c4694196e13afc628150b033a48b227640bda4)), closes [#1876](https://github.com/GetStream/stream-video-js/issues/1876)

## [1.20.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.20.1...@stream-io/video-react-native-sdk-1.20.2) (2025-08-05)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.2.1`
- `@stream-io/video-filters-react-native` updated to version `0.6.1`
- `@stream-io/video-client` updated to version `1.27.2`
  - improved logging and tracing ([#1874](https://github.com/GetStream/stream-video-js/issues/1874)) ([e450ce2](https://github.com/GetStream/stream-video-js/commit/e450ce2a294d6f80480fcc709591c13d9ede79e4))
- `@stream-io/video-react-bindings` updated to version `1.7.11`

### Bug Fixes

- iOS PiP cleanup ([#1870](https://github.com/GetStream/stream-video-js/issues/1870)) ([88c87f4](https://github.com/GetStream/stream-video-js/commit/88c87f4c9d9b66bb5beef0464863efde720761dd)), closes [#1854](https://github.com/GetStream/stream-video-js/issues/1854)
- support setting iOS pip window sizes ([#1876](https://github.com/GetStream/stream-video-js/issues/1876)) ([2c553c9](https://github.com/GetStream/stream-video-js/commit/2c553c967b4ceedaf7209c1e98ab4c8025c84ca5))

## [1.20.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.20.0...@stream-io/video-react-native-sdk-1.20.1) (2025-08-01)

### Bug Fixes

- android OEM specific pip crash ([#1868](https://github.com/GetStream/stream-video-js/issues/1868)) ([2d4ebc5](https://github.com/GetStream/stream-video-js/commit/2d4ebc58cfd21eaa59947e56499ceb3b1258368d))

## [1.20.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.19.1...@stream-io/video-react-native-sdk-1.20.0) (2025-07-25)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.2.0`
- `@stream-io/video-filters-react-native` updated to version `0.6.0`
- `@stream-io/video-client` updated to version `1.27.1`
  - synchronize updateMuteState; use correct fallback dimensions ([#1867](https://github.com/GetStream/stream-video-js/issues/1867)) ([154cdda](https://github.com/GetStream/stream-video-js/commit/154cddaa4462ee03af5fdf4929ad9f4e3d4b5070))
- `@stream-io/video-react-bindings` updated to version `1.7.10`

- bump webrtc version ([#1865](https://github.com/GetStream/stream-video-js/issues/1865)) ([18fd609](https://github.com/GetStream/stream-video-js/commit/18fd60945ef74eb23c089dc0b5adb2373b700602))

### Features

- add ability to run a custom promise option for android keep call alive service ([#1864](https://github.com/GetStream/stream-video-js/issues/1864)) ([81fdd0b](https://github.com/GetStream/stream-video-js/commit/81fdd0b381a0e6aae4b5e5063c9b6c10b3c4d3bf))
- do not detect video dimensions through rtc stats ([#1852](https://github.com/GetStream/stream-video-js/issues/1852)) ([280e008](https://github.com/GetStream/stream-video-js/commit/280e0087d646188e71dec6e4d4e5e8b93878904d))

### Bug Fixes

- improved audio and video filter tracing ([#1862](https://github.com/GetStream/stream-video-js/issues/1862)) ([701ea4b](https://github.com/GetStream/stream-video-js/commit/701ea4b3266f68072c1325b70221fdefd77137ec))
- trace available devices and thermal state changes ([#1866](https://github.com/GetStream/stream-video-js/issues/1866)) ([d8312b5](https://github.com/GetStream/stream-video-js/commit/d8312b5c109b14baa28ee764202d387499d0fd52))

## [1.19.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.19.0...@stream-io/video-react-native-sdk-1.19.1) (2025-07-23)

### Bug Fixes

- automatically exit android pip mode if call is left ([#1863](https://github.com/GetStream/stream-video-js/issues/1863)) ([51850f4](https://github.com/GetStream/stream-video-js/commit/51850f49bc67595a4cacb766863894483712fc75))
- ios pip blank local track issue ([47d8119](https://github.com/GetStream/stream-video-js/commit/47d811928f9f155b4d9f9cb23042a7556fd8414a))

## [1.19.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.18.1...@stream-io/video-react-native-sdk-1.19.0) (2025-07-18)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.27.0`
  - more graceful handling of SFU join failures ([#1853](https://github.com/GetStream/stream-video-js/issues/1853)) ([f38a4b5](https://github.com/GetStream/stream-video-js/commit/f38a4b5eef62210b08424640040a88065b680707))
- `@stream-io/video-react-bindings` updated to version `1.7.9`

### Features

- Inbound Video Pause ([#1841](https://github.com/GetStream/stream-video-js/issues/1841)) ([5c7eb3a](https://github.com/GetStream/stream-video-js/commit/5c7eb3ac8b0fcfd663226d537279c8a941dedc21))

### Bug Fixes

- stop picture-in-picture after call ends or goes to backstage ([#1854](https://github.com/GetStream/stream-video-js/issues/1854)) ([91390d8](https://github.com/GetStream/stream-video-js/commit/91390d83e056af3f1855f36ccd5f3eed9fed6d4d))

## [1.18.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.18.0...@stream-io/video-react-native-sdk-1.18.1) (2025-07-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.26.1`
  - force `play-and-record` audioSession on Safari ([#1855](https://github.com/GetStream/stream-video-js/issues/1855)) ([a3552a3](https://github.com/GetStream/stream-video-js/commit/a3552a3be606ac99120b6c4ce6187eaa920a02ef))
- `@stream-io/video-react-bindings` updated to version `1.7.8`

## [1.18.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.17.6...@stream-io/video-react-native-sdk-1.18.0) (2025-07-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.26.0`
- `@stream-io/video-react-bindings` updated to version `1.7.7`

### Features

- **react-native:** speech detection ([#1850](https://github.com/GetStream/stream-video-js/issues/1850)) ([3f53e95](https://github.com/GetStream/stream-video-js/commit/3f53e95fdf0e739c809648211c52542d86df183f))

### Bug Fixes

- keep objectfit as cover for floating video view ([#1849](https://github.com/GetStream/stream-video-js/issues/1849)) ([a99de4c](https://github.com/GetStream/stream-video-js/commit/a99de4c3b2231fa840e003515735620f6c009f7e))

## [1.17.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.17.5...@stream-io/video-react-native-sdk-1.17.6) (2025-07-08)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.25.5`
  - relax SFU leaveAndClose constraints ([#1848](https://github.com/GetStream/stream-video-js/issues/1848)) ([dbf8bb0](https://github.com/GetStream/stream-video-js/commit/dbf8bb0c6f9f5358f21db3e78bd40ce01ad9bf6d)), closes [#1846](https://github.com/GetStream/stream-video-js/issues/1846)
- `@stream-io/video-react-bindings` updated to version `1.7.6`

## [1.17.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.17.4...@stream-io/video-react-native-sdk-1.17.5) (2025-07-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.25.4`
  - sync call state after a failed reconnect ([#1846](https://github.com/GetStream/stream-video-js/issues/1846)) ([905e5c2](https://github.com/GetStream/stream-video-js/commit/905e5c2011d3267e83b3f2a861a4175de4111cfa))
- `@stream-io/video-react-bindings` updated to version `1.7.5`

## [1.17.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.17.3...@stream-io/video-react-native-sdk-1.17.4) (2025-07-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.25.3`
  - bump the default test timeout ([bea27db](https://github.com/GetStream/stream-video-js/commit/bea27db1922a6f2a0899375d1a4cade1eb1291b5))
  - increase axios timeout ([d9cc4ac](https://github.com/GetStream/stream-video-js/commit/d9cc4ac69f58d12d97af0c714df564349c17c9b5))
- `@stream-io/video-react-bindings` updated to version `1.7.4`

### Bug Fixes

- add loopSound for incoming call notifications ([9e02a3d](https://github.com/GetStream/stream-video-js/commit/9e02a3dd4de5af8a446b8b34450a3fa13b878aa2))
- do not have a default for objectfit ([#1843](https://github.com/GetStream/stream-video-js/issues/1843)) ([1586e07](https://github.com/GetStream/stream-video-js/commit/1586e070691fddb7eb04ae713228e3fe6ac093e4))

## [1.17.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.17.2...@stream-io/video-react-native-sdk-1.17.3) (2025-07-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.25.2`
  - resolve `default` device id into real id ([#1839](https://github.com/GetStream/stream-video-js/issues/1839)) ([1a1037f](https://github.com/GetStream/stream-video-js/commit/1a1037f21ef2926c7da78b6461499f37742935e9))
- `@stream-io/video-react-bindings` updated to version `1.7.3`

### Bug Fixes

- **react-native:** customise android notification buttons ([#1842](https://github.com/GetStream/stream-video-js/issues/1842)) ([40e098d](https://github.com/GetStream/stream-video-js/commit/40e098d8a82a5ccf2076da69299bf18877dcbeec))

## [1.17.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.17.1...@stream-io/video-react-native-sdk-1.17.2) (2025-06-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.25.1`
  - correctly setup and dispose device managers ([#1836](https://github.com/GetStream/stream-video-js/issues/1836)) ([92fbe6c](https://github.com/GetStream/stream-video-js/commit/92fbe6c1da3bf06847244f430652bdc9433533bf))
- `@stream-io/video-react-bindings` updated to version `1.7.2`

## [1.17.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.17.0...@stream-io/video-react-native-sdk-1.17.1) (2025-06-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.25.0`
  - **Features**
    - stereo support ([#1833](https://github.com/GetStream/stream-video-js/issues/1833)) ([389b2f2](https://github.com/GetStream/stream-video-js/commit/389b2f2f0d7e4098b916a18b7c079d7029e35949))
    - Support for Screen Share content hinting ([#1834](https://github.com/GetStream/stream-video-js/issues/1834)) ([a09ff78](https://github.com/GetStream/stream-video-js/commit/a09ff78e8c5a78ea435bec17dfd5b2b63ef5c78d))
  - **Bug Fixes**
    - multiple FAST reconnect attempts and improved ICE restarts ([#1811](https://github.com/GetStream/stream-video-js/issues/1811)) ([f64c922](https://github.com/GetStream/stream-video-js/commit/f64c92292dcc6d216acb130ad51347449968f420))
    - ringing call fixes and support for pronto ([#1823](https://github.com/GetStream/stream-video-js/issues/1823)) ([c0414f8](https://github.com/GetStream/stream-video-js/commit/c0414f88ec7dd42ad35991565f9d337ea7e0fc6d))
  - **Other**
    - upgrade stream deps and improve API error code logging ([#1827](https://github.com/GetStream/stream-video-js/issues/1827)) ([8c30fef](https://github.com/GetStream/stream-video-js/commit/8c30fef80d78055f5adeae02f7347c1c3fe49b72)), closes [#1826](https://github.com/GetStream/stream-video-js/issues/1826)
- `@stream-io/video-react-bindings` updated to version `1.7.1`

## [1.17.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.16.1...@stream-io/video-react-native-sdk-1.17.0) (2025-06-12)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.1.1`
- `@stream-io/video-filters-react-native` updated to version `0.5.0`
- `@stream-io/video-client` updated to version `1.24.0`
  - configurable call stats reporting interval ([#1824](https://github.com/GetStream/stream-video-js/issues/1824)) ([74f72c0](https://github.com/GetStream/stream-video-js/commit/74f72c024d0cb34ae3e0fee4bd8f061fb51e4479))
  - don't compute call stats report if no one subscribed to it ([#1825](https://github.com/GetStream/stream-video-js/issues/1825)) ([fb6a8c9](https://github.com/GetStream/stream-video-js/commit/fb6a8c9e19c80be313d73fadb68810e7f7c1f071))
- `@stream-io/video-react-bindings` updated to version `1.7.0`
  - update i18next to its latest version ([#1807](https://github.com/GetStream/stream-video-js/issues/1807)) ([c524877](https://github.com/GetStream/stream-video-js/commit/c5248777c83b2a032423b59f6505cf4b2a09a9b9))

- update webrtc version ([162a8d2](https://github.com/GetStream/stream-video-js/commit/162a8d24216a28659759ea16fe48630cadb1536f))

### Features

- add audio only ringing notification support for iOS ([#1821](https://github.com/GetStream/stream-video-js/issues/1821)) ([067081d](https://github.com/GetStream/stream-video-js/commit/067081da0032fb965b0401905b2413d3a0290f0e))
- moderation support ([#1822](https://github.com/GetStream/stream-video-js/issues/1822)) ([3948fae](https://github.com/GetStream/stream-video-js/commit/3948faeb2fa7ace8dd9c1df990f6e41e73fc0a26))

## [1.16.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.16.0...@stream-io/video-react-native-sdk-1.16.1) (2025-06-04)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.23.5`
  - **react-native:** skip browser permission for react native ([#1818](https://github.com/GetStream/stream-video-js/issues/1818)) ([b18f418](https://github.com/GetStream/stream-video-js/commit/b18f418698e12b9804efb43e712ba813b0dbb056))
- `@stream-io/video-react-bindings` updated to version `1.6.8`

### Bug Fixes

- expo noise cancellation swift import + sample video filters ([#1816](https://github.com/GetStream/stream-video-js/issues/1816)) ([7524fc0](https://github.com/GetStream/stream-video-js/commit/7524fc05b8de85b943d5f3ca460b984725b550b9))

## [1.16.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.15.1...@stream-io/video-react-native-sdk-1.16.0) (2025-06-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.23.4`
  - attach original token provider error as cause to loadToken rejection ([#1812](https://github.com/GetStream/stream-video-js/issues/1812)) ([15f817c](https://github.com/GetStream/stream-video-js/commit/15f817c2548a8edba8ca1004e133277d67cbeb4f))
  - improved video quality on low capture resolution ([#1814](https://github.com/GetStream/stream-video-js/issues/1814)) ([ebcfdf7](https://github.com/GetStream/stream-video-js/commit/ebcfdf7f7e8146fcaf18a8bee81086f5a23f5df3))
- `@stream-io/video-react-bindings` updated to version `1.6.7`

### Features

- remove camera management hooks on react native ([#1711](https://github.com/GetStream/stream-video-js/issues/1711)) ([644e238](https://github.com/GetStream/stream-video-js/commit/644e238d479397ca37bcb6c1bd1284988475f9f6))

## [1.15.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.15.0...@stream-io/video-react-native-sdk-1.15.1) (2025-06-02)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.1.1`
- `@stream-io/video-client` updated to version `1.23.3`
  - **Bug Fixes**
    - inconsistent device state if applySettingsToStream fails ([#1808](https://github.com/GetStream/stream-video-js/issues/1808)) ([73d66c2](https://github.com/GetStream/stream-video-js/commit/73d66c2eaa7eca52b9d41b39f8f9fd0a0ce240ef))
    - test ([e0b93aa](https://github.com/GetStream/stream-video-js/commit/e0b93aaa13f22f0db30b61e6230aff40ba8fd92a))
    - use AudioContext for Safari ([#1810](https://github.com/GetStream/stream-video-js/issues/1810)) ([63542f4](https://github.com/GetStream/stream-video-js/commit/63542f419efa475c7acf50f053621ace74a1eff4))
  - **Other**
    - remove TODO ([9cfea4b](https://github.com/GetStream/stream-video-js/commit/9cfea4b54284cdd680a6d666436dedc5fd8956c3))
- `@stream-io/video-react-bindings` updated to version `1.6.6`

### Bug Fixes

- expo plugin should add foreground permissions on ringing config ([cba9746](https://github.com/GetStream/stream-video-js/commit/cba97469966aa35b67f380d82272a9bf3a8e2ef2))
- report to callkit that we do not support holding ([#1809](https://github.com/GetStream/stream-video-js/issues/1809)) ([e779d3f](https://github.com/GetStream/stream-video-js/commit/e779d3fbdda30be5db5c42ee4655d8311dd53d60))

## [1.15.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.14.2...@stream-io/video-react-native-sdk-1.15.0) (2025-05-27)

### Features

- **android:** Accept incoming call without device unlock ([#1806](https://github.com/GetStream/stream-video-js/issues/1806)) ([6b8ee36](https://github.com/GetStream/stream-video-js/commit/6b8ee36323c0c352742e23bf845eed47c581e6ab))

## [1.14.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.14.1...@stream-io/video-react-native-sdk-1.14.2) (2025-05-22)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.23.2`
  - rpc error tracing ([#1801](https://github.com/GetStream/stream-video-js/issues/1801)) ([a9e86d5](https://github.com/GetStream/stream-video-js/commit/a9e86d5e51e72b15d044e012f5fcc5a44907c325))
- `@stream-io/video-react-bindings` updated to version `1.6.5`

## [1.14.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.14.0...@stream-io/video-react-native-sdk-1.14.1) (2025-05-21)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.23.1`
  - restore echoCancellation settings ([#1799](https://github.com/GetStream/stream-video-js/issues/1799)) ([e839036](https://github.com/GetStream/stream-video-js/commit/e839036f279ee9b27ce3d62d4f07e3517c3e5fef)), closes [#1794](https://github.com/GetStream/stream-video-js/issues/1794)
- `@stream-io/video-react-bindings` updated to version `1.6.4`

## [1.14.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.13.3...@stream-io/video-react-native-sdk-1.14.0) (2025-05-20)

### Dependency Updates

- `@stream-io/noise-cancellation-react-native` updated to version `0.1.0`
- `@stream-io/video-filters-react-native` updated to version `0.4.0`
- `@stream-io/video-client` updated to version `1.23.0`
  - do not mutate filters array during pipeline setup ([#1798](https://github.com/GetStream/stream-video-js/issues/1798)) ([e9832e5](https://github.com/GetStream/stream-video-js/commit/e9832e5ef41b3f6cddfe2d0cb2cf840e9b28bb86))
- `@stream-io/video-react-bindings` updated to version `1.6.3`

### Features

- **react-native:** Noise Cancellation ([#1793](https://github.com/GetStream/stream-video-js/issues/1793)) ([d7843e1](https://github.com/GetStream/stream-video-js/commit/d7843e1a23e6f6a35d1c159438d09bdfd17450a5))
- rn livestream improvements ([#1780](https://github.com/GetStream/stream-video-js/issues/1780)) ([8a3bb59](https://github.com/GetStream/stream-video-js/commit/8a3bb594b257c48a7045bfb6978fc233649945f5))
- **web:** improved noise cancellation ([#1794](https://github.com/GetStream/stream-video-js/issues/1794)) ([d59f19b](https://github.com/GetStream/stream-video-js/commit/d59f19b1ba1ff83fe5f024d783b868f4e98d3380))

## [1.13.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.13.2...@stream-io/video-react-native-sdk-1.13.3) (2025-05-15)

### Dependency Updates

- `@stream-io/video-filters-react-native` updated to version `0.3.1`
- `@stream-io/video-client` updated to version `1.22.2`
  - adjust ErrorFromResponse class ([#1791](https://github.com/GetStream/stream-video-js/issues/1791)) ([c0abcba](https://github.com/GetStream/stream-video-js/commit/c0abcbacfddeb87d8378c4418f80e6770981cdc8)), closes [GetStream/chat#1540](https://github.com/GetStream/chat/issues/1540)
- `@stream-io/video-react-bindings` updated to version `1.6.2`

### Bug Fixes

- enable chore releases ([#1792](https://github.com/GetStream/stream-video-js/issues/1792)) ([6046654](https://github.com/GetStream/stream-video-js/commit/6046654fe19505a1c115a4fb838759d010540614))

## [1.13.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.13.1...@stream-io/video-react-native-sdk-1.13.2) (2025-05-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.22.1`
  - fixes an edge case where tracks weren't restored after a reconnect ([#1789](https://github.com/GetStream/stream-video-js/issues/1789)) ([d825e8e](https://github.com/GetStream/stream-video-js/commit/d825e8e39ac8cbd072ec9d5124e1ea0226216e08))
- `@stream-io/video-react-bindings` updated to version `1.6.1`

## [1.13.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.13.0...@stream-io/video-react-native-sdk-1.13.1) (2025-05-09)

### Bug Fixes

- ios compilation error on old arch ([#1787](https://github.com/GetStream/stream-video-js/issues/1787)) ([9b03335](https://github.com/GetStream/stream-video-js/commit/9b03335eb4eb020021e9a3d40c2b1f81d33ad0fe))

## [1.13.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.12.0...@stream-io/video-react-native-sdk-1.13.0) (2025-05-08)

### Dependency Updates

- `@stream-io/video-filters-react-native` updated to version `0.3.0`
- `@stream-io/video-client` updated to version `1.22.0`
  - graceful handling of LIVE_ENDED CallEnded reason ([#1783](https://github.com/GetStream/stream-video-js/issues/1783)) ([ff54390](https://github.com/GetStream/stream-video-js/commit/ff54390099e10c550b8bbac42658080a65007a30))
  - isolate mediaDevices traces ([#1779](https://github.com/GetStream/stream-video-js/issues/1779)) ([d8623f0](https://github.com/GetStream/stream-video-js/commit/d8623f0b06a6229bff96ea01dd1f2b851b7d3558)), closes [#1765](https://github.com/GetStream/stream-video-js/issues/1765)
  - make camera.flip() work more reliably with older devices ([#1781](https://github.com/GetStream/stream-video-js/issues/1781)) ([9dfbc55](https://github.com/GetStream/stream-video-js/commit/9dfbc556155c1ae9b528b50b140313c4decb024f)), closes [#1679](https://github.com/GetStream/stream-video-js/issues/1679)
  - use scoped locking for PeerConnection events ([#1785](https://github.com/GetStream/stream-video-js/issues/1785)) ([b0f93e8](https://github.com/GetStream/stream-video-js/commit/b0f93e83e70520b527efd94e9192ac7dca031864))
- `@stream-io/video-react-bindings` updated to version `1.6.0`

### Features

- Expo 53 Swift Config Plugin and React Native 0.79 compatibility ([#1714](https://github.com/GetStream/stream-video-js/issues/1714)) ([380331e](https://github.com/GetStream/stream-video-js/commit/380331e11fd6182c3111413aa25689a669dd3c9c))
- **react-native:** take screenshot of a participant's video stream ([#1772](https://github.com/GetStream/stream-video-js/issues/1772)) ([fb28427](https://github.com/GetStream/stream-video-js/commit/fb284270f5a0589dbc40669456d2cf45c911a245))

## [1.12.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.11.6...@stream-io/video-react-native-sdk-1.12.0) (2025-05-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.21.0`
- `@stream-io/video-react-bindings` updated to version `1.5.19`

- update sample apps to webrtc-125.2.0 ([#1777](https://github.com/GetStream/stream-video-js/issues/1777)) ([f1b6070](https://github.com/GetStream/stream-video-js/commit/f1b6070d207099bf8f8538cdaa556fd14daddb9d))

### Features

- encode and decode PerformanceStats tracing ([#1765](https://github.com/GetStream/stream-video-js/issues/1765)) ([138ea84](https://github.com/GetStream/stream-video-js/commit/138ea84fee834da03cf3c8042fbb2f071526f135))

## [1.11.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.11.5...@stream-io/video-react-native-sdk-1.11.6) (2025-05-01)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.20.2`
  - add options for 4K RTMP and Recording ([#1775](https://github.com/GetStream/stream-video-js/issues/1775)) ([c09213d](https://github.com/GetStream/stream-video-js/commit/c09213df5fc8a46f5a8c5c1ef18f07fd05e1d547))
  - use timeout reason when auto-dropping calls (instead of decline) ([#1776](https://github.com/GetStream/stream-video-js/issues/1776)) ([a043148](https://github.com/GetStream/stream-video-js/commit/a04314814e728c3d05d53c8940e9c223fec18fcc))
- `@stream-io/video-react-bindings` updated to version `1.5.18`

## [1.11.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.11.4...@stream-io/video-react-native-sdk-1.11.5) (2025-04-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.20.1`
  - dispose media stream if it cannot be published ([#1771](https://github.com/GetStream/stream-video-js/issues/1771)) ([83fbfd7](https://github.com/GetStream/stream-video-js/commit/83fbfd7bb77bd9a06d6955e6b48bb8238e573f57))
  - use more granular permission state for stats reporter ([#1774](https://github.com/GetStream/stream-video-js/issues/1774)) ([55afdfc](https://github.com/GetStream/stream-video-js/commit/55afdfcdac55fad25ba32978caf55a2f25f7580b))
- `@stream-io/video-react-bindings` updated to version `1.5.17`

### Bug Fixes

- add missing bg task scheduler key for expo ([2f901cb](https://github.com/GetStream/stream-video-js/commit/2f901cbd07f2d808f67bf812b21ab1e17990fdac))
- call cancellation not reliably seen on killed state RN-198 ([#1773](https://github.com/GetStream/stream-video-js/issues/1773)) ([735480e](https://github.com/GetStream/stream-video-js/commit/735480ec13e29784c97f81bf1c4d9c5f9123b85d))

## [1.11.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.11.3...@stream-io/video-react-native-sdk-1.11.4) (2025-04-24)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.20.0`
  - **Features**
    - add getCallReport method ([#1767](https://github.com/GetStream/stream-video-js/issues/1767)) ([12e064f](https://github.com/GetStream/stream-video-js/commit/12e064f34a08731ded289651125bbe20e2bbf4f4))
  - **Other**
    - bump test timeout ([7d922ed](https://github.com/GetStream/stream-video-js/commit/7d922ed34c46851a257fb36ee644f1ff5e4cb917))
- `@stream-io/video-react-bindings` updated to version `1.5.16`

## [1.11.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.11.2...@stream-io/video-react-native-sdk-1.11.3) (2025-04-15)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.19.3`
  - fast reconnect shouldn't be followed up with full rejoining on network switch ([#1760](https://github.com/GetStream/stream-video-js/issues/1760)) ([71363bd](https://github.com/GetStream/stream-video-js/commit/71363bdf0fb6cd6273ff6c2a0faf9ea1eb53f121))
  - watched calls should auto-subscribe for state updates ([#1762](https://github.com/GetStream/stream-video-js/issues/1762)) ([abcb45b](https://github.com/GetStream/stream-video-js/commit/abcb45b7fed4ca10e4ac6ea8ee18630ca5a9cb46)), closes [#1433](https://github.com/GetStream/stream-video-js/issues/1433)
- `@stream-io/video-react-bindings` updated to version `1.5.15`
  - access device list lazily from call state hook ([#1761](https://github.com/GetStream/stream-video-js/issues/1761)) ([319353c](https://github.com/GetStream/stream-video-js/commit/319353caf709f6a9fa2197b2ac923b9ceecadb7c))

## [1.11.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.11.1...@stream-io/video-react-native-sdk-1.11.2) (2025-04-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.19.2`
  - enhance tracing data ([#1758](https://github.com/GetStream/stream-video-js/issues/1758)) ([a6f2e3a](https://github.com/GetStream/stream-video-js/commit/a6f2e3a5256519e4884ec07e2dd2d4417f2482fe))
- `@stream-io/video-react-bindings` updated to version `1.5.14`

### Bug Fixes

- race condition on Expo iOS when processing incoming voip push notification ([#1757](https://github.com/GetStream/stream-video-js/issues/1757)) ([cd5542b](https://github.com/GetStream/stream-video-js/commit/cd5542b6624e3aa731e7f9f63c7b291f95f7ab10))

## [1.11.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.11.0...@stream-io/video-react-native-sdk-1.11.1) (2025-04-09)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.19.1`
  - add an opt-out for persisted device preferences ([#1753](https://github.com/GetStream/stream-video-js/issues/1753)) ([4d55c3e](https://github.com/GetStream/stream-video-js/commit/4d55c3ee982bcb72beec347489e7c945bb2c63e3))
- `@stream-io/video-react-bindings` updated to version `1.5.13`

- use RN 0.76.9 as a baseline ([#1750](https://github.com/GetStream/stream-video-js/issues/1750)) ([3846aa1](https://github.com/GetStream/stream-video-js/commit/3846aa1d748a2bb2dbf9262ec0036f2cf55874ea))

### Bug Fixes

- send device token when switching user ([#1752](https://github.com/GetStream/stream-video-js/issues/1752)) ([4a5d72e](https://github.com/GetStream/stream-video-js/commit/4a5d72eb90d838a462dccf77996270963c8ce0d1))

## [1.11.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.19...@stream-io/video-react-native-sdk-1.11.0) (2025-04-04)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.19.0`
- `@stream-io/video-react-bindings` updated to version `1.5.12`

### Features

- collect more granular RTC stats and RPC tracing ([#1735](https://github.com/GetStream/stream-video-js/issues/1735)) ([e356d6b](https://github.com/GetStream/stream-video-js/commit/e356d6b9fe361c186a5b92de55fabf0598ea4885))

## [1.10.19](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.18...@stream-io/video-react-native-sdk-1.10.19) (2025-04-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.9`
  - pick correct device for speaking while muted detection ([#1744](https://github.com/GetStream/stream-video-js/issues/1744)) ([33044f5](https://github.com/GetStream/stream-video-js/commit/33044f56ec7debba2e14d5a87dde9eaa87a02089)), closes [#1538](https://github.com/GetStream/stream-video-js/issues/1538)
  - reset the call state value when "live" ends ([#1740](https://github.com/GetStream/stream-video-js/issues/1740)) ([2123a10](https://github.com/GetStream/stream-video-js/commit/2123a104bb790a7384506fd475b779c02b116edd))
- `@stream-io/video-react-bindings` updated to version `1.5.11`

- remove react-native/eslint-config from the RN SDK ([#1743](https://github.com/GetStream/stream-video-js/issues/1743)) ([312d734](https://github.com/GetStream/stream-video-js/commit/312d73411642bdcc811885fb16d7d26a916c2d05))
- rn-178 refactor theme provider ([#1739](https://github.com/GetStream/stream-video-js/issues/1739)) ([3252a90](https://github.com/GetStream/stream-video-js/commit/3252a90d51db1e47abbd7a37a9fdf8e14504f24d))

## [1.10.18](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.17...@stream-io/video-react-native-sdk-1.10.18) (2025-04-01)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.8`
  - **Bug Fixes**
    - implement retry logic for call joining process ([#1738](https://github.com/GetStream/stream-video-js/issues/1738)) ([71599c3](https://github.com/GetStream/stream-video-js/commit/71599c3ddda51a247d7933cd6b12ca8fd03d7033))
  - **Other**
    - dependency upgrades and cleanup ([#1727](https://github.com/GetStream/stream-video-js/issues/1727)) ([c3b0ede](https://github.com/GetStream/stream-video-js/commit/c3b0ede3ce444c28c51457155e8ccff584c2c1e5))
- `@stream-io/video-react-bindings` updated to version `1.5.10`

- align expo plugin background modes with flutter ([f6950cb](https://github.com/GetStream/stream-video-js/commit/f6950cb39d0c83413aca1c59e670efea5c5cdd6a))
- dependency upgrades and cleanup ([#1727](https://github.com/GetStream/stream-video-js/issues/1727)) ([c3b0ede](https://github.com/GetStream/stream-video-js/commit/c3b0ede3ce444c28c51457155e8ccff584c2c1e5))
- RN Ringing App ([#1719](https://github.com/GetStream/stream-video-js/issues/1719)) ([6fcb33f](https://github.com/GetStream/stream-video-js/commit/6fcb33f3574adbf8f22cf016625fe53a11ed1169))

## [1.10.17](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.16...@stream-io/video-react-native-sdk-1.10.17) (2025-03-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.7`
  - rename `toJSON` to `asJSON` ([#1729](https://github.com/GetStream/stream-video-js/issues/1729)) ([0d7d074](https://github.com/GetStream/stream-video-js/commit/0d7d074dac1032690b5f4af4d6ba5fcdd56dfaa2))
  - update call reject reasons ([#1730](https://github.com/GetStream/stream-video-js/issues/1730)) ([100ed6b](https://github.com/GetStream/stream-video-js/commit/100ed6b9323b66e86123917abf4fc2973a677fca))
- `@stream-io/video-react-bindings` updated to version `1.5.9`

### Bug Fixes

- proper non ringing only push support without ringing libs ([#1731](https://github.com/GetStream/stream-video-js/issues/1731)) ([8135708](https://github.com/GetStream/stream-video-js/commit/8135708a5970de90d64aeed936a1225c9545fdf6))

## [1.10.16](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.15...@stream-io/video-react-native-sdk-1.10.16) (2025-03-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.6`
  - ensure negotiation runs sequentially ([#1722](https://github.com/GetStream/stream-video-js/issues/1722)) ([7e166aa](https://github.com/GetStream/stream-video-js/commit/7e166aaf606c3f751068cf60bd554e6374f701d7))
- `@stream-io/video-react-bindings` updated to version `1.5.8`

## [1.10.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.14...@stream-io/video-react-native-sdk-1.10.15) (2025-03-12)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.5`
  - **Bug Fixes**
    - add pending browser permission state ([#1718](https://github.com/GetStream/stream-video-js/issues/1718)) ([7f24be6](https://github.com/GetStream/stream-video-js/commit/7f24be63d33105d0688be7b5b625bc9b6aa0d3a9))
  - **Other**
    - Upgrade to Next 15.2 ([#1717](https://github.com/GetStream/stream-video-js/issues/1717)) ([9b1aec3](https://github.com/GetStream/stream-video-js/commit/9b1aec3447dee611c0d900db44add6b6c89e2b8d))
- `@stream-io/video-react-bindings` updated to version `1.5.7`

## [1.10.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.13...@stream-io/video-react-native-sdk-1.10.14) (2025-03-11)

### Bug Fixes

- setup ios accept/decline events before user is connected RN-153 ([#1716](https://github.com/GetStream/stream-video-js/issues/1716)) ([b5fb06a](https://github.com/GetStream/stream-video-js/commit/b5fb06af636c9e38b0ef7b90d51548bdf89961f8))

## [1.10.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.12...@stream-io/video-react-native-sdk-1.10.13) (2025-03-10)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.4`
  - retryable client.connectUser() ([#1710](https://github.com/GetStream/stream-video-js/issues/1710)) ([10b6860](https://github.com/GetStream/stream-video-js/commit/10b6860e1d65c38d8eb0ba7d7ea18f0ca30f5abc))
- `@stream-io/video-react-bindings` updated to version `1.5.6`

### Bug Fixes

- ios PiP track not fetched sometimes ([#1709](https://github.com/GetStream/stream-video-js/issues/1709)) ([ec20f97](https://github.com/GetStream/stream-video-js/commit/ec20f97dbb305c50f315bcd1293b9f160cfa1408))

## [1.10.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.11...@stream-io/video-react-native-sdk-1.10.12) (2025-03-06)

- **@stream-io/video-react-native-sdk:** release version 1.10.12 ([8730ef6](https://github.com/GetStream/stream-video-js/commit/8730ef61b38c7c48d90a959a1573a5612b9102bd))
- add background modes in our plugin as fallback if other plugins are not installed ([dd23ab8](https://github.com/GetStream/stream-video-js/commit/dd23ab87706d86b8181830ff1f44c421aabfb432))

### Bug Fixes

- do not remove notification type voip listener on unmount ([#1712](https://github.com/GetStream/stream-video-js/issues/1712)) ([51b7059](https://github.com/GetStream/stream-video-js/commit/51b7059ed8345c474edc4e30fed91b0339d3d36d))

## [1.10.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.11...@stream-io/video-react-native-sdk-1.10.12) (2025-03-05)

- add background modes in our plugin as fallback if other plugins are not installed ([dd23ab8](https://github.com/GetStream/stream-video-js/commit/dd23ab87706d86b8181830ff1f44c421aabfb432))

### Bug Fixes

- do not remove notification type voip listener on unmount ([#1712](https://github.com/GetStream/stream-video-js/issues/1712)) ([51b7059](https://github.com/GetStream/stream-video-js/commit/51b7059ed8345c474edc4e30fed91b0339d3d36d))

## [1.10.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.10...@stream-io/video-react-native-sdk-1.10.11) (2025-03-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.3`
  - revert the release of cloned track on publisher dispose ([556fb61](https://github.com/GetStream/stream-video-js/commit/556fb610ae1c9a1965f38fc07e995683b5052544))
- `@stream-io/video-react-bindings` updated to version `1.5.5`

## [1.10.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.9...@stream-io/video-react-native-sdk-1.10.10) (2025-03-04)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.2`
  - do not accept again on reconnections ([#1705](https://github.com/GetStream/stream-video-js/issues/1705)) ([bedd2d8](https://github.com/GetStream/stream-video-js/commit/bedd2d8aafd7ff8260f63b500e25807518ccd365))
  - do not stop original track in RN ([#1708](https://github.com/GetStream/stream-video-js/issues/1708)) ([ab0ada2](https://github.com/GetStream/stream-video-js/commit/ab0ada283c753d4cdfd59b6eaf75af26cf54fd7e))
  - prevent extra unnecessary reconnect after offline to online ([#1706](https://github.com/GetStream/stream-video-js/issues/1706)) ([bc3920a](https://github.com/GetStream/stream-video-js/commit/bc3920a81f398fd9e166ee4517b32d58f50d56fe))
- `@stream-io/video-react-bindings` updated to version `1.5.4`

## [1.10.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.8...@stream-io/video-react-native-sdk-1.10.9) (2025-02-28)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.1`
  - prevent reconnecting state when offline ([#1703](https://github.com/GetStream/stream-video-js/issues/1703)) ([aeac90d](https://github.com/GetStream/stream-video-js/commit/aeac90d8b7b14820e3e0e30282e51fc7824f8bf8))
- `@stream-io/video-react-bindings` updated to version `1.5.3`

## [1.10.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.7...@stream-io/video-react-native-sdk-1.10.8) (2025-02-27)

### Bug Fixes

- do not stop incall manager on change of audio settings ([#1702](https://github.com/GetStream/stream-video-js/issues/1702)) ([e35194d](https://github.com/GetStream/stream-video-js/commit/e35194dc4a789cc281b9f2d4488ffe11840986f7))

## [1.10.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.6...@stream-io/video-react-native-sdk-1.10.7) (2025-02-26)

- pinning rn dev dep for sdk ([0e78ddc](https://github.com/GetStream/stream-video-js/commit/0e78ddcfabdd7f42849cad47efa0da623c2021cb))

### Bug Fixes

- pip race condition ([#1700](https://github.com/GetStream/stream-video-js/issues/1700)) ([60c8aa6](https://github.com/GetStream/stream-video-js/commit/60c8aa6c5651072f15da1770e9840d3f2b8c11c0))

## [1.10.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.5...@stream-io/video-react-native-sdk-1.10.6) (2025-02-26)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.0`
  - **Features**
    - align SDK version reporting, use higher-entropy user agent data for stats ([#1696](https://github.com/GetStream/stream-video-js/issues/1696)) ([e02e8d9](https://github.com/GetStream/stream-video-js/commit/e02e8d9b3843086a3fa859a8bd31ba65ace5a7fd))
  - **Bug Fixes**
    - don't implicitly mark calls as `ringing` ([#1697](https://github.com/GetStream/stream-video-js/issues/1697)) ([3429a7b](https://github.com/GetStream/stream-video-js/commit/3429a7ba52e13a43b96d2c3c28f270da111f84b2)), closes [/github.com/GetStream/stream-video-js/issues/1561#issuecomment-2662584543](https://github.com/GetStream//github.com/GetStream/stream-video-js/issues/1561/issues/issuecomment-2662584543)
    - use axios version that doesnt import node specific module ([#1699](https://github.com/GetStream/stream-video-js/issues/1699)) ([414e01b](https://github.com/GetStream/stream-video-js/commit/414e01b9c7e4c4862b429e48c506673bcc228fa4))
- `@stream-io/video-react-bindings` updated to version `1.5.2`

### Bug Fixes

- config plugin not being resolved in expo 50 ([#1698](https://github.com/GetStream/stream-video-js/issues/1698)) ([5060ba3](https://github.com/GetStream/stream-video-js/commit/5060ba32421b31108df0c4a0b4e52997df833b3c)), closes [#1694](https://github.com/GetStream/stream-video-js/issues/1694)

## [1.10.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.4...@stream-io/video-react-native-sdk-1.10.5) (2025-02-25)

### Bug Fixes

- callControls styling issue ([#1689](https://github.com/GetStream/stream-video-js/issues/1689)) ([3d68faa](https://github.com/GetStream/stream-video-js/commit/3d68faa3369a05ab59cd6ccd887881a016dfee93))
- expo build issues ([#1695](https://github.com/GetStream/stream-video-js/issues/1695)) ([7fe7424](https://github.com/GetStream/stream-video-js/commit/7fe742496ba484b9d5149a39f8c05a504f2aff00))
- ios distinct values ([#1692](https://github.com/GetStream/stream-video-js/issues/1692)) ([d83291d](https://github.com/GetStream/stream-video-js/commit/d83291d439abd41aa0f2654f42c130b4f9375719))
- ios ipad crash in incoming call component ([#1691](https://github.com/GetStream/stream-video-js/issues/1691)) ([df79fbe](https://github.com/GetStream/stream-video-js/commit/df79fbef24369d9a0d49f31b8b0d6e7bbf986cc7))

## [1.10.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.3...@stream-io/video-react-native-sdk-1.10.4) (2025-02-19)

### Bug Fixes

- add smallIcon to android push config for expo naming support ([ef94317](https://github.com/GetStream/stream-video-js/commit/ef943174d6e40c94c5c6b02fd0e6be06081ab429))

## [1.10.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.2...@stream-io/video-react-native-sdk-1.10.3) (2025-02-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.17.1`
  - do not reconnect when device is offline ([#1688](https://github.com/GetStream/stream-video-js/issues/1688)) ([c6b6f58](https://github.com/GetStream/stream-video-js/commit/c6b6f58310a3365eb6f40d76a15c26791f413241))
- `@stream-io/video-react-bindings` updated to version `1.5.1`

## [1.10.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.1...@stream-io/video-react-native-sdk-1.10.2) (2025-02-19)

### Bug Fixes

- early completion call on iOS remote notifications ([#1687](https://github.com/GetStream/stream-video-js/issues/1687)) ([39c4ba7](https://github.com/GetStream/stream-video-js/commit/39c4ba73199efa8b2e2335473b153dc50ec31653))

## [1.10.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.10.0...@stream-io/video-react-native-sdk-1.10.1) (2025-02-18)

### Bug Fixes

- do not remove voip listeners for wrong user ([#1686](https://github.com/GetStream/stream-video-js/issues/1686)) ([c6dd17d](https://github.com/GetStream/stream-video-js/commit/c6dd17d040bb84a388d773020a833cbe4b67b41c))

## [1.10.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.31...@stream-io/video-react-native-sdk-1.10.0) (2025-02-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.17.0`
- `@stream-io/video-react-bindings` updated to version `1.5.0`
- `@stream-io/video-filters-react-native` updated to version `0.2.8`

- update webrtc deps ([6ea4861](https://github.com/GetStream/stream-video-js/commit/6ea4861eb1b390c82f6ea6d01d6c5e80bdab8b84))

### Features

- support static token and token provider at the same time ([#1685](https://github.com/GetStream/stream-video-js/issues/1685)) ([4365a3d](https://github.com/GetStream/stream-video-js/commit/4365a3dd0a14c98041982bde8be21258b8cfd571))

## [1.9.31](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.30...@stream-io/video-react-native-sdk-1.9.31) (2025-02-13)

### Bug Fixes

- voip token not able to be got if user switched ([#1683](https://github.com/GetStream/stream-video-js/issues/1683)) ([8f2a376](https://github.com/GetStream/stream-video-js/commit/8f2a37663fbc88701a1ce526acaf5a4e4c3afbc3))

## [1.9.30](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.29...@stream-io/video-react-native-sdk-1.9.30) (2025-02-12)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.16.7`
  - relax device constraints on NotFoundError DOMException ([#1680](https://github.com/GetStream/stream-video-js/issues/1680)) ([c682908](https://github.com/GetStream/stream-video-js/commit/c682908408395f6863fd1549958cf4203bcc7f32))
- `@stream-io/video-react-bindings` updated to version `1.4.15`

## [1.9.29](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.28...@stream-io/video-react-native-sdk-1.9.29) (2025-02-12)

### Bug Fixes

- warn natively if notifee is not configured for keep call alive ([#1678](https://github.com/GetStream/stream-video-js/issues/1678)) ([f6f11ad](https://github.com/GetStream/stream-video-js/commit/f6f11ad5f691ce56f65d824e1ab12c6ebc7540c4)), closes [#1587](https://github.com/GetStream/stream-video-js/issues/1587)

## [1.9.28](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.27...@stream-io/video-react-native-sdk-1.9.28) (2025-02-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.16.6`
- `@stream-io/video-react-bindings` updated to version `1.4.14`
- `@stream-io/video-filters-react-native` updated to version `0.2.7`

### Bug Fixes

- prefer the async apply constraints for flip ([#1679](https://github.com/GetStream/stream-video-js/issues/1679)) ([8c246cc](https://github.com/GetStream/stream-video-js/commit/8c246cc4e9f1ac766366cf24b82dd99aa868017d))

## [1.9.27](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.26...@stream-io/video-react-native-sdk-1.9.27) (2025-02-10)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.16.5`
  - ensure all tracks are stopped when disposing a Publisher ([#1677](https://github.com/GetStream/stream-video-js/issues/1677)) ([172d345](https://github.com/GetStream/stream-video-js/commit/172d345ceada2bf82df1aec604a2325947896c5c)), closes [#1676](https://github.com/GetStream/stream-video-js/issues/1676)
- `@stream-io/video-react-bindings` updated to version `1.4.13`

## [1.9.26](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.25...@stream-io/video-react-native-sdk-1.9.26) (2025-02-10)

### Bug Fixes

- attempt workaround for bad notification for start foreground ([402ff06](https://github.com/GetStream/stream-video-js/commit/402ff067f05364724f30dbd21af996336d1dfa2f))

## [1.9.25](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.24...@stream-io/video-react-native-sdk-1.9.25) (2025-02-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.16.4`
  - ensure tracks are stopped when disposing a Publisher ([#1676](https://github.com/GetStream/stream-video-js/issues/1676)) ([948f672](https://github.com/GetStream/stream-video-js/commit/948f672243e1f2a0e9499184ee31db4bc88f9952))
- `@stream-io/video-react-bindings` updated to version `1.4.12`

## [1.9.24](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.23...@stream-io/video-react-native-sdk-1.9.24) (2025-02-07)

- bump to webrtc-125.0.4 ([#1675](https://github.com/GetStream/stream-video-js/issues/1675)) ([c4b9ad8](https://github.com/GetStream/stream-video-js/commit/c4b9ad8a30403c9f2ebd8ba681fcc97c048d00e8))

### Bug Fixes

- send voip token also when connectUser is called later ([#1665](https://github.com/GetStream/stream-video-js/issues/1665)) ([aab92c0](https://github.com/GetStream/stream-video-js/commit/aab92c0b1029aec7fedb2afac43585752bcd0b07))

## [1.9.23](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.22...@stream-io/video-react-native-sdk-1.9.23) (2025-02-06)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.16.3`
  - relaxed validation for submitting feedback ([#1673](https://github.com/GetStream/stream-video-js/issues/1673)) ([98685b9](https://github.com/GetStream/stream-video-js/commit/98685b9fcf3c3b0309a7072d51cde4657e028528))
- `@stream-io/video-react-bindings` updated to version `1.4.11`

## [1.9.22](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.21...@stream-io/video-react-native-sdk-1.9.22) (2025-02-06)

### Bug Fixes

- closed captions and speaker border bugfixes ([#1670](https://github.com/GetStream/stream-video-js/issues/1670)) ([275ddb5](https://github.com/GetStream/stream-video-js/commit/275ddb5193110dc88b45a4155858e91b194db0b3))

## [1.9.21](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.20...@stream-io/video-react-native-sdk-1.9.21) (2025-02-06)

### Bug Fixes

- NoClassDefFoundError on PiP on android 7 and below ([70ac465](https://github.com/GetStream/stream-video-js/commit/70ac4656b5f0b42c649f38ff288adb47eff02907))

## [1.9.20](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.19...@stream-io/video-react-native-sdk-1.9.20) (2025-02-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.16.2`
  - race condition with unrecoverable error handling ([#1672](https://github.com/GetStream/stream-video-js/issues/1672)) ([be8095c](https://github.com/GetStream/stream-video-js/commit/be8095ce946cf98a0dfc1f3ea3391376cc7d2896)), closes [#1649](https://github.com/GetStream/stream-video-js/issues/1649) [#1618](https://github.com/GetStream/stream-video-js/issues/1618)
- `@stream-io/video-react-bindings` updated to version `1.4.10`

## [1.9.19](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.18...@stream-io/video-react-native-sdk-1.9.19) (2025-02-05)

### Bug Fixes

- start foreground service only when app is in active state ([f8bfef8](https://github.com/GetStream/stream-video-js/commit/f8bfef89f8151695bbc405244a9f77097fe6892e))

## [1.9.18](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.17...@stream-io/video-react-native-sdk-1.9.18) (2025-02-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.16.1`
  - **Bug Fixes**
    - do not mute track on camera flip ([#1671](https://github.com/GetStream/stream-video-js/issues/1671)) ([963eb4d](https://github.com/GetStream/stream-video-js/commit/963eb4d4e5d6b96afb61b4da23a05ad92bcb3973))
  - **Other**
    - add trace log for call unregister ([e20d9dc](https://github.com/GetStream/stream-video-js/commit/e20d9dc28b35c5dd0c921ccc3e18923a344ae5ab))
- `@stream-io/video-react-bindings` updated to version `1.4.9`

## [1.9.17](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.16...@stream-io/video-react-native-sdk-1.9.17) (2025-02-03)

### Bug Fixes

- handle null activities for pip on android ([dd9b59d](https://github.com/GetStream/stream-video-js/commit/dd9b59d526fd3fdc780b8a45792563bf12837618))
- prefer remote participants for PiP ([1c0f9a1](https://github.com/GetStream/stream-video-js/commit/1c0f9a1c278cf87b5584e13011d311af814a537b))

## [1.9.16](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.15...@stream-io/video-react-native-sdk-1.9.16) (2025-01-31)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.16.0`
  - OpenAPI upgrades and HLS status reporting ([#1668](https://github.com/GetStream/stream-video-js/issues/1668)) ([2f377b8](https://github.com/GetStream/stream-video-js/commit/2f377b8772f7b9fc8fcb8b8e9b3eecb1920bc7d0))
- `@stream-io/video-react-bindings` updated to version `1.4.8`

## [1.9.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.14...@stream-io/video-react-native-sdk-1.9.15) (2025-01-31)

### Bug Fixes

- added missed call events to push config types ([#1667](https://github.com/GetStream/stream-video-js/issues/1667)) ([36a9683](https://github.com/GetStream/stream-video-js/commit/36a96839b095a9d3cd736a1bd60b9a01f6160421))
- open fg service only on a successful join ([#1666](https://github.com/GetStream/stream-video-js/issues/1666)) ([dd5d8f8](https://github.com/GetStream/stream-video-js/commit/dd5d8f8d5c390a16ad35d7b5b4f0e8b254f0f5f6))

## [1.9.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.13...@stream-io/video-react-native-sdk-1.9.14) (2025-01-29)

### Bug Fixes

- add callkit audio methods for expo ([#1659](https://github.com/GetStream/stream-video-js/issues/1659)) ([89a53ec](https://github.com/GetStream/stream-video-js/commit/89a53ece63f7f6f4f4275d4697052a86fdad8a79))

## [1.9.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.12...@stream-io/video-react-native-sdk-1.9.13) (2025-01-29)

### Bug Fixes

- rare crash - startForegroundService() did not then call Service.startForeground ([71d11de](https://github.com/GetStream/stream-video-js/commit/71d11de31612f04d4852fccd655e0e39ad2defdf))

## [1.9.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.11...@stream-io/video-react-native-sdk-1.9.12) (2025-01-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.15.7`
  - speech detection and align mic disable with web ([#1658](https://github.com/GetStream/stream-video-js/issues/1658)) ([fd908fb](https://github.com/GetStream/stream-video-js/commit/fd908fb2b70e6bade595f44107ca2f85aa4d5631))
- `@stream-io/video-react-bindings` updated to version `1.4.7`

## [1.9.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.10...@stream-io/video-react-native-sdk-1.9.11) (2025-01-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.15.6`
  - ensures that maxBitrate is an integer ([#1657](https://github.com/GetStream/stream-video-js/issues/1657)) ([69eee96](https://github.com/GetStream/stream-video-js/commit/69eee969ac4d52e3410d8e5e12e012b02a5eb1b7)), closes [#1527](https://github.com/GetStream/stream-video-js/issues/1527)
- `@stream-io/video-react-bindings` updated to version `1.4.6`

## [1.9.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.9...@stream-io/video-react-native-sdk-1.9.10) (2025-01-24)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.15.5`
  - remove the participants from state when leaving call ([003ac26](https://github.com/GetStream/stream-video-js/commit/003ac26eff3c14779d5f25e6e64973c88a5b811d))
- `@stream-io/video-react-bindings` updated to version `1.4.5`

## [1.9.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.8...@stream-io/video-react-native-sdk-1.9.9) (2025-01-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.15.4`
  - leave ringing call if accepted or rejected elsewhere ([#1654](https://github.com/GetStream/stream-video-js/issues/1654)) ([9f25adf](https://github.com/GetStream/stream-video-js/commit/9f25adf8796db369f7e3e236e6a178f525ae8f55))
- `@stream-io/video-react-bindings` updated to version `1.4.4`

## [1.9.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.7...@stream-io/video-react-native-sdk-1.9.8) (2025-01-23)

### Bug Fixes

- unnecessary reject from callkeep ([15aaa0d](https://github.com/GetStream/stream-video-js/commit/15aaa0d79a9d608eff801a2eb1dd913fff19dfd3))

## [1.9.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.6...@stream-io/video-react-native-sdk-1.9.7) (2025-01-22)

### Bug Fixes

- do not reject from callkit if call is accepted already ([#1651](https://github.com/GetStream/stream-video-js/issues/1651)) ([87b76ba](https://github.com/GetStream/stream-video-js/commit/87b76ba54defc287a259c6d83bfde252b503f199))

## [1.9.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.5...@stream-io/video-react-native-sdk-1.9.6) (2025-01-22)

### Bug Fixes

- pip android crash on activity not enabled ([#1650](https://github.com/GetStream/stream-video-js/issues/1650)) ([013853b](https://github.com/GetStream/stream-video-js/commit/013853b11d83c9959dfc6805e1be492d0b1d36f5))

## [1.9.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.4...@stream-io/video-react-native-sdk-1.9.5) (2025-01-21)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.15.3`
  - restore calling state if SFU connection fails during join ([#1652](https://github.com/GetStream/stream-video-js/issues/1652)) ([ff7f221](https://github.com/GetStream/stream-video-js/commit/ff7f221ad285ca1994fc3a780aa8183df2de3e99))
- `@stream-io/video-react-bindings` updated to version `1.4.3`

## [1.9.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.3...@stream-io/video-react-native-sdk-1.9.4) (2025-01-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.15.2`
  - improved error handling when connecting to an SFU ([#1648](https://github.com/GetStream/stream-video-js/issues/1648)) ([27332b4](https://github.com/GetStream/stream-video-js/commit/27332b484094e26a123a1dfe8bb614c35ce1022a))
- `@stream-io/video-react-bindings` updated to version `1.4.2`

## [1.9.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.2...@stream-io/video-react-native-sdk-1.9.3) (2025-01-20)

### Bug Fixes

- ios 18 pip support ([#1646](https://github.com/GetStream/stream-video-js/issues/1646)) ([242bd1f](https://github.com/GetStream/stream-video-js/commit/242bd1fe08381805a24cc8d17671dd009b79cb09)), closes [#1647](https://github.com/GetStream/stream-video-js/issues/1647)

## [1.9.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.1...@stream-io/video-react-native-sdk-1.9.2) (2025-01-17)

### Bug Fixes

- **rn-sdk:** fixes the camera status on app restore from background ([#1641](https://github.com/GetStream/stream-video-js/issues/1641)) ([0ff2506](https://github.com/GetStream/stream-video-js/commit/0ff2506de4d3db30a86ab27ee8dcfaa2fe8f0ddc))

## [1.9.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.9.0...@stream-io/video-react-native-sdk-1.9.1) (2025-01-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.15.1`
  - update mute state only for video track on mobile ([#1645](https://github.com/GetStream/stream-video-js/issues/1645)) ([c0507cb](https://github.com/GetStream/stream-video-js/commit/c0507cb02e0058b8b968237220234771c9a30e6f)), closes [#1527](https://github.com/GetStream/stream-video-js/issues/1527)
- `@stream-io/video-react-bindings` updated to version `1.4.1`

## [1.9.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.8.0...@stream-io/video-react-native-sdk-1.9.0) (2025-01-16)

### Features

- android 12+ pip uses setAutoEnterEnabled api ([#1643](https://github.com/GetStream/stream-video-js/issues/1643)) ([b07a9a6](https://github.com/GetStream/stream-video-js/commit/b07a9a6a2d97fded37161cfbabc4d9a73baae26a))

## [1.8.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.7.0...@stream-io/video-react-native-sdk-1.8.0) (2025-01-15)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.15.0`
- `@stream-io/video-react-bindings` updated to version `1.4.0`
- `@stream-io/video-filters-react-native` updated to version `0.2.6`

### Features

- Codec Negotiation ([#1527](https://github.com/GetStream/stream-video-js/issues/1527)) ([2e9e344](https://github.com/GetStream/stream-video-js/commit/2e9e344d5259e3069dddb17846013becef24829e))

## [1.7.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.6.1...@stream-io/video-react-native-sdk-1.7.0) (2025-01-08)

### Features

- update peer deps and sample app to webrtc v125 ([#1638](https://github.com/GetStream/stream-video-js/issues/1638)) ([2b9074f](https://github.com/GetStream/stream-video-js/commit/2b9074f8fdb857699fa5fa429be424dc0496363e))

## [1.6.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.6.0...@stream-io/video-react-native-sdk-1.6.1) (2025-01-06)

- **rn-video:** upgrade to expo ver 52 ([#1630](https://github.com/GetStream/stream-video-js/issues/1630)) ([7eec9b0](https://github.com/GetStream/stream-video-js/commit/7eec9b0616a6c8f397a00d0c48da8932fd2b7dfc))

### Bug Fixes

- foreground service cannot be started in background exception ([#1635](https://github.com/GetStream/stream-video-js/issues/1635)) ([bb82021](https://github.com/GetStream/stream-video-js/commit/bb820214b85e08c7be726e0da27b6739681e07e2))

## [1.6.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.5.2...@stream-io/video-react-native-sdk-1.6.0) (2025-01-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.14.0`
- `@stream-io/video-react-bindings` updated to version `1.3.0`

### Features

- **closed captions:** Integration in the SDKs ([#1508](https://github.com/GetStream/stream-video-js/issues/1508)) ([bcb8589](https://github.com/GetStream/stream-video-js/commit/bcb85892c0dafcb03f9debf8d2fd361622224166))

## [1.5.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.5.1...@stream-io/video-react-native-sdk-1.5.2) (2024-12-31)

### Bug Fixes

- iOS thermal state issue ([#1633](https://github.com/GetStream/stream-video-js/issues/1633)) ([3d2a4c4](https://github.com/GetStream/stream-video-js/commit/3d2a4c42a4de2eb0e8f43586c6d4b0aaed1d34e4))

## [1.5.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.5.0...@stream-io/video-react-native-sdk-1.5.1) (2024-12-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.13.1`
  - **client:** fix the initial value of deviceState in clientDetails ([#1629](https://github.com/GetStream/stream-video-js/issues/1629)) ([afefb67](https://github.com/GetStream/stream-video-js/commit/afefb67a568899e2ce500e6dad36e64b6b0e5a3d))
- `@stream-io/video-react-bindings` updated to version `1.2.16`

## [1.5.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.22...@stream-io/video-react-native-sdk-1.5.0) (2024-12-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.13.0`
- `@stream-io/video-react-bindings` updated to version `1.2.15`

### Features

- report low power mode and thermal info to stats ([#1583](https://github.com/GetStream/stream-video-js/issues/1583)) ([ef49cee](https://github.com/GetStream/stream-video-js/commit/ef49ceef032fc3e4bb055fbc32c2b5b18c3a24d2))

## [1.4.22](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.21...@stream-io/video-react-native-sdk-1.4.22) (2024-12-19)

### Bug Fixes

- **rn-video:** highlightedContainer prop typo ([#1627](https://github.com/GetStream/stream-video-js/issues/1627)) ([56d9137](https://github.com/GetStream/stream-video-js/commit/56d9137514701b9313a6ea9ee8ba2f6ff2f61209))

## [1.4.21](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.20...@stream-io/video-react-native-sdk-1.4.21) (2024-12-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.12.4`
  - **Bug Fixes**
    - adjust dynascale debouncing for upscaling and downscaling ([#1621](https://github.com/GetStream/stream-video-js/issues/1621)) [skip ci] ([7b3a721](https://github.com/GetStream/stream-video-js/commit/7b3a72192fab79d8af8d1c392a9f0135e2d25b16))
    - prevent auto-dropping already accepted or rejected calls ([#1619](https://github.com/GetStream/stream-video-js/issues/1619)) ([113406a](https://github.com/GetStream/stream-video-js/commit/113406a9ba7fdf2e193a1933b73963e0011f28f0))
  - **Other**
    - improve test coverage reporting ([#1624](https://github.com/GetStream/stream-video-js/issues/1624)) ([32bb870](https://github.com/GetStream/stream-video-js/commit/32bb870187f0627c32d2b5692ce3de633d743582))
- `@stream-io/video-react-bindings` updated to version `1.2.14`

## [1.4.20](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.19...@stream-io/video-react-native-sdk-1.4.20) (2024-12-16)

### Bug Fixes

- **expo:** tools not present when notifee service is added ([edccf62](https://github.com/GetStream/stream-video-js/commit/edccf62261183198871f3962ef19650ed4fc1729))

## [1.4.19](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.18...@stream-io/video-react-native-sdk-1.4.19) (2024-12-16)

### Bug Fixes

- **rn:** break cyclic dependencies issue ([#1626](https://github.com/GetStream/stream-video-js/issues/1626)) ([ef30579](https://github.com/GetStream/stream-video-js/commit/ef3057949648581a5e17775661c859f693191f92))

## [1.4.18](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.17...@stream-io/video-react-native-sdk-1.4.18) (2024-12-16)

### Bug Fixes

- metro commonjs issues with optional libs ([#1625](https://github.com/GetStream/stream-video-js/issues/1625)) ([78b5f05](https://github.com/GetStream/stream-video-js/commit/78b5f050c20c67f77c154a8fd5d1c4e59b72989f)), closes [#1620](https://github.com/GetStream/stream-video-js/issues/1620)

## [1.4.17](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.16...@stream-io/video-react-native-sdk-1.4.17) (2024-12-13)

### Bug Fixes

- **rn-sdk:** allow prop component ParticipantVideoFallback in FloatingParticipantView ([#1623](https://github.com/GetStream/stream-video-js/issues/1623)) ([d69ee13](https://github.com/GetStream/stream-video-js/commit/d69ee13f6fc882c006e3948c359ea8946c2a92f0))

## [1.4.16](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.15...@stream-io/video-react-native-sdk-1.4.16) (2024-12-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.12.3`
- `@stream-io/video-react-bindings` updated to version `1.2.13`

### Bug Fixes

- multiple rare ringing issues in react-native ([#1611](https://github.com/GetStream/stream-video-js/issues/1611)) ([4e25264](https://github.com/GetStream/stream-video-js/commit/4e25264808eab469b7b7ab184fb19961d47bdff3))

## [1.4.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.14...@stream-io/video-react-native-sdk-1.4.15) (2024-12-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.12.2`
  - **Bug Fixes**
    - pre-built timer worker ([#1617](https://github.com/GetStream/stream-video-js/issues/1617)) ([94dacef](https://github.com/GetStream/stream-video-js/commit/94dacef1c2b1e8794a42657ddab29a3b584eb0b4)), closes [#1557](https://github.com/GetStream/stream-video-js/issues/1557)
  - **Other**
    - drop docusaurus docs ([#1613](https://github.com/GetStream/stream-video-js/issues/1613)) ([8743c8d](https://github.com/GetStream/stream-video-js/commit/8743c8d221191759266010c6cd053480da1d71a5))
- `@stream-io/video-react-bindings` updated to version `1.2.12`

- drop docusaurus docs ([#1613](https://github.com/GetStream/stream-video-js/issues/1613)) ([8743c8d](https://github.com/GetStream/stream-video-js/commit/8743c8d221191759266010c6cd053480da1d71a5))

## [1.4.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.13...@stream-io/video-react-native-sdk-1.4.14) (2024-12-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.12.1`
  - reenable usage of ringing filters with useCalls ([1dffaed](https://github.com/GetStream/stream-video-js/commit/1dffaed609ac147a6030a4fb103c4dd586db775e))
- `@stream-io/video-react-bindings` updated to version `1.2.11`

## [1.4.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.12...@stream-io/video-react-native-sdk-1.4.13) (2024-12-10)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.12.0`
  - Aggregate stats reports - request and response objects ([#1614](https://github.com/GetStream/stream-video-js/issues/1614)) ([8a47fea](https://github.com/GetStream/stream-video-js/commit/8a47fea491232e524b1de780c12c0d00e0f02bcd))
- `@stream-io/video-react-bindings` updated to version `1.2.10`

## [1.4.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.11...@stream-io/video-react-native-sdk-1.4.12) (2024-12-09)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.15`
  - avoid call.get in all call.ring events ([#1615](https://github.com/GetStream/stream-video-js/issues/1615)) ([c757370](https://github.com/GetStream/stream-video-js/commit/c7573701a20b4a29cd2b6fd08a55d4eff503f77f))
- `@stream-io/video-react-bindings` updated to version `1.2.9`

## [1.4.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.10...@stream-io/video-react-native-sdk-1.4.11) (2024-12-04)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.14`
  - prevent device list observable from erroring ([#1608](https://github.com/GetStream/stream-video-js/issues/1608)) ([06af3e7](https://github.com/GetStream/stream-video-js/commit/06af3e7e03b63551c781512c797ac10c0486d0c7))
- `@stream-io/video-react-bindings` updated to version `1.2.8`

## [1.4.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.9...@stream-io/video-react-native-sdk-1.4.10) (2024-12-03)

### Bug Fixes

- remove cameraroll permissions ([#1610](https://github.com/GetStream/stream-video-js/issues/1610)) ([973d00e](https://github.com/GetStream/stream-video-js/commit/973d00ec73381211cd42711e2d76625f69b93a7c))

## [1.4.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.8...@stream-io/video-react-native-sdk-1.4.9) (2024-12-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.13`
  - use worker to prevent timer throttling ([#1557](https://github.com/GetStream/stream-video-js/issues/1557)) ([c11c3ca](https://github.com/GetStream/stream-video-js/commit/c11c3caf455787fe531c83601bad71e7a0a0e9b9))
- `@stream-io/video-react-bindings` updated to version `1.2.7`

## [1.4.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.7...@stream-io/video-react-native-sdk-1.4.8) (2024-12-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.12`
  - handle timeout on SFU WS connections ([#1600](https://github.com/GetStream/stream-video-js/issues/1600)) ([5f2db7b](https://github.com/GetStream/stream-video-js/commit/5f2db7bd5cfdf57cdc04d6a6ed752f43e5b06657))
- `@stream-io/video-react-bindings` updated to version `1.2.6`

## [1.4.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.6...@stream-io/video-react-native-sdk-1.4.7) (2024-11-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.11`
  - revert [#1604](https://github.com/GetStream/stream-video-js/issues/1604) ([#1607](https://github.com/GetStream/stream-video-js/issues/1607)) ([567e4fb](https://github.com/GetStream/stream-video-js/commit/567e4fb309509b6b0d814826856d0a15efe16271))
- `@stream-io/video-react-bindings` updated to version `1.2.5`

## [1.4.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.5...@stream-io/video-react-native-sdk-1.4.6) (2024-11-29)

### Bug Fixes

- call joining, dominant speaker for pip android, spotlight layout for tablets ([#1603](https://github.com/GetStream/stream-video-js/issues/1603)) ([68ba86b](https://github.com/GetStream/stream-video-js/commit/68ba86b8c940b9559cdfba2db926afe707864a81))

## [1.4.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.4...@stream-io/video-react-native-sdk-1.4.5) (2024-11-28)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.10`
  - ringing calls not being left when ended ([#1601](https://github.com/GetStream/stream-video-js/issues/1601)) ([1c2b9d1](https://github.com/GetStream/stream-video-js/commit/1c2b9d1a54767652acc52cae9bb3d348c9df566f))
- `@stream-io/video-react-bindings` updated to version `1.2.4`

## [1.4.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.3...@stream-io/video-react-native-sdk-1.4.4) (2024-11-27)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.9`
  - cover some device selection edge cases ([#1604](https://github.com/GetStream/stream-video-js/issues/1604)) ([a8fc0ea](https://github.com/GetStream/stream-video-js/commit/a8fc0eaf1ed6c79ce24f77f52351a1e90701bd02))
- `@stream-io/video-react-bindings` updated to version `1.2.3`

## [1.4.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.2...@stream-io/video-react-native-sdk-1.4.3) (2024-11-27)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.8`
  - **ios:** use vp8 when h264 constrainted baseline isn't available ([#1597](https://github.com/GetStream/stream-video-js/issues/1597)) ([6281216](https://github.com/GetStream/stream-video-js/commit/62812161cef5e9917c504dbc4cd9257709ea5fa1))
- `@stream-io/video-react-bindings` updated to version `1.2.2`

## [1.4.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.1...@stream-io/video-react-native-sdk-1.4.2) (2024-11-27)

### Bug Fixes

- disable join call button to prevent multiple call joins ([#1602](https://github.com/GetStream/stream-video-js/issues/1602)) ([9079217](https://github.com/GetStream/stream-video-js/commit/9079217ab7cc5a87a948059d206c334433c7da8f))

## [1.4.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.4.0...@stream-io/video-react-native-sdk-1.4.1) (2024-11-26)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.7`
  - remove unused code from the coordinator websocket impl ([#1563](https://github.com/GetStream/stream-video-js/issues/1563)) ([921b820](https://github.com/GetStream/stream-video-js/commit/921b820133885dac299dab343cee3fc4b08705ce))
- `@stream-io/video-react-bindings` updated to version `1.2.1`

## [1.4.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.3.8...@stream-io/video-react-native-sdk-1.4.0) (2024-11-25)

### Dependency Updates

- `@stream-io/video-react-bindings` updated to version `1.2.0`

### Features

- **design-v2:** sdk and dogfood app design-v2 changes ([#1549](https://github.com/GetStream/stream-video-js/issues/1549)) ([480a359](https://github.com/GetStream/stream-video-js/commit/480a3593516e6662b35a44f97c72259548d08445))

## [1.3.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.3.7...@stream-io/video-react-native-sdk-1.3.8) (2024-11-22)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.6`
  - force single codec preference in the SDP ([#1588](https://github.com/GetStream/stream-video-js/issues/1588)) ([4afff09](https://github.com/GetStream/stream-video-js/commit/4afff09a778f8567176d22bcc22d36001dca7cd3)), closes [#1581](https://github.com/GetStream/stream-video-js/issues/1581)
- `@stream-io/video-react-bindings` updated to version `1.1.23`

## [1.3.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.3.6...@stream-io/video-react-native-sdk-1.3.7) (2024-11-22)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.5`
  - unhandled promise rejections during reconnect ([#1585](https://github.com/GetStream/stream-video-js/issues/1585)) ([920c4ea](https://github.com/GetStream/stream-video-js/commit/920c4ea3b3f622430b35ac1bade74a6206ee17e5)), closes [/github.com/GetStream/stream-video-js/pull/1585/files#diff-420f6ddab47c1be72fd9ce8c99e1fa2b9f5f0495b7c367546ee0ff634beaed81](https://github.com/GetStream//github.com/GetStream/stream-video-js/pull/1585/files/issues/diff-420f6ddab47c1be72fd9ce8c99e1fa2b9f5f0495b7c367546ee0ff634beaed81)
- `@stream-io/video-react-bindings` updated to version `1.1.22`

## [1.3.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.3.5...@stream-io/video-react-native-sdk-1.3.6) (2024-11-21)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.4`
  - experimental option to force single codec preference in the SDP ([#1581](https://github.com/GetStream/stream-video-js/issues/1581)) ([894a86e](https://github.com/GetStream/stream-video-js/commit/894a86e407dc0dd36b7463bb964c86da0c3055d1))
- `@stream-io/video-react-bindings` updated to version `1.1.21`

## [1.3.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.3.4...@stream-io/video-react-native-sdk-1.3.5) (2024-11-21)

### Dependency Updates

- `@stream-io/video-filters-react-native` updated to version `0.2.5`

## [1.3.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.3.3...@stream-io/video-react-native-sdk-1.3.4) (2024-11-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.3`
  - respect codec overrides when computing the video layers ([#1582](https://github.com/GetStream/stream-video-js/issues/1582)) ([c22b83e](https://github.com/GetStream/stream-video-js/commit/c22b83ef710f2188e680b73790154de046a824e9))
- `@stream-io/video-react-bindings` updated to version `1.1.20`

## [1.3.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.3.2...@stream-io/video-react-native-sdk-1.3.3) (2024-11-20)

### Bug Fixes

- use foreground service to keep call alive ([#1580](https://github.com/GetStream/stream-video-js/issues/1580)) ([22bc042](https://github.com/GetStream/stream-video-js/commit/22bc042a629508c8b2536d4b448308b1d8ec1d47))

## [1.3.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.3.1...@stream-io/video-react-native-sdk-1.3.2) (2024-11-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.2`
  - fully reset token manager on user disconnect ([#1578](https://github.com/GetStream/stream-video-js/issues/1578)) ([6751abc](https://github.com/GetStream/stream-video-js/commit/6751abc0507085bd7c9f3f803f4c5929e0598bea)), closes [#1573](https://github.com/GetStream/stream-video-js/issues/1573)
- `@stream-io/video-react-bindings` updated to version `1.1.19`

## [1.3.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.3.0...@stream-io/video-react-native-sdk-1.3.1) (2024-11-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.1`
- `@stream-io/video-react-bindings` updated to version `1.1.18`

### Bug Fixes

- reject was not called on timeout, decline and cancel scenarios ([#1576](https://github.com/GetStream/stream-video-js/issues/1576)) ([8be76a4](https://github.com/GetStream/stream-video-js/commit/8be76a447729aeba7f5c68f8a9bb85b4738cb76d))

## [1.3.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.2.15...@stream-io/video-react-native-sdk-1.3.0) (2024-11-13)

### Features

- make push notification listeners more flexible for easier debugging ([#1542](https://github.com/GetStream/stream-video-js/issues/1542)) ([75a90e6](https://github.com/GetStream/stream-video-js/commit/75a90e6239365309c83bfebfcff491b4d0046d8b)), closes [#1447](https://github.com/GetStream/stream-video-js/issues/1447)

## [1.2.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.2.14...@stream-io/video-react-native-sdk-1.2.15) (2024-11-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.0`
  - Connection timing ([#1574](https://github.com/GetStream/stream-video-js/issues/1574)) ([ce1dc9a](https://github.com/GetStream/stream-video-js/commit/ce1dc9a01fc5b0e60e3dac6653c27e99fd4b3ecb))
- `@stream-io/video-react-bindings` updated to version `1.1.17`

## [1.2.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.2.13...@stream-io/video-react-native-sdk-1.2.14) (2024-11-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.10.5`
  - ignore maxSimulcastLayers override for SVC codecs ([#1564](https://github.com/GetStream/stream-video-js/issues/1564)) ([48f8abe](https://github.com/GetStream/stream-video-js/commit/48f8abe5fd5b48c367a04696febd582573def828))
- `@stream-io/video-react-bindings` updated to version `1.1.16`

## [1.2.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.2.12...@stream-io/video-react-native-sdk-1.2.13) (2024-11-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.10.4`
  - max simulcast layers preference ([#1560](https://github.com/GetStream/stream-video-js/issues/1560)) ([2b0bf28](https://github.com/GetStream/stream-video-js/commit/2b0bf2824dce41c2709e361e0521cf85e1b2fd16))
- `@stream-io/video-react-bindings` updated to version `1.1.15`

## [1.2.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.2.11...@stream-io/video-react-native-sdk-1.2.12) (2024-11-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.10.3`
  - camera flip did not work in react-native ([#1554](https://github.com/GetStream/stream-video-js/issues/1554)) ([423890c](https://github.com/GetStream/stream-video-js/commit/423890cb2d1925366d8a63c29f93c4c92c8104ad)), closes [#1521](https://github.com/GetStream/stream-video-js/issues/1521)
- `@stream-io/video-react-bindings` updated to version `1.1.14`

## [1.2.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.2.10...@stream-io/video-react-native-sdk-1.2.11) (2024-11-04)

### Bug Fixes

- share screen for alone participant on spotlight layout ([#1553](https://github.com/GetStream/stream-video-js/issues/1553)) ([660056a](https://github.com/GetStream/stream-video-js/commit/660056af56d7f2b9d09b5a834a8eb4b9cba48fba))

## [1.2.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.2.9...@stream-io/video-react-native-sdk-1.2.10) (2024-11-01)

### Dependency Updates

- `@stream-io/video-react-bindings` updated to version `1.1.13`
  - imports for useToggleCallRecording ([#1548](https://github.com/GetStream/stream-video-js/issues/1548)) ([f6b2180](https://github.com/GetStream/stream-video-js/commit/f6b21809e95691298d5c8fec6754a886eb9a28fe))

## [1.2.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.2.8...@stream-io/video-react-native-sdk-1.2.9) (2024-11-01)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.10.2`
- `@stream-io/video-react-bindings` updated to version `1.1.12`

### Bug Fixes

- camera not enabled on foreground notifications ([#1546](https://github.com/GetStream/stream-video-js/issues/1546)) ([67c920a](https://github.com/GetStream/stream-video-js/commit/67c920ac4bca35a414b88f6c9829b08396a6260b))

## [1.2.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.2.7...@stream-io/video-react-native-sdk-1.2.8) (2024-11-01)

### Dependency Updates

- `@stream-io/video-react-bindings` updated to version `1.1.11`
  - move useToggleCallRecording to react-bindings ([#1545](https://github.com/GetStream/stream-video-js/issues/1545)) ([73014ca](https://github.com/GetStream/stream-video-js/commit/73014ca6a4585680f581c4e9481c2d286f2fcd37))

## [1.2.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.2.6...@stream-io/video-react-native-sdk-1.2.7) (2024-10-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.10.1`
  - various device selector issues ([#1541](https://github.com/GetStream/stream-video-js/issues/1541)) ([f23618b](https://github.com/GetStream/stream-video-js/commit/f23618bda447eeb2d66f908bdb38b24db051f87c))
- `@stream-io/video-react-bindings` updated to version `1.1.10`

## [1.2.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.2.5...@stream-io/video-react-native-sdk-1.2.6) (2024-10-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.10.0`
  - report input devices in call stats ([#1533](https://github.com/GetStream/stream-video-js/issues/1533)) ([f34fe0a](https://github.com/GetStream/stream-video-js/commit/f34fe0a0444903099565ae55a9639e39fc19b76c))
- `@stream-io/video-react-bindings` updated to version `1.1.9`

## [1.2.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.2.4...@stream-io/video-react-native-sdk-1.2.5) (2024-10-28)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.9.3`
  - make device selection by device id exact ([#1538](https://github.com/GetStream/stream-video-js/issues/1538)) ([6274cac](https://github.com/GetStream/stream-video-js/commit/6274cac2ecf155aa6ce0c6d764229e0e9cd39a6a))
- `@stream-io/video-react-bindings` updated to version `1.1.8`

## [1.2.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.2.3...@stream-io/video-react-native-sdk-1.2.4) (2024-10-22)

### Bug Fixes

- added workaround for possible multiple createDevice calls on remounting ([#1532](https://github.com/GetStream/stream-video-js/issues/1532)) ([eb3afb4](https://github.com/GetStream/stream-video-js/commit/eb3afb4dc33289cde0639cc109194971d31f51e0))

## [1.2.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.2.2...@stream-io/video-react-native-sdk-1.2.3) (2024-10-21)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.9.2`
  - **client:** invoke call.reject only when reject param specified ([#1530](https://github.com/GetStream/stream-video-js/issues/1530)) ([eac4e4e](https://github.com/GetStream/stream-video-js/commit/eac4e4ebd2575f5269f65db7173107d5cafab9bf))
- `@stream-io/video-react-bindings` updated to version `1.1.7`

## [1.2.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.2.1...@stream-io/video-react-native-sdk-1.2.2) (2024-10-18)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.9.1`
  - **svc:** announce downscaled layers in setPublisher ([#1526](https://github.com/GetStream/stream-video-js/issues/1526)) ([96cadd0](https://github.com/GetStream/stream-video-js/commit/96cadd05e995392eac4ec300828d07b287d691a0))
- `@stream-io/video-react-bindings` updated to version `1.1.6`

## [1.2.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.2.0...@stream-io/video-react-native-sdk-1.2.1) (2024-10-17)

### Bug Fixes

- allow specifying publish options in PN config ([#1524](https://github.com/GetStream/stream-video-js/issues/1524)) ([a2ae74e](https://github.com/GetStream/stream-video-js/commit/a2ae74e8097bf1e58d040e4a7696ecadfc435843)), closes [#1434](https://github.com/GetStream/stream-video-js/issues/1434)

## [1.2.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.1.6...@stream-io/video-react-native-sdk-1.2.0) (2024-10-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.9.0`
- `@stream-io/video-react-bindings` updated to version `1.1.5`

### Features

- **svc-codec:** VP9 and AV1 support ([#1434](https://github.com/GetStream/stream-video-js/issues/1434)) ([c9c8530](https://github.com/GetStream/stream-video-js/commit/c9c8530d48c9206dc3803e6aa6cc1859fd433920))

## [1.1.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.1.5...@stream-io/video-react-native-sdk-1.1.6) (2024-10-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.8.4`
  - ignore camera direction for desktop devices ([#1521](https://github.com/GetStream/stream-video-js/issues/1521)) ([562b5cc](https://github.com/GetStream/stream-video-js/commit/562b5cca77264330d08dff5305eccc489970076a))
- `@stream-io/video-react-bindings` updated to version `1.1.4`

## [1.1.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.1.4...@stream-io/video-react-native-sdk-1.1.5) (2024-10-16)

### Bug Fixes

- **react-native:** set objectFit based on actual video track dimensions ([#1520](https://github.com/GetStream/stream-video-js/issues/1520)) ([44ef7d2](https://github.com/GetStream/stream-video-js/commit/44ef7d2e69a910be45b2d3a7643c3f58e0f29803))

## [1.1.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.1.3...@stream-io/video-react-native-sdk-1.1.4) (2024-10-10)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.8.3`
  - do not release track if track was not removed from stream ([#1517](https://github.com/GetStream/stream-video-js/issues/1517)) ([5bfc528](https://github.com/GetStream/stream-video-js/commit/5bfc52850c36ffe0de37e47066538a8a14dc9e01))
- `@stream-io/video-react-bindings` updated to version `1.1.3`

## [1.1.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.1.2...@stream-io/video-react-native-sdk-1.1.3) (2024-10-10)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.8.2`
  - add track release for react-native whenever track stop is called ([#1516](https://github.com/GetStream/stream-video-js/issues/1516)) ([5074510](https://github.com/GetStream/stream-video-js/commit/50745101d28d0339592c22ca02b076040ad3bdeb))
- `@stream-io/video-react-bindings` updated to version `1.1.2`

## [1.1.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.1.1...@stream-io/video-react-native-sdk-1.1.2) (2024-10-10)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.8.1`
  - mic not fully released in some cases ([#1515](https://github.com/GetStream/stream-video-js/issues/1515)) ([b7bf90b](https://github.com/GetStream/stream-video-js/commit/b7bf90b9b1a83fb80d01a82ebee8754343963ae5))
- `@stream-io/video-react-bindings` updated to version `1.1.1`

## [1.1.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.1.0...@stream-io/video-react-native-sdk-1.1.1) (2024-10-04)

### Bug Fixes

- clarify about USE_FULL_SCREEN_INTENT android permission ([#1510](https://github.com/GetStream/stream-video-js/issues/1510)) ([ec61b32](https://github.com/GetStream/stream-video-js/commit/ec61b32449c89885b87fe972a38d25503bab0c0f))

## [1.1.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.0.14...@stream-io/video-react-native-sdk-1.1.0) (2024-10-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.8.0`
- `@stream-io/video-react-bindings` updated to version `1.1.0`

### Features

- manual video quality selection ([#1486](https://github.com/GetStream/stream-video-js/issues/1486)) ([3a754af](https://github.com/GetStream/stream-video-js/commit/3a754afa1bd13d038b1023520ec8a5296ad2669e))

## [1.0.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.0.13...@stream-io/video-react-native-sdk-1.0.14) (2024-10-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.7.4`
  - retryable location hint ([#1505](https://github.com/GetStream/stream-video-js/issues/1505)) ([087417f](https://github.com/GetStream/stream-video-js/commit/087417f926b3d43a5bcb814ac9bb5951c1e63479))
- `@stream-io/video-react-bindings` updated to version `1.0.10`

## [1.0.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.0.12...@stream-io/video-react-native-sdk-1.0.13) (2024-09-24)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.7.3`
  - do not always error out api calls when web socket initially failed ([#1495](https://github.com/GetStream/stream-video-js/issues/1495)) ([7cdb62e](https://github.com/GetStream/stream-video-js/commit/7cdb62e75cad56098ee81eabbcc63382f93fd218))
- `@stream-io/video-react-bindings` updated to version `1.0.9`

## [1.0.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.0.11...@stream-io/video-react-native-sdk-1.0.12) (2024-09-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.7.2`
  - overridable bitrate and bitrate downscale factor ([#1493](https://github.com/GetStream/stream-video-js/issues/1493)) ([cce5d8e](https://github.com/GetStream/stream-video-js/commit/cce5d8e641a9182a1779952e4e62aa16ec21ab92))
- `@stream-io/video-react-bindings` updated to version `1.0.8`

## [1.0.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.0.10...@stream-io/video-react-native-sdk-1.0.11) (2024-09-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.7.1`
  - don't attempt to recover broken WebSockets when there isn't a network connection ([#1490](https://github.com/GetStream/stream-video-js/issues/1490)) ([d576f48](https://github.com/GetStream/stream-video-js/commit/d576f48c7f819d48008359a3c30fe5d1a3372145))
- `@stream-io/video-react-bindings` updated to version `1.0.7`

- `preMajor: false` for stable packages ([#1491](https://github.com/GetStream/stream-video-js/issues/1491)) ([6ed27b9](https://github.com/GetStream/stream-video-js/commit/6ed27b9d1dfebeb9a241f6aa0b55912cce87eef5))

## [1.0.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.0.9...@stream-io/video-react-native-sdk-1.0.10) (2024-09-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.7.0`
  - React SDK cold-start optimizations ([#1488](https://github.com/GetStream/stream-video-js/issues/1488)) ([972e579](https://github.com/GetStream/stream-video-js/commit/972e5792b5a131a212b1031ade76dcb383897a46))
- `@stream-io/video-react-bindings` updated to version `1.0.6`

## [1.0.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.0.8...@stream-io/video-react-native-sdk-1.0.9) (2024-09-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.6.5`
  - race condition in `applySettingsToStream` ([#1489](https://github.com/GetStream/stream-video-js/issues/1489)) ([bf2ad90](https://github.com/GetStream/stream-video-js/commit/bf2ad90224d88592d4ea27ea8d0683efe98771f7))
- `@stream-io/video-react-bindings` updated to version `1.0.5`

## [1.0.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.0.7...@stream-io/video-react-native-sdk-1.0.8) (2024-09-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.6.4`
  - allow video target bitrate override ([#1487](https://github.com/GetStream/stream-video-js/issues/1487)) ([bfe34a3](https://github.com/GetStream/stream-video-js/commit/bfe34a3609182da5bbb03331978d86569cada098))
- `@stream-io/video-react-bindings` updated to version `1.0.4`

## [1.0.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.0.6...@stream-io/video-react-native-sdk-1.0.7) (2024-09-11)

### Bug Fixes

- replace dataSync with shortService for android foreground service type ([#1485](https://github.com/GetStream/stream-video-js/issues/1485)) ([2681535](https://github.com/GetStream/stream-video-js/commit/26815357f66b43f94e1d939fb30a6cdb85c77a5f))

## [1.0.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.0.5...@stream-io/video-react-native-sdk-1.0.6) (2024-09-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.6.3`
  - client instance removal used a wrong key ([#1484](https://github.com/GetStream/stream-video-js/issues/1484)) ([edff5d7](https://github.com/GetStream/stream-video-js/commit/edff5d7ca0cc241a3929da3b752073883f29da32))
- `@stream-io/video-react-bindings` updated to version `1.0.3`

## [1.0.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.0.4...@stream-io/video-react-native-sdk-1.0.5) (2024-09-10)

### Dependency Updates

- `@stream-io/video-filters-react-native` updated to version `0.2.4`

### Bug Fixes

- broken ios autolinking on react native 0.68 ([#1483](https://github.com/GetStream/stream-video-js/issues/1483)) ([734a361](https://github.com/GetStream/stream-video-js/commit/734a3615bc185fc17c7d7afc812c662a9bec92e7))

## [1.0.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.0.3...@stream-io/video-react-native-sdk-1.0.4) (2024-09-09)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.6.2`
  - prioritize h264 baseline profile ([#1482](https://github.com/GetStream/stream-video-js/issues/1482)) ([3ea3c5e](https://github.com/GetStream/stream-video-js/commit/3ea3c5ecf57b50d3f909d59a96811f636b07d8aa))
- `@stream-io/video-react-bindings` updated to version `1.0.2`

## [1.0.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.0.2...@stream-io/video-react-native-sdk-1.0.3) (2024-09-06)

### Dependency Updates

- `@stream-io/video-filters-react-native` updated to version `0.2.3`

### Bug Fixes

- set min ios version to 13.0 for the podspecs ([b6d8c16](https://github.com/GetStream/stream-video-js/commit/b6d8c163b66f75e12d0316abe46eebc6b017c29a))

## [1.0.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.0.1...@stream-io/video-react-native-sdk-1.0.2) (2024-09-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.6.1`
  - **Features**
    - Reconnects v2 ([#1439](https://github.com/GetStream/stream-video-js/issues/1439)) ([e90aa52](https://github.com/GetStream/stream-video-js/commit/e90aa52780f9e0ca5852a294a152282000f66675))
  - **Bug Fixes**
    - update state.endedAt after the SFU terminates the call ([#1477](https://github.com/GetStream/stream-video-js/issues/1477)) ([135b11f](https://github.com/GetStream/stream-video-js/commit/135b11f2e29f486f2f43b9ac2a84848d0fd0b5b4))
    - handle session_participant_count_updated
    - do not use ended_at from call state to check ringing
  - **Other**
    - update node-sdk, add this to pronto for token generation ([#1472](https://github.com/GetStream/stream-video-js/issues/1472)) ([c6cbc1f](https://github.com/GetStream/stream-video-js/commit/c6cbc1f8d003ea1c39796ccbc87d7553604f819b))
- `@stream-io/video-react-bindings` updated to version `1.0.1`
  - **Features**
    - **react:** Support for Background Filters and Background
  - **Bug Fixes**
    - improve error handling across the
    - optimistically toggle device
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
  - **Other**
    - release bindings as a major version ([4fe1d2a](https://github.com/GetStream/stream-video-js/commit/4fe1d2a30d0c5019f26173ccd6c7fe49a9b53d73))

## [1.0.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-1.0.0...@stream-io/video-react-native-sdk-1.0.1) (2024-09-05)

### Dependency Updates

- `@stream-io/video-filters-react-native` updated to version `0.2.2`

- reset releaseAs tags [skip ci] ([6161687](https://github.com/GetStream/stream-video-js/commit/61616870178d6bbc29b22ca3b1a354e5e172c9c3))

### Bug Fixes

- **ios:** if min ios version is not present default to 12 ([9279d59](https://github.com/GetStream/stream-video-js/commit/9279d59e861a51c723a0f17229c39dae946ee664))

## [1.0.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.10.6...@stream-io/video-react-native-sdk-1.0.0) (2024-09-03)

- **@stream-io/video-react-native-sdk:** release version 1.0.0 ([c990e7a](https://github.com/GetStream/stream-video-js/commit/c990e7a3132c5ee2ddcc707d8a4759c5a08fd3ef))

### Features

- Reconnects v2 ([#1439](https://github.com/GetStream/stream-video-js/issues/1439)) ([e90aa52](https://github.com/GetStream/stream-video-js/commit/e90aa52780f9e0ca5852a294a152282000f66675))

## [1.0.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.10.6...@stream-io/video-react-native-sdk-1.0.0) (2024-09-03)

### Features

- Reconnects v2 ([#1439](https://github.com/GetStream/stream-video-js/issues/1439)) ([e90aa52](https://github.com/GetStream/stream-video-js/commit/e90aa52780f9e0ca5852a294a152282000f66675))

### [0.10.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.10.5...@stream-io/video-react-native-sdk-0.10.6) (2024-09-03)

### Bug Fixes

- ios build after pip addition was only as a static framework ([#1473](https://github.com/GetStream/stream-video-js/issues/1473)) ([582fbc9](https://github.com/GetStream/stream-video-js/commit/582fbc921070368fde446ae666ef366eb3d46177)), closes [#1470](https://github.com/GetStream/stream-video-js/issues/1470)

### [0.10.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.10.4...@stream-io/video-react-native-sdk-0.10.5) (2024-08-28)

### Features

- PiP mode support on iOS ([#1469](https://github.com/GetStream/stream-video-js/issues/1469)) ([3a76378](https://github.com/GetStream/stream-video-js/commit/3a76378a3e663aa8bc23d801c6ac695d65ee77c6))

### [0.10.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.10.3...@stream-io/video-react-native-sdk-0.10.4) (2024-08-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.5.2`
  - **Features**
    - **client:** add a instance
  - **Bug Fixes**
    - `call.recording_failed` should update the call
    - ringing state issues when call was already
    - allow joining left call
    - allow reusing call instances after
    - report the Plain-JS sdk version to the
    - refactor background
    - improve browser permission
    - support for portrait mode
    - perform full reconnect if ice restart
- `@stream-io/video-react-bindings` updated to version `0.4.55`

### [0.10.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.10.2...@stream-io/video-react-native-sdk-0.10.3) (2024-08-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.5.1`
  - **Features**
    - **client:** add a instance
  - **Bug Fixes**
    - `call.recording_failed` should update the call
    - ringing state issues when call was already
    - allow joining left call
    - allow reusing call instances after
    - report the Plain-JS sdk version to the
    - refactor background
    - improve browser permission
    - support for portrait mode
    - perform full reconnect if ice restart
- `@stream-io/video-react-bindings` updated to version `0.4.54`

### [0.10.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.10.1...@stream-io/video-react-native-sdk-0.10.2) (2024-08-21)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.5.0`
  - **Features**
    - **client:** add a instance
  - **Bug Fixes**
    - `call.recording_failed` should update the call
    - ringing state issues when call was already
    - allow joining left call
    - allow reusing call instances after
    - report the Plain-JS sdk version to the
    - refactor background
    - improve browser permission
    - support for portrait mode
    - perform full reconnect if ice restart
- `@stream-io/video-react-bindings` updated to version `0.4.53`

### Features

- **client:** add a instance getter ([#1461](https://github.com/GetStream/stream-video-js/issues/1461)) ([7f4d836](https://github.com/GetStream/stream-video-js/commit/7f4d836511d9afdcd61bf5c6317611d3725953a6))

### [0.10.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.10.0...@stream-io/video-react-native-sdk-0.10.1) (2024-08-14)

### Bug Fixes

- push notifications not dismissed automatically on android 8 and above ([18718e6](https://github.com/GetStream/stream-video-js/commit/18718e637265e02510a3d01a35be37e9a18d5117))

## [0.10.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.9.7...@stream-io/video-react-native-sdk-0.10.0) (2024-08-08)

### ⚠ BREAKING CHANGES

- **react-native:** make notifee to be optional (#1456)

### Bug Fixes

- **react-native:** make notifee to be optional ([#1456](https://github.com/GetStream/stream-video-js/issues/1456)) ([0b3f787](https://github.com/GetStream/stream-video-js/commit/0b3f7876c82a8873901bc1bc77a17f6f98825166))

### [0.9.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.9.6...@stream-io/video-react-native-sdk-0.9.7) (2024-08-06)

### Bug Fixes

- added workaround for android where video doesn't resume when resuming app from lock screen ([#1454](https://github.com/GetStream/stream-video-js/issues/1454)) ([b112506](https://github.com/GetStream/stream-video-js/commit/b1125069b24c3bbbf0191582ba27ff841a0cd9f8))

### [0.9.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.9.5...@stream-io/video-react-native-sdk-0.9.6) (2024-07-31)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.4.8`
- `@stream-io/video-react-bindings` updated to version `0.4.52`

### [0.9.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.9.4...@stream-io/video-react-native-sdk-0.9.5) (2024-07-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.4.7`
- `@stream-io/video-react-bindings` updated to version `0.4.51`

### Bug Fixes

- ringing state issues when call was already ended ([#1451](https://github.com/GetStream/stream-video-js/issues/1451)) ([4a3556e](https://github.com/GetStream/stream-video-js/commit/4a3556e0f7b0bd58d0022cc635aa4391014063d7))

### [0.9.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.9.3...@stream-io/video-react-native-sdk-0.9.4) (2024-07-25)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.4.6`
- `@stream-io/video-react-bindings` updated to version `0.4.50`

### Bug Fixes

- allow reusing call instances after leaving ([#1433](https://github.com/GetStream/stream-video-js/issues/1433)) ([61e05af](https://github.com/GetStream/stream-video-js/commit/61e05af25c441b7db9db16166a6b4eca20ec7748))

### [0.9.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.9.2...@stream-io/video-react-native-sdk-0.9.3) (2024-07-24)

### Bug Fixes

- incoming call notifications not removed on call.leave on android 8 and above ([4000f8a](https://github.com/GetStream/stream-video-js/commit/4000f8a06299fc056b135992eba5d745c9202289))

### [0.9.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.9.1...@stream-io/video-react-native-sdk-0.9.2) (2024-07-12)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.4.5`
- `@stream-io/video-react-bindings` updated to version `0.4.49`

### [0.9.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.9.0...@stream-io/video-react-native-sdk-0.9.1) (2024-07-05)

### Bug Fixes

- **react-native:** ringing call content component did not handle reconnection state ([#1435](https://github.com/GetStream/stream-video-js/issues/1435)) ([a4a50b7](https://github.com/GetStream/stream-video-js/commit/a4a50b74e525324618681b273df998c4478068c6))

## [0.9.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.8.9...@stream-io/video-react-native-sdk-0.9.0) (2024-07-05)

### ⚠ BREAKING CHANGES

- **react-native:** support targetSdk android 14 (#1432)

### Features

- **react-native:** support targetSdk android 14 ([#1432](https://github.com/GetStream/stream-video-js/issues/1432)) ([2e98fbe](https://github.com/GetStream/stream-video-js/commit/2e98fbe5000161088030d553fc38cd5243327dd1))

### [0.8.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.8.8...@stream-io/video-react-native-sdk-0.8.9) (2024-07-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.4.4`
  - **Features**
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - add concurrency
- `@stream-io/video-react-bindings` updated to version `0.4.48`

### [0.8.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.8.7...@stream-io/video-react-native-sdk-0.8.8) (2024-06-28)

### Features

- **react-native:** enable android 14 compatibility for screensharing foreground service ([#1425](https://github.com/GetStream/stream-video-js/issues/1425)) ([f41aa10](https://github.com/GetStream/stream-video-js/commit/f41aa100b4a5f3ea72a3628407a5d101e9aea342))

### [0.8.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.8.6...@stream-io/video-react-native-sdk-0.8.7) (2024-06-25)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.4.3`
  - **Features**
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - add concurrency
- `@stream-io/video-react-bindings` updated to version `0.4.47`

### [0.8.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.8.5...@stream-io/video-react-native-sdk-0.8.6) (2024-06-24)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.4.2`
  - **Features**
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - add concurrency
- `@stream-io/video-react-bindings` updated to version `0.4.46`

### [0.8.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.8.4...@stream-io/video-react-native-sdk-0.8.5) (2024-06-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.4.1`
  - **Features**
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - add concurrency
- `@stream-io/video-react-bindings` updated to version `0.4.45`

### [0.8.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.8.3...@stream-io/video-react-native-sdk-0.8.4) (2024-06-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.4.0`
  - **Features**
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - add concurrency
- `@stream-io/video-react-bindings` updated to version `0.4.44`

### [0.8.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.8.2...@stream-io/video-react-native-sdk-0.8.3) (2024-06-17)

### Bug Fixes

- **rn:** screenshare overlay should not be seen for remote streams ([c9e9721](https://github.com/GetStream/stream-video-js/commit/c9e9721789de23985d6914011f5ddffd42fac5ab))

### [0.8.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.8.1...@stream-io/video-react-native-sdk-0.8.2) (2024-06-13)

### Bug Fixes

- **android:** no ringtone when incoming call was through foreground service ([#1402](https://github.com/GetStream/stream-video-js/issues/1402)) ([7796d81](https://github.com/GetStream/stream-video-js/commit/7796d817d03902c418fa7c672af05f4fc7df7c5d))

### [0.8.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.8.0...@stream-io/video-react-native-sdk-0.8.1) (2024-06-12)

### Dependency Updates

- `@stream-io/video-filters-react-native` updated to version `0.2.1`

### Features

- docs to make video filters usable without the RN SDK ([6061f4d](https://github.com/GetStream/stream-video-js/commit/6061f4d5b83d1ed46051dde12c7d3e269ec26aeb))

## [0.8.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.29...@stream-io/video-react-native-sdk-0.8.0) (2024-06-12)

### Dependency Updates

- `@stream-io/video-filters-react-native` updated to version `0.2.0`

### ⚠ BREAKING CHANGES

- **react-native:** add ios video filters (#1400)

### Features

- **react-native:** add ios video filters ([#1400](https://github.com/GetStream/stream-video-js/issues/1400)) ([dbad806](https://github.com/GetStream/stream-video-js/commit/dbad806e136de7d60a10d292431c8cfe74bd28f9))

### [0.7.29](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.28...@stream-io/video-react-native-sdk-0.7.29) (2024-06-12)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.3.1`
  - **Features**
    - improve `isSupported` method for noise
    - **client:** support reject
    - video filters on
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - **state:** aligns the participant state with other
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - optimistically toggle device
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.43`

### [0.7.28](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.27...@stream-io/video-react-native-sdk-0.7.28) (2024-06-10)

### Bug Fixes

- **ios:** do not disable camera on inactive state ([#1396](https://github.com/GetStream/stream-video-js/issues/1396)) ([741f0bc](https://github.com/GetStream/stream-video-js/commit/741f0bc2dc54db0f95211eea3b558b16a45d40f3))

### [0.7.27](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.26...@stream-io/video-react-native-sdk-0.7.27) (2024-06-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.3.0`
  - **Features**
    - improve `isSupported` method for noise
    - **client:** support reject
    - video filters on
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - **state:** aligns the participant state with other
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - optimistically toggle device
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.42`

### [0.7.26](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.25...@stream-io/video-react-native-sdk-0.7.26) (2024-06-06)

### Dependency Updates

- `@stream-io/video-filters-react-native` updated to version `0.1.1`

### [0.7.25](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.24...@stream-io/video-react-native-sdk-0.7.25) (2024-06-06)

### Dependency Updates

- `@stream-io/video-filters-react-native` updated to version `0.1.0`

### [0.7.24](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.23...@stream-io/video-react-native-sdk-0.7.24) (2024-06-06)

### Features

- use logger from client for react native sdk ([#1391](https://github.com/GetStream/stream-video-js/issues/1391)) ([8779da9](https://github.com/GetStream/stream-video-js/commit/8779da965c169ac651b63d600beef3112db889fa))

### [0.7.23](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.22...@stream-io/video-react-native-sdk-0.7.23) (2024-06-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.2.3`
  - **Features**
    - improve `isSupported` method for noise
    - **client:** support reject
    - video filters on
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - **state:** aligns the participant state with other
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - optimistically toggle device
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.41`

### [0.7.22](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.21...@stream-io/video-react-native-sdk-0.7.22) (2024-06-05)

### Bug Fixes

- use same channel id for all foreground services ([#1389](https://github.com/GetStream/stream-video-js/issues/1389)) ([d321b90](https://github.com/GetStream/stream-video-js/commit/d321b90330c73c694ea90e1f494f6e5f38d6c720))

### [0.7.21](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.20...@stream-io/video-react-native-sdk-0.7.21) (2024-06-05)

### Bug Fixes

- change unnecessary warning log to info ([e8dda7d](https://github.com/GetStream/stream-video-js/commit/e8dda7ded3bedc63e20e8230ecfab702da154f98))

### [0.7.20](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.19...@stream-io/video-react-native-sdk-0.7.20) (2024-06-04)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.2.2`
  - **Features**
    - improve `isSupported` method for noise
    - **client:** support reject
    - video filters on
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - **state:** aligns the participant state with other
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - optimistically toggle device
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.40`

### [0.7.19](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.18...@stream-io/video-react-native-sdk-0.7.19) (2024-06-04)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.2.1`
  - **Features**
    - improve `isSupported` method for noise
    - **client:** support reject
    - video filters on
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - **state:** aligns the participant state with other
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - optimistically toggle device
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.39`

### [0.7.18](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.17...@stream-io/video-react-native-sdk-0.7.18) (2024-06-03)

### Bug Fixes

- **react-native:** getting if pip was enabled from native was randomly broken ([#1385](https://github.com/GetStream/stream-video-js/issues/1385)) ([a055011](https://github.com/GetStream/stream-video-js/commit/a055011117fc4cee4ff00c855315aa72ffd7d881))

### [0.7.17](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.16...@stream-io/video-react-native-sdk-0.7.17) (2024-06-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.2.0`
  - **Features**
    - improve `isSupported` method for noise
    - **client:** support reject
    - video filters on
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - **state:** aligns the participant state with other
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - optimistically toggle device
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.38`

### [0.7.16](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.15...@stream-io/video-react-native-sdk-0.7.16) (2024-06-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.1.0`
  - **Features**
    - improve `isSupported` method for noise
    - **client:** support reject
    - video filters on
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - **state:** aligns the participant state with other
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - optimistically toggle device
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.37`
- `@stream-io/video-filters-react-native` updated to version `0.0.1`

### Features

- video filters on android ([#1382](https://github.com/GetStream/stream-video-js/issues/1382)) ([7ba8b0e](https://github.com/GetStream/stream-video-js/commit/7ba8b0e3b444869d38aae1a045dffb05444643f5))

### [0.7.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.14...@stream-io/video-react-native-sdk-0.7.15) (2024-05-31)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.10`
  - **Features**
    - improve `isSupported` method for noise
    - **client:** support reject
    - video filters on
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - **state:** aligns the participant state with other
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - optimistically toggle device
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.36`

### [0.7.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.13...@stream-io/video-react-native-sdk-0.7.14) (2024-05-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.9`
  - **Features**
    - improve `isSupported` method for noise
    - **client:** support reject
    - video filters on
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - **state:** aligns the participant state with other
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - optimistically toggle device
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.35`

### [0.7.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.12...@stream-io/video-react-native-sdk-0.7.13) (2024-05-27)

### Bug Fixes

- export the LivestreamPlayer component ([#1376](https://github.com/GetStream/stream-video-js/issues/1376)) ([89688a0](https://github.com/GetStream/stream-video-js/commit/89688a03a88ecebb04455b76237350ca0c91afe9)), closes [#1373](https://github.com/GetStream/stream-video-js/issues/1373)

### [0.7.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.11...@stream-io/video-react-native-sdk-0.7.12) (2024-05-27)

### Bug Fixes

- **reac-native:** properly cleanup call instance in LivestreamPlayer ([4e60c50](https://github.com/GetStream/stream-video-js/commit/4e60c5067503a7e3e1fdc77a4f6775c5873ed508))

### [0.7.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.10...@stream-io/video-react-native-sdk-0.7.11) (2024-05-27)

### Features

- **react-native:** add livestream player component ([#1373](https://github.com/GetStream/stream-video-js/issues/1373)) ([a821e23](https://github.com/GetStream/stream-video-js/commit/a821e2359ad6c3ff1535f971c1d644a0b35fff78))

### [0.7.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.9...@stream-io/video-react-native-sdk-0.7.10) (2024-05-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.8`
  - **Features**
    - improve `isSupported` method for noise
    - **client:** support reject
    - video filters on
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - **state:** aligns the participant state with other
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - optimistically toggle device
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.34`

### [0.7.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.8...@stream-io/video-react-native-sdk-0.7.9) (2024-05-22)

### Bug Fixes

- workaround for samsung device ringtone quirks ([#1362](https://github.com/GetStream/stream-video-js/issues/1362)) ([d15380a](https://github.com/GetStream/stream-video-js/commit/d15380a4aac2bd9b7b6dc6b9de337739710c97b8))

### [0.7.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.7...@stream-io/video-react-native-sdk-0.7.8) (2024-05-21)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.7`
  - **Features**
    - improve `isSupported` method for noise
    - **client:** support reject
    - video filters on
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - **state:** aligns the participant state with other
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - optimistically toggle device
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.33`

### [0.7.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.6...@stream-io/video-react-native-sdk-0.7.7) (2024-05-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.6`
  - **Features**
    - improve `isSupported` method for noise
    - **client:** support reject
    - video filters on
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - **state:** aligns the participant state with other
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - optimistically toggle device
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.32`

### Bug Fixes

- **state:** aligns the participant state with other SDKs ([#1357](https://github.com/GetStream/stream-video-js/issues/1357)) ([146e6ac](https://github.com/GetStream/stream-video-js/commit/146e6acd7296488bc18f4bf5c76e9f2c9bfd97af))

### [0.7.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.5...@stream-io/video-react-native-sdk-0.7.6) (2024-05-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.5`
  - **Features**
    - improve `isSupported` method for noise
    - **client:** support reject
    - video filters on
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - **state:** aligns the participant state with other
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - optimistically toggle device
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.31`

### [0.7.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.4...@stream-io/video-react-native-sdk-0.7.5) (2024-05-16)

### Features

- add full screen incoming call view when phone is locked for android ([#1351](https://github.com/GetStream/stream-video-js/issues/1351)) ([54c9e0f](https://github.com/GetStream/stream-video-js/commit/54c9e0fb178a7ad37bb2db0c01f5bd507ef46ddf))

### [0.7.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.3...@stream-io/video-react-native-sdk-0.7.4) (2024-05-14)

### Bug Fixes

- **react-native:** mute and unmute device media stream optimistically ([#1354](https://github.com/GetStream/stream-video-js/issues/1354)) ([72f5df4](https://github.com/GetStream/stream-video-js/commit/72f5df4abc63b8824b4c0a9f00b7ee5848ab83da))

### [0.7.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.2...@stream-io/video-react-native-sdk-0.7.3) (2024-05-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.4`
  - **Features**
    - improve `isSupported` method for noise
    - **client:** support reject
    - video filters on
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - **state:** aligns the participant state with other
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - optimistically toggle device
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.30`

### [0.7.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.1...@stream-io/video-react-native-sdk-0.7.2) (2024-05-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.3`
  - **Features**
    - improve `isSupported` method for noise
    - **client:** support reject
    - video filters on
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - **state:** aligns the participant state with other
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - optimistically toggle device
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.29`

### [0.7.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.7.0...@stream-io/video-react-native-sdk-0.7.1) (2024-05-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.2`
  - **Features**
    - improve `isSupported` method for noise
    - **client:** support reject
    - video filters on
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - **state:** aligns the participant state with other
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - optimistically toggle device
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.28`

### Bug Fixes

- optimistically toggle device status ([#1342](https://github.com/GetStream/stream-video-js/issues/1342)) ([2e4e470](https://github.com/GetStream/stream-video-js/commit/2e4e470347fce7c7499dd21a931e5dec74bf9618))

## [0.7.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.21...@stream-io/video-react-native-sdk-0.7.0) (2024-05-13)

### ⚠ BREAKING CHANGES

- **react-native:** apply media stream management initial state asyncronously (#1345)

### Bug Fixes

- **react-native:** apply media stream management initial state asyncronously ([#1345](https://github.com/GetStream/stream-video-js/issues/1345)) ([40b5a4e](https://github.com/GetStream/stream-video-js/commit/40b5a4e955f1bcf39755aa3848bc11c3436c14c9)), closes [#1236](https://github.com/GetStream/stream-video-js/issues/1236)

### [0.6.21](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.20...@stream-io/video-react-native-sdk-0.6.21) (2024-05-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.1`
  - **Features**
    - **v1:** release
    - support target_resolution backend setting for
    - Noise
    - **feedback:** Collect user
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **devices:** API to disable speaking while muted
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.27`

### [0.6.20](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.19...@stream-io/video-react-native-sdk-0.6.20) (2024-05-07)

### Bug Fixes

- do not check for expo notifications lib dependency unnecessarily ([#1339](https://github.com/GetStream/stream-video-js/issues/1339)) ([0c5566f](https://github.com/GetStream/stream-video-js/commit/0c5566f311cb8377b4c1031387ba6be95165f234))

### [0.6.19](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.18...@stream-io/video-react-native-sdk-0.6.19) (2024-05-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.0`
  - **Features**
    - **v1:** release
    - support target_resolution backend setting for
    - Noise
    - **feedback:** Collect user
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **devices:** API to disable speaking while muted
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.26`

### [0.6.18](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.17...@stream-io/video-react-native-sdk-0.6.18) (2024-05-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.8.0`
  - **Features**
    - **v1:** release
    - support target_resolution backend setting for
    - Noise
    - **feedback:** Collect user
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **devices:** API to disable speaking while muted
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.25`

### [0.6.17](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.16...@stream-io/video-react-native-sdk-0.6.17) (2024-05-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.13`
  - **Features**
    - **v1:** release
    - support target_resolution backend setting for
    - Noise
    - **feedback:** Collect user
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **devices:** API to disable speaking while muted
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.24`

### [0.6.16](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.15...@stream-io/video-react-native-sdk-0.6.16) (2024-05-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.12`
  - **Features**
    - **v1:** release
    - support target_resolution backend setting for
    - Noise
    - **feedback:** Collect user
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **devices:** API to disable speaking while muted
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.23`

### [0.6.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.14...@stream-io/video-react-native-sdk-0.6.15) (2024-05-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.11`
  - **Features**
    - **v1:** release
    - support target_resolution backend setting for
    - Noise
    - **feedback:** Collect user
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **devices:** API to disable speaking while muted
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.22`

### Bug Fixes

- **devices:** API to disable speaking while muted notifications ([#1335](https://github.com/GetStream/stream-video-js/issues/1335)) ([cdff0e0](https://github.com/GetStream/stream-video-js/commit/cdff0e036bf4afca763e4f7a1563c23e806be190)), closes [#1329](https://github.com/GetStream/stream-video-js/issues/1329)

### [0.6.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.13...@stream-io/video-react-native-sdk-0.6.14) (2024-04-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.10`
  - **Features**
    - **v1:** release
    - support target_resolution backend setting for
    - Noise
    - **feedback:** Collect user
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **devices:** API to disable speaking while muted
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.21`

### [0.6.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.12...@stream-io/video-react-native-sdk-0.6.13) (2024-04-26)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.9`
  - **Features**
    - **v1:** release
    - support target_resolution backend setting for
    - Noise
    - **feedback:** Collect user
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **devices:** API to disable speaking while muted
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.20`

### [0.6.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.11...@stream-io/video-react-native-sdk-0.6.12) (2024-04-25)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.8`
  - **Features**
    - **v1:** release
    - support target_resolution backend setting for
    - Noise
    - **feedback:** Collect user
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **devices:** API to disable speaking while muted
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.19`

### [0.6.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.10...@stream-io/video-react-native-sdk-0.6.11) (2024-04-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.7`
  - **Features**
    - **v1:** release
    - support target_resolution backend setting for
    - Noise
    - **feedback:** Collect user
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **devices:** API to disable speaking while muted
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.18`

### Features

- **feedback:** Collect user feedback ([#1324](https://github.com/GetStream/stream-video-js/issues/1324)) ([b415de0](https://github.com/GetStream/stream-video-js/commit/b415de0828e402f8d3b854553351843aad2e8473))

### [0.6.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.9...@stream-io/video-react-native-sdk-0.6.10) (2024-04-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.6`
  - **Features**
    - **v1:** release
    - support target_resolution backend setting for
    - Noise
    - **feedback:** Collect user
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **devices:** API to disable speaking while muted
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.17`

### [0.6.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.8...@stream-io/video-react-native-sdk-0.6.9) (2024-04-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.5`
  - **Features**
    - **v1:** release
    - support target_resolution backend setting for
    - Noise
    - **feedback:** Collect user
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **devices:** API to disable speaking while muted
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.16`

### [0.6.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.7...@stream-io/video-react-native-sdk-0.6.8) (2024-04-19)

### Bug Fixes

- move expo ringing setup to react-native firebase ([#1319](https://github.com/GetStream/stream-video-js/issues/1319)) ([bb57300](https://github.com/GetStream/stream-video-js/commit/bb57300028d67917269f8eee9ca33e129b2c7e9d))

### [0.6.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.6...@stream-io/video-react-native-sdk-0.6.7) (2024-04-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.4`
  - **Features**
    - **v1:** release
    - support target_resolution backend setting for
    - Noise
    - **feedback:** Collect user
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **devices:** API to disable speaking while muted
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.15`

### [0.6.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.5...@stream-io/video-react-native-sdk-0.6.6) (2024-04-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.3`
  - **Features**
    - **v1:** release
    - support target_resolution backend setting for
    - Noise
    - **feedback:** Collect user
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **devices:** API to disable speaking while muted
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.14`

### [0.6.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.4...@stream-io/video-react-native-sdk-0.6.5) (2024-04-16)

### Bug Fixes

- **react-native:** remove wrong required types in livestream buttons ([a357d6a](https://github.com/GetStream/stream-video-js/commit/a357d6ac24e3d15b068d152cc69403c471dff87c))

### [0.6.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.3...@stream-io/video-react-native-sdk-0.6.4) (2024-04-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.2`
  - **Features**
    - **v1:** release
    - support target_resolution backend setting for
    - Noise
    - **feedback:** Collect user
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **devices:** API to disable speaking while muted
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.13`

### [0.6.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.2...@stream-io/video-react-native-sdk-0.6.3) (2024-04-16)

### Features

- **react-native:** add screen share and chat to livestream sample ([#1302](https://github.com/GetStream/stream-video-js/issues/1302)) ([4e7dbe0](https://github.com/GetStream/stream-video-js/commit/4e7dbe0bcbf8ea0e36a05241f1caf3eb9747a760))

### [0.6.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.1...@stream-io/video-react-native-sdk-0.6.2) (2024-04-12)

### Bug Fixes

- **react-native:** change objectFit to contain for screensharing ParticipantView ([#1314](https://github.com/GetStream/stream-video-js/issues/1314)) ([c50245d](https://github.com/GetStream/stream-video-js/commit/c50245df92d994d66ae1640b8acd41e8b2ec71e1))

### [0.6.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.6.0...@stream-io/video-react-native-sdk-0.6.1) (2024-04-09)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.1`
  - **Features**
    - **v1:** release
    - support target_resolution backend setting for
    - Noise
    - **feedback:** Collect user
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **devices:** API to disable speaking while muted
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.12`

## [0.6.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.5.17...@stream-io/video-react-native-sdk-0.6.0) (2024-04-09)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.0`
  - **Features**
    - remove server-side capabilities from JS
    - revert add submit feedback method to
    - add submit feedback method to
    - **react:** Support for Background Filters and Background
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
    - **speakers:** Participant audio output
  - **Bug Fixes**
    - various bug fixes and
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.11`

### ⚠ BREAKING CHANGES

- remove server-side capabilities from JS client (#1282)

### Features

- remove server-side capabilities from JS client ([#1282](https://github.com/GetStream/stream-video-js/issues/1282)) ([362b6b5](https://github.com/GetStream/stream-video-js/commit/362b6b501e6aa1864eb8486e3129a1705a4d41fb))

### [0.5.17](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.5.16...@stream-io/video-react-native-sdk-0.5.17) (2024-04-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.10`
  - **Features**
    - remove server-side capabilities from JS
    - revert add submit feedback method to
    - add submit feedback method to
    - **react:** Support for Background Filters and Background
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
    - **speakers:** Participant audio output
  - **Bug Fixes**
    - various bug fixes and
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.10`

### [0.5.16](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.5.15...@stream-io/video-react-native-sdk-0.5.16) (2024-04-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.9`
  - **Features**
    - remove server-side capabilities from JS
    - revert add submit feedback method to
    - add submit feedback method to
    - **react:** Support for Background Filters and Background
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
    - **speakers:** Participant audio output
  - **Bug Fixes**
    - various bug fixes and
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.9`

### [0.5.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.5.14...@stream-io/video-react-native-sdk-0.5.15) (2024-04-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.8`
  - **Features**
    - remove server-side capabilities from JS
    - revert add submit feedback method to
    - add submit feedback method to
    - **react:** Support for Background Filters and Background
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
    - **speakers:** Participant audio output
  - **Bug Fixes**
    - various bug fixes and
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.8`

### Features

- **react:** Support for Background Filters and Background Blurring ([#1283](https://github.com/GetStream/stream-video-js/issues/1283)) ([f790ee7](https://github.com/GetStream/stream-video-js/commit/f790ee78c20fb0f5266e429a777d8bb7ef158c83)), closes [#1271](https://github.com/GetStream/stream-video-js/issues/1271) [#1276](https://github.com/GetStream/stream-video-js/issues/1276)

### [0.5.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.5.13...@stream-io/video-react-native-sdk-0.5.14) (2024-04-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.7`
  - **Features**
    - remove server-side capabilities from JS
    - revert add submit feedback method to
    - add submit feedback method to
    - **react:** Support for Background Filters and Background
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
    - **speakers:** Participant audio output
  - **Bug Fixes**
    - various bug fixes and
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.7`

### [0.5.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.5.12...@stream-io/video-react-native-sdk-0.5.13) (2024-03-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.6`
  - **Features**
    - remove server-side capabilities from JS
    - revert add submit feedback method to
    - add submit feedback method to
    - **react:** Support for Background Filters and Background
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
    - **speakers:** Participant audio output
  - **Bug Fixes**
    - various bug fixes and
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.6`

### [0.5.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.5.11...@stream-io/video-react-native-sdk-0.5.12) (2024-03-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.5`
  - **Features**
    - remove server-side capabilities from JS
    - revert add submit feedback method to
    - add submit feedback method to
    - **react:** Support for Background Filters and Background
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
    - **speakers:** Participant audio output
  - **Bug Fixes**
    - various bug fixes and
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.5`

### [0.5.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.5.10...@stream-io/video-react-native-sdk-0.5.11) (2024-03-28)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.4`
  - **Features**
    - remove server-side capabilities from JS
    - revert add submit feedback method to
    - add submit feedback method to
    - **react:** Support for Background Filters and Background
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
    - **speakers:** Participant audio output
  - **Bug Fixes**
    - various bug fixes and
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.4`

### Bug Fixes

- **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in SDK ([#1299](https://github.com/GetStream/stream-video-js/issues/1299)) ([9527c41](https://github.com/GetStream/stream-video-js/commit/9527c4176d4e46224ddec18e3fddfb404e0aaae5))

### [0.5.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.5.9...@stream-io/video-react-native-sdk-0.5.10) (2024-03-25)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.3`
  - **Features**
    - remove server-side capabilities from JS
    - revert add submit feedback method to
    - add submit feedback method to
    - **react:** Support for Background Filters and Background
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
    - **speakers:** Participant audio output
  - **Bug Fixes**
    - various bug fixes and
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.3`

### Features

- SFU stats reporting ([#1297](https://github.com/GetStream/stream-video-js/issues/1297)) ([f46e927](https://github.com/GetStream/stream-video-js/commit/f46e927cbd650bc9af64a01cd5ebcec6cf2cfda8)), closes [#1276](https://github.com/GetStream/stream-video-js/issues/1276)

### [0.5.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.5.8...@stream-io/video-react-native-sdk-0.5.9) (2024-03-25)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.2`
  - **Features**
    - remove server-side capabilities from JS
    - revert add submit feedback method to
    - add submit feedback method to
    - **react:** Support for Background Filters and Background
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
    - **speakers:** Participant audio output
  - **Bug Fixes**
    - various bug fixes and
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.2`

### [0.5.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.5.7...@stream-io/video-react-native-sdk-0.5.8) (2024-03-20)

### Bug Fixes

- **react-native:** react-native-callkeep optional dependency import issue in SDK ([#1294](https://github.com/GetStream/stream-video-js/issues/1294)) ([6c664a7](https://github.com/GetStream/stream-video-js/commit/6c664a701e6dc838c2a4fcd73ce3f2a24f7f915a))

### [0.5.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.5.6...@stream-io/video-react-native-sdk-0.5.7) (2024-03-15)

### Bug Fixes

- commonjs optional libs bug workaround ([#1292](https://github.com/GetStream/stream-video-js/issues/1292)) ([6d47386](https://github.com/GetStream/stream-video-js/commit/6d47386de79dac2e4a6cf98b31cb1127f48b881c))

### [0.5.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.5.5...@stream-io/video-react-native-sdk-0.5.6) (2024-03-14)

### Bug Fixes

- **react-native:** floating participant speaking border jump issue ([#1291](https://github.com/GetStream/stream-video-js/issues/1291)) ([8e6fb5a](https://github.com/GetStream/stream-video-js/commit/8e6fb5aa047b4353c16673b03fb215508d79951b))

### [0.5.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.5.4...@stream-io/video-react-native-sdk-0.5.5) (2024-03-14)

### Bug Fixes

- remove automatic call leave in call content ([#1289](https://github.com/GetStream/stream-video-js/issues/1289)) ([b9714da](https://github.com/GetStream/stream-video-js/commit/b9714daea6146bf1ecd1c9b91aec0dcf85c5274f))

### [0.5.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.5.3...@stream-io/video-react-native-sdk-0.5.4) (2024-03-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.1`
  - **Features**
    - remove server-side capabilities from JS
    - revert add submit feedback method to
    - add submit feedback method to
    - **react:** Support for Background Filters and Background
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
    - **speakers:** Participant audio output
  - **Bug Fixes**
    - various bug fixes and
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.1`

### [0.5.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.5.2...@stream-io/video-react-native-sdk-0.5.3) (2024-03-13)

### Bug Fixes

- **react-native:** demo app login screen ([#1285](https://github.com/GetStream/stream-video-js/issues/1285)) ([eb7a4f4](https://github.com/GetStream/stream-video-js/commit/eb7a4f482edb8af13edf57cc404f96adc56abd09))

### [0.5.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.5.1...@stream-io/video-react-native-sdk-0.5.2) (2024-03-05)

### [0.5.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.5.0...@stream-io/video-react-native-sdk-0.5.1) (2024-03-01)

### Bug Fixes

- **react-native:** do not add screenshare permissions by default ([6bb3113](https://github.com/GetStream/stream-video-js/commit/6bb3113574f22fe6d5c6c9da41528da7502974ec))

## [0.5.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.4.3...@stream-io/video-react-native-sdk-0.5.0) (2024-02-26)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.0`
  - **Features**
    - **events:** improved type narrowing on call
    - **react-sdk:** Visual redesign of the SDK and Demo
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
- `@stream-io/video-react-bindings` updated to version `0.4.0`
  - **hooks:** expose permission hooks through
  - **device-api:** Browser Permissions

### ⚠ BREAKING CHANGES

- **hooks:** expose permission hooks through useCallStateHooks() (#1254)

### Features

- **hooks:** expose permission hooks through useCallStateHooks() ([#1254](https://github.com/GetStream/stream-video-js/issues/1254)) ([3eaa8bd](https://github.com/GetStream/stream-video-js/commit/3eaa8bd7592920eedb434b6ec747b6d22077ed87))

### [0.4.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.4.2...@stream-io/video-react-native-sdk-0.4.3) (2024-02-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.11`
  - **Features**
    - **events:** improved type narrowing on call
    - **react-sdk:** Visual redesign of the SDK and Demo
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
- `@stream-io/video-react-bindings` updated to version `0.3.22`
  - **hooks:** expose permission hooks through
  - **device-api:** Browser Permissions

### [0.4.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.4.1...@stream-io/video-react-native-sdk-0.4.2) (2024-02-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.10`
  - **Features**
    - **events:** improved type narrowing on call
    - **react-sdk:** Visual redesign of the SDK and Demo
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
- `@stream-io/video-react-bindings` updated to version `0.3.21`
  - **hooks:** expose permission hooks through
  - **device-api:** Browser Permissions

### [0.4.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.4.0...@stream-io/video-react-native-sdk-0.4.1) (2024-02-12)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.9`
  - **Features**
    - **events:** improved type narrowing on call
    - **react-sdk:** Visual redesign of the SDK and Demo
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
- `@stream-io/video-react-bindings` updated to version `0.3.20`
  - **hooks:** expose permission hooks through
  - **device-api:** Browser Permissions

## [0.4.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.18...@stream-io/video-react-native-sdk-0.4.0) (2024-02-12)

### ⚠ BREAKING CHANGES

- **react-native:** add missing push call.cancellation support in app terminated state (#1264)

### Bug Fixes

- **react-native:** add missing push call.cancellation support in app terminated state ([#1264](https://github.com/GetStream/stream-video-js/issues/1264)) ([e5dae2e](https://github.com/GetStream/stream-video-js/commit/e5dae2e7f2a99185b5329d5dd5634fbfad318b63))

### [0.3.18](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.17...@stream-io/video-react-native-sdk-0.3.18) (2024-02-06)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.8`
- `@stream-io/video-react-bindings` updated to version `0.3.19`

### [0.3.17](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.16...@stream-io/video-react-native-sdk-0.3.17) (2024-01-31)

### Bug Fixes

- **react-native:** align outgoing call controls button sizes ([800e330](https://github.com/GetStream/stream-video-js/commit/800e3308893212a305c53710939d9f47aad0d48d))
- **react-native:** check for ios provider name presence ([c6c5d2b](https://github.com/GetStream/stream-video-js/commit/c6c5d2bcc3f97ba3d7c28eac112db4cac9714078))

### [0.3.16](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.15...@stream-io/video-react-native-sdk-0.3.16) (2024-01-30)

### Bug Fixes

- **react-native-sdk:** use call settings permissions in CallControls ([#1255](https://github.com/GetStream/stream-video-js/issues/1255)) ([3eefa0d](https://github.com/GetStream/stream-video-js/commit/3eefa0db85693f79e32e6970cc42b2e8a5765f1a))

### [0.3.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.14...@stream-io/video-react-native-sdk-0.3.15) (2024-01-30)

### Features

- migrate expo example app to v50 ([#1249](https://github.com/GetStream/stream-video-js/issues/1249)) ([f4c99ac](https://github.com/GetStream/stream-video-js/commit/f4c99ac8bcd750c9bfc1628f5c05cfe42e50bb9f))

### [0.3.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.13...@stream-io/video-react-native-sdk-0.3.14) (2024-01-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.7`
- `@stream-io/video-react-bindings` updated to version `0.3.18`

### [0.3.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.12...@stream-io/video-react-native-sdk-0.3.13) (2024-01-26)

### Features

- add android default ringtone as the default ringing sound ([#1251](https://github.com/GetStream/stream-video-js/issues/1251)) ([bd47748](https://github.com/GetStream/stream-video-js/commit/bd47748177d82b9b0f5b1d01cfa1c8c5c28cc1ce))

### [0.3.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.11...@stream-io/video-react-native-sdk-0.3.12) (2024-01-25)

### Bug Fixes

- pass sound and vibration to android notifications display ([f4e34ec](https://github.com/GetStream/stream-video-js/commit/f4e34ec77ae8ab2885d6b98c428085431b52bc00))

### [0.3.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.10...@stream-io/video-react-native-sdk-0.3.11) (2024-01-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.6`
- `@stream-io/video-react-bindings` updated to version `0.3.17`

### [0.3.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.9...@stream-io/video-react-native-sdk-0.3.10) (2024-01-16)

### Features

- **react-native:** add support for kotlin in expo config plugin ([#1239](https://github.com/GetStream/stream-video-js/issues/1239)) ([d285e32](https://github.com/GetStream/stream-video-js/commit/d285e32940cf3864932cc6053f8e66bc164bceb0)), closes [#1231](https://github.com/GetStream/stream-video-js/issues/1231)

### [0.3.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.8...@stream-io/video-react-native-sdk-0.3.9) (2024-01-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.5`
- `@stream-io/video-react-bindings` updated to version `0.3.16`

### [0.3.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.7...@stream-io/video-react-native-sdk-0.3.8) (2024-01-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.4`
- `@stream-io/video-react-bindings` updated to version `0.3.15`

### [0.3.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.6...@stream-io/video-react-native-sdk-0.3.7) (2024-01-05)

### Features

- **react-native:** add ability to customize the objectFit for participant view ([#1225](https://github.com/GetStream/stream-video-js/issues/1225)) ([06c7010](https://github.com/GetStream/stream-video-js/commit/06c7010cd0fc128e4cfb582c8e8771e43a007629))

### [0.3.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.5...@stream-io/video-react-native-sdk-0.3.6) (2023-12-22)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.3`
- `@stream-io/video-react-bindings` updated to version `0.3.14`

### [0.3.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.4...@stream-io/video-react-native-sdk-0.3.5) (2023-12-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.2`
- `@stream-io/video-react-bindings` updated to version `0.3.13`

### [0.3.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.3...@stream-io/video-react-native-sdk-0.3.4) (2023-12-06)

### Bug Fixes

- **react-native:** unnecessary setState in initial device management ([#1211](https://github.com/GetStream/stream-video-js/issues/1211)) ([c9a10c3](https://github.com/GetStream/stream-video-js/commit/c9a10c3938aeddcae0008d4de84a604c873dcbde))

### [0.3.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.2...@stream-io/video-react-native-sdk-0.3.3) (2023-12-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.1`
- `@stream-io/video-react-bindings` updated to version `0.3.12`

### Features

- **client:** speaking while muted in React Native using temporary peer connection ([#1207](https://github.com/GetStream/stream-video-js/issues/1207)) ([9093006](https://github.com/GetStream/stream-video-js/commit/90930063503b6dfb83572dad8a31e45b16bf1685))

### [0.3.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.1...@stream-io/video-react-native-sdk-0.3.2) (2023-12-04)

### Bug Fixes

- **react-native:** remove postinstall command as it breaks on windows ([90f0b9c](https://github.com/GetStream/stream-video-js/commit/90f0b9ced6aa0c89593cb860a5a5c87d782766ca))

### [0.3.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.3.0...@stream-io/video-react-native-sdk-0.3.1) (2023-11-30)

### Bug Fixes

- **react-native:** do not trigger initial device setting after join ([204c303](https://github.com/GetStream/stream-video-js/commit/204c303353c536c44b77350bb49c117f21e093c5))

## [0.3.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.2.14...@stream-io/video-react-native-sdk-0.3.0) (2023-11-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.0`
  - **Features**
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.11`

### ⚠ BREAKING CHANGES

- **react-native:** move to webrtc 118 (#1197)

### Features

- **react-native:** move to webrtc 118 ([#1197](https://github.com/GetStream/stream-video-js/issues/1197)) ([8cdbe11](https://github.com/GetStream/stream-video-js/commit/8cdbe11de069fcb6eae5643f5cef5c9612f6c805))

### Bug Fixes

- **react-native:** remove unused import ([388d5fc](https://github.com/GetStream/stream-video-js/commit/388d5fc41479190c34b1f5042303157b96149381))

### [0.2.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.2.13...@stream-io/video-react-native-sdk-0.2.14) (2023-11-27)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.10`
  - **Features**
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.10`

### [0.2.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.2.12...@stream-io/video-react-native-sdk-0.2.13) (2023-11-27)

### Bug Fixes

- **react-native:** add default sound for android notifications ([6ecb6d3](https://github.com/GetStream/stream-video-js/commit/6ecb6d35016a4c8d8fc61d43c78a5b245c4f8ac5))

### [0.2.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.2.11...@stream-io/video-react-native-sdk-0.2.12) (2023-11-22)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.9`
  - **Features**
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.9`

### [0.2.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.2.10...@stream-io/video-react-native-sdk-0.2.11) (2023-11-17)

### Features

- **react-native:** update rn-webrtc version ([159b1cc](https://github.com/GetStream/stream-video-js/commit/159b1cc6b581f9dff257aad481170a36d5d065e9))

### [0.2.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.2.9...@stream-io/video-react-native-sdk-0.2.10) (2023-11-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.8`
  - **Features**
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.8`

### [0.2.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.2.8...@stream-io/video-react-native-sdk-0.2.9) (2023-11-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.7`
  - **Features**
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.7`

### Features

- **device-api:** Browser Permissions API ([#1184](https://github.com/GetStream/stream-video-js/issues/1184)) ([a0b3573](https://github.com/GetStream/stream-video-js/commit/a0b3573b630ff8450953cdf1102fe722aea83f6f))

### [0.2.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.2.7...@stream-io/video-react-native-sdk-0.2.8) (2023-11-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.6`
  - **Features**
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.6`

### [0.2.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.2.6...@stream-io/video-react-native-sdk-0.2.7) (2023-11-10)

### Bug Fixes

- **react-native:** Cannot find interface declaration for 'RCTEventEmitter' ([#1185](https://github.com/GetStream/stream-video-js/issues/1185)) ([ab0f314](https://github.com/GetStream/stream-video-js/commit/ab0f314bb035529b9b0da27e2c6c6ed17cd4c626))

### [0.2.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.2.5...@stream-io/video-react-native-sdk-0.2.6) (2023-11-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.5`
  - **Features**
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.5`

### [0.2.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.2.4...@stream-io/video-react-native-sdk-0.2.5) (2023-11-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.4`
  - **Features**
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.4`

### [0.2.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.2.3...@stream-io/video-react-native-sdk-0.2.4) (2023-11-01)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.3`
  - **Features**
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.3`

### [0.2.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.2.2...@stream-io/video-react-native-sdk-0.2.3) (2023-11-01)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.2`
  - **Features**
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.2`

### [0.2.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.2.1...@stream-io/video-react-native-sdk-0.2.2) (2023-10-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.1`
  - **Features**
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.1`

### [0.2.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.2.0...@stream-io/video-react-native-sdk-0.2.1) (2023-10-27)

### Features

- **react-native:** add screensharing ([#1149](https://github.com/GetStream/stream-video-js/issues/1149)) ([e021365](https://github.com/GetStream/stream-video-js/commit/e021365158d9bbe3c6192294a02fa694ce9f24fe))

## [0.2.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.1.14...@stream-io/video-react-native-sdk-0.2.0) (2023-10-27)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.0`
  - **Features**
    - **react-sdk:** Universal Device Management
    - **dynascale:** pick scaleResolutionDownBy parameter from the changePublishQuality
    - mute screenshare_audio, update to the newest OpenAPI
    - **build:** ESM and CJS
    - ScreenShare Audio
    - **Call Preview:** Support for call
    - **react-sdk:**
    - **client:** share replay of computed
    - Update with new API
    - speaking while muted
    - restore remote muting
    - new device api remote
    - speaker
    - **Call:** Dynascale support for Plain-JS
    - apply target resolution to video feed, sync camera/mic
    - Disable doesn't stop audio
    - use new device API in RN SDK and move to
    - New device API
  - **Bug Fixes**
    - **client:** disable server side
    - **client:** skip broken update call types
    - sorting in paginated
    - ensure stable
    - use `@stream-io/video-client` as a tag
    - use `@types/ws` as a regular
    - add type check of deviceId before setting
    - Add extra delay before attempting to play video in Safari and
    - unmount video element when there is no video track or participant is
    - initial device state
    - **DynascaleManager:** update subscription upon
    - consider prior track publishing state before applying soft
    - do not do any codec preferences when sending dummy
    - **react-native:** blank stream on
    - round non-int video dimension
    - type definition of user object for ws
    - device api small
    - Change the backtage default value to
    - guest auth didn't wait for some API
    - **client:** export missing
- `@stream-io/video-react-bindings` updated to version `0.3.0`
  - correctly report `live` state of the

### ⚠ BREAKING CHANGES

- **react-sdk:** Universal Device Management API (#1127)

### Features

- **react-sdk:** Universal Device Management API ([#1127](https://github.com/GetStream/stream-video-js/issues/1127)) ([aeb3561](https://github.com/GetStream/stream-video-js/commit/aeb35612745f45254b536281c5f81d1bcac2bab5))

### [0.1.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.1.13...@stream-io/video-react-native-sdk-0.1.14) (2023-10-26)

### Dependency Updates

- `@stream-io/video-react-bindings` updated to version `0.2.37`
  - correctly report `live` state of the

### [0.1.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.1.12...@stream-io/video-react-native-sdk-0.1.13) (2023-10-25)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.3.36`
  - **Features**
    - **react-sdk:** Universal Device Management
    - **dynascale:** pick scaleResolutionDownBy parameter from the changePublishQuality
    - mute screenshare_audio, update to the newest OpenAPI
    - **build:** ESM and CJS
    - ScreenShare Audio
    - **Call Preview:** Support for call
    - **react-sdk:**
    - **client:** share replay of computed
    - Update with new API
    - speaking while muted
    - restore remote muting
    - new device api remote
    - speaker
    - **Call:** Dynascale support for Plain-JS
    - apply target resolution to video feed, sync camera/mic
    - Disable doesn't stop audio
    - use new device API in RN SDK and move to
    - New device API
  - **Bug Fixes**
    - **client:** disable server side
    - **client:** skip broken update call types
    - sorting in paginated
    - ensure stable
    - use `@stream-io/video-client` as a tag
    - use `@types/ws` as a regular
    - add type check of deviceId before setting
    - Add extra delay before attempting to play video in Safari and
    - unmount video element when there is no video track or participant is
    - initial device state
    - **DynascaleManager:** update subscription upon
    - consider prior track publishing state before applying soft
    - do not do any codec preferences when sending dummy
    - **react-native:** blank stream on
    - round non-int video dimension
    - type definition of user object for ws
    - device api small
    - Change the backtage default value to
    - guest auth didn't wait for some API
    - **client:** export missing
- `@stream-io/video-react-bindings` updated to version `0.2.37`
  - correctly report `live` state of the

### [0.1.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.1.11...@stream-io/video-react-native-sdk-0.1.12) (2023-10-20)

### Features

- **react-native:** add picture-in-picture support for Android ([#1133](https://github.com/GetStream/stream-video-js/issues/1133)) ([ad313cc](https://github.com/GetStream/stream-video-js/commit/ad313cc1abf59020936b342621669448bd03c0a8))

### [0.1.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.1.10...@stream-io/video-react-native-sdk-0.1.11) (2023-10-19)

### Features

- **react-native:** live stream components for host and viewer ([#1135](https://github.com/GetStream/stream-video-js/issues/1135)) ([5a5f0e1](https://github.com/GetStream/stream-video-js/commit/5a5f0e10ba7c32d77c547bd3e42396a385fb9f50))

### [0.1.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.1.9...@stream-io/video-react-native-sdk-0.1.10) (2023-10-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.3.35`
  - **Features**
    - **react-sdk:** Universal Device Management
    - **dynascale:** pick scaleResolutionDownBy parameter from the changePublishQuality
    - mute screenshare_audio, update to the newest OpenAPI
    - **build:** ESM and CJS
    - ScreenShare Audio
    - **Call Preview:** Support for call
    - **react-sdk:**
    - **client:** share replay of computed
    - Update with new API
    - speaking while muted
    - restore remote muting
    - new device api remote
    - speaker
    - **Call:** Dynascale support for Plain-JS
    - apply target resolution to video feed, sync camera/mic
    - Disable doesn't stop audio
    - use new device API in RN SDK and move to
    - New device API
  - **Bug Fixes**
    - **client:** disable server side
    - **client:** skip broken update call types
    - sorting in paginated
    - ensure stable
    - use `@stream-io/video-client` as a tag
    - use `@types/ws` as a regular
    - add type check of deviceId before setting
    - Add extra delay before attempting to play video in Safari and
    - unmount video element when there is no video track or participant is
    - initial device state
    - **DynascaleManager:** update subscription upon
    - consider prior track publishing state before applying soft
    - do not do any codec preferences when sending dummy
    - **react-native:** blank stream on
    - round non-int video dimension
    - type definition of user object for ws
    - device api small
    - Change the backtage default value to
    - guest auth didn't wait for some API
    - **client:** export missing
- `@stream-io/video-react-bindings` updated to version `0.2.36`
  - correctly report `live` state of the

### Features

- mute screenshare_audio, update to the newest OpenAPI schema ([#1148](https://github.com/GetStream/stream-video-js/issues/1148)) ([81c45a7](https://github.com/GetStream/stream-video-js/commit/81c45a77e6a526de05ce5457357d212fb3e613d9))

### [0.1.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.1.8...@stream-io/video-react-native-sdk-0.1.9) (2023-10-18)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.3.34`
  - **Features**
    - **react-sdk:** Universal Device Management
    - **dynascale:** pick scaleResolutionDownBy parameter from the changePublishQuality
    - mute screenshare_audio, update to the newest OpenAPI
    - **build:** ESM and CJS
    - ScreenShare Audio
    - **Call Preview:** Support for call
    - **react-sdk:**
    - **client:** share replay of computed
    - Update with new API
    - speaking while muted
    - restore remote muting
    - new device api remote
    - speaker
    - **Call:** Dynascale support for Plain-JS
    - apply target resolution to video feed, sync camera/mic
    - Disable doesn't stop audio
    - use new device API in RN SDK and move to
    - New device API
  - **Bug Fixes**
    - **client:** disable server side
    - **client:** skip broken update call types
    - sorting in paginated
    - ensure stable
    - use `@stream-io/video-client` as a tag
    - use `@types/ws` as a regular
    - add type check of deviceId before setting
    - Add extra delay before attempting to play video in Safari and
    - unmount video element when there is no video track or participant is
    - initial device state
    - **DynascaleManager:** update subscription upon
    - consider prior track publishing state before applying soft
    - do not do any codec preferences when sending dummy
    - **react-native:** blank stream on
    - round non-int video dimension
    - type definition of user object for ws
    - device api small
    - Change the backtage default value to
    - guest auth didn't wait for some API
    - **client:** export missing
- `@stream-io/video-react-bindings` updated to version `0.2.35`
  - correctly report `live` state of the

### Features

- **build:** ESM and CJS bundles ([#1144](https://github.com/GetStream/stream-video-js/issues/1144)) ([58b60ee](https://github.com/GetStream/stream-video-js/commit/58b60eee4b1cd667d2eef8f17ed4e6da74876a51)), closes [#1025](https://github.com/GetStream/stream-video-js/issues/1025)

### [0.1.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.1.7...@stream-io/video-react-native-sdk-0.1.8) (2023-10-13)

### Bug Fixes

- **react-native:** misc expo config plugin bugs ([bba3f84](https://github.com/GetStream/stream-video-js/commit/bba3f8437cb0f7a662adef4e89fbc487225a5ed5))

### [0.1.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.1.6...@stream-io/video-react-native-sdk-0.1.7) (2023-10-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.3.33`
  - **Features**
    - **react-sdk:** Universal Device Management
    - **dynascale:** pick scaleResolutionDownBy parameter from the changePublishQuality
    - mute screenshare_audio, update to the newest OpenAPI
    - **build:** ESM and CJS
    - ScreenShare Audio
    - **Call Preview:** Support for call
    - **react-sdk:**
    - **client:** share replay of computed
    - Update with new API
    - speaking while muted
    - restore remote muting
    - new device api remote
    - speaker
    - **Call:** Dynascale support for Plain-JS
    - apply target resolution to video feed, sync camera/mic
    - Disable doesn't stop audio
    - use new device API in RN SDK and move to
    - New device API
  - **Bug Fixes**
    - **client:** disable server side
    - **client:** skip broken update call types
    - sorting in paginated
    - ensure stable
    - use `@stream-io/video-client` as a tag
    - use `@types/ws` as a regular
    - add type check of deviceId before setting
    - Add extra delay before attempting to play video in Safari and
    - unmount video element when there is no video track or participant is
    - initial device state
    - **DynascaleManager:** update subscription upon
    - consider prior track publishing state before applying soft
    - do not do any codec preferences when sending dummy
    - **react-native:** blank stream on
    - round non-int video dimension
    - type definition of user object for ws
    - device api small
    - Change the backtage default value to
    - guest auth didn't wait for some API
    - **client:** export missing
- `@stream-io/video-react-bindings` updated to version `0.2.34`
  - correctly report `live` state of the

### Bug Fixes

- **react-native:** added missing webrtc android expo config steps ([fb2c5a1](https://github.com/GetStream/stream-video-js/commit/fb2c5a1da24bc6c7d9d235ad1d8a562c8a075360))

### [0.1.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.1.5...@stream-io/video-react-native-sdk-0.1.6) (2023-10-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.3.32`
  - **Features**
    - **react-sdk:** Universal Device Management
    - **dynascale:** pick scaleResolutionDownBy parameter from the changePublishQuality
    - mute screenshare_audio, update to the newest OpenAPI
    - **build:** ESM and CJS
    - ScreenShare Audio
    - **Call Preview:** Support for call
    - **react-sdk:**
    - **client:** share replay of computed
    - Update with new API
    - speaking while muted
    - restore remote muting
    - new device api remote
    - speaker
    - **Call:** Dynascale support for Plain-JS
    - apply target resolution to video feed, sync camera/mic
    - Disable doesn't stop audio
    - use new device API in RN SDK and move to
    - New device API
  - **Bug Fixes**
    - **client:** disable server side
    - **client:** skip broken update call types
    - sorting in paginated
    - ensure stable
    - use `@stream-io/video-client` as a tag
    - use `@types/ws` as a regular
    - add type check of deviceId before setting
    - Add extra delay before attempting to play video in Safari and
    - unmount video element when there is no video track or participant is
    - initial device state
    - **DynascaleManager:** update subscription upon
    - consider prior track publishing state before applying soft
    - do not do any codec preferences when sending dummy
    - **react-native:** blank stream on
    - round non-int video dimension
    - type definition of user object for ws
    - device api small
    - Change the backtage default value to
    - guest auth didn't wait for some API
    - **client:** export missing
- `@stream-io/video-react-bindings` updated to version `0.2.33`
  - correctly report `live` state of the

### Features

- **react-native:** add landscape mode support to Lobby, RingingCallContent and DF app ([#1123](https://github.com/GetStream/stream-video-js/issues/1123)) ([cc247f0](https://github.com/GetStream/stream-video-js/commit/cc247f07d50acc775034535e37fd5b319f26673d))

### Bug Fixes

- **react-native:** incorrect starting position on reanimated floating animation ([#1139](https://github.com/GetStream/stream-video-js/issues/1139)) ([8d09012](https://github.com/GetStream/stream-video-js/commit/8d09012bc42adbd4474ddbc24ebb0b0362e7332e))

### [0.1.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.1.4...@stream-io/video-react-native-sdk-0.1.5) (2023-10-11)

### Bug Fixes

- **react-native:** faulty default value for landscape mode for CallContent ([#1137](https://github.com/GetStream/stream-video-js/issues/1137)) ([ecb72b3](https://github.com/GetStream/stream-video-js/commit/ecb72b34c9acce690bfa157501c5dce845519670))

### [0.1.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.1.3...@stream-io/video-react-native-sdk-0.1.4) (2023-10-09)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.3.31`
  - **Features**
    - **react-sdk:** Universal Device Management
    - **dynascale:** pick scaleResolutionDownBy parameter from the changePublishQuality
    - mute screenshare_audio, update to the newest OpenAPI
    - **build:** ESM and CJS
    - ScreenShare Audio
    - **Call Preview:** Support for call
    - **react-sdk:**
    - **client:** share replay of computed
    - Update with new API
    - speaking while muted
    - restore remote muting
    - new device api remote
    - speaker
    - **Call:** Dynascale support for Plain-JS
    - apply target resolution to video feed, sync camera/mic
    - Disable doesn't stop audio
    - use new device API in RN SDK and move to
    - New device API
  - **Bug Fixes**
    - **client:** disable server side
    - **client:** skip broken update call types
    - sorting in paginated
    - ensure stable
    - use `@stream-io/video-client` as a tag
    - use `@types/ws` as a regular
    - add type check of deviceId before setting
    - Add extra delay before attempting to play video in Safari and
    - unmount video element when there is no video track or participant is
    - initial device state
    - **DynascaleManager:** update subscription upon
    - consider prior track publishing state before applying soft
    - do not do any codec preferences when sending dummy
    - **react-native:** blank stream on
    - round non-int video dimension
    - type definition of user object for ws
    - device api small
    - Change the backtage default value to
    - guest auth didn't wait for some API
    - **client:** export missing
- `@stream-io/video-react-bindings` updated to version `0.2.32`
  - correctly report `live` state of the

### Features

- **react-native:** add all push support to Expo and non ringing push for vanilla ([#1097](https://github.com/GetStream/stream-video-js/issues/1097)) ([9dcbe23](https://github.com/GetStream/stream-video-js/commit/9dcbe23dc949e452132b5450419a9558dc836309))

### [0.1.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.1.2...@stream-io/video-react-native-sdk-0.1.3) (2023-10-06)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.3.30`
  - **Features**
    - **react-sdk:** Universal Device Management
    - **dynascale:** pick scaleResolutionDownBy parameter from the changePublishQuality
    - mute screenshare_audio, update to the newest OpenAPI
    - **build:** ESM and CJS
    - ScreenShare Audio
    - **Call Preview:** Support for call
    - **react-sdk:**
    - **client:** share replay of computed
    - Update with new API
    - speaking while muted
    - restore remote muting
    - new device api remote
    - speaker
    - **Call:** Dynascale support for Plain-JS
    - apply target resolution to video feed, sync camera/mic
    - Disable doesn't stop audio
    - use new device API in RN SDK and move to
    - New device API
  - **Bug Fixes**
    - **client:** disable server side
    - **client:** skip broken update call types
    - sorting in paginated
    - ensure stable
    - use `@stream-io/video-client` as a tag
    - use `@types/ws` as a regular
    - add type check of deviceId before setting
    - Add extra delay before attempting to play video in Safari and
    - unmount video element when there is no video track or participant is
    - initial device state
    - **DynascaleManager:** update subscription upon
    - consider prior track publishing state before applying soft
    - do not do any codec preferences when sending dummy
    - **react-native:** blank stream on
    - round non-int video dimension
    - type definition of user object for ws
    - device api small
    - Change the backtage default value to
    - guest auth didn't wait for some API
    - **client:** export missing
- `@stream-io/video-react-bindings` updated to version `0.2.31`
  - correctly report `live` state of the

### Features

- ScreenShare Audio support ([#1118](https://github.com/GetStream/stream-video-js/issues/1118)) ([5b63e1c](https://github.com/GetStream/stream-video-js/commit/5b63e1c5f52c76e3761e6907bd3786c19f0e5c6d))

### [0.1.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.1.1...@stream-io/video-react-native-sdk-0.1.2) (2023-10-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.3.29`
  - **Features**
    - **react-sdk:** Universal Device Management
    - **dynascale:** pick scaleResolutionDownBy parameter from the changePublishQuality
    - mute screenshare_audio, update to the newest OpenAPI
    - **build:** ESM and CJS
    - ScreenShare Audio
    - **Call Preview:** Support for call
    - **react-sdk:**
    - **client:** share replay of computed
    - Update with new API
    - speaking while muted
    - restore remote muting
    - new device api remote
    - speaker
    - **Call:** Dynascale support for Plain-JS
    - apply target resolution to video feed, sync camera/mic
    - Disable doesn't stop audio
    - use new device API in RN SDK and move to
    - New device API
  - **Bug Fixes**
    - **client:** disable server side
    - **client:** skip broken update call types
    - sorting in paginated
    - ensure stable
    - use `@stream-io/video-client` as a tag
    - use `@types/ws` as a regular
    - add type check of deviceId before setting
    - Add extra delay before attempting to play video in Safari and
    - unmount video element when there is no video track or participant is
    - initial device state
    - **DynascaleManager:** update subscription upon
    - consider prior track publishing state before applying soft
    - do not do any codec preferences when sending dummy
    - **react-native:** blank stream on
    - round non-int video dimension
    - type definition of user object for ws
    - device api small
    - Change the backtage default value to
    - guest auth didn't wait for some API
    - **client:** export missing
- `@stream-io/video-react-bindings` updated to version `0.2.30`
  - correctly report `live` state of the

### [0.1.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.1.0...@stream-io/video-react-native-sdk-0.1.1) (2023-10-04)

### Features

- **react-native:** add lobby footer component ([#1091](https://github.com/GetStream/stream-video-js/issues/1091)) ([4945eb3](https://github.com/GetStream/stream-video-js/commit/4945eb358c4217f502a9735865664cef6c133a93))

## [0.1.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.28...@stream-io/video-react-native-sdk-0.1.0) (2023-10-04)

### ⚠ BREAKING CHANGES

- **react-native:** set reactions through props and not config (#1069)

### Features

- **react-native:** set reactions through props and not config ([#1069](https://github.com/GetStream/stream-video-js/issues/1069)) ([9569648](https://github.com/GetStream/stream-video-js/commit/95696482c5622c3c93f071356b980deebee6bfbf))

### [0.0.28](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.27...@stream-io/video-react-native-sdk-0.0.28) (2023-10-02)

### Features

- **react-native:** support landscape more for CallContent ([#1119](https://github.com/GetStream/stream-video-js/issues/1119)) ([2e218b4](https://github.com/GetStream/stream-video-js/commit/2e218b4ad8f00c5eb1632d64df6c5d3456b5af41))

### [0.0.27](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.26...@stream-io/video-react-native-sdk-0.0.27) (2023-09-28)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.3.28`
- `@stream-io/video-react-bindings` updated to version `0.2.29`

### [0.0.26](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.25...@stream-io/video-react-native-sdk-0.0.26) (2023-09-28)

### Bug Fixes

- **react-native:** initial media stream management according to BE and SDK settings ([#1110](https://github.com/GetStream/stream-video-js/issues/1110)) ([cca7cf6](https://github.com/GetStream/stream-video-js/commit/cca7cf6d977a3a46e17deb73fa4f1b585d2039e8))

### [0.0.25](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.24...@stream-io/video-react-native-sdk-0.0.25) (2023-09-28)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.2.28`

### [0.0.24](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.23...@stream-io/video-react-native-sdk-0.0.24) (2023-09-27)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.2.27`

### Features

- **Call Preview:** Support for call thumbnails ([#1099](https://github.com/GetStream/stream-video-js/issues/1099)) ([9274f76](https://github.com/GetStream/stream-video-js/commit/9274f760ed264ee0ee6ac97c6fe679288e067fd8))

### [0.0.23](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.22...@stream-io/video-react-native-sdk-0.0.23) (2023-09-27)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.2.26`

### [0.0.22](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.21...@stream-io/video-react-native-sdk-0.0.22) (2023-09-26)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.2.25`

### [0.0.21](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.20...@stream-io/video-react-native-sdk-0.0.21) (2023-09-26)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.2.24`

### [0.0.20](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.19...@stream-io/video-react-native-sdk-0.0.20) (2023-09-25)

### Dependency Updates

- `@stream-io/i18n` updated to version `0.1.2`
- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.2.23`

### Bug Fixes

- Add extra delay before attempting to play video in Safari and Firefox ([#1106](https://github.com/GetStream/stream-video-js/issues/1106)) ([5b4a589](https://github.com/GetStream/stream-video-js/commit/5b4a58918240a7b63807726609d6d54b92cfe1d2))

### [0.0.19](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.18...@stream-io/video-react-native-sdk-0.0.19) (2023-09-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.2.22`

### [0.0.18](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.17...@stream-io/video-react-native-sdk-0.0.18) (2023-09-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.2.21`

### [0.0.17](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.16...@stream-io/video-react-native-sdk-0.0.17) (2023-09-18)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`

### [0.0.16](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.15...@stream-io/video-react-native-sdk-0.0.16) (2023-09-15)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.2.20`

### Bug Fixes

- initial device state handling ([#1092](https://github.com/GetStream/stream-video-js/issues/1092)) ([a98d07f](https://github.com/GetStream/stream-video-js/commit/a98d07f9e3eaf6bb059911538ba2a64a1550e53d))

### [0.0.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.14...@stream-io/video-react-native-sdk-0.0.15) (2023-09-15)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.2.19`

### [0.0.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.13...@stream-io/video-react-native-sdk-0.0.14) (2023-09-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.2.18`

### [0.0.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.12...@stream-io/video-react-native-sdk-0.0.13) (2023-09-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.2.17`

### [0.0.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.11...@stream-io/video-react-native-sdk-0.0.12) (2023-09-12)

### Bug Fixes

- **react-native:** remove method to inform SDK about native permissions ([#1072](https://github.com/GetStream/stream-video-js/issues/1072)) ([53b4abd](https://github.com/GetStream/stream-video-js/commit/53b4abd80c17fc21d7f3a93dd103946ef0b3f080))

### [0.0.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.10...@stream-io/video-react-native-sdk-0.0.11) (2023-09-12)

### Bug Fixes

- **react-native:** add missing commonjs support ([#1075](https://github.com/GetStream/stream-video-js/issues/1075)) ([c9e4e7d](https://github.com/GetStream/stream-video-js/commit/c9e4e7df73c8568286afe18ec7816aa69836b1c7))

### [0.0.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.9...@stream-io/video-react-native-sdk-0.0.10) (2023-09-11)

### Bug Fixes

- **react-native:** add missing expo plugin in npm pack ([bfeb79d](https://github.com/GetStream/stream-video-js/commit/bfeb79d2a540f627e8fcefbe1524cf634307ce84))

### [0.0.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.8...@stream-io/video-react-native-sdk-0.0.9) (2023-09-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.2.16`

### [0.0.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.7...@stream-io/video-react-native-sdk-0.0.8) (2023-09-07)

### Features

- **react-native:** add expo video sample app ([#974](https://github.com/GetStream/stream-video-js/issues/974)) ([3c61756](https://github.com/GetStream/stream-video-js/commit/3c617566bea8160c765682c256d84d72e4243082))

### [0.0.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.6...@stream-io/video-react-native-sdk-0.0.7) (2023-09-06)

### Bug Fixes

- downgraded rn url polyfill dep to be compatible with jest ([#1059](https://github.com/GetStream/stream-video-js/issues/1059)) ([6f17239](https://github.com/GetStream/stream-video-js/commit/6f1723943e106a8584e46976350f1898b1b3bf50))

### [0.0.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.5...@stream-io/video-react-native-sdk-0.0.6) (2023-09-05)

### Bug Fixes

- added missing props for RingingCallContent ([#1057](https://github.com/GetStream/stream-video-js/issues/1057)) ([60bb247](https://github.com/GetStream/stream-video-js/commit/60bb2474f837346a87e06610fe26758caf12c890))

### [0.0.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.4...@stream-io/video-react-native-sdk-0.0.5) (2023-09-05)

### Bug Fixes

- override default handler with onPressHandler prop for ToggleCameraButton ([#1053](https://github.com/GetStream/stream-video-js/issues/1053)) ([2eecce6](https://github.com/GetStream/stream-video-js/commit/2eecce6d8e66ba58bede69776815efa929680716))

### [0.0.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.3...@stream-io/video-react-native-sdk-0.0.4) (2023-09-05)

### Bug Fixes

- **react-native:** missing translations in lobby component ([3dbed69](https://github.com/GetStream/stream-video-js/commit/3dbed692dcbb4b6a948cc1eb41540ab1e7825912))

### [0.0.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.2...@stream-io/video-react-native-sdk-0.0.3) (2023-09-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.2.15`

### [0.0.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.1...@stream-io/video-react-native-sdk-0.0.2) (2023-09-05)

### Bug Fixes

- handle media device initial state when media status is undefined ([#1051](https://github.com/GetStream/stream-video-js/issues/1051)) ([4c9ff8d](https://github.com/GetStream/stream-video-js/commit/4c9ff8dda64eb5939ab1bae42734003da9aa768b))

### [0.0.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-native-sdk-0.0.1-alpha.415...@stream-io/video-react-native-sdk-0.0.1) (2023-08-31)

### Dependency Updates

- `@stream-io/i18n` updated to version `0.1.1`
- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.2.14`

### Features

- first stable release 0.0.1 ([#1027](https://github.com/GetStream/stream-video-js/issues/1027)) ([3a2efe7](https://github.com/GetStream/stream-video-js/commit/3a2efe7a86c6ef5c79630207e85d4f4370ac5848))
- **react-native:** first stable release ([#1036](https://github.com/GetStream/stream-video-js/issues/1036)) ([49750c1](https://github.com/GetStream/stream-video-js/commit/49750c1506fe94f680f0b2361c3506b57031ad81))
