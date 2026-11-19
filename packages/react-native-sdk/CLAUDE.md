`@stream-io/video-react-native-sdk`: React Native components, hooks, and native modules (`ios/`, `android/`) on top of `@stream-io/video-react-bindings` and `@stream-io/video-client`.

- Never use RxJS observables from the client directly here; all state access goes through the bindings hooks.
- Apps must import from this SDK (not `@stream-io/video-client` directly): importing it registers the WebRTC globals and polyfills (`src/index.ts`).
- The SDK's own natives are New Architecture only (codegen); see "Native modules" below.
- CallKit / LiveCommunicationKit (iOS) and Telecom (Android) go through the workspace package `@stream-io/react-native-callingx`.
- `StreamCall` runs its side effects (app-state, keep-alive, callingx sync, screen-share audio mixing, device stats) as renderless child components.
- Theming: `<StreamVideo style={...}>` takes a `DeepPartial<Theme>`; theme tokens are `semantics` and `components` (`src/theme/theme.ts`).

## Native modules

`codegenConfig` in `package.json` uses `jsSrcsDir: "src/native"`; generated output is never committed (codegen runs app-side).

- Specs in `src/native/`: `NativeStreamVideoReactNative.ts`, `NativeStreamInCallManager.ts`, `NativeStreamVideoAppLifecycle.ts` (Android-only, `TurboModuleRegistry.get`), `RTCViewPipNativeComponent.ts` (iOS Fabric component, `excludedPlatforms: ['android']`). One spec per module shared by both platforms; platform-only methods are stubs on the other side. Events use codegen `EventEmitter`.
- Android: Kotlin modules extend the generated `Native<Name>Spec`; registered by `StreamVideoReactNativePackage` (`BaseReactPackage`). `StreamVideoReactNative.kt` is a static helper for app `MainActivity`.
- iOS: thin ObjC++ adapters `ios/StreamVideoReactNativeModule.{h,mm}` and `ios/StreamInCallManagerModule.{h,mm}` (registered via `codegenConfig.ios.modulesProvider`) forward to Swift `StreamVideoReactNativeImpl` / `StreamInCallManagerImpl`. `ios/RTCViewPipComponentView.{h,mm}` hosts the Swift `RTCViewPip` (registered via `componentProvider`). `StreamVideoReactNative.{h,m}` keeps only the public class methods for AppDelegates (`+voipRegistration`, `+hasAnyActiveCall`).
- Emit events only through each module's guarded helper (generated `emitOn*` crashes if the event emitter callback isn't set yet).
- iOS: put process-wide side effects (hook registration, observers) in `RCTInitializing.initialize`, not `init`. The generated `RCTModuleProviders` does `[klass new]` on every codegen module class once as a throwaway provider that is never initialized nor invalidated, so `init` runs twice per process (`StreamInCallManagerModule` forwards `initialize` to the Swift impl).
- Jest: `src/native/*` modules are mocked in `jest-setup.ts`.
- Not SDK-owned (still legacy, keep): `NativeModules.WebRTCModule`, `NativeModules.ScreenCapturePickerViewManager` from `@stream-io/react-native-webrtc`.

## Testing

- `yarn test` runs `copy-version` (generates the gitignored `src/version.ts`), jest with coverage, `test:types` (`tsc -p tsconfig.spec.json`, which also type-checks `__tests__`), and the Expo plugin tests.
- Expo plugin tests use their own config: `yarn test:expo-plugin` (`expo-config-plugin/jest.config.js`).

## Call manager: public config store vs internal native owner

The public `callManager` (`src/modules/call-manager/CallManager.ts`) is a **config store**, not a native invoker. Its `start(config?)` / `stop()` record the desired audio config for the next join; the SDK's internal call manager (attached to `globalThis.streamRNVideoSDK.callManager` in `src/utils/internal/registerSDKGlobals.ts`) reads that config at join time and drives the native module. Mid-call `start(newConfig)` only updates the stored config — the change takes effect on the next call/rejoin.

**Public API surface:**

- `audioDevices` (`AudioDevicesManager`) — cross-platform picker: `getStatus`, `select(id)`, `addChangeListener`. On Android Telecom-managed calls it adapts callingx's endpoints; otherwise reads native.
- `speaker` (`SpeakerManager`) — `setMute`, `setForceSpeakerphoneOn`. Routes via callingx on Telecom-managed Android.
- `ios` (`IOSCallManager`) — iOS-only: `showDeviceSelector`, `addAudioInterruptionListener`, `addAudioSessionDiagnosticListener`, `getAudioSessionState` (both `@internal`, used by `AudioSessionDiagnosticsTracer`).
- `start(config?)` / `stop()` — config store (see above).
- `logAudioState`, `getAudioStateLog` — debug.

