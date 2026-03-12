# Plan: Align with REVIEW.md Decision Matrix

3 gaps to fix, all small changes.

## Gap 1: `onRingingCall` failure swallowed

**File:** `packages/react-native-sdk/src/utils/push/internal/utils.ts` (line 105-108)

Currently `processCallFromPush` catches `onRingingCall` failure and `return`s. The caller sees success, so answer action gets `didFail = false` → wrongly fulfilled.

**Fix:** Change `return` to `throw e` (same pattern already applied to the other catch block in this function).

```ts
// Before
} catch (e) {
  logger.error('failed to fetch call from push notification', e);
  return;  // ← swallows error
}

// After
} catch (e) {
  logger.error('failed to fetch call from push notification', e);
  throw e;  // ← propagate so caller can fail the action
}
```

## Gap 2: Safety timeout should differ by action type

**File:** `packages/react-native-callingx/ios/CallingxImpl.swift`

Answer timeout (line 687): change `pending.fulfill()` → `pending.fail()`
End timeout (line 724): stays as `pending.fulfill()` — already correct.

```swift
// Answer safety timer — line 687
// Before
pending.fulfill()
// After
pending.fail()
```

**Rationale:** Answer timeout = call never connected, don't fake success. End timeout = user wants to hang up, always let it close.

## Gap 3: End action always fulfills from JS

**File:** `packages/react-native-sdk/src/utils/push/setupCallingExpEvents.ts` (lines 146-155)

`onEndCall` currently tracks `didFail` and passes it through. Per the matrix, end should always fulfill — server leave/decline failure shouldn't block the UI.

**Fix:** Remove `didFail` tracking, always pass `false`.

```ts
// Before
let didFail = false;
try {
  await processCallFromPushInBackground(pushConfig, call_cid, 'decline');
} catch (err) {
  didFail = true;
  logger.error('Failed to process endCall event', err);
}
callingx.fulfillEndCallAction(call_cid, didFail);

// After
try {
  await processCallFromPushInBackground(pushConfig, call_cid, 'decline');
} catch (err) {
  logger.error('Failed to process endCall event', err);
}
callingx.fulfillEndCallAction(call_cid, false);
```

## Summary

| #   | File                       | Change                                            | Lines    |
| --- | -------------------------- | ------------------------------------------------- | -------- |
| 1   | `utils.ts`                 | `return` → `throw e` in `onRingingCall` catch     | 1 line   |
| 2   | `CallingxImpl.swift`       | Answer safety timer: `fulfill()` → `fail()`       | 1 line   |
| 3   | `setupCallingExpEvents.ts` | End action: remove `didFail`, always pass `false` | ~4 lines |

No new files. No API changes. No Android changes needed.
