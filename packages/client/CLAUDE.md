## Overview

This is `@stream-io/video-client`, the low-level JavaScript/TypeScript client for Stream Video SDK.
It provides WebRTC-based video calling functionality for both browser and Node.js environments, serving as the foundation for the React and React Native SDKs in this monorepo.

## Agent Fast Path

Use this workflow for efficient iteration:

1. Scope the change to one subsystem first (`src/rtc`, `src/events`, `src/devices`, `src/store`, etc.).
2. Run package-local commands while iterating (`yarn test <pattern>`, `yarn build`).
3. Run root CI-parity checks for this package before finishing (`yarn lint:ci:client`, `yarn test:ci:client`, `yarn build:client`).
4. Run full-monorepo checks only when the change crosses package boundaries.

## Core Code Pointers

- `index.ts` - public surface/re-exports; start here for API exposure changes.
- `src/StreamVideoClient.ts` - client auth, connection lifecycle, call initialization from coordinator events.
- `src/Call.ts` - main call lifecycle (`setup`, `join`, `leave`), peer setup, reconnect, and teardown.
- `src/events/callEventHandlers.ts` - default event wiring between coordinator/SFU events and state updates.
- `src/store/CallState.ts` - canonical call state: one store plus derived state.
- `src/store/subscribable.ts` - the reactive primitives (`createSubscribable`, `field`, `select`, `firstValue`).
- `src/store/subscription.ts` - subscription helpers (`createSubscription`, `createSafeAsyncSubscription`, `serializeAsync`). Internal: import from this module, not from `src/store`, which deliberately does not re-export them.
- `src/helpers/concurrency.ts` - serialization/cancellation primitives (`withoutConcurrency`, `withCancellation`).
- `src/devices/DeviceManager.ts` - device enable/disable/select flow, filter registration, and cancellation behavior.
- `src/helpers/DynascaleManager.ts` - viewport-driven subscription calculation and SFU `updateSubscriptions`.
- `src/rtc/helpers/sdp.ts` - SDP munging helpers (`removeCodecsExcept`, `enableStereo`).
- `src/stats/SfuStatsReporter.ts` - telemetry/stats pipeline and flush/start/stop behavior.
- `src/permissions/PermissionsContext.ts` - capability checks for publish/request flows.

## Build & Development Commands

```bash
# From packages/client

# Build the client
yarn build

# Watch mode (rebuilds on changes)
yarn start

# Run tests
yarn test

# Run tests with coverage (for CI)
yarn test-ci

# Clean build artifacts
yarn clean

# From repo root (CI parity for this package)
yarn lint:ci:client
yarn test:ci:client
yarn build:client
```

### Running Tests

- Single test file: `yarn test --run <file-pattern>`
- Watch mode (default): `yarn test` runs in watch mode
- CI mode: `yarn test-ci` runs once with coverage
- Integration-heavy tests are mostly in `src/__tests__/` and require `STREAM_API_KEY` + `STREAM_SECRET`

### Monorepo Commands

From the root of the monorepo:

```bash
# Build just the client
yarn build:client

# Build all packages in dependency order
yarn build:all

# Run tests across all packages
yarn test:ci:all

# Lint all packages
yarn lint:all
```

## Code Generation

This package uses OpenAPI code generation for the Coordinator API models:

```bash
# Generate from protocol repo (production)
./generate-openapi.sh protocol

# Generate from chat repo (development)
./generate-openapi.sh chat
```

Generated files are placed in `src/gen/coordinator/` and should not be manually edited. The SFU protocol buffer types are in `src/gen/video/sfu/`.

## Architecture

### Core Classes

**Three-Layer Architecture:**

1. **StreamVideoClient** (`src/StreamVideoClient.ts`)
   - Entry point for the SDK
   - Handles authentication and connection to the Coordinator API
   - Manages Call instances
   - Provides reactive state store for global client state
   - Singleton pattern with instance tracking

2. **Call** (`src/Call.ts`)
   - Represents a video/audio call session
   - Manages call lifecycle (join, leave, end)
   - Orchestrates Publisher and Subscriber peer connections
   - Exposes CallState for reactive UI updates
   - Handles permissions, reactions, recording, broadcasting

