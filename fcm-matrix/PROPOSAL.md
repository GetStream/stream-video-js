# Android FCM: handle Stream ring pushes in a BroadcastReceiver

**Package:** `@stream-io/react-native-callingx` (used by `@stream-io/video-react-native-sdk`)
**Status:** Prototype implemented on `fcm-broadcast-receiver` (commit "feat(react-native-callingx): …").
Device verification not started.

## 1. Problem

- Google Play services sends every push to the app as the `com.google.android.c2dm.intent.RECEIVE`
  broadcast. Every receiver with that intent-filter gets it.
- Firebase's own `FirebaseInstanceIdReceiver` then calls **one** `FirebaseMessagingService`:
  `ServiceStarter.resolveServiceClassName` → `PackageManager.resolveService(MESSAGING_EVENT)`
  picks the highest priority, and ties are effectively random. Only that service gets
  `onMessageReceived` / `onNewToken`.
- On `main`, callingx ships `StreamMessagingService` at priority 0, merged into every app:

| Other library                      | Its priority | Result                                                                                                            |
| ---------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------- |
| `@react-native-firebase/messaging` | 0            | Random tie: either Stream rings are dropped (its `onMessageReceived` is a no-op) or its JS `onTokenRefresh` stops |
| `expo-notifications`               | -1           | We always win, and all of expo-notifications' push handling breaks                                                |
| The app's own service              | usually 0    | Random tie; rings are dropped unless the app forwards to `StreamMessagingHelper`                                  |

Firebase's built-in fallback `FirebaseMessagingService` is declared at -500.

## 2. Goal

Stream `call.ring` is always handled natively, whatever other FCM service is present; installing
the SDK doesn't break other FCM libraries; integrators write no native code; token registration
keeps working; existing integrations (manifest removals, subclasses, forwarding, Expo plugin) keep
working. Out of scope: non-ring Stream pushes, iOS.

## 3. Design (implemented)

- **`StreamMessagingReceiver`** (new): `BroadcastReceiver` on `c2dm RECEIVE`, `exported=true`,
  `permission=com.google.android.c2dm.permission.SEND` (only Play services holds it). Skips
  `message_type != "gcm"` and intents without `google.message_id` (same guards as rn-firebase's
  receiver), builds `RemoteMessage(extras)`, calls `StreamMessagingHelper.handleMessage`.
- **`StreamMessagingService`**: kept for `onNewToken` only; `onMessageReceived` is a no-op (it
  would otherwise handle each push twice when it wins). Priority 0 → **-100**: loses to every
  library, beats Firebase's -500 fallback.
- **`StreamMessagingHelper.handleMessage`**: skips an FCM `messageId` already handled (last 50
  remembered), so apps that still forward don't trigger a second ring.
- **Tokens**: live `onNewToken` reaches us only when our service wins. Otherwise the SDK already
  registers the current token on every start (`initAndroidPushToken` → `callingx.getFcmToken()` →
  `addDevice`); apps may call `forwardNewToken` from their own service. Optional follow-up:
  re-check the token on `AppState` → `active`.

## 4. Verification

Risks: (R1) starting `CallService` as a foreground service from the receiver in the background,
Android 12+; (R2) `phoneCall` FGS type, Android 14+; (R3) our receiver still gets the broadcast next
to Firebase's (`FINISHED_AFTER_HANDLED`); (R4) `RemoteMessage(Bundle)` is public in
firebase-messaging 24.0.0, check 21.0.0 (declared minimum) and latest; (R5) duplicates; (R6) no
regressions for rn-firebase / expo-notifications; (R7) token registration; (R8) OEM battery
managers; (R9) direct boot (before first unlock).

API levels: **must** 26, 31, 34, 36; **should** 24, 29, 33, 35; optional 37.
States: foreground, background, swiped, killed (`am kill`), doze, reboot, reboot before first
unlock (emulators only), force-stopped (expected: nothing delivered).
Setups: dogfood with rn-firebase's service removed (default) and present (`--rnfb-service`);
baseline (main's callingx) vs prototype.

## 5. Remaining code work

- Expo config plugin (`withAndroidMessagingService.ts`): subclass generation no longer needed;
  stop stripping other libraries' services by default; deprecate
  `androidMessagingServiceBaseClass`; update its tests.
- Optional JS foreground token re-check in `packages/react-native-sdk/src/utils/push/android.ts`.
- Tests for the receiver guards and the duplicate check (callingx has no Android unit tests yet).
- Docs (getstream.io): drop the "remove a service / write a subclass" steps for bare RN.
- `packages/react-native-sdk/CLAUDE.md` push section: Android no longer goes through
  `@react-native-firebase/messaging`.

## 6. Shipping

Linear ticket in `RN` (required in the PR body); `feat` conventional commit; minor (or next v2
beta); changelog notes the receiver, priority 0 → -100, forwarding no longer required; docs PR;
remove Expo subclass generation in the next major; escape hatch: apps can remove our receiver with
`tools:node="remove"` and forward themselves. Drop the `chore(wip)` test-tooling commit before
the PR.
