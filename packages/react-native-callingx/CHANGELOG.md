# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

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
