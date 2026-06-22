/**
 * Shared changelog fixtures for the release-script tests. They mirror the real
 * @jscutlery/semver + prettier output (PR refs linked as "([#2284](.../issues/
 * 2284))", commit hashes as "([4403348](.../commit/...))", raw `*` bullets
 * normalized to `-`) so both the parser and enrichment tests exercise realistic
 * input.
 */

// A source package: several version entries with their own Features / Bug Fixes.
export const CLIENT_CL = `# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## [1.53.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.53.1...@stream-io/video-client-1.53.2) (2026-06-12)

### Bug Fixes

- **client:** keep user_id populated in call event telemetry ([#2284](https://github.com/GetStream/stream-video-js/issues/2284)) ([4403348](https://github.com/GetStream/stream-video-js/commit/4403348115500499cd60919a417d97659546bb8b))

## [1.53.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.53.0...@stream-io/video-client-1.53.1) (2026-06-12)

### Bug Fixes

- **client:** Send call data in JoinInitiated event ([#2283](https://github.com/GetStream/stream-video-js/issues/2283)) ([7e9ce3e](https://github.com/GetStream/stream-video-js/commit/7e9ce3e3e3c4ebe8080f86793855a39abe7e19ef))
- **ios:** joining a call muted may break remote audio playout ([#2282](https://github.com/GetStream/stream-video-js/issues/2282)) ([dc672a6](https://github.com/GetStream/stream-video-js/commit/dc672a69971d6ca46648696c242609c687cb42d7))

## [1.53.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.52.0...@stream-io/video-client-1.53.0) (2026-06-11)

### Features

- **client:** Call event reporting ([#2261](https://github.com/GetStream/stream-video-js/issues/2261)) ([246b8c8](https://github.com/GetStream/stream-video-js/commit/246b8c826cccd22a09cd34391e9a773e91860fa8))

### Bug Fixes

- **client:** preserve captured stage error ([#2281](https://github.com/GetStream/stream-video-js/issues/2281)) ([890ce0b](https://github.com/GetStream/stream-video-js/commit/890ce0b25d0f1530ba9ebd2ef56fe366f3377312))

## [1.52.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.51.0...@stream-io/video-client-1.52.0) (2026-06-01)

- **deps:** upgrade React Native 0.85 ([#2268](https://github.com/GetStream/stream-video-js/issues/2268)) ([2c8ab9d](https://github.com/GetStream/stream-video-js/commit/2c8ab9d9238f3700dabbd04c9ce5bf3aaa4c7a13))

### Features

- **client:** add hasInterruptedTrack helper ([#2266](https://github.com/GetStream/stream-video-js/issues/2266)) ([c723eb6](https://github.com/GetStream/stream-video-js/commit/c723eb67bffcb00edc03e4960a0d3a600bba8687))
`;

// A dependent SDK changelog: top entry is a pure dependency bump.
export const REACT_SDK_CL = `# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## [1.37.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.37.6...@stream-io/video-react-sdk-1.37.7) (2026-06-12)

### Dependency Updates

- \`@stream-io/video-client\` updated to version \`1.53.2\`
- \`@stream-io/video-react-bindings\` updated to version \`1.16.5\`

## [1.37.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-sdk-1.37.5...@stream-io/video-react-sdk-1.37.6) (2026-06-12)

### Dependency Updates

- \`@stream-io/video-client\` updated to version \`1.53.0\`
- \`@stream-io/video-react-bindings\` updated to version \`1.16.4\`
`;

// react-bindings: a pure passthrough of client (no own Features/Bug Fixes).
export const BINDINGS_CL = `# Changelog

## [1.16.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-bindings-1.16.4...@stream-io/video-react-bindings-1.16.5) (2026-06-12)

### Dependency Updates

- \`@stream-io/video-client\` updated to version \`1.53.2\`

## [1.16.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-react-bindings-1.16.3...@stream-io/video-react-bindings-1.16.4) (2026-06-12)

### Dependency Updates

- \`@stream-io/video-client\` updated to version \`1.53.1\`
`;

export const RUNTIME_DEPS = [
  '@stream-io/video-client',
  '@stream-io/video-react-bindings',
  '@stream-io/video-filters-web',
];