**Config shape (`StreamInCallManagerConfig`):**

- `audioRole`: `'communicator'` (default — video/voice, SDK controls routing, manual device switching supported) or `'listener'` (livestream viewing, high-quality stereo, OS controls routing).
- `deviceEndpointType`: `'speaker'` | `'earpiece'` — communicator-only override for the default endpoint (otherwise the client derives it from the call settings, `getRNDefaultAudioDevice`, and passes it as `defaultDevice` in the internal `start`).

**iOS audio session + engine (RN-463 dead mic):**

- Engine availability is the gate, for both paths. Non-callingx (`StreamInCallManagerImpl`): the call ADM is born gated (`didCreateModule` hook → `.none`, skipped when callingx owns the session or the manager is started), `start()` (fire-and-forget, on `audioSessionQueue`) gates again → configures + activates the session (counted activation, `weActivatedSession`) → opens the gate (`.default`) → `setPlayout(true)`; WebRTC remembers playout/recording requests made while gated and replays them when the gate opens, so the engine never starts against an inactive session and the JS publish order does not matter. Activation failure keeps the gate closed (`startError` diagnostic); `reactivateAudioSession` (tracer) activates and opens it. `adm.reset()` in `stop()` re-arms `.default`. callingx: `.none` before the system activates, `.default` on `didActivate`, `.none` on `didDeactivate`, replay in its `didCreateModule` hook.
- Sync engine hooks (`AudioDeviceModule.addEngineHooks`, WebRTC worker thread): the SDK registers willEnable (re-applies the configuration only, between `start()` and `stop()`; never `setActive`) and didCreateModule; no didDisable: the activation is held from `start()` to `stop()` because a REJOIN reconnect fully disables and rebuilds the engine mid-call; callingx registers all four (willEnable re-applies category/mode and sets the startup-mute flag, willStart/didDisable clear it, didCreateModule replays the desired availability). Hooks: no ADM calls, no `audioSessionQueue.sync`/`main.sync`, all `RTCAudioSession` locking via each package's `AudioSessionConfigLock` (lock, body, unlock like stream-video-swift; never nest: re-locking on the same thread crashes; other threads just wait). `setEngineAvailability` is a blocking call onto the worker thread: only from `audioSessionQueue`/`engineAvailabilityQueue` or a `didCreateModule` hook, never from worker-thread hooks nor inside `AudioSessionConfigLock.run`.
- Interruptions: the ADM stops/restarts the engine itself and `RTCAudioSession` re-activates once; a failed re-activation is repaired on interruption-end by `StreamInCallManagerImpl` (`sessionReactivated` diagnostic, `trigger: interruptionEnded`) and by the tracer.
- Recovery: `AudioSessionDiagnosticsTracer` samples `getEngineState()`, calls `recoverEngineIfNeeded` (≤3/episode, ≤6/call, ≥3 s apart), then one `call.rejoinForAudioEngineRecovery()` per call; traces `ios.audioEngine.*` and `audio.session.timeout`.
- Recovery is skipped while an audio interruption is active. With an inactive session the tracer first calls `callManager.ios.reactivateAudioSession` (the ADM cannot restart against an inactive session); when iOS refuses (`561017449`, another app owns the audio) it waits for the next interruption end / session activation / app foreground / audio route change (the only signal when the holder, e.g. an iPad FaceTime window, ends while the app stays in the foreground) without spending its budget or rejoining; any other re-activation failure is re-checked on a budget of its own (same size/spacing, no rejoin). The audio rejoin is skipped (call stays joined) when the rejoin rate limiter has no room.

## Per-Call PeerConnectionFactory (Media Engine)

**One native `PeerConnectionFactory` per call**, built at join and disposed at leave. Each call owns its own `AudioDeviceModule`, so audio configs are baked in per call rather than on a process-global factory.

- `src/utils/internal/registerMediaEngine.ts` — registers the RN provider via `setCallMediaEngineProvider()`, wired from `registerSDKGlobals()`.
- `packages/client/src/Call.ts` — `ensureMediaFactory()` runs at the top of `doJoin()`; `hasMediaEngine` (`@internal`) is the "call is live" gate for RN-only pre-join APIs (e.g. `setAudioBitrateProfile`); `leave()` disposes.
- `@stream-io/react-native-webrtc` — `CallFactory.create({ bypassVoiceProcessing, stereoInputEnabled })` / `factory.dispose()`.

Baked in at creation (immutable per call): `bypassVoiceProcessing` is `true` when `callManager.getStoredConfig().audioRole === 'listener'` (music/livestream: hardware AEC/NS off); `stereoInputEnabled` is Android-only mic stereo capture and not currently supported. Set factory-level audio config via `callManager.start(config)` **before** `call.join()`; mid-call changes only take effect on the next join.