3. **StreamSfuClient** (`src/StreamSfuClient.ts`)
   - Low-level client for communicating with the SFU (Selective Forwarding Unit)
   - Manages WebSocket connection for real-time signaling
   - Handles RPC calls to the SFU (join, publish, subscribe, ICE trickle)

### WebRTC Layer (`src/rtc/`)

The WebRTC implementation uses a Publisher/Subscriber pattern:

- **Publisher** (`Publisher.ts`): Manages outgoing media streams (camera, microphone, screen share)
- **Subscriber** (`Subscriber.ts`): Handles incoming media streams from other participants
- **BasePeerConnection** (`BasePeerConnection.ts`): Shared RTCPeerConnection management
- **Dispatcher** (`Dispatcher.ts`): Event dispatcher for SFU events
- **IceTrickleBuffer** (`IceTrickleBuffer.ts`): Buffers ICE candidates during negotiation

Key concepts:

- Each peer connection handles either publishing OR subscribing (not both)
- TransceiverCache manages reusable transceivers for track replacement
- SDP manipulation for codec preference and stereo audio

### State Management (`src/store/`)

Built on `@stream-io/state-store`. There is no RxJS anywhere in this package.

- **CallState** (`CallState.ts`): all call-related state in a _single_ store
  - One `StateStore<CallStateShape>`, so a server payload that touches many
    fields is one atomic update - subscribers never see a half-applied change
  - Derived values (`localParticipant`, `remoteParticipants`, `dominantSpeaker`,
    `participantsBySessionId`, …) are real keys maintained by a preprocessor,
    so reading them is a plain field access
  - `foo$` properties are `Subscribable` views over store keys, for consumers
    that want to react rather than read
- **StreamVideoWriteableStateStore** (`stateStore.ts`): global client state
  - Manages calls, ringing calls, active call
- **CallingState** (`CallingState.ts`): Enum for call lifecycle states
- **subscribable.ts**: the primitives - `createSubscribable`, `field`, `select`,
  `firstValue`. Deliberately small; it is not an operator library. Timing
  concerns (debounce) live in the view layer that needs them.

### Events (`src/events/`)

Event handling is split between:

- Coordinator events (WebSocket from backend): call created, participant joined, permissions updated
- SFU events (WebSocket from SFU): tracks published, ICE candidates, connection quality
- Local events: device changes, track muting

Event handlers are registered in `callEventHandlers.ts` and wire up backend events to state updates.

### Devices (`src/devices/`)

Device management abstraction for:

- Enumerating cameras, microphones, speakers
- Requesting media permissions
- Device change detection
- Platform-specific handling (browser vs React Native)

### Stats & Telemetry (`src/stats/`)

**SfuStatsReporter** (`SfuStatsReporter.ts`):

- Collects WebRTC stats from Publisher and Subscriber peer connections
- Aggregates trace data from multiple sources (SFU client, publisher, subscriber, tracer)
- Periodic reporting via intervals (configurable `reporting_interval_ms`)
- Sends both legacy stats and new coordinator stats formats
- Supports rollback mechanism on failure to prevent data loss

**Tracer** (`stats/rtc/`):

- Lightweight performance tracing for WebRTC operations
- Captures timing data for operations like `getstats`, negotiation, connection
- Trace records can be rolled back if stats submission fails
- Used for debugging connection quality and performance issues

### Dynascale System (`src/helpers/`)

**DynascaleManager** (`DynascaleManager.ts`):

- Intelligent bandwidth management system that adapts video quality based on viewport visibility
- Binds video/audio elements to participant session IDs
- Tracks element visibility using IntersectionObserver
- Automatically adjusts video subscriptions based on:
  - Whether participant video is visible in viewport
  - Video element dimensions (requests appropriate resolution)
  - Published tracks availability
- Debounces subscription updates to avoid excessive SFU calls
- Manages audio routing through AudioContext for advanced features

**ViewportTracker** (`ViewportTracker.ts`):

- Wrapper around IntersectionObserver for viewport visibility tracking
- Handles queuing of elements before viewport is set
- Returns cleanup functions to prevent memory leaks
- Used by DynascaleManager to determine which participants are visible

### Participant Sorting (`src/sorting/`)

Sophisticated sorting system with multiple presets:

