# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## [0.11.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/react-native-callingx-0.11.0...@stream-io/react-native-callingx-0.11.1) (2026-09-04)

### Bug Fixes

- **callingx:** don't tear down concurrent calls on stop service ([#2394](https://github.com/GetStream/stream-video-js/issues/2394)) ([d6e9deb](https://github.com/GetStream/stream-video-js/commit/d6e9debbe98ae91cc349f010eb92f76b35a3f932))

## [0.11.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/react-native-callingx-0.10.0...@stream-io/react-native-callingx-0.11.0) (2026-08-28)

### Features

- handle ring notification internally ([#2380](https://github.com/GetStream/stream-video-js/issues/2380)) ([0259217](https://github.com/GetStream/stream-video-js/commit/0259217ea2df613483bee5918ca2f93a68b6c3b9))

### Bug Fixes

- do not allow empty android call display names ([#2392](https://github.com/GetStream/stream-video-js/issues/2392)) ([2ef3065](https://github.com/GetStream/stream-video-js/commit/2ef3065038fc293d0e2c96d2cc26feaf317e7b2d))

## [0.10.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/react-native-callingx-0.9.0...@stream-io/react-native-callingx-0.10.0) (2026-08-18)

### Features

- hi-fi audio ([#2305](https://github.com/GetStream/stream-video-js/issues/2305)) ([c2e0f21](https://github.com/GetStream/stream-video-js/commit/c2e0f21d4f57bbf2c64fdc3f5bca45a988f3a176))

## [0.9.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/react-native-callingx-0.8.1...@stream-io/react-native-callingx-0.9.0) (2026-08-07)

### Features

- added audio capture for ios broadcast screensharing mode ([#2346](https://github.com/GetStream/stream-video-js/issues/2346)) ([eb40f3e](https://github.com/GetStream/stream-video-js/commit/eb40f3ea5bfc5cfc28f3f6ef81c54bcbdeb1a804))
- **react-native:** Expo SDK 57 / RN 0.86.2 upgrade and iOS 27 compatibility fixes ([#2355](https://github.com/GetStream/stream-video-js/issues/2355)) ([ea3c29b](https://github.com/GetStream/stream-video-js/commit/ea3c29b227f7a2a9ddb0eb046325e4783b558c94))

## [0.8.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/react-native-callingx-0.8.0...@stream-io/react-native-callingx-0.8.1) (2026-07-30)

### Dependency Updates

- `@stream-io/typescript-config` updated to version `0.1.0`

## [0.8.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/react-native-callingx-0.7.0...@stream-io/react-native-callingx-0.8.0) (2026-07-30)

### Dependency Updates

- `@stream-io/typescript-config` updated to version `0.1.0`

### Features

- add iOS audio output selection methods ([#2334](https://github.com/GetStream/stream-video-js/issues/2334)) ([e858efe](https://github.com/GetStream/stream-video-js/commit/e858efee6f8741a7f0e469789c64b2780dbcb5ce))
- added expo plugin for resolving fcm conflicts issue ([#2350](https://github.com/GetStream/stream-video-js/issues/2350)) ([b083873](https://github.com/GetStream/stream-video-js/commit/b0838731e3a040ab87866621f66f36e6827fd0cc))

### Bug Fixes

- wait for callkit audio activation and then start audio engine, remove the previous timeout ([#2328](https://github.com/GetStream/stream-video-js/issues/2328)) ([64d6cff](https://github.com/GetStream/stream-video-js/commit/64d6cff02112fa7f9b2ed273f27006675f1d798d))

## [0.7.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/react-native-callingx-0.6.2...@stream-io/react-native-callingx-0.7.0) (2026-07-17)

### Dependency Updates

- `@stream-io/typescript-config` updated to version `0.1.0`

### Features

- improved providerDidReset handling ([#2329](https://github.com/GetStream/stream-video-js/issues/2329)) ([ccb2273](https://github.com/GetStream/stream-video-js/commit/ccb2273e4cb8cf386df3323fec49c2c98a469119))

## [0.6.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/react-native-callingx-0.6.1...@stream-io/react-native-callingx-0.6.2) (2026-07-09)

### Dependency Updates

- `@stream-io/typescript-config` updated to version `0.1.0`

### Bug Fixes

- android callingx calls should handle audio through through telecom ([#2324](https://github.com/GetStream/stream-video-js/issues/2324)) ([95bcc2a](https://github.com/GetStream/stream-video-js/commit/95bcc2a2dac12c0051b61a1704f927793eaaf727))
- callingx background handling ([#2310](https://github.com/GetStream/stream-video-js/issues/2310)) ([a96df4f](https://github.com/GetStream/stream-video-js/commit/a96df4ffc9279d2d9cd14da5196a275faf3d1891))

## [0.6.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/react-native-callingx-0.6.0...@stream-io/react-native-callingx-0.6.1) (2026-07-02)

### Dependency Updates

- `@stream-io/typescript-config` updated to version `0.1.0`

### Bug Fixes

- made CXCallObserver static warm instance ([#2306](https://github.com/GetStream/stream-video-js/issues/2306)) ([ac79c64](https://github.com/GetStream/stream-video-js/commit/ac79c64f7231b12295e726f258e92c28b239d28b))

## [0.6.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/react-native-callingx-0.5.1...@stream-io/react-native-callingx-0.6.0) (2026-06-26)

### Dependency Updates

- `@stream-io/typescript-config` updated to version `0.1.0`

### Features

- upgrade to TypeScript 6.0.3, pin ES2022, raise supported-browser floors ([#2290](https://github.com/GetStream/stream-video-js/issues/2290)) ([d9ea158](https://github.com/GetStream/stream-video-js/commit/d9ea15846582fa8db86b3b873eca2afe92ae3593))

## [0.5.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/react-native-callingx-0.5.0...@stream-io/react-native-callingx-0.5.1) (2026-06-12)

### Bug Fixes

- **ios:** joining a call muted may break remote audio playout ([#2282](https://github.com/GetStream/stream-video-js/issues/2282)) ([dc672a6](https://github.com/GetStream/stream-video-js/commit/dc672a69971d6ca46648696c242609c687cb42d7))

## [0.5.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/react-native-callingx-0.4.0...@stream-io/react-native-callingx-0.5.0) (2026-06-11)

### Features

- webrtc 145 upgrade ([#2133](https://github.com/GetStream/stream-video-js/issues/2133)) ([07825e4](https://github.com/GetStream/stream-video-js/commit/07825e402193ed07acf1d41831545326a0ad93d9)), closes [rn-webrtc#27](https://github.com/GetStream/rn-webrtc/issues/27)

## [0.4.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/react-native-callingx-0.3.1...@stream-io/react-native-callingx-0.4.0) (2026-06-04)

### Features

- added self managed push kit delegate management ([#2263](https://github.com/GetStream/stream-video-js/issues/2263)) ([ede4671](https://github.com/GetStream/stream-video-js/commit/ede467138a4727ccdc5cf3702b16747c516775a5))

### Bug Fixes

- skip notification bg->fg transition case ([#2262](https://github.com/GetStream/stream-video-js/issues/2262)) ([e5cd46f](https://github.com/GetStream/stream-video-js/commit/e5cd46fa557d83f3de1c983d1aca2adfac9ad0ee))

## [0.3.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/react-native-callingx-0.3.0...@stream-io/react-native-callingx-0.3.1) (2026-05-26)

### Bug Fixes

- added missing bridge method placeholders ([#2260](https://github.com/GetStream/stream-video-js/issues/2260)) ([9f1bbd4](https://github.com/GetStream/stream-video-js/commit/9f1bbd41337f999c850e22a9ebcc97b8a9b226b8))

## [0.3.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/react-native-callingx-0.2.0...@stream-io/react-native-callingx-0.3.0) (2026-05-25)

### Features

- added option to skip ringing notification in foreground ([#2213](https://github.com/GetStream/stream-video-js/issues/2213)) ([8b43986](https://github.com/GetStream/stream-video-js/commit/8b43986c89d510c75668967fde46d7cb75f1636f))
- made messaging service extendable ([#2244](https://github.com/GetStream/stream-video-js/issues/2244)) ([c6278fa](https://github.com/GetStream/stream-video-js/commit/c6278fa8f5aafe6ea6c550ce61db74e4f358f121))

### Bug Fixes

- missing callingx iOS default audio route selection ([#2251](https://github.com/GetStream/stream-video-js/issues/2251)) ([067ebf4](https://github.com/GetStream/stream-video-js/commit/067ebf4a223d3f346fdb5edaa682272f3354af6b)), closes [#2219](https://github.com/GetStream/stream-video-js/issues/2219)

## [0.2.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/react-native-callingx-0.1.1...@stream-io/react-native-callingx-0.2.0) (2026-05-08)

### Features

- ongoing calls adjustments ([#2209](https://github.com/GetStream/stream-video-js/issues/2209)) ([16e2331](https://github.com/GetStream/stream-video-js/commit/16e23319bb352d5b28a6a67c5fa97dbdf757ba1a))

## [0.1.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/react-native-callingx-0.1.0...@stream-io/react-native-callingx-0.1.1) (2026-04-09)

### Bug Fixes

- callingx docs update ([#2195](https://github.com/GetStream/stream-video-js/issues/2195)) ([7a6b632](https://github.com/GetStream/stream-video-js/commit/7a6b632270ec1187236a0e4e5c5396a98a20fd16))

## 0.1.0 (2026-04-09)

### Features

- callkit/telecom integration ([#2028](https://github.com/GetStream/stream-video-js/issues/2028)) ([d579acd](https://github.com/GetStream/stream-video-js/commit/d579acd1975fb4945e40452b27e372694c737628))