## RN Capabilities Bridge (`globalThis.streamRNVideoSDK`)

The client (`packages/client`) is platform-agnostic and can't `import` React Native. Instead, the RN SDK **registers a namespace on `globalThis.streamRNVideoSDK`** at init, and the client's RN-only paths (Call.ts, MicrophoneManager.ts, etc.) call through it via optional chaining.

- `src/utils/internal/registerSDKGlobals.ts` — `registerSDKGlobals()` builds the object; called from `src/index.ts` on import.
- `packages/client/src/types.ts` — typed as `StreamRNVideoSDKGlobals`, declared as `var streamRNVideoSDK: StreamRNVideoSDKGlobals | undefined`.

**Surface:**

- `callingX` — `joinCall`, `endCall`, `registerOutgoingCall`. Bridge to the callingx package.
- `callManager` — the **native-owning** call manager. `start`/`stop` drive the native `StreamInCallManager` module at join/leave (`start` carries the call-settings-derived `defaultDevice`, overridden by the stored config's `deviceEndpointType`; fire-and-forget, before the first publish); `setMutedRecordingPrepared` (iOS-only) toggles the ADM's muted-recording chain.
- `permissions.check(permission)` — cross-platform runtime permission query for mic/camera.
- `nativeEvents.speechActivity.subscribe(cb)` — bridges the native speech-detector event to `MicrophoneManager`.

**The gotcha:** any join-time audio setup needs BOTH the public store (to record the config) and the internal manager (to trigger native). Getting this wrong shows up as "the config isn't being applied", usually because someone called `.start()` on only one of the two.

## Keeping calls alive on Android

A keep-alive is a foreground service (keeps the process and mic/camera access) plus a HeadlessJS task (keeps JS timers running in the background). Ownership lives in `keepAliveController` (`src/utils/keepCallAliveController.ts`); owners are `keepalive:<cid>` (`useAndroidKeepCallAliveEffect`) and `push:<cid>` (ringing push flow, always callingx). Two backends, picked once per call by `getKeepAliveBackend(isRingingCall)` and kept until the call ends:

- **`sdk`** — `StreamCallKeepAliveHeadlessService` (FGS types `mediaPlayback | camera | microphone`, own notification and wakelock), for calls callingx does not manage. The hook acquires on `CallingState.JOINED` while the app is in the foreground (while-in-use FGS types can't be started from the background) and retries when the app becomes active. The last release stops the service immediately.
- **`callingx`** — callingx's `CallService` (`phoneCall`), for ringing calls or `enableOngoingCalls`. Acquired as soon as the call is callingx-managed, so the push → keep-alive hand-off has no gap; every acquire calls `callingx.startBackgroundTask()` (idempotent). The last release ends the task after a 2s debounce, and `CallService` stops itself only when no call is registered — the SDK never stops it.

Mechanics:

- One task, `StreamVideoKeepCallAlive`, registered once at import (`keepAliveController.registerHeadlessTask()` in `src/index.ts`). The starting service passes `backend` in the task data; native constants are in `android/.../keepalive/KeepAliveTask.kt` and must match the JS ones. The task body holds a promise until that backend's last owner releases, and returns immediately when it has no owners (e.g. callingx booting React Native from a push).
- Both services drive the task through the shared `keepalive/HeadlessTaskManager.kt` (one task slot per service). callingx's Android module depends on the SDK's native module for it, so the two packages ship in lockstep.
- `acquire` never throws and returns `false` on a failed start; the owner is dropped so the caller can retry.
- `foregroundService.android.taskToRun` is deprecated and not invoked.

## Push notifications

- **The SDK only handles ringing call pushes.** Non-ringing notifications (call.missed, call.live_started, call.notification) are delivered by the backend directly to the device; displaying them and handling taps is the app's responsibility.
- iOS: VoIP push → callingx shows the CallKit UI, or the LiveCommunicationKit UI when `useLiveCommunicationKit` is set. The incoming call must be reported to the system before the PushKit delegate returns (callingx does it natively; Apple FB16655952 workaround), otherwise iOS kills the app and may stop delivering VoIP pushes. The system call must end when the Stream call ends. Apps register with `StreamVideoReactNative.voipRegistration()` in the AppDelegate.
- Android: Firebase (`@react-native-firebase/messaging`) → callingx shows the incoming call via Telecom.

## Gotchas

- Metro not picking up changes: `yarn start --reset-cache`.
- After changing the Expo plugin or its config: `npx expo prebuild --clean`.
- Only one `<StreamVideo>` provider, at the app root.
- iOS screen sharing needs a Broadcast Upload Extension target (separate process).
- VoIP push certificates expire yearly, with no warning until pushes stop.