- **defaultSortPreset**: Screen share → Pinned → Dominant speaker → Speaking → Raised hand → Publishing video → Publishing audio
- **speakerLayoutSortPreset**: Optimized for speaker-focused layouts
- **paginatedLayoutSortPreset**: For layouts that render participants in pages
- **livestreamOrAudioRoomSortPreset**: Role-based sorting (admin/host/speaker)

Sorting is **visibility-aware**: only applies sorting logic to invisible participants to ensure stable ordering for visible ones.

### Permissions System (`src/permissions/`)

**PermissionsContext** (`PermissionsContext.ts`):

- Manages OwnCapability permissions for the current user
- Helper methods: `hasPermission()`, `canPublish(trackType)`, `canRequest(permission)`
- Integrates with CallSettingsResponse to check if permissions can be requested
- Used throughout Call to gate operations based on user permissions

## Key Patterns

### Class Style

- All class methods (including `private`/`protected`) are **arrow-function class fields**, not method syntax. This preserves `this` binding automatically across callbacks and subscriptions that pull methods off instances (`call.leave`, dispatcher listeners, store subscribers, etc.) and matches existing code throughout `src/`.

  ```ts
  // good (matches the codebase)
  class Publisher extends BasePeerConnection {
    restartIce = async (): Promise<void> => {
      /* ... */
    };
    private negotiate = async (options?: RTCOfferOptions): Promise<void> => {
      /* ... */
    };
  }

  // bad
  class Publisher extends BasePeerConnection {
    async restartIce(): Promise<void> {
      /* ... */
    }
    private async negotiate(options?: RTCOfferOptions): Promise<void> {
      /* ... */
    }
  }
  ```

- Declare state as explicit class fields at the body level (not TypeScript parameter-property shorthand) and assign from the constructor body. Initialize constants inline.

  See the root `AGENTS.md` "Class style" section for the full rule and rationale.

### Reactive State

State lives in a `StateStore`. Write through the documented setters, which
apply one atomic update:

```ts
call.state.setParticipants(updatedParticipants);
// several fields at once - subscribers see them together, never half-applied
call.state.setState({ recording: true, transcribing: true });
```

Read synchronously - it is a field access, not a subscription:

```ts
const participants = call.state.participants;
```

Subscribe only when you need to react to changes:

```ts
const unsubscribe = call.state.participants$.subscribe((participants) => {
  // update UI
});
```

Reading several fields? Subscribe once with a selector rather than stacking
subscriptions:

```ts
call.state.store.subscribeWithSelector(
  (state) => ({
    callingState: state.callingState,
    count: state.participantCount,
  }),
  ({ callingState, count }) => {
    /* ... */
  },
);
```

Per-participant lookups must go through the index, or a single update costs
O(participants x subscribers):

```ts
state.participantsBySessionId[sessionId]; // good
state.participants.find((p) => p.sessionId === sessionId); // avoid
```

### Concurrency Control (`src/helpers/concurrency.ts`)

**Two concurrency patterns:**

1. **withoutConcurrency** - Serial execution without cancellation:

```ts
await withoutConcurrency(this.connectionConcurrencyTag, async () => {
  // Operations run one after another
  // Previous operation completes before next starts
  // Use for: join/leave operations, critical state changes
});
```

2. **withCancellation** - Serial execution with automatic cancellation:

```ts
await withCancellation(this.deviceToggleTag, async (signal) => {
  // If a new operation is queued, previous one is aborted via signal
  // Check signal.aborted to stop work early
  // Use for: camera/microphone toggling, device switching
  if (signal.aborted) return 'canceled';
  // ... do work
});
```

**Key concepts:**

- Operations with the same tag run serially, different tags run in parallel
- `hasPending(tag)` checks if operations are queued
- `settled(tag)` waits for all queued operations to finish
- Prevents race conditions in async operations like joining calls or toggling devices

### Error Handling

**Common error patterns:**

- **NegotiationError** (`rtc/NegotiationError.ts`): WebRTC negotiation failures
- Always check `response.error` from SFU RPC calls before proceeding
- **SafePromise pattern** (`helpers/promise.ts`): For long-lived promises that may reject
  - Wraps promises to prevent unhandled rejection errors
  - Provides `checkPending()` to check if promise is still pending
  - Used in StreamClient WebSocket connection management

**PromiseWithResolvers pattern:**

