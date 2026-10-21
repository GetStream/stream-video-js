`@stream-io/video-client`: the low-level, platform-agnostic client (browser, Node.js, and React Native via the RN SDK). The React and React Native SDKs build on it, so changes here can affect both; verify UI-facing state changes in `sample-apps/react/react-dogfood/`.

## Core Code Pointers

- `index.ts` - public surface/re-exports; start here for API exposure changes.
- `src/StreamVideoClient.ts` - client auth, connection lifecycle, call initialization from coordinator events.
- `src/Call.ts` - main call lifecycle (`setup`, `join`, `leave`), peer setup, reconnect, and teardown.
- `src/events/callEventHandlers.ts` - default event wiring between coordinator/SFU events and state updates.
- `src/store/CallState.ts` - canonical reactive call state and derived observables.
- `src/store/rxUtils.ts` - subscription helpers (`createSafeAsyncSubscription`, `setCurrentValue`) used across state updates.
- `src/helpers/concurrency.ts` - serialization/cancellation primitives (`withoutConcurrency`, `withCancellation`).
- `src/devices/DeviceManager.ts` - device enable/disable/select flow, filter registration, and cancellation behavior.
- `src/helpers/DynascaleManager.ts` - viewport-driven subscription calculation and SFU `updateSubscriptions`.
- `src/rtc/helpers/sdp.ts` - SDP munging helpers (`removeCodecsExcept`, `enableStereo`).
- `src/stats/SfuStatsReporter.ts` - telemetry/stats pipeline and flush/start/stop behavior.
- `src/permissions/PermissionsContext.ts` - capability checks for publish/request flows.

## Commands & tests

- `yarn test` runs in watch mode; use `yarn test --run <file-pattern>` for a single run.
- This package has no `lint` script. CI parity from the repo root: `yarn lint:ci:client`, `yarn test:ci:client`, `yarn build:client`.
- Integration-heavy tests in `src/__tests__/` need `STREAM_API_KEY` and `STREAM_SECRET` in `.env` (see `.env-example`); without them those files fail at import.
- Browser-like tests opt in per file with `@vitest-environment happy-dom`.

## Code Generation

The Coordinator API client (models, `VideoApi`, `CallApi`) is generated from a
local `chat` checkout with the in-house generator (`chat/tools/openapi`):

```bash
# expects ../../../chat; pass a path otherwise
./generate-openapi.sh [path-to-chat-repo]
```

Generated files are placed in `src/gen/coordinator/` and should not be manually edited (the script wipes the directory). Hand-written types belong in `src/gen/shims.ts`. Response dates are unix-nanosecond `TimestampNS` numbers; convert them with the helpers in `src/helpers/time.ts`. The SFU protocol buffer types are in `src/gen/video/sfu/`.

## State

- All state is RxJS `BehaviorSubject`s exposed as observables. Update through `setCurrentValue`/`.next()`, never by mutating values in place.
- Participants are keyed by `sessionId`, not `userId` (one user can join from several devices).
- Participant sorting is visibility-aware: only participants outside the viewport are re-sorted, so visible tiles stay stable.

## Concurrency Control (`src/helpers/concurrency.ts`)

- `withoutConcurrency(tag, fn)`: serial execution, no cancellation. Use for join/leave and other critical state changes.
- `withCancellation(tag, fn)`: serial execution where queuing a new operation aborts the previous one via its `signal`; check `signal.aborted` and stop early. Use for camera/microphone toggling and device switching.
- Operations with the same tag run serially, different tags in parallel. `hasPending(tag)` checks the queue; `settled(tag)` waits for it to drain.

## Errors, events, and logging

- Always check `response.error` on SFU RPC responses before proceeding.
- Long-lived promises that may reject use the `SafePromise` pattern (`helpers/promise.ts`) to avoid unhandled rejections; `promiseWithResolvers()` is the helper for externally resolved promises.
- Always unregister event handlers in cleanup/dispose code; `isSfuEvent(eventName)` distinguishes SFU from coordinator events.
- Loggers are scoped: `videoLoggerSystem.getLogger('<scope>')`. Apps configure them with the `logOptions` client option.

## WebRTC

- Publishing and subscribing use two separate peer connections (Publisher/Subscriber), so each negotiates and ICE-restarts independently.
- Never close peer connections manually; use the `dispose()` methods.
- Transceivers are reused when replacing tracks (`TransceiverCache`) to stay under per-platform transceiver limits (notably mobile Safari).
- Orphaned tracks: a track can arrive before its participant's join event. The subscriber stores it as orphaned and attaches it when `participantJoined` arrives; keep that path intact when touching track association.
