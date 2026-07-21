# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## [1.39.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.39.2...@stream-io/video-react-sdk-1.39.3) (2026-07-17)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.10.1`
- `@stream-io/typescript-config` updated to version `0.1.0`
- `@stream-io/video-client` updated to version `1.55.2`
- `@stream-io/video-filters-web` updated to version `0.8.3`
- `@stream-io/video-react-bindings` updated to version `1.18.3`

### Bug Fixes

- use speakerLayoutSortPreset in RN spotlight view ([#2332](https://github.com/GetStream/stream-video-js/issues/2332)) ([910a5de](https://github.com/GetStream/stream-video-js/commit/910a5de6160cc34de99ea1615ef40bb034c57078))

## [1.39.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.39.1...@stream-io/video-react-sdk-1.39.2) (2026-07-09)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.10.0`
- `@stream-io/typescript-config` updated to version `0.1.0`
- `@stream-io/video-client` updated to version `1.55.2`
- `@stream-io/video-filters-web` updated to version `0.8.2`
- `@stream-io/video-react-bindings` updated to version `1.18.2`

## [1.39.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.39.0...@stream-io/video-react-sdk-1.39.1) (2026-07-02)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.9.1`
- `@stream-io/typescript-config` updated to version `0.1.0`
- `@stream-io/video-client` updated to version `1.55.1`
- `@stream-io/video-filters-web` updated to version `0.8.1`
- `@stream-io/video-react-bindings` updated to version `1.18.1`

## [1.39.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.38.0...@stream-io/video-react-sdk-1.39.0) (2026-06-26)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.9.0`
- `@stream-io/typescript-config` updated to version `0.1.0`
- `@stream-io/video-styling` updated to version `1.14.2`
- `@stream-io/video-client` updated to version `1.55.0`
- `@stream-io/video-filters-web` updated to version `0.8.0`
- `@stream-io/video-react-bindings` updated to version `1.18.0`

### Features

- upgrade to TypeScript 6.0.3, pin ES2022, raise supported-browser floors ([#2290](https://github.com/GetStream/stream-video-js/issues/2290)) ([d9ea158](https://github.com/GetStream/stream-video-js/commit/d9ea15846582fa8db86b3b873eca2afe92ae3593))

### Performance Improvements

- **react-sdk:** reduce re-renders and event-listener churn ([#2273](https://github.com/GetStream/stream-video-js/issues/2273)) ([0234d1e](https://github.com/GetStream/stream-video-js/commit/0234d1e2e3e2f031d69ab6335c97924f9f47a6ec))

## [1.38.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.37.7...@stream-io/video-react-sdk-1.38.0) (2026-06-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.54.0`
- `@stream-io/video-react-bindings` updated to version `1.17.0`

### Features

- **client:** show connecting indicator while video track is connecting ([#2275](https://github.com/GetStream/stream-video-js/issues/2275)) ([a9c670d](https://github.com/GetStream/stream-video-js/commit/a9c670dec44cc008f1b22aab8cb61998e71d3050)), closes [GetStream/react-native-webrtc#32](https://github.com/GetStream/react-native-webrtc/issues/32)

## [1.37.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.37.6...@stream-io/video-react-sdk-1.37.7) (2026-06-12)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.53.2`
  - **client:** keep user_id populated in call event telemetry when a disconnect races an in-flight join ([#2284](https://github.com/GetStream/stream-video-js/issues/2284)) ([4403348](https://github.com/GetStream/stream-video-js/commit/4403348115500499cd60919a417d97659546bb8b))
- `@stream-io/video-react-bindings` updated to version `1.16.5`

## [1.37.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.37.5...@stream-io/video-react-sdk-1.37.6) (2026-06-12)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.53.1`
  - **client:** Send call data in JoinInitiated event ([#2283](https://github.com/GetStream/stream-video-js/issues/2283)) ([7e9ce3e](https://github.com/GetStream/stream-video-js/commit/7e9ce3e3e3c4ebe8080f86793855a39abe7e19ef))
  - **ios:** joining a call muted may break remote audio playout ([#2282](https://github.com/GetStream/stream-video-js/issues/2282)) ([dc672a6](https://github.com/GetStream/stream-video-js/commit/dc672a69971d6ca46648696c242609c687cb42d7))
- `@stream-io/video-react-bindings` updated to version `1.16.4`

## [1.37.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.37.4...@stream-io/video-react-sdk-1.37.5) (2026-06-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.53.0`
  - **Features**
    - **client:** Call event reporting ([#2261](https://github.com/GetStream/stream-video-js/issues/2261)) ([246b8c8](https://github.com/GetStream/stream-video-js/commit/246b8c826cccd22a09cd34391e9a773e91860fa8))
  - **Bug Fixes**
    - **client:** preserve captured stage error in call event reporting ([#2281](https://github.com/GetStream/stream-video-js/issues/2281)) ([890ce0b](https://github.com/GetStream/stream-video-js/commit/890ce0b25d0f1530ba9ebd2ef56fe366f3377312))
- `@stream-io/video-react-bindings` updated to version `1.16.3`

## [1.37.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.37.3...@stream-io/video-react-sdk-1.37.4) (2026-06-01)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.8.2`
- `@stream-io/video-styling` updated to version `1.14.1`
- `@stream-io/video-client` updated to version `1.52.0`
  - **Features**
    - **client:** add hasInterruptedTrack helper ([#2266](https://github.com/GetStream/stream-video-js/issues/2266)) ([c723eb6](https://github.com/GetStream/stream-video-js/commit/c723eb67bffcb00edc03e4960a0d3a600bba8687))
    - **client:** echo negotiationId in subscriber offer answer ([#2166](https://github.com/GetStream/stream-video-js/issues/2166)) ([749e0ad](https://github.com/GetStream/stream-video-js/commit/749e0ad025d579cf2a2792e6016f5eaffb9ee7a7))
  - **Bug Fixes**
    - **client:** clamp drifted getStats timestamps to wall time ([#2258](https://github.com/GetStream/stream-video-js/issues/2258)) ([9d96df5](https://github.com/GetStream/stream-video-js/commit/9d96df552337fea27285a4260a4d1d76b39eb7b7))
  - **Other**
    - **deps:** upgrade React Native 0.85, React 19.2, Vite 8/Vitest 4, and Expo 56 ([#2268](https://github.com/GetStream/stream-video-js/issues/2268)) ([2c8ab9d](https://github.com/GetStream/stream-video-js/commit/2c8ab9d9238f3700dabbd04c9ce5bf3aaa4c7a13))
- `@stream-io/video-filters-web` updated to version `0.7.5`
- `@stream-io/video-react-bindings` updated to version `1.16.2`

- **deps:** upgrade React Native 0.85, React 19.2, Vite 8/Vitest 4, and Expo 56 ([#2268](https://github.com/GetStream/stream-video-js/issues/2268)) ([2c8ab9d](https://github.com/GetStream/stream-video-js/commit/2c8ab9d9238f3700dabbd04c9ce5bf3aaa4c7a13))

## [1.37.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.37.2...@stream-io/video-react-sdk-1.37.3) (2026-05-26)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.51.0`
  - **Features**
    - **client:** Register virtual devices ([#2220](https://github.com/GetStream/stream-video-js/issues/2220)) ([c663e2d](https://github.com/GetStream/stream-video-js/commit/c663e2df9f82cf64c38a9d3e6a1e86282107b27d))
  - **Bug Fixes**
    - **client:** bail reconnects during in-flight lifecycles and clean up listeners ([#2257](https://github.com/GetStream/stream-video-js/issues/2257)) ([f6fa17e](https://github.com/GetStream/stream-video-js/commit/f6fa17e041cef1aebeba38b06d6cfba5c085e5a6))
    - **client:** stop sending RTP after track.stop() on Firefox ([#2237](https://github.com/GetStream/stream-video-js/issues/2237)) ([5b7e9b8](https://github.com/GetStream/stream-video-js/commit/5b7e9b8bd17c43f17d66586dd88617ae91bac609))
- `@stream-io/video-react-bindings` updated to version `1.16.1`

## [1.37.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.37.1...@stream-io/video-react-sdk-1.37.2) (2026-05-25)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.8.1`

## [1.37.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.37.0...@stream-io/video-react-sdk-1.37.1) (2026-05-25)

- fixed impure function usage issue ([#2254](https://github.com/GetStream/stream-video-js/issues/2254)) ([6afe0bc](https://github.com/GetStream/stream-video-js/commit/6afe0bcba355cf91595a6e4e2dfc9bd0dd9c7041))

## [1.37.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.36.1...@stream-io/video-react-sdk-1.37.0) (2026-05-18)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.8.0`
- `@stream-io/video-styling` updated to version `1.14.0`
- `@stream-io/video-client` updated to version `1.50.0`
  - **Features**
    - **client:** honor SFU degradationPreference on the publisher ([#2241](https://github.com/GetStream/stream-video-js/issues/2241)) ([85b34a3](https://github.com/GetStream/stream-video-js/commit/85b34a39ba669b59fb1842f047a5c03c4fd196f9)), closes [#1886](https://github.com/GetStream/stream-video-js/issues/1886)
  - **Bug Fixes**
    - **client:** prevent call.join() hang on silent WS handshake stall ([#2225](https://github.com/GetStream/stream-video-js/issues/2225)) ([68cf5f0](https://github.com/GetStream/stream-video-js/commit/68cf5f05bdd1b2ecb2b14814f4702c14d84dea13))
- `@stream-io/video-react-bindings` updated to version `1.16.0`

### Features

- Automatic audio recovery ([#2240](https://github.com/GetStream/stream-video-js/issues/2240)) ([8131e5b](https://github.com/GetStream/stream-video-js/commit/8131e5b35a1c87c46d99eeaab434f8889ba5d126))

## [1.36.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.36.0...@stream-io/video-react-sdk-1.36.1) (2026-05-08)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.49.0`
  - **Features**
    - **client:** bound SFU reconnection attempts and harden ICE recovery ([#2221](https://github.com/GetStream/stream-video-js/issues/2221)) ([bf837b1](https://github.com/GetStream/stream-video-js/commit/bf837b1bbabe5ff4a9a183b5581ef7963ed6cde0))
  - **Bug Fixes**
    - **client:** capture sessionId before await in updateLocalStreamState ([#2229](https://github.com/GetStream/stream-video-js/issues/2229)) ([e48ec08](https://github.com/GetStream/stream-video-js/commit/e48ec0848651ff461a18f379283edce2359ce65a))
    - **client:** prevent screen share audio loopback by default ([#2226](https://github.com/GetStream/stream-video-js/issues/2226)) ([6877fb5](https://github.com/GetStream/stream-video-js/commit/6877fb51c168cfcc1b908dfde3c088f1af4b5c27))
    - **client:** stale local publishedTracks after mute and SFU reconnect ([#2230](https://github.com/GetStream/stream-video-js/issues/2230)) ([728147a](https://github.com/GetStream/stream-video-js/commit/728147aab154247e178d4414dd8095285844f5e1))
    - **screenshare:** disable echoCancellation by default for screen share audio ([dfc95b1](https://github.com/GetStream/stream-video-js/commit/dfc95b19ca6b723573e1c5970a3ccd6048653480))
- `@stream-io/video-react-bindings` updated to version `1.15.1`

### Bug Fixes

- **react:** Improve background filter degradation detection ([#2210](https://github.com/GetStream/stream-video-js/issues/2210)) ([391915e](https://github.com/GetStream/stream-video-js/commit/391915e1e025ce3eaf5ebe7b135f57463ead8e42))

## [1.36.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.35.2...@stream-io/video-react-sdk-1.36.0) (2026-04-28)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.48.0`
  - **rn:** remove peer connection usage in speech detection ([#2200](https://github.com/GetStream/stream-video-js/issues/2200)) ([1c73d10](https://github.com/GetStream/stream-video-js/commit/1c73d10cc25761c08a8f9350e44137afaee33acf))
- `@stream-io/video-react-bindings` updated to version `1.15.0`

### Features

- audio connecting hook in bindings and RN UI ([#2214](https://github.com/GetStream/stream-video-js/issues/2214)) ([44c38fa](https://github.com/GetStream/stream-video-js/commit/44c38faaccb5327f6cd5cd6e70781bad93deafaf))

### Bug Fixes

- **egress-composite:** adjust PaginatedGrid sizing ([#1966](https://github.com/GetStream/stream-video-js/issues/1966)) ([9c7009f](https://github.com/GetStream/stream-video-js/commit/9c7009f26d63ef4fcbc8441746e5cd3c2b1935b6))

## [1.35.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.35.1...@stream-io/video-react-sdk-1.35.2) (2026-04-15)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.47.0`
  - **Features**
    - **client:** JoinCall with hints for high scale livestream ([#2199](https://github.com/GetStream/stream-video-js/issues/2199)) ([704681a](https://github.com/GetStream/stream-video-js/commit/704681ad9ce7a0013325b6db91644e1907d0db0b))
  - **Bug Fixes**
    - **client:** align device preference persistence with permission and track end events ([#2196](https://github.com/GetStream/stream-video-js/issues/2196)) ([b4ed7c2](https://github.com/GetStream/stream-video-js/commit/b4ed7c2c6bc6fb6777a411b69747ccc36aa82f44))
- `@stream-io/video-react-bindings` updated to version `1.14.2`

### Bug Fixes

- **pronto:** use list visualType for device selection mobile devices ([#2202](https://github.com/GetStream/stream-video-js/issues/2202)) ([f6b6cd2](https://github.com/GetStream/stream-video-js/commit/f6b6cd2eeef3e776167cae515cc7beb2d566ccde))

## [1.35.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.35.0...@stream-io/video-react-sdk-1.35.1) (2026-04-09)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.46.1`
  - **Bug Fixes**
    - ignore late ICE candidates after cleanup for RN speech detector ([#2193](https://github.com/GetStream/stream-video-js/issues/2193)) ([f8735d6](https://github.com/GetStream/stream-video-js/commit/f8735d604d86fc476b9b7e01eed0af03176625be))
  - **Other**
    - remove listeners and stop even on permission error - rn speech detector ([f4fdd9e](https://github.com/GetStream/stream-video-js/commit/f4fdd9e1a008b52011ef18562152aad60a1f7936))
- `@stream-io/video-react-bindings` updated to version `1.14.1`

## [1.35.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.34.2...@stream-io/video-react-sdk-1.35.0) (2026-04-09)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.13.0`
- `@stream-io/video-client` updated to version `1.46.0`
  - **Features**
    - callkit/telecom integration ([#2028](https://github.com/GetStream/stream-video-js/issues/2028)) ([d579acd](https://github.com/GetStream/stream-video-js/commit/d579acd1975fb4945e40452b27e372694c737628))
    - **client:** expose blocked autoplay audio state and explicit resume API ([#2187](https://github.com/GetStream/stream-video-js/issues/2187)) ([adbec63](https://github.com/GetStream/stream-video-js/commit/adbec63a23d47cf7c1002897e242c3f2a6a7007c))
  - **Bug Fixes**
    - **client:** deduplicate mic.capture_report trace emissions ([#2189](https://github.com/GetStream/stream-video-js/issues/2189)) ([152ae90](https://github.com/GetStream/stream-video-js/commit/152ae907910616e79bc20321bc56df4cfe0dcc4a))
    - **client:** support server-side pinning on participant join ([#2190](https://github.com/GetStream/stream-video-js/issues/2190)) ([2c354a4](https://github.com/GetStream/stream-video-js/commit/2c354a4b05f688766663bd13e0da7da601c8971d))
- `@stream-io/video-filters-web` updated to version `0.7.4`
  - **video-filters-web:** propagate background image load errors to prevent black frames ([#2188](https://github.com/GetStream/stream-video-js/issues/2188)) ([5dd6a4b](https://github.com/GetStream/stream-video-js/commit/5dd6a4b5768f39df411999dd64968c86c33c4967))
- `@stream-io/video-react-bindings` updated to version `1.14.0`

### Features

- **react-sdk:** Device preview and level indicators to device settings ([#2186](https://github.com/GetStream/stream-video-js/issues/2186)) ([65787d2](https://github.com/GetStream/stream-video-js/commit/65787d222d01f784766e0a7eb757cb3169e08435))

## [1.34.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.34.1...@stream-io/video-react-sdk-1.34.2) (2026-04-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.45.0`
  - **Features**
    - **client:** Disconnected device event ([#2178](https://github.com/GetStream/stream-video-js/issues/2178)) ([5017ca0](https://github.com/GetStream/stream-video-js/commit/5017ca0fd53f5d203167d55227cb7fddc055705a))
  - **Bug Fixes**
    - **client:** warn about dangling audio bindings only for published audio tracks ([#2183](https://github.com/GetStream/stream-video-js/issues/2183)) ([ff47662](https://github.com/GetStream/stream-video-js/commit/ff47662484cd666cf321b61d9b49dd4eb161192f))
- `@stream-io/video-react-bindings` updated to version `1.13.15`

### Bug Fixes

- **pins:** render the "pin" indicator regardless of "unpin" capabilities ([#2179](https://github.com/GetStream/stream-video-js/issues/2179)) ([f78cf41](https://github.com/GetStream/stream-video-js/commit/f78cf4115f7fb3f3eb799ac406c3f56cc691c942))

## [1.34.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.34.0...@stream-io/video-react-sdk-1.34.1) (2026-03-27)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.44.5`
  - make WebAudio opt-in, add AudioBindingsWatchdog ([#2171](https://github.com/GetStream/stream-video-js/issues/2171)) ([8d00f48](https://github.com/GetStream/stream-video-js/commit/8d00f485a37fec23dca340d32738a3cb1f7f325a))
- `@stream-io/video-filters-web` updated to version `0.7.3`
- `@stream-io/video-react-bindings` updated to version `1.13.14`

### Bug Fixes

- **react:** expose segmentation smoothing options and add model picker in video effects settings ([#2176](https://github.com/GetStream/stream-video-js/issues/2176)) ([edee6bf](https://github.com/GetStream/stream-video-js/commit/edee6bf8d9aacdfb2ae49fb202ba7f7d1140063f))
- **react:** reset recording toggle state and expose record button errors ([#2174](https://github.com/GetStream/stream-video-js/issues/2174)) ([2af6347](https://github.com/GetStream/stream-video-js/commit/2af63478ad9050bf339212537a6cb424f97387b8))

## [1.34.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.33.4...@stream-io/video-react-sdk-1.34.0) (2026-03-20)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.12.0`
- `@stream-io/video-client` updated to version `1.44.4`
  - trace device permission state transitions ([#2168](https://github.com/GetStream/stream-video-js/issues/2168)) ([e4203a3](https://github.com/GetStream/stream-video-js/commit/e4203a34cad1c90d1bc5612fc379dd1f0f0ebe5d))
- `@stream-io/video-react-bindings` updated to version `1.13.13`

### Features

- **react:** display loading indicator while participant audio is connecting ([#2167](https://github.com/GetStream/stream-video-js/issues/2167)) ([bb2e273](https://github.com/GetStream/stream-video-js/commit/bb2e2733a3e88fd60220118f267d74d952f16ed8))

### Bug Fixes

- **react:** remove default broken microphone notification from call controls ([#2158](https://github.com/GetStream/stream-video-js/issues/2158)) ([4a95b9c](https://github.com/GetStream/stream-video-js/commit/4a95b9c29e9d2728ae7eea764f07ec8507aa0f5a))

## [1.33.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.33.3...@stream-io/video-react-sdk-1.33.4) (2026-03-09)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.7.3`

### Bug Fixes

- **react:** await initialization before enabling / disabling noise cancellation ([#2153](https://github.com/GetStream/stream-video-js/issues/2153)) ([3455a0e](https://github.com/GetStream/stream-video-js/commit/3455a0e597245af6c34332424b4b7029abf7c675))

## [1.33.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.33.2...@stream-io/video-react-sdk-1.33.3) (2026-03-06)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.44.3`
  - **client:** prevent concurrent SFU updateSubscriptions during reconnects ([#2155](https://github.com/GetStream/stream-video-js/issues/2155)) ([1ac32d2](https://github.com/GetStream/stream-video-js/commit/1ac32d261c9a54aa8e3636a60e3c8f3e1407ae16))
- `@stream-io/video-react-bindings` updated to version `1.13.12`

## [1.33.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.33.1...@stream-io/video-react-sdk-1.33.2) (2026-03-06)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.44.2`
  - do not setup speaker early for ringing type calls ([#2154](https://github.com/GetStream/stream-video-js/issues/2154)) ([57adb90](https://github.com/GetStream/stream-video-js/commit/57adb90f03cfaceb4e6d3c050feaea239b80b1d9))
- `@stream-io/video-react-bindings` updated to version `1.13.11`

## [1.33.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.33.0...@stream-io/video-react-sdk-1.33.1) (2026-03-04)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.44.1`
  - **client:** handle SFU tag changes during reconnect ([#2149](https://github.com/GetStream/stream-video-js/issues/2149)) ([5aa89d3](https://github.com/GetStream/stream-video-js/commit/5aa89d378a73d33d8e46a6eb40e688bd0f50cca9)), closes [#2121](https://github.com/GetStream/stream-video-js/issues/2121)
- `@stream-io/video-react-bindings` updated to version `1.13.10`

## [1.33.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.32.4...@stream-io/video-react-sdk-1.33.0) (2026-02-27)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.11.0`
- `@stream-io/video-client` updated to version `1.44.0`
  - **Bug Fixes**
    - allow anonymous StreamVideoClientOptions to accept token fields ([#2142](https://github.com/GetStream/stream-video-js/issues/2142)) ([165a9c3](https://github.com/GetStream/stream-video-js/commit/165a9c305dda6cae0fde78c446825a7da11f302c)), closes [#2138](https://github.com/GetStream/stream-video-js/issues/2138)
    - Allow guest and anonymous users without auth options ([#2140](https://github.com/GetStream/stream-video-js/issues/2140)) ([12749ae](https://github.com/GetStream/stream-video-js/commit/12749ae2552a2b8c0442cb8beaa34e13f66cc7e6)), closes [#2138](https://github.com/GetStream/stream-video-js/issues/2138)
    - Strengthen StreamVideoClientOptions types and align React sample apps ([#2138](https://github.com/GetStream/stream-video-js/issues/2138)) ([915f990](https://github.com/GetStream/stream-video-js/commit/915f9904e045f61593c7328f790cd54516c80213))
  - **Other**
    - update agent instructions [skip ci] ([9cec4c6](https://github.com/GetStream/stream-video-js/commit/9cec4c6431ff51549fcfc870a0df935b0b8aa850))
- `@stream-io/video-react-bindings` updated to version `1.13.9`

### Features

- **react:** Deprecate usePersistedDevicePreferences and move the logic to the SDK core ([#2108](https://github.com/GetStream/stream-video-js/issues/2108)) ([7bbbd93](https://github.com/GetStream/stream-video-js/commit/7bbbd93bdd93dd4ebed02c089b6a4ab8423135fd))
- **react:** Embeddable/pre-built video components ([#2117](https://github.com/GetStream/stream-video-js/issues/2117)) ([11b4b9f](https://github.com/GetStream/stream-video-js/commit/11b4b9f0438877a5917c95117474cedc1f693907))

## [1.32.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.32.3...@stream-io/video-react-sdk-1.32.4) (2026-02-20)

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

## [1.32.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.32.2...@stream-io/video-react-sdk-1.32.3) (2026-02-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.42.3`
- `@stream-io/video-react-bindings` updated to version `1.13.7`

### Bug Fixes

- guard from parallel accept/reject invocations ([#2127](https://github.com/GetStream/stream-video-js/issues/2127)) ([621218f](https://github.com/GetStream/stream-video-js/commit/621218f4ab6b4623370fd66f1b02b8cb7cb1baad))

## [1.32.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.32.1...@stream-io/video-react-sdk-1.32.2) (2026-02-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.42.2`
  - improve the handling of join errors and prevent cross-socket event leaking ([#2121](https://github.com/GetStream/stream-video-js/issues/2121)) ([72d0834](https://github.com/GetStream/stream-video-js/commit/72d08343243990f14f29103734eea6f7cb6092c9))
- `@stream-io/video-react-bindings` updated to version `1.13.6`

## [1.32.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.32.0...@stream-io/video-react-sdk-1.32.1) (2026-02-10)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.42.1`
  - respect device permissions when detecting speech while muted ([#2115](https://github.com/GetStream/stream-video-js/issues/2115)) ([fe98768](https://github.com/GetStream/stream-video-js/commit/fe98768a9bf695fc5355905939884594c11ac2b9)), closes [#2110](https://github.com/GetStream/stream-video-js/issues/2110)
- `@stream-io/video-react-bindings` updated to version `1.13.5`

## [1.32.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.31.8...@stream-io/video-react-sdk-1.32.0) (2026-02-06)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.42.0`
  - **react:** apply defaultConstraints to speaking-while-muted detection stream ([#2103](https://github.com/GetStream/stream-video-js/issues/2103)) ([28b5538](https://github.com/GetStream/stream-video-js/commit/28b55380778723fc308d37396c8095a5a3ef7aa2))
  - start speaking while muted detection in pristine state too ([#2110](https://github.com/GetStream/stream-video-js/issues/2110)) ([bc093bc](https://github.com/GetStream/stream-video-js/commit/bc093bc3ac2451541524b134a9044131a69964af))
- `@stream-io/video-react-bindings` updated to version `1.13.4`

### Features

- Detectors for broken microphone setup ([#2090](https://github.com/GetStream/stream-video-js/issues/2090)) ([552b3f4](https://github.com/GetStream/stream-video-js/commit/552b3f4e3c54e0b6fa67221cd510f4ea1f6f8a61))

### Bug Fixes

- **react:** hide livestream layout fullscreen button when fullscreen is unsupported ([#2112](https://github.com/GetStream/stream-video-js/issues/2112)) ([f436b01](https://github.com/GetStream/stream-video-js/commit/f436b01f28416d2974c278f4059495fea555f305))

## [1.31.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.31.7...@stream-io/video-react-sdk-1.31.8) (2026-01-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.41.3`
  - **stats:** adjust send stats frequency and include "leave reason" ([#2104](https://github.com/GetStream/stream-video-js/issues/2104)) ([0182832](https://github.com/GetStream/stream-video-js/commit/018283299bebe5d5078d4006ec86b6cd56884e77))
- `@stream-io/video-filters-web` updated to version `0.7.2`
- `@stream-io/video-react-bindings` updated to version `1.13.3`

### Bug Fixes

- **react:** improve logic for calculating the lower / upper threshold for video filter degradation ([#2094](https://github.com/GetStream/stream-video-js/issues/2094)) ([5cd2d5c](https://github.com/GetStream/stream-video-js/commit/5cd2d5cb34fc7bbdfaf9529eb9f8d33a40346cab))

## [1.31.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.31.6...@stream-io/video-react-sdk-1.31.7) (2026-01-28)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.41.2`
  - deduplicate RN compatibility assertions ([#2101](https://github.com/GetStream/stream-video-js/issues/2101)) ([5b9e6bc](https://github.com/GetStream/stream-video-js/commit/5b9e6bc227c55b067eea6345315bca015c8a7ee4))
- `@stream-io/video-react-bindings` updated to version `1.13.2`

### Bug Fixes

- **react:** normalize participant names for accent-insensitive matching ([#2102](https://github.com/GetStream/stream-video-js/issues/2102)) ([723c486](https://github.com/GetStream/stream-video-js/commit/723c48681ace8dd37804fe3f35974cf62043b7f8))

## [1.31.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.31.5...@stream-io/video-react-sdk-1.31.6) (2026-01-27)

### Dependency Updates

- `@stream-io/video-filters-web` updated to version `0.7.1`
  - **react:** switch selfie segmentation default to landscape model ([#2100](https://github.com/GetStream/stream-video-js/issues/2100)) ([7c5d74d](https://github.com/GetStream/stream-video-js/commit/7c5d74d79ba1eb2f5a04a60a953ea0bd46633f4a))

## [1.31.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.31.4...@stream-io/video-react-sdk-1.31.5) (2026-01-26)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.7.2`
- `@stream-io/video-client` updated to version `1.41.1`
  - **safari:** Handle interrupted AudioContext and AudioSession states ([#2098](https://github.com/GetStream/stream-video-js/issues/2098)) ([975901f](https://github.com/GetStream/stream-video-js/commit/975901f399b46479928ec1e9f32da7e47bba9ad3))
  - use multiple settings to determine default audio device RN-338 ([#2096](https://github.com/GetStream/stream-video-js/issues/2096)) ([19cf136](https://github.com/GetStream/stream-video-js/commit/19cf13651112b647903587a84a70a555fc68fc9c)), closes [2BSettingsPriority.swift#L19](https://github.com/GetStream/2BSettingsPriority.swift/issues/L19)
- `@stream-io/video-react-bindings` updated to version `1.13.1`

### Bug Fixes

- **react:** reorganize jitter & bitrate statistics cards ([#2091](https://github.com/GetStream/stream-video-js/issues/2091)) ([599701f](https://github.com/GetStream/stream-video-js/commit/599701fa94c3fd3bc0f9bc08faca1ddfa828d51f))

## [1.31.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.31.3...@stream-io/video-react-sdk-1.31.4) (2026-01-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.41.0`
  - **Features**
    - **recording:** Support for Individual, Raw and Composite recording ([#2071](https://github.com/GetStream/stream-video-js/issues/2071)) ([e53269c](https://github.com/GetStream/stream-video-js/commit/e53269ce697121b70dbebaf4a6d2cf875440a2af))
    - stereo audio output support RN-332 ([#2038](https://github.com/GetStream/stream-video-js/issues/2038)) ([2938037](https://github.com/GetStream/stream-video-js/commit/2938037d18e70ccf112a089eb3ec44cb034aed1d))
  - **Bug Fixes**
    - add start bitrate even if there is no existing fmtp line ([#2088](https://github.com/GetStream/stream-video-js/issues/2088)) ([ae1f496](https://github.com/GetStream/stream-video-js/commit/ae1f4965a7ab0b00dbdea45090c6aed49eafabb7))
- `@stream-io/video-react-bindings` updated to version `1.13.0`

## [1.31.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.31.2...@stream-io/video-react-sdk-1.31.3) (2026-01-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.40.3`
  - **react:** resolve call state race condition when using join with ring ([#2086](https://github.com/GetStream/stream-video-js/issues/2086)) ([6c2d3b3](https://github.com/GetStream/stream-video-js/commit/6c2d3b35ac96dbf7a85cadba47068a0e417d65be)), closes [#1755](https://github.com/GetStream/stream-video-js/issues/1755) [#2035](https://github.com/GetStream/stream-video-js/issues/2035)
  - **react:** resolve call state race condition when using join with ring ([#2084](https://github.com/GetStream/stream-video-js/issues/2084)) ([f9b5946](https://github.com/GetStream/stream-video-js/commit/f9b59465f22b35304dbd01601e3f6166e1d02ea0)), closes [#1755](https://github.com/GetStream/stream-video-js/issues/1755) [#2035](https://github.com/GetStream/stream-video-js/issues/2035)
- `@stream-io/video-react-bindings` updated to version `1.12.10`

## [1.31.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.31.1...@stream-io/video-react-sdk-1.31.2) (2026-01-15)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.40.2`
  - handle unrecoverable SFU join errors ([9b8198d](https://github.com/GetStream/stream-video-js/commit/9b8198d00e901a8eade169495a14d25c8d3bdf1e))
  - handle unrecoverable SFU join errors ([#2083](https://github.com/GetStream/stream-video-js/issues/2083)) ([6ffb576](https://github.com/GetStream/stream-video-js/commit/6ffb5761b3dfb8e649cfa4f16dd30d294475eeae))
- `@stream-io/video-react-bindings` updated to version `1.12.9`

## [1.31.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.31.0...@stream-io/video-react-sdk-1.31.1) (2026-01-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.40.1`
- `@stream-io/video-react-bindings` updated to version `1.12.8`

### Bug Fixes

- ensure proper set up of server-side preferences for mic and camera ([#2080](https://github.com/GetStream/stream-video-js/issues/2080)) ([3529c8f](https://github.com/GetStream/stream-video-js/commit/3529c8fc0233d3f9f8f21c80cffc4ec27334954f))

## [1.31.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.30.1...@stream-io/video-react-sdk-1.31.0) (2026-01-09)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.10.0`
- `@stream-io/video-client` updated to version `1.40.0`
  - Call Stats Map ([#2025](https://github.com/GetStream/stream-video-js/issues/2025)) ([6c784f0](https://github.com/GetStream/stream-video-js/commit/6c784f0acacce3d23d0f589ff423d6a0d04c1e95))
- `@stream-io/video-react-bindings` updated to version `1.12.7`

### Features

- **react:** Add Grid View During PIP ([#2076](https://github.com/GetStream/stream-video-js/issues/2076)) ([be82657](https://github.com/GetStream/stream-video-js/commit/be826575eee9f16c971f907383fff49b31b1384b))

### Bug Fixes

- **react:** React Compiler strips memoization and causes MenuPortal to re-mount ([#2077](https://github.com/GetStream/stream-video-js/issues/2077)) ([9ea702f](https://github.com/GetStream/stream-video-js/commit/9ea702f3a4280e2782f07c54fcb16077094a187b))

## [1.30.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.30.0...@stream-io/video-react-sdk-1.30.1) (2025-12-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.39.3`
  - adjusted shouldRejectCall implementation ([#2072](https://github.com/GetStream/stream-video-js/issues/2072)) ([2107e3d](https://github.com/GetStream/stream-video-js/commit/2107e3db65309664a7797cacae054aeb7a371f4a))
  - **rpc:** Reliable SFU request timeouts ([#2066](https://github.com/GetStream/stream-video-js/issues/2066)) ([f842b74](https://github.com/GetStream/stream-video-js/commit/f842b74109af02c8454f5ff4f6618baac650ed4e))
- `@stream-io/video-react-bindings` updated to version `1.12.6`

## [1.30.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.29.2...@stream-io/video-react-sdk-1.30.0) (2025-12-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.39.2`
  - **Bug Fixes**
    - **safari:** verify that AudioContext supports `setSinkId` ([#2069](https://github.com/GetStream/stream-video-js/issues/2069)) ([e7fbe10](https://github.com/GetStream/stream-video-js/commit/e7fbe10d06acce52a2e3f4f7d008882fa23e9c89))
    - slow rampup on vp9/h264 codec ([#2056](https://github.com/GetStream/stream-video-js/issues/2056)) ([b5ad360](https://github.com/GetStream/stream-video-js/commit/b5ad360eab83a139198d05b4f42b777315135ab6))
  - **Other**
    - upgrade stream dependencies ([#2065](https://github.com/GetStream/stream-video-js/issues/2065)) ([04ca858](https://github.com/GetStream/stream-video-js/commit/04ca858517072f861c1ddae0876f0b425ca658e2))
- `@stream-io/video-filters-web` updated to version `0.7.0`
- `@stream-io/video-react-bindings` updated to version `1.12.5`

### Features

- **react:** Implement progress bar when video-filters are being loaded ([#2063](https://github.com/GetStream/stream-video-js/issues/2063)) ([3a6b92e](https://github.com/GetStream/stream-video-js/commit/3a6b92e092805160cbf0e289d70fcccafcb20199))

## [1.29.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.29.1...@stream-io/video-react-sdk-1.29.2) (2025-12-18)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.7.1`

## [1.29.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.29.0...@stream-io/video-react-sdk-1.29.1) (2025-12-18)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.9.1`
- `@stream-io/video-client` updated to version `1.39.1`
  - **provenance:** add repository info to every package ([4159633](https://github.com/GetStream/stream-video-js/commit/4159633b908afe6542b4be53151da6218175426c))
- `@stream-io/video-react-bindings` updated to version `1.12.4`

## [1.29.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.28.2...@stream-io/video-react-sdk-1.29.0) (2025-12-18)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.7.0`
- `@stream-io/video-client` updated to version `1.39.0`
  - **Features**
    - **react:** Retryable call watching ([#2046](https://github.com/GetStream/stream-video-js/issues/2046)) ([7205011](https://github.com/GetStream/stream-video-js/commit/7205011a451995585848b89388c91ae9a1b0bc64))
  - **Bug Fixes**
    - add response tracing for the SetPublisher RPC ([#2055](https://github.com/GetStream/stream-video-js/issues/2055)) ([a25d9a8](https://github.com/GetStream/stream-video-js/commit/a25d9a89870db47be046f31c85888995e43d44cd))
- `@stream-io/video-react-bindings` updated to version `1.12.3`

### Features

- **react:** Drag scroll on the participants list in the default layouts ([#2042](https://github.com/GetStream/stream-video-js/issues/2042)) ([b0f3f37](https://github.com/GetStream/stream-video-js/commit/b0f3f37ef45967625dca81af04ee5eb44df9d485))

## [1.28.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.28.1...@stream-io/video-react-sdk-1.28.2) (2025-12-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.38.2`
  - revert usage of useSyncExternalStore ([#2043](https://github.com/GetStream/stream-video-js/issues/2043)) ([849e896](https://github.com/GetStream/stream-video-js/commit/849e8964ac90d5785a6d608443f80156d1081744)), closes [#1953](https://github.com/GetStream/stream-video-js/issues/1953) [#2034](https://github.com/GetStream/stream-video-js/issues/2034) [#2006](https://github.com/GetStream/stream-video-js/issues/2006) [#2008](https://github.com/GetStream/stream-video-js/issues/2008)
- `@stream-io/video-react-bindings` updated to version `1.12.2`

### Bug Fixes

- **perf:** Chunk and lazy load BackgroundFiltersProvider ([#2040](https://github.com/GetStream/stream-video-js/issues/2040)) ([21164f1](https://github.com/GetStream/stream-video-js/commit/21164f156ca6426baefcf1207d7d6cbfa69fc74a)), closes [#1977](https://github.com/GetStream/stream-video-js/issues/1977)

## [1.28.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.28.0...@stream-io/video-react-sdk-1.28.1) (2025-12-08)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.38.1`
  - added call state update for handling case when call.ring event as not triggered ([#2035](https://github.com/GetStream/stream-video-js/issues/2035)) ([3c79665](https://github.com/GetStream/stream-video-js/commit/3c79665323ad5172d3af35e9ee2f86655ac11670))
  - **state:** ensure stable empty array for participant predicates ([#2036](https://github.com/GetStream/stream-video-js/issues/2036)) ([1aa72c8](https://github.com/GetStream/stream-video-js/commit/1aa72c8daf482bd157866960b4b9a92e272ac90b)), closes [#2034](https://github.com/GetStream/stream-video-js/issues/2034) [#2008](https://github.com/GetStream/stream-video-js/issues/2008)
- `@stream-io/video-react-bindings` updated to version `1.12.1`

## [1.28.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.27.2...@stream-io/video-react-sdk-1.28.0) (2025-12-08)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.9.0`
- `@stream-io/video-client` updated to version `1.38.0`
- `@stream-io/video-filters-web` updated to version `0.6.0`
  - **react:** Prevent frame exhaustion in fallback MediaStreamTrackProcessor ([#2019](https://github.com/GetStream/stream-video-js/issues/2019)) ([b06e130](https://github.com/GetStream/stream-video-js/commit/b06e1301c2d5a8bdcb2a75389b4b39fafec6c7b2))
- `@stream-io/video-react-bindings` updated to version `1.12.0`

### Features

- **LivestreamLayout:** Enrich with mute option and humanized participant count ([#2027](https://github.com/GetStream/stream-video-js/issues/2027)) ([cdc0c4f](https://github.com/GetStream/stream-video-js/commit/cdc0c4f985ab15a6c2e184b73432911510b43f99))
- **react:** Extend the statistics report with audio stats ([#2020](https://github.com/GetStream/stream-video-js/issues/2020)) ([0f4df3c](https://github.com/GetStream/stream-video-js/commit/0f4df3ce5f3b865c8ef09766dd72bc33f65539f3))
- **react:** Video Call moderation for React SDK ([#2007](https://github.com/GetStream/stream-video-js/issues/2007)) ([e242d35](https://github.com/GetStream/stream-video-js/commit/e242d35cc619d1ad0fc55d01944e97269af60cdf))

## [1.27.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.27.1...@stream-io/video-react-sdk-1.27.2) (2025-11-25)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.6.1`
- `@stream-io/video-client` updated to version `1.37.3`
  - instructions for Claude and other coding agents ([#2012](https://github.com/GetStream/stream-video-js/issues/2012)) ([08a3459](https://github.com/GetStream/stream-video-js/commit/08a345954f7cb5b1fae5a4b39b5b585bf1f631ec))
- `@stream-io/video-filters-web` updated to version `0.5.1`
  - **react:** Fix InvalidStateException when track is stopped ([#2015](https://github.com/GetStream/stream-video-js/issues/2015)) ([d3c0331](https://github.com/GetStream/stream-video-js/commit/d3c0331803e5a512a93bd972883f27ac81689c61))
- `@stream-io/video-react-bindings` updated to version `1.11.4`

- instructions for Claude and other coding agents ([#2012](https://github.com/GetStream/stream-video-js/issues/2012)) ([08a3459](https://github.com/GetStream/stream-video-js/commit/08a345954f7cb5b1fae5a4b39b5b585bf1f631ec))

### Bug Fixes

- **noise cancellation:** delay toggling until initialization is finished ([#2014](https://github.com/GetStream/stream-video-js/issues/2014)) ([d28b8ea](https://github.com/GetStream/stream-video-js/commit/d28b8ea282322a25688ff48966b0dc10dd7e60bd))

## [1.27.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.27.0...@stream-io/video-react-sdk-1.27.1) (2025-11-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.37.2`
  - **react-bindings:** getSnapshot caching ([#2008](https://github.com/GetStream/stream-video-js/issues/2008)) ([ed0983c](https://github.com/GetStream/stream-video-js/commit/ed0983cf2d1525a2faaa0b9e9387ac448b35c8e1)), closes [#2006](https://github.com/GetStream/stream-video-js/issues/2006) [#1953](https://github.com/GetStream/stream-video-js/issues/1953)
- `@stream-io/video-react-bindings` updated to version `1.11.3`

## [1.27.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.26.1...@stream-io/video-react-sdk-1.27.0) (2025-11-17)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.8.0`
- `@stream-io/video-client` updated to version `1.37.1`
  - dynascale manager doesnt pick up updated dimensions all the time ([#2001](https://github.com/GetStream/stream-video-js/issues/2001)) ([d91e008](https://github.com/GetStream/stream-video-js/commit/d91e008f27fa2a4324f22555fbe0a59afe702bbb))
- `@stream-io/video-filters-web` updated to version `0.5.0`
- `@stream-io/video-react-bindings` updated to version `1.11.2`

- replace speaker-test sound ([3dc35a1](https://github.com/GetStream/stream-video-js/commit/3dc35a13d9eb1a17aaefe51b078a0316dc225c0e))
- update the "Test speaker" label ([e4412db](https://github.com/GetStream/stream-video-js/commit/e4412dba0e111ed16bb2b5c25d744939f6c86359))

### Features

- add SpeakerTest component ([#1998](https://github.com/GetStream/stream-video-js/issues/1998)) ([c626384](https://github.com/GetStream/stream-video-js/commit/c62638422f858782dcc3174e927d82cd0d9e9e1e))
- **react:** Improved Video Filters ([#1977](https://github.com/GetStream/stream-video-js/issues/1977)) ([f8831f1](https://github.com/GetStream/stream-video-js/commit/f8831f152a716ebf4e9656f32a8f83b707db779f))

### Bug Fixes

- Don't fallback to MediaPipe model when TF is not supported ([#1999](https://github.com/GetStream/stream-video-js/issues/1999)) ([94a5bd0](https://github.com/GetStream/stream-video-js/commit/94a5bd0154f58c44e480ff26f7aeecf60db07d4f))

## [1.26.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.26.0...@stream-io/video-react-sdk-1.26.1) (2025-11-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.37.0`
  - ring individual members ([#1755](https://github.com/GetStream/stream-video-js/issues/1755)) ([57564d6](https://github.com/GetStream/stream-video-js/commit/57564d63f21da7b95b582f74c88b24af7e77659c))
- `@stream-io/video-react-bindings` updated to version `1.11.1`

### Bug Fixes

- Allow ParticipantViewUI override in LivestreamLayout ([#1997](https://github.com/GetStream/stream-video-js/issues/1997)) ([7b7a652](https://github.com/GetStream/stream-video-js/commit/7b7a6527e482e9b099d40087a86229f53f7a128a))
- export AudioVolumeIndicator ([91d8051](https://github.com/GetStream/stream-video-js/commit/91d8051c0fbb70c6a5ad65e07e14d6e9f2f1440d))
- propagate `enableFullscreen`, hide the overlay bar when empty ([c8c8d56](https://github.com/GetStream/stream-video-js/commit/c8c8d5600803942f5975b9afc5494f5c5e10889e))

## [1.26.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.25.1...@stream-io/video-react-sdk-1.26.0) (2025-11-12)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.7.0`
- `@stream-io/video-client` updated to version `1.36.1`
  - enforce the client to publish options on SDP level ([#1976](https://github.com/GetStream/stream-video-js/issues/1976)) ([1d93f72](https://github.com/GetStream/stream-video-js/commit/1d93f72cb4395aaf9b487eb66e0c3b6a8111aca4))
- `@stream-io/video-react-bindings` updated to version `1.11.0`
  - **react-bindings:** integrate useSyncExternalStore in useObservableValue ([#1953](https://github.com/GetStream/stream-video-js/issues/1953)) ([ad4b147](https://github.com/GetStream/stream-video-js/commit/ad4b147713f40c96658ddaf70a01d7ca8e369a14))

### Features

- **react:** Microphone Audio Level Indicator ([#1993](https://github.com/GetStream/stream-video-js/issues/1993)) ([9b62d2d](https://github.com/GetStream/stream-video-js/commit/9b62d2d8d2171ae97fbedaedbe473fdb0b85444b))

## [1.25.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.25.0...@stream-io/video-react-sdk-1.25.1) (2025-11-04)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.6.1`

## [1.25.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.24.3...@stream-io/video-react-sdk-1.25.0) (2025-10-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.36.0`
- `@stream-io/video-filters-web` updated to version `0.4.0`
- `@stream-io/video-react-bindings` updated to version `1.10.4`

### Features

- Migrate logger to js-toolkit logger implementation ([#1959](https://github.com/GetStream/stream-video-js/issues/1959)) ([5a424f7](https://github.com/GetStream/stream-video-js/commit/5a424f72cec2a8cbc0bfa23147d9988ab9bfbdc1))

## [1.24.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.24.2...@stream-io/video-react-sdk-1.24.3) (2025-10-27)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.35.1`
  - **deps-dev:** bump happy-dom from 20.0.0 to 20.0.2 ([#1970](https://github.com/GetStream/stream-video-js/issues/1970)) ([702f409](https://github.com/GetStream/stream-video-js/commit/702f409b2e5529e7b8f1cfc757e2e776c75deacf)), closes [#1934](https://github.com/GetStream/stream-video-js/issues/1934) [#1932](https://github.com/GetStream/stream-video-js/issues/1932) [#0](https://github.com/GetStream/stream-video-js/issues/0) [#1934](https://github.com/GetStream/stream-video-js/issues/1934) [#0](https://github.com/GetStream/stream-video-js/issues/0) [#1932](https://github.com/GetStream/stream-video-js/issues/1932)
- `@stream-io/video-react-bindings` updated to version `1.10.3`

## [1.24.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.24.1...@stream-io/video-react-sdk-1.24.2) (2025-10-24)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.35.0`
  - Participant Stats ([#1922](https://github.com/GetStream/stream-video-js/issues/1922)) ([b96de03](https://github.com/GetStream/stream-video-js/commit/b96de03a2b96db2288a6d2d52a25d3deea9148d8))
- `@stream-io/video-react-bindings` updated to version `1.10.2`

### Bug Fixes

- accept `children` in LivestreamPlayer components ([#1968](https://github.com/GetStream/stream-video-js/issues/1968)) ([1558f06](https://github.com/GetStream/stream-video-js/commit/1558f060614581964b72e9627e82a8419fc3d570))

## [1.24.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.24.0...@stream-io/video-react-sdk-1.24.1) (2025-10-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.34.1`
  - camera toggle along with flip ([#1961](https://github.com/GetStream/stream-video-js/issues/1961)) ([2703121](https://github.com/GetStream/stream-video-js/commit/2703121d27aee7a54bdc07b99a30feea9a4e4512))
- `@stream-io/video-react-bindings` updated to version `1.10.1`

### Bug Fixes

- make it possible to filter screensharing participants ([#1965](https://github.com/GetStream/stream-video-js/issues/1965)) ([885394e](https://github.com/GetStream/stream-video-js/commit/885394e486ecdfdcf7b91a6973b7225c84975804))

## [1.24.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.23.1...@stream-io/video-react-sdk-1.24.0) (2025-10-14)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.6.0`
- `@stream-io/video-styling` updated to version `1.6.0`
- `@stream-io/video-client` updated to version `1.34.0`
  - **Features**
    - move audio route manager inside SDK ([#1840](https://github.com/GetStream/stream-video-js/issues/1840)) ([847dd30](https://github.com/GetStream/stream-video-js/commit/847dd30d6240a0780fe3d58d681554bc392f6f51)), closes [#1829](https://github.com/GetStream/stream-video-js/issues/1829)
  - **Bug Fixes**
    - flush rtc stats when reconnecting ([#1946](https://github.com/GetStream/stream-video-js/issues/1946)) ([fb1f6fc](https://github.com/GetStream/stream-video-js/commit/fb1f6fcb2837154a4fe746a6efe4f9a4830bca20))
  - **Other**
    - use fromPartial instead of suppressing ts-errors ([#1949](https://github.com/GetStream/stream-video-js/issues/1949)) ([95e5654](https://github.com/GetStream/stream-video-js/commit/95e5654e2bac5dc7c5126079795fca9951652290))
- `@stream-io/video-filters-web` updated to version `0.3.0`
- `@stream-io/video-react-bindings` updated to version `1.10.0`

- add useEffectEvent shim to bindings with react 19.2 dev dep ([#1944](https://github.com/GetStream/stream-video-js/issues/1944)) ([26ca6bd](https://github.com/GetStream/stream-video-js/commit/26ca6bd7702d4960c098104e12db18f7d8afc7ce))

### Features

- **deps:** React 19.1, React Native 0.81, NextJS 15.5, Expo 54 ([#1940](https://github.com/GetStream/stream-video-js/issues/1940)) ([30f8ce2](https://github.com/GetStream/stream-video-js/commit/30f8ce2b335189e1f77160236839bc6c6a02f634))

## [1.23.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.23.0...@stream-io/video-react-sdk-1.23.1) (2025-10-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.33.1`
  - ensure ingress participants are prioritized ([#1943](https://github.com/GetStream/stream-video-js/issues/1943)) ([a51a119](https://github.com/GetStream/stream-video-js/commit/a51a119cfb9f13736395b4afb3d3947ef994a6d9))
- `@stream-io/video-react-bindings` updated to version `1.9.1`

## [1.23.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.22.0...@stream-io/video-react-sdk-1.23.0) (2025-09-30)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.5.0`
- `@stream-io/video-client` updated to version `1.33.0`
  - **client:** server side pinning ([#1936](https://github.com/GetStream/stream-video-js/issues/1936)) ([cd33b9e](https://github.com/GetStream/stream-video-js/commit/cd33b9e4417e8fdc452b6d4a192e10183ddfa31b))
- `@stream-io/video-react-bindings` updated to version `1.9.0`

### Features

- Audio profiles and Hi-Fi stereo audio ([#1887](https://github.com/GetStream/stream-video-js/issues/1887)) ([3b60c89](https://github.com/GetStream/stream-video-js/commit/3b60c89b8c0dbc40544fe13be79c10e93bbddd3d))

## [1.22.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.21.3...@stream-io/video-react-sdk-1.22.0) (2025-09-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.32.0`
  - **Features**
    - **react-native:** reject call when busy ([#1856](https://github.com/GetStream/stream-video-js/issues/1856)) ([b60bc7c](https://github.com/GetStream/stream-video-js/commit/b60bc7cd2dc2e09d52496d7b5cb593cac4b89485))
  - **Bug Fixes**
    - restore calling state after unrecoverable join fail ([#1935](https://github.com/GetStream/stream-video-js/issues/1935)) ([8ab0168](https://github.com/GetStream/stream-video-js/commit/8ab01680d01cc47f9cf48078634358507f0c109d))
    - send unifiedSessionId in the initial join request ([#1934](https://github.com/GetStream/stream-video-js/issues/1934)) ([e6a533d](https://github.com/GetStream/stream-video-js/commit/e6a533d7e926086ac5930ebfb4648dade449d15a))
- `@stream-io/video-react-bindings` updated to version `1.8.4`

### Features

- **egress-composite:** custom actions ([#1926](https://github.com/GetStream/stream-video-js/issues/1926)) ([760a35a](https://github.com/GetStream/stream-video-js/commit/760a35a5a5b450d9cde9398f011b5efba8b44458))

### Bug Fixes

- make `mute all` label translatable ([#1930](https://github.com/GetStream/stream-video-js/issues/1930)) ([1f49368](https://github.com/GetStream/stream-video-js/commit/1f49368643ccf9a4cec643e4bd9e10ddf7635232))

## [1.21.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.21.2...@stream-io/video-react-sdk-1.21.3) (2025-09-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.31.0`
  - introduce @stream-io/worker-timers ([94c962b](https://github.com/GetStream/stream-video-js/commit/94c962b2c5f731c152771b7803a59664fa925477))
- `@stream-io/video-filters-web` updated to version `0.2.2`
- `@stream-io/video-react-bindings` updated to version `1.8.3`

### Bug Fixes

- **video-filters:** prevent background tab throttling ([#1920](https://github.com/GetStream/stream-video-js/issues/1920)) ([f93d5cc](https://github.com/GetStream/stream-video-js/commit/f93d5cc5785957c7f181fcaf689ec366df9e646b))

## [1.21.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.21.1...@stream-io/video-react-sdk-1.21.2) (2025-09-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.30.1`
  - don't apply default camera state if video is off ([#1917](https://github.com/GetStream/stream-video-js/issues/1917)) ([9cf1d75](https://github.com/GetStream/stream-video-js/commit/9cf1d752d824a0527fbb187df21d8a020590d4bb))
  - **rn:** set direction state for flip after constraints are applied ([1f03c59](https://github.com/GetStream/stream-video-js/commit/1f03c59b9b3fecc0ff1f7cb6b0eccb083b4a3475))
- `@stream-io/video-react-bindings` updated to version `1.8.2`

## [1.21.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.21.0...@stream-io/video-react-sdk-1.21.1) (2025-09-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.30.0`
  - **Features**
    - Participant Source ([#1896](https://github.com/GetStream/stream-video-js/issues/1896)) ([b1cf710](https://github.com/GetStream/stream-video-js/commit/b1cf710ac3bfda573c0379dac1e6a107d2dbabf6))
  - **Other**
    - Skip tests for StreamVideoClient coordinator API ([aabe1d0](https://github.com/GetStream/stream-video-js/commit/aabe1d0ad3e3a95698b422991729e46289ab0277))
- `@stream-io/video-react-bindings` updated to version `1.8.1`

## [1.21.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.20.2...@stream-io/video-react-sdk-1.21.0) (2025-09-09)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.29.0`
  - graceful Axios request config overrides ([#1913](https://github.com/GetStream/stream-video-js/issues/1913)) ([a124099](https://github.com/GetStream/stream-video-js/commit/a124099f984a592750d66ac440ef6c27ae7a02d9))
- `@stream-io/video-react-bindings` updated to version `1.8.0`

### Features

- opt-out from optimistic updates ([#1904](https://github.com/GetStream/stream-video-js/issues/1904)) ([45dba34](https://github.com/GetStream/stream-video-js/commit/45dba34d38dc64f456e37b593e38e420426529f5))

### Bug Fixes

- capabilities and call grants ([#1899](https://github.com/GetStream/stream-video-js/issues/1899)) ([5725dfa](https://github.com/GetStream/stream-video-js/commit/5725dfa29b1e5fdb6fe4e26825ce7b268664d2fa))
- **LivestreamLayout:** handle enter/exit fullscreen gracefully ([#1916](https://github.com/GetStream/stream-video-js/issues/1916)) ([7dd2a0b](https://github.com/GetStream/stream-video-js/commit/7dd2a0b74d9767aae8463fb665a14b944e6cb204)), closes [#1915](https://github.com/GetStream/stream-video-js/issues/1915)

## [1.20.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.20.1...@stream-io/video-react-sdk-1.20.2) (2025-09-02)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.5.1`

## [1.20.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.20.0...@stream-io/video-react-sdk-1.20.1) (2025-08-22)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.28.1`
  - handle pre ended calls on ringing push arrival ([#1897](https://github.com/GetStream/stream-video-js/issues/1897)) ([935e375](https://github.com/GetStream/stream-video-js/commit/935e3756035639c651b3ac4469321a64b8576a0e))
- `@stream-io/video-react-bindings` updated to version `1.7.16`

## [1.20.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.19.8...@stream-io/video-react-sdk-1.20.0) (2025-08-21)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.5.0`
- `@stream-io/video-client` updated to version `1.28.0`
- `@stream-io/video-react-bindings` updated to version `1.7.15`

### Features

- Kick user from a call ([#1894](https://github.com/GetStream/stream-video-js/issues/1894)) ([32e2afc](https://github.com/GetStream/stream-video-js/commit/32e2afca0ea59e3f57e1ff9d05828c1e07fbff78))

### Bug Fixes

- **CallParticipantList:** prevent search results from flickering ([#1893](https://github.com/GetStream/stream-video-js/issues/1893)) ([a8cda31](https://github.com/GetStream/stream-video-js/commit/a8cda316893efe6e541b4300baab8b12500cd0fa))

## [1.19.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.19.7...@stream-io/video-react-sdk-1.19.8) (2025-08-15)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.27.5`
  - synchronize ring events ([#1888](https://github.com/GetStream/stream-video-js/issues/1888)) ([0951e6d](https://github.com/GetStream/stream-video-js/commit/0951e6d4c825806937d6bdc548df9f186c531466))
- `@stream-io/video-react-bindings` updated to version `1.7.14`

## [1.19.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.19.6...@stream-io/video-react-sdk-1.19.7) (2025-08-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.27.4`
  - expose isSupportedBrowser() utility ([#1859](https://github.com/GetStream/stream-video-js/issues/1859)) ([f51a434](https://github.com/GetStream/stream-video-js/commit/f51a4341f57407210ab2e9ba57f41818ddbd7ed9))
- `@stream-io/video-react-bindings` updated to version `1.7.13`

### Bug Fixes

- apply the crossorigin attribute before applying src ([#1886](https://github.com/GetStream/stream-video-js/issues/1886)) ([32f82a2](https://github.com/GetStream/stream-video-js/commit/32f82a24cb494e97c1ca2dee1b45a5da80a590d7))

## [1.19.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.19.5...@stream-io/video-react-sdk-1.19.6) (2025-08-11)

### Bug Fixes

- **uPDP:** respect call type camera configuration ([#1883](https://github.com/GetStream/stream-video-js/issues/1883)) ([435a32e](https://github.com/GetStream/stream-video-js/commit/435a32eccae911708e333d55e8dd32a9e4444a69))

## [1.19.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.19.4...@stream-io/video-react-sdk-1.19.5) (2025-08-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.27.3`
  - extended telemetry data for the signal websocket ([#1881](https://github.com/GetStream/stream-video-js/issues/1881)) ([984703d](https://github.com/GetStream/stream-video-js/commit/984703dabb8c6189eaf4d6925421568f6d0fd7fc))
- `@stream-io/video-react-bindings` updated to version `1.7.12`

## [1.19.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.19.3...@stream-io/video-react-sdk-1.19.4) (2025-08-06)

### Bug Fixes

- respect call type settings when applying persisted device preferеnces ([#1879](https://github.com/GetStream/stream-video-js/issues/1879)) ([4d1352d](https://github.com/GetStream/stream-video-js/commit/4d1352d74f4bd1a6e926abc16c86f3f260942cf0))

## [1.19.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.19.2...@stream-io/video-react-sdk-1.19.3) (2025-08-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.27.2`
  - improved logging and tracing ([#1874](https://github.com/GetStream/stream-video-js/issues/1874)) ([e450ce2](https://github.com/GetStream/stream-video-js/commit/e450ce2a294d6f80480fcc709591c13d9ede79e4))
- `@stream-io/video-react-bindings` updated to version `1.7.11`

### Bug Fixes

- export the Reaction component ([#1877](https://github.com/GetStream/stream-video-js/issues/1877)) ([7b4f0ff](https://github.com/GetStream/stream-video-js/commit/7b4f0ff917758f54f4452fa7ef92e4102d302492))

## [1.19.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.19.1...@stream-io/video-react-sdk-1.19.2) (2025-08-01)

### Bug Fixes

- prevent cross-origin bg filter images from tainting canvas ([#1875](https://github.com/GetStream/stream-video-js/issues/1875)) ([c09dcee](https://github.com/GetStream/stream-video-js/commit/c09dcee19ab29a71ae8e602ed7a24d0e3bc85236))

## [1.19.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.19.0...@stream-io/video-react-sdk-1.19.1) (2025-07-25)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.4.3`
- `@stream-io/video-client` updated to version `1.27.1`
  - synchronize updateMuteState; use correct fallback dimensions ([#1867](https://github.com/GetStream/stream-video-js/issues/1867)) ([154cdda](https://github.com/GetStream/stream-video-js/commit/154cddaa4462ee03af5fdf4929ad9f4e3d4b5070))
  - trace available devices and thermal state changes ([#1866](https://github.com/GetStream/stream-video-js/issues/1866)) ([d8312b5](https://github.com/GetStream/stream-video-js/commit/d8312b5c109b14baa28ee764202d387499d0fd52))
- `@stream-io/video-react-bindings` updated to version `1.7.10`

### Bug Fixes

- improved audio and video filter tracing ([#1862](https://github.com/GetStream/stream-video-js/issues/1862)) ([701ea4b](https://github.com/GetStream/stream-video-js/commit/701ea4b3266f68072c1325b70221fdefd77137ec))

## [1.19.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.18.13...@stream-io/video-react-sdk-1.19.0) (2025-07-18)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.4.0`
- `@stream-io/video-client` updated to version `1.27.0`
  - more graceful handling of SFU join failures ([#1853](https://github.com/GetStream/stream-video-js/issues/1853)) ([f38a4b5](https://github.com/GetStream/stream-video-js/commit/f38a4b5eef62210b08424640040a88065b680707))
- `@stream-io/video-react-bindings` updated to version `1.7.9`

### Features

- Inbound Video Pause ([#1841](https://github.com/GetStream/stream-video-js/issues/1841)) ([5c7eb3a](https://github.com/GetStream/stream-video-js/commit/5c7eb3ac8b0fcfd663226d537279c8a941dedc21))

## [1.18.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.18.12...@stream-io/video-react-sdk-1.18.13) (2025-07-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.26.1`
  - force `play-and-record` audioSession on Safari ([#1855](https://github.com/GetStream/stream-video-js/issues/1855)) ([a3552a3](https://github.com/GetStream/stream-video-js/commit/a3552a3be606ac99120b6c4ce6187eaa920a02ef))
- `@stream-io/video-react-bindings` updated to version `1.7.8`

## [1.18.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.18.11...@stream-io/video-react-sdk-1.18.12) (2025-07-11)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.3.0`
- `@stream-io/video-client` updated to version `1.26.0`
  - **react-native:** speech detection ([#1850](https://github.com/GetStream/stream-video-js/issues/1850)) ([3f53e95](https://github.com/GetStream/stream-video-js/commit/3f53e95fdf0e739c809648211c52542d86df183f))
- `@stream-io/video-react-bindings` updated to version `1.7.7`

## [1.18.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.18.10...@stream-io/video-react-sdk-1.18.11) (2025-07-08)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.25.5`
  - relax SFU leaveAndClose constraints ([#1848](https://github.com/GetStream/stream-video-js/issues/1848)) ([dbf8bb0](https://github.com/GetStream/stream-video-js/commit/dbf8bb0c6f9f5358f21db3e78bd40ce01ad9bf6d)), closes [#1846](https://github.com/GetStream/stream-video-js/issues/1846)
- `@stream-io/video-react-bindings` updated to version `1.7.6`

## [1.18.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.18.9...@stream-io/video-react-sdk-1.18.10) (2025-07-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.25.4`
  - sync call state after a failed reconnect ([#1846](https://github.com/GetStream/stream-video-js/issues/1846)) ([905e5c2](https://github.com/GetStream/stream-video-js/commit/905e5c2011d3267e83b3f2a861a4175de4111cfa))
- `@stream-io/video-react-bindings` updated to version `1.7.5`

## [1.18.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.18.8...@stream-io/video-react-sdk-1.18.9) (2025-07-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.25.3`
  - bump the default test timeout ([bea27db](https://github.com/GetStream/stream-video-js/commit/bea27db1922a6f2a0899375d1a4cade1eb1291b5))
  - increase axios timeout ([d9cc4ac](https://github.com/GetStream/stream-video-js/commit/d9cc4ac69f58d12d97af0c714df564349c17c9b5))
- `@stream-io/video-react-bindings` updated to version `1.7.4`

## [1.18.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.18.7...@stream-io/video-react-sdk-1.18.8) (2025-07-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.25.2`
  - resolve `default` device id into real id ([#1839](https://github.com/GetStream/stream-video-js/issues/1839)) ([1a1037f](https://github.com/GetStream/stream-video-js/commit/1a1037f21ef2926c7da78b6461499f37742935e9))
- `@stream-io/video-react-bindings` updated to version `1.7.3`

## [1.18.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.18.6...@stream-io/video-react-sdk-1.18.7) (2025-06-30)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.2.1`
- `@stream-io/video-client` updated to version `1.25.1`
  - correctly setup and dispose device managers ([#1836](https://github.com/GetStream/stream-video-js/issues/1836)) ([92fbe6c](https://github.com/GetStream/stream-video-js/commit/92fbe6c1da3bf06847244f430652bdc9433533bf))
- `@stream-io/video-react-bindings` updated to version `1.7.2`

### Bug Fixes

- default menu for ToggleAudioPreviewButton ([#1838](https://github.com/GetStream/stream-video-js/issues/1838)) ([0d719ea](https://github.com/GetStream/stream-video-js/commit/0d719ea0035a159add47eb592bda056b8113be1f))

## [1.18.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.18.5...@stream-io/video-react-sdk-1.18.6) (2025-06-20)

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

## [1.18.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.18.4...@stream-io/video-react-sdk-1.18.5) (2025-06-12)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.24.0`
  - **Features**
    - moderation support ([#1822](https://github.com/GetStream/stream-video-js/issues/1822)) ([3948fae](https://github.com/GetStream/stream-video-js/commit/3948faeb2fa7ace8dd9c1df990f6e41e73fc0a26))
  - **Bug Fixes**
    - configurable call stats reporting interval ([#1824](https://github.com/GetStream/stream-video-js/issues/1824)) ([74f72c0](https://github.com/GetStream/stream-video-js/commit/74f72c024d0cb34ae3e0fee4bd8f061fb51e4479))
    - don't compute call stats report if no one subscribed to it ([#1825](https://github.com/GetStream/stream-video-js/issues/1825)) ([fb6a8c9](https://github.com/GetStream/stream-video-js/commit/fb6a8c9e19c80be313d73fadb68810e7f7c1f071))
- `@stream-io/video-react-bindings` updated to version `1.7.0`
  - update i18next to its latest version ([#1807](https://github.com/GetStream/stream-video-js/issues/1807)) ([c524877](https://github.com/GetStream/stream-video-js/commit/c5248777c83b2a032423b59f6505cf4b2a09a9b9))

## [1.18.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.18.3...@stream-io/video-react-sdk-1.18.4) (2025-06-04)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.23.5`
  - **react-native:** skip browser permission for react native ([#1818](https://github.com/GetStream/stream-video-js/issues/1818)) ([b18f418](https://github.com/GetStream/stream-video-js/commit/b18f418698e12b9804efb43e712ba813b0dbb056))
- `@stream-io/video-react-bindings` updated to version `1.6.8`

### Bug Fixes

- early join in LivestreamPlayer ([#1817](https://github.com/GetStream/stream-video-js/issues/1817)) ([f80e867](https://github.com/GetStream/stream-video-js/commit/f80e867a27cfca75bc3e5e244b3b08a3d894de18))
- prevent usePersistedDevicePreferences from overriding manually set status ([#1815](https://github.com/GetStream/stream-video-js/issues/1815)) ([fce2d56](https://github.com/GetStream/stream-video-js/commit/fce2d563678bfd7ef065aa150571889b84b360e8))

## [1.18.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.18.2...@stream-io/video-react-sdk-1.18.3) (2025-06-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.23.4`
  - attach original token provider error as cause to loadToken rejection ([#1812](https://github.com/GetStream/stream-video-js/issues/1812)) ([15f817c](https://github.com/GetStream/stream-video-js/commit/15f817c2548a8edba8ca1004e133277d67cbeb4f))
  - improved video quality on low capture resolution ([#1814](https://github.com/GetStream/stream-video-js/issues/1814)) ([ebcfdf7](https://github.com/GetStream/stream-video-js/commit/ebcfdf7f7e8146fcaf18a8bee81086f5a23f5df3))
- `@stream-io/video-react-bindings` updated to version `1.6.7`

## [1.18.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.18.1...@stream-io/video-react-sdk-1.18.2) (2025-06-02)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.4.2`
- `@stream-io/video-client` updated to version `1.23.3`
  - **Bug Fixes**
    - inconsistent device state if applySettingsToStream fails ([#1808](https://github.com/GetStream/stream-video-js/issues/1808)) ([73d66c2](https://github.com/GetStream/stream-video-js/commit/73d66c2eaa7eca52b9d41b39f8f9fd0a0ce240ef))
    - test ([e0b93aa](https://github.com/GetStream/stream-video-js/commit/e0b93aaa13f22f0db30b61e6230aff40ba8fd92a))
  - **Other**
    - remove TODO ([9cfea4b](https://github.com/GetStream/stream-video-js/commit/9cfea4b54284cdd680a6d666436dedc5fd8956c3))
- `@stream-io/video-react-bindings` updated to version `1.6.6`

### Bug Fixes

- use AudioContext for Safari ([#1810](https://github.com/GetStream/stream-video-js/issues/1810)) ([63542f4](https://github.com/GetStream/stream-video-js/commit/63542f419efa475c7acf50f053621ace74a1eff4))

## [1.18.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.18.0...@stream-io/video-react-sdk-1.18.1) (2025-05-26)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.4.1`

### Bug Fixes

- add audio context state tracing ([#1805](https://github.com/GetStream/stream-video-js/issues/1805)) ([0d86623](https://github.com/GetStream/stream-video-js/commit/0d8662398a2e8b5c07bf3ef5b68faf0a4003c702))

## [1.18.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.17.1...@stream-io/video-react-sdk-1.18.0) (2025-05-22)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.2.0`
- `@stream-io/video-client` updated to version `1.23.2`
  - rpc error tracing ([#1801](https://github.com/GetStream/stream-video-js/issues/1801)) ([a9e86d5](https://github.com/GetStream/stream-video-js/commit/a9e86d5e51e72b15d044e012f5fcc5a44907c325))
- `@stream-io/video-react-bindings` updated to version `1.6.5`

### Features

- add backstage mode for LivestreamPlayer ([#1796](https://github.com/GetStream/stream-video-js/issues/1796)) ([94e2863](https://github.com/GetStream/stream-video-js/commit/94e2863aa8c52542f2ecb53f71485d5d5f2e79fd))

### Bug Fixes

- sequential uPDP ([#1802](https://github.com/GetStream/stream-video-js/issues/1802)) ([f613b97](https://github.com/GetStream/stream-video-js/commit/f613b97ea03e85fd64ca5de76f4e34d1507fef27))

## [1.17.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.17.0...@stream-io/video-react-sdk-1.17.1) (2025-05-21)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.23.1`
  - restore echoCancellation settings ([#1799](https://github.com/GetStream/stream-video-js/issues/1799)) ([e839036](https://github.com/GetStream/stream-video-js/commit/e839036f279ee9b27ce3d62d4f07e3517c3e5fef)), closes [#1794](https://github.com/GetStream/stream-video-js/issues/1794)
- `@stream-io/video-react-bindings` updated to version `1.6.4`

## [1.17.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.16.2...@stream-io/video-react-sdk-1.17.0) (2025-05-20)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.4.0`
- `@stream-io/video-client` updated to version `1.23.0`
  - **Features**
    - **react-native:** Noise Cancellation ([#1793](https://github.com/GetStream/stream-video-js/issues/1793)) ([d7843e1](https://github.com/GetStream/stream-video-js/commit/d7843e1a23e6f6a35d1c159438d09bdfd17450a5))
  - **Bug Fixes**
    - do not mutate filters array during pipeline setup ([#1798](https://github.com/GetStream/stream-video-js/issues/1798)) ([e9832e5](https://github.com/GetStream/stream-video-js/commit/e9832e5ef41b3f6cddfe2d0cb2cf840e9b28bb86))
- `@stream-io/video-react-bindings` updated to version `1.6.3`

### Features

- **web:** improved noise cancellation ([#1794](https://github.com/GetStream/stream-video-js/issues/1794)) ([d59f19b](https://github.com/GetStream/stream-video-js/commit/d59f19b1ba1ff83fe5f024d783b868f4e98d3380))

## [1.16.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.16.1...@stream-io/video-react-sdk-1.16.2) (2025-05-15)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.3.1`
- `@stream-io/video-styling` updated to version `1.1.5`
- `@stream-io/video-client` updated to version `1.22.2`
  - adjust ErrorFromResponse class ([#1791](https://github.com/GetStream/stream-video-js/issues/1791)) ([c0abcba](https://github.com/GetStream/stream-video-js/commit/c0abcbacfddeb87d8378c4418f80e6770981cdc8)), closes [GetStream/chat#1540](https://github.com/GetStream/chat/issues/1540)
- `@stream-io/video-filters-web` updated to version `0.2.1`
- `@stream-io/video-react-bindings` updated to version `1.6.2`

### Bug Fixes

- enable chore releases ([#1792](https://github.com/GetStream/stream-video-js/issues/1792)) ([6046654](https://github.com/GetStream/stream-video-js/commit/6046654fe19505a1c115a4fb838759d010540614))

## [1.16.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.16.0...@stream-io/video-react-sdk-1.16.1) (2025-05-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.22.1`
  - fixes an edge case where tracks weren't restored after a reconnect ([#1789](https://github.com/GetStream/stream-video-js/issues/1789)) ([d825e8e](https://github.com/GetStream/stream-video-js/commit/d825e8e39ac8cbd072ec9d5124e1ea0226216e08))
- `@stream-io/video-react-bindings` updated to version `1.6.1`

## [1.16.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.15.0...@stream-io/video-react-sdk-1.16.0) (2025-05-08)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.3.0`
- `@stream-io/video-client` updated to version `1.22.0`
  - graceful handling of LIVE_ENDED CallEnded reason ([#1783](https://github.com/GetStream/stream-video-js/issues/1783)) ([ff54390](https://github.com/GetStream/stream-video-js/commit/ff54390099e10c550b8bbac42658080a65007a30))
  - isolate mediaDevices traces ([#1779](https://github.com/GetStream/stream-video-js/issues/1779)) ([d8623f0](https://github.com/GetStream/stream-video-js/commit/d8623f0b06a6229bff96ea01dd1f2b851b7d3558)), closes [#1765](https://github.com/GetStream/stream-video-js/issues/1765)
  - make camera.flip() work more reliably with older devices ([#1781](https://github.com/GetStream/stream-video-js/issues/1781)) ([9dfbc55](https://github.com/GetStream/stream-video-js/commit/9dfbc556155c1ae9b528b50b140313c4decb024f)), closes [#1679](https://github.com/GetStream/stream-video-js/issues/1679)
  - use scoped locking for PeerConnection events ([#1785](https://github.com/GetStream/stream-video-js/issues/1785)) ([b0f93e8](https://github.com/GetStream/stream-video-js/commit/b0f93e83e70520b527efd94e9192ac7dca031864))
- `@stream-io/video-filters-web` updated to version `0.2.0`
- `@stream-io/video-react-bindings` updated to version `1.6.0`

### Features

- Expo 53 Swift Config Plugin and React Native 0.79 compatibility ([#1714](https://github.com/GetStream/stream-video-js/issues/1714)) ([380331e](https://github.com/GetStream/stream-video-js/commit/380331e11fd6182c3111413aa25689a669dd3c9c))

## [1.15.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.14.6...@stream-io/video-react-sdk-1.15.0) (2025-05-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.21.0`
- `@stream-io/video-react-bindings` updated to version `1.5.19`

### Features

- encode and decode PerformanceStats tracing ([#1765](https://github.com/GetStream/stream-video-js/issues/1765)) ([138ea84](https://github.com/GetStream/stream-video-js/commit/138ea84fee834da03cf3c8042fbb2f071526f135))

## [1.14.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.14.5...@stream-io/video-react-sdk-1.14.6) (2025-05-01)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.20.2`
  - add options for 4K RTMP and Recording ([#1775](https://github.com/GetStream/stream-video-js/issues/1775)) ([c09213d](https://github.com/GetStream/stream-video-js/commit/c09213df5fc8a46f5a8c5c1ef18f07fd05e1d547))
  - use timeout reason when auto-dropping calls (instead of decline) ([#1776](https://github.com/GetStream/stream-video-js/issues/1776)) ([a043148](https://github.com/GetStream/stream-video-js/commit/a04314814e728c3d05d53c8940e9c223fec18fcc))
- `@stream-io/video-react-bindings` updated to version `1.5.18`

## [1.14.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.14.4...@stream-io/video-react-sdk-1.14.5) (2025-04-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.20.1`
  - dispose media stream if it cannot be published ([#1771](https://github.com/GetStream/stream-video-js/issues/1771)) ([83fbfd7](https://github.com/GetStream/stream-video-js/commit/83fbfd7bb77bd9a06d6955e6b48bb8238e573f57))
  - use more granular permission state for stats reporter ([#1774](https://github.com/GetStream/stream-video-js/issues/1774)) ([55afdfc](https://github.com/GetStream/stream-video-js/commit/55afdfcdac55fad25ba32978caf55a2f25f7580b))
- `@stream-io/video-react-bindings` updated to version `1.5.17`

## [1.14.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.14.3...@stream-io/video-react-sdk-1.14.4) (2025-04-24)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.20.0`
  - **Features**
    - add getCallReport method ([#1767](https://github.com/GetStream/stream-video-js/issues/1767)) ([12e064f](https://github.com/GetStream/stream-video-js/commit/12e064f34a08731ded289651125bbe20e2bbf4f4))
  - **Other**
    - bump test timeout ([7d922ed](https://github.com/GetStream/stream-video-js/commit/7d922ed34c46851a257fb36ee644f1ff5e4cb917))
- `@stream-io/video-react-bindings` updated to version `1.5.16`

### Bug Fixes

- apply call default camera/mic on settings ([#1766](https://github.com/GetStream/stream-video-js/issues/1766)) ([d2a2783](https://github.com/GetStream/stream-video-js/commit/d2a27838c4e6b4e4ec71821d0070f729aee9c644))

## [1.14.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.14.2...@stream-io/video-react-sdk-1.14.3) (2025-04-15)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.1.4`
- `@stream-io/video-client` updated to version `1.19.3`
  - fast reconnect shouldn't be followed up with full rejoining on network switch ([#1760](https://github.com/GetStream/stream-video-js/issues/1760)) ([71363bd](https://github.com/GetStream/stream-video-js/commit/71363bdf0fb6cd6273ff6c2a0faf9ea1eb53f121))
  - watched calls should auto-subscribe for state updates ([#1762](https://github.com/GetStream/stream-video-js/issues/1762)) ([abcb45b](https://github.com/GetStream/stream-video-js/commit/abcb45b7fed4ca10e4ac6ea8ee18630ca5a9cb46)), closes [#1433](https://github.com/GetStream/stream-video-js/issues/1433)
- `@stream-io/video-react-bindings` updated to version `1.5.15`

### Bug Fixes

- access device list lazily from call state hook ([#1761](https://github.com/GetStream/stream-video-js/issues/1761)) ([319353c](https://github.com/GetStream/stream-video-js/commit/319353caf709f6a9fa2197b2ac923b9ceecadb7c))

## [1.14.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.14.1...@stream-io/video-react-sdk-1.14.2) (2025-04-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.19.2`
  - enhance tracing data ([#1758](https://github.com/GetStream/stream-video-js/issues/1758)) ([a6f2e3a](https://github.com/GetStream/stream-video-js/commit/a6f2e3a5256519e4884ec07e2dd2d4417f2482fe))
- `@stream-io/video-react-bindings` updated to version `1.5.14`

### Bug Fixes

- participant filter for `single-participant` layout in egress app ([#1756](https://github.com/GetStream/stream-video-js/issues/1756)) ([8c0b05d](https://github.com/GetStream/stream-video-js/commit/8c0b05d89238db084c7b09415030ec072e9e974b))

## [1.14.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.14.0...@stream-io/video-react-sdk-1.14.1) (2025-04-09)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.1.3`
- `@stream-io/video-client` updated to version `1.19.1`
  - add an opt-out for persisted device preferences ([#1753](https://github.com/GetStream/stream-video-js/issues/1753)) ([4d55c3e](https://github.com/GetStream/stream-video-js/commit/4d55c3ee982bcb72beec347489e7c945bb2c63e3))
- `@stream-io/video-react-bindings` updated to version `1.5.13`

- **@stream-io/video-react-sdk:** release version 1.14.1 ([5692570](https://github.com/GetStream/stream-video-js/commit/5692570bc3ab1d2ced4517b4fac4688749aceff8))

### Bug Fixes

- allow filtering participants on hasAudio/hasVideo ([#1748](https://github.com/GetStream/stream-video-js/issues/1748)) ([0dde004](https://github.com/GetStream/stream-video-js/commit/0dde004750e5820fd34a8cc6ee48ed98d1e6926d))
- Document PiP support on Pronto ([#1746](https://github.com/GetStream/stream-video-js/issues/1746)) ([3034ab0](https://github.com/GetStream/stream-video-js/commit/3034ab0023a62258fc5fa05b7e437f02f01ae96d))

## [1.14.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.14.0...@stream-io/video-react-sdk-1.14.1) (2025-04-09)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.1.3`
- `@stream-io/video-client` updated to version `1.19.1`
  - add an opt-out for persisted device preferences ([#1753](https://github.com/GetStream/stream-video-js/issues/1753)) ([4d55c3e](https://github.com/GetStream/stream-video-js/commit/4d55c3ee982bcb72beec347489e7c945bb2c63e3))
- `@stream-io/video-react-bindings` updated to version `1.5.13`

### Bug Fixes

- allow filtering participants on hasAudio/hasVideo ([#1748](https://github.com/GetStream/stream-video-js/issues/1748)) ([0dde004](https://github.com/GetStream/stream-video-js/commit/0dde004750e5820fd34a8cc6ee48ed98d1e6926d))
- Document PiP support on Pronto ([#1746](https://github.com/GetStream/stream-video-js/issues/1746)) ([3034ab0](https://github.com/GetStream/stream-video-js/commit/3034ab0023a62258fc5fa05b7e437f02f01ae96d))

## [1.14.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.13.2...@stream-io/video-react-sdk-1.14.0) (2025-04-04)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.19.0`
- `@stream-io/video-react-bindings` updated to version `1.5.12`

### Features

- collect more granular RTC stats and RPC tracing ([#1735](https://github.com/GetStream/stream-video-js/issues/1735)) ([e356d6b](https://github.com/GetStream/stream-video-js/commit/e356d6b9fe361c186a5b92de55fabf0598ea4885))

## [1.13.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.13.1...@stream-io/video-react-sdk-1.13.2) (2025-04-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.9`
  - pick correct device for speaking while muted detection ([#1744](https://github.com/GetStream/stream-video-js/issues/1744)) ([33044f5](https://github.com/GetStream/stream-video-js/commit/33044f56ec7debba2e14d5a87dde9eaa87a02089)), closes [#1538](https://github.com/GetStream/stream-video-js/issues/1538)
  - reset the call state value when "live" ends ([#1740](https://github.com/GetStream/stream-video-js/issues/1740)) ([2123a10](https://github.com/GetStream/stream-video-js/commit/2123a104bb790a7384506fd475b779c02b116edd))
- `@stream-io/video-react-bindings` updated to version `1.5.11`

### Bug Fixes

- correctly apply muted state from persisted settings ([#1745](https://github.com/GetStream/stream-video-js/issues/1745)) ([a718de6](https://github.com/GetStream/stream-video-js/commit/a718de618acbc505c975da9c8d4ecaac722245af)), closes [#1736](https://github.com/GetStream/stream-video-js/issues/1736) [#1741](https://github.com/GetStream/stream-video-js/issues/1741)

## [1.13.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.13.0...@stream-io/video-react-sdk-1.13.1) (2025-04-01)

### Bug Fixes

- apply muted state from persisted device preferences ([#1741](https://github.com/GetStream/stream-video-js/issues/1741)) ([75e7b66](https://github.com/GetStream/stream-video-js/commit/75e7b66d9a2ae01a157b8969cab5c8ff8a43d84d)), closes [#1736](https://github.com/GetStream/stream-video-js/issues/1736)

## [1.13.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.12.11...@stream-io/video-react-sdk-1.13.0) (2025-04-01)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.8`
  - **Bug Fixes**
    - implement retry logic for call joining process ([#1738](https://github.com/GetStream/stream-video-js/issues/1738)) ([71599c3](https://github.com/GetStream/stream-video-js/commit/71599c3ddda51a247d7933cd6b12ca8fd03d7033))
  - **Other**
    - dependency upgrades and cleanup ([#1727](https://github.com/GetStream/stream-video-js/issues/1727)) ([c3b0ede](https://github.com/GetStream/stream-video-js/commit/c3b0ede3ce444c28c51457155e8ccff584c2c1e5))
- `@stream-io/video-react-bindings` updated to version `1.5.10`

- dependency upgrades and cleanup ([#1727](https://github.com/GetStream/stream-video-js/issues/1727)) ([c3b0ede](https://github.com/GetStream/stream-video-js/commit/c3b0ede3ce444c28c51457155e8ccff584c2c1e5))

### Features

- persist device label and fallback to it when device id is not found ([#1736](https://github.com/GetStream/stream-video-js/issues/1736)) ([27536f7](https://github.com/GetStream/stream-video-js/commit/27536f7a98ff7ec23bf35e9b292411ba3a9ca392))

## [1.12.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.12.10...@stream-io/video-react-sdk-1.12.11) (2025-03-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.7`
  - rename `toJSON` to `asJSON` ([#1729](https://github.com/GetStream/stream-video-js/issues/1729)) ([0d7d074](https://github.com/GetStream/stream-video-js/commit/0d7d074dac1032690b5f4af4d6ba5fcdd56dfaa2))
  - update call reject reasons ([#1730](https://github.com/GetStream/stream-video-js/issues/1730)) ([100ed6b](https://github.com/GetStream/stream-video-js/commit/100ed6b9323b66e86123917abf4fc2973a677fca))
- `@stream-io/video-react-bindings` updated to version `1.5.9`

## [1.12.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.12.9...@stream-io/video-react-sdk-1.12.10) (2025-03-19)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.1.2`

## [1.12.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.12.8...@stream-io/video-react-sdk-1.12.9) (2025-03-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.6`
  - ensure negotiation runs sequentially ([#1722](https://github.com/GetStream/stream-video-js/issues/1722)) ([7e166aa](https://github.com/GetStream/stream-video-js/commit/7e166aaf606c3f751068cf60bd554e6374f701d7))
- `@stream-io/video-react-bindings` updated to version `1.5.8`

### Bug Fixes

- expose useDeviceList ([#1723](https://github.com/GetStream/stream-video-js/issues/1723)) ([547703b](https://github.com/GetStream/stream-video-js/commit/547703b75daefbd0e34db6bd17cfc2f45d861005)), closes [#1701](https://github.com/GetStream/stream-video-js/issues/1701)

## [1.12.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.12.7...@stream-io/video-react-sdk-1.12.8) (2025-03-12)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.5`
  - Upgrade to Next 15.2 ([#1717](https://github.com/GetStream/stream-video-js/issues/1717)) ([9b1aec3](https://github.com/GetStream/stream-video-js/commit/9b1aec3447dee611c0d900db44add6b6c89e2b8d))
- `@stream-io/video-react-bindings` updated to version `1.5.7`

### Bug Fixes

- add pending browser permission state ([#1718](https://github.com/GetStream/stream-video-js/issues/1718)) ([7f24be6](https://github.com/GetStream/stream-video-js/commit/7f24be63d33105d0688be7b5b625bc9b6aa0d3a9))

## [1.12.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.12.6...@stream-io/video-react-sdk-1.12.7) (2025-03-10)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.4`
  - retryable client.connectUser() ([#1710](https://github.com/GetStream/stream-video-js/issues/1710)) ([10b6860](https://github.com/GetStream/stream-video-js/commit/10b6860e1d65c38d8eb0ba7d7ea18f0ca30f5abc))
- `@stream-io/video-react-bindings` updated to version `1.5.6`

### Bug Fixes

- disable the "Enter full screen" option on unsupported platforms ([#1715](https://github.com/GetStream/stream-video-js/issues/1715)) ([97da8d8](https://github.com/GetStream/stream-video-js/commit/97da8d8decf9d3a04d31d07a9f4259e4b712736d))

## [1.12.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.12.5...@stream-io/video-react-sdk-1.12.6) (2025-03-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.3`
  - revert the release of cloned track on publisher dispose ([556fb61](https://github.com/GetStream/stream-video-js/commit/556fb610ae1c9a1965f38fc07e995683b5052544))
- `@stream-io/video-react-bindings` updated to version `1.5.5`

## [1.12.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.12.4...@stream-io/video-react-sdk-1.12.5) (2025-03-04)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.2`
  - do not accept again on reconnections ([#1705](https://github.com/GetStream/stream-video-js/issues/1705)) ([bedd2d8](https://github.com/GetStream/stream-video-js/commit/bedd2d8aafd7ff8260f63b500e25807518ccd365))
  - do not stop original track in RN ([#1708](https://github.com/GetStream/stream-video-js/issues/1708)) ([ab0ada2](https://github.com/GetStream/stream-video-js/commit/ab0ada283c753d4cdfd59b6eaf75af26cf54fd7e))
  - prevent extra unnecessary reconnect after offline to online ([#1706](https://github.com/GetStream/stream-video-js/issues/1706)) ([bc3920a](https://github.com/GetStream/stream-video-js/commit/bc3920a81f398fd9e166ee4517b32d58f50d56fe))
- `@stream-io/video-react-bindings` updated to version `1.5.4`

## [1.12.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.12.3...@stream-io/video-react-sdk-1.12.4) (2025-02-28)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.1`
  - prevent reconnecting state when offline ([#1703](https://github.com/GetStream/stream-video-js/issues/1703)) ([aeac90d](https://github.com/GetStream/stream-video-js/commit/aeac90d8b7b14820e3e0e30282e51fc7824f8bf8))
- `@stream-io/video-react-bindings` updated to version `1.5.3`

## [1.12.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.12.2...@stream-io/video-react-sdk-1.12.3) (2025-02-27)

### Bug Fixes

- add explicit default device option to device selectors ([#1701](https://github.com/GetStream/stream-video-js/issues/1701)) ([1b8e11b](https://github.com/GetStream/stream-video-js/commit/1b8e11b65b5323d440fcb9b03a464a580bca767e))

## [1.12.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.12.1...@stream-io/video-react-sdk-1.12.2) (2025-02-26)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.18.0`
  - **Features**
    - align SDK version reporting, use higher-entropy user agent data for stats ([#1696](https://github.com/GetStream/stream-video-js/issues/1696)) ([e02e8d9](https://github.com/GetStream/stream-video-js/commit/e02e8d9b3843086a3fa859a8bd31ba65ace5a7fd))
  - **Bug Fixes**
    - don't implicitly mark calls as `ringing` ([#1697](https://github.com/GetStream/stream-video-js/issues/1697)) ([3429a7b](https://github.com/GetStream/stream-video-js/commit/3429a7ba52e13a43b96d2c3c28f270da111f84b2)), closes [/github.com/GetStream/stream-video-js/issues/1561#issuecomment-2662584543](https://github.com/GetStream//github.com/GetStream/stream-video-js/issues/1561/issues/issuecomment-2662584543)
    - use axios version that doesnt import node specific module ([#1699](https://github.com/GetStream/stream-video-js/issues/1699)) ([414e01b](https://github.com/GetStream/stream-video-js/commit/414e01b9c7e4c4862b429e48c506673bcc228fa4))
- `@stream-io/video-react-bindings` updated to version `1.5.2`

## [1.12.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.12.0...@stream-io/video-react-sdk-1.12.1) (2025-02-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.17.1`
  - do not reconnect when device is offline ([#1688](https://github.com/GetStream/stream-video-js/issues/1688)) ([c6b6f58](https://github.com/GetStream/stream-video-js/commit/c6b6f58310a3365eb6f40d76a15c26791f413241))
- `@stream-io/video-react-bindings` updated to version `1.5.1`

## [1.12.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.11.10...@stream-io/video-react-sdk-1.12.0) (2025-02-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.17.0`
- `@stream-io/video-filters-web` updated to version `0.1.7`
- `@stream-io/video-react-bindings` updated to version `1.5.0`
- `@stream-io/audio-filters-web` updated to version `0.2.3`

### Features

- support static token and token provider at the same time ([#1685](https://github.com/GetStream/stream-video-js/issues/1685)) ([4365a3d](https://github.com/GetStream/stream-video-js/commit/4365a3dd0a14c98041982bde8be21258b8cfd571))

## [1.11.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.11.9...@stream-io/video-react-sdk-1.11.10) (2025-02-12)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.16.7`
  - relax device constraints on NotFoundError DOMException ([#1680](https://github.com/GetStream/stream-video-js/issues/1680)) ([c682908](https://github.com/GetStream/stream-video-js/commit/c682908408395f6863fd1549958cf4203bcc7f32))
- `@stream-io/video-react-bindings` updated to version `1.4.15`

## [1.11.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.11.8...@stream-io/video-react-sdk-1.11.9) (2025-02-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.16.6`
  - prefer the async apply constraints for flip ([#1679](https://github.com/GetStream/stream-video-js/issues/1679)) ([8c246cc](https://github.com/GetStream/stream-video-js/commit/8c246cc4e9f1ac766366cf24b82dd99aa868017d))
- `@stream-io/video-react-bindings` updated to version `1.4.14`

## [1.11.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.11.7...@stream-io/video-react-sdk-1.11.8) (2025-02-10)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.16.5`
  - ensure all tracks are stopped when disposing a Publisher ([#1677](https://github.com/GetStream/stream-video-js/issues/1677)) ([172d345](https://github.com/GetStream/stream-video-js/commit/172d345ceada2bf82df1aec604a2325947896c5c)), closes [#1676](https://github.com/GetStream/stream-video-js/issues/1676)
- `@stream-io/video-react-bindings` updated to version `1.4.13`

## [1.11.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.11.6...@stream-io/video-react-sdk-1.11.7) (2025-02-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.16.4`
  - ensure tracks are stopped when disposing a Publisher ([#1676](https://github.com/GetStream/stream-video-js/issues/1676)) ([948f672](https://github.com/GetStream/stream-video-js/commit/948f672243e1f2a0e9499184ee31db4bc88f9952))
- `@stream-io/video-react-bindings` updated to version `1.4.12`

## [1.11.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.11.5...@stream-io/video-react-sdk-1.11.6) (2025-02-07)

### Bug Fixes

- handle LivestreamLayout muted prop ([#1674](https://github.com/GetStream/stream-video-js/issues/1674)) ([f739b56](https://github.com/GetStream/stream-video-js/commit/f739b56980a18f1fb8b9c36fbcf284996a535706))

## [1.11.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.11.4...@stream-io/video-react-sdk-1.11.5) (2025-02-06)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.16.3`
  - relaxed validation for submitting feedback ([#1673](https://github.com/GetStream/stream-video-js/issues/1673)) ([98685b9](https://github.com/GetStream/stream-video-js/commit/98685b9fcf3c3b0309a7072d51cde4657e028528))
- `@stream-io/video-react-bindings` updated to version `1.4.11`

## [1.11.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.11.3...@stream-io/video-react-sdk-1.11.4) (2025-02-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.16.2`
  - race condition with unrecoverable error handling ([#1672](https://github.com/GetStream/stream-video-js/issues/1672)) ([be8095c](https://github.com/GetStream/stream-video-js/commit/be8095ce946cf98a0dfc1f3ea3391376cc7d2896)), closes [#1649](https://github.com/GetStream/stream-video-js/issues/1649) [#1618](https://github.com/GetStream/stream-video-js/issues/1618)
- `@stream-io/video-react-bindings` updated to version `1.4.10`

## [1.11.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.11.2...@stream-io/video-react-sdk-1.11.3) (2025-02-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.16.1`
  - **Bug Fixes**
    - do not mute track on camera flip ([#1671](https://github.com/GetStream/stream-video-js/issues/1671)) ([963eb4d](https://github.com/GetStream/stream-video-js/commit/963eb4d4e5d6b96afb61b4da23a05ad92bcb3973))
  - **Other**
    - add trace log for call unregister ([e20d9dc](https://github.com/GetStream/stream-video-js/commit/e20d9dc28b35c5dd0c921ccc3e18923a344ae5ab))
- `@stream-io/video-react-bindings` updated to version `1.4.9`

## [1.11.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.11.1...@stream-io/video-react-sdk-1.11.2) (2025-01-31)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.16.0`
  - OpenAPI upgrades and HLS status reporting ([#1668](https://github.com/GetStream/stream-video-js/issues/1668)) ([2f377b8](https://github.com/GetStream/stream-video-js/commit/2f377b8772f7b9fc8fcb8b8e9b3eecb1920bc7d0))
- `@stream-io/video-react-bindings` updated to version `1.4.8`

## [1.11.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.11.0...@stream-io/video-react-sdk-1.11.1) (2025-01-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.15.7`
  - speech detection and align mic disable with web ([#1658](https://github.com/GetStream/stream-video-js/issues/1658)) ([fd908fb](https://github.com/GetStream/stream-video-js/commit/fd908fb2b70e6bade595f44107ca2f85aa4d5631))
- `@stream-io/video-react-bindings` updated to version `1.4.7`

## [1.11.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.10.6...@stream-io/video-react-sdk-1.11.0) (2025-01-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.15.6`
  - ensures that maxBitrate is an integer ([#1657](https://github.com/GetStream/stream-video-js/issues/1657)) ([69eee96](https://github.com/GetStream/stream-video-js/commit/69eee969ac4d52e3410d8e5e12e012b02a5eb1b7)), closes [#1527](https://github.com/GetStream/stream-video-js/issues/1527)
- `@stream-io/video-react-bindings` updated to version `1.4.6`

### Features

- [VID-315] allow filtering participants using filter object ([#1655](https://github.com/GetStream/stream-video-js/issues/1655)) ([8674390](https://github.com/GetStream/stream-video-js/commit/86743902725a8c23165068c3f5abf2370bc42a8d))

## [1.10.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.10.5...@stream-io/video-react-sdk-1.10.6) (2025-01-24)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.15.5`
  - remove the participants from state when leaving call ([003ac26](https://github.com/GetStream/stream-video-js/commit/003ac26eff3c14779d5f25e6e64973c88a5b811d))
- `@stream-io/video-react-bindings` updated to version `1.4.5`

## [1.10.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.10.4...@stream-io/video-react-sdk-1.10.5) (2025-01-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.15.4`
  - leave ringing call if accepted or rejected elsewhere ([#1654](https://github.com/GetStream/stream-video-js/issues/1654)) ([9f25adf](https://github.com/GetStream/stream-video-js/commit/9f25adf8796db369f7e3e236e6a178f525ae8f55))
- `@stream-io/video-react-bindings` updated to version `1.4.4`

## [1.10.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.10.3...@stream-io/video-react-sdk-1.10.4) (2025-01-22)

### Bug Fixes

- **LivestreamPlayer:** don't render any component until `call` is ready ([#1653](https://github.com/GetStream/stream-video-js/issues/1653)) ([63afc30](https://github.com/GetStream/stream-video-js/commit/63afc3090a5ceb3d656f0111bc348d79b895ab5f))

## [1.10.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.10.2...@stream-io/video-react-sdk-1.10.3) (2025-01-21)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.15.3`
  - restore calling state if SFU connection fails during join ([#1652](https://github.com/GetStream/stream-video-js/issues/1652)) ([ff7f221](https://github.com/GetStream/stream-video-js/commit/ff7f221ad285ca1994fc3a780aa8183df2de3e99))
- `@stream-io/video-react-bindings` updated to version `1.4.3`

## [1.10.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.10.1...@stream-io/video-react-sdk-1.10.2) (2025-01-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.15.2`
  - improved error handling when connecting to an SFU ([#1648](https://github.com/GetStream/stream-video-js/issues/1648)) ([27332b4](https://github.com/GetStream/stream-video-js/commit/27332b484094e26a123a1dfe8bb614c35ce1022a))
- `@stream-io/video-react-bindings` updated to version `1.4.2`

## [1.10.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.10.0...@stream-io/video-react-sdk-1.10.1) (2025-01-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.15.1`
  - update mute state only for video track on mobile ([#1645](https://github.com/GetStream/stream-video-js/issues/1645)) ([c0507cb](https://github.com/GetStream/stream-video-js/commit/c0507cb02e0058b8b968237220234771c9a30e6f)), closes [#1527](https://github.com/GetStream/stream-video-js/issues/1527)
- `@stream-io/video-react-bindings` updated to version `1.4.1`

## [1.10.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.9.0...@stream-io/video-react-sdk-1.10.0) (2025-01-15)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.15.0`
- `@stream-io/video-react-bindings` updated to version `1.4.0`

### Features

- Codec Negotiation ([#1527](https://github.com/GetStream/stream-video-js/issues/1527)) ([2e9e344](https://github.com/GetStream/stream-video-js/commit/2e9e344d5259e3069dddb17846013becef24829e))

## [1.9.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.8.7...@stream-io/video-react-sdk-1.9.0) (2025-01-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.14.0`
- `@stream-io/video-react-bindings` updated to version `1.3.0`

### Features

- **closed captions:** Integration in the SDKs ([#1508](https://github.com/GetStream/stream-video-js/issues/1508)) ([bcb8589](https://github.com/GetStream/stream-video-js/commit/bcb85892c0dafcb03f9debf8d2fd361622224166))

## [1.8.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.8.6...@stream-io/video-react-sdk-1.8.7) (2024-12-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.13.1`
  - **client:** fix the initial value of deviceState in clientDetails ([#1629](https://github.com/GetStream/stream-video-js/issues/1629)) ([afefb67](https://github.com/GetStream/stream-video-js/commit/afefb67a568899e2ce500e6dad36e64b6b0e5a3d))
- `@stream-io/video-react-bindings` updated to version `1.2.16`

## [1.8.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.8.5...@stream-io/video-react-sdk-1.8.6) (2024-12-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.13.0`
  - report low power mode and thermal info to stats ([#1583](https://github.com/GetStream/stream-video-js/issues/1583)) ([ef49cee](https://github.com/GetStream/stream-video-js/commit/ef49ceef032fc3e4bb055fbc32c2b5b18c3a24d2))
- `@stream-io/video-react-bindings` updated to version `1.2.15`

## [1.8.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.8.4...@stream-io/video-react-sdk-1.8.5) (2024-12-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.12.4`
  - **Bug Fixes**
    - adjust dynascale debouncing for upscaling and downscaling ([#1621](https://github.com/GetStream/stream-video-js/issues/1621)) [skip ci] ([7b3a721](https://github.com/GetStream/stream-video-js/commit/7b3a72192fab79d8af8d1c392a9f0135e2d25b16))
    - prevent auto-dropping already accepted or rejected calls ([#1619](https://github.com/GetStream/stream-video-js/issues/1619)) ([113406a](https://github.com/GetStream/stream-video-js/commit/113406a9ba7fdf2e193a1933b73963e0011f28f0))
  - **Other**
    - improve test coverage reporting ([#1624](https://github.com/GetStream/stream-video-js/issues/1624)) ([32bb870](https://github.com/GetStream/stream-video-js/commit/32bb870187f0627c32d2b5692ce3de633d743582))
- `@stream-io/video-react-bindings` updated to version `1.2.14`

## [1.8.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.8.3...@stream-io/video-react-sdk-1.8.4) (2024-12-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.12.3`
  - multiple rare ringing issues in react-native ([#1611](https://github.com/GetStream/stream-video-js/issues/1611)) ([4e25264](https://github.com/GetStream/stream-video-js/commit/4e25264808eab469b7b7ab184fb19961d47bdff3))
- `@stream-io/video-react-bindings` updated to version `1.2.13`

## [1.8.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.8.2...@stream-io/video-react-sdk-1.8.3) (2024-12-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.12.2`
  - **Bug Fixes**
    - pre-built timer worker ([#1617](https://github.com/GetStream/stream-video-js/issues/1617)) ([94dacef](https://github.com/GetStream/stream-video-js/commit/94dacef1c2b1e8794a42657ddab29a3b584eb0b4)), closes [#1557](https://github.com/GetStream/stream-video-js/issues/1557)
  - **Other**
    - drop docusaurus docs ([#1613](https://github.com/GetStream/stream-video-js/issues/1613)) ([8743c8d](https://github.com/GetStream/stream-video-js/commit/8743c8d221191759266010c6cd053480da1d71a5))
- `@stream-io/video-react-bindings` updated to version `1.2.12`

- drop docusaurus docs ([#1613](https://github.com/GetStream/stream-video-js/issues/1613)) ([8743c8d](https://github.com/GetStream/stream-video-js/commit/8743c8d221191759266010c6cd053480da1d71a5))

## [1.8.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.8.1...@stream-io/video-react-sdk-1.8.2) (2024-12-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.12.1`
  - reenable usage of ringing filters with useCalls ([1dffaed](https://github.com/GetStream/stream-video-js/commit/1dffaed609ac147a6030a4fb103c4dd586db775e))
- `@stream-io/video-react-bindings` updated to version `1.2.11`

## [1.8.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.8.0...@stream-io/video-react-sdk-1.8.1) (2024-12-10)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.12.0`
  - Aggregate stats reports - request and response objects ([#1614](https://github.com/GetStream/stream-video-js/issues/1614)) ([8a47fea](https://github.com/GetStream/stream-video-js/commit/8a47fea491232e524b1de780c12c0d00e0f02bcd))
- `@stream-io/video-react-bindings` updated to version `1.2.10`

## [1.8.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.30...@stream-io/video-react-sdk-1.8.0) (2024-12-09)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.15`
  - avoid call.get in all call.ring events ([#1615](https://github.com/GetStream/stream-video-js/issues/1615)) ([c757370](https://github.com/GetStream/stream-video-js/commit/c7573701a20b4a29cd2b6fd08a55d4eff503f77f))
- `@stream-io/video-react-bindings` updated to version `1.2.9`

### Features

- add an option to filter participants in layouts ([#1612](https://github.com/GetStream/stream-video-js/issues/1612)) ([e1eac3f](https://github.com/GetStream/stream-video-js/commit/e1eac3fa4aa9239b9f0e75b6f33d51cd39c788e5))

## [1.7.30](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.29...@stream-io/video-react-sdk-1.7.30) (2024-12-04)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.14`
  - prevent device list observable from erroring ([#1608](https://github.com/GetStream/stream-video-js/issues/1608)) ([06af3e7](https://github.com/GetStream/stream-video-js/commit/06af3e7e03b63551c781512c797ac10c0486d0c7))
- `@stream-io/video-react-bindings` updated to version `1.2.8`

## [1.7.29](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.28...@stream-io/video-react-sdk-1.7.29) (2024-12-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.13`
  - use worker to prevent timer throttling ([#1557](https://github.com/GetStream/stream-video-js/issues/1557)) ([c11c3ca](https://github.com/GetStream/stream-video-js/commit/c11c3caf455787fe531c83601bad71e7a0a0e9b9))
- `@stream-io/video-react-bindings` updated to version `1.2.7`

## [1.7.28](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.27...@stream-io/video-react-sdk-1.7.28) (2024-12-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.12`
  - handle timeout on SFU WS connections ([#1600](https://github.com/GetStream/stream-video-js/issues/1600)) ([5f2db7b](https://github.com/GetStream/stream-video-js/commit/5f2db7bd5cfdf57cdc04d6a6ed752f43e5b06657))
- `@stream-io/video-react-bindings` updated to version `1.2.6`

## [1.7.27](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.26...@stream-io/video-react-sdk-1.7.27) (2024-11-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.11`
- `@stream-io/video-react-bindings` updated to version `1.2.5`

### Bug Fixes

- revert [#1604](https://github.com/GetStream/stream-video-js/issues/1604) ([#1607](https://github.com/GetStream/stream-video-js/issues/1607)) ([567e4fb](https://github.com/GetStream/stream-video-js/commit/567e4fb309509b6b0d814826856d0a15efe16271))

## [1.7.26](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.25...@stream-io/video-react-sdk-1.7.26) (2024-11-28)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.10`
  - ringing calls not being left when ended ([#1601](https://github.com/GetStream/stream-video-js/issues/1601)) ([1c2b9d1](https://github.com/GetStream/stream-video-js/commit/1c2b9d1a54767652acc52cae9bb3d348c9df566f))
- `@stream-io/video-react-bindings` updated to version `1.2.4`

## [1.7.25](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.24...@stream-io/video-react-sdk-1.7.25) (2024-11-27)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.9`
- `@stream-io/video-react-bindings` updated to version `1.2.3`

### Bug Fixes

- cover some device selection edge cases ([#1604](https://github.com/GetStream/stream-video-js/issues/1604)) ([a8fc0ea](https://github.com/GetStream/stream-video-js/commit/a8fc0eaf1ed6c79ce24f77f52351a1e90701bd02))

## [1.7.24](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.23...@stream-io/video-react-sdk-1.7.24) (2024-11-27)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.8`
  - **ios:** use vp8 when h264 constrainted baseline isn't available ([#1597](https://github.com/GetStream/stream-video-js/issues/1597)) ([6281216](https://github.com/GetStream/stream-video-js/commit/62812161cef5e9917c504dbc4cd9257709ea5fa1))
- `@stream-io/video-react-bindings` updated to version `1.2.2`

## [1.7.23](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.22...@stream-io/video-react-sdk-1.7.23) (2024-11-26)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.7`
  - remove unused code from the coordinator websocket impl ([#1563](https://github.com/GetStream/stream-video-js/issues/1563)) ([921b820](https://github.com/GetStream/stream-video-js/commit/921b820133885dac299dab343cee3fc4b08705ce))
- `@stream-io/video-react-bindings` updated to version `1.2.1`

## [1.7.22](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.21...@stream-io/video-react-sdk-1.7.22) (2024-11-25)

### Dependency Updates

- `@stream-io/video-react-bindings` updated to version `1.2.0`
  - **design-v2:** sdk and dogfood app design-v2 changes ([#1549](https://github.com/GetStream/stream-video-js/issues/1549)) ([480a359](https://github.com/GetStream/stream-video-js/commit/480a3593516e6662b35a44f97c72259548d08445))

## [1.7.21](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.20...@stream-io/video-react-sdk-1.7.21) (2024-11-22)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.6`
  - force single codec preference in the SDP ([#1588](https://github.com/GetStream/stream-video-js/issues/1588)) ([4afff09](https://github.com/GetStream/stream-video-js/commit/4afff09a778f8567176d22bcc22d36001dca7cd3)), closes [#1581](https://github.com/GetStream/stream-video-js/issues/1581)
- `@stream-io/video-react-bindings` updated to version `1.1.23`

## [1.7.20](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.19...@stream-io/video-react-sdk-1.7.20) (2024-11-22)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.5`
  - unhandled promise rejections during reconnect ([#1585](https://github.com/GetStream/stream-video-js/issues/1585)) ([920c4ea](https://github.com/GetStream/stream-video-js/commit/920c4ea3b3f622430b35ac1bade74a6206ee17e5)), closes [/github.com/GetStream/stream-video-js/pull/1585/files#diff-420f6ddab47c1be72fd9ce8c99e1fa2b9f5f0495b7c367546ee0ff634beaed81](https://github.com/GetStream//github.com/GetStream/stream-video-js/pull/1585/files/issues/diff-420f6ddab47c1be72fd9ce8c99e1fa2b9f5f0495b7c367546ee0ff634beaed81)
- `@stream-io/video-react-bindings` updated to version `1.1.22`

## [1.7.19](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.18...@stream-io/video-react-sdk-1.7.19) (2024-11-21)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.4`
  - experimental option to force single codec preference in the SDP ([#1581](https://github.com/GetStream/stream-video-js/issues/1581)) ([894a86e](https://github.com/GetStream/stream-video-js/commit/894a86e407dc0dd36b7463bb964c86da0c3055d1))
- `@stream-io/video-react-bindings` updated to version `1.1.21`

## [1.7.18](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.17...@stream-io/video-react-sdk-1.7.18) (2024-11-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.3`
  - respect codec overrides when computing the video layers ([#1582](https://github.com/GetStream/stream-video-js/issues/1582)) ([c22b83e](https://github.com/GetStream/stream-video-js/commit/c22b83ef710f2188e680b73790154de046a824e9))
- `@stream-io/video-react-bindings` updated to version `1.1.20`

## [1.7.17](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.16...@stream-io/video-react-sdk-1.7.17) (2024-11-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.2`
  - fully reset token manager on user disconnect ([#1578](https://github.com/GetStream/stream-video-js/issues/1578)) ([6751abc](https://github.com/GetStream/stream-video-js/commit/6751abc0507085bd7c9f3f803f4c5929e0598bea)), closes [#1573](https://github.com/GetStream/stream-video-js/issues/1573)
- `@stream-io/video-react-bindings` updated to version `1.1.19`

- add reason for cancel call click button ([#1577](https://github.com/GetStream/stream-video-js/issues/1577)) ([bcac386](https://github.com/GetStream/stream-video-js/commit/bcac386b6baa039b23f2281a1f7df0c633af035f))

## [1.7.16](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.15...@stream-io/video-react-sdk-1.7.16) (2024-11-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.1`
  - reject was not called on timeout, decline and cancel scenarios ([#1576](https://github.com/GetStream/stream-video-js/issues/1576)) ([8be76a4](https://github.com/GetStream/stream-video-js/commit/8be76a447729aeba7f5c68f8a9bb85b4738cb76d))
- `@stream-io/video-react-bindings` updated to version `1.1.18`

## [1.7.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.14...@stream-io/video-react-sdk-1.7.15) (2024-11-13)

### Bug Fixes

- race conditions in usePersistedDevicePreferences ([#1575](https://github.com/GetStream/stream-video-js/issues/1575)) ([08aacc4](https://github.com/GetStream/stream-video-js/commit/08aacc4e35920e30d9f091ba9207ecf757d86796))

## [1.7.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.13...@stream-io/video-react-sdk-1.7.14) (2024-11-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.11.0`
  - Connection timing ([#1574](https://github.com/GetStream/stream-video-js/issues/1574)) ([ce1dc9a](https://github.com/GetStream/stream-video-js/commit/ce1dc9a01fc5b0e60e3dac6653c27e99fd4b3ecb))
- `@stream-io/video-react-bindings` updated to version `1.1.17`

## [1.7.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.12...@stream-io/video-react-sdk-1.7.13) (2024-11-12)

### Dependency Updates

- `@stream-io/video-filters-web` updated to version `0.1.6`
  - handle async errors in background filters pipeline ([#1571](https://github.com/GetStream/stream-video-js/issues/1571)) ([53a5ac3](https://github.com/GetStream/stream-video-js/commit/53a5ac3691a6fe71a0b7b6695aa6c0ffaa01d3ec)), closes [#1565](https://github.com/GetStream/stream-video-js/issues/1565)

### Bug Fixes

- reset background blur level when filter is disabled ([#1570](https://github.com/GetStream/stream-video-js/issues/1570)) ([d0a0b24](https://github.com/GetStream/stream-video-js/commit/d0a0b242f482eecad9f41741a42747d1d5b6d0fe))

## [1.7.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.11...@stream-io/video-react-sdk-1.7.12) (2024-11-08)

### Dependency Updates

- `@stream-io/video-filters-web` updated to version `0.1.5`
  - guard against null fenceSync ([#1565](https://github.com/GetStream/stream-video-js/issues/1565)) ([9a3ae38](https://github.com/GetStream/stream-video-js/commit/9a3ae385ebed5b7fd44855ed2a7b7fc01ac53792))

## [1.7.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.10...@stream-io/video-react-sdk-1.7.11) (2024-11-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.10.5`
  - ignore maxSimulcastLayers override for SVC codecs ([#1564](https://github.com/GetStream/stream-video-js/issues/1564)) ([48f8abe](https://github.com/GetStream/stream-video-js/commit/48f8abe5fd5b48c367a04696febd582573def828))
- `@stream-io/video-react-bindings` updated to version `1.1.16`

## [1.7.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.9...@stream-io/video-react-sdk-1.7.10) (2024-11-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.10.4`
  - max simulcast layers preference ([#1560](https://github.com/GetStream/stream-video-js/issues/1560)) ([2b0bf28](https://github.com/GetStream/stream-video-js/commit/2b0bf2824dce41c2709e361e0521cf85e1b2fd16))
- `@stream-io/video-react-bindings` updated to version `1.1.15`

## [1.7.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.8...@stream-io/video-react-sdk-1.7.9) (2024-11-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.10.3`
  - camera flip did not work in react-native ([#1554](https://github.com/GetStream/stream-video-js/issues/1554)) ([423890c](https://github.com/GetStream/stream-video-js/commit/423890cb2d1925366d8a63c29f93c4c92c8104ad)), closes [#1521](https://github.com/GetStream/stream-video-js/issues/1521)
- `@stream-io/video-react-bindings` updated to version `1.1.14`

## [1.7.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.7...@stream-io/video-react-sdk-1.7.8) (2024-11-01)

### Dependency Updates

- `@stream-io/video-react-bindings` updated to version `1.1.13`
  - imports for useToggleCallRecording ([#1548](https://github.com/GetStream/stream-video-js/issues/1548)) ([f6b2180](https://github.com/GetStream/stream-video-js/commit/f6b21809e95691298d5c8fec6754a886eb9a28fe))

## [1.7.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.6...@stream-io/video-react-sdk-1.7.7) (2024-11-01)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.10.2`
  - camera not enabled on foreground notifications ([#1546](https://github.com/GetStream/stream-video-js/issues/1546)) ([67c920a](https://github.com/GetStream/stream-video-js/commit/67c920ac4bca35a414b88f6c9829b08396a6260b))
- `@stream-io/video-react-bindings` updated to version `1.1.12`

## [1.7.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.5...@stream-io/video-react-sdk-1.7.6) (2024-11-01)

### Dependency Updates

- `@stream-io/video-react-bindings` updated to version `1.1.11`

### Bug Fixes

- move useToggleCallRecording to react-bindings ([#1545](https://github.com/GetStream/stream-video-js/issues/1545)) ([73014ca](https://github.com/GetStream/stream-video-js/commit/73014ca6a4585680f581c4e9481c2d286f2fcd37))

## [1.7.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.4...@stream-io/video-react-sdk-1.7.5) (2024-10-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.10.1`
- `@stream-io/video-react-bindings` updated to version `1.1.10`

### Bug Fixes

- various device selector issues ([#1541](https://github.com/GetStream/stream-video-js/issues/1541)) ([f23618b](https://github.com/GetStream/stream-video-js/commit/f23618bda447eeb2d66f908bdb38b24db051f87c))

## [1.7.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.3...@stream-io/video-react-sdk-1.7.4) (2024-10-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.10.0`
  - report input devices in call stats ([#1533](https://github.com/GetStream/stream-video-js/issues/1533)) ([f34fe0a](https://github.com/GetStream/stream-video-js/commit/f34fe0a0444903099565ae55a9639e39fc19b76c))
- `@stream-io/video-react-bindings` updated to version `1.1.9`

## [1.7.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.2...@stream-io/video-react-sdk-1.7.3) (2024-10-28)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.9.3`
  - make device selection by device id exact ([#1538](https://github.com/GetStream/stream-video-js/issues/1538)) ([6274cac](https://github.com/GetStream/stream-video-js/commit/6274cac2ecf155aa6ce0c6d764229e0e9cd39a6a))
- `@stream-io/video-react-bindings` updated to version `1.1.8`

## [1.7.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.1...@stream-io/video-react-sdk-1.7.2) (2024-10-21)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.9.2`
  - **client:** invoke call.reject only when reject param specified ([#1530](https://github.com/GetStream/stream-video-js/issues/1530)) ([eac4e4e](https://github.com/GetStream/stream-video-js/commit/eac4e4ebd2575f5269f65db7173107d5cafab9bf))
- `@stream-io/video-react-bindings` updated to version `1.1.7`

## [1.7.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.7.0...@stream-io/video-react-sdk-1.7.1) (2024-10-18)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.9.1`
  - **svc:** announce downscaled layers in setPublisher ([#1526](https://github.com/GetStream/stream-video-js/issues/1526)) ([96cadd0](https://github.com/GetStream/stream-video-js/commit/96cadd05e995392eac4ec300828d07b287d691a0))
- `@stream-io/video-react-bindings` updated to version `1.1.6`

## [1.7.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.6.7...@stream-io/video-react-sdk-1.7.0) (2024-10-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.9.0`
- `@stream-io/video-react-bindings` updated to version `1.1.5`

### Features

- **svc-codec:** VP9 and AV1 support ([#1434](https://github.com/GetStream/stream-video-js/issues/1434)) ([c9c8530](https://github.com/GetStream/stream-video-js/commit/c9c8530d48c9206dc3803e6aa6cc1859fd433920))

## [1.6.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.6.6...@stream-io/video-react-sdk-1.6.7) (2024-10-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.8.4`
  - ignore camera direction for desktop devices ([#1521](https://github.com/GetStream/stream-video-js/issues/1521)) ([562b5cc](https://github.com/GetStream/stream-video-js/commit/562b5cca77264330d08dff5305eccc489970076a))
- `@stream-io/video-react-bindings` updated to version `1.1.4`
- `@stream-io/video-styling` updated to version `1.1.1`

### Bug Fixes

- PiP video placeholder ([#1509](https://github.com/GetStream/stream-video-js/issues/1509)) ([9eb2936](https://github.com/GetStream/stream-video-js/commit/9eb2936379726923ee43491ce965003e0e7f2c37))

## [1.6.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.6.5...@stream-io/video-react-sdk-1.6.6) (2024-10-14)

### Bug Fixes

- check for user capabilities before rendering call control buttons ([#1513](https://github.com/GetStream/stream-video-js/issues/1513)) ([9b11219](https://github.com/GetStream/stream-video-js/commit/9b1121966d3e3f7610fbbca386b8837563203e86))

## [1.6.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.6.4...@stream-io/video-react-sdk-1.6.5) (2024-10-10)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.8.3`
  - do not release track if track was not removed from stream ([#1517](https://github.com/GetStream/stream-video-js/issues/1517)) ([5bfc528](https://github.com/GetStream/stream-video-js/commit/5bfc52850c36ffe0de37e47066538a8a14dc9e01))
- `@stream-io/video-react-bindings` updated to version `1.1.3`

## [1.6.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.6.3...@stream-io/video-react-sdk-1.6.4) (2024-10-10)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.8.2`
  - add track release for react-native whenever track stop is called ([#1516](https://github.com/GetStream/stream-video-js/issues/1516)) ([5074510](https://github.com/GetStream/stream-video-js/commit/50745101d28d0339592c22ca02b076040ad3bdeb))
- `@stream-io/video-react-bindings` updated to version `1.1.2`

## [1.6.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.6.2...@stream-io/video-react-sdk-1.6.3) (2024-10-10)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.8.1`
  - mic not fully released in some cases ([#1515](https://github.com/GetStream/stream-video-js/issues/1515)) ([b7bf90b](https://github.com/GetStream/stream-video-js/commit/b7bf90b9b1a83fb80d01a82ebee8754343963ae5))
- `@stream-io/video-react-bindings` updated to version `1.1.1`

## [1.6.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.6.1...@stream-io/video-react-sdk-1.6.2) (2024-10-07)

### Bug Fixes

- edge case with participant bar rendering ([#1512](https://github.com/GetStream/stream-video-js/issues/1512)) ([2c1c345](https://github.com/GetStream/stream-video-js/commit/2c1c3459c531c8b083f095c9ecc37235a89127c1))

## [1.6.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.6.0...@stream-io/video-react-sdk-1.6.1) (2024-10-04)

### Bug Fixes

- video should be enabled by default ([7340041](https://github.com/GetStream/stream-video-js/commit/73400414d472d39701fd31b54ac927a8a8865151))

## [1.6.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.5.0...@stream-io/video-react-sdk-1.6.0) (2024-10-03)

### Features

- add a prop to control mirroring of local participant video ([#1506](https://github.com/GetStream/stream-video-js/issues/1506)) ([ca12dc3](https://github.com/GetStream/stream-video-js/commit/ca12dc3ba34f6dec117ae6fe75d7dbe00f297fe4))

## [1.5.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.4.5...@stream-io/video-react-sdk-1.5.0) (2024-10-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.8.0`
- `@stream-io/video-react-bindings` updated to version `1.1.0`
- `@stream-io/video-styling` updated to version `1.1.0`

### Features

- manual video quality selection ([#1486](https://github.com/GetStream/stream-video-js/issues/1486)) ([3a754af](https://github.com/GetStream/stream-video-js/commit/3a754afa1bd13d038b1023520ec8a5296ad2669e))

## [1.4.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.4.4...@stream-io/video-react-sdk-1.4.5) (2024-10-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.7.4`
  - retryable location hint ([#1505](https://github.com/GetStream/stream-video-js/issues/1505)) ([087417f](https://github.com/GetStream/stream-video-js/commit/087417f926b3d43a5bcb814ac9bb5951c1e63479))
- `@stream-io/video-react-bindings` updated to version `1.0.10`

## [1.4.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.4.3...@stream-io/video-react-sdk-1.4.4) (2024-10-01)

### Bug Fixes

- React v17 compatibility ([#1503](https://github.com/GetStream/stream-video-js/issues/1503)) ([a1797cf](https://github.com/GetStream/stream-video-js/commit/a1797cf1d62b1a74f0101bbd185b2cc0e1176575))

## [1.4.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.4.2...@stream-io/video-react-sdk-1.4.3) (2024-09-24)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.7.3`
  - do not always error out api calls when web socket initially failed ([#1495](https://github.com/GetStream/stream-video-js/issues/1495)) ([7cdb62e](https://github.com/GetStream/stream-video-js/commit/7cdb62e75cad56098ee81eabbcc63382f93fd218))
- `@stream-io/video-react-bindings` updated to version `1.0.9`

## [1.4.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.4.1...@stream-io/video-react-sdk-1.4.2) (2024-09-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.7.2`
  - overridable bitrate and bitrate downscale factor ([#1493](https://github.com/GetStream/stream-video-js/issues/1493)) ([cce5d8e](https://github.com/GetStream/stream-video-js/commit/cce5d8e641a9182a1779952e4e62aa16ec21ab92))
- `@stream-io/video-react-bindings` updated to version `1.0.8`

## [1.4.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.4.0...@stream-io/video-react-sdk-1.4.1) (2024-09-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.7.1`
  - don't attempt to recover broken WebSockets when there isn't a network connection ([#1490](https://github.com/GetStream/stream-video-js/issues/1490)) ([d576f48](https://github.com/GetStream/stream-video-js/commit/d576f48c7f819d48008359a3c30fe5d1a3372145))
- `@stream-io/video-react-bindings` updated to version `1.0.7`

## [1.4.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.3.6...@stream-io/video-react-sdk-1.4.0) (2024-09-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.7.0`
- `@stream-io/video-filters-web` updated to version `0.1.4`
  - **Features**
    - video filters on android ([#1382](https://github.com/GetStream/stream-video-js/issues/1382)) ([7ba8b0e](https://github.com/GetStream/stream-video-js/commit/7ba8b0e3b444869d38aae1a045dffb05444643f5))
  - **Bug Fixes**
    - refactor background filters ([#1415](https://github.com/GetStream/stream-video-js/issues/1415)) ([deb6da2](https://github.com/GetStream/stream-video-js/commit/deb6da238f541c733451e84b198434671da8dceb))
    - infinitely adjustable blur filter ([#1399](https://github.com/GetStream/stream-video-js/issues/1399)) ([447e73f](https://github.com/GetStream/stream-video-js/commit/447e73f2363142a0c1b43d05f848400950ecf697))
- `@stream-io/video-react-bindings` updated to version `1.0.6`
- `@stream-io/audio-filters-web` updated to version `0.2.2`

### Features

- React SDK cold-start optimizations ([#1488](https://github.com/GetStream/stream-video-js/issues/1488)) ([972e579](https://github.com/GetStream/stream-video-js/commit/972e5792b5a131a212b1031ade76dcb383897a46))

## [1.3.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.3.5...@stream-io/video-react-sdk-1.3.6) (2024-09-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.6.5`
  - race condition in `applySettingsToStream` ([#1489](https://github.com/GetStream/stream-video-js/issues/1489)) ([bf2ad90](https://github.com/GetStream/stream-video-js/commit/bf2ad90224d88592d4ea27ea8d0683efe98771f7))
- `@stream-io/video-react-bindings` updated to version `1.0.5`

## [1.3.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.3.4...@stream-io/video-react-sdk-1.3.5) (2024-09-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.6.4`
  - allow video target bitrate override ([#1487](https://github.com/GetStream/stream-video-js/issues/1487)) ([bfe34a3](https://github.com/GetStream/stream-video-js/commit/bfe34a3609182da5bbb03331978d86569cada098))
- `@stream-io/video-react-bindings` updated to version `1.0.4`

## [1.3.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.3.3...@stream-io/video-react-sdk-1.3.4) (2024-09-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.6.3`
  - client instance removal used a wrong key ([#1484](https://github.com/GetStream/stream-video-js/issues/1484)) ([edff5d7](https://github.com/GetStream/stream-video-js/commit/edff5d7ca0cc241a3929da3b752073883f29da32))
- `@stream-io/video-react-bindings` updated to version `1.0.3`

## [1.3.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.3.2...@stream-io/video-react-sdk-1.3.3) (2024-09-09)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.6.2`
  - prioritize h264 baseline profile ([#1482](https://github.com/GetStream/stream-video-js/issues/1482)) ([3ea3c5e](https://github.com/GetStream/stream-video-js/commit/3ea3c5ecf57b50d3f909d59a96811f636b07d8aa))
- `@stream-io/video-react-bindings` updated to version `1.0.2`

## [1.3.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.3.1...@stream-io/video-react-sdk-1.3.2) (2024-09-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.6.1`
  - update state.endedAt after the SFU terminates the call ([#1477](https://github.com/GetStream/stream-video-js/issues/1477)) ([135b11f](https://github.com/GetStream/stream-video-js/commit/135b11f2e29f486f2f43b9ac2a84848d0fd0b5b4))
- `@stream-io/video-react-bindings` updated to version `1.0.1`

## [1.3.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.3.0...@stream-io/video-react-sdk-1.3.1) (2024-09-05)

### Bug Fixes

- **composite:** hide the local participant for call recordings ([#1475](https://github.com/GetStream/stream-video-js/issues/1475)) ([f20ab9b](https://github.com/GetStream/stream-video-js/commit/f20ab9b6dc9a85d6d4d832d94ca1b369ba909658))

## [1.3.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.23...@stream-io/video-react-sdk-1.3.0) (2024-09-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.6.0`
  - **Features**
    - **client:** add a instance
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - handle session_participant_count_updated
    - do not use ended_at from call state to check ringing
    - `call.recording_failed` should update the call
    - ringing state issues when call was already
    - allow joining left call
    - report the Plain-JS sdk version to the
    - improve browser permission
    - support for portrait mode
    - perform full reconnect if ice restart
    - add concurrency
  - **Other**
    - update node-sdk, add this to pronto for token generation ([#1472](https://github.com/GetStream/stream-video-js/issues/1472)) ([c6cbc1f](https://github.com/GetStream/stream-video-js/commit/c6cbc1f8d003ea1c39796ccbc87d7553604f819b))
- `@stream-io/video-react-bindings` updated to version `1.0.0`
  - **Features**
    - **react:** Support for Background Filters and Background
  - **Bug Fixes**
    - improve error handling across the
    - optimistically toggle device
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in

- **@stream-io/video-react-sdk:** release version 1.3.0 ([f70e443](https://github.com/GetStream/stream-video-js/commit/f70e443ce151fa3a885706d214c99c0a31587a11))

### Features

- Reconnects v2 ([#1439](https://github.com/GetStream/stream-video-js/issues/1439)) ([e90aa52](https://github.com/GetStream/stream-video-js/commit/e90aa52780f9e0ca5852a294a152282000f66675))

## [1.3.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.23...@stream-io/video-react-sdk-1.3.0) (2024-09-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.6.0`
  - **Features**
    - **client:** add a instance
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - handle session_participant_count_updated
    - do not use ended_at from call state to check ringing
    - `call.recording_failed` should update the call
    - ringing state issues when call was already
    - allow joining left call
    - report the Plain-JS sdk version to the
    - improve browser permission
    - support for portrait mode
    - perform full reconnect if ice restart
    - add concurrency
  - **Other**
    - update node-sdk, add this to pronto for token generation ([#1472](https://github.com/GetStream/stream-video-js/issues/1472)) ([c6cbc1f](https://github.com/GetStream/stream-video-js/commit/c6cbc1f8d003ea1c39796ccbc87d7553604f819b))
- `@stream-io/video-react-bindings` updated to version `0.4.56`
  - **Features**
    - **react:** Support for Background Filters and Background
  - **Bug Fixes**
    - improve error handling across the
    - optimistically toggle device
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in

### Features

- Reconnects v2 ([#1439](https://github.com/GetStream/stream-video-js/issues/1439)) ([e90aa52](https://github.com/GetStream/stream-video-js/commit/e90aa52780f9e0ca5852a294a152282000f66675))

### [1.2.23](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.22...@stream-io/video-react-sdk-1.2.23) (2024-08-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.5.2`
  - **Features**
    - **client:** add a instance
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - handle session_participant_count_updated
    - do not use ended_at from call state to check ringing
    - `call.recording_failed` should update the call
    - ringing state issues when call was already
    - allow joining left call
    - report the Plain-JS sdk version to the
    - improve browser permission
    - support for portrait mode
    - perform full reconnect if ice restart
    - add concurrency
  - **Other**
    - update node-sdk, add this to pronto for token generation ([#1472](https://github.com/GetStream/stream-video-js/issues/1472)) ([c6cbc1f](https://github.com/GetStream/stream-video-js/commit/c6cbc1f8d003ea1c39796ccbc87d7553604f819b))
- `@stream-io/video-react-bindings` updated to version `0.4.55`
  - **Features**
    - **react:** Support for Background Filters and Background
  - **Bug Fixes**
    - improve error handling across the
    - optimistically toggle device
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in

### [1.2.22](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.21...@stream-io/video-react-sdk-1.2.22) (2024-08-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.5.1`
  - **Features**
    - **client:** add a instance
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - handle session_participant_count_updated
    - do not use ended_at from call state to check ringing
    - `call.recording_failed` should update the call
    - ringing state issues when call was already
    - allow joining left call
    - report the Plain-JS sdk version to the
    - improve browser permission
    - support for portrait mode
    - perform full reconnect if ice restart
    - add concurrency
  - **Other**
    - update node-sdk, add this to pronto for token generation ([#1472](https://github.com/GetStream/stream-video-js/issues/1472)) ([c6cbc1f](https://github.com/GetStream/stream-video-js/commit/c6cbc1f8d003ea1c39796ccbc87d7553604f819b))
- `@stream-io/video-react-bindings` updated to version `0.4.54`
  - **Features**
    - **react:** Support for Background Filters and Background
  - **Bug Fixes**
    - improve error handling across the
    - optimistically toggle device
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in

### [1.2.21](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.20...@stream-io/video-react-sdk-1.2.21) (2024-08-21)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.5.0`
  - **Features**
    - **client:** add a instance
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - handle session_participant_count_updated
    - do not use ended_at from call state to check ringing
    - `call.recording_failed` should update the call
    - ringing state issues when call was already
    - allow joining left call
    - report the Plain-JS sdk version to the
    - improve browser permission
    - support for portrait mode
    - perform full reconnect if ice restart
    - add concurrency
  - **Other**
    - update node-sdk, add this to pronto for token generation ([#1472](https://github.com/GetStream/stream-video-js/issues/1472)) ([c6cbc1f](https://github.com/GetStream/stream-video-js/commit/c6cbc1f8d003ea1c39796ccbc87d7553604f819b))
- `@stream-io/video-react-bindings` updated to version `0.4.53`
  - **Features**
    - **react:** Support for Background Filters and Background
  - **Bug Fixes**
    - improve error handling across the
    - optimistically toggle device
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in

### [1.2.20](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.19...@stream-io/video-react-sdk-1.2.20) (2024-07-31)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.4.8`
  - **Features**
    - **client:** add a instance
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - handle session_participant_count_updated
    - do not use ended_at from call state to check ringing
    - `call.recording_failed` should update the call
    - ringing state issues when call was already
    - allow joining left call
    - report the Plain-JS sdk version to the
    - improve browser permission
    - support for portrait mode
    - perform full reconnect if ice restart
    - add concurrency
  - **Other**
    - update node-sdk, add this to pronto for token generation ([#1472](https://github.com/GetStream/stream-video-js/issues/1472)) ([c6cbc1f](https://github.com/GetStream/stream-video-js/commit/c6cbc1f8d003ea1c39796ccbc87d7553604f819b))
- `@stream-io/video-react-bindings` updated to version `0.4.52`
  - **Features**
    - **react:** Support for Background Filters and Background
  - **Bug Fixes**
    - improve error handling across the
    - optimistically toggle device
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in

### [1.2.19](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.18...@stream-io/video-react-sdk-1.2.19) (2024-07-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.4.7`
  - **Features**
    - **client:** add a instance
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - handle session_participant_count_updated
    - do not use ended_at from call state to check ringing
    - `call.recording_failed` should update the call
    - ringing state issues when call was already
    - allow joining left call
    - report the Plain-JS sdk version to the
    - improve browser permission
    - support for portrait mode
    - perform full reconnect if ice restart
    - add concurrency
  - **Other**
    - update node-sdk, add this to pronto for token generation ([#1472](https://github.com/GetStream/stream-video-js/issues/1472)) ([c6cbc1f](https://github.com/GetStream/stream-video-js/commit/c6cbc1f8d003ea1c39796ccbc87d7553604f819b))
- `@stream-io/video-react-bindings` updated to version `0.4.51`
  - **Features**
    - **react:** Support for Background Filters and Background
  - **Bug Fixes**
    - improve error handling across the
    - optimistically toggle device
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in

### [1.2.18](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.17...@stream-io/video-react-sdk-1.2.18) (2024-07-29)

### Bug Fixes

- remove applying default settings in
  usePersistedDevicePreferences ([#1446](https://github.com/GetStream/stream-video-js/issues/1446)) ([b196826](https://github.com/GetStream/stream-video-js/commit/b196826b6c2dcf5bd1d2d3ac8b5b852aeddeee81)),
  closes [/github.com/GetStream/stream-video-js/blob/main/packages/client/src/Call.ts#L2127](https://github.com/GetStream//github.com/GetStream/stream-video-js/blob/main/packages/client/src/Call.ts/issues/L2127)

### [1.2.17](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.16...@stream-io/video-react-sdk-1.2.17) (2024-07-25)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.4.6`
  - **Features**
    - **client:** add a instance
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - handle session_participant_count_updated
    - do not use ended_at from call state to check ringing
    - `call.recording_failed` should update the call
    - ringing state issues when call was already
    - allow joining left call
    - report the Plain-JS sdk version to the
    - improve browser permission
    - support for portrait mode
    - perform full reconnect if ice restart
    - add concurrency
  - **Other**
    - update node-sdk, add this to pronto for token generation ([#1472](https://github.com/GetStream/stream-video-js/issues/1472)) ([c6cbc1f](https://github.com/GetStream/stream-video-js/commit/c6cbc1f8d003ea1c39796ccbc87d7553604f819b))
- `@stream-io/video-react-bindings` updated to version `0.4.50`
  - **Features**
    - **react:** Support for Background Filters and Background
  - **Bug Fixes**
    - improve error handling across the
    - optimistically toggle device
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in

### Bug Fixes

- allow reusing call instances after
  leaving ([#1433](https://github.com/GetStream/stream-video-js/issues/1433)) ([61e05af](https://github.com/GetStream/stream-video-js/commit/61e05af25c441b7db9db16166a6b4eca20ec7748))

### [1.2.16](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.15...@stream-io/video-react-sdk-1.2.16) (2024-07-23)

### Bug Fixes

- align audio output button tooltip with the rest of media
  toggles ([#1445](https://github.com/GetStream/stream-video-js/issues/1445)) ([dcee098](https://github.com/GetStream/stream-video-js/commit/dcee098b219aa570c0ba58e9dc63dde1690e8580))

### [1.2.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.14...@stream-io/video-react-sdk-1.2.15) (2024-07-15)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.0.6`

### [1.2.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.13...@stream-io/video-react-sdk-1.2.14) (2024-07-12)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.4.5`
  - **Features**
    - **client:** add a instance
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - handle session_participant_count_updated
    - do not use ended_at from call state to check ringing
    - `call.recording_failed` should update the call
    - ringing state issues when call was already
    - allow joining left call
    - report the Plain-JS sdk version to the
    - improve browser permission
    - support for portrait mode
    - perform full reconnect if ice restart
    - add concurrency
  - **Other**
    - update node-sdk, add this to pronto for token generation ([#1472](https://github.com/GetStream/stream-video-js/issues/1472)) ([c6cbc1f](https://github.com/GetStream/stream-video-js/commit/c6cbc1f8d003ea1c39796ccbc87d7553604f819b))
- `@stream-io/video-react-bindings` updated to version `0.4.49`
  - **Features**
    - **react:** Support for Background Filters and Background
  - **Bug Fixes**
    - improve error handling across the
    - optimistically toggle device
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in

### [1.2.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.12...@stream-io/video-react-sdk-1.2.13) (2024-07-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.4.4`
  - **Features**
    - **client:** add a instance
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - handle session_participant_count_updated
    - do not use ended_at from call state to check ringing
    - `call.recording_failed` should update the call
    - ringing state issues when call was already
    - allow joining left call
    - report the Plain-JS sdk version to the
    - improve browser permission
    - support for portrait mode
    - perform full reconnect if ice restart
    - add concurrency
  - **Other**
    - update node-sdk, add this to pronto for token generation ([#1472](https://github.com/GetStream/stream-video-js/issues/1472)) ([c6cbc1f](https://github.com/GetStream/stream-video-js/commit/c6cbc1f8d003ea1c39796ccbc87d7553604f819b))
- `@stream-io/video-filters-web` updated to version `0.1.3`
- `@stream-io/video-react-bindings` updated to version `0.4.48`
  - **Features**
    - **react:** Support for Background Filters and Background
  - **Bug Fixes**
    - improve error handling across the
    - optimistically toggle device
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/audio-filters-web` updated to version `0.2.1`

### Bug Fixes

- refactor background
  filters ([#1415](https://github.com/GetStream/stream-video-js/issues/1415)) ([deb6da2](https://github.com/GetStream/stream-video-js/commit/deb6da238f541c733451e84b198434671da8dceb))

### [1.2.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.11...@stream-io/video-react-sdk-1.2.12) (2024-07-02)

### Bug Fixes

- **CallStats:** stat card labels
  translations ([#1429](https://github.com/GetStream/stream-video-js/issues/1429)) ([51132cd](https://github.com/GetStream/stream-video-js/commit/51132cd5f939ef6cebe1f7ad26a1576a6f92f71f))

### [1.2.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.10...@stream-io/video-react-sdk-1.2.11) (2024-06-28)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.0.5`

### [1.2.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.9...@stream-io/video-react-sdk-1.2.10) (2024-06-26)

### Bug Fixes

- **react:** provide displayName for our core
  components ([#1423](https://github.com/GetStream/stream-video-js/issues/1423)) ([724c444](https://github.com/GetStream/stream-video-js/commit/724c4449f3f4dfd4c468323e1a8dde1d12e56135))

### [1.2.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.8...@stream-io/video-react-sdk-1.2.9) (2024-06-25)

### Bug Fixes

- in some browsers event.key could be
  undefined ([#1421](https://github.com/GetStream/stream-video-js/issues/1421)) ([0a01c9f](https://github.com/GetStream/stream-video-js/commit/0a01c9fc6148457f9c9de0f8073f71143b05dc80))

### [1.2.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.7...@stream-io/video-react-sdk-1.2.8) (2024-06-25)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.4.3`
  - **Features**
    - **client:** add a instance
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - handle session_participant_count_updated
    - do not use ended_at from call state to check ringing
    - `call.recording_failed` should update the call
    - ringing state issues when call was already
    - allow joining left call
    - report the Plain-JS sdk version to the
    - improve browser permission
    - support for portrait mode
    - perform full reconnect if ice restart
    - add concurrency
  - **Other**
    - update node-sdk, add this to pronto for token generation ([#1472](https://github.com/GetStream/stream-video-js/issues/1472)) ([c6cbc1f](https://github.com/GetStream/stream-video-js/commit/c6cbc1f8d003ea1c39796ccbc87d7553604f819b))
- `@stream-io/video-react-bindings` updated to version `0.4.47`
  - **Features**
    - **react:** Support for Background Filters and Background
  - **Bug Fixes**
    - improve error handling across the
    - optimistically toggle device
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in

### [1.2.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.6...@stream-io/video-react-sdk-1.2.7) (2024-06-24)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.4.2`
  - **Features**
    - **client:** add a instance
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - handle session_participant_count_updated
    - do not use ended_at from call state to check ringing
    - `call.recording_failed` should update the call
    - ringing state issues when call was already
    - allow joining left call
    - report the Plain-JS sdk version to the
    - improve browser permission
    - support for portrait mode
    - perform full reconnect if ice restart
    - add concurrency
  - **Other**
    - update node-sdk, add this to pronto for token generation ([#1472](https://github.com/GetStream/stream-video-js/issues/1472)) ([c6cbc1f](https://github.com/GetStream/stream-video-js/commit/c6cbc1f8d003ea1c39796ccbc87d7553604f819b))
- `@stream-io/video-react-bindings` updated to version `0.4.46`
  - **Features**
    - **react:** Support for Background Filters and Background
  - **Bug Fixes**
    - improve error handling across the
    - optimistically toggle device
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in

### [1.2.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.5...@stream-io/video-react-sdk-1.2.6) (2024-06-24)

### Bug Fixes

- default onMenuToggle behavior shouldn't be
  overridden ([#1417](https://github.com/GetStream/stream-video-js/issues/1417)) ([3529e40](https://github.com/GetStream/stream-video-js/commit/3529e40b338c64e61ecbc7460e97c3c878771434))

### [1.2.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.4...@stream-io/video-react-sdk-1.2.5) (2024-06-20)

### Bug Fixes

- remove `isBlurringEnabled`
  prop ([#1411](https://github.com/GetStream/stream-video-js/issues/1411)) ([23bafe0](https://github.com/GetStream/stream-video-js/commit/23bafe0cc6a3bf0bcdff2e0339904dae5778c560))

### [1.2.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.3...@stream-io/video-react-sdk-1.2.4) (2024-06-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.4.1`
  - **Features**
    - **client:** add a instance
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - handle session_participant_count_updated
    - do not use ended_at from call state to check ringing
    - `call.recording_failed` should update the call
    - ringing state issues when call was already
    - allow joining left call
    - report the Plain-JS sdk version to the
    - improve browser permission
    - support for portrait mode
    - perform full reconnect if ice restart
    - add concurrency
  - **Other**
    - update node-sdk, add this to pronto for token generation ([#1472](https://github.com/GetStream/stream-video-js/issues/1472)) ([c6cbc1f](https://github.com/GetStream/stream-video-js/commit/c6cbc1f8d003ea1c39796ccbc87d7553604f819b))
- `@stream-io/video-react-bindings` updated to version `0.4.45`
  - **Features**
    - **react:** Support for Background Filters and Background
  - **Bug Fixes**
    - improve error handling across the
    - optimistically toggle device
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in

### [1.2.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.2...@stream-io/video-react-sdk-1.2.3) (2024-06-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.4.0`
  - **Features**
    - **client:** add a instance
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - handle session_participant_count_updated
    - do not use ended_at from call state to check ringing
    - `call.recording_failed` should update the call
    - ringing state issues when call was already
    - allow joining left call
    - report the Plain-JS sdk version to the
    - improve browser permission
    - support for portrait mode
    - perform full reconnect if ice restart
    - add concurrency
  - **Other**
    - update node-sdk, add this to pronto for token generation ([#1472](https://github.com/GetStream/stream-video-js/issues/1472)) ([c6cbc1f](https://github.com/GetStream/stream-video-js/commit/c6cbc1f8d003ea1c39796ccbc87d7553604f819b))
- `@stream-io/video-react-bindings` updated to version `0.4.44`
  - **Features**
    - **react:** Support for Background Filters and Background
  - **Bug Fixes**
    - improve error handling across the
    - optimistically toggle device
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in

### [1.2.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.1...@stream-io/video-react-sdk-1.2.2) (2024-06-12)

### Dependency Updates

- `@stream-io/video-filters-web` updated to version `0.1.2`

### Bug Fixes

- infinitely adjustable blur
  filter ([#1399](https://github.com/GetStream/stream-video-js/issues/1399)) ([447e73f](https://github.com/GetStream/stream-video-js/commit/447e73f2363142a0c1b43d05f848400950ecf697))

### [1.2.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.2.0...@stream-io/video-react-sdk-1.2.1) (2024-06-12)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.3.1`
  - **Features**
    - **client:** add a instance
    - **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  - **Bug Fixes**
    - handle session_participant_count_updated
    - do not use ended_at from call state to check ringing
    - `call.recording_failed` should update the call
    - ringing state issues when call was already
    - allow joining left call
    - report the Plain-JS sdk version to the
    - improve browser permission
    - support for portrait mode
    - perform full reconnect if ice restart
    - add concurrency
  - **Other**
    - update node-sdk, add this to pronto for token generation ([#1472](https://github.com/GetStream/stream-video-js/issues/1472)) ([c6cbc1f](https://github.com/GetStream/stream-video-js/commit/c6cbc1f8d003ea1c39796ccbc87d7553604f819b))
- `@stream-io/video-react-bindings` updated to version `0.4.43`
  - **Features**
    - **react:** Support for Background Filters and Background
  - **Bug Fixes**
    - improve error handling across the
    - optimistically toggle device
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in

## [1.2.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.1.5...@stream-io/video-react-sdk-1.2.0) (2024-06-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.3.0`
  - **Features**
    - **client:** support reject
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
- `@stream-io/video-react-bindings` updated to version `0.4.42`

### Features

- improve `isSupported` method for noise
  cancellation ([#1388](https://github.com/GetStream/stream-video-js/issues/1388)) ([07031ba](https://github.com/GetStream/stream-video-js/commit/07031ba72443a84cac8856c7481f3d4053b46d4c))

### [1.1.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.1.4...@stream-io/video-react-sdk-1.1.5) (2024-06-07)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.2.0`

### [1.1.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.1.3...@stream-io/video-react-sdk-1.1.4) (2024-06-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.2.3`
  - **Features**
    - **client:** support reject
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
- `@stream-io/video-react-bindings` updated to version `0.4.41`

### [1.1.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.1.2...@stream-io/video-react-sdk-1.1.3) (2024-06-04)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.2.2`
  - **Features**
    - **client:** support reject
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
- `@stream-io/video-react-bindings` updated to version `0.4.40`

### [1.1.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.1.1...@stream-io/video-react-sdk-1.1.2) (2024-06-04)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.2.1`
  - **Features**
    - **client:** support reject
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
- `@stream-io/video-react-bindings` updated to version `0.4.39`

### [1.1.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.1.0...@stream-io/video-react-sdk-1.1.1) (2024-06-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.2.0`
  - **Features**
    - **client:** support reject
  - **Bug Fixes**
    - catch error for user connect in
    - align with the latest
    - join doesn't work on chrome
- `@stream-io/video-react-bindings` updated to version `0.4.38`

## [1.1.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.0.15...@stream-io/video-react-sdk-1.1.0) (2024-06-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.1.0`
  - **Features**
    - **v1:** release
  - **Bug Fixes**
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - align with the latest
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - **state:** handle participantUpdated
- `@stream-io/video-filters-web` updated to version `0.1.1`
- `@stream-io/video-react-bindings` updated to version `0.4.37`

### Features

- video filters on
  android ([#1382](https://github.com/GetStream/stream-video-js/issues/1382)) ([7ba8b0e](https://github.com/GetStream/stream-video-js/commit/7ba8b0e3b444869d38aae1a045dffb05444643f5))

### [1.0.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.0.14...@stream-io/video-react-sdk-1.0.15) (2024-05-31)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.10`
  - **Features**
    - **v1:** release
  - **Bug Fixes**
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - align with the latest
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.36`

### [1.0.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.0.13...@stream-io/video-react-sdk-1.0.14) (2024-05-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.9`
  - **Features**
    - **v1:** release
  - **Bug Fixes**
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - align with the latest
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.35`

### [1.0.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.0.12...@stream-io/video-react-sdk-1.0.13) (2024-05-27)

### Bug Fixes

- add LivestreamPlayer wrapper
  component ([#1372](https://github.com/GetStream/stream-video-js/issues/1372)) ([49e9b98](https://github.com/GetStream/stream-video-js/commit/49e9b980eff548f62f8aa45e6156cfa3dd40dcbd))

### [1.0.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.0.11...@stream-io/video-react-sdk-1.0.12) (2024-05-23)

### Bug Fixes

- participant sounds and
  cookbook ([#1367](https://github.com/GetStream/stream-video-js/issues/1367)) ([d5e774c](https://github.com/GetStream/stream-video-js/commit/d5e774c14568c98a819cb282d3453a0136a84d84))

### [1.0.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.0.10...@stream-io/video-react-sdk-1.0.11) (2024-05-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.8`
  - **Features**
    - **v1:** release
  - **Bug Fixes**
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - align with the latest
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.34`

### [1.0.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.0.9...@stream-io/video-react-sdk-1.0.10) (2024-05-23)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.0.4`

### Bug Fixes

- popup
  styling ([#1363](https://github.com/GetStream/stream-video-js/issues/1363)) ([6549d4b](https://github.com/GetStream/stream-video-js/commit/6549d4bd80e198169e8d09920c46dcb487eb071b))

### [1.0.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.0.8...@stream-io/video-react-sdk-1.0.9) (2024-05-21)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.7`
  - **Features**
    - **v1:** release
  - **Bug Fixes**
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - align with the latest
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.33`

### [1.0.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.0.7...@stream-io/video-react-sdk-1.0.8) (2024-05-17)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.0.3`

### Bug Fixes

- popup-related UI
  updates ([#1356](https://github.com/GetStream/stream-video-js/issues/1356)) ([a1a3238](https://github.com/GetStream/stream-video-js/commit/a1a3238370b1ed5b7877f744bebea9f51a843256))

### [1.0.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.0.6...@stream-io/video-react-sdk-1.0.7) (2024-05-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.6`
  - **Features**
    - **v1:** release
  - **Bug Fixes**
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - align with the latest
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.32`

### Bug Fixes

- **state:** aligns the participant state with other
  SDKs ([#1357](https://github.com/GetStream/stream-video-js/issues/1357)) ([146e6ac](https://github.com/GetStream/stream-video-js/commit/146e6acd7296488bc18f4bf5c76e9f2c9bfd97af))

### [1.0.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.0.5...@stream-io/video-react-sdk-1.0.6) (2024-05-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.5`
  - **Features**
    - **v1:** release
  - **Bug Fixes**
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - align with the latest
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.31`

### [1.0.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.0.4...@stream-io/video-react-sdk-1.0.5) (2024-05-15)

### Bug Fixes

- **grid:** guard against zero or negative group
  size ([#1355](https://github.com/GetStream/stream-video-js/issues/1355)) ([fd6d142](https://github.com/GetStream/stream-video-js/commit/fd6d1421b54d46cebd3ffbaf3d57afb0166133d2)),
  closes [#1293](https://github.com/GetStream/stream-video-js/issues/1293)

### [1.0.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.0.3...@stream-io/video-react-sdk-1.0.4) (2024-05-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.4`
  - **Features**
    - **v1:** release
  - **Bug Fixes**
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - align with the latest
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.30`

### [1.0.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.0.2...@stream-io/video-react-sdk-1.0.3) (2024-05-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.3`
  - **Features**
    - **v1:** release
  - **Bug Fixes**
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - align with the latest
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.29`

### [1.0.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.0.1...@stream-io/video-react-sdk-1.0.2) (2024-05-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.2`
  - **Features**
    - **v1:** release
  - **Bug Fixes**
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - align with the latest
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.28`

### Bug Fixes

- optimistically toggle device
  status ([#1342](https://github.com/GetStream/stream-video-js/issues/1342)) ([2e4e470](https://github.com/GetStream/stream-video-js/commit/2e4e470347fce7c7499dd21a931e5dec74bf9618))

### [1.0.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.0.0...@stream-io/video-react-sdk-1.0.1) (2024-05-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `1.0.1`
  - **Features**
    - **v1:** release
  - **Bug Fixes**
    - improved input device error
    - prevent double sound detectors set
    - call.reject when there is no participant and call is in joined
    - align with the latest
    - correctly handle pending state
    - don't create publisher PC for anonymous
    - improve error handling across the
    - **state:** handle participantUpdated
- `@stream-io/video-react-bindings` updated to version `0.4.27`

## [1.0.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.7.0...@stream-io/video-react-sdk-1.0.0) (2024-05-07)

### Features

- **v1:** release
  v1.0.0 ([06174cd](https://github.com/GetStream/stream-video-js/commit/06174cdfb4168a7401f56b03d0302f82c97b93ff))

## [0.7.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.19...@stream-io/video-react-sdk-0.7.0) (2024-05-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.8.0`
  - **Features**
    - support target_resolution backend setting for
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.25`

### Features

- **v1:** release
  v1.0.0 ([#1340](https://github.com/GetStream/stream-video-js/issues/1340)) ([f76fd02](https://github.com/GetStream/stream-video-js/commit/f76fd02ec2159bb0943c8432591b462ab0d356ff))

### [0.6.19](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.18...@stream-io/video-react-sdk-0.6.19) (2024-05-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.13`
  - **Features**
    - support target_resolution backend setting for
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.24`

### [0.6.18](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.17...@stream-io/video-react-sdk-0.6.18) (2024-05-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.12`
  - **Features**
    - support target_resolution backend setting for
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.23`

### [0.6.17](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.16...@stream-io/video-react-sdk-0.6.17) (2024-05-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.11`
  - **Features**
    - support target_resolution backend setting for
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.22`

### Bug Fixes

- **devices:** API to disable speaking while muted
  notifications ([#1335](https://github.com/GetStream/stream-video-js/issues/1335)) ([cdff0e0](https://github.com/GetStream/stream-video-js/commit/cdff0e036bf4afca763e4f7a1563c23e806be190)),
  closes [#1329](https://github.com/GetStream/stream-video-js/issues/1329)

### [0.6.16](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.15...@stream-io/video-react-sdk-0.6.16) (2024-05-02)

### Bug Fixes

- synchronize background filter canvas
  capturing ([#1334](https://github.com/GetStream/stream-video-js/issues/1334)) ([eaead81](https://github.com/GetStream/stream-video-js/commit/eaead818f9f404cf647efdbc11707fc3b58b2459))

### [0.6.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.14...@stream-io/video-react-sdk-0.6.15) (2024-04-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.10`
  - **Features**
    - support target_resolution backend setting for
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.21`

### [0.6.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.13...@stream-io/video-react-sdk-0.6.14) (2024-04-26)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.9`
  - **Features**
    - support target_resolution backend setting for
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.20`

### [0.6.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.12...@stream-io/video-react-sdk-0.6.13) (2024-04-25)

### Dependency Updates

- `@stream-io/audio-filters-web` updated to version `0.1.0`

### [0.6.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.11...@stream-io/video-react-sdk-0.6.12) (2024-04-25)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.8`
  - **Features**
    - support target_resolution backend setting for
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.19`
- `@stream-io/audio-filters-web` updated to version `0.0.1`

### Features

- Noise
  Cancellation ([#1321](https://github.com/GetStream/stream-video-js/issues/1321)) ([9144385](https://github.com/GetStream/stream-video-js/commit/91443852986ad7453d82efb900626266d8df0e96))

### [0.6.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.10...@stream-io/video-react-sdk-0.6.11) (2024-04-25)

### Bug Fixes

- **filters:** Synchronize filter loading and
  unloading ([#1326](https://github.com/GetStream/stream-video-js/issues/1326)) ([cfab745](https://github.com/GetStream/stream-video-js/commit/cfab7455cfde6d7161ac823dc338e51bea00bcce))

### [0.6.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.9...@stream-io/video-react-sdk-0.6.10) (2024-04-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.7`
  - **Features**
    - support target_resolution backend setting for
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.18`

### Features

- **feedback:** Collect user
  feedback ([#1324](https://github.com/GetStream/stream-video-js/issues/1324)) ([b415de0](https://github.com/GetStream/stream-video-js/commit/b415de0828e402f8d3b854553351843aad2e8473))

### [0.6.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.8...@stream-io/video-react-sdk-0.6.9) (2024-04-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.6`
  - **Features**
    - support target_resolution backend setting for
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.17`

### [0.6.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.7...@stream-io/video-react-sdk-0.6.8) (2024-04-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.5`
  - **Features**
    - support target_resolution backend setting for
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.16`

### [0.6.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.6...@stream-io/video-react-sdk-0.6.7) (2024-04-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.4`
  - **Features**
    - support target_resolution backend setting for
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.15`

### [0.6.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.5...@stream-io/video-react-sdk-0.6.6) (2024-04-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.3`
  - **Features**
    - support target_resolution backend setting for
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.14`

### [0.6.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.4...@stream-io/video-react-sdk-0.6.5) (2024-04-16)

### Bug Fixes

- **CallStats:** update wording in the call stats
  component ([536b740](https://github.com/GetStream/stream-video-js/commit/536b740f6aaba8d0b2be125d2185bc139831f917))

### [0.6.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.3...@stream-io/video-react-sdk-0.6.4) (2024-04-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.2`
  - **Features**
    - support target_resolution backend setting for
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.13`

### [0.6.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.2...@stream-io/video-react-sdk-0.6.3) (2024-04-10)

### Dependency Updates

- `@stream-io/video-filters-web` updated to version `0.1.0`
  - **Features**
    - **react:** Support for Background Filters and Background Blurring ([#1283](https://github.com/GetStream/stream-video-js/issues/1283)) ([f790ee7](https://github.com/GetStream/stream-video-js/commit/f790ee78c20fb0f5266e429a777d8bb7ef158c83)), closes [#1271](https://github.com/GetStream/stream-video-js/issues/1271) [#1276](https://github.com/GetStream/stream-video-js/issues/1276)
  - **Bug Fixes**
    - **filters:** fixes off-by-one version conflict ([#1313](https://github.com/GetStream/stream-video-js/issues/1313)) ([ed801a4](https://github.com/GetStream/stream-video-js/commit/ed801a4275b12165bfd57fe583d39912a27305ee))
    - update repository path ([6d9bbe7](https://github.com/GetStream/stream-video-js/commit/6d9bbe7b3d4bcbf69f3a5faab4543c8ce8d985cd))

### [0.6.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.1...@stream-io/video-react-sdk-0.6.2) (2024-04-10)

### Dependency Updates

- `@stream-io/video-filters-web` updated to version `0.0.2`
  - **Features**
    - **react:** Support for Background Filters and Background Blurring ([#1283](https://github.com/GetStream/stream-video-js/issues/1283)) ([f790ee7](https://github.com/GetStream/stream-video-js/commit/f790ee78c20fb0f5266e429a777d8bb7ef158c83)), closes [#1271](https://github.com/GetStream/stream-video-js/issues/1271) [#1276](https://github.com/GetStream/stream-video-js/issues/1276)
  - **Bug Fixes**
    - **filters:** fixes off-by-one version conflict ([#1313](https://github.com/GetStream/stream-video-js/issues/1313)) ([ed801a4](https://github.com/GetStream/stream-video-js/commit/ed801a4275b12165bfd57fe583d39912a27305ee))
    - update repository path ([6d9bbe7](https://github.com/GetStream/stream-video-js/commit/6d9bbe7b3d4bcbf69f3a5faab4543c8ce8d985cd))

### [0.6.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.6.0...@stream-io/video-react-sdk-0.6.1) (2024-04-09)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.1`
  - **Features**
    - support target_resolution backend setting for
    - update from
    - update coordinator
    - user
  - **Bug Fixes**
    - change log level of send stats SFU API to type
    - **state:** optimized Call State
    - update call state with transcription
    - **client:** ignore SFU WS status code when the user initiates leaving a
    - **publisher:** ensure initial bitrate is
    - **codecs:** Set codec preferences based on receiving
- `@stream-io/video-react-bindings` updated to version `0.4.12`

## [0.6.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.5.12...@stream-io/video-react-sdk-0.6.0) (2024-04-09)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.7.0`
  - **Features**
    - revert add submit feedback method to
    - add submit feedback method to
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
  - **Bug Fixes**
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.11`

### ⚠ BREAKING CHANGES

- remove server-side capabilities from JS client (#1282)

### Features

- remove server-side capabilities from JS
  client ([#1282](https://github.com/GetStream/stream-video-js/issues/1282)) ([362b6b5](https://github.com/GetStream/stream-video-js/commit/362b6b501e6aa1864eb8486e3129a1705a4d41fb))

### [0.5.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.5.11...@stream-io/video-react-sdk-0.5.12) (2024-04-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.10`
  - **Features**
    - revert add submit feedback method to
    - add submit feedback method to
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
  - **Bug Fixes**
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.10`

### [0.5.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.5.10...@stream-io/video-react-sdk-0.5.11) (2024-04-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.9`
  - **Features**
    - revert add submit feedback method to
    - add submit feedback method to
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
  - **Bug Fixes**
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.9`

### [0.5.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.5.9...@stream-io/video-react-sdk-0.5.10) (2024-04-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.8`
  - **Features**
    - revert add submit feedback method to
    - add submit feedback method to
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
  - **Bug Fixes**
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-filters-web` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.4.8`
- `@stream-io/video-styling` updated to version `1.0.2`

### Features

- **react:** Support for Background Filters and Background
  Blurring ([#1283](https://github.com/GetStream/stream-video-js/issues/1283)) ([f790ee7](https://github.com/GetStream/stream-video-js/commit/f790ee78c20fb0f5266e429a777d8bb7ef158c83)),
  closes [#1271](https://github.com/GetStream/stream-video-js/issues/1271) [#1276](https://github.com/GetStream/stream-video-js/issues/1276)

### [0.5.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.5.8...@stream-io/video-react-sdk-0.5.9) (2024-04-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.7`
  - **Features**
    - revert add submit feedback method to
    - add submit feedback method to
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
  - **Bug Fixes**
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.7`

### [0.5.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.5.7...@stream-io/video-react-sdk-0.5.8) (2024-03-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.6`
  - **Features**
    - revert add submit feedback method to
    - add submit feedback method to
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
  - **Bug Fixes**
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.6`

### [0.5.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.5.6...@stream-io/video-react-sdk-0.5.7) (2024-03-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.5`
  - **Features**
    - revert add submit feedback method to
    - add submit feedback method to
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
  - **Bug Fixes**
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.5`

### Bug Fixes

- various bug fixes and
  improvements ([#1300](https://github.com/GetStream/stream-video-js/issues/1300)) ([a6186e2](https://github.com/GetStream/stream-video-js/commit/a6186e2406fd0b3e0aaa51a4222fa2e24e9dfac3))

### [0.5.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.5.5...@stream-io/video-react-sdk-0.5.6) (2024-03-28)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.4`
  - **Features**
    - revert add submit feedback method to
    - add submit feedback method to
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
  - **Bug Fixes**
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.4`

### [0.5.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.5.4...@stream-io/video-react-sdk-0.5.5) (2024-03-25)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.3`
  - **Features**
    - revert add submit feedback method to
    - add submit feedback method to
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
  - **Bug Fixes**
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.3`

### [0.5.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.5.3...@stream-io/video-react-sdk-0.5.4) (2024-03-25)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.2`
  - **Features**
    - revert add submit feedback method to
    - add submit feedback method to
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
  - **Bug Fixes**
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.2`

### [0.5.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.5.2...@stream-io/video-react-sdk-0.5.3) (2024-03-15)

### Dependency Updates

- `@stream-io/video-styling` updated to version `1.0.1`

### [0.5.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.5.1...@stream-io/video-react-sdk-0.5.2) (2024-03-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.1`
  - **Features**
    - revert add submit feedback method to
    - add submit feedback method to
    - [PBE-1611] Query call reports
    - **client:** update to the latest
    - SFU stats
    - **call:** Add getCallStats
  - **Bug Fixes**
    - **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
- `@stream-io/video-react-bindings` updated to version `0.4.1`

### Features

- **speakers:** Participant audio output
  levels ([#1284](https://github.com/GetStream/stream-video-js/issues/1284)) ([63b6077](https://github.com/GetStream/stream-video-js/commit/63b607709fd65019fe320e5970aab8132053995c))

### [0.5.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.5.0...@stream-io/video-react-sdk-0.5.1) (2024-02-28)

### Bug Fixes

- **react-sdk:** add default menus to ToggleAudio and ToggleVideo
  buttons ([#1275](https://github.com/GetStream/stream-video-js/issues/1275)) ([462bd40](https://github.com/GetStream/stream-video-js/commit/462bd408bfea4edfe2062525872f06500814328d)),
  closes [#1194](https://github.com/GetStream/stream-video-js/issues/1194)

## [0.5.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.26...@stream-io/video-react-sdk-0.5.0) (2024-02-26)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.6.0`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.4.0`
- `@stream-io/video-styling` updated to version `0.2.0`

### ⚠ BREAKING CHANGES

- **hooks:** expose permission hooks through useCallStateHooks() (#1254)
- **events:** improved type narrowing on call events (#1246)
- **react-sdk:** Visual redesign of the SDK and Demo App (#1194)

### Features

- **events:** improved type narrowing on call
  events ([#1246](https://github.com/GetStream/stream-video-js/issues/1246)) ([b5bdab1](https://github.com/GetStream/stream-video-js/commit/b5bdab1b526b451402867a849f5790f4f9a9fa1e))
- **hooks:** expose permission hooks through
  useCallStateHooks() ([#1254](https://github.com/GetStream/stream-video-js/issues/1254)) ([3eaa8bd](https://github.com/GetStream/stream-video-js/commit/3eaa8bd7592920eedb434b6ec747b6d22077ed87))
- **react-sdk:** Visual redesign of the SDK and Demo
  App ([#1194](https://github.com/GetStream/stream-video-js/issues/1194)) ([c1c6a7b](https://github.com/GetStream/stream-video-js/commit/c1c6a7b9bb0551442457f6d0ef5fedc92a985a3d))

### Bug Fixes

- **react-sdk:** consider call setting permissions in
  CallControls ([c2ff1f9](https://github.com/GetStream/stream-video-js/commit/c2ff1f98c005ce6165743082882da6d62835ad99))

### [0.4.26](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.25...@stream-io/video-react-sdk-0.4.26) (2024-02-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.11`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.22`

### [0.4.25](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.24...@stream-io/video-react-sdk-0.4.25) (2024-02-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.10`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.21`

### [0.4.24](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.23...@stream-io/video-react-sdk-0.4.24) (2024-02-12)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.9`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.20`

### [0.4.23](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.22...@stream-io/video-react-sdk-0.4.23) (2024-02-06)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.8`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.19`

### [0.4.22](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.21...@stream-io/video-react-sdk-0.4.22) (2024-01-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.7`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.18`

### [0.4.21](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.20...@stream-io/video-react-sdk-0.4.21) (2024-01-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.6`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.17`

### [0.4.20](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.19...@stream-io/video-react-sdk-0.4.20) (2024-01-16)

### Bug Fixes

- **react-sdk:** handle external full-screen toggling ([#1243](https://github.com/GetStream/stream-video-js/issues/1243)) ([9578155](https://github.com/GetStream/stream-video-js/commit/95781555e8450c780ca73cf9d9d940d12613d893))

### [0.4.19](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.18...@stream-io/video-react-sdk-0.4.19) (2024-01-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.5`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.16`

### [0.4.18](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.17...@stream-io/video-react-sdk-0.4.18) (2024-01-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.4`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.15`

### [0.4.17](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.16...@stream-io/video-react-sdk-0.4.17) (2023-12-22)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.3`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.14`

### [0.4.16](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.15...@stream-io/video-react-sdk-0.4.16) (2023-12-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.2`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.13`

### [0.4.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.14...@stream-io/video-react-sdk-0.4.15) (2023-12-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.1`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.12`

### [0.4.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.13...@stream-io/video-react-sdk-0.4.14) (2023-11-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.5.0`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.11`

### [0.4.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.12...@stream-io/video-react-sdk-0.4.13) (2023-11-27)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.10`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.10`

### [0.4.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.11...@stream-io/video-react-sdk-0.4.12) (2023-11-22)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.9`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.9`

### Features

- **participant-view:** allow opting-out from rendering VideoPlaceholder ([#1198](https://github.com/GetStream/stream-video-js/issues/1198)) ([acb020c](https://github.com/GetStream/stream-video-js/commit/acb020c8157a1338771bef11ef5e501bc9cd6f69))

### [0.4.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.10...@stream-io/video-react-sdk-0.4.11) (2023-11-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.8`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.8`

### [0.4.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.9...@stream-io/video-react-sdk-0.4.10) (2023-11-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.7`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.7`

### Features

- **device-api:** Browser Permissions API ([#1184](https://github.com/GetStream/stream-video-js/issues/1184)) ([a0b3573](https://github.com/GetStream/stream-video-js/commit/a0b3573b630ff8450953cdf1102fe722aea83f6f))

### [0.4.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.8...@stream-io/video-react-sdk-0.4.9) (2023-11-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.6`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.6`

### [0.4.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.7...@stream-io/video-react-sdk-0.4.8) (2023-11-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.5`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.5`
- `@stream-io/video-styling` updated to version `0.1.14`

### Bug Fixes

- lift the debug helpers from the SDK to Pronto ([#1182](https://github.com/GetStream/stream-video-js/issues/1182)) ([8f31efc](https://github.com/GetStream/stream-video-js/commit/8f31efc71d9f85ef147d21b42f23876599c36072))

### [0.4.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.6...@stream-io/video-react-sdk-0.4.7) (2023-11-03)

### Bug Fixes

- set `key` prop to the correct element ([#1178](https://github.com/GetStream/stream-video-js/issues/1178)) ([b24c07d](https://github.com/GetStream/stream-video-js/commit/b24c07dd366e8aa64055aae7dd48cabe8761eac0)), closes [#1176](https://github.com/GetStream/stream-video-js/issues/1176)

### [0.4.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.5...@stream-io/video-react-sdk-0.4.6) (2023-11-02)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.4`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.4`

### Bug Fixes

- allow audio and screen share audio tracks, delay setSinkId ([#1176](https://github.com/GetStream/stream-video-js/issues/1176)) ([6a099c5](https://github.com/GetStream/stream-video-js/commit/6a099c5c7cc6f5d389961a7c594e914e19be4ddb))

### [0.4.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.4...@stream-io/video-react-sdk-0.4.5) (2023-11-01)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.3`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.3`

### [0.4.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.3...@stream-io/video-react-sdk-0.4.4) (2023-11-01)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.2`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.2`

### Bug Fixes

- respect server-side settings in the lobby ([#1175](https://github.com/GetStream/stream-video-js/issues/1175)) ([b722a0a](https://github.com/GetStream/stream-video-js/commit/b722a0a4f8fd4e4e56787db3d9a56e45ee195974))

### [0.4.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.2...@stream-io/video-react-sdk-0.4.3) (2023-10-30)

### Bug Fixes

- add marker classes for the default `VideoPreview` components ([#1172](https://github.com/GetStream/stream-video-js/issues/1172)) ([7948cd8](https://github.com/GetStream/stream-video-js/commit/7948cd81a5ad6271872239a77b2a5ab8a856d231))

### [0.4.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.1...@stream-io/video-react-sdk-0.4.2) (2023-10-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.4.1`
  - **Features**
    - **client:** add stopOnLeave param to device
    - external storage for
    - Fast
    - **client:** speaking while muted in React Native using temporary peer
    - **react-native:** move to webrtc
    - **participant-view:** allow opting-out from rendering
    - **device-api:** Browser Permissions
    - handle device
    - Apply device config settings when call state becomes
  - **Bug Fixes**
    - **permissions:** relax device permission handling for
    - **client:** add workaround for missing getConfiguration support in react native
    - **client:** do not set h264 as preference for
    - **react-native:** no video stream from
    - **client:** automatic call join for other participants when someone
    - **sfu:** ensure SFU WebSocket is
    - **ring calls:** cancel auto-drop after rejecting a
    - **ringing:** Auto-Cancel outgoing
    - **session:** prevent duplication of session
    - **device-api:** check for Permissions API
    - lift the debug helpers from the SDK to
    - allow audio and screen share audio tracks, delay
    - **client:** optimized device
    - respect server-side settings in the
- `@stream-io/video-react-bindings` updated to version `0.3.1`

### [0.4.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.4.0...@stream-io/video-react-sdk-0.4.1) (2023-10-27)

### Bug Fixes

- **video-preview:** accept `className` prop ([#1166](https://github.com/GetStream/stream-video-js/issues/1166)) ([bfbfa1e](https://github.com/GetStream/stream-video-js/commit/bfbfa1ed52d4a0b19f9221252640d2926ebda641))

## [0.4.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.47...@stream-io/video-react-sdk-0.4.0) (2023-10-27)

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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.3.0`
  - correctly report `live` state of the

### ⚠ BREAKING CHANGES

- **react-sdk:** Universal Device Management API (#1127)

### Features

- **react-sdk:** Universal Device Management API ([#1127](https://github.com/GetStream/stream-video-js/issues/1127)) ([aeb3561](https://github.com/GetStream/stream-video-js/commit/aeb35612745f45254b536281c5f81d1bcac2bab5))

### [0.3.47](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.46...@stream-io/video-react-sdk-0.3.47) (2023-10-26)

### Bug Fixes

- Localize "Screen Share" caption ([#1164](https://github.com/GetStream/stream-video-js/issues/1164)) ([0a9ed96](https://github.com/GetStream/stream-video-js/commit/0a9ed960ee5ef8409b61dc5d747912b17a521160))

### [0.3.46](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.45...@stream-io/video-react-sdk-0.3.46) (2023-10-25)

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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.37`
  - correctly report `live` state of the

### [0.3.45](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.44...@stream-io/video-react-sdk-0.3.45) (2023-10-24)

### Bug Fixes

- add missing translations ([#1158](https://github.com/GetStream/stream-video-js/issues/1158)) ([6eb0c7a](https://github.com/GetStream/stream-video-js/commit/6eb0c7abf1b6a403438e4d80f275265e07e4f82f))

### [0.3.44](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.43...@stream-io/video-react-sdk-0.3.44) (2023-10-19)

### Bug Fixes

- sync video "paused" state more accurately ([#1150](https://github.com/GetStream/stream-video-js/issues/1150)) ([39cd42f](https://github.com/GetStream/stream-video-js/commit/39cd42f0035bbabdd9bb078fc8df9192f3b6c42f))

### [0.3.43](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.42...@stream-io/video-react-sdk-0.3.43) (2023-10-19)

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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.36`
  - correctly report `live` state of the

### Features

- mute screenshare_audio, update to the newest OpenAPI schema ([#1148](https://github.com/GetStream/stream-video-js/issues/1148)) ([81c45a7](https://github.com/GetStream/stream-video-js/commit/81c45a77e6a526de05ce5457357d212fb3e613d9))

### [0.3.42](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.41...@stream-io/video-react-sdk-0.3.42) (2023-10-18)

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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.35`
  - correctly report `live` state of the
- `@stream-io/video-styling` updated to version `0.1.13`

### Features

- **build:** ESM and CJS bundles ([#1144](https://github.com/GetStream/stream-video-js/issues/1144)) ([58b60ee](https://github.com/GetStream/stream-video-js/commit/58b60eee4b1cd667d2eef8f17ed4e6da74876a51)), closes [#1025](https://github.com/GetStream/stream-video-js/issues/1025)

### [0.3.41](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.40...@stream-io/video-react-sdk-0.3.41) (2023-10-13)

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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.34`
  - correctly report `live` state of the

### [0.3.40](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.39...@stream-io/video-react-sdk-0.3.40) (2023-10-13)

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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.33`
  - correctly report `live` state of the

### [0.3.39](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.38...@stream-io/video-react-sdk-0.3.39) (2023-10-09)

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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.32`
  - correctly report `live` state of the

### Bug Fixes

- sorting in paginated grid ([#1129](https://github.com/GetStream/stream-video-js/issues/1129)) ([d5b280a](https://github.com/GetStream/stream-video-js/commit/d5b280aadeaa4c718d0158561197c7045620ae0f))

### [0.3.38](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.37...@stream-io/video-react-sdk-0.3.38) (2023-10-06)

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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.31`
  - correctly report `live` state of the

### Features

- ScreenShare Audio support ([#1118](https://github.com/GetStream/stream-video-js/issues/1118)) ([5b63e1c](https://github.com/GetStream/stream-video-js/commit/5b63e1c5f52c76e3761e6907bd3786c19f0e5c6d))

### [0.3.37](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.36...@stream-io/video-react-sdk-0.3.37) (2023-10-05)

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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.30`
  - correctly report `live` state of the

### [0.3.36](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.35...@stream-io/video-react-sdk-0.3.36) (2023-10-03)

### Bug Fixes

- check if `currentParticipant` is actually initialized ([#1124](https://github.com/GetStream/stream-video-js/issues/1124)) ([797b84f](https://github.com/GetStream/stream-video-js/commit/797b84f9f63ae2c98a97b28afc08858705cd6840))

### [0.3.35](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.34...@stream-io/video-react-sdk-0.3.35) (2023-10-02)

### Bug Fixes

- requestPermission should be no-op when permission is already granted ([#1122](https://github.com/GetStream/stream-video-js/issues/1122)) ([f3d9e34](https://github.com/GetStream/stream-video-js/commit/f3d9e349825a6052850f7a78c3d6af9f517d136e))

### [0.3.34](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.33...@stream-io/video-react-sdk-0.3.34) (2023-10-02)

### Dependency Updates

- `@stream-io/video-styling` updated to version `0.1.12`

### Features

- **egress-composite:** add support for new options ([#1104](https://github.com/GetStream/stream-video-js/issues/1104)) ([2e039c2](https://github.com/GetStream/stream-video-js/commit/2e039c280cd808e6464ee3ab54e8c3606a0a0180)), closes [/github.com/GetStream/stream-video-js/blob/acc7301c069daeff68a8ad495e4f66bc2e61a137/sample-apps/react/egress-composite/src/ConfigurationContext.tsx#L53-L117](https://github.com/GetStream//github.com/GetStream/stream-video-js/blob/acc7301c069daeff68a8ad495e4f66bc2e61a137/sample-apps/react/egress-composite/src/ConfigurationContext.tsx/issues/L53-L117)

### [0.3.33](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.32...@stream-io/video-react-sdk-0.3.33) (2023-09-28)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.3.28`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.29`
  - correctly report `live` state of the

### [0.3.32](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.31...@stream-io/video-react-sdk-0.3.32) (2023-09-28)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.28`
  - correctly report `live` state of the

### [0.3.31](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.30...@stream-io/video-react-sdk-0.3.31) (2023-09-27)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.27`
  - correctly report `live` state of the
- `@stream-io/video-styling` updated to version `0.1.11`

### Features

- **Call Preview:** Support for call thumbnails ([#1099](https://github.com/GetStream/stream-video-js/issues/1099)) ([9274f76](https://github.com/GetStream/stream-video-js/commit/9274f760ed264ee0ee6ac97c6fe679288e067fd8))

### [0.3.30](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.29...@stream-io/video-react-sdk-0.3.30) (2023-09-27)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.26`
  - correctly report `live` state of the
- `@stream-io/video-styling` updated to version `0.1.10`

### Features

- **react-sdk:** LivestreamLayout ([#1103](https://github.com/GetStream/stream-video-js/issues/1103)) ([6636699](https://github.com/GetStream/stream-video-js/commit/6636699701dfd5eb5886c50781dd5f16a8470da5))

### [0.3.29](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.28...@stream-io/video-react-sdk-0.3.29) (2023-09-27)

### Features

- **SpeakerLayout:** add participantsBarLimit ([#1090](https://github.com/GetStream/stream-video-js/issues/1090)) ([712f1e7](https://github.com/GetStream/stream-video-js/commit/712f1e7010fdb8859aaa6caba7e7d9e0f4557ccb))

### [0.3.28](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.27...@stream-io/video-react-sdk-0.3.28) (2023-09-26)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.25`
  - correctly report `live` state of the
- `@stream-io/video-styling` updated to version `0.1.9`

### Features

- show the anonymous user count in the participant list ([#1109](https://github.com/GetStream/stream-video-js/issues/1109)) ([a253cbf](https://github.com/GetStream/stream-video-js/commit/a253cbfa7552a9ab4302ce824a72653a27dd324d))

### [0.3.27](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.26...@stream-io/video-react-sdk-0.3.27) (2023-09-26)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.24`
  - correctly report `live` state of the

### [0.3.26](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.25...@stream-io/video-react-sdk-0.3.26) (2023-09-25)

### Dependency Updates

- `@stream-io/i18n` updated to version `0.1.2`
- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.23`
  - correctly report `live` state of the
- `@stream-io/video-styling` updated to version `0.1.8`

### Bug Fixes

- Add extra delay before attempting to play video in Safari and Firefox ([#1106](https://github.com/GetStream/stream-video-js/issues/1106)) ([5b4a589](https://github.com/GetStream/stream-video-js/commit/5b4a58918240a7b63807726609d6d54b92cfe1d2))

### [0.3.25](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.24...@stream-io/video-react-sdk-0.3.25) (2023-09-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.22`
  - correctly report `live` state of the
- `@stream-io/video-styling` updated to version `0.1.7`

### Bug Fixes

- unmount video element when there is no video track or participant is invisible ([#1096](https://github.com/GetStream/stream-video-js/issues/1096)) ([bd01835](https://github.com/GetStream/stream-video-js/commit/bd01835f4e93c981ca2e5a7e4e09142ea4e326cf)), closes [#1094](https://github.com/GetStream/stream-video-js/issues/1094)

### [0.3.24](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.23...@stream-io/video-react-sdk-0.3.24) (2023-09-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.21`
  - correctly report `live` state of the

### [0.3.23](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.22...@stream-io/video-react-sdk-0.3.23) (2023-09-18)

### Dependency Updates

- `@stream-io/video-styling` updated to version `0.1.6`

### Bug Fixes

- hide the video element when a placeholder is visible ([#1094](https://github.com/GetStream/stream-video-js/issues/1094)) ([9efd84c](https://github.com/GetStream/stream-video-js/commit/9efd84cb77b98c372917e6bfa36161763969dddd))

### [0.3.22](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.21...@stream-io/video-react-sdk-0.3.22) (2023-09-15)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.20`
  - correctly report `live` state of the

### [0.3.21](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.20...@stream-io/video-react-sdk-0.3.21) (2023-09-15)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.19`
  - correctly report `live` state of the

### [0.3.20](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.19...@stream-io/video-react-sdk-0.3.20) (2023-09-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.18`
  - correctly report `live` state of the

### [0.3.19](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.18...@stream-io/video-react-sdk-0.3.19) (2023-09-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.17`
  - correctly report `live` state of the

### [0.3.18](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.17...@stream-io/video-react-sdk-0.3.18) (2023-09-11)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.16`
  - correctly report `live` state of the

### [0.3.17](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.16...@stream-io/video-react-sdk-0.3.17) (2023-09-08)

### Bug Fixes

- hook dependency issues, re-compute video aspect ratio after track unmute ([#1067](https://github.com/GetStream/stream-video-js/issues/1067)) ([392c36a](https://github.com/GetStream/stream-video-js/commit/392c36af9dbabd22f72d4cc4b11aab7b1d642b1f))

### [0.3.16](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.15...@stream-io/video-react-sdk-0.3.16) (2023-09-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.15`
  - correctly report `live` state of the

### [0.3.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.14...@stream-io/video-react-sdk-0.3.15) (2023-08-31)

### Features

- **react-sdk:** add browser permissions hook ([#972](https://github.com/GetStream/stream-video-js/issues/972)) ([4f1b40c](https://github.com/GetStream/stream-video-js/commit/4f1b40c3d19d580964c1e999c8055c3b736674a4))

### [0.3.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.13...@stream-io/video-react-sdk-0.3.14) (2023-08-31)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.14`
  - correctly report `live` state of the

### [0.3.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.12...@stream-io/video-react-sdk-0.3.13) (2023-08-31)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.13`
  - correctly report `live` state of the

### [0.3.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.11...@stream-io/video-react-sdk-0.3.12) (2023-08-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.12`
  - correctly report `live` state of the

### [0.3.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.10...@stream-io/video-react-sdk-0.3.11) (2023-08-30)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.11`
  - correctly report `live` state of the

### Features

- **Call:** Dynascale support for Plain-JS SDK ([#914](https://github.com/GetStream/stream-video-js/issues/914)) ([d295fd3](https://github.com/GetStream/stream-video-js/commit/d295fd341bbe325310fc6479f24ef647b013429b))

### [0.3.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.9...@stream-io/video-react-sdk-0.3.10) (2023-08-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.10`
  - correctly report `live` state of the

### [0.3.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.8...@stream-io/video-react-sdk-0.3.9) (2023-08-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.9`
  - correctly report `live` state of the

### [0.3.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.7...@stream-io/video-react-sdk-0.3.8) (2023-08-24)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.8`
  - correctly report `live` state of the

### [0.3.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.6...@stream-io/video-react-sdk-0.3.7) (2023-08-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.7`
  - correctly report `live` state of the

### [0.3.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.5...@stream-io/video-react-sdk-0.3.6) (2023-08-22)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.6`
  - correctly report `live` state of the

### [0.3.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.4...@stream-io/video-react-sdk-0.3.5) (2023-08-21)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.5`
  - correctly report `live` state of the

### [0.3.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.3...@stream-io/video-react-sdk-0.3.4) (2023-08-18)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.4`
  - correctly report `live` state of the

### [0.3.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.2...@stream-io/video-react-sdk-0.3.3) (2023-08-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.3`
  - correctly report `live` state of the

### [0.3.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.1...@stream-io/video-react-sdk-0.3.2) (2023-08-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
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
    - Call State
    - extra config params in goLive()
    - **livestream:** Livestream tutorial
    - enhanced call
    - Server-side participant
    - **client:** Create state shortcut for client state
    - Add
    - support goLive({ notify:
    - ICE
    - server-side
    - **sessions:** update to the new call.session event
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
    - update subscriptions when restoring
    - set initial device state regardless of call
    - strict mode
    - shorter thresholds for ICE
    - server side user connect + add
- `@stream-io/video-react-bindings` updated to version `0.2.2`
  - correctly report `live` state of the

### [0.3.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.3.0...@stream-io/video-react-sdk-0.3.1) (2023-08-16)

### Dependency Updates

- `@stream-io/video-react-bindings` updated to version `0.2.1`
  - correctly report `live` state of the

## [0.3.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.2.8...@stream-io/video-react-sdk-0.3.0) (2023-08-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.2.0`
  - **Features**
    - Call State
    - Wrap all call state hooks in
  - **Bug Fixes**
    - **bindings:** do not return call is live without metadata being
    - strict mode

### ⚠ BREAKING CHANGES

- Call State reorganization (#931)

### Features

- Call State reorganization ([#931](https://github.com/GetStream/stream-video-js/issues/931)) ([441dbd4](https://github.com/GetStream/stream-video-js/commit/441dbd4ffb8c851abb0ca719be143a1e80d1418c)), closes [#917](https://github.com/GetStream/stream-video-js/issues/917)

### [0.2.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.2.7...@stream-io/video-react-sdk-0.2.8) (2023-08-15)

### Dependency Updates

- `@stream-io/video-styling` updated to version `0.1.5`

### [0.2.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.2.6...@stream-io/video-react-sdk-0.2.7) (2023-08-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.1.18`
  - **Features**
    - Call State
    - Wrap all call state hooks in
  - **Bug Fixes**
    - **bindings:** do not return call is live without metadata being
    - strict mode

### Features

- extra config params in goLive() API ([#924](https://github.com/GetStream/stream-video-js/issues/924)) ([e14a082](https://github.com/GetStream/stream-video-js/commit/e14a0829460a3c5ff6d249dd159e6118df0b8352))

### [0.2.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.2.5...@stream-io/video-react-sdk-0.2.6) (2023-08-11)

### Features

- flag the dominant speaker with a CSS class ([#923](https://github.com/GetStream/stream-video-js/issues/923)) ([d503578](https://github.com/GetStream/stream-video-js/commit/d5035788c6f2b1a9db195d9f5fb9dd062cad1627))

### [0.2.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.2.4...@stream-io/video-react-sdk-0.2.5) (2023-08-11)

### Dependency Updates

- `@stream-io/video-react-bindings` updated to version `0.1.17`
  - **Features**
    - Call State
    - Wrap all call state hooks in
  - **Bug Fixes**
    - **bindings:** do not return call is live without metadata being
    - strict mode

### Features

- Wrap all call state hooks in useCallStateHooks() ([#917](https://github.com/GetStream/stream-video-js/issues/917)) ([19f891a](https://github.com/GetStream/stream-video-js/commit/19f891aab42b725b6a1d0194bf0ef8f645ccc792))

### [0.2.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.2.3...@stream-io/video-react-sdk-0.2.4) (2023-08-10)

### Dependency Updates

- `@stream-io/video-react-bindings` updated to version `0.1.16`
  - **Features**
    - Call State
    - Wrap all call state hooks in
  - **Bug Fixes**
    - **bindings:** do not return call is live without metadata being
    - strict mode

### [0.2.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.2.2...@stream-io/video-react-sdk-0.2.3) (2023-08-10)

### Bug Fixes

- **ParticipantView:** remove audio element while muted ([#918](https://github.com/GetStream/stream-video-js/issues/918)) ([076c7ff](https://github.com/GetStream/stream-video-js/commit/076c7ffbc4a525b0fb2acbc62a560734381e362b))

### [0.2.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.2.1...@stream-io/video-react-sdk-0.2.2) (2023-08-08)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.1.15`
  - **Features**
    - Call State
    - Wrap all call state hooks in
  - **Bug Fixes**
    - **bindings:** do not return call is live without metadata being
    - strict mode

### Features

- **livestream:** Livestream tutorial rewrite ([#909](https://github.com/GetStream/stream-video-js/issues/909)) ([49efdaa](https://github.com/GetStream/stream-video-js/commit/49efdaa14faccaa4848e8f9bdf3abb7748b925ac))

### [0.2.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.2.0...@stream-io/video-react-sdk-0.2.1) (2023-08-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.1.14`
  - **Features**
    - Call State
    - Wrap all call state hooks in
  - **Bug Fixes**
    - **bindings:** do not return call is live without metadata being
    - strict mode

## [0.2.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.18...@stream-io/video-react-sdk-0.2.0) (2023-08-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
  - **Features**
    - Trigger breaking change for
    - Update readme ([9e172f3](https://github.com/GetStream/stream-video-js/commit/9e172f3f72c4da6b24bb19193f70896435c50877))
    - take the location-hint on SDK init ([#799](https://github.com/GetStream/stream-video-js/issues/799)) ([ee5b170](https://github.com/GetStream/stream-video-js/commit/ee5b170337278a7063a368790f46b270647abf71))
    - fix version problem ([096425b](https://github.com/GetStream/stream-video-js/commit/096425bbcb6fcc06a566458dc6bd8431183d31d8))
    - SDK version header ([#790](https://github.com/GetStream/stream-video-js/issues/790)) ([6c662db](https://github.com/GetStream/stream-video-js/commit/6c662db59321db4060b5499d8eaad8a18b1eaf6c))
    - reconnection flow support for react-native ([#746](https://github.com/GetStream/stream-video-js/issues/746)) ([8677317](https://github.com/GetStream/stream-video-js/commit/86773172cd6e9c77940645302cc80b138ecc090a))
    - respect user_session_id in call.session events ([#766](https://github.com/GetStream/stream-video-js/issues/766)) ([18c6ae0](https://github.com/GetStream/stream-video-js/commit/18c6ae0ea47060e18b3462c7a6a04cad59f5f94b))
    - Remove ringing flag from call client ([#755](https://github.com/GetStream/stream-video-js/issues/755)) ([b78c605](https://github.com/GetStream/stream-video-js/commit/b78c60500e06b39fb4dce623bde6f7b10acdd8c1)), closes [/github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt#L82](https://github.com/GetStream//github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt/issues/L82)
    - stop tracking permission requests in Call state ([#744](https://github.com/GetStream/stream-video-js/issues/744)) ([b330df3](https://github.com/GetStream/stream-video-js/commit/b330df39d9dce34d9e5a1a7ec58acb0a905ee07b))
    - SFU Session Migration and Graceful Shutdown ([#603](https://github.com/GetStream/stream-video-js/issues/603)) ([943169b](https://github.com/GetStream/stream-video-js/commit/943169bd2b7b9e138bcaf387cf72eb3fa0f23533))
    - Change sendEvent signature ([#734](https://github.com/GetStream/stream-video-js/issues/734)) ([284c8c2](https://github.com/GetStream/stream-video-js/commit/284c8c2165129852ccf9fd7d8baad37f43d22a17))
    - Add user that mutes others in `CallUserMuted` event ([#704](https://github.com/GetStream/stream-video-js/issues/704)) ([f57fbbd](https://github.com/GetStream/stream-video-js/commit/f57fbbdcf9002add174aceba191211f3884cdc62))
    - **react-native:** send device and os info from the SDK ([#690](https://github.com/GetStream/stream-video-js/issues/690)) ([deb1a28](https://github.com/GetStream/stream-video-js/commit/deb1a28a4a029d988d11970608f00da8b327a02d))
    - Add `CallUserMuted` event ([#699](https://github.com/GetStream/stream-video-js/issues/699)) ([41a09e2](https://github.com/GetStream/stream-video-js/commit/41a09e257a9a8cd9b1b45551f35cebb3cd7a048b))
    - Custom logger example ([#669](https://github.com/GetStream/stream-video-js/issues/669)) ([208aed9](https://github.com/GetStream/stream-video-js/commit/208aed9f82dcbf5f9ffdf299c4672af855af344a))
    - **react-native:** push notification for android ([#626](https://github.com/GetStream/stream-video-js/issues/626)) ([ec2e439](https://github.com/GetStream/stream-video-js/commit/ec2e4390cb724091352ba774c55ad2245ace2955))
    - Logging ([#654](https://github.com/GetStream/stream-video-js/issues/654)) ([30fc8f2](https://github.com/GetStream/stream-video-js/commit/30fc8f28e2f5829247256f24b040ea4a10336186))
    - Make it possible to provide user and token in StreamVideoClient… ([#631](https://github.com/GetStream/stream-video-js/issues/631)) ([93f9b03](https://github.com/GetStream/stream-video-js/commit/93f9b03313ac74179f1d93b513ea4de306312291))
    - add audio room demo app ([#572](https://github.com/GetStream/stream-video-js/issues/572)) ([77f7b65](https://github.com/GetStream/stream-video-js/commit/77f7b6596047d59e10c8e58abad38c4f48cc162f))
    - User connect and types ([#627](https://github.com/GetStream/stream-video-js/issues/627)) ([721ef61](https://github.com/GetStream/stream-video-js/commit/721ef611374540ef570a516009c78d58ce4f5360))
    - **react-native:** support reconnection flow ([#458](https://github.com/GetStream/stream-video-js/issues/458)) ([89f2dda](https://github.com/GetStream/stream-video-js/commit/89f2ddafd1397d91f8ddea5a3c69dd62ae027313))
    - StreamCall signature, video client creation ([#596](https://github.com/GetStream/stream-video-js/issues/596)) ([5c3000c](https://github.com/GetStream/stream-video-js/commit/5c3000cc6fc3f8b7904609d7b11fa025b7458cad))
    - Add token creation to client ([#607](https://github.com/GetStream/stream-video-js/issues/607)) ([5f95420](https://github.com/GetStream/stream-video-js/commit/5f9542029a64ddaf6ee7912ea7b364fc74c93bf0))
  - **Bug Fixes**
    - Update README.md ([1e62478](https://github.com/GetStream/stream-video-js/commit/1e624782f97c36dd745f00fb56a2ded4e1dffa35))
    - promote prop-types to a 'dependency' in react-sdk ([#805](https://github.com/GetStream/stream-video-js/issues/805)) ([7109c9b](https://github.com/GetStream/stream-video-js/commit/7109c9b6d4087789f44ab8beb539bca495ba8f76))
    - force iceRestart offer, delay ICE restart ([#801](https://github.com/GetStream/stream-video-js/issues/801)) ([0da298f](https://github.com/GetStream/stream-video-js/commit/0da298faff30ddc42277444aad0d40a635fafb0b)), closes [#787](https://github.com/GetStream/stream-video-js/issues/787)
    - version.ts override ([4238936](https://github.com/GetStream/stream-video-js/commit/4238936ec5d24c4ec1ce2147eb4ac2d7b74935ca))
    - Attempt to recover Publisher PeerConnection ([#787](https://github.com/GetStream/stream-video-js/issues/787)) ([0ac2b58](https://github.com/GetStream/stream-video-js/commit/0ac2b5834fba01c01a5d7d0589ce42a5940643af))
    - Heuristic announcement of track mid ([#785](https://github.com/GetStream/stream-video-js/issues/785)) ([21c1da7](https://github.com/GetStream/stream-video-js/commit/21c1da74a7b1691ccea6cad360dd9e18fa357b2d))
    - promise rejection on call leave ([#767](https://github.com/GetStream/stream-video-js/issues/767)) ([4b9fb95](https://github.com/GetStream/stream-video-js/commit/4b9fb959649126594855a1699058da907d7b5832))
    - restore CallUserMuted event ([#759](https://github.com/GetStream/stream-video-js/issues/759)) ([caf43bb](https://github.com/GetStream/stream-video-js/commit/caf43bb0a8246aeb9c94ea2e0cc3d32e9a43fef1))
    - wait for connection ok for all API requests ([#752](https://github.com/GetStream/stream-video-js/issues/752)) ([82f441d](https://github.com/GetStream/stream-video-js/commit/82f441d5fb84ddc2c16fb97ca362e05fff78b4dd))
    - Reliable mid detection ([#753](https://github.com/GetStream/stream-video-js/issues/753)) ([d602574](https://github.com/GetStream/stream-video-js/commit/d6025740f46db413b5c040cb9af145cfa9be4bf1))
    - prevent double publishStream invocation ([#749](https://github.com/GetStream/stream-video-js/issues/749)) ([9e3c22f](https://github.com/GetStream/stream-video-js/commit/9e3c22fd37d8dc00d275e8b69f9cd18f67e366fe))
    - safeguard against potential race conditions during join-flow ([#741](https://github.com/GetStream/stream-video-js/issues/741)) ([54f1ef6](https://github.com/GetStream/stream-video-js/commit/54f1ef636d3c46b29c538a8c2c7bc5031fde43c9))
    - dont use window search in react native ([4883512](https://github.com/GetStream/stream-video-js/commit/4883512692bf6626b5ac9df6e80384843ec0917d))
    - navigate to incoming call screen when push notification is tapped ([#697](https://github.com/GetStream/stream-video-js/issues/697)) ([85488a2](https://github.com/GetStream/stream-video-js/commit/85488a213abb0482c7aedefb5c3aa999131c746a))
    - proper media stream disposal for rn webrtc ([#682](https://github.com/GetStream/stream-video-js/issues/682)) ([8879bac](https://github.com/GetStream/stream-video-js/commit/8879bac82080232928b78316fdb452bbc3c79fbc))
    - Sentry import ([#677](https://github.com/GetStream/stream-video-js/issues/677)) ([0c52428](https://github.com/GetStream/stream-video-js/commit/0c52428053b4f025b51e6abea911e4bb89c6bd55))
    - **client:** do not allow to re-join left call ([#646](https://github.com/GetStream/stream-video-js/issues/646)) ([cbbbdfd](https://github.com/GetStream/stream-video-js/commit/cbbbdfd026c13673f98ccb50e8ee84140eec64b6))
    - do not send ring to backend if call was not created by the user ([#645](https://github.com/GetStream/stream-video-js/issues/645)) ([1fa8ffb](https://github.com/GetStream/stream-video-js/commit/1fa8ffbb7373e9eff497bfe1ce48a970aedc0d9d))
    - prevent misleading "stop publish" log messages upon call instantiation ([#629](https://github.com/GetStream/stream-video-js/issues/629)) ([af40939](https://github.com/GetStream/stream-video-js/commit/af4093966c408d37fbf59c4c8fafd22756aa8888))
    - adjustments to the new egress response structure ([#595](https://github.com/GetStream/stream-video-js/issues/595)) ([3b3edea](https://github.com/GetStream/stream-video-js/commit/3b3edea7d032a50cb0757c6b46114e8009ae56fc))
    - use and save toggled dtx to sdp and remove empty lines when munging ([#597](https://github.com/GetStream/stream-video-js/issues/597)) ([3971276](https://github.com/GetStream/stream-video-js/commit/39712764ce7ac30557ef36ef7f736f2a0a5728b5))
- `@stream-io/video-react-bindings` updated to version `0.1.13`

### ⚠ BREAKING CHANGES

- Server-side participant pinning (#881)

### Features

- Server-side participant pinning ([#881](https://github.com/GetStream/stream-video-js/issues/881)) ([72829f1](https://github.com/GetStream/stream-video-js/commit/72829f1caf5b9c719d063a7e5175b7aa7431cd71))

### [0.1.18](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.17...@stream-io/video-react-sdk-0.1.18) (2023-08-04)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
  - **Features**
    - Trigger breaking change for
    - Update readme ([9e172f3](https://github.com/GetStream/stream-video-js/commit/9e172f3f72c4da6b24bb19193f70896435c50877))
    - take the location-hint on SDK init ([#799](https://github.com/GetStream/stream-video-js/issues/799)) ([ee5b170](https://github.com/GetStream/stream-video-js/commit/ee5b170337278a7063a368790f46b270647abf71))
    - fix version problem ([096425b](https://github.com/GetStream/stream-video-js/commit/096425bbcb6fcc06a566458dc6bd8431183d31d8))
    - SDK version header ([#790](https://github.com/GetStream/stream-video-js/issues/790)) ([6c662db](https://github.com/GetStream/stream-video-js/commit/6c662db59321db4060b5499d8eaad8a18b1eaf6c))
    - reconnection flow support for react-native ([#746](https://github.com/GetStream/stream-video-js/issues/746)) ([8677317](https://github.com/GetStream/stream-video-js/commit/86773172cd6e9c77940645302cc80b138ecc090a))
    - respect user_session_id in call.session events ([#766](https://github.com/GetStream/stream-video-js/issues/766)) ([18c6ae0](https://github.com/GetStream/stream-video-js/commit/18c6ae0ea47060e18b3462c7a6a04cad59f5f94b))
    - Remove ringing flag from call client ([#755](https://github.com/GetStream/stream-video-js/issues/755)) ([b78c605](https://github.com/GetStream/stream-video-js/commit/b78c60500e06b39fb4dce623bde6f7b10acdd8c1)), closes [/github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt#L82](https://github.com/GetStream//github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt/issues/L82)
    - stop tracking permission requests in Call state ([#744](https://github.com/GetStream/stream-video-js/issues/744)) ([b330df3](https://github.com/GetStream/stream-video-js/commit/b330df39d9dce34d9e5a1a7ec58acb0a905ee07b))
    - SFU Session Migration and Graceful Shutdown ([#603](https://github.com/GetStream/stream-video-js/issues/603)) ([943169b](https://github.com/GetStream/stream-video-js/commit/943169bd2b7b9e138bcaf387cf72eb3fa0f23533))
    - Change sendEvent signature ([#734](https://github.com/GetStream/stream-video-js/issues/734)) ([284c8c2](https://github.com/GetStream/stream-video-js/commit/284c8c2165129852ccf9fd7d8baad37f43d22a17))
    - Add user that mutes others in `CallUserMuted` event ([#704](https://github.com/GetStream/stream-video-js/issues/704)) ([f57fbbd](https://github.com/GetStream/stream-video-js/commit/f57fbbdcf9002add174aceba191211f3884cdc62))
    - **react-native:** send device and os info from the SDK ([#690](https://github.com/GetStream/stream-video-js/issues/690)) ([deb1a28](https://github.com/GetStream/stream-video-js/commit/deb1a28a4a029d988d11970608f00da8b327a02d))
    - Add `CallUserMuted` event ([#699](https://github.com/GetStream/stream-video-js/issues/699)) ([41a09e2](https://github.com/GetStream/stream-video-js/commit/41a09e257a9a8cd9b1b45551f35cebb3cd7a048b))
    - Custom logger example ([#669](https://github.com/GetStream/stream-video-js/issues/669)) ([208aed9](https://github.com/GetStream/stream-video-js/commit/208aed9f82dcbf5f9ffdf299c4672af855af344a))
    - **react-native:** push notification for android ([#626](https://github.com/GetStream/stream-video-js/issues/626)) ([ec2e439](https://github.com/GetStream/stream-video-js/commit/ec2e4390cb724091352ba774c55ad2245ace2955))
    - Logging ([#654](https://github.com/GetStream/stream-video-js/issues/654)) ([30fc8f2](https://github.com/GetStream/stream-video-js/commit/30fc8f28e2f5829247256f24b040ea4a10336186))
    - Make it possible to provide user and token in StreamVideoClient… ([#631](https://github.com/GetStream/stream-video-js/issues/631)) ([93f9b03](https://github.com/GetStream/stream-video-js/commit/93f9b03313ac74179f1d93b513ea4de306312291))
    - add audio room demo app ([#572](https://github.com/GetStream/stream-video-js/issues/572)) ([77f7b65](https://github.com/GetStream/stream-video-js/commit/77f7b6596047d59e10c8e58abad38c4f48cc162f))
    - User connect and types ([#627](https://github.com/GetStream/stream-video-js/issues/627)) ([721ef61](https://github.com/GetStream/stream-video-js/commit/721ef611374540ef570a516009c78d58ce4f5360))
    - **react-native:** support reconnection flow ([#458](https://github.com/GetStream/stream-video-js/issues/458)) ([89f2dda](https://github.com/GetStream/stream-video-js/commit/89f2ddafd1397d91f8ddea5a3c69dd62ae027313))
    - StreamCall signature, video client creation ([#596](https://github.com/GetStream/stream-video-js/issues/596)) ([5c3000c](https://github.com/GetStream/stream-video-js/commit/5c3000cc6fc3f8b7904609d7b11fa025b7458cad))
    - Add token creation to client ([#607](https://github.com/GetStream/stream-video-js/issues/607)) ([5f95420](https://github.com/GetStream/stream-video-js/commit/5f9542029a64ddaf6ee7912ea7b364fc74c93bf0))
  - **Bug Fixes**
    - Update README.md ([1e62478](https://github.com/GetStream/stream-video-js/commit/1e624782f97c36dd745f00fb56a2ded4e1dffa35))
    - promote prop-types to a 'dependency' in react-sdk ([#805](https://github.com/GetStream/stream-video-js/issues/805)) ([7109c9b](https://github.com/GetStream/stream-video-js/commit/7109c9b6d4087789f44ab8beb539bca495ba8f76))
    - force iceRestart offer, delay ICE restart ([#801](https://github.com/GetStream/stream-video-js/issues/801)) ([0da298f](https://github.com/GetStream/stream-video-js/commit/0da298faff30ddc42277444aad0d40a635fafb0b)), closes [#787](https://github.com/GetStream/stream-video-js/issues/787)
    - version.ts override ([4238936](https://github.com/GetStream/stream-video-js/commit/4238936ec5d24c4ec1ce2147eb4ac2d7b74935ca))
    - Attempt to recover Publisher PeerConnection ([#787](https://github.com/GetStream/stream-video-js/issues/787)) ([0ac2b58](https://github.com/GetStream/stream-video-js/commit/0ac2b5834fba01c01a5d7d0589ce42a5940643af))
    - Heuristic announcement of track mid ([#785](https://github.com/GetStream/stream-video-js/issues/785)) ([21c1da7](https://github.com/GetStream/stream-video-js/commit/21c1da74a7b1691ccea6cad360dd9e18fa357b2d))
    - promise rejection on call leave ([#767](https://github.com/GetStream/stream-video-js/issues/767)) ([4b9fb95](https://github.com/GetStream/stream-video-js/commit/4b9fb959649126594855a1699058da907d7b5832))
    - restore CallUserMuted event ([#759](https://github.com/GetStream/stream-video-js/issues/759)) ([caf43bb](https://github.com/GetStream/stream-video-js/commit/caf43bb0a8246aeb9c94ea2e0cc3d32e9a43fef1))
    - wait for connection ok for all API requests ([#752](https://github.com/GetStream/stream-video-js/issues/752)) ([82f441d](https://github.com/GetStream/stream-video-js/commit/82f441d5fb84ddc2c16fb97ca362e05fff78b4dd))
    - Reliable mid detection ([#753](https://github.com/GetStream/stream-video-js/issues/753)) ([d602574](https://github.com/GetStream/stream-video-js/commit/d6025740f46db413b5c040cb9af145cfa9be4bf1))
    - prevent double publishStream invocation ([#749](https://github.com/GetStream/stream-video-js/issues/749)) ([9e3c22f](https://github.com/GetStream/stream-video-js/commit/9e3c22fd37d8dc00d275e8b69f9cd18f67e366fe))
    - safeguard against potential race conditions during join-flow ([#741](https://github.com/GetStream/stream-video-js/issues/741)) ([54f1ef6](https://github.com/GetStream/stream-video-js/commit/54f1ef636d3c46b29c538a8c2c7bc5031fde43c9))
    - dont use window search in react native ([4883512](https://github.com/GetStream/stream-video-js/commit/4883512692bf6626b5ac9df6e80384843ec0917d))
    - navigate to incoming call screen when push notification is tapped ([#697](https://github.com/GetStream/stream-video-js/issues/697)) ([85488a2](https://github.com/GetStream/stream-video-js/commit/85488a213abb0482c7aedefb5c3aa999131c746a))
    - proper media stream disposal for rn webrtc ([#682](https://github.com/GetStream/stream-video-js/issues/682)) ([8879bac](https://github.com/GetStream/stream-video-js/commit/8879bac82080232928b78316fdb452bbc3c79fbc))
    - Sentry import ([#677](https://github.com/GetStream/stream-video-js/issues/677)) ([0c52428](https://github.com/GetStream/stream-video-js/commit/0c52428053b4f025b51e6abea911e4bb89c6bd55))
    - **client:** do not allow to re-join left call ([#646](https://github.com/GetStream/stream-video-js/issues/646)) ([cbbbdfd](https://github.com/GetStream/stream-video-js/commit/cbbbdfd026c13673f98ccb50e8ee84140eec64b6))
    - do not send ring to backend if call was not created by the user ([#645](https://github.com/GetStream/stream-video-js/issues/645)) ([1fa8ffb](https://github.com/GetStream/stream-video-js/commit/1fa8ffbb7373e9eff497bfe1ce48a970aedc0d9d))
    - prevent misleading "stop publish" log messages upon call instantiation ([#629](https://github.com/GetStream/stream-video-js/issues/629)) ([af40939](https://github.com/GetStream/stream-video-js/commit/af4093966c408d37fbf59c4c8fafd22756aa8888))
    - adjustments to the new egress response structure ([#595](https://github.com/GetStream/stream-video-js/issues/595)) ([3b3edea](https://github.com/GetStream/stream-video-js/commit/3b3edea7d032a50cb0757c6b46114e8009ae56fc))
    - use and save toggled dtx to sdp and remove empty lines when munging ([#597](https://github.com/GetStream/stream-video-js/issues/597)) ([3971276](https://github.com/GetStream/stream-video-js/commit/39712764ce7ac30557ef36ef7f736f2a0a5728b5))
- `@stream-io/video-react-bindings` updated to version `0.1.12`

### [0.1.17](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.16...@stream-io/video-react-sdk-0.1.17) (2023-08-01)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
  - **Features**
    - Trigger breaking change for
    - Update readme ([9e172f3](https://github.com/GetStream/stream-video-js/commit/9e172f3f72c4da6b24bb19193f70896435c50877))
    - take the location-hint on SDK init ([#799](https://github.com/GetStream/stream-video-js/issues/799)) ([ee5b170](https://github.com/GetStream/stream-video-js/commit/ee5b170337278a7063a368790f46b270647abf71))
    - fix version problem ([096425b](https://github.com/GetStream/stream-video-js/commit/096425bbcb6fcc06a566458dc6bd8431183d31d8))
    - SDK version header ([#790](https://github.com/GetStream/stream-video-js/issues/790)) ([6c662db](https://github.com/GetStream/stream-video-js/commit/6c662db59321db4060b5499d8eaad8a18b1eaf6c))
    - reconnection flow support for react-native ([#746](https://github.com/GetStream/stream-video-js/issues/746)) ([8677317](https://github.com/GetStream/stream-video-js/commit/86773172cd6e9c77940645302cc80b138ecc090a))
    - respect user_session_id in call.session events ([#766](https://github.com/GetStream/stream-video-js/issues/766)) ([18c6ae0](https://github.com/GetStream/stream-video-js/commit/18c6ae0ea47060e18b3462c7a6a04cad59f5f94b))
    - Remove ringing flag from call client ([#755](https://github.com/GetStream/stream-video-js/issues/755)) ([b78c605](https://github.com/GetStream/stream-video-js/commit/b78c60500e06b39fb4dce623bde6f7b10acdd8c1)), closes [/github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt#L82](https://github.com/GetStream//github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt/issues/L82)
    - stop tracking permission requests in Call state ([#744](https://github.com/GetStream/stream-video-js/issues/744)) ([b330df3](https://github.com/GetStream/stream-video-js/commit/b330df39d9dce34d9e5a1a7ec58acb0a905ee07b))
    - SFU Session Migration and Graceful Shutdown ([#603](https://github.com/GetStream/stream-video-js/issues/603)) ([943169b](https://github.com/GetStream/stream-video-js/commit/943169bd2b7b9e138bcaf387cf72eb3fa0f23533))
    - Change sendEvent signature ([#734](https://github.com/GetStream/stream-video-js/issues/734)) ([284c8c2](https://github.com/GetStream/stream-video-js/commit/284c8c2165129852ccf9fd7d8baad37f43d22a17))
    - Add user that mutes others in `CallUserMuted` event ([#704](https://github.com/GetStream/stream-video-js/issues/704)) ([f57fbbd](https://github.com/GetStream/stream-video-js/commit/f57fbbdcf9002add174aceba191211f3884cdc62))
    - **react-native:** send device and os info from the SDK ([#690](https://github.com/GetStream/stream-video-js/issues/690)) ([deb1a28](https://github.com/GetStream/stream-video-js/commit/deb1a28a4a029d988d11970608f00da8b327a02d))
    - Add `CallUserMuted` event ([#699](https://github.com/GetStream/stream-video-js/issues/699)) ([41a09e2](https://github.com/GetStream/stream-video-js/commit/41a09e257a9a8cd9b1b45551f35cebb3cd7a048b))
    - Custom logger example ([#669](https://github.com/GetStream/stream-video-js/issues/669)) ([208aed9](https://github.com/GetStream/stream-video-js/commit/208aed9f82dcbf5f9ffdf299c4672af855af344a))
    - **react-native:** push notification for android ([#626](https://github.com/GetStream/stream-video-js/issues/626)) ([ec2e439](https://github.com/GetStream/stream-video-js/commit/ec2e4390cb724091352ba774c55ad2245ace2955))
    - Logging ([#654](https://github.com/GetStream/stream-video-js/issues/654)) ([30fc8f2](https://github.com/GetStream/stream-video-js/commit/30fc8f28e2f5829247256f24b040ea4a10336186))
    - Make it possible to provide user and token in StreamVideoClient… ([#631](https://github.com/GetStream/stream-video-js/issues/631)) ([93f9b03](https://github.com/GetStream/stream-video-js/commit/93f9b03313ac74179f1d93b513ea4de306312291))
    - add audio room demo app ([#572](https://github.com/GetStream/stream-video-js/issues/572)) ([77f7b65](https://github.com/GetStream/stream-video-js/commit/77f7b6596047d59e10c8e58abad38c4f48cc162f))
    - User connect and types ([#627](https://github.com/GetStream/stream-video-js/issues/627)) ([721ef61](https://github.com/GetStream/stream-video-js/commit/721ef611374540ef570a516009c78d58ce4f5360))
    - **react-native:** support reconnection flow ([#458](https://github.com/GetStream/stream-video-js/issues/458)) ([89f2dda](https://github.com/GetStream/stream-video-js/commit/89f2ddafd1397d91f8ddea5a3c69dd62ae027313))
    - StreamCall signature, video client creation ([#596](https://github.com/GetStream/stream-video-js/issues/596)) ([5c3000c](https://github.com/GetStream/stream-video-js/commit/5c3000cc6fc3f8b7904609d7b11fa025b7458cad))
    - Add token creation to client ([#607](https://github.com/GetStream/stream-video-js/issues/607)) ([5f95420](https://github.com/GetStream/stream-video-js/commit/5f9542029a64ddaf6ee7912ea7b364fc74c93bf0))
  - **Bug Fixes**
    - Update README.md ([1e62478](https://github.com/GetStream/stream-video-js/commit/1e624782f97c36dd745f00fb56a2ded4e1dffa35))
    - promote prop-types to a 'dependency' in react-sdk ([#805](https://github.com/GetStream/stream-video-js/issues/805)) ([7109c9b](https://github.com/GetStream/stream-video-js/commit/7109c9b6d4087789f44ab8beb539bca495ba8f76))
    - force iceRestart offer, delay ICE restart ([#801](https://github.com/GetStream/stream-video-js/issues/801)) ([0da298f](https://github.com/GetStream/stream-video-js/commit/0da298faff30ddc42277444aad0d40a635fafb0b)), closes [#787](https://github.com/GetStream/stream-video-js/issues/787)
    - version.ts override ([4238936](https://github.com/GetStream/stream-video-js/commit/4238936ec5d24c4ec1ce2147eb4ac2d7b74935ca))
    - Attempt to recover Publisher PeerConnection ([#787](https://github.com/GetStream/stream-video-js/issues/787)) ([0ac2b58](https://github.com/GetStream/stream-video-js/commit/0ac2b5834fba01c01a5d7d0589ce42a5940643af))
    - Heuristic announcement of track mid ([#785](https://github.com/GetStream/stream-video-js/issues/785)) ([21c1da7](https://github.com/GetStream/stream-video-js/commit/21c1da74a7b1691ccea6cad360dd9e18fa357b2d))
    - promise rejection on call leave ([#767](https://github.com/GetStream/stream-video-js/issues/767)) ([4b9fb95](https://github.com/GetStream/stream-video-js/commit/4b9fb959649126594855a1699058da907d7b5832))
    - restore CallUserMuted event ([#759](https://github.com/GetStream/stream-video-js/issues/759)) ([caf43bb](https://github.com/GetStream/stream-video-js/commit/caf43bb0a8246aeb9c94ea2e0cc3d32e9a43fef1))
    - wait for connection ok for all API requests ([#752](https://github.com/GetStream/stream-video-js/issues/752)) ([82f441d](https://github.com/GetStream/stream-video-js/commit/82f441d5fb84ddc2c16fb97ca362e05fff78b4dd))
    - Reliable mid detection ([#753](https://github.com/GetStream/stream-video-js/issues/753)) ([d602574](https://github.com/GetStream/stream-video-js/commit/d6025740f46db413b5c040cb9af145cfa9be4bf1))
    - prevent double publishStream invocation ([#749](https://github.com/GetStream/stream-video-js/issues/749)) ([9e3c22f](https://github.com/GetStream/stream-video-js/commit/9e3c22fd37d8dc00d275e8b69f9cd18f67e366fe))
    - safeguard against potential race conditions during join-flow ([#741](https://github.com/GetStream/stream-video-js/issues/741)) ([54f1ef6](https://github.com/GetStream/stream-video-js/commit/54f1ef636d3c46b29c538a8c2c7bc5031fde43c9))
    - dont use window search in react native ([4883512](https://github.com/GetStream/stream-video-js/commit/4883512692bf6626b5ac9df6e80384843ec0917d))
    - navigate to incoming call screen when push notification is tapped ([#697](https://github.com/GetStream/stream-video-js/issues/697)) ([85488a2](https://github.com/GetStream/stream-video-js/commit/85488a213abb0482c7aedefb5c3aa999131c746a))
    - proper media stream disposal for rn webrtc ([#682](https://github.com/GetStream/stream-video-js/issues/682)) ([8879bac](https://github.com/GetStream/stream-video-js/commit/8879bac82080232928b78316fdb452bbc3c79fbc))
    - Sentry import ([#677](https://github.com/GetStream/stream-video-js/issues/677)) ([0c52428](https://github.com/GetStream/stream-video-js/commit/0c52428053b4f025b51e6abea911e4bb89c6bd55))
    - **client:** do not allow to re-join left call ([#646](https://github.com/GetStream/stream-video-js/issues/646)) ([cbbbdfd](https://github.com/GetStream/stream-video-js/commit/cbbbdfd026c13673f98ccb50e8ee84140eec64b6))
    - do not send ring to backend if call was not created by the user ([#645](https://github.com/GetStream/stream-video-js/issues/645)) ([1fa8ffb](https://github.com/GetStream/stream-video-js/commit/1fa8ffbb7373e9eff497bfe1ce48a970aedc0d9d))
    - prevent misleading "stop publish" log messages upon call instantiation ([#629](https://github.com/GetStream/stream-video-js/issues/629)) ([af40939](https://github.com/GetStream/stream-video-js/commit/af4093966c408d37fbf59c4c8fafd22756aa8888))
    - adjustments to the new egress response structure ([#595](https://github.com/GetStream/stream-video-js/issues/595)) ([3b3edea](https://github.com/GetStream/stream-video-js/commit/3b3edea7d032a50cb0757c6b46114e8009ae56fc))
    - use and save toggled dtx to sdp and remove empty lines when munging ([#597](https://github.com/GetStream/stream-video-js/issues/597)) ([3971276](https://github.com/GetStream/stream-video-js/commit/39712764ce7ac30557ef36ef7f736f2a0a5728b5))
- `@stream-io/video-react-bindings` updated to version `0.1.11`

### [0.1.16](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.15...@stream-io/video-react-sdk-0.1.16) (2023-08-01)

### Documentation

- add prop description to client and call prop of StreamVideo and StreamCall ([#873](https://github.com/GetStream/stream-video-js/issues/873)) ([4d4a2b8](https://github.com/GetStream/stream-video-js/commit/4d4a2b81506af9cf7e81a4925cabc4429f32b401))
- adjust Quickstart ([#872](https://github.com/GetStream/stream-video-js/issues/872)) ([42637a0](https://github.com/GetStream/stream-video-js/commit/42637a06c1b828ebd9285296be5a32a509c6c624))
- rewrite video-calling tutorial ([#866](https://github.com/GetStream/stream-video-js/issues/866)) ([c16d0a2](https://github.com/GetStream/stream-video-js/commit/c16d0a283b005a77dfbcbb3bb7c9946dcc501094))

### [0.1.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.14...@stream-io/video-react-sdk-0.1.15) (2023-07-28)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
  - **Features**
    - Trigger breaking change for
    - Update readme ([9e172f3](https://github.com/GetStream/stream-video-js/commit/9e172f3f72c4da6b24bb19193f70896435c50877))
    - take the location-hint on SDK init ([#799](https://github.com/GetStream/stream-video-js/issues/799)) ([ee5b170](https://github.com/GetStream/stream-video-js/commit/ee5b170337278a7063a368790f46b270647abf71))
    - fix version problem ([096425b](https://github.com/GetStream/stream-video-js/commit/096425bbcb6fcc06a566458dc6bd8431183d31d8))
    - SDK version header ([#790](https://github.com/GetStream/stream-video-js/issues/790)) ([6c662db](https://github.com/GetStream/stream-video-js/commit/6c662db59321db4060b5499d8eaad8a18b1eaf6c))
    - reconnection flow support for react-native ([#746](https://github.com/GetStream/stream-video-js/issues/746)) ([8677317](https://github.com/GetStream/stream-video-js/commit/86773172cd6e9c77940645302cc80b138ecc090a))
    - respect user_session_id in call.session events ([#766](https://github.com/GetStream/stream-video-js/issues/766)) ([18c6ae0](https://github.com/GetStream/stream-video-js/commit/18c6ae0ea47060e18b3462c7a6a04cad59f5f94b))
    - Remove ringing flag from call client ([#755](https://github.com/GetStream/stream-video-js/issues/755)) ([b78c605](https://github.com/GetStream/stream-video-js/commit/b78c60500e06b39fb4dce623bde6f7b10acdd8c1)), closes [/github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt#L82](https://github.com/GetStream//github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt/issues/L82)
    - stop tracking permission requests in Call state ([#744](https://github.com/GetStream/stream-video-js/issues/744)) ([b330df3](https://github.com/GetStream/stream-video-js/commit/b330df39d9dce34d9e5a1a7ec58acb0a905ee07b))
    - SFU Session Migration and Graceful Shutdown ([#603](https://github.com/GetStream/stream-video-js/issues/603)) ([943169b](https://github.com/GetStream/stream-video-js/commit/943169bd2b7b9e138bcaf387cf72eb3fa0f23533))
    - Change sendEvent signature ([#734](https://github.com/GetStream/stream-video-js/issues/734)) ([284c8c2](https://github.com/GetStream/stream-video-js/commit/284c8c2165129852ccf9fd7d8baad37f43d22a17))
    - Add user that mutes others in `CallUserMuted` event ([#704](https://github.com/GetStream/stream-video-js/issues/704)) ([f57fbbd](https://github.com/GetStream/stream-video-js/commit/f57fbbdcf9002add174aceba191211f3884cdc62))
    - **react-native:** send device and os info from the SDK ([#690](https://github.com/GetStream/stream-video-js/issues/690)) ([deb1a28](https://github.com/GetStream/stream-video-js/commit/deb1a28a4a029d988d11970608f00da8b327a02d))
    - Add `CallUserMuted` event ([#699](https://github.com/GetStream/stream-video-js/issues/699)) ([41a09e2](https://github.com/GetStream/stream-video-js/commit/41a09e257a9a8cd9b1b45551f35cebb3cd7a048b))
    - Custom logger example ([#669](https://github.com/GetStream/stream-video-js/issues/669)) ([208aed9](https://github.com/GetStream/stream-video-js/commit/208aed9f82dcbf5f9ffdf299c4672af855af344a))
    - **react-native:** push notification for android ([#626](https://github.com/GetStream/stream-video-js/issues/626)) ([ec2e439](https://github.com/GetStream/stream-video-js/commit/ec2e4390cb724091352ba774c55ad2245ace2955))
    - Logging ([#654](https://github.com/GetStream/stream-video-js/issues/654)) ([30fc8f2](https://github.com/GetStream/stream-video-js/commit/30fc8f28e2f5829247256f24b040ea4a10336186))
    - Make it possible to provide user and token in StreamVideoClient… ([#631](https://github.com/GetStream/stream-video-js/issues/631)) ([93f9b03](https://github.com/GetStream/stream-video-js/commit/93f9b03313ac74179f1d93b513ea4de306312291))
    - add audio room demo app ([#572](https://github.com/GetStream/stream-video-js/issues/572)) ([77f7b65](https://github.com/GetStream/stream-video-js/commit/77f7b6596047d59e10c8e58abad38c4f48cc162f))
    - User connect and types ([#627](https://github.com/GetStream/stream-video-js/issues/627)) ([721ef61](https://github.com/GetStream/stream-video-js/commit/721ef611374540ef570a516009c78d58ce4f5360))
    - **react-native:** support reconnection flow ([#458](https://github.com/GetStream/stream-video-js/issues/458)) ([89f2dda](https://github.com/GetStream/stream-video-js/commit/89f2ddafd1397d91f8ddea5a3c69dd62ae027313))
    - StreamCall signature, video client creation ([#596](https://github.com/GetStream/stream-video-js/issues/596)) ([5c3000c](https://github.com/GetStream/stream-video-js/commit/5c3000cc6fc3f8b7904609d7b11fa025b7458cad))
    - Add token creation to client ([#607](https://github.com/GetStream/stream-video-js/issues/607)) ([5f95420](https://github.com/GetStream/stream-video-js/commit/5f9542029a64ddaf6ee7912ea7b364fc74c93bf0))
  - **Bug Fixes**
    - Update README.md ([1e62478](https://github.com/GetStream/stream-video-js/commit/1e624782f97c36dd745f00fb56a2ded4e1dffa35))
    - promote prop-types to a 'dependency' in react-sdk ([#805](https://github.com/GetStream/stream-video-js/issues/805)) ([7109c9b](https://github.com/GetStream/stream-video-js/commit/7109c9b6d4087789f44ab8beb539bca495ba8f76))
    - force iceRestart offer, delay ICE restart ([#801](https://github.com/GetStream/stream-video-js/issues/801)) ([0da298f](https://github.com/GetStream/stream-video-js/commit/0da298faff30ddc42277444aad0d40a635fafb0b)), closes [#787](https://github.com/GetStream/stream-video-js/issues/787)
    - version.ts override ([4238936](https://github.com/GetStream/stream-video-js/commit/4238936ec5d24c4ec1ce2147eb4ac2d7b74935ca))
    - Attempt to recover Publisher PeerConnection ([#787](https://github.com/GetStream/stream-video-js/issues/787)) ([0ac2b58](https://github.com/GetStream/stream-video-js/commit/0ac2b5834fba01c01a5d7d0589ce42a5940643af))
    - Heuristic announcement of track mid ([#785](https://github.com/GetStream/stream-video-js/issues/785)) ([21c1da7](https://github.com/GetStream/stream-video-js/commit/21c1da74a7b1691ccea6cad360dd9e18fa357b2d))
    - promise rejection on call leave ([#767](https://github.com/GetStream/stream-video-js/issues/767)) ([4b9fb95](https://github.com/GetStream/stream-video-js/commit/4b9fb959649126594855a1699058da907d7b5832))
    - restore CallUserMuted event ([#759](https://github.com/GetStream/stream-video-js/issues/759)) ([caf43bb](https://github.com/GetStream/stream-video-js/commit/caf43bb0a8246aeb9c94ea2e0cc3d32e9a43fef1))
    - wait for connection ok for all API requests ([#752](https://github.com/GetStream/stream-video-js/issues/752)) ([82f441d](https://github.com/GetStream/stream-video-js/commit/82f441d5fb84ddc2c16fb97ca362e05fff78b4dd))
    - Reliable mid detection ([#753](https://github.com/GetStream/stream-video-js/issues/753)) ([d602574](https://github.com/GetStream/stream-video-js/commit/d6025740f46db413b5c040cb9af145cfa9be4bf1))
    - prevent double publishStream invocation ([#749](https://github.com/GetStream/stream-video-js/issues/749)) ([9e3c22f](https://github.com/GetStream/stream-video-js/commit/9e3c22fd37d8dc00d275e8b69f9cd18f67e366fe))
    - safeguard against potential race conditions during join-flow ([#741](https://github.com/GetStream/stream-video-js/issues/741)) ([54f1ef6](https://github.com/GetStream/stream-video-js/commit/54f1ef636d3c46b29c538a8c2c7bc5031fde43c9))
    - dont use window search in react native ([4883512](https://github.com/GetStream/stream-video-js/commit/4883512692bf6626b5ac9df6e80384843ec0917d))
    - navigate to incoming call screen when push notification is tapped ([#697](https://github.com/GetStream/stream-video-js/issues/697)) ([85488a2](https://github.com/GetStream/stream-video-js/commit/85488a213abb0482c7aedefb5c3aa999131c746a))
    - proper media stream disposal for rn webrtc ([#682](https://github.com/GetStream/stream-video-js/issues/682)) ([8879bac](https://github.com/GetStream/stream-video-js/commit/8879bac82080232928b78316fdb452bbc3c79fbc))
    - Sentry import ([#677](https://github.com/GetStream/stream-video-js/issues/677)) ([0c52428](https://github.com/GetStream/stream-video-js/commit/0c52428053b4f025b51e6abea911e4bb89c6bd55))
    - **client:** do not allow to re-join left call ([#646](https://github.com/GetStream/stream-video-js/issues/646)) ([cbbbdfd](https://github.com/GetStream/stream-video-js/commit/cbbbdfd026c13673f98ccb50e8ee84140eec64b6))
    - do not send ring to backend if call was not created by the user ([#645](https://github.com/GetStream/stream-video-js/issues/645)) ([1fa8ffb](https://github.com/GetStream/stream-video-js/commit/1fa8ffbb7373e9eff497bfe1ce48a970aedc0d9d))
    - prevent misleading "stop publish" log messages upon call instantiation ([#629](https://github.com/GetStream/stream-video-js/issues/629)) ([af40939](https://github.com/GetStream/stream-video-js/commit/af4093966c408d37fbf59c4c8fafd22756aa8888))
    - adjustments to the new egress response structure ([#595](https://github.com/GetStream/stream-video-js/issues/595)) ([3b3edea](https://github.com/GetStream/stream-video-js/commit/3b3edea7d032a50cb0757c6b46114e8009ae56fc))
    - use and save toggled dtx to sdp and remove empty lines when munging ([#597](https://github.com/GetStream/stream-video-js/issues/597)) ([3971276](https://github.com/GetStream/stream-video-js/commit/39712764ce7ac30557ef36ef7f736f2a0a5728b5))
- `@stream-io/video-react-bindings` updated to version `0.1.10`

### Bug Fixes

- set initial device state regardless of call state ([#869](https://github.com/GetStream/stream-video-js/issues/869)) ([3c3cb29](https://github.com/GetStream/stream-video-js/commit/3c3cb29e5585e30b0eacc4b0ecb7bab2e075c111))

### Documentation

- **react-native:** UI Cookbook - Connection Quality Indicator ([#861](https://github.com/GetStream/stream-video-js/issues/861)) ([f9fc8fc](https://github.com/GetStream/stream-video-js/commit/f9fc8fc9653f29721989a52fd888b3db99b41cea))

### [0.1.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.13...@stream-io/video-react-sdk-0.1.14) (2023-07-27)

### Documentation

- Update audio room tutorial to support strict mode ([#840](https://github.com/GetStream/stream-video-js/issues/840)) ([9aec392](https://github.com/GetStream/stream-video-js/commit/9aec392ec4a44fb0c1eaee00c19568f01d7b3da9))

### [0.1.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.12...@stream-io/video-react-sdk-0.1.13) (2023-07-27)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
  - **Features**
    - Trigger breaking change for
    - Update readme ([9e172f3](https://github.com/GetStream/stream-video-js/commit/9e172f3f72c4da6b24bb19193f70896435c50877))
    - take the location-hint on SDK init ([#799](https://github.com/GetStream/stream-video-js/issues/799)) ([ee5b170](https://github.com/GetStream/stream-video-js/commit/ee5b170337278a7063a368790f46b270647abf71))
    - fix version problem ([096425b](https://github.com/GetStream/stream-video-js/commit/096425bbcb6fcc06a566458dc6bd8431183d31d8))
    - SDK version header ([#790](https://github.com/GetStream/stream-video-js/issues/790)) ([6c662db](https://github.com/GetStream/stream-video-js/commit/6c662db59321db4060b5499d8eaad8a18b1eaf6c))
    - reconnection flow support for react-native ([#746](https://github.com/GetStream/stream-video-js/issues/746)) ([8677317](https://github.com/GetStream/stream-video-js/commit/86773172cd6e9c77940645302cc80b138ecc090a))
    - respect user_session_id in call.session events ([#766](https://github.com/GetStream/stream-video-js/issues/766)) ([18c6ae0](https://github.com/GetStream/stream-video-js/commit/18c6ae0ea47060e18b3462c7a6a04cad59f5f94b))
    - Remove ringing flag from call client ([#755](https://github.com/GetStream/stream-video-js/issues/755)) ([b78c605](https://github.com/GetStream/stream-video-js/commit/b78c60500e06b39fb4dce623bde6f7b10acdd8c1)), closes [/github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt#L82](https://github.com/GetStream//github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt/issues/L82)
    - stop tracking permission requests in Call state ([#744](https://github.com/GetStream/stream-video-js/issues/744)) ([b330df3](https://github.com/GetStream/stream-video-js/commit/b330df39d9dce34d9e5a1a7ec58acb0a905ee07b))
    - SFU Session Migration and Graceful Shutdown ([#603](https://github.com/GetStream/stream-video-js/issues/603)) ([943169b](https://github.com/GetStream/stream-video-js/commit/943169bd2b7b9e138bcaf387cf72eb3fa0f23533))
    - Change sendEvent signature ([#734](https://github.com/GetStream/stream-video-js/issues/734)) ([284c8c2](https://github.com/GetStream/stream-video-js/commit/284c8c2165129852ccf9fd7d8baad37f43d22a17))
    - Add user that mutes others in `CallUserMuted` event ([#704](https://github.com/GetStream/stream-video-js/issues/704)) ([f57fbbd](https://github.com/GetStream/stream-video-js/commit/f57fbbdcf9002add174aceba191211f3884cdc62))
    - **react-native:** send device and os info from the SDK ([#690](https://github.com/GetStream/stream-video-js/issues/690)) ([deb1a28](https://github.com/GetStream/stream-video-js/commit/deb1a28a4a029d988d11970608f00da8b327a02d))
    - Add `CallUserMuted` event ([#699](https://github.com/GetStream/stream-video-js/issues/699)) ([41a09e2](https://github.com/GetStream/stream-video-js/commit/41a09e257a9a8cd9b1b45551f35cebb3cd7a048b))
    - Custom logger example ([#669](https://github.com/GetStream/stream-video-js/issues/669)) ([208aed9](https://github.com/GetStream/stream-video-js/commit/208aed9f82dcbf5f9ffdf299c4672af855af344a))
    - **react-native:** push notification for android ([#626](https://github.com/GetStream/stream-video-js/issues/626)) ([ec2e439](https://github.com/GetStream/stream-video-js/commit/ec2e4390cb724091352ba774c55ad2245ace2955))
    - Logging ([#654](https://github.com/GetStream/stream-video-js/issues/654)) ([30fc8f2](https://github.com/GetStream/stream-video-js/commit/30fc8f28e2f5829247256f24b040ea4a10336186))
    - Make it possible to provide user and token in StreamVideoClient… ([#631](https://github.com/GetStream/stream-video-js/issues/631)) ([93f9b03](https://github.com/GetStream/stream-video-js/commit/93f9b03313ac74179f1d93b513ea4de306312291))
    - add audio room demo app ([#572](https://github.com/GetStream/stream-video-js/issues/572)) ([77f7b65](https://github.com/GetStream/stream-video-js/commit/77f7b6596047d59e10c8e58abad38c4f48cc162f))
    - User connect and types ([#627](https://github.com/GetStream/stream-video-js/issues/627)) ([721ef61](https://github.com/GetStream/stream-video-js/commit/721ef611374540ef570a516009c78d58ce4f5360))
    - **react-native:** support reconnection flow ([#458](https://github.com/GetStream/stream-video-js/issues/458)) ([89f2dda](https://github.com/GetStream/stream-video-js/commit/89f2ddafd1397d91f8ddea5a3c69dd62ae027313))
    - StreamCall signature, video client creation ([#596](https://github.com/GetStream/stream-video-js/issues/596)) ([5c3000c](https://github.com/GetStream/stream-video-js/commit/5c3000cc6fc3f8b7904609d7b11fa025b7458cad))
    - Add token creation to client ([#607](https://github.com/GetStream/stream-video-js/issues/607)) ([5f95420](https://github.com/GetStream/stream-video-js/commit/5f9542029a64ddaf6ee7912ea7b364fc74c93bf0))
  - **Bug Fixes**
    - Update README.md ([1e62478](https://github.com/GetStream/stream-video-js/commit/1e624782f97c36dd745f00fb56a2ded4e1dffa35))
    - promote prop-types to a 'dependency' in react-sdk ([#805](https://github.com/GetStream/stream-video-js/issues/805)) ([7109c9b](https://github.com/GetStream/stream-video-js/commit/7109c9b6d4087789f44ab8beb539bca495ba8f76))
    - force iceRestart offer, delay ICE restart ([#801](https://github.com/GetStream/stream-video-js/issues/801)) ([0da298f](https://github.com/GetStream/stream-video-js/commit/0da298faff30ddc42277444aad0d40a635fafb0b)), closes [#787](https://github.com/GetStream/stream-video-js/issues/787)
    - version.ts override ([4238936](https://github.com/GetStream/stream-video-js/commit/4238936ec5d24c4ec1ce2147eb4ac2d7b74935ca))
    - Attempt to recover Publisher PeerConnection ([#787](https://github.com/GetStream/stream-video-js/issues/787)) ([0ac2b58](https://github.com/GetStream/stream-video-js/commit/0ac2b5834fba01c01a5d7d0589ce42a5940643af))
    - Heuristic announcement of track mid ([#785](https://github.com/GetStream/stream-video-js/issues/785)) ([21c1da7](https://github.com/GetStream/stream-video-js/commit/21c1da74a7b1691ccea6cad360dd9e18fa357b2d))
    - promise rejection on call leave ([#767](https://github.com/GetStream/stream-video-js/issues/767)) ([4b9fb95](https://github.com/GetStream/stream-video-js/commit/4b9fb959649126594855a1699058da907d7b5832))
    - restore CallUserMuted event ([#759](https://github.com/GetStream/stream-video-js/issues/759)) ([caf43bb](https://github.com/GetStream/stream-video-js/commit/caf43bb0a8246aeb9c94ea2e0cc3d32e9a43fef1))
    - wait for connection ok for all API requests ([#752](https://github.com/GetStream/stream-video-js/issues/752)) ([82f441d](https://github.com/GetStream/stream-video-js/commit/82f441d5fb84ddc2c16fb97ca362e05fff78b4dd))
    - Reliable mid detection ([#753](https://github.com/GetStream/stream-video-js/issues/753)) ([d602574](https://github.com/GetStream/stream-video-js/commit/d6025740f46db413b5c040cb9af145cfa9be4bf1))
    - prevent double publishStream invocation ([#749](https://github.com/GetStream/stream-video-js/issues/749)) ([9e3c22f](https://github.com/GetStream/stream-video-js/commit/9e3c22fd37d8dc00d275e8b69f9cd18f67e366fe))
    - safeguard against potential race conditions during join-flow ([#741](https://github.com/GetStream/stream-video-js/issues/741)) ([54f1ef6](https://github.com/GetStream/stream-video-js/commit/54f1ef636d3c46b29c538a8c2c7bc5031fde43c9))
    - dont use window search in react native ([4883512](https://github.com/GetStream/stream-video-js/commit/4883512692bf6626b5ac9df6e80384843ec0917d))
    - navigate to incoming call screen when push notification is tapped ([#697](https://github.com/GetStream/stream-video-js/issues/697)) ([85488a2](https://github.com/GetStream/stream-video-js/commit/85488a213abb0482c7aedefb5c3aa999131c746a))
    - proper media stream disposal for rn webrtc ([#682](https://github.com/GetStream/stream-video-js/issues/682)) ([8879bac](https://github.com/GetStream/stream-video-js/commit/8879bac82080232928b78316fdb452bbc3c79fbc))
    - Sentry import ([#677](https://github.com/GetStream/stream-video-js/issues/677)) ([0c52428](https://github.com/GetStream/stream-video-js/commit/0c52428053b4f025b51e6abea911e4bb89c6bd55))
    - **client:** do not allow to re-join left call ([#646](https://github.com/GetStream/stream-video-js/issues/646)) ([cbbbdfd](https://github.com/GetStream/stream-video-js/commit/cbbbdfd026c13673f98ccb50e8ee84140eec64b6))
    - do not send ring to backend if call was not created by the user ([#645](https://github.com/GetStream/stream-video-js/issues/645)) ([1fa8ffb](https://github.com/GetStream/stream-video-js/commit/1fa8ffbb7373e9eff497bfe1ce48a970aedc0d9d))
    - prevent misleading "stop publish" log messages upon call instantiation ([#629](https://github.com/GetStream/stream-video-js/issues/629)) ([af40939](https://github.com/GetStream/stream-video-js/commit/af4093966c408d37fbf59c4c8fafd22756aa8888))
    - adjustments to the new egress response structure ([#595](https://github.com/GetStream/stream-video-js/issues/595)) ([3b3edea](https://github.com/GetStream/stream-video-js/commit/3b3edea7d032a50cb0757c6b46114e8009ae56fc))
    - use and save toggled dtx to sdp and remove empty lines when munging ([#597](https://github.com/GetStream/stream-video-js/issues/597)) ([3971276](https://github.com/GetStream/stream-video-js/commit/39712764ce7ac30557ef36ef7f736f2a0a5728b5))
- `@stream-io/video-react-bindings` updated to version `0.1.9`

### [0.1.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.11...@stream-io/video-react-sdk-0.1.12) (2023-07-26)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
  - **Features**
    - Trigger breaking change for
    - Update readme ([9e172f3](https://github.com/GetStream/stream-video-js/commit/9e172f3f72c4da6b24bb19193f70896435c50877))
    - take the location-hint on SDK init ([#799](https://github.com/GetStream/stream-video-js/issues/799)) ([ee5b170](https://github.com/GetStream/stream-video-js/commit/ee5b170337278a7063a368790f46b270647abf71))
    - fix version problem ([096425b](https://github.com/GetStream/stream-video-js/commit/096425bbcb6fcc06a566458dc6bd8431183d31d8))
    - SDK version header ([#790](https://github.com/GetStream/stream-video-js/issues/790)) ([6c662db](https://github.com/GetStream/stream-video-js/commit/6c662db59321db4060b5499d8eaad8a18b1eaf6c))
    - reconnection flow support for react-native ([#746](https://github.com/GetStream/stream-video-js/issues/746)) ([8677317](https://github.com/GetStream/stream-video-js/commit/86773172cd6e9c77940645302cc80b138ecc090a))
    - respect user_session_id in call.session events ([#766](https://github.com/GetStream/stream-video-js/issues/766)) ([18c6ae0](https://github.com/GetStream/stream-video-js/commit/18c6ae0ea47060e18b3462c7a6a04cad59f5f94b))
    - Remove ringing flag from call client ([#755](https://github.com/GetStream/stream-video-js/issues/755)) ([b78c605](https://github.com/GetStream/stream-video-js/commit/b78c60500e06b39fb4dce623bde6f7b10acdd8c1)), closes [/github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt#L82](https://github.com/GetStream//github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt/issues/L82)
    - stop tracking permission requests in Call state ([#744](https://github.com/GetStream/stream-video-js/issues/744)) ([b330df3](https://github.com/GetStream/stream-video-js/commit/b330df39d9dce34d9e5a1a7ec58acb0a905ee07b))
    - SFU Session Migration and Graceful Shutdown ([#603](https://github.com/GetStream/stream-video-js/issues/603)) ([943169b](https://github.com/GetStream/stream-video-js/commit/943169bd2b7b9e138bcaf387cf72eb3fa0f23533))
    - Change sendEvent signature ([#734](https://github.com/GetStream/stream-video-js/issues/734)) ([284c8c2](https://github.com/GetStream/stream-video-js/commit/284c8c2165129852ccf9fd7d8baad37f43d22a17))
    - Add user that mutes others in `CallUserMuted` event ([#704](https://github.com/GetStream/stream-video-js/issues/704)) ([f57fbbd](https://github.com/GetStream/stream-video-js/commit/f57fbbdcf9002add174aceba191211f3884cdc62))
    - **react-native:** send device and os info from the SDK ([#690](https://github.com/GetStream/stream-video-js/issues/690)) ([deb1a28](https://github.com/GetStream/stream-video-js/commit/deb1a28a4a029d988d11970608f00da8b327a02d))
    - Add `CallUserMuted` event ([#699](https://github.com/GetStream/stream-video-js/issues/699)) ([41a09e2](https://github.com/GetStream/stream-video-js/commit/41a09e257a9a8cd9b1b45551f35cebb3cd7a048b))
    - Custom logger example ([#669](https://github.com/GetStream/stream-video-js/issues/669)) ([208aed9](https://github.com/GetStream/stream-video-js/commit/208aed9f82dcbf5f9ffdf299c4672af855af344a))
    - **react-native:** push notification for android ([#626](https://github.com/GetStream/stream-video-js/issues/626)) ([ec2e439](https://github.com/GetStream/stream-video-js/commit/ec2e4390cb724091352ba774c55ad2245ace2955))
    - Logging ([#654](https://github.com/GetStream/stream-video-js/issues/654)) ([30fc8f2](https://github.com/GetStream/stream-video-js/commit/30fc8f28e2f5829247256f24b040ea4a10336186))
    - Make it possible to provide user and token in StreamVideoClient… ([#631](https://github.com/GetStream/stream-video-js/issues/631)) ([93f9b03](https://github.com/GetStream/stream-video-js/commit/93f9b03313ac74179f1d93b513ea4de306312291))
    - add audio room demo app ([#572](https://github.com/GetStream/stream-video-js/issues/572)) ([77f7b65](https://github.com/GetStream/stream-video-js/commit/77f7b6596047d59e10c8e58abad38c4f48cc162f))
    - User connect and types ([#627](https://github.com/GetStream/stream-video-js/issues/627)) ([721ef61](https://github.com/GetStream/stream-video-js/commit/721ef611374540ef570a516009c78d58ce4f5360))
    - **react-native:** support reconnection flow ([#458](https://github.com/GetStream/stream-video-js/issues/458)) ([89f2dda](https://github.com/GetStream/stream-video-js/commit/89f2ddafd1397d91f8ddea5a3c69dd62ae027313))
    - StreamCall signature, video client creation ([#596](https://github.com/GetStream/stream-video-js/issues/596)) ([5c3000c](https://github.com/GetStream/stream-video-js/commit/5c3000cc6fc3f8b7904609d7b11fa025b7458cad))
    - Add token creation to client ([#607](https://github.com/GetStream/stream-video-js/issues/607)) ([5f95420](https://github.com/GetStream/stream-video-js/commit/5f9542029a64ddaf6ee7912ea7b364fc74c93bf0))
  - **Bug Fixes**
    - Update README.md ([1e62478](https://github.com/GetStream/stream-video-js/commit/1e624782f97c36dd745f00fb56a2ded4e1dffa35))
    - promote prop-types to a 'dependency' in react-sdk ([#805](https://github.com/GetStream/stream-video-js/issues/805)) ([7109c9b](https://github.com/GetStream/stream-video-js/commit/7109c9b6d4087789f44ab8beb539bca495ba8f76))
    - force iceRestart offer, delay ICE restart ([#801](https://github.com/GetStream/stream-video-js/issues/801)) ([0da298f](https://github.com/GetStream/stream-video-js/commit/0da298faff30ddc42277444aad0d40a635fafb0b)), closes [#787](https://github.com/GetStream/stream-video-js/issues/787)
    - version.ts override ([4238936](https://github.com/GetStream/stream-video-js/commit/4238936ec5d24c4ec1ce2147eb4ac2d7b74935ca))
    - Attempt to recover Publisher PeerConnection ([#787](https://github.com/GetStream/stream-video-js/issues/787)) ([0ac2b58](https://github.com/GetStream/stream-video-js/commit/0ac2b5834fba01c01a5d7d0589ce42a5940643af))
    - Heuristic announcement of track mid ([#785](https://github.com/GetStream/stream-video-js/issues/785)) ([21c1da7](https://github.com/GetStream/stream-video-js/commit/21c1da74a7b1691ccea6cad360dd9e18fa357b2d))
    - promise rejection on call leave ([#767](https://github.com/GetStream/stream-video-js/issues/767)) ([4b9fb95](https://github.com/GetStream/stream-video-js/commit/4b9fb959649126594855a1699058da907d7b5832))
    - restore CallUserMuted event ([#759](https://github.com/GetStream/stream-video-js/issues/759)) ([caf43bb](https://github.com/GetStream/stream-video-js/commit/caf43bb0a8246aeb9c94ea2e0cc3d32e9a43fef1))
    - wait for connection ok for all API requests ([#752](https://github.com/GetStream/stream-video-js/issues/752)) ([82f441d](https://github.com/GetStream/stream-video-js/commit/82f441d5fb84ddc2c16fb97ca362e05fff78b4dd))
    - Reliable mid detection ([#753](https://github.com/GetStream/stream-video-js/issues/753)) ([d602574](https://github.com/GetStream/stream-video-js/commit/d6025740f46db413b5c040cb9af145cfa9be4bf1))
    - prevent double publishStream invocation ([#749](https://github.com/GetStream/stream-video-js/issues/749)) ([9e3c22f](https://github.com/GetStream/stream-video-js/commit/9e3c22fd37d8dc00d275e8b69f9cd18f67e366fe))
    - safeguard against potential race conditions during join-flow ([#741](https://github.com/GetStream/stream-video-js/issues/741)) ([54f1ef6](https://github.com/GetStream/stream-video-js/commit/54f1ef636d3c46b29c538a8c2c7bc5031fde43c9))
    - dont use window search in react native ([4883512](https://github.com/GetStream/stream-video-js/commit/4883512692bf6626b5ac9df6e80384843ec0917d))
    - navigate to incoming call screen when push notification is tapped ([#697](https://github.com/GetStream/stream-video-js/issues/697)) ([85488a2](https://github.com/GetStream/stream-video-js/commit/85488a213abb0482c7aedefb5c3aa999131c746a))
    - proper media stream disposal for rn webrtc ([#682](https://github.com/GetStream/stream-video-js/issues/682)) ([8879bac](https://github.com/GetStream/stream-video-js/commit/8879bac82080232928b78316fdb452bbc3c79fbc))
    - Sentry import ([#677](https://github.com/GetStream/stream-video-js/issues/677)) ([0c52428](https://github.com/GetStream/stream-video-js/commit/0c52428053b4f025b51e6abea911e4bb89c6bd55))
    - **client:** do not allow to re-join left call ([#646](https://github.com/GetStream/stream-video-js/issues/646)) ([cbbbdfd](https://github.com/GetStream/stream-video-js/commit/cbbbdfd026c13673f98ccb50e8ee84140eec64b6))
    - do not send ring to backend if call was not created by the user ([#645](https://github.com/GetStream/stream-video-js/issues/645)) ([1fa8ffb](https://github.com/GetStream/stream-video-js/commit/1fa8ffbb7373e9eff497bfe1ce48a970aedc0d9d))
    - prevent misleading "stop publish" log messages upon call instantiation ([#629](https://github.com/GetStream/stream-video-js/issues/629)) ([af40939](https://github.com/GetStream/stream-video-js/commit/af4093966c408d37fbf59c4c8fafd22756aa8888))
    - adjustments to the new egress response structure ([#595](https://github.com/GetStream/stream-video-js/issues/595)) ([3b3edea](https://github.com/GetStream/stream-video-js/commit/3b3edea7d032a50cb0757c6b46114e8009ae56fc))
    - use and save toggled dtx to sdp and remove empty lines when munging ([#597](https://github.com/GetStream/stream-video-js/issues/597)) ([3971276](https://github.com/GetStream/stream-video-js/commit/39712764ce7ac30557ef36ef7f736f2a0a5728b5))
- `@stream-io/video-react-bindings` updated to version `0.1.8`

### [0.1.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.10...@stream-io/video-react-sdk-0.1.11) (2023-07-26)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
  - **Features**
    - Trigger breaking change for
    - Update readme ([9e172f3](https://github.com/GetStream/stream-video-js/commit/9e172f3f72c4da6b24bb19193f70896435c50877))
    - take the location-hint on SDK init ([#799](https://github.com/GetStream/stream-video-js/issues/799)) ([ee5b170](https://github.com/GetStream/stream-video-js/commit/ee5b170337278a7063a368790f46b270647abf71))
    - fix version problem ([096425b](https://github.com/GetStream/stream-video-js/commit/096425bbcb6fcc06a566458dc6bd8431183d31d8))
    - SDK version header ([#790](https://github.com/GetStream/stream-video-js/issues/790)) ([6c662db](https://github.com/GetStream/stream-video-js/commit/6c662db59321db4060b5499d8eaad8a18b1eaf6c))
    - reconnection flow support for react-native ([#746](https://github.com/GetStream/stream-video-js/issues/746)) ([8677317](https://github.com/GetStream/stream-video-js/commit/86773172cd6e9c77940645302cc80b138ecc090a))
    - respect user_session_id in call.session events ([#766](https://github.com/GetStream/stream-video-js/issues/766)) ([18c6ae0](https://github.com/GetStream/stream-video-js/commit/18c6ae0ea47060e18b3462c7a6a04cad59f5f94b))
    - Remove ringing flag from call client ([#755](https://github.com/GetStream/stream-video-js/issues/755)) ([b78c605](https://github.com/GetStream/stream-video-js/commit/b78c60500e06b39fb4dce623bde6f7b10acdd8c1)), closes [/github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt#L82](https://github.com/GetStream//github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt/issues/L82)
    - stop tracking permission requests in Call state ([#744](https://github.com/GetStream/stream-video-js/issues/744)) ([b330df3](https://github.com/GetStream/stream-video-js/commit/b330df39d9dce34d9e5a1a7ec58acb0a905ee07b))
    - SFU Session Migration and Graceful Shutdown ([#603](https://github.com/GetStream/stream-video-js/issues/603)) ([943169b](https://github.com/GetStream/stream-video-js/commit/943169bd2b7b9e138bcaf387cf72eb3fa0f23533))
    - Change sendEvent signature ([#734](https://github.com/GetStream/stream-video-js/issues/734)) ([284c8c2](https://github.com/GetStream/stream-video-js/commit/284c8c2165129852ccf9fd7d8baad37f43d22a17))
    - Add user that mutes others in `CallUserMuted` event ([#704](https://github.com/GetStream/stream-video-js/issues/704)) ([f57fbbd](https://github.com/GetStream/stream-video-js/commit/f57fbbdcf9002add174aceba191211f3884cdc62))
    - **react-native:** send device and os info from the SDK ([#690](https://github.com/GetStream/stream-video-js/issues/690)) ([deb1a28](https://github.com/GetStream/stream-video-js/commit/deb1a28a4a029d988d11970608f00da8b327a02d))
    - Add `CallUserMuted` event ([#699](https://github.com/GetStream/stream-video-js/issues/699)) ([41a09e2](https://github.com/GetStream/stream-video-js/commit/41a09e257a9a8cd9b1b45551f35cebb3cd7a048b))
    - Custom logger example ([#669](https://github.com/GetStream/stream-video-js/issues/669)) ([208aed9](https://github.com/GetStream/stream-video-js/commit/208aed9f82dcbf5f9ffdf299c4672af855af344a))
    - **react-native:** push notification for android ([#626](https://github.com/GetStream/stream-video-js/issues/626)) ([ec2e439](https://github.com/GetStream/stream-video-js/commit/ec2e4390cb724091352ba774c55ad2245ace2955))
    - Logging ([#654](https://github.com/GetStream/stream-video-js/issues/654)) ([30fc8f2](https://github.com/GetStream/stream-video-js/commit/30fc8f28e2f5829247256f24b040ea4a10336186))
    - Make it possible to provide user and token in StreamVideoClient… ([#631](https://github.com/GetStream/stream-video-js/issues/631)) ([93f9b03](https://github.com/GetStream/stream-video-js/commit/93f9b03313ac74179f1d93b513ea4de306312291))
    - add audio room demo app ([#572](https://github.com/GetStream/stream-video-js/issues/572)) ([77f7b65](https://github.com/GetStream/stream-video-js/commit/77f7b6596047d59e10c8e58abad38c4f48cc162f))
    - User connect and types ([#627](https://github.com/GetStream/stream-video-js/issues/627)) ([721ef61](https://github.com/GetStream/stream-video-js/commit/721ef611374540ef570a516009c78d58ce4f5360))
    - **react-native:** support reconnection flow ([#458](https://github.com/GetStream/stream-video-js/issues/458)) ([89f2dda](https://github.com/GetStream/stream-video-js/commit/89f2ddafd1397d91f8ddea5a3c69dd62ae027313))
    - StreamCall signature, video client creation ([#596](https://github.com/GetStream/stream-video-js/issues/596)) ([5c3000c](https://github.com/GetStream/stream-video-js/commit/5c3000cc6fc3f8b7904609d7b11fa025b7458cad))
    - Add token creation to client ([#607](https://github.com/GetStream/stream-video-js/issues/607)) ([5f95420](https://github.com/GetStream/stream-video-js/commit/5f9542029a64ddaf6ee7912ea7b364fc74c93bf0))
  - **Bug Fixes**
    - Update README.md ([1e62478](https://github.com/GetStream/stream-video-js/commit/1e624782f97c36dd745f00fb56a2ded4e1dffa35))
    - promote prop-types to a 'dependency' in react-sdk ([#805](https://github.com/GetStream/stream-video-js/issues/805)) ([7109c9b](https://github.com/GetStream/stream-video-js/commit/7109c9b6d4087789f44ab8beb539bca495ba8f76))
    - force iceRestart offer, delay ICE restart ([#801](https://github.com/GetStream/stream-video-js/issues/801)) ([0da298f](https://github.com/GetStream/stream-video-js/commit/0da298faff30ddc42277444aad0d40a635fafb0b)), closes [#787](https://github.com/GetStream/stream-video-js/issues/787)
    - version.ts override ([4238936](https://github.com/GetStream/stream-video-js/commit/4238936ec5d24c4ec1ce2147eb4ac2d7b74935ca))
    - Attempt to recover Publisher PeerConnection ([#787](https://github.com/GetStream/stream-video-js/issues/787)) ([0ac2b58](https://github.com/GetStream/stream-video-js/commit/0ac2b5834fba01c01a5d7d0589ce42a5940643af))
    - Heuristic announcement of track mid ([#785](https://github.com/GetStream/stream-video-js/issues/785)) ([21c1da7](https://github.com/GetStream/stream-video-js/commit/21c1da74a7b1691ccea6cad360dd9e18fa357b2d))
    - promise rejection on call leave ([#767](https://github.com/GetStream/stream-video-js/issues/767)) ([4b9fb95](https://github.com/GetStream/stream-video-js/commit/4b9fb959649126594855a1699058da907d7b5832))
    - restore CallUserMuted event ([#759](https://github.com/GetStream/stream-video-js/issues/759)) ([caf43bb](https://github.com/GetStream/stream-video-js/commit/caf43bb0a8246aeb9c94ea2e0cc3d32e9a43fef1))
    - wait for connection ok for all API requests ([#752](https://github.com/GetStream/stream-video-js/issues/752)) ([82f441d](https://github.com/GetStream/stream-video-js/commit/82f441d5fb84ddc2c16fb97ca362e05fff78b4dd))
    - Reliable mid detection ([#753](https://github.com/GetStream/stream-video-js/issues/753)) ([d602574](https://github.com/GetStream/stream-video-js/commit/d6025740f46db413b5c040cb9af145cfa9be4bf1))
    - prevent double publishStream invocation ([#749](https://github.com/GetStream/stream-video-js/issues/749)) ([9e3c22f](https://github.com/GetStream/stream-video-js/commit/9e3c22fd37d8dc00d275e8b69f9cd18f67e366fe))
    - safeguard against potential race conditions during join-flow ([#741](https://github.com/GetStream/stream-video-js/issues/741)) ([54f1ef6](https://github.com/GetStream/stream-video-js/commit/54f1ef636d3c46b29c538a8c2c7bc5031fde43c9))
    - dont use window search in react native ([4883512](https://github.com/GetStream/stream-video-js/commit/4883512692bf6626b5ac9df6e80384843ec0917d))
    - navigate to incoming call screen when push notification is tapped ([#697](https://github.com/GetStream/stream-video-js/issues/697)) ([85488a2](https://github.com/GetStream/stream-video-js/commit/85488a213abb0482c7aedefb5c3aa999131c746a))
    - proper media stream disposal for rn webrtc ([#682](https://github.com/GetStream/stream-video-js/issues/682)) ([8879bac](https://github.com/GetStream/stream-video-js/commit/8879bac82080232928b78316fdb452bbc3c79fbc))
    - Sentry import ([#677](https://github.com/GetStream/stream-video-js/issues/677)) ([0c52428](https://github.com/GetStream/stream-video-js/commit/0c52428053b4f025b51e6abea911e4bb89c6bd55))
    - **client:** do not allow to re-join left call ([#646](https://github.com/GetStream/stream-video-js/issues/646)) ([cbbbdfd](https://github.com/GetStream/stream-video-js/commit/cbbbdfd026c13673f98ccb50e8ee84140eec64b6))
    - do not send ring to backend if call was not created by the user ([#645](https://github.com/GetStream/stream-video-js/issues/645)) ([1fa8ffb](https://github.com/GetStream/stream-video-js/commit/1fa8ffbb7373e9eff497bfe1ce48a970aedc0d9d))
    - prevent misleading "stop publish" log messages upon call instantiation ([#629](https://github.com/GetStream/stream-video-js/issues/629)) ([af40939](https://github.com/GetStream/stream-video-js/commit/af4093966c408d37fbf59c4c8fafd22756aa8888))
    - adjustments to the new egress response structure ([#595](https://github.com/GetStream/stream-video-js/issues/595)) ([3b3edea](https://github.com/GetStream/stream-video-js/commit/3b3edea7d032a50cb0757c6b46114e8009ae56fc))
    - use and save toggled dtx to sdp and remove empty lines when munging ([#597](https://github.com/GetStream/stream-video-js/issues/597)) ([3971276](https://github.com/GetStream/stream-video-js/commit/39712764ce7ac30557ef36ef7f736f2a0a5728b5))
- `@stream-io/video-react-bindings` updated to version `0.1.7`

### [0.1.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.9...@stream-io/video-react-sdk-0.1.10) (2023-07-25)

### Features

- **react-native:** add translations to SDK and DF app ([#828](https://github.com/GetStream/stream-video-js/issues/828)) ([c7a7f73](https://github.com/GetStream/stream-video-js/commit/c7a7f73b5cfd9222101e4c44b6c9ec42006bcac2))

### [0.1.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.8...@stream-io/video-react-sdk-0.1.9) (2023-07-21)

### Documentation

- Fix code snippet in video calling tutorial ([dc8f8cc](https://github.com/GetStream/stream-video-js/commit/dc8f8cc58d13b32eda2c7624152470c5909698e7))

### [0.1.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.7...@stream-io/video-react-sdk-0.1.8) (2023-07-21)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
  - **Features**
    - Trigger breaking change for
    - Update readme ([9e172f3](https://github.com/GetStream/stream-video-js/commit/9e172f3f72c4da6b24bb19193f70896435c50877))
    - take the location-hint on SDK init ([#799](https://github.com/GetStream/stream-video-js/issues/799)) ([ee5b170](https://github.com/GetStream/stream-video-js/commit/ee5b170337278a7063a368790f46b270647abf71))
    - fix version problem ([096425b](https://github.com/GetStream/stream-video-js/commit/096425bbcb6fcc06a566458dc6bd8431183d31d8))
    - SDK version header ([#790](https://github.com/GetStream/stream-video-js/issues/790)) ([6c662db](https://github.com/GetStream/stream-video-js/commit/6c662db59321db4060b5499d8eaad8a18b1eaf6c))
    - reconnection flow support for react-native ([#746](https://github.com/GetStream/stream-video-js/issues/746)) ([8677317](https://github.com/GetStream/stream-video-js/commit/86773172cd6e9c77940645302cc80b138ecc090a))
    - respect user_session_id in call.session events ([#766](https://github.com/GetStream/stream-video-js/issues/766)) ([18c6ae0](https://github.com/GetStream/stream-video-js/commit/18c6ae0ea47060e18b3462c7a6a04cad59f5f94b))
    - Remove ringing flag from call client ([#755](https://github.com/GetStream/stream-video-js/issues/755)) ([b78c605](https://github.com/GetStream/stream-video-js/commit/b78c60500e06b39fb4dce623bde6f7b10acdd8c1)), closes [/github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt#L82](https://github.com/GetStream//github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt/issues/L82)
    - stop tracking permission requests in Call state ([#744](https://github.com/GetStream/stream-video-js/issues/744)) ([b330df3](https://github.com/GetStream/stream-video-js/commit/b330df39d9dce34d9e5a1a7ec58acb0a905ee07b))
    - SFU Session Migration and Graceful Shutdown ([#603](https://github.com/GetStream/stream-video-js/issues/603)) ([943169b](https://github.com/GetStream/stream-video-js/commit/943169bd2b7b9e138bcaf387cf72eb3fa0f23533))
    - Change sendEvent signature ([#734](https://github.com/GetStream/stream-video-js/issues/734)) ([284c8c2](https://github.com/GetStream/stream-video-js/commit/284c8c2165129852ccf9fd7d8baad37f43d22a17))
    - Add user that mutes others in `CallUserMuted` event ([#704](https://github.com/GetStream/stream-video-js/issues/704)) ([f57fbbd](https://github.com/GetStream/stream-video-js/commit/f57fbbdcf9002add174aceba191211f3884cdc62))
    - **react-native:** send device and os info from the SDK ([#690](https://github.com/GetStream/stream-video-js/issues/690)) ([deb1a28](https://github.com/GetStream/stream-video-js/commit/deb1a28a4a029d988d11970608f00da8b327a02d))
    - Add `CallUserMuted` event ([#699](https://github.com/GetStream/stream-video-js/issues/699)) ([41a09e2](https://github.com/GetStream/stream-video-js/commit/41a09e257a9a8cd9b1b45551f35cebb3cd7a048b))
    - Custom logger example ([#669](https://github.com/GetStream/stream-video-js/issues/669)) ([208aed9](https://github.com/GetStream/stream-video-js/commit/208aed9f82dcbf5f9ffdf299c4672af855af344a))
    - **react-native:** push notification for android ([#626](https://github.com/GetStream/stream-video-js/issues/626)) ([ec2e439](https://github.com/GetStream/stream-video-js/commit/ec2e4390cb724091352ba774c55ad2245ace2955))
    - Logging ([#654](https://github.com/GetStream/stream-video-js/issues/654)) ([30fc8f2](https://github.com/GetStream/stream-video-js/commit/30fc8f28e2f5829247256f24b040ea4a10336186))
    - Make it possible to provide user and token in StreamVideoClient… ([#631](https://github.com/GetStream/stream-video-js/issues/631)) ([93f9b03](https://github.com/GetStream/stream-video-js/commit/93f9b03313ac74179f1d93b513ea4de306312291))
    - add audio room demo app ([#572](https://github.com/GetStream/stream-video-js/issues/572)) ([77f7b65](https://github.com/GetStream/stream-video-js/commit/77f7b6596047d59e10c8e58abad38c4f48cc162f))
    - User connect and types ([#627](https://github.com/GetStream/stream-video-js/issues/627)) ([721ef61](https://github.com/GetStream/stream-video-js/commit/721ef611374540ef570a516009c78d58ce4f5360))
    - **react-native:** support reconnection flow ([#458](https://github.com/GetStream/stream-video-js/issues/458)) ([89f2dda](https://github.com/GetStream/stream-video-js/commit/89f2ddafd1397d91f8ddea5a3c69dd62ae027313))
    - StreamCall signature, video client creation ([#596](https://github.com/GetStream/stream-video-js/issues/596)) ([5c3000c](https://github.com/GetStream/stream-video-js/commit/5c3000cc6fc3f8b7904609d7b11fa025b7458cad))
    - Add token creation to client ([#607](https://github.com/GetStream/stream-video-js/issues/607)) ([5f95420](https://github.com/GetStream/stream-video-js/commit/5f9542029a64ddaf6ee7912ea7b364fc74c93bf0))
  - **Bug Fixes**
    - Update README.md ([1e62478](https://github.com/GetStream/stream-video-js/commit/1e624782f97c36dd745f00fb56a2ded4e1dffa35))
    - promote prop-types to a 'dependency' in react-sdk ([#805](https://github.com/GetStream/stream-video-js/issues/805)) ([7109c9b](https://github.com/GetStream/stream-video-js/commit/7109c9b6d4087789f44ab8beb539bca495ba8f76))
    - force iceRestart offer, delay ICE restart ([#801](https://github.com/GetStream/stream-video-js/issues/801)) ([0da298f](https://github.com/GetStream/stream-video-js/commit/0da298faff30ddc42277444aad0d40a635fafb0b)), closes [#787](https://github.com/GetStream/stream-video-js/issues/787)
    - version.ts override ([4238936](https://github.com/GetStream/stream-video-js/commit/4238936ec5d24c4ec1ce2147eb4ac2d7b74935ca))
    - Attempt to recover Publisher PeerConnection ([#787](https://github.com/GetStream/stream-video-js/issues/787)) ([0ac2b58](https://github.com/GetStream/stream-video-js/commit/0ac2b5834fba01c01a5d7d0589ce42a5940643af))
    - Heuristic announcement of track mid ([#785](https://github.com/GetStream/stream-video-js/issues/785)) ([21c1da7](https://github.com/GetStream/stream-video-js/commit/21c1da74a7b1691ccea6cad360dd9e18fa357b2d))
    - promise rejection on call leave ([#767](https://github.com/GetStream/stream-video-js/issues/767)) ([4b9fb95](https://github.com/GetStream/stream-video-js/commit/4b9fb959649126594855a1699058da907d7b5832))
    - restore CallUserMuted event ([#759](https://github.com/GetStream/stream-video-js/issues/759)) ([caf43bb](https://github.com/GetStream/stream-video-js/commit/caf43bb0a8246aeb9c94ea2e0cc3d32e9a43fef1))
    - wait for connection ok for all API requests ([#752](https://github.com/GetStream/stream-video-js/issues/752)) ([82f441d](https://github.com/GetStream/stream-video-js/commit/82f441d5fb84ddc2c16fb97ca362e05fff78b4dd))
    - Reliable mid detection ([#753](https://github.com/GetStream/stream-video-js/issues/753)) ([d602574](https://github.com/GetStream/stream-video-js/commit/d6025740f46db413b5c040cb9af145cfa9be4bf1))
    - prevent double publishStream invocation ([#749](https://github.com/GetStream/stream-video-js/issues/749)) ([9e3c22f](https://github.com/GetStream/stream-video-js/commit/9e3c22fd37d8dc00d275e8b69f9cd18f67e366fe))
    - safeguard against potential race conditions during join-flow ([#741](https://github.com/GetStream/stream-video-js/issues/741)) ([54f1ef6](https://github.com/GetStream/stream-video-js/commit/54f1ef636d3c46b29c538a8c2c7bc5031fde43c9))
    - dont use window search in react native ([4883512](https://github.com/GetStream/stream-video-js/commit/4883512692bf6626b5ac9df6e80384843ec0917d))
    - navigate to incoming call screen when push notification is tapped ([#697](https://github.com/GetStream/stream-video-js/issues/697)) ([85488a2](https://github.com/GetStream/stream-video-js/commit/85488a213abb0482c7aedefb5c3aa999131c746a))
    - proper media stream disposal for rn webrtc ([#682](https://github.com/GetStream/stream-video-js/issues/682)) ([8879bac](https://github.com/GetStream/stream-video-js/commit/8879bac82080232928b78316fdb452bbc3c79fbc))
    - Sentry import ([#677](https://github.com/GetStream/stream-video-js/issues/677)) ([0c52428](https://github.com/GetStream/stream-video-js/commit/0c52428053b4f025b51e6abea911e4bb89c6bd55))
    - **client:** do not allow to re-join left call ([#646](https://github.com/GetStream/stream-video-js/issues/646)) ([cbbbdfd](https://github.com/GetStream/stream-video-js/commit/cbbbdfd026c13673f98ccb50e8ee84140eec64b6))
    - do not send ring to backend if call was not created by the user ([#645](https://github.com/GetStream/stream-video-js/issues/645)) ([1fa8ffb](https://github.com/GetStream/stream-video-js/commit/1fa8ffbb7373e9eff497bfe1ce48a970aedc0d9d))
    - prevent misleading "stop publish" log messages upon call instantiation ([#629](https://github.com/GetStream/stream-video-js/issues/629)) ([af40939](https://github.com/GetStream/stream-video-js/commit/af4093966c408d37fbf59c4c8fafd22756aa8888))
    - adjustments to the new egress response structure ([#595](https://github.com/GetStream/stream-video-js/issues/595)) ([3b3edea](https://github.com/GetStream/stream-video-js/commit/3b3edea7d032a50cb0757c6b46114e8009ae56fc))
    - use and save toggled dtx to sdp and remove empty lines when munging ([#597](https://github.com/GetStream/stream-video-js/issues/597)) ([3971276](https://github.com/GetStream/stream-video-js/commit/39712764ce7ac30557ef36ef7f736f2a0a5728b5))
- `@stream-io/video-react-bindings` updated to version `0.1.6`

### Bug Fixes

- strict mode issue ([#740](https://github.com/GetStream/stream-video-js/issues/740)) ([c39e4e4](https://github.com/GetStream/stream-video-js/commit/c39e4e4041a2326393478ad808b2aa791d50f8ce))

### Documentation

- add backlinks to the main marketing pages ([#838](https://github.com/GetStream/stream-video-js/issues/838)) ([7374972](https://github.com/GetStream/stream-video-js/commit/7374972a93e6a6052b384a11e5883b7ccbb559ff))

### [0.1.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.6...@stream-io/video-react-sdk-0.1.7) (2023-07-21)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
  - **Features**
    - Trigger breaking change for
    - Update readme ([9e172f3](https://github.com/GetStream/stream-video-js/commit/9e172f3f72c4da6b24bb19193f70896435c50877))
    - take the location-hint on SDK init ([#799](https://github.com/GetStream/stream-video-js/issues/799)) ([ee5b170](https://github.com/GetStream/stream-video-js/commit/ee5b170337278a7063a368790f46b270647abf71))
    - fix version problem ([096425b](https://github.com/GetStream/stream-video-js/commit/096425bbcb6fcc06a566458dc6bd8431183d31d8))
    - SDK version header ([#790](https://github.com/GetStream/stream-video-js/issues/790)) ([6c662db](https://github.com/GetStream/stream-video-js/commit/6c662db59321db4060b5499d8eaad8a18b1eaf6c))
    - reconnection flow support for react-native ([#746](https://github.com/GetStream/stream-video-js/issues/746)) ([8677317](https://github.com/GetStream/stream-video-js/commit/86773172cd6e9c77940645302cc80b138ecc090a))
    - respect user_session_id in call.session events ([#766](https://github.com/GetStream/stream-video-js/issues/766)) ([18c6ae0](https://github.com/GetStream/stream-video-js/commit/18c6ae0ea47060e18b3462c7a6a04cad59f5f94b))
    - Remove ringing flag from call client ([#755](https://github.com/GetStream/stream-video-js/issues/755)) ([b78c605](https://github.com/GetStream/stream-video-js/commit/b78c60500e06b39fb4dce623bde6f7b10acdd8c1)), closes [/github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt#L82](https://github.com/GetStream//github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt/issues/L82)
    - stop tracking permission requests in Call state ([#744](https://github.com/GetStream/stream-video-js/issues/744)) ([b330df3](https://github.com/GetStream/stream-video-js/commit/b330df39d9dce34d9e5a1a7ec58acb0a905ee07b))
    - SFU Session Migration and Graceful Shutdown ([#603](https://github.com/GetStream/stream-video-js/issues/603)) ([943169b](https://github.com/GetStream/stream-video-js/commit/943169bd2b7b9e138bcaf387cf72eb3fa0f23533))
    - Change sendEvent signature ([#734](https://github.com/GetStream/stream-video-js/issues/734)) ([284c8c2](https://github.com/GetStream/stream-video-js/commit/284c8c2165129852ccf9fd7d8baad37f43d22a17))
    - Add user that mutes others in `CallUserMuted` event ([#704](https://github.com/GetStream/stream-video-js/issues/704)) ([f57fbbd](https://github.com/GetStream/stream-video-js/commit/f57fbbdcf9002add174aceba191211f3884cdc62))
    - **react-native:** send device and os info from the SDK ([#690](https://github.com/GetStream/stream-video-js/issues/690)) ([deb1a28](https://github.com/GetStream/stream-video-js/commit/deb1a28a4a029d988d11970608f00da8b327a02d))
    - Add `CallUserMuted` event ([#699](https://github.com/GetStream/stream-video-js/issues/699)) ([41a09e2](https://github.com/GetStream/stream-video-js/commit/41a09e257a9a8cd9b1b45551f35cebb3cd7a048b))
    - Custom logger example ([#669](https://github.com/GetStream/stream-video-js/issues/669)) ([208aed9](https://github.com/GetStream/stream-video-js/commit/208aed9f82dcbf5f9ffdf299c4672af855af344a))
    - **react-native:** push notification for android ([#626](https://github.com/GetStream/stream-video-js/issues/626)) ([ec2e439](https://github.com/GetStream/stream-video-js/commit/ec2e4390cb724091352ba774c55ad2245ace2955))
    - Logging ([#654](https://github.com/GetStream/stream-video-js/issues/654)) ([30fc8f2](https://github.com/GetStream/stream-video-js/commit/30fc8f28e2f5829247256f24b040ea4a10336186))
    - Make it possible to provide user and token in StreamVideoClient… ([#631](https://github.com/GetStream/stream-video-js/issues/631)) ([93f9b03](https://github.com/GetStream/stream-video-js/commit/93f9b03313ac74179f1d93b513ea4de306312291))
    - add audio room demo app ([#572](https://github.com/GetStream/stream-video-js/issues/572)) ([77f7b65](https://github.com/GetStream/stream-video-js/commit/77f7b6596047d59e10c8e58abad38c4f48cc162f))
    - User connect and types ([#627](https://github.com/GetStream/stream-video-js/issues/627)) ([721ef61](https://github.com/GetStream/stream-video-js/commit/721ef611374540ef570a516009c78d58ce4f5360))
    - **react-native:** support reconnection flow ([#458](https://github.com/GetStream/stream-video-js/issues/458)) ([89f2dda](https://github.com/GetStream/stream-video-js/commit/89f2ddafd1397d91f8ddea5a3c69dd62ae027313))
    - StreamCall signature, video client creation ([#596](https://github.com/GetStream/stream-video-js/issues/596)) ([5c3000c](https://github.com/GetStream/stream-video-js/commit/5c3000cc6fc3f8b7904609d7b11fa025b7458cad))
    - Add token creation to client ([#607](https://github.com/GetStream/stream-video-js/issues/607)) ([5f95420](https://github.com/GetStream/stream-video-js/commit/5f9542029a64ddaf6ee7912ea7b364fc74c93bf0))
  - **Bug Fixes**
    - Update README.md ([1e62478](https://github.com/GetStream/stream-video-js/commit/1e624782f97c36dd745f00fb56a2ded4e1dffa35))
    - promote prop-types to a 'dependency' in react-sdk ([#805](https://github.com/GetStream/stream-video-js/issues/805)) ([7109c9b](https://github.com/GetStream/stream-video-js/commit/7109c9b6d4087789f44ab8beb539bca495ba8f76))
    - force iceRestart offer, delay ICE restart ([#801](https://github.com/GetStream/stream-video-js/issues/801)) ([0da298f](https://github.com/GetStream/stream-video-js/commit/0da298faff30ddc42277444aad0d40a635fafb0b)), closes [#787](https://github.com/GetStream/stream-video-js/issues/787)
    - version.ts override ([4238936](https://github.com/GetStream/stream-video-js/commit/4238936ec5d24c4ec1ce2147eb4ac2d7b74935ca))
    - Attempt to recover Publisher PeerConnection ([#787](https://github.com/GetStream/stream-video-js/issues/787)) ([0ac2b58](https://github.com/GetStream/stream-video-js/commit/0ac2b5834fba01c01a5d7d0589ce42a5940643af))
    - Heuristic announcement of track mid ([#785](https://github.com/GetStream/stream-video-js/issues/785)) ([21c1da7](https://github.com/GetStream/stream-video-js/commit/21c1da74a7b1691ccea6cad360dd9e18fa357b2d))
    - promise rejection on call leave ([#767](https://github.com/GetStream/stream-video-js/issues/767)) ([4b9fb95](https://github.com/GetStream/stream-video-js/commit/4b9fb959649126594855a1699058da907d7b5832))
    - restore CallUserMuted event ([#759](https://github.com/GetStream/stream-video-js/issues/759)) ([caf43bb](https://github.com/GetStream/stream-video-js/commit/caf43bb0a8246aeb9c94ea2e0cc3d32e9a43fef1))
    - wait for connection ok for all API requests ([#752](https://github.com/GetStream/stream-video-js/issues/752)) ([82f441d](https://github.com/GetStream/stream-video-js/commit/82f441d5fb84ddc2c16fb97ca362e05fff78b4dd))
    - Reliable mid detection ([#753](https://github.com/GetStream/stream-video-js/issues/753)) ([d602574](https://github.com/GetStream/stream-video-js/commit/d6025740f46db413b5c040cb9af145cfa9be4bf1))
    - prevent double publishStream invocation ([#749](https://github.com/GetStream/stream-video-js/issues/749)) ([9e3c22f](https://github.com/GetStream/stream-video-js/commit/9e3c22fd37d8dc00d275e8b69f9cd18f67e366fe))
    - safeguard against potential race conditions during join-flow ([#741](https://github.com/GetStream/stream-video-js/issues/741)) ([54f1ef6](https://github.com/GetStream/stream-video-js/commit/54f1ef636d3c46b29c538a8c2c7bc5031fde43c9))
    - dont use window search in react native ([4883512](https://github.com/GetStream/stream-video-js/commit/4883512692bf6626b5ac9df6e80384843ec0917d))
    - navigate to incoming call screen when push notification is tapped ([#697](https://github.com/GetStream/stream-video-js/issues/697)) ([85488a2](https://github.com/GetStream/stream-video-js/commit/85488a213abb0482c7aedefb5c3aa999131c746a))
    - proper media stream disposal for rn webrtc ([#682](https://github.com/GetStream/stream-video-js/issues/682)) ([8879bac](https://github.com/GetStream/stream-video-js/commit/8879bac82080232928b78316fdb452bbc3c79fbc))
    - Sentry import ([#677](https://github.com/GetStream/stream-video-js/issues/677)) ([0c52428](https://github.com/GetStream/stream-video-js/commit/0c52428053b4f025b51e6abea911e4bb89c6bd55))
    - **client:** do not allow to re-join left call ([#646](https://github.com/GetStream/stream-video-js/issues/646)) ([cbbbdfd](https://github.com/GetStream/stream-video-js/commit/cbbbdfd026c13673f98ccb50e8ee84140eec64b6))
    - do not send ring to backend if call was not created by the user ([#645](https://github.com/GetStream/stream-video-js/issues/645)) ([1fa8ffb](https://github.com/GetStream/stream-video-js/commit/1fa8ffbb7373e9eff497bfe1ce48a970aedc0d9d))
    - prevent misleading "stop publish" log messages upon call instantiation ([#629](https://github.com/GetStream/stream-video-js/issues/629)) ([af40939](https://github.com/GetStream/stream-video-js/commit/af4093966c408d37fbf59c4c8fafd22756aa8888))
    - adjustments to the new egress response structure ([#595](https://github.com/GetStream/stream-video-js/issues/595)) ([3b3edea](https://github.com/GetStream/stream-video-js/commit/3b3edea7d032a50cb0757c6b46114e8009ae56fc))
    - use and save toggled dtx to sdp and remove empty lines when munging ([#597](https://github.com/GetStream/stream-video-js/issues/597)) ([3971276](https://github.com/GetStream/stream-video-js/commit/39712764ce7ac30557ef36ef7f736f2a0a5728b5))
- `@stream-io/video-react-bindings` updated to version `0.1.5`

### [0.1.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.5...@stream-io/video-react-sdk-0.1.6) (2023-07-20)

### Bug Fixes

- Apply sinkId settings in paginated grid layout ([#829](https://github.com/GetStream/stream-video-js/issues/829)) ([017996b](https://github.com/GetStream/stream-video-js/commit/017996b42c3df3faaff40c15999880e65b3e097a))

### [0.1.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.4...@stream-io/video-react-sdk-0.1.5) (2023-07-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
  - **Features**
    - Trigger breaking change for
    - Update readme ([9e172f3](https://github.com/GetStream/stream-video-js/commit/9e172f3f72c4da6b24bb19193f70896435c50877))
    - take the location-hint on SDK init ([#799](https://github.com/GetStream/stream-video-js/issues/799)) ([ee5b170](https://github.com/GetStream/stream-video-js/commit/ee5b170337278a7063a368790f46b270647abf71))
    - fix version problem ([096425b](https://github.com/GetStream/stream-video-js/commit/096425bbcb6fcc06a566458dc6bd8431183d31d8))
    - SDK version header ([#790](https://github.com/GetStream/stream-video-js/issues/790)) ([6c662db](https://github.com/GetStream/stream-video-js/commit/6c662db59321db4060b5499d8eaad8a18b1eaf6c))
    - reconnection flow support for react-native ([#746](https://github.com/GetStream/stream-video-js/issues/746)) ([8677317](https://github.com/GetStream/stream-video-js/commit/86773172cd6e9c77940645302cc80b138ecc090a))
    - respect user_session_id in call.session events ([#766](https://github.com/GetStream/stream-video-js/issues/766)) ([18c6ae0](https://github.com/GetStream/stream-video-js/commit/18c6ae0ea47060e18b3462c7a6a04cad59f5f94b))
    - Remove ringing flag from call client ([#755](https://github.com/GetStream/stream-video-js/issues/755)) ([b78c605](https://github.com/GetStream/stream-video-js/commit/b78c60500e06b39fb4dce623bde6f7b10acdd8c1)), closes [/github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt#L82](https://github.com/GetStream//github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt/issues/L82)
    - stop tracking permission requests in Call state ([#744](https://github.com/GetStream/stream-video-js/issues/744)) ([b330df3](https://github.com/GetStream/stream-video-js/commit/b330df39d9dce34d9e5a1a7ec58acb0a905ee07b))
    - SFU Session Migration and Graceful Shutdown ([#603](https://github.com/GetStream/stream-video-js/issues/603)) ([943169b](https://github.com/GetStream/stream-video-js/commit/943169bd2b7b9e138bcaf387cf72eb3fa0f23533))
    - Change sendEvent signature ([#734](https://github.com/GetStream/stream-video-js/issues/734)) ([284c8c2](https://github.com/GetStream/stream-video-js/commit/284c8c2165129852ccf9fd7d8baad37f43d22a17))
    - Add user that mutes others in `CallUserMuted` event ([#704](https://github.com/GetStream/stream-video-js/issues/704)) ([f57fbbd](https://github.com/GetStream/stream-video-js/commit/f57fbbdcf9002add174aceba191211f3884cdc62))
    - **react-native:** send device and os info from the SDK ([#690](https://github.com/GetStream/stream-video-js/issues/690)) ([deb1a28](https://github.com/GetStream/stream-video-js/commit/deb1a28a4a029d988d11970608f00da8b327a02d))
    - Add `CallUserMuted` event ([#699](https://github.com/GetStream/stream-video-js/issues/699)) ([41a09e2](https://github.com/GetStream/stream-video-js/commit/41a09e257a9a8cd9b1b45551f35cebb3cd7a048b))
    - Custom logger example ([#669](https://github.com/GetStream/stream-video-js/issues/669)) ([208aed9](https://github.com/GetStream/stream-video-js/commit/208aed9f82dcbf5f9ffdf299c4672af855af344a))
    - **react-native:** push notification for android ([#626](https://github.com/GetStream/stream-video-js/issues/626)) ([ec2e439](https://github.com/GetStream/stream-video-js/commit/ec2e4390cb724091352ba774c55ad2245ace2955))
    - Logging ([#654](https://github.com/GetStream/stream-video-js/issues/654)) ([30fc8f2](https://github.com/GetStream/stream-video-js/commit/30fc8f28e2f5829247256f24b040ea4a10336186))
    - Make it possible to provide user and token in StreamVideoClient… ([#631](https://github.com/GetStream/stream-video-js/issues/631)) ([93f9b03](https://github.com/GetStream/stream-video-js/commit/93f9b03313ac74179f1d93b513ea4de306312291))
    - add audio room demo app ([#572](https://github.com/GetStream/stream-video-js/issues/572)) ([77f7b65](https://github.com/GetStream/stream-video-js/commit/77f7b6596047d59e10c8e58abad38c4f48cc162f))
    - User connect and types ([#627](https://github.com/GetStream/stream-video-js/issues/627)) ([721ef61](https://github.com/GetStream/stream-video-js/commit/721ef611374540ef570a516009c78d58ce4f5360))
    - **react-native:** support reconnection flow ([#458](https://github.com/GetStream/stream-video-js/issues/458)) ([89f2dda](https://github.com/GetStream/stream-video-js/commit/89f2ddafd1397d91f8ddea5a3c69dd62ae027313))
    - StreamCall signature, video client creation ([#596](https://github.com/GetStream/stream-video-js/issues/596)) ([5c3000c](https://github.com/GetStream/stream-video-js/commit/5c3000cc6fc3f8b7904609d7b11fa025b7458cad))
    - Add token creation to client ([#607](https://github.com/GetStream/stream-video-js/issues/607)) ([5f95420](https://github.com/GetStream/stream-video-js/commit/5f9542029a64ddaf6ee7912ea7b364fc74c93bf0))
  - **Bug Fixes**
    - Update README.md ([1e62478](https://github.com/GetStream/stream-video-js/commit/1e624782f97c36dd745f00fb56a2ded4e1dffa35))
    - promote prop-types to a 'dependency' in react-sdk ([#805](https://github.com/GetStream/stream-video-js/issues/805)) ([7109c9b](https://github.com/GetStream/stream-video-js/commit/7109c9b6d4087789f44ab8beb539bca495ba8f76))
    - force iceRestart offer, delay ICE restart ([#801](https://github.com/GetStream/stream-video-js/issues/801)) ([0da298f](https://github.com/GetStream/stream-video-js/commit/0da298faff30ddc42277444aad0d40a635fafb0b)), closes [#787](https://github.com/GetStream/stream-video-js/issues/787)
    - version.ts override ([4238936](https://github.com/GetStream/stream-video-js/commit/4238936ec5d24c4ec1ce2147eb4ac2d7b74935ca))
    - Attempt to recover Publisher PeerConnection ([#787](https://github.com/GetStream/stream-video-js/issues/787)) ([0ac2b58](https://github.com/GetStream/stream-video-js/commit/0ac2b5834fba01c01a5d7d0589ce42a5940643af))
    - Heuristic announcement of track mid ([#785](https://github.com/GetStream/stream-video-js/issues/785)) ([21c1da7](https://github.com/GetStream/stream-video-js/commit/21c1da74a7b1691ccea6cad360dd9e18fa357b2d))
    - promise rejection on call leave ([#767](https://github.com/GetStream/stream-video-js/issues/767)) ([4b9fb95](https://github.com/GetStream/stream-video-js/commit/4b9fb959649126594855a1699058da907d7b5832))
    - restore CallUserMuted event ([#759](https://github.com/GetStream/stream-video-js/issues/759)) ([caf43bb](https://github.com/GetStream/stream-video-js/commit/caf43bb0a8246aeb9c94ea2e0cc3d32e9a43fef1))
    - wait for connection ok for all API requests ([#752](https://github.com/GetStream/stream-video-js/issues/752)) ([82f441d](https://github.com/GetStream/stream-video-js/commit/82f441d5fb84ddc2c16fb97ca362e05fff78b4dd))
    - Reliable mid detection ([#753](https://github.com/GetStream/stream-video-js/issues/753)) ([d602574](https://github.com/GetStream/stream-video-js/commit/d6025740f46db413b5c040cb9af145cfa9be4bf1))
    - prevent double publishStream invocation ([#749](https://github.com/GetStream/stream-video-js/issues/749)) ([9e3c22f](https://github.com/GetStream/stream-video-js/commit/9e3c22fd37d8dc00d275e8b69f9cd18f67e366fe))
    - safeguard against potential race conditions during join-flow ([#741](https://github.com/GetStream/stream-video-js/issues/741)) ([54f1ef6](https://github.com/GetStream/stream-video-js/commit/54f1ef636d3c46b29c538a8c2c7bc5031fde43c9))
    - dont use window search in react native ([4883512](https://github.com/GetStream/stream-video-js/commit/4883512692bf6626b5ac9df6e80384843ec0917d))
    - navigate to incoming call screen when push notification is tapped ([#697](https://github.com/GetStream/stream-video-js/issues/697)) ([85488a2](https://github.com/GetStream/stream-video-js/commit/85488a213abb0482c7aedefb5c3aa999131c746a))
    - proper media stream disposal for rn webrtc ([#682](https://github.com/GetStream/stream-video-js/issues/682)) ([8879bac](https://github.com/GetStream/stream-video-js/commit/8879bac82080232928b78316fdb452bbc3c79fbc))
    - Sentry import ([#677](https://github.com/GetStream/stream-video-js/issues/677)) ([0c52428](https://github.com/GetStream/stream-video-js/commit/0c52428053b4f025b51e6abea911e4bb89c6bd55))
    - **client:** do not allow to re-join left call ([#646](https://github.com/GetStream/stream-video-js/issues/646)) ([cbbbdfd](https://github.com/GetStream/stream-video-js/commit/cbbbdfd026c13673f98ccb50e8ee84140eec64b6))
    - do not send ring to backend if call was not created by the user ([#645](https://github.com/GetStream/stream-video-js/issues/645)) ([1fa8ffb](https://github.com/GetStream/stream-video-js/commit/1fa8ffbb7373e9eff497bfe1ce48a970aedc0d9d))
    - prevent misleading "stop publish" log messages upon call instantiation ([#629](https://github.com/GetStream/stream-video-js/issues/629)) ([af40939](https://github.com/GetStream/stream-video-js/commit/af4093966c408d37fbf59c4c8fafd22756aa8888))
    - adjustments to the new egress response structure ([#595](https://github.com/GetStream/stream-video-js/issues/595)) ([3b3edea](https://github.com/GetStream/stream-video-js/commit/3b3edea7d032a50cb0757c6b46114e8009ae56fc))
    - use and save toggled dtx to sdp and remove empty lines when munging ([#597](https://github.com/GetStream/stream-video-js/issues/597)) ([3971276](https://github.com/GetStream/stream-video-js/commit/39712764ce7ac30557ef36ef7f736f2a0a5728b5))
- `@stream-io/video-react-bindings` updated to version `0.1.4`

### [0.1.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.3...@stream-io/video-react-sdk-0.1.4) (2023-07-19)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
  - **Features**
    - Trigger breaking change for
    - Update readme ([9e172f3](https://github.com/GetStream/stream-video-js/commit/9e172f3f72c4da6b24bb19193f70896435c50877))
    - take the location-hint on SDK init ([#799](https://github.com/GetStream/stream-video-js/issues/799)) ([ee5b170](https://github.com/GetStream/stream-video-js/commit/ee5b170337278a7063a368790f46b270647abf71))
    - fix version problem ([096425b](https://github.com/GetStream/stream-video-js/commit/096425bbcb6fcc06a566458dc6bd8431183d31d8))
    - SDK version header ([#790](https://github.com/GetStream/stream-video-js/issues/790)) ([6c662db](https://github.com/GetStream/stream-video-js/commit/6c662db59321db4060b5499d8eaad8a18b1eaf6c))
    - reconnection flow support for react-native ([#746](https://github.com/GetStream/stream-video-js/issues/746)) ([8677317](https://github.com/GetStream/stream-video-js/commit/86773172cd6e9c77940645302cc80b138ecc090a))
    - respect user_session_id in call.session events ([#766](https://github.com/GetStream/stream-video-js/issues/766)) ([18c6ae0](https://github.com/GetStream/stream-video-js/commit/18c6ae0ea47060e18b3462c7a6a04cad59f5f94b))
    - Remove ringing flag from call client ([#755](https://github.com/GetStream/stream-video-js/issues/755)) ([b78c605](https://github.com/GetStream/stream-video-js/commit/b78c60500e06b39fb4dce623bde6f7b10acdd8c1)), closes [/github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt#L82](https://github.com/GetStream//github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt/issues/L82)
    - stop tracking permission requests in Call state ([#744](https://github.com/GetStream/stream-video-js/issues/744)) ([b330df3](https://github.com/GetStream/stream-video-js/commit/b330df39d9dce34d9e5a1a7ec58acb0a905ee07b))
    - SFU Session Migration and Graceful Shutdown ([#603](https://github.com/GetStream/stream-video-js/issues/603)) ([943169b](https://github.com/GetStream/stream-video-js/commit/943169bd2b7b9e138bcaf387cf72eb3fa0f23533))
    - Change sendEvent signature ([#734](https://github.com/GetStream/stream-video-js/issues/734)) ([284c8c2](https://github.com/GetStream/stream-video-js/commit/284c8c2165129852ccf9fd7d8baad37f43d22a17))
    - Add user that mutes others in `CallUserMuted` event ([#704](https://github.com/GetStream/stream-video-js/issues/704)) ([f57fbbd](https://github.com/GetStream/stream-video-js/commit/f57fbbdcf9002add174aceba191211f3884cdc62))
    - **react-native:** send device and os info from the SDK ([#690](https://github.com/GetStream/stream-video-js/issues/690)) ([deb1a28](https://github.com/GetStream/stream-video-js/commit/deb1a28a4a029d988d11970608f00da8b327a02d))
    - Add `CallUserMuted` event ([#699](https://github.com/GetStream/stream-video-js/issues/699)) ([41a09e2](https://github.com/GetStream/stream-video-js/commit/41a09e257a9a8cd9b1b45551f35cebb3cd7a048b))
    - Custom logger example ([#669](https://github.com/GetStream/stream-video-js/issues/669)) ([208aed9](https://github.com/GetStream/stream-video-js/commit/208aed9f82dcbf5f9ffdf299c4672af855af344a))
    - **react-native:** push notification for android ([#626](https://github.com/GetStream/stream-video-js/issues/626)) ([ec2e439](https://github.com/GetStream/stream-video-js/commit/ec2e4390cb724091352ba774c55ad2245ace2955))
    - Logging ([#654](https://github.com/GetStream/stream-video-js/issues/654)) ([30fc8f2](https://github.com/GetStream/stream-video-js/commit/30fc8f28e2f5829247256f24b040ea4a10336186))
    - Make it possible to provide user and token in StreamVideoClient… ([#631](https://github.com/GetStream/stream-video-js/issues/631)) ([93f9b03](https://github.com/GetStream/stream-video-js/commit/93f9b03313ac74179f1d93b513ea4de306312291))
    - add audio room demo app ([#572](https://github.com/GetStream/stream-video-js/issues/572)) ([77f7b65](https://github.com/GetStream/stream-video-js/commit/77f7b6596047d59e10c8e58abad38c4f48cc162f))
    - User connect and types ([#627](https://github.com/GetStream/stream-video-js/issues/627)) ([721ef61](https://github.com/GetStream/stream-video-js/commit/721ef611374540ef570a516009c78d58ce4f5360))
    - **react-native:** support reconnection flow ([#458](https://github.com/GetStream/stream-video-js/issues/458)) ([89f2dda](https://github.com/GetStream/stream-video-js/commit/89f2ddafd1397d91f8ddea5a3c69dd62ae027313))
    - StreamCall signature, video client creation ([#596](https://github.com/GetStream/stream-video-js/issues/596)) ([5c3000c](https://github.com/GetStream/stream-video-js/commit/5c3000cc6fc3f8b7904609d7b11fa025b7458cad))
    - Add token creation to client ([#607](https://github.com/GetStream/stream-video-js/issues/607)) ([5f95420](https://github.com/GetStream/stream-video-js/commit/5f9542029a64ddaf6ee7912ea7b364fc74c93bf0))
  - **Bug Fixes**
    - Update README.md ([1e62478](https://github.com/GetStream/stream-video-js/commit/1e624782f97c36dd745f00fb56a2ded4e1dffa35))
    - promote prop-types to a 'dependency' in react-sdk ([#805](https://github.com/GetStream/stream-video-js/issues/805)) ([7109c9b](https://github.com/GetStream/stream-video-js/commit/7109c9b6d4087789f44ab8beb539bca495ba8f76))
    - force iceRestart offer, delay ICE restart ([#801](https://github.com/GetStream/stream-video-js/issues/801)) ([0da298f](https://github.com/GetStream/stream-video-js/commit/0da298faff30ddc42277444aad0d40a635fafb0b)), closes [#787](https://github.com/GetStream/stream-video-js/issues/787)
    - version.ts override ([4238936](https://github.com/GetStream/stream-video-js/commit/4238936ec5d24c4ec1ce2147eb4ac2d7b74935ca))
    - Attempt to recover Publisher PeerConnection ([#787](https://github.com/GetStream/stream-video-js/issues/787)) ([0ac2b58](https://github.com/GetStream/stream-video-js/commit/0ac2b5834fba01c01a5d7d0589ce42a5940643af))
    - Heuristic announcement of track mid ([#785](https://github.com/GetStream/stream-video-js/issues/785)) ([21c1da7](https://github.com/GetStream/stream-video-js/commit/21c1da74a7b1691ccea6cad360dd9e18fa357b2d))
    - promise rejection on call leave ([#767](https://github.com/GetStream/stream-video-js/issues/767)) ([4b9fb95](https://github.com/GetStream/stream-video-js/commit/4b9fb959649126594855a1699058da907d7b5832))
    - restore CallUserMuted event ([#759](https://github.com/GetStream/stream-video-js/issues/759)) ([caf43bb](https://github.com/GetStream/stream-video-js/commit/caf43bb0a8246aeb9c94ea2e0cc3d32e9a43fef1))
    - wait for connection ok for all API requests ([#752](https://github.com/GetStream/stream-video-js/issues/752)) ([82f441d](https://github.com/GetStream/stream-video-js/commit/82f441d5fb84ddc2c16fb97ca362e05fff78b4dd))
    - Reliable mid detection ([#753](https://github.com/GetStream/stream-video-js/issues/753)) ([d602574](https://github.com/GetStream/stream-video-js/commit/d6025740f46db413b5c040cb9af145cfa9be4bf1))
    - prevent double publishStream invocation ([#749](https://github.com/GetStream/stream-video-js/issues/749)) ([9e3c22f](https://github.com/GetStream/stream-video-js/commit/9e3c22fd37d8dc00d275e8b69f9cd18f67e366fe))
    - safeguard against potential race conditions during join-flow ([#741](https://github.com/GetStream/stream-video-js/issues/741)) ([54f1ef6](https://github.com/GetStream/stream-video-js/commit/54f1ef636d3c46b29c538a8c2c7bc5031fde43c9))
    - dont use window search in react native ([4883512](https://github.com/GetStream/stream-video-js/commit/4883512692bf6626b5ac9df6e80384843ec0917d))
    - navigate to incoming call screen when push notification is tapped ([#697](https://github.com/GetStream/stream-video-js/issues/697)) ([85488a2](https://github.com/GetStream/stream-video-js/commit/85488a213abb0482c7aedefb5c3aa999131c746a))
    - proper media stream disposal for rn webrtc ([#682](https://github.com/GetStream/stream-video-js/issues/682)) ([8879bac](https://github.com/GetStream/stream-video-js/commit/8879bac82080232928b78316fdb452bbc3c79fbc))
    - Sentry import ([#677](https://github.com/GetStream/stream-video-js/issues/677)) ([0c52428](https://github.com/GetStream/stream-video-js/commit/0c52428053b4f025b51e6abea911e4bb89c6bd55))
    - **client:** do not allow to re-join left call ([#646](https://github.com/GetStream/stream-video-js/issues/646)) ([cbbbdfd](https://github.com/GetStream/stream-video-js/commit/cbbbdfd026c13673f98ccb50e8ee84140eec64b6))
    - do not send ring to backend if call was not created by the user ([#645](https://github.com/GetStream/stream-video-js/issues/645)) ([1fa8ffb](https://github.com/GetStream/stream-video-js/commit/1fa8ffbb7373e9eff497bfe1ce48a970aedc0d9d))
    - prevent misleading "stop publish" log messages upon call instantiation ([#629](https://github.com/GetStream/stream-video-js/issues/629)) ([af40939](https://github.com/GetStream/stream-video-js/commit/af4093966c408d37fbf59c4c8fafd22756aa8888))
    - adjustments to the new egress response structure ([#595](https://github.com/GetStream/stream-video-js/issues/595)) ([3b3edea](https://github.com/GetStream/stream-video-js/commit/3b3edea7d032a50cb0757c6b46114e8009ae56fc))
    - use and save toggled dtx to sdp and remove empty lines when munging ([#597](https://github.com/GetStream/stream-video-js/issues/597)) ([3971276](https://github.com/GetStream/stream-video-js/commit/39712764ce7ac30557ef36ef7f736f2a0a5728b5))
- `@stream-io/video-react-bindings` updated to version `0.1.3`

### [0.1.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.2...@stream-io/video-react-sdk-0.1.3) (2023-07-18)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
  - **Features**
    - Trigger breaking change for
    - Update readme ([9e172f3](https://github.com/GetStream/stream-video-js/commit/9e172f3f72c4da6b24bb19193f70896435c50877))
    - take the location-hint on SDK init ([#799](https://github.com/GetStream/stream-video-js/issues/799)) ([ee5b170](https://github.com/GetStream/stream-video-js/commit/ee5b170337278a7063a368790f46b270647abf71))
    - fix version problem ([096425b](https://github.com/GetStream/stream-video-js/commit/096425bbcb6fcc06a566458dc6bd8431183d31d8))
    - SDK version header ([#790](https://github.com/GetStream/stream-video-js/issues/790)) ([6c662db](https://github.com/GetStream/stream-video-js/commit/6c662db59321db4060b5499d8eaad8a18b1eaf6c))
    - reconnection flow support for react-native ([#746](https://github.com/GetStream/stream-video-js/issues/746)) ([8677317](https://github.com/GetStream/stream-video-js/commit/86773172cd6e9c77940645302cc80b138ecc090a))
    - respect user_session_id in call.session events ([#766](https://github.com/GetStream/stream-video-js/issues/766)) ([18c6ae0](https://github.com/GetStream/stream-video-js/commit/18c6ae0ea47060e18b3462c7a6a04cad59f5f94b))
    - Remove ringing flag from call client ([#755](https://github.com/GetStream/stream-video-js/issues/755)) ([b78c605](https://github.com/GetStream/stream-video-js/commit/b78c60500e06b39fb4dce623bde6f7b10acdd8c1)), closes [/github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt#L82](https://github.com/GetStream//github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt/issues/L82)
    - stop tracking permission requests in Call state ([#744](https://github.com/GetStream/stream-video-js/issues/744)) ([b330df3](https://github.com/GetStream/stream-video-js/commit/b330df39d9dce34d9e5a1a7ec58acb0a905ee07b))
    - SFU Session Migration and Graceful Shutdown ([#603](https://github.com/GetStream/stream-video-js/issues/603)) ([943169b](https://github.com/GetStream/stream-video-js/commit/943169bd2b7b9e138bcaf387cf72eb3fa0f23533))
    - Change sendEvent signature ([#734](https://github.com/GetStream/stream-video-js/issues/734)) ([284c8c2](https://github.com/GetStream/stream-video-js/commit/284c8c2165129852ccf9fd7d8baad37f43d22a17))
    - Add user that mutes others in `CallUserMuted` event ([#704](https://github.com/GetStream/stream-video-js/issues/704)) ([f57fbbd](https://github.com/GetStream/stream-video-js/commit/f57fbbdcf9002add174aceba191211f3884cdc62))
    - **react-native:** send device and os info from the SDK ([#690](https://github.com/GetStream/stream-video-js/issues/690)) ([deb1a28](https://github.com/GetStream/stream-video-js/commit/deb1a28a4a029d988d11970608f00da8b327a02d))
    - Add `CallUserMuted` event ([#699](https://github.com/GetStream/stream-video-js/issues/699)) ([41a09e2](https://github.com/GetStream/stream-video-js/commit/41a09e257a9a8cd9b1b45551f35cebb3cd7a048b))
    - Custom logger example ([#669](https://github.com/GetStream/stream-video-js/issues/669)) ([208aed9](https://github.com/GetStream/stream-video-js/commit/208aed9f82dcbf5f9ffdf299c4672af855af344a))
    - **react-native:** push notification for android ([#626](https://github.com/GetStream/stream-video-js/issues/626)) ([ec2e439](https://github.com/GetStream/stream-video-js/commit/ec2e4390cb724091352ba774c55ad2245ace2955))
    - Logging ([#654](https://github.com/GetStream/stream-video-js/issues/654)) ([30fc8f2](https://github.com/GetStream/stream-video-js/commit/30fc8f28e2f5829247256f24b040ea4a10336186))
    - Make it possible to provide user and token in StreamVideoClient… ([#631](https://github.com/GetStream/stream-video-js/issues/631)) ([93f9b03](https://github.com/GetStream/stream-video-js/commit/93f9b03313ac74179f1d93b513ea4de306312291))
    - add audio room demo app ([#572](https://github.com/GetStream/stream-video-js/issues/572)) ([77f7b65](https://github.com/GetStream/stream-video-js/commit/77f7b6596047d59e10c8e58abad38c4f48cc162f))
    - User connect and types ([#627](https://github.com/GetStream/stream-video-js/issues/627)) ([721ef61](https://github.com/GetStream/stream-video-js/commit/721ef611374540ef570a516009c78d58ce4f5360))
    - **react-native:** support reconnection flow ([#458](https://github.com/GetStream/stream-video-js/issues/458)) ([89f2dda](https://github.com/GetStream/stream-video-js/commit/89f2ddafd1397d91f8ddea5a3c69dd62ae027313))
    - StreamCall signature, video client creation ([#596](https://github.com/GetStream/stream-video-js/issues/596)) ([5c3000c](https://github.com/GetStream/stream-video-js/commit/5c3000cc6fc3f8b7904609d7b11fa025b7458cad))
    - Add token creation to client ([#607](https://github.com/GetStream/stream-video-js/issues/607)) ([5f95420](https://github.com/GetStream/stream-video-js/commit/5f9542029a64ddaf6ee7912ea7b364fc74c93bf0))
  - **Bug Fixes**
    - Update README.md ([1e62478](https://github.com/GetStream/stream-video-js/commit/1e624782f97c36dd745f00fb56a2ded4e1dffa35))
    - promote prop-types to a 'dependency' in react-sdk ([#805](https://github.com/GetStream/stream-video-js/issues/805)) ([7109c9b](https://github.com/GetStream/stream-video-js/commit/7109c9b6d4087789f44ab8beb539bca495ba8f76))
    - force iceRestart offer, delay ICE restart ([#801](https://github.com/GetStream/stream-video-js/issues/801)) ([0da298f](https://github.com/GetStream/stream-video-js/commit/0da298faff30ddc42277444aad0d40a635fafb0b)), closes [#787](https://github.com/GetStream/stream-video-js/issues/787)
    - version.ts override ([4238936](https://github.com/GetStream/stream-video-js/commit/4238936ec5d24c4ec1ce2147eb4ac2d7b74935ca))
    - Attempt to recover Publisher PeerConnection ([#787](https://github.com/GetStream/stream-video-js/issues/787)) ([0ac2b58](https://github.com/GetStream/stream-video-js/commit/0ac2b5834fba01c01a5d7d0589ce42a5940643af))
    - Heuristic announcement of track mid ([#785](https://github.com/GetStream/stream-video-js/issues/785)) ([21c1da7](https://github.com/GetStream/stream-video-js/commit/21c1da74a7b1691ccea6cad360dd9e18fa357b2d))
    - promise rejection on call leave ([#767](https://github.com/GetStream/stream-video-js/issues/767)) ([4b9fb95](https://github.com/GetStream/stream-video-js/commit/4b9fb959649126594855a1699058da907d7b5832))
    - restore CallUserMuted event ([#759](https://github.com/GetStream/stream-video-js/issues/759)) ([caf43bb](https://github.com/GetStream/stream-video-js/commit/caf43bb0a8246aeb9c94ea2e0cc3d32e9a43fef1))
    - wait for connection ok for all API requests ([#752](https://github.com/GetStream/stream-video-js/issues/752)) ([82f441d](https://github.com/GetStream/stream-video-js/commit/82f441d5fb84ddc2c16fb97ca362e05fff78b4dd))
    - Reliable mid detection ([#753](https://github.com/GetStream/stream-video-js/issues/753)) ([d602574](https://github.com/GetStream/stream-video-js/commit/d6025740f46db413b5c040cb9af145cfa9be4bf1))
    - prevent double publishStream invocation ([#749](https://github.com/GetStream/stream-video-js/issues/749)) ([9e3c22f](https://github.com/GetStream/stream-video-js/commit/9e3c22fd37d8dc00d275e8b69f9cd18f67e366fe))
    - safeguard against potential race conditions during join-flow ([#741](https://github.com/GetStream/stream-video-js/issues/741)) ([54f1ef6](https://github.com/GetStream/stream-video-js/commit/54f1ef636d3c46b29c538a8c2c7bc5031fde43c9))
    - dont use window search in react native ([4883512](https://github.com/GetStream/stream-video-js/commit/4883512692bf6626b5ac9df6e80384843ec0917d))
    - navigate to incoming call screen when push notification is tapped ([#697](https://github.com/GetStream/stream-video-js/issues/697)) ([85488a2](https://github.com/GetStream/stream-video-js/commit/85488a213abb0482c7aedefb5c3aa999131c746a))
    - proper media stream disposal for rn webrtc ([#682](https://github.com/GetStream/stream-video-js/issues/682)) ([8879bac](https://github.com/GetStream/stream-video-js/commit/8879bac82080232928b78316fdb452bbc3c79fbc))
    - Sentry import ([#677](https://github.com/GetStream/stream-video-js/issues/677)) ([0c52428](https://github.com/GetStream/stream-video-js/commit/0c52428053b4f025b51e6abea911e4bb89c6bd55))
    - **client:** do not allow to re-join left call ([#646](https://github.com/GetStream/stream-video-js/issues/646)) ([cbbbdfd](https://github.com/GetStream/stream-video-js/commit/cbbbdfd026c13673f98ccb50e8ee84140eec64b6))
    - do not send ring to backend if call was not created by the user ([#645](https://github.com/GetStream/stream-video-js/issues/645)) ([1fa8ffb](https://github.com/GetStream/stream-video-js/commit/1fa8ffbb7373e9eff497bfe1ce48a970aedc0d9d))
    - prevent misleading "stop publish" log messages upon call instantiation ([#629](https://github.com/GetStream/stream-video-js/issues/629)) ([af40939](https://github.com/GetStream/stream-video-js/commit/af4093966c408d37fbf59c4c8fafd22756aa8888))
    - adjustments to the new egress response structure ([#595](https://github.com/GetStream/stream-video-js/issues/595)) ([3b3edea](https://github.com/GetStream/stream-video-js/commit/3b3edea7d032a50cb0757c6b46114e8009ae56fc))
    - use and save toggled dtx to sdp and remove empty lines when munging ([#597](https://github.com/GetStream/stream-video-js/issues/597)) ([3971276](https://github.com/GetStream/stream-video-js/commit/39712764ce7ac30557ef36ef7f736f2a0a5728b5))
- `@stream-io/video-react-bindings` updated to version `0.1.2`

### [0.1.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.1...@stream-io/video-react-sdk-0.1.2) (2023-07-17)

### Features

- Trigger react-sdk release to test sample app deployment ([77abdb6](https://github.com/GetStream/stream-video-js/commit/77abdb67bafa6c33bf7b86070999f7ad9d6010df))

### [0.1.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.1.0...@stream-io/video-react-sdk-0.1.1) (2023-07-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.1.0`
  - **Features**
    - Trigger breaking change for
    - Update readme ([9e172f3](https://github.com/GetStream/stream-video-js/commit/9e172f3f72c4da6b24bb19193f70896435c50877))
    - take the location-hint on SDK init ([#799](https://github.com/GetStream/stream-video-js/issues/799)) ([ee5b170](https://github.com/GetStream/stream-video-js/commit/ee5b170337278a7063a368790f46b270647abf71))
    - fix version problem ([096425b](https://github.com/GetStream/stream-video-js/commit/096425bbcb6fcc06a566458dc6bd8431183d31d8))
    - SDK version header ([#790](https://github.com/GetStream/stream-video-js/issues/790)) ([6c662db](https://github.com/GetStream/stream-video-js/commit/6c662db59321db4060b5499d8eaad8a18b1eaf6c))
    - reconnection flow support for react-native ([#746](https://github.com/GetStream/stream-video-js/issues/746)) ([8677317](https://github.com/GetStream/stream-video-js/commit/86773172cd6e9c77940645302cc80b138ecc090a))
    - respect user_session_id in call.session events ([#766](https://github.com/GetStream/stream-video-js/issues/766)) ([18c6ae0](https://github.com/GetStream/stream-video-js/commit/18c6ae0ea47060e18b3462c7a6a04cad59f5f94b))
    - Remove ringing flag from call client ([#755](https://github.com/GetStream/stream-video-js/issues/755)) ([b78c605](https://github.com/GetStream/stream-video-js/commit/b78c60500e06b39fb4dce623bde6f7b10acdd8c1)), closes [/github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt#L82](https://github.com/GetStream//github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt/issues/L82)
    - stop tracking permission requests in Call state ([#744](https://github.com/GetStream/stream-video-js/issues/744)) ([b330df3](https://github.com/GetStream/stream-video-js/commit/b330df39d9dce34d9e5a1a7ec58acb0a905ee07b))
    - SFU Session Migration and Graceful Shutdown ([#603](https://github.com/GetStream/stream-video-js/issues/603)) ([943169b](https://github.com/GetStream/stream-video-js/commit/943169bd2b7b9e138bcaf387cf72eb3fa0f23533))
    - Change sendEvent signature ([#734](https://github.com/GetStream/stream-video-js/issues/734)) ([284c8c2](https://github.com/GetStream/stream-video-js/commit/284c8c2165129852ccf9fd7d8baad37f43d22a17))
    - Add user that mutes others in `CallUserMuted` event ([#704](https://github.com/GetStream/stream-video-js/issues/704)) ([f57fbbd](https://github.com/GetStream/stream-video-js/commit/f57fbbdcf9002add174aceba191211f3884cdc62))
    - **react-native:** send device and os info from the SDK ([#690](https://github.com/GetStream/stream-video-js/issues/690)) ([deb1a28](https://github.com/GetStream/stream-video-js/commit/deb1a28a4a029d988d11970608f00da8b327a02d))
    - Add `CallUserMuted` event ([#699](https://github.com/GetStream/stream-video-js/issues/699)) ([41a09e2](https://github.com/GetStream/stream-video-js/commit/41a09e257a9a8cd9b1b45551f35cebb3cd7a048b))
    - Custom logger example ([#669](https://github.com/GetStream/stream-video-js/issues/669)) ([208aed9](https://github.com/GetStream/stream-video-js/commit/208aed9f82dcbf5f9ffdf299c4672af855af344a))
    - **react-native:** push notification for android ([#626](https://github.com/GetStream/stream-video-js/issues/626)) ([ec2e439](https://github.com/GetStream/stream-video-js/commit/ec2e4390cb724091352ba774c55ad2245ace2955))
    - Logging ([#654](https://github.com/GetStream/stream-video-js/issues/654)) ([30fc8f2](https://github.com/GetStream/stream-video-js/commit/30fc8f28e2f5829247256f24b040ea4a10336186))
    - Make it possible to provide user and token in StreamVideoClient… ([#631](https://github.com/GetStream/stream-video-js/issues/631)) ([93f9b03](https://github.com/GetStream/stream-video-js/commit/93f9b03313ac74179f1d93b513ea4de306312291))
    - add audio room demo app ([#572](https://github.com/GetStream/stream-video-js/issues/572)) ([77f7b65](https://github.com/GetStream/stream-video-js/commit/77f7b6596047d59e10c8e58abad38c4f48cc162f))
    - User connect and types ([#627](https://github.com/GetStream/stream-video-js/issues/627)) ([721ef61](https://github.com/GetStream/stream-video-js/commit/721ef611374540ef570a516009c78d58ce4f5360))
    - **react-native:** support reconnection flow ([#458](https://github.com/GetStream/stream-video-js/issues/458)) ([89f2dda](https://github.com/GetStream/stream-video-js/commit/89f2ddafd1397d91f8ddea5a3c69dd62ae027313))
    - StreamCall signature, video client creation ([#596](https://github.com/GetStream/stream-video-js/issues/596)) ([5c3000c](https://github.com/GetStream/stream-video-js/commit/5c3000cc6fc3f8b7904609d7b11fa025b7458cad))
    - Add token creation to client ([#607](https://github.com/GetStream/stream-video-js/issues/607)) ([5f95420](https://github.com/GetStream/stream-video-js/commit/5f9542029a64ddaf6ee7912ea7b364fc74c93bf0))
  - **Bug Fixes**
    - Update README.md ([1e62478](https://github.com/GetStream/stream-video-js/commit/1e624782f97c36dd745f00fb56a2ded4e1dffa35))
    - promote prop-types to a 'dependency' in react-sdk ([#805](https://github.com/GetStream/stream-video-js/issues/805)) ([7109c9b](https://github.com/GetStream/stream-video-js/commit/7109c9b6d4087789f44ab8beb539bca495ba8f76))
    - force iceRestart offer, delay ICE restart ([#801](https://github.com/GetStream/stream-video-js/issues/801)) ([0da298f](https://github.com/GetStream/stream-video-js/commit/0da298faff30ddc42277444aad0d40a635fafb0b)), closes [#787](https://github.com/GetStream/stream-video-js/issues/787)
    - version.ts override ([4238936](https://github.com/GetStream/stream-video-js/commit/4238936ec5d24c4ec1ce2147eb4ac2d7b74935ca))
    - Attempt to recover Publisher PeerConnection ([#787](https://github.com/GetStream/stream-video-js/issues/787)) ([0ac2b58](https://github.com/GetStream/stream-video-js/commit/0ac2b5834fba01c01a5d7d0589ce42a5940643af))
    - Heuristic announcement of track mid ([#785](https://github.com/GetStream/stream-video-js/issues/785)) ([21c1da7](https://github.com/GetStream/stream-video-js/commit/21c1da74a7b1691ccea6cad360dd9e18fa357b2d))
    - promise rejection on call leave ([#767](https://github.com/GetStream/stream-video-js/issues/767)) ([4b9fb95](https://github.com/GetStream/stream-video-js/commit/4b9fb959649126594855a1699058da907d7b5832))
    - restore CallUserMuted event ([#759](https://github.com/GetStream/stream-video-js/issues/759)) ([caf43bb](https://github.com/GetStream/stream-video-js/commit/caf43bb0a8246aeb9c94ea2e0cc3d32e9a43fef1))
    - wait for connection ok for all API requests ([#752](https://github.com/GetStream/stream-video-js/issues/752)) ([82f441d](https://github.com/GetStream/stream-video-js/commit/82f441d5fb84ddc2c16fb97ca362e05fff78b4dd))
    - Reliable mid detection ([#753](https://github.com/GetStream/stream-video-js/issues/753)) ([d602574](https://github.com/GetStream/stream-video-js/commit/d6025740f46db413b5c040cb9af145cfa9be4bf1))
    - prevent double publishStream invocation ([#749](https://github.com/GetStream/stream-video-js/issues/749)) ([9e3c22f](https://github.com/GetStream/stream-video-js/commit/9e3c22fd37d8dc00d275e8b69f9cd18f67e366fe))
    - safeguard against potential race conditions during join-flow ([#741](https://github.com/GetStream/stream-video-js/issues/741)) ([54f1ef6](https://github.com/GetStream/stream-video-js/commit/54f1ef636d3c46b29c538a8c2c7bc5031fde43c9))
    - dont use window search in react native ([4883512](https://github.com/GetStream/stream-video-js/commit/4883512692bf6626b5ac9df6e80384843ec0917d))
    - navigate to incoming call screen when push notification is tapped ([#697](https://github.com/GetStream/stream-video-js/issues/697)) ([85488a2](https://github.com/GetStream/stream-video-js/commit/85488a213abb0482c7aedefb5c3aa999131c746a))
    - proper media stream disposal for rn webrtc ([#682](https://github.com/GetStream/stream-video-js/issues/682)) ([8879bac](https://github.com/GetStream/stream-video-js/commit/8879bac82080232928b78316fdb452bbc3c79fbc))
    - Sentry import ([#677](https://github.com/GetStream/stream-video-js/issues/677)) ([0c52428](https://github.com/GetStream/stream-video-js/commit/0c52428053b4f025b51e6abea911e4bb89c6bd55))
    - **client:** do not allow to re-join left call ([#646](https://github.com/GetStream/stream-video-js/issues/646)) ([cbbbdfd](https://github.com/GetStream/stream-video-js/commit/cbbbdfd026c13673f98ccb50e8ee84140eec64b6))
    - do not send ring to backend if call was not created by the user ([#645](https://github.com/GetStream/stream-video-js/issues/645)) ([1fa8ffb](https://github.com/GetStream/stream-video-js/commit/1fa8ffbb7373e9eff497bfe1ce48a970aedc0d9d))
    - prevent misleading "stop publish" log messages upon call instantiation ([#629](https://github.com/GetStream/stream-video-js/issues/629)) ([af40939](https://github.com/GetStream/stream-video-js/commit/af4093966c408d37fbf59c4c8fafd22756aa8888))
    - adjustments to the new egress response structure ([#595](https://github.com/GetStream/stream-video-js/issues/595)) ([3b3edea](https://github.com/GetStream/stream-video-js/commit/3b3edea7d032a50cb0757c6b46114e8009ae56fc))
    - use and save toggled dtx to sdp and remove empty lines when munging ([#597](https://github.com/GetStream/stream-video-js/issues/597)) ([3971276](https://github.com/GetStream/stream-video-js/commit/39712764ce7ac30557ef36ef7f736f2a0a5728b5))
- `@stream-io/video-react-bindings` updated to version `0.1.1`

## [0.1.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.92...@stream-io/video-react-sdk-0.1.0) (2023-07-17)

### Dependency Updates

- `@stream-io/i18n` updated to version `0.1.1`
- `@stream-io/video-react-bindings` updated to version `0.1.0`

### ⚠ BREAKING CHANGES

- Trigger breaking change to react-sdk

### Features

- **react-sdk:** extract toggle functions to hooks + permissions ([#750](https://github.com/GetStream/stream-video-js/issues/750)) ([e6fab59](https://github.com/GetStream/stream-video-js/commit/e6fab59d3ebc4b91b8b8ed79e6f56bf6b6b10b52))
- Trigger breaking change to react-sdk ([1e1f21f](https://github.com/GetStream/stream-video-js/commit/1e1f21f212be370fbd54a36371d1a7a485e6cec4))

### [0.0.92](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.91...@stream-io/video-react-sdk-0.0.92) (2023-07-17)

### Dependency Updates

- `@stream-io/i18n` updated to version `0.1.0`
- `@stream-io/video-react-bindings` updated to version `0.0.54`

### [0.0.91](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.90...@stream-io/video-react-sdk-0.0.91) (2023-07-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.53`

### [0.0.90](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.89...@stream-io/video-react-sdk-0.0.90) (2023-07-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.52`

### [0.0.89](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.88...@stream-io/video-react-sdk-0.0.89) (2023-07-17)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.51`

### Bug Fixes

- promote prop-types to a 'dependency' in react-sdk ([#805](https://github.com/GetStream/stream-video-js/issues/805)) ([7109c9b](https://github.com/GetStream/stream-video-js/commit/7109c9b6d4087789f44ab8beb539bca495ba8f76))

### [0.0.88](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.87...@stream-io/video-react-sdk-0.0.88) (2023-07-14)

### Bug Fixes

- trigger react sdk release ([2337910](https://github.com/GetStream/stream-video-js/commit/2337910950b8bf67b545f162f39946b380b7718d))

### [0.0.87](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.86...@stream-io/video-react-sdk-0.0.87) (2023-07-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.50`

### Bug Fixes

- Commit version.ts after release ([1252dc9](https://github.com/GetStream/stream-video-js/commit/1252dc981ef315975406aee4fd48b03f81e5a087))
- Optimize release step ([#800](https://github.com/GetStream/stream-video-js/issues/800)) ([0f24939](https://github.com/GetStream/stream-video-js/commit/0f249390d91c60fbc0d485803a7c13b0c4f92a60))

### [0.0.87](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.86...@stream-io/video-react-sdk-0.0.87) (2023-07-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.50`

### Bug Fixes

- Commit version.ts after release ([1252dc9](https://github.com/GetStream/stream-video-js/commit/1252dc981ef315975406aee4fd48b03f81e5a087))
- Optimize release step ([#800](https://github.com/GetStream/stream-video-js/issues/800)) ([0f24939](https://github.com/GetStream/stream-video-js/commit/0f249390d91c60fbc0d485803a7c13b0c4f92a60))

### [0.0.87](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.86...@stream-io/video-react-sdk-0.0.87) (2023-07-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.50`

### Bug Fixes

- Commit version.ts after release ([1252dc9](https://github.com/GetStream/stream-video-js/commit/1252dc981ef315975406aee4fd48b03f81e5a087))
- Optimize release step ([#800](https://github.com/GetStream/stream-video-js/issues/800)) ([0f24939](https://github.com/GetStream/stream-video-js/commit/0f249390d91c60fbc0d485803a7c13b0c4f92a60))

### [0.0.87](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.86...@stream-io/video-react-sdk-0.0.87) (2023-07-14)

### Bug Fixes

- Commit version.ts after release ([1252dc9](https://github.com/GetStream/stream-video-js/commit/1252dc981ef315975406aee4fd48b03f81e5a087))

### [0.0.86](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.85...@stream-io/video-react-sdk-0.0.86) (2023-07-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.49`

### [0.0.85](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.84...@stream-io/video-react-sdk-0.0.85) (2023-07-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.48`

### Bug Fixes

- version.ts override ([4238936](https://github.com/GetStream/stream-video-js/commit/4238936ec5d24c4ec1ce2147eb4ac2d7b74935ca))

### [0.0.84](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.83...@stream-io/video-react-sdk-0.0.84) (2023-07-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.47`

### Features

- fix version problem ([096425b](https://github.com/GetStream/stream-video-js/commit/096425bbcb6fcc06a566458dc6bd8431183d31d8))

### [0.0.83](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.82...@stream-io/video-react-sdk-0.0.83) (2023-07-14)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.46`

### Features

- SDK version header ([#790](https://github.com/GetStream/stream-video-js/issues/790)) ([6c662db](https://github.com/GetStream/stream-video-js/commit/6c662db59321db4060b5499d8eaad8a18b1eaf6c))

### [0.0.82](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.81...@stream-io/video-react-sdk-0.0.82) (2023-07-12)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.45`

### [0.0.81](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.80...@stream-io/video-react-sdk-0.0.81) (2023-07-12)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.44`

### [0.0.80](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.79...@stream-io/video-react-sdk-0.0.80) (2023-07-12)

### Documentation

- **react-sdk:** fix broken link in the VideoPlaceholder cookbook ([#784](https://github.com/GetStream/stream-video-js/issues/784)) ([9865644](https://github.com/GetStream/stream-video-js/commit/9865644cd9d60ae06496dc676565fc2a69f9295e))

### [0.0.79](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.78...@stream-io/video-react-sdk-0.0.79) (2023-07-11)

### Documentation

- align React audio rooms tutorial with iOS and Android ([#781](https://github.com/GetStream/stream-video-js/issues/781)) ([e5b9642](https://github.com/GetStream/stream-video-js/commit/e5b9642dd278566e7ab7e55f7004ad435421af86))

### [0.0.78](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.77...@stream-io/video-react-sdk-0.0.78) (2023-07-10)

### Documentation

- events, UI cookbook overview, add coming soon texts ([#777](https://github.com/GetStream/stream-video-js/issues/777)) ([7cc2581](https://github.com/GetStream/stream-video-js/commit/7cc25811da7b1541cffba4be529e3056e6ceffad))

### [0.0.77](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.76...@stream-io/video-react-sdk-0.0.77) (2023-07-10)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.43`

### Documentation

- **react-sdk:** add token snippet to audio rooms tutorial ([#739](https://github.com/GetStream/stream-video-js/issues/739)) ([bf0b46c](https://github.com/GetStream/stream-video-js/commit/bf0b46ce40329458ad545c82b70a4099c4afc8f2))

### [0.0.76](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.75...@stream-io/video-react-sdk-0.0.76) (2023-07-10)

### Bug Fixes

- **react:** missing dependency for video publishing ([#771](https://github.com/GetStream/stream-video-js/issues/771)) ([71144b2](https://github.com/GetStream/stream-video-js/commit/71144b2b4ebf1c719acd384b2f13befcf6bde213))

### [0.0.75](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.74...@stream-io/video-react-sdk-0.0.75) (2023-07-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.42`

### [0.0.74](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.73...@stream-io/video-react-sdk-0.0.74) (2023-07-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.41`

### [0.0.73](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.72...@stream-io/video-react-sdk-0.0.73) (2023-07-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.40`

### [0.0.72](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.71...@stream-io/video-react-sdk-0.0.72) (2023-07-06)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.39`

### [0.0.71](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.70...@stream-io/video-react-sdk-0.0.71) (2023-07-05)

### Bug Fixes

- restore device switching functionality ([#757](https://github.com/GetStream/stream-video-js/issues/757)) ([3de6a44](https://github.com/GetStream/stream-video-js/commit/3de6a4418ce1eda92f2a528a481cb2e0977db974)), closes [#749](https://github.com/GetStream/stream-video-js/issues/749)

### [0.0.70](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.69...@stream-io/video-react-sdk-0.0.70) (2023-07-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.38`

### [0.0.69](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.68...@stream-io/video-react-sdk-0.0.69) (2023-07-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.37`

### [0.0.68](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.67...@stream-io/video-react-sdk-0.0.68) (2023-07-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.36`

### Bug Fixes

- prevent double publishStream invocation ([#749](https://github.com/GetStream/stream-video-js/issues/749)) ([9e3c22f](https://github.com/GetStream/stream-video-js/commit/9e3c22fd37d8dc00d275e8b69f9cd18f67e366fe))

### [0.0.67](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.66...@stream-io/video-react-sdk-0.0.67) (2023-07-04)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.35`

### [0.0.66](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.65...@stream-io/video-react-sdk-0.0.66) (2023-07-04)

### Documentation

- Remove video-client references ([2690f24](https://github.com/GetStream/stream-video-js/commit/2690f24b2227f4adc7404c0b30952c692b19ed88))

### [0.0.65](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.64...@stream-io/video-react-sdk-0.0.65) (2023-07-04)

### Documentation

- Unify UI components structure ([#742](https://github.com/GetStream/stream-video-js/issues/742)) ([d550163](https://github.com/GetStream/stream-video-js/commit/d550163cdcad0cac598b0cecadeee82e6d997b64)), closes [/github.com/GetStream/stream-video-js/pull/571#issue-1732498263](https://github.com/GetStream//github.com/GetStream/stream-video-js/pull/571/issues/issue-1732498263)

### [0.0.64](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.63...@stream-io/video-react-sdk-0.0.64) (2023-07-04)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.34`

### Features

- stop tracking permission requests in Call state ([#744](https://github.com/GetStream/stream-video-js/issues/744)) ([b330df3](https://github.com/GetStream/stream-video-js/commit/b330df39d9dce34d9e5a1a7ec58acb0a905ee07b))

### [0.0.63](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.62...@stream-io/video-react-sdk-0.0.63) (2023-07-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.33`

### [0.0.62](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.61...@stream-io/video-react-sdk-0.0.62) (2023-07-03)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.32`

### [0.0.61](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.60...@stream-io/video-react-sdk-0.0.61) (2023-07-03)

### Dependency Updates

- `@stream-io/i18n` updated to version `0.0.8`
- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.31`

### Features

- SFU Session Migration and Graceful Shutdown ([#603](https://github.com/GetStream/stream-video-js/issues/603)) ([943169b](https://github.com/GetStream/stream-video-js/commit/943169bd2b7b9e138bcaf387cf72eb3fa0f23533))

### [0.0.60](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.59...@stream-io/video-react-sdk-0.0.60) (2023-07-03)

### Documentation

- **react-sdk:** add PermissionNotification and PermissionRequests docs ([#731](https://github.com/GetStream/stream-video-js/issues/731)) ([7542e70](https://github.com/GetStream/stream-video-js/commit/7542e70eaca436164830d717ea90bdfa99ad5f15))

### [0.0.59](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.58...@stream-io/video-react-sdk-0.0.59) (2023-06-30)

### Dependency Updates

- `@stream-io/i18n` updated to version `0.0.7`
- `@stream-io/video-react-bindings` updated to version `0.0.30`

### Documentation

- **react-sdk:** add CallStats docs ([#735](https://github.com/GetStream/stream-video-js/issues/735)) ([8fb2c15](https://github.com/GetStream/stream-video-js/commit/8fb2c1501a53121dd5dd30a3bbfeee74af0ad63c))
- **react-sdk:** add SpeakingWhileMutedNotification docs ([#732](https://github.com/GetStream/stream-video-js/issues/732)) ([bdb9daa](https://github.com/GetStream/stream-video-js/commit/bdb9daaf921b0a790fa8013dded2ff1559d95fc9))

### [0.0.58](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.57...@stream-io/video-react-sdk-0.0.58) (2023-06-29)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.29`
- `@stream-io/video-styling` updated to version `0.1.4`

### Features

- Change sendEvent signature ([#734](https://github.com/GetStream/stream-video-js/issues/734)) ([284c8c2](https://github.com/GetStream/stream-video-js/commit/284c8c2165129852ccf9fd7d8baad37f43d22a17))

### Documentation

- **react-sdk:** add documentation for CallParticipantList component ([#728](https://github.com/GetStream/stream-video-js/issues/728)) ([bfce6fa](https://github.com/GetStream/stream-video-js/commit/bfce6fa69d1c90095bde5b75055d6b304ad7a4d4))
- **react-sdk:** add documentation for VideoPreview component ([#729](https://github.com/GetStream/stream-video-js/issues/729)) ([d1096b4](https://github.com/GetStream/stream-video-js/commit/d1096b42976ac797e4bb104bbdff8ca9ed5ed88c))
- **react-sdk:** Reaction component ([#721](https://github.com/GetStream/stream-video-js/issues/721)) ([0a80c5e](https://github.com/GetStream/stream-video-js/commit/0a80c5e1944f9dff6d330d83f9009070d8c8a8d7))

### [0.0.57](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.56...@stream-io/video-react-sdk-0.0.57) (2023-06-28)

### Documentation

- shared page for call types ([#720](https://github.com/GetStream/stream-video-js/issues/720)) ([33bb47c](https://github.com/GetStream/stream-video-js/commit/33bb47c61460b35a9dd0ec59def4ff6936f957a0))

### [0.0.56](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.55...@stream-io/video-react-sdk-0.0.56) (2023-06-28)

### Documentation

- **react-sdk:** add broadcasting documentation article ([#717](https://github.com/GetStream/stream-video-js/issues/717)) ([73ca081](https://github.com/GetStream/stream-video-js/commit/73ca081e2ed68d8ef149210c9a205bfe62382785))

### [0.0.55](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.54...@stream-io/video-react-sdk-0.0.55) (2023-06-27)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.28`
- `@stream-io/video-styling` updated to version `0.1.3`

### Documentation

- Tutorial rewrite ([#709](https://github.com/GetStream/stream-video-js/issues/709)) ([9a14188](https://github.com/GetStream/stream-video-js/commit/9a141883ec2e402e7130c7e41f464439d5cb2800))

### [0.0.54](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.53...@stream-io/video-react-sdk-0.0.54) (2023-06-26)

### Bug Fixes

- Sentry integration ([c7fe85f](https://github.com/GetStream/stream-video-js/commit/c7fe85fe7b6cc5341be7131b81c593fb82dd5b6b))

### [0.0.53](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.52...@stream-io/video-react-sdk-0.0.53) (2023-06-26)

### Bug Fixes

- Attempt to fix npm image ([cf90bd3](https://github.com/GetStream/stream-video-js/commit/cf90bd33048135053305278844bf2b50d8421b8b))

### [0.0.52](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.51...@stream-io/video-react-sdk-0.0.52) (2023-06-23)

### Dependency Updates

- `@stream-io/video-styling` updated to version `0.1.2`

### [0.0.51](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.50...@stream-io/video-react-sdk-0.0.51) (2023-06-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.27`

### [0.0.50](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.49...@stream-io/video-react-sdk-0.0.50) (2023-06-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.26`

### Bug Fixes

- **react-sdk:** check browser permissions before watching disconnected device ([#700](https://github.com/GetStream/stream-video-js/issues/700)) ([50b8968](https://github.com/GetStream/stream-video-js/commit/50b8968aeaf73d70e2ed081353eb41063f484bdb))

### [0.0.49](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.48...@stream-io/video-react-sdk-0.0.49) (2023-06-23)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.25`

### [0.0.48](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.47...@stream-io/video-react-sdk-0.0.48) (2023-06-22)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.24`

### Bug Fixes

- use correct condition ([984a43d](https://github.com/GetStream/stream-video-js/commit/984a43deca78aefa9609f29ea84d6d8d045163a2))

### [0.0.47](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.46...@stream-io/video-react-sdk-0.0.47) (2023-06-22)

### Features

- **livestream-app:** accept credentials from URL ([#691](https://github.com/GetStream/stream-video-js/issues/691)) ([62032c7](https://github.com/GetStream/stream-video-js/commit/62032c7abf9ed47444daee3a4c7d272c610d27a9))

### [0.0.46](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.45...@stream-io/video-react-sdk-0.0.46) (2023-06-22)

### Bug Fixes

- prevent unmute after reconnect ([#694](https://github.com/GetStream/stream-video-js/issues/694)) ([367abaa](https://github.com/GetStream/stream-video-js/commit/367abaac49e16b1334caa41d7cfee598796ac066))

### [0.0.45](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.44...@stream-io/video-react-sdk-0.0.45) (2023-06-21)

### Features

- **react sdk:** prefer URL credentials in audio rooms demo app ([#678](https://github.com/GetStream/stream-video-js/issues/678)) ([f9ac52f](https://github.com/GetStream/stream-video-js/commit/f9ac52ff5afa10e6a10e97177dd2fb7e8a4c2e48))

### [0.0.44](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.43...@stream-io/video-react-sdk-0.0.44) (2023-06-21)

### Documentation

- Add header image to React SDK ([#688](https://github.com/GetStream/stream-video-js/issues/688)) ([a4697da](https://github.com/GetStream/stream-video-js/commit/a4697da69f0f0976d84566d16df840efdaab6ebc))

### [0.0.43](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.42...@stream-io/video-react-sdk-0.0.43) (2023-06-21)

### Dependency Updates

- `@stream-io/i18n` updated to version `0.0.6`
- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.23`

### Documentation

- Add reference tables to state docs ([#676](https://github.com/GetStream/stream-video-js/issues/676)) ([39e7a05](https://github.com/GetStream/stream-video-js/commit/39e7a05a79ba1754be7f62412666ec1f9f85aba9))
- cleanup ([#679](https://github.com/GetStream/stream-video-js/issues/679)) ([58c86bd](https://github.com/GetStream/stream-video-js/commit/58c86bd0354ebe444af361056dcc3fa82c4a926d))

### [0.0.42](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.41...@stream-io/video-react-sdk-0.0.42) (2023-06-21)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.22`

### Documentation

- **react-sdk:** update audio rooms tutorial ([#659](https://github.com/GetStream/stream-video-js/issues/659)) ([11f2e80](https://github.com/GetStream/stream-video-js/commit/11f2e8090811fbd8478724b3d2c2c8af3b19a0c5))

### [0.0.41](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.40...@stream-io/video-react-sdk-0.0.41) (2023-06-21)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.21`

### [0.0.40](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.39...@stream-io/video-react-sdk-0.0.40) (2023-06-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.20`

### [0.0.39](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.38...@stream-io/video-react-sdk-0.0.39) (2023-06-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.19`

### Features

- Custom logger example ([#669](https://github.com/GetStream/stream-video-js/issues/669)) ([208aed9](https://github.com/GetStream/stream-video-js/commit/208aed9f82dcbf5f9ffdf299c4672af855af344a))

### Documentation

- Update custom call controls ([#670](https://github.com/GetStream/stream-video-js/issues/670)) ([572bdcb](https://github.com/GetStream/stream-video-js/commit/572bdcb42ed19a9a790c615a521fd3826bb831a1))

### [0.0.38](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.37...@stream-io/video-react-sdk-0.0.38) (2023-06-20)

### Documentation

- **react-sdk:** Remove generated docs ([#674](https://github.com/GetStream/stream-video-js/issues/674)) ([05f8ace](https://github.com/GetStream/stream-video-js/commit/05f8ace7bd6400ff4c4034e5e7bd633a1a050e23))

### [0.0.37](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.36...@stream-io/video-react-sdk-0.0.37) (2023-06-20)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.18`

### Documentation

- Restructure device management guide ([#666](https://github.com/GetStream/stream-video-js/issues/666)) ([70013b2](https://github.com/GetStream/stream-video-js/commit/70013b203adbed13e6bbb070d749a6be2e7df794))

### [0.0.36](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.35...@stream-io/video-react-sdk-0.0.36) (2023-06-19)

### Bug Fixes

- **react-sdk:** vale lint issue in README.md ([#665](https://github.com/GetStream/stream-video-js/issues/665)) ([f21fe8e](https://github.com/GetStream/stream-video-js/commit/f21fe8e74302f3f3b436f3f1bf0f64335d9c936a))

### [0.0.35](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.34...@stream-io/video-react-sdk-0.0.35) (2023-06-16)

### Features

- Rename videoKind prop to videoMode ([#661](https://github.com/GetStream/stream-video-js/issues/661)) ([781e908](https://github.com/GetStream/stream-video-js/commit/781e9081fd43f2a433f9c4c7b32a549d77fb26c1))

### [0.0.34](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.33...@stream-io/video-react-sdk-0.0.34) (2023-06-16)

### Dependency Updates

- `@stream-io/i18n` updated to version `0.0.5`
- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.17`

### Documentation

- **react-sdk:** Runtime layout switching guide ([#642](https://github.com/GetStream/stream-video-js/issues/642)) ([1557168](https://github.com/GetStream/stream-video-js/commit/1557168da69660b71a0a420a94a0c354466681a7))

### [0.0.33](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.32...@stream-io/video-react-sdk-0.0.33) (2023-06-16)

### Dependency Updates

- `@stream-io/i18n` updated to version `0.0.4`
- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.16`

### Features

- Logging ([#654](https://github.com/GetStream/stream-video-js/issues/654)) ([30fc8f2](https://github.com/GetStream/stream-video-js/commit/30fc8f28e2f5829247256f24b040ea4a10336186))
- Remove unnecessary sinkId prop from ParticipantView ([#656](https://github.com/GetStream/stream-video-js/issues/656)) ([ba5ac37](https://github.com/GetStream/stream-video-js/commit/ba5ac3758afb316e9a77f677eeba6bbc46ed0094))

### [0.0.32](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.31...@stream-io/video-react-sdk-0.0.32) (2023-06-16)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.15`

### [0.0.31](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.30...@stream-io/video-react-sdk-0.0.31) (2023-06-15)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.14`

### [0.0.30](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.29...@stream-io/video-react-sdk-0.0.30) (2023-06-14)

### Documentation

- Clean up broken links ([#647](https://github.com/GetStream/stream-video-js/issues/647)) ([1e879e1](https://github.com/GetStream/stream-video-js/commit/1e879e1ec6f450f0224f4d3fe8f02815328f225c))

### [0.0.29](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.28...@stream-io/video-react-sdk-0.0.29) (2023-06-14)

### Documentation

- Remove the Core Components page ([9790299](https://github.com/GetStream/stream-video-js/commit/9790299b04d5d52e5dedfdacf6cdae506eeb00fe))

### [0.0.28](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.27...@stream-io/video-react-sdk-0.0.28) (2023-06-14)

### Documentation

- Update authentication guide ([#641](https://github.com/GetStream/stream-video-js/issues/641)) ([92fbb1e](https://github.com/GetStream/stream-video-js/commit/92fbb1eadbc9b497362413cdafa9b6bbaaa12442))

### [0.0.27](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.26...@stream-io/video-react-sdk-0.0.27) (2023-06-13)

### Documentation

- add usage of token snippet into Audio Room guide ([#638](https://github.com/GetStream/stream-video-js/issues/638)) ([4fbaad6](https://github.com/GetStream/stream-video-js/commit/4fbaad6e0760bd5b4c18b4f635ad9a77ce1f342b))

### [0.0.26](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.25...@stream-io/video-react-sdk-0.0.26) (2023-06-13)

### Dependency Updates

- `@stream-io/video-react-bindings` updated to version `0.0.13`

### [0.0.25](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.24...@stream-io/video-react-sdk-0.0.25) (2023-06-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.12`

### [0.0.24](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.23...@stream-io/video-react-sdk-0.0.24) (2023-06-13)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.11`

### Features

- add audio room demo app ([#572](https://github.com/GetStream/stream-video-js/issues/572)) ([77f7b65](https://github.com/GetStream/stream-video-js/commit/77f7b6596047d59e10c8e58abad38c4f48cc162f))

### [0.0.23](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.22...@stream-io/video-react-sdk-0.0.23) (2023-06-12)

### Documentation

- **react-sdk:** add documentation for device settings UI components ([#624](https://github.com/GetStream/stream-video-js/issues/624)) ([25b2636](https://github.com/GetStream/stream-video-js/commit/25b26363a41938ceadf256baa9ba194ffd92a658))

### [0.0.22](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.21...@stream-io/video-react-sdk-0.0.22) (2023-06-12)

### Dependency Updates

- `@stream-io/i18n` updated to version `0.0.3`
- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.10`

### [0.0.21](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.20...@stream-io/video-react-sdk-0.0.21) (2023-06-12)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.9`

### [0.0.20](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.19...@stream-io/video-react-sdk-0.0.20) (2023-06-12)

### Documentation

- **react-sdk:** adjust asset folder names & update asset links ([#620](https://github.com/GetStream/stream-video-js/issues/620)) ([3218309](https://github.com/GetStream/stream-video-js/commit/321830934182797c2893839451365f6866f13c64))

### [0.0.19](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.18...@stream-io/video-react-sdk-0.0.19) (2023-06-09)

### Bug Fixes

- **react-sdk:** do not try to watch devices, if browser permission is not granted ([#617](https://github.com/GetStream/stream-video-js/issues/617)) ([abff44d](https://github.com/GetStream/stream-video-js/commit/abff44d2e66d6c4c515c7d4590fb3767b2560e64))

### Documentation

- **react-sdk:** rename 13-custom-call-layout.mdx to 04-video-layout.mdx ([#586](https://github.com/GetStream/stream-video-js/issues/586)) ([e832092](https://github.com/GetStream/stream-video-js/commit/e832092aac5b2de2327294d1a45bcc02d33db4a4))

### [0.0.18](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.17...@stream-io/video-react-sdk-0.0.18) (2023-06-09)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.8`

### Features

- **react-sdk:** Picture-in-Picture Pronto integration + guide ([#614](https://github.com/GetStream/stream-video-js/issues/614)) ([5b7662a](https://github.com/GetStream/stream-video-js/commit/5b7662a8d17f151796d58c6eed2d9fed7d3d9ba8))

### [0.0.17](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.16...@stream-io/video-react-sdk-0.0.17) (2023-06-08)

### Documentation

- pull token generator from shared repo ([#615](https://github.com/GetStream/stream-video-js/issues/615)) ([fcf0093](https://github.com/GetStream/stream-video-js/commit/fcf009300307fb08a08346ef01981cb2ea254851))

### [0.0.16](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.15...@stream-io/video-react-sdk-0.0.16) (2023-06-08)

### Dependency Updates

- `@stream-io/video-styling` updated to version `0.1.1`

### Features

- **react-sdk:** ScreenShareOverlay component ([#610](https://github.com/GetStream/stream-video-js/issues/610)) ([37aada1](https://github.com/GetStream/stream-video-js/commit/37aada1f20b4a562edf07314df2e962f252069ef))

### [0.0.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.14...@stream-io/video-react-sdk-0.0.15) (2023-06-08)

### Documentation

- Update to latest public API ([#613](https://github.com/GetStream/stream-video-js/issues/613)) ([8a196e1](https://github.com/GetStream/stream-video-js/commit/8a196e1ff2641414b0300028d3c43fbd4a560a7f))

### [0.0.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.13...@stream-io/video-react-sdk-0.0.14) (2023-06-08)

### Documentation

- Feedback ([#609](https://github.com/GetStream/stream-video-js/issues/609)) ([3a948d1](https://github.com/GetStream/stream-video-js/commit/3a948d1b3c82ed62d95a2245e0d1a14dfae1d491))

### [0.0.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.12...@stream-io/video-react-sdk-0.0.13) (2023-06-08)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.7`

### Features

- StreamCall signature, video client creation ([#596](https://github.com/GetStream/stream-video-js/issues/596)) ([5c3000c](https://github.com/GetStream/stream-video-js/commit/5c3000cc6fc3f8b7904609d7b11fa025b7458cad))

### [0.0.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.11...@stream-io/video-react-sdk-0.0.12) (2023-06-07)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.6`

### Documentation

- **react-sdk:** keyboard shortcuts guide ([#606](https://github.com/GetStream/stream-video-js/issues/606)) ([7da0ae8](https://github.com/GetStream/stream-video-js/commit/7da0ae85f53663d8f48dabcf7ea9411ec71d71c4))

### [0.0.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.10...@stream-io/video-react-sdk-0.0.11) (2023-06-07)

### [0.0.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.9...@stream-io/video-react-sdk-0.0.10) (2023-06-06)

### [0.0.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.8...@stream-io/video-react-sdk-0.0.9) (2023-06-06)

### Documentation

- **react-sdk:** ParticipantView fullscreen mode ([#591](https://github.com/GetStream/stream-video-js/issues/591)) ([6b60086](https://github.com/GetStream/stream-video-js/commit/6b600860a7a8c40565746a70d1c08c597ab73730))

### [0.0.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.7...@stream-io/video-react-sdk-0.0.8) (2023-06-06)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.5`

### Bug Fixes

- adjustments to the new egress response structure ([#595](https://github.com/GetStream/stream-video-js/issues/595)) ([3b3edea](https://github.com/GetStream/stream-video-js/commit/3b3edea7d032a50cb0757c6b46114e8009ae56fc))

### [0.0.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.6...@stream-io/video-react-sdk-0.0.7) (2023-06-06)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.4`

### [0.0.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.5...@stream-io/video-react-sdk-0.0.6) (2023-06-05)

### Dependency Updates

- `@stream-io/video-client` updated to version `0.0.1`
- `@stream-io/video-react-bindings` updated to version `0.0.3`

### [0.0.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-0.0.4...@stream-io/video-react-sdk-0.0.5) (2023-06-05)

### Documentation

- Call layout ([#589](https://github.com/GetStream/stream-video-js/issues/589)) ([df35463](https://github.com/GetStream/stream-video-js/commit/df35463b45cca4a7f0570d0b249a234261750b24))