```ts
const { promise, resolve, reject, isResolved } = promiseWithResolvers<T>();
// Allows external resolution/rejection of promises
// Useful for coordinating async operations
```

### Event System

**Dispatcher pattern** (`rtc/Dispatcher.ts`):

- Type-safe event dispatcher for SFU events
- Events are discriminated unions via `oneofKind` pattern
- Subscribe: `dispatcher.on('participantJoined', (event) => ...)`
- Returns unsubscribe function for cleanup
- All listener errors are caught and logged to prevent one bad listener from breaking others

**Coordinator vs SFU events:**

- **Coordinator events**: High-level call events (call.ring, call.created, permissions.updated)
- **SFU events**: Low-level WebRTC events (tracks published, ICE candidates, connection quality)
- Use `isSfuEvent(eventName)` to distinguish between the two

### SDP Manipulation (`rtc/helpers/sdp.ts`)

Critical helpers for WebRTC negotiation:

- **removeCodecsExcept(sdp, codecMimeType, fmtpProfile)**: Forces specific codec preference
  - Removes all other codecs from SDP
  - Used to ensure consistent codec across platforms (e.g., force H.264 for compatibility)
  - Supports fmtp profile matching for codec variants

- **enableStereo(offerSdp, answerSdp)**: Enables stereo audio in answer
  - Parses offer to detect stereo support
  - Modifies answer SDP to enable stereo=1 for Opus codec
  - Required for high-quality audio in music/DJ applications

- **extractMid(transceiver, index, sdp)**: Extracts media ID from transceiver
  - Critical for track association in Publisher/Subscriber
  - Handles cases where mid isn't immediately available

### Logging

Scoped logger system with configurable log levels:

```ts
this.logger.debug('message', metadata);
this.logger.warn('warning', error);
this.logger.error('error', error);
```

Loggers are scoped by component (e.g., 'DynascaleManager', 'Publisher', 'Subscriber') for easier debugging.

## Package Structure

```
src/
├── Call.ts                    # Main Call class
├── StreamVideoClient.ts       # Client entry point
├── StreamSfuClient.ts         # SFU communication
├── CallType.ts                # Call type definitions
├── types.ts                   # Core type definitions
├── coordinator/               # Coordinator API client
│   └── connection/            # WebSocket connection management
├── rtc/                       # WebRTC implementation
│   ├── Publisher.ts
│   ├── Subscriber.ts
│   ├── BasePeerConnection.ts
│   └── helpers/               # SDP manipulation, track helpers
├── store/                     # State management
│   ├── CallState.ts
│   └── stateStore.ts
├── events/                    # Event handlers
├── devices/                   # Device management
├── stats/                     # Call statistics and reporting
├── helpers/                   # Utilities
│   └── types.ts               # Audio-health + host-audio-session type definitions
├── permissions/               # Permissions handling
├── sorting/                   # Participant sorting
└── gen/                       # Generated code (do not edit)
    ├── coordinator/           # OpenAPI generated models
    ├── video/sfu/             # Protobuf generated code
    └── google/protobuf/       # Protobuf runtime models
```

## Testing

- Tests use Vitest; browser-like behavior is enabled in specific files via `@vitest-environment happy-dom`
- Tests are colocated across many `__tests__` folders (not only `src/__tests__/`)
- `src/__tests__/clientTestUtils.ts` provides shared integration helpers
- Coverage config includes `src/**` and excludes `**/__tests__/**` plus `src/gen/**`
- Integration tests require `STREAM_API_KEY` and `STREAM_SECRET` in `.env` (see `.env-example`)

## Build System

- **Rollup** for bundling (see `rollup.config.mjs`)
- Produces 3 bundles:
  - `dist/index.es.js` - Node.js ESM
  - `dist/index.cjs.js` - Node.js CommonJS
  - `dist/index.browser.es.js` - Browser ESM (excludes Node.js modules)
- TypeScript compilation for type definitions
- Source maps included in all builds

## Important Notes

### When Working with State

- Always update state through the `CallState` setters, never mutate directly
- Participants use `sessionId` as the unique identifier, not `userId`
- Track lookup uses `trackLookupPrefix` which combines participant ID and track type

### When Working with WebRTC

