# Review: CallKit `fulfill()` vs `fail()` Decision Matrix

## Goal

Define a stable policy for when to call `action.fulfill()` vs `action.fail()` for:

- `CXAnswerCallAction` (answer)
- `CXEndCallAction` (end/decline/hangup)

This is tailored to the current branch flow (native action deferred until JS finishes push/call processing).

## Ground Truth (Apple)

- `fulfill()` and `fail()` both complete the action (`isComplete = true`).
- Calling either more than once (or after the other) has no effect.
- Calling them asynchronously is supported.
- If an action times out, CallKit invokes `provider(_:timedOutPerforming:)`; timed out actions should not be fulfilled/failed afterward.
- Timeout may force the call to end depending on action type.

## Policy Summary

- **Answer action** should reflect media/session readiness: if accept/join failed, use `fail()`.
- **End action** should reflect user intent to terminate UI/session: usually `fulfill()` even if server-side leave/decline fails.

Reason: users expect "end" to close immediately, while "answer" should only succeed if the call actually starts.

## Decision Matrix

| Action               | Condition                                   | CallKit completion   | Notes                                                      |
| -------------------- | ------------------------------------------- | -------------------- | ---------------------------------------------------------- |
| `CXAnswerCallAction` | Call lookup fails / invalid UUID            | `fail()`             | Action cannot be performed.                                |
| `CXAnswerCallAction` | Client creation fails                       | `fail()`             | Cannot progress to join.                                   |
| `CXAnswerCallAction` | Fetch call (`onRingingCall`) fails          | `fail()`             | Do not treat as success.                                   |
| `CXAnswerCallAction` | `join()` (accept path) fails                | `fail()`             | Prevent false "answered" UI state.                         |
| `CXAnswerCallAction` | Accept path succeeds                        | `fulfill()`          | Optional: `fulfill(withDateConnected:)` when available.    |
| `CXAnswerCallAction` | JS never responds before safety timeout     | `fail()`             | Better than false positive success.                        |
| `CXEndCallAction`    | Normal end/decline succeeds                 | `fulfill()`          | Optional: `fulfill(withDateEnded:)`.                       |
| `CXEndCallAction`    | Server leave/decline fails (network/server) | `fulfill()`          | Keep UX deterministic; log + retry/best-effort separately. |
| `CXEndCallAction`    | Local call already gone/ended               | `fulfill()` (prefer) | Avoid stuck "end" UX due stale local state.                |
| `CXEndCallAction`    | JS never responds before safety timeout     | `fulfill()`          | User asked to end; do not block UI.                        |

## How `didFail` Should Be Interpreted

- For `fulfillAnswerCallAction(callId, didFail)`:
  - `didFail = true` => `action.fail()`
  - `didFail = false` => `action.fulfill()`

- For `fulfillEndCallAction(callId, didFail)`:
  - Recommended: treat most operational errors as `didFail = false` (still fulfill).
  - Reserve `didFail = true` only for true action-level invalidity where "end" should be rejected (rare).

## Branch-Specific Gaps to Align With This Matrix

1. **Answer fetch path still swallows one error**  
   `processCallFromPush` currently returns on `onRingingCall` failure.  
   It should throw so answer can correctly call `fail()`.

2. **End state mutates before completion outcome**  
   Current flow marks ended/removes CID before deferred completion is finalized.  
   If you keep `fail()` reachable on end, this can desync local state vs CallKit.

3. **Safety timeout behavior should differ by action type**
   - Answer timeout -> fail
   - End timeout -> fulfill

## Recommended Test Scenarios

- Answer success -> action fulfilled.
- Answer: client creation failure -> action failed.
- Answer: fetch failure -> action failed.
- Answer: join failure -> action failed.
- End success -> action fulfilled.
- End: server decline/leave failure -> still fulfilled.
- Answer timeout with no JS callback -> failed.
- End timeout with no JS callback -> fulfilled.
- Late JS callback after timeout -> ignored (no crash, no duplicate completion).
