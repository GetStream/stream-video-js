# Progress: Fulfill/Fail CallKit Actions Based on Server Result

## Status: COMPLETE

All 7 files modified, callingx package builds successfully.

## What Was Done

### 1. `CallingxImpl.swift` — Core iOS change

- Added 3 new properties: `pendingAnswerActions`, `pendingEndActions`, `pendingActionsQueue` (serial DispatchQueue)
- Modified `provider(_:perform action: CXAnswerCallAction)`:
  - Removed `action.fulfill()` (was line 675)
  - Store action in `pendingAnswerActions[cid]` via **sync** dispatch on serial queue (ensures action is in dict before safety timer or JS can access it)
  - Added 10s safety timer that auto-fulfills via `removeValue` (no-op if already fulfilled)
- Modified `provider(_:perform action: CXEndCallAction)`:
  - Same pattern — removed `action.fulfill()`, sync store + safety timer
- Added `providerDidReset`: clears both pending action dictionaries to prevent memory leaks (after reset, all CXActions are invalid)
- Added new MARK section "Pending Action Fulfillment" with two `@objc public` methods:
  - `fulfillAnswerCallAction(_ callId: String, didFail: Bool)` — removes from dict, calls fail/fulfill
  - `fulfillEndCallAction(_ callId: String, didFail: Bool)` — same pattern

### 2. `Callingx.mm` — iOS bridge

- Added `#pragma mark - fulfillAnswerCallAction` with new-arch and old-arch branches
- Added `#pragma mark - fulfillEndCallAction` with new-arch and old-arch branches
- Both delegate to `[_moduleImpl fulfillAnswerCallAction:callId didFail:didFail]`

### 3. Android (3 files) — Empty stubs

- `CallingxModuleImpl.kt`: Added `fulfillAnswerCallAction` and `fulfillEndCallAction` as no-op methods
- `newarch/CallingxModule.kt`: Added override methods delegating to impl
- `oldarch/CallingxModule.kt`: Added `@ReactMethod` annotated methods delegating to impl

### 4. `setupCallingExpEvents.ts` — JS fulfill/fail calls

- `onAcceptCall`:
  - App-initiated (`source === 'app'`): fulfill immediately so CallKit completes the action without waiting for safety timer
  - System-initiated: wrap `processCallFromPushInBackground` in try/catch, set `didFail` flag, then call `callingx.fulfillAnswerCallAction(call_cid, didFail)`
  - No unnecessary try/catch around the fulfill call itself (synchronous, won't throw)
- `onEndCall`: Same pattern with `fulfillEndCallAction`
- Delayed events already go through `onAcceptCall`/`onEndCall` so they inherit the fulfill/fail behavior

### 5. `internal/utils.ts` — Error propagation

- `processCallFromPush`: Added `throw e` after the `logger.warn` in the catch block
- `processCallFromPushInBackground`: Changed `return` to `throw` when `videoClient` is null or creation fails

## Build Verification

- `react-native-callingx` package: TypeScript compiles and bob build succeeds
- `react-native-sdk`: Has pre-existing TS errors (can't resolve `@stream-io/react-native-callingx` module, missing `@types/lodash.merge`, etc.) — not caused by these changes
- Pre-existing issue: `bob` command not found when running via `yarn build:react-native:deps` (PATH issue in workspace scripts)