- Never manually close peer connections, use the dispose() methods
- ICE restart is handled automatically on connection failures
- SDP munging for codec selection happens in `removeCodecsExcept()` helper
- Transceiver reuse prevents track limit issues on some platforms

### When Working with Events

- SFU events arrive through Dispatcher
- Coordinator events arrive through StreamClient event handlers
- Always unregister event handlers in cleanup/disposal code

### Generated Code

- `src/gen/` directory contains auto-generated code from OpenAPI and Protocol Buffers (`coordinator/`, `video/sfu/`, and `google/protobuf/`)
- Do not manually edit these files
- Regenerate using `./generate-openapi.sh protocol`
- Types from generated code are re-exported through `index.ts`

### Build Artifacts

- Do not manually edit `dist/` or `coverage/`; regenerate them using scripts

## Common Workflows & Architectural Decisions

### Call Join Flow

1. `Call.join()` creates StreamSfuClient with credentials
2. StreamSfuClient opens WebSocket connection to SFU
3. Join request sent via WebSocket, returns JoinResponse with SFU details
4. Publisher and Subscriber peer connections created
5. Publisher negotiates (if publishing tracks)
6. Subscriber receives offer from SFU and negotiates
7. ICE candidates trickled via IceTrickleBuffer
8. Event handlers registered for participant updates
9. Call state transitions to `JOINED`

### Track Publishing Flow

1. Check permissions via `PermissionsContext.canPublish(trackType)`
2. Get MediaStreamTrack from device
3. `Publisher.publishTrack(track, trackType, opts)`
4. Publisher adds track to peer connection via transceiver
5. SDP negotiation with codec preference (via `removeCodecsExcept`)
6. Layers calculated for video (SVC/simulcast)
7. SFU receives track, sends `trackPublished` event
8. Other participants receive `participantJoined` or `trackPublished` events
9. State updated via CallState setters

### Track Subscription Flow (Dynascale)

1. Participant joins, `trackPublished` event received
2. CallState adds participant with track info
3. DynascaleManager tracks which participants are visible in viewport
4. ViewportTracker uses IntersectionObserver to detect visibility changes
5. When participant becomes visible, DynascaleManager calculates optimal resolution
6. Subscription details sent to SFU via `updateSubscriptions`
7. Subscriber receives tracks via `onTrack` event
8. Tracks associated with participants via `trackLookupPrefix`
9. MediaStream attached to video elements in UI layer

### Stats Reporting Flow

1. SfuStatsReporter started with configurable interval
2. Periodically calls `Publisher.stats.get()` and `Subscriber.stats.get()`
3. Collects trace data from multiple tracers (SFU, publisher, subscriber)
4. Aggregates WebRTC stats (encode/decode stats, connection quality)
5. Sends to SFU via `sendStats()` or to Coordinator via HTTP
6. On failure, tracers rollback to prevent data loss
7. Stats used for debugging, quality monitoring, and analytics

### Orphaned Tracks Handling

When tracks arrive before participant join events:

1. Subscriber's `onTrack` receives track with `participantId:trackType` stream ID
2. If participant not found in CallState, track stored as "orphaned"
3. When `participantJoined` event arrives, orphaned tracks are associated
4. This handles race conditions in distributed event delivery

### Migration & Reconnection

- **SFU Migration**: When SFU goes down, Call receives `goAway` event
  - New SFU credentials fetched
  - StreamSfuClient reconnects to new SFU
  - Peer connections migrated or recreated
  - State preserved throughout migration

- **ICE Restart**: On connection failure
  - Automatic ICE restart via `iceRestart` event
  - New ICE candidates gathered and exchanged
  - Connection re-established without full reconnection

### Memory Management

- Always call `dispose()` on Call, Publisher, Subscriber when done
- Unregister event listeners to prevent memory leaks
- ViewportTracker returns cleanup functions for IntersectionObserver
- DynascaleManager disposes AudioContext on cleanup
- SafePromise pattern prevents unhandled rejection memory issues

## Debugging Tips

### Enable Verbose Logging

```ts
const client = new StreamVideoClient({
  apiKey: 'key',
  options: {
    logLevel: 'debug', // or 'info', 'warn', 'error'
  },
});
```

### Common Issues

**Tracks not appearing:**

