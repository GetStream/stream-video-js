`@stream-io/video-react-native-sdk`: React Native components, hooks, and native modules (`ios/`, `android/`) on top of `@stream-io/video-react-bindings` and `@stream-io/video-client`.

- Never use RxJS observables from the client directly here; all state access goes through the bindings hooks.
- Apps must import from this SDK (not `@stream-io/video-client` directly): importing it registers the WebRTC globals and polyfills (`src/index.ts`).
- The SDK's own natives are New Architecture only (codegen); see "Native modules" below.
- CallKit (iOS) and Telecom (Android) go through the workspace package `@stream-io/react-native-callingx`.
- `StreamCall` runs its side effects (app-state, keep-alive, callingx sync, screen-share audio mixing, device stats) as renderless child components.
- Theming: `<StreamVideo style={...}>` takes a `DeepPartial<Theme>`; theme tokens are `semantics` and `components` (`src/theme/theme.ts`).

## Native modules

`codegenConfig` in `package.json` uses `jsSrcsDir: "src/native"`; generated output is never committed (codegen runs app-side).

- Specs in `src/native/`: `NativeStreamVideoReactNative.ts`, `NativeStreamInCallManager.ts`, `NativeStreamVideoAppLifecycle.ts` (Android-only, `TurboModuleRegistry.get`), `RTCViewPipNativeComponent.ts` (iOS Fabric component, `excludedPlatforms: ['android']`). One spec per module shared by both platforms; platform-only methods are stubs on the other side. Events use codegen `EventEmitter`.
- Android: Kotlin modules extend the generated `Native<Name>Spec`; registered by `StreamVideoReactNativePackage` (`BaseReactPackage`). `StreamVideoReactNative.kt` is a static helper for app `MainActivity`.
- iOS: thin ObjC++ adapters `ios/StreamVideoReactNativeModule.{h,mm}` and `ios/StreamInCallManagerModule.{h,mm}` (registered via `codegenConfig.ios.modulesProvider`) forward to Swift `StreamVideoReactNativeImpl` / `StreamInCallManagerImpl`. `ios/RTCViewPipComponentView.{h,mm}` hosts the Swift `RTCViewPip` (registered via `componentProvider`). `StreamVideoReactNative.{h,m}` keeps only the public class methods for AppDelegates (`+voipRegistration`, `+hasAnyActiveCall`).
- Emit events only through each module's guarded helper (generated `emitOn*` crashes if the event emitter callback isn't set yet).
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
- `ios` (`IOSCallManager`) — iOS-only: `showDeviceSelector`, `addAudioInterruptionListener`.
- `start(config?)` / `stop()` — config store (see above).
- `logAudioState`, `getAudioStateLog` — debug.

**Config shape (`StreamInCallManagerConfig`):**

- `audioRole`: `'communicator'` (default — video/voice, SDK controls routing, manual device switching supported) or `'listener'` (livestream viewing, high-quality stereo, OS controls routing).
- `deviceEndpointType`: `'speaker'` | `'earpiece'` — communicator-only override for the default endpoint (otherwise derived from call settings).

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

- `callingX` — `joinCall`, `endCall`, `registerOutgoingCall`, `wireAudioEngineSubscription`, `unwireAudioEngineSubscription`. Bridge to the callingx package.
- `callManager` — the **native-owning** call manager. `setup`/`start`/`stop` drive the native `StreamInCallManager` module at join/leave; `setMutedRecordingPrepared` (iOS-only) toggles the ADM's muted-recording chain.
- `permissions.check(permission)` — cross-platform runtime permission query for mic/camera.
- `nativeEvents.speechActivity.subscribe(cb)` — bridges the native speech-detector event to `MicrophoneManager`.

**The gotcha:** any join-time audio setup needs BOTH the public store (to record the config) and the internal manager (to trigger native). Getting this wrong shows up as "the config isn't being applied", usually because someone called `.start()` on only one of the two.

## Keeping calls alive on Android

`src/hooks/useAndroidKeepCallAliveEffect.ts` picks one of two mutually-exclusive mechanisms:

- **SDK FGS** (`StreamCallKeepAliveHeadlessService`, FGS types `microphone | camera | mediaPlayback`) — for non-callingx calls. Started on `CallingState.JOINED` (after the POST_NOTIFICATIONS check on Android 13+), shows a persistent notification, keeps a HeadlessJS task running; stopped on `LEFT`/`IDLE` or when the app foregrounds.
- **Callingx background task** — for calls managed by callingx (ringing calls, or `enableOngoingCalls`). The hook calls `callingx.acquireBackgroundTask(owner)` / `releaseBackgroundTask(owner)`, so the existing callingx `CallService` FGS carries the keep-alive without a second notification. Acquire as soon as the call is callingx-managed and has a cid (early acquire prevents the hand-off gap with the push flow); ownership is ref-counted inside callingx so the push→keepalive handoff can't strand the task.

## Push notifications

- **The SDK only handles ringing call pushes.** Non-ringing notifications (call.missed, call.live_started, call.notification) are delivered by the backend directly to the device; displaying them and handling taps is the app's responsibility.
- iOS: VoIP push → callingx shows the CallKit UI. iOS kills the app if the CallKit UI isn't shown within ~30 seconds of a VoIP push, and the CallKit call must end when the Stream call ends. Apps register with `StreamVideoReactNative.voipRegistration()` in the AppDelegate.
- Android: Firebase (`@react-native-firebase/messaging`) → callingx shows the incoming call via Telecom.

## Gotchas

- Metro not picking up changes: `yarn start --reset-cache`.
- After changing the Expo plugin or its config: `npx expo prebuild --clean`.
- Only one `<StreamVideo>` provider, at the app root.
- iOS screen sharing needs a Broadcast Upload Extension target (separate process).
- VoIP push certificates expire yearly, with no warning until pushes stop.
