# Plan: Fulfill/Fail CallKit Actions Based on Server Result

## GIT Branch explanation

this branch is to be merged to the branch feat/callkit-telecom-integration. Can you make sure that the diff you do to check the code is based on that

## Problem

`CXAnswerCallAction` and `CXEndCallAction` are fulfilled immediately in `CallingxImpl.swift` before JS finishes processing (join/leave). This causes:

- CallKit UI can't block other calls while join/end is in progress
- Quick decline doesn't work when JS bridge hasn't loaded yet

## Solution

Defer `action.fulfill()` / `action.fail()` until JS reports the server result back via `fulfillAnswerCallAction` / `fulfillEndCallAction`.

## Files to Modify

| File                                                                   | Change                                                                                            |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `packages/react-native-callingx/ios/CallingxImpl.swift`                | Pending action dicts + serial DispatchQueue, defer fulfill, 10s safety timer, new fulfill methods |
| `packages/react-native-callingx/ios/Callingx.mm`                       | Bridge methods (new-arch + old-arch)                                                              |
| `packages/react-native-callingx/android/.../CallingxModuleImpl.kt`     | Empty stubs                                                                                       |
| `packages/react-native-callingx/android/.../newarch/CallingxModule.kt` | Bridge methods                                                                                    |
| `packages/react-native-callingx/android/.../oldarch/CallingxModule.kt` | Bridge methods                                                                                    |
| `packages/react-native-sdk/src/utils/push/setupCallingExpEvents.ts`    | Call fulfill/fail after processing                                                                |
| `packages/react-native-sdk/src/utils/push/internal/utils.ts`           | Re-throw errors from processCallFromPush                                                          |

## Implementation Details

### 1. iOS Native — `CallingxImpl.swift`

- Add `pendingAnswerActions: [String: CXAnswerCallAction]` and `pendingEndActions: [String: CXEndCallAction]`
- Add serial `DispatchQueue(label: "io.getstream.callingx.pendingActions")` for thread safety
- In `provider(_:perform action: CXAnswerCallAction)`: store action, remove `action.fulfill()`, add 10s safety timer
- In `provider(_:perform action: CXEndCallAction)`: same pattern
- New public methods: `fulfillAnswerCallAction(_:didFail:)` and `fulfillEndCallAction(_:didFail:)`
- Safety timer auto-fulfills if JS never responds (uses `removeValue` — returns nil if already fulfilled = no-op)
- Thread safety: CXProvider delegate queue writes, RCT bridge queue reads — serial DispatchQueue serializes all access

### 2. iOS Bridge — `Callingx.mm`

- Add `fulfillAnswerCallAction:didFail:` and `fulfillEndCallAction:didFail:` for both `RCT_NEW_ARCH_ENABLED` and old-arch

### 3. Android — Empty stubs

- no-op: Android Telecom doesn't require explicit action fulfillment

### 4. JS — `setupCallingExpEvents.ts`

- `onAcceptCall`: wrap `processCallFromPushInBackground` in try/catch, call `fulfillAnswerCallAction(call_cid, didFail)`
- `onEndCall`: same pattern with `fulfillEndCallAction`
- Delayed events from `getInitialEvents()` also go through the same fulfill/fail path (via onAcceptCall/onEndCall)

### 5. Propagate errors from `processCallFromPush`

- `processCallFromPush`: re-throw after logging so caller can detect failure
- `processCallFromPushInBackground`: throw instead of silently returning when client creation fails

## Notes

- TurboModule spec (`NativeCallingx.ts`) and JS module (`CallingxModule.ts`) already had `fulfillAnswerCallAction`/`fulfillEndCallAction` defined — only native implementations were missing
- Both app-initiated (`source == "app"`) and system-initiated actions are deferred; JS always calls fulfill after join/leave