- Check permissions via `call.permissionsContext.canPublish(trackType)`
- Verify track is published: `call.state.localParticipant.publishedTracks`
- Check subscriber received track: look for "onTrack" logs
- Verify track not in orphaned tracks list

**Connection quality issues:**

- Check stats via SfuStatsReporter
- Look for ICE connection state in logs
- Verify codec selection in SDP
- Check if Dynascale is reducing quality due to viewport visibility

**State not updating:**

- Reads are synchronous (`call.state.participants`); you only need `subscribe()` to react to changes
- Check that a setter is actually being called on state updates
- Verify event handlers are registered before events arrive

**Concurrency issues:**

- Use `withoutConcurrency` for operations that must be serial
- Check `hasPending(tag)` before assuming operation completed
- Ensure tags are consistent (use Symbol for guaranteed uniqueness)

## WebRTC-Specific Patterns

### Publisher/Subscriber Separation

Unlike typical WebRTC implementations that use a single peer connection, this SDK uses two separate connections:

- **Publisher**: Uploads local tracks (audio, video, screen share) to SFU
- **Subscriber**: Downloads remote tracks from SFU
- **Why**: Simplifies SDP negotiation, allows independent ICE restart, scales better for large calls

### Transceiver Management

- **TransceiverCache** (`rtc/TransceiverCache.ts`): Reuses transceivers to avoid browser limits
- When replacing tracks, reuses existing transceiver instead of creating new one
- Critical for platforms with transceiver limits (especially mobile Safari)

### Video Layers (SVC/Simulcast)

- **SVC (Scalable Video Coding)**: Single encoded stream with multiple quality layers (VP9, AV1)
- **Simulcast**: Multiple encoded streams at different qualities (H.264, VP8)
- Layer selection computed in `rtc/layers.ts` based on:
  - Codec capabilities (VP9 supports SVC, H.264 requires simulcast)
  - Publishing options from call settings
  - Platform constraints (React Native has different capabilities)
- SFU uses layers for Dynascale - subscribers request specific layers based on viewport

### Codec Selection Strategy

- Default preference: VP8 (widest compatibility)
- Can be overridden via call settings or publish options
- Browser-specific handling:
  - Safari: Often requires H.264 for hardware acceleration
  - Firefox: Better VP9 support
  - Chrome: Best overall codec support
- Codec forced via `removeCodecsExcept()` during SDP munging

### Platform Differences

Detected via helpers in `src/helpers/`:

- **isReactNative()**: React Native requires different WebRTC APIs
- **isSafari()**, **isFirefox()**, **isMobileSafari()**: Browser-specific quirks
- Example quirks:
  - Safari requires user interaction to resume AudioContext
  - React Native uses different WebRTC implementation (react-native-webrtc)
  - Mobile Safari has stricter autoplay policies

## Performance Considerations

### Bandwidth Optimization

- **Dynascale** automatically reduces bandwidth by:
  - Not subscribing to tracks of invisible participants
  - Requesting lower resolution for small video elements
  - Pausing video tracks when off-screen
- **Debouncing**: Subscription updates debounced to avoid excessive SFU calls

### Memory Optimization

- Tracks are cloned when necessary (Publisher clones to prevent conflicts)
- Cloned tracks cleaned up in `Publisher.dispose()`
- Orphaned tracks garbage collected when participants leave
- Event handlers removed via returned unsubscribe functions

### State Update Performance

- One store per call: a write notifies every subscriber, and each one's
  selector decides whether anything it cares about actually changed
- `field()` and `select()` deduplicate, so an unrelated write does not wake a
  subscriber; `select()` also memoises, which `useSyncExternalStore` requires
- Derived state (e.g. `remoteParticipants`) is computed once per participant
  change by the preprocessor, not per reader
- `bench/` compares this against the pre-migration RxJS build

## Cross-Package Integration

This package is consumed by:

- **@stream-io/video-react-bindings**: React hooks built on `useSyncExternalStore`
- **@stream-io/video-react-sdk**: UI components built on top of bindings
- **@stream-io/video-react-native-sdk**: React Native components with platform-specific device handling

When making changes:

- Consider the impact on React hooks that subscribe to call state
- Test with both browser and React Native environments
- Verify changes don't break existing UI components
- Check sample apps in `sample-apps/react/react-dogfood/`
