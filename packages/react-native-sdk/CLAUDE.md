## Overview

This is `@stream-io/video-react-native-sdk`, the official React Native SDK for Stream Video.
It provides React Native components and hooks for building video calling, audio rooms, and livestreaming applications on iOS and Android.
This package sits on top of `@stream-io/video-react-bindings` (React hooks layer) and `@stream-io/video-client` (core WebRTC client), with React Native-specific platform integrations.

**Key characteristics:**

- React Native UI components with native module integrations
- Platform-specific implementations for iOS and Android (native code in `ios/` and `android/`)
- Push notification support for ringing calls (VoIP for iOS, Firebase for Android)
- CallKit (iOS) and Telecom (Android) integration via `@stream-io/react-native-callingx`
- Non-ringing notifications (call.missed, call.live_started, call.notification) are NOT handled by the SDK — app-level responsibility
- Picture-in-Picture (PiP) support
- Native foreground services for keeping calls alive
- Expo support via config plugin

## Build & Development Commands

```bash
# Build the SDK
yarn build

# Watch mode (rebuilds on changes)
yarn start

# Run tests
yarn test

# Run linter
yarn lint

# Clean build artifacts
yarn clean
```

### Monorepo Commands

From the root of the monorepo:

```bash
# Build react-native-sdk with all dependencies
yarn build:react-native:deps

# Build just the react-native-sdk
yarn build:react-native:sdk

# Watch mode for react-native-sdk
yarn start:react-native:sdk

# Build all packages in dependency order
yarn build:all

# Lint all packages
yarn lint:all

# Run tests across all packages
yarn test:ci:all

# Run the React Native dogfood sample app
cd sample-apps/react-native/dogfood
yarn start
```

## Testing

Tests use Jest with react-native preset:

```bash
# Run all tests with coverage
yarn test

# Run SDK tests only
yarn test --testPathIgnorePatterns=expo-config-plugin

# Run Expo plugin tests only
yarn test:expo-plugin

# Run specific test file
yarn test ParticipantView.test.tsx
```

**Test structure:**

- SDK tests: `__tests__/**/*.test.tsx`
- Expo plugin tests: `expo-config-plugin/__tests__/**/*.test.ts`
- Mocks: `__tests__/mocks/`
- Test utilities: `__tests__/utils/`

## Package Structure

```
packages/react-native-sdk/
├── src/
│   ├── components/         # UI components (Call, Livestream, Participant, utility)
│   ├── contexts/          # React contexts (Theme, ScreenshotIos, BackgroundFilters)
│   ├── hooks/             # React Native-specific hooks
│   ├── icons/             # SVG icon components
│   ├── modules/           # Native module interfaces (call-manager)
│   ├── providers/         # Providers (StreamVideo, StreamCall, NoiseCancellation, BusyTonePlayer)
│   ├── theme/             # Theming system
│   ├── translations/      # i18n translations
│   ├── utils/             # Utilities (push, StreamVideoRN, PiP, permissions)
│   ├── index.ts           # Main entry point
│   └── version.ts         # Generated version file
├── ios/                   # iOS native modules (Swift/Objective-C)
├── android/               # Android native modules (Kotlin/Java)
├── expo-config-plugin/    # Expo config plugin for auto-configuration
├── __tests__/             # Jest tests
├── dist/                  # Build output (do not edit)
└── package.json
```

## Architecture

### Three-Layer Architecture + Native Layer

The React Native SDK extends the standard three-layer architecture with platform-specific native code:

1. **@stream-io/video-client** (Core Layer)
   - Low-level WebRTC client
   - Manages connections, state via RxJS observables
   - Platform-agnostic
   - See `packages/client/AGENTS.md` for details

2. **@stream-io/video-react-bindings** (Hooks Layer)
   - React hooks that subscribe to client observables
   - State synchronization between client and React components
   - NO UI components, pure hooks only
   - Provides `StreamVideoProvider`, `StreamCallProvider`

3. **@stream-io/video-react-native-sdk** (UI + Native Layer - this package)
   - React Native components built on bindings
   - Native modules for platform-specific functionality
   - Ringing push notification handling (VoIP + Firebase)
   - PiP support
   - Foreground services
   - CallKit/Telecom integration via `@stream-io/react-native-callingx`

4. **Native Modules** (Platform Integration)
   - iOS: Swift modules in `ios/` (VoIP, PiP, InCallManager)
   - Android: Kotlin modules in `android/` (PiP, foreground service)
   - `@stream-io/react-native-callingx` - Internal package for CallKit (iOS) and Telecom (Android) integration

**Critical Rule:** This package should NEVER directly use RxJS observables from the client. All state access must go through bindings hooks.

### Entry Point & Initialization

**Index file** (`src/index.ts`):

- Registers WebRTC globals via `@stream-io/react-native-webrtc`
- Initializes polyfills (URL, TextEncoder, intl-pluralrules)
- Re-exports everything from client, bindings, and SDK-specific exports
- Overrides `StreamVideo` and `StreamCall` providers with RN-specific implementations

**Key initialization:**

```tsx
// Registers window and navigator globals for React Native
if (Platform.OS !== 'web') {
  registerGlobals();
}
```

### Core Providers

#### StreamVideo Provider

**File:** `src/providers/StreamVideo.tsx`

Wraps `StreamVideoProvider` from bindings with React Native-specific features:

- Network status monitoring via `@react-native-community/netinfo`
- Push notification registration via `usePushRegisterEffect`
- Theme system integration via `StreamTheme` context
- iOS screenshot detection context
- Busy tone player for ringing calls

**Usage:**

```tsx
<StreamVideo client={client} style={customTheme}>
  <App />
</StreamVideo>
```

#### StreamCall Provider

**File:** `src/providers/StreamCall/index.tsx`

Wraps `StreamCallProvider` from bindings with React Native lifecycle management:

- **AppStateListener**: Handles background/foreground transitions
- **AndroidKeepCallAlive**: Foreground service to prevent call termination
- **CallingExpWithCallingState**: Syncs callingx (CallKit/Telecom) with call state
- **ClearPushWSSubscriptions**: Cleanup push subscriptions on unmount
- **ScreenShareAudioMixer**: Mixes screen share audio with microphone audio
- **DeviceStats**: Collects device performance metrics

**Architecture pattern:**
Uses renderless child components for side effects - keeps logic separated and testable.

### Native Modules

#### CallManager (Android/iOS)

**Files:**

- `src/modules/call-manager/CallManager.ts` - TypeScript interface
- `android/src/main/java/com/streamvideo/reactnative/callmanager/` - Android implementation
- `ios/StreamInCallManager.swift` - iOS implementation

**Responsibilities:**

- Proximity sensor management (screen on/off during calls)
- Speaker mode control
- Ringer/vibration control

#### PiP Support

**Files:**

- `src/utils/enterPiPAndroid.ts` - Android PiP helper
- `android/src/main/java/com/streamvideo/reactnative/util/PiPHelper.kt`
- `ios/PictureInPicture/` - iOS PiP implementation

**Key hooks:**

- `useAutoEnterPiPEffect` - Automatically enters PiP on minimize
- `useIsInPiPMode` - Tracks current PiP state

#### Foreground Service (Android)

**Purpose:** Keeps call alive when app is backgrounded

**Files:**

- `src/hooks/useAndroidKeepCallAliveEffect.ts`
- `android/src/main/java/com/streamvideo/reactnative/util/CallAliveServiceChecker.kt`

**Flow:**

1. Requests permissions (CAMERA, RECORD_AUDIO, POST_NOTIFICATIONS)
2. Starts foreground service when call is joined
3. Shows persistent notification with call info
4. Stops service when call ends or app is foregrounded

### Push Notifications

**The SDK only handles ringing call push notifications.** Non-ringing notifications (call.missed, call.live_started, call.notification) are delivered by the Stream backend directly to the device — displaying them and handling taps is the app's responsibility.

#### iOS VoIP Push (Ringing)

**Files:**

- `src/utils/push/setupIosVoipPushEvents.ts`
- `src/utils/push/setupCallingExpEvents.ts`

**Libraries:**

- `@stream-io/react-native-callingx` - Internal package for CallKit integration (replaces deprecated `react-native-callkeep`)

**Flow:**

1. VoIP push wakes app in background
2. Callingx displays native CallKit incoming call UI
3. User accepts/rejects on system UI
4. SDK joins call or rejects it

#### Android Push (Ringing)

**Files:**

- `src/utils/push/android.ts`

**Libraries:**

- `@react-native-firebase/messaging` - Firebase Cloud Messaging
- `@stream-io/react-native-callingx` - Internal package for Android Telecom integration

**Flow:**

1. Firebase receives push notification
2. Callingx displays incoming call notification via Android Telecom
3. User accepts/rejects
4. SDK joins call or rejects it

#### Non-Ringing Notifications

**Not handled by the SDK.** The Stream backend sends non-ringing push notifications directly to the device. Apps must:

1. Register the device token with Stream (`client.addDevice()`)
2. Handle the incoming push and display a notification
3. Handle notification taps

See sample apps (`dogfood/`, `expo-video-sample/`) for working examples.

### Components

#### Call Components (`src/components/Call/`)

- **CallContent** - Main call UI container
- **CallControls** - Control buttons (mute, camera, end call, etc.)
- **CallLayout** - Layout strategies (grid, speaker, etc.)
- **CallParticipantsList** - List of participants
- **Lobby** - Pre-call lobby UI
- **RingingCallContent** - Incoming/outgoing call UI

#### Livestream Components (`src/components/Livestream/`)

- **HostLivestream** - UI for livestream host
- **ViewerLivestream** - UI for livestream viewers
- **LivestreamControls** - Host controls
- **LivestreamLayout** - Viewer layout
- **LivestreamPlayer** - HLS player for viewers
- **LivestreamTopView** - Viewer count, live indicator

#### Participant Components (`src/components/Participant/`)

- **ParticipantView** - Renders single participant
- **ParticipantLabel** - Name/info overlay
- **ParticipantNetworkQualityIndicator** - Connection quality

#### Utility Components (`src/components/utility/`)

- **BrandLogo** - Stream branding
- **ToggleMenuButton** - Menu toggle
- **ParticipantsInfoList** - Participant metadata

### Key Hooks

#### Push Notification Hooks (`src/hooks/push/`)

Handles ringing call push setup:

- `usePushRegisterEffect` - Orchestrates push registration (calls the hooks below)
- `useIosVoipPushEventsSetupEffect` - Sets up iOS VoIP push event listeners
- `useInitAndroidTokenAndRest` - Registers Firebase token and sets up Android push handling
- `useCallingExpWithCallingStateEffect` - Syncs callingx (CallKit/Telecom) with call state

#### Platform-Specific Hooks

- `useAndroidKeepCallAliveEffect` - Android foreground service lifecycle
- `useAutoEnterPiPEffect` - Auto PiP on minimize
- `useIsInPiPMode` - Current PiP state
- `useIsIosScreenshareBroadcastStarted` - iOS screen share state
- `useScreenShareButton` - Screen share button logic
- `useScreenshot` - Screenshot detection (iOS)
- `usePaginatedLayoutSortPreset` - Participant sorting for paginated layouts
- `useSpeechDetection` - Audio level detection
- `useTrackDimensions` - Track video dimensions
- `usePermissionRequest` - Media permission requests
- `usePermissionNotification` - Permission request notifications

### Configuration & Utilities

#### StreamVideoRN Configuration

**File:** `src/utils/StreamVideoRN/index.ts`

Main configuration utility for React Native-specific settings:

```tsx
StreamVideoRN.setPushConfig({
  ios: {
    pushProviderName: 'my-voip-provider',
  },
  android: {
    pushProviderName: 'firebase',
  },
  createStreamVideoClient: async () => {
    // Create client for handling ringing calls in background
    return StreamVideoClient.getOrCreateInstance({ apiKey, user, token });
  },
});
```

**Configuration sections:**

- `foregroundService.android` - Android foreground service settings
- `push.ios` - iOS VoIP push provider configuration
- `push.android` - Android Firebase push provider configuration
- `createStreamVideoClient` - Factory for creating client in background push handling

### Theming System

**File:** `src/contexts/ThemeContext.tsx`

Deep merge-based theme system:

```tsx
const customTheme: DeepPartial<Theme> = {
  colors: {
    primary: '#005FFF',
    background1: '#000000',
  },
  variants: {
    buttonSizes: {
      md: { fontSize: 16 },
    },
  },
};

<StreamVideo client={client} style={customTheme}>
  <App />
</StreamVideo>;
```

**Theme structure** (`src/theme/theme.ts`):

- `colors` - Color palette
- `typefaces` - Font families and weights
- `variants` - Component size/style variants
- Supports deep partial overrides

### Expo Support

**Expo Config Plugin** (`expo-config-plugin/`):

Auto-configures native projects for Expo apps:

- Android permissions (CAMERA, RECORD_AUDIO, etc.)
- Android manifest modifications
- iOS Info.plist modifications
- iOS background modes

**Usage in app.json:**

```json
{
  "plugins": [
    [
      "@stream-io/video-react-native-sdk",
      {
        "enableScreenshare": true,
        "ringing": true,
        "androidKeepCallAlive": true,
        "androidPictureInPicture": true
      }
    ]
  ]
}
```

## Key Patterns & Architectural Deep Dive

### 1. Native Module Bridge Pattern

Native functionality is exposed via React Native's native module system:

```tsx
// TypeScript interface
export class CallManager {
  async setProximityEnabled(enabled: boolean): Promise<void> {
    return NativeModules.StreamVideoReactNative?.setProximityEnabled(enabled);
  }
}

// Singleton instance
export const callManager = new CallManager();
```

**Native implementations:**

- Android: `StreamVideoReactNativePackage.kt` registers modules
- iOS: `StreamVideoReactNative.m` bridges Swift code

### 2. Push Notification Architecture (Ringing Only)

The SDK only handles **ringing call** push notifications. Non-ringing notifications are the app's responsibility.

**iOS Stack:**

- VoIP push received in native code
- `@stream-io/react-native-callingx` displays CallKit incoming call UI
- Events forwarded to JS via callingx event listeners

**Android Stack:**

- Firebase → `@react-native-firebase/messaging`
- `@stream-io/react-native-callingx` displays incoming call via Android Telecom
- Foreground service keeps call alive in background

**Library detection** (`src/utils/push/libs/`):

```tsx
// Safely check if library is installed
const firebase = getFirebaseMessagingLibNoThrow();
const callingx = getCallingxLib();
```

### 3. RxJS Subject Bridge Pattern

Push events flow through RxJS subjects to decouple native events from React:

**Flow:**

1. Native module emits event (VoIP push, callingx action)
2. Event handler updates RxJS subject
3. React hooks subscribe to subject
4. UI updates reactively

**Example:**

```tsx
// In native event handler
voipPushNotificationCallCId$.next(callCid);

// In React hook
useEffect(() => {
  const subscription = voipPushNotificationCallCId$.subscribe((callCid) => {
    if (callCid) {
      // Join call
    }
  });
  return () => subscription.unsubscribe();
}, []);
```

### 4. Renderless Component Pattern

Used extensively in `StreamCall` provider:

```tsx
export const StreamCall = ({ call, children }) => {
  return (
    <StreamCallProvider call={call}>
      <AppStateListener /> {/* Side effect only */}
      <AndroidKeepCallAlive /> {/* Side effect only */}
      <CallingExpWithCallingState /> {/* Side effect only */}
      <ClearPushWSSubscriptions /> {/* Side effect only */}
      <ScreenShareAudioMixer /> {/* Side effect only */}
      <DeviceStats /> {/* Side effect only */}
      {children}
    </StreamCallProvider>
  );
};

// Renderless component example
const AndroidKeepCallAlive = () => {
  useAndroidKeepCallAliveEffect(); // Hook does all the work
  return null; // No UI
};
```

**Benefits:**

- Separates concerns
- Easy to test hooks in isolation
- Can conditionally render based on platform
- Keeps provider component clean

### 5. Permission Cascade Pattern

Media permissions require careful sequencing on React Native:

**Flow:**

```tsx
// 1. Check current permission state
const { useHasPermissions } = useCallStateHooks();
const hasPermissions = useHasPermissions();

// 2. Request permission
const { requestPermission } = usePermissionRequest();
await requestPermission('microphone');

// 3. Handle permission result
if (hasPermissions.microphone) {
  await call.microphone.enable();
}
```

**Platform differences:**

- iOS: Prompts once, then requires Settings
- Android: Can prompt multiple times, requires manifest permissions
- Web: Browser-specific permission UI

### 6. Background State Handling

**iOS quirks:**

- Video tracks must be disabled when backgrounded (battery drain)
- Audio continues in background via AVAudioSession
- CallKit (via callingx) provides native call UI

**Android quirks:**

- Requires foreground service notification
- Different behavior on Android 10+ (scoped storage, background restrictions)
- Proximity sensor managed in native code

**Implementation:**

```tsx
// AppStateListener.tsx
useEffect(() => {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'background') {
      // iOS: Disable local video
      if (shouldDisableIOSLocalVideoOnBackground()) {
        call.camera.disable();
      }
    }
  });
  return () => subscription.remove();
}, []);
```

### 7. Expo Config Plugin Architecture

**Purpose:** Auto-configure native code for Expo managed workflow

**Modifiers** (`expo-config-plugin/src/`):

- `withAndroidManifest` - Adds permissions, service declarations
- `withAndroidPermissions` - Runtime permission helpers
- `withiOSInfoPlist` - Background modes, usage descriptions
- `withAppDelegate` - iOS AppDelegate modifications
- `withMainActivity` - Android MainActivity modifications

**Testing:** Each modifier has unit tests in `__tests__/`

### 8. Call Alive Mechanism (Android)

**Challenge:** Android kills background apps to save battery

**Solution:** Foreground service with persistent notification

**Implementation details:**

1. Check if service is needed (call joined, app backgrounded)
2. Request POST_NOTIFICATIONS permission (Android 13+)
3. Create notification channel
4. Start foreground service with notification
5. Update notification with call info
6. Stop service when call ends

**Edge cases handled:**

- App foregrounded → stop service
- Call ended → stop service
- Multiple calls → keep service running
- Permission denied → graceful degradation

### 9. iOS VoIP Push Flow

**Critical for production apps:**

**Setup:**

1. Register for VoIP push in AppDelegate (`StreamVideoReactNative.voipRegistration()`)
2. Forward VoIP push credentials and incoming pushes to `StreamVideoReactNative`
3. Set push provider name in backend

**Runtime flow:**

1. Backend sends VoIP push with call details
2. iOS delivers push even if app is killed
3. App wakes in background (30 seconds to respond)
4. Callingx displays native CallKit incoming call UI
5. User accepts → `answerCall` event → SDK joins call
6. User rejects → `endCall` event → SDK rejects call

**Gotchas:**

- Must display CallKit UI within 30s or iOS kills app
- Must end CallKit call when Stream call ends
- VoIP push certificates expire yearly

### 10. React Native WebRTC Integration

**Library:** `@stream-io/react-native-webrtc` (forked from community version)

**Key differences from browser WebRTC:**

- No `window.RTCPeerConnection` by default
- `registerGlobals()` creates fake window/navigator
- Camera/microphone accessed differently
- Screen share requires iOS Broadcast Extension

**Initialization:**

```tsx
// In index.ts
import { registerGlobals } from '@stream-io/react-native-webrtc';

if (Platform.OS !== 'web') {
  registerGlobals(); // Creates window and navigator globals
}
```

## Common Development Workflows

### Adding a New React Native Hook

1. Create hook file in `src/hooks/`
2. Use `useCall()` and `useCallStateHooks()` from bindings
3. Handle platform-specific logic with `Platform.OS`
4. Export from `src/hooks/index.ts`
5. Add tests in `__tests__/hooks/`

### Adding Native Functionality

**iOS:**

1. Add Swift file in `ios/`
2. Create Objective-C bridge in `.m` file with `RCT_EXTERN_METHOD`
3. Expose via `StreamVideoReactNative.swift`
4. Call from TypeScript via `NativeModules.StreamVideoReactNative`

**Android:**

1. Add Kotlin file in `android/src/main/java/com/streamvideo/reactnative/`
2. Create React method with `@ReactMethod` annotation
3. Register in `StreamVideoReactNativePackage.kt`
4. Call from TypeScript via `NativeModules.StreamVideoReactNative`

### Testing with Sample App

**Dogfood app:** `sample-apps/react-native/dogfood/`

```bash
# From SDK directory
yarn build

# From dogfood directory
cd ../../../sample-apps/react-native/dogfood

# iOS
yarn ios

# Android
yarn android
```

**Key dogfood features:**

- All SDK features demonstrated
- Push notifications configured
- Useful for manual testing
- Can be used for App Store/Play Store

### Debugging Push Notifications

**iOS:**

1. Check device token registration in logs
2. Verify VoIP certificate in Apple Developer
3. Test with push tool (Pusher, Knuff)
4. Monitor logs: `react-native log-ios`

**Android:**

1. Verify Firebase project setup
2. Check google-services.json
3. Test with Firebase Console
4. Monitor notification channels
5. Check foreground service permissions
6. Logs: `react-native log-android`

### Debugging PiP Issues

**iOS:**

1. PiP requires physical device (doesn't work in simulator)
2. Check Info.plist for `UIBackgroundModes` → `audio`
3. Verify `RTCViewPip` view manager

**Android:**

1. PiP requires Android 8.0+ (API 26)
2. Check AndroidManifest for PiP support
3. Verify activity configuration
4. Test entering/exiting PiP

## Important Notes & Best Practices

### When Working with Native Modules

**TypeScript interface must match native:**

```
// TypeScript
async setProximityEnabled(enabled: boolean): Promise<void>

// Android
@ReactMethod
fun setProximityEnabled(enabled: Boolean, promise: Promise)

// iOS
RCT_EXTERN_METHOD(setProximityEnabled:(BOOL)enabled
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
```

**Always handle promise rejection:**

```tsx
try {
  await callManager.setSpeakerphoneOn(true);
} catch (error) {
  // Native module threw error
  console.error('Failed to enable speaker', error);
}
```

### When Working with Push Notifications

**Critical timing:**

- iOS VoIP push must display CallKit UI within 30 seconds
- Android foreground service must start immediately on background
- Push token registration should happen on app launch

**Testing checklist:**

- Test with app in foreground
- Test with app in background
- Test with app killed/terminated
- Test accepting call
- Test rejecting call
- Test call ending while ringing

### When Working with Permissions

**Request permissions before enabling devices:**

```tsx
// ❌ WRONG - will fail on first run
await call.camera.enable();

// ✅ CORRECT - request permission first
const granted = await requestPermission('camera');
if (granted) {
  await call.camera.enable();
}
```

**Platform-specific permission keys:**

- iOS: Add to Info.plist (`NSCameraUsageDescription`, etc.)
- Android: Add to AndroidManifest.xml (`android.permission.CAMERA`, etc.)

### When Working with Background State

**iOS video handling:**

```tsx
// Disable video when backgrounded to save battery
if (Platform.OS === 'ios' && appState === 'background') {
  await call.camera.disable();
}
```

**Android foreground service:**

```tsx
// Ensure service is running for background calls
useAndroidKeepCallAliveEffect(); // Handles automatically
```

### When Working with Themes

**Use deep partial for type safety:**

```tsx
const theme: DeepPartial<Theme> = {
  colors: {
    primary: '#FF0000',
    // TypeScript ensures only valid keys
  },
};
```

**Theme changes apply immediately:**
Theme context uses React Context, updates propagate to all components.

## Common Gotchas & Pitfalls

### 1. Forgetting to Register Globals

```tsx
// ❌ WRONG - WebRTC won't work
import { StreamVideoClient } from '@stream-io/video-client';

// ✅ CORRECT - Import SDK, which registers globals
import { StreamVideoClient } from '@stream-io/video-react-native-sdk';
```

### 2. VoIP Push Certificate Expiration

- VoIP certificates expire yearly
- No warning until push stops working
- Test push notifications regularly in production

### 3. Android Foreground Service Permissions

```tsx
// Android 13+ requires POST_NOTIFICATIONS permission
// SDK handles automatically, but check if manually implementing
```

### 4. Callingx / CallKit Setup

CallKit and Android Telecom integration is handled by `@stream-io/react-native-callingx` (internal workspace package). It replaces the deprecated `react-native-callkeep`. The callingx setup is configured automatically via `StreamVideoRN.setPushConfig()`.

### 5. Screen Share iOS

- Requires Broadcast Extension target
- Extension runs in separate process
- Docs: https://getstream.io/video/docs/react-native/guides/screen-sharing

### 6. Metro Bundler Caching

```bash
# If changes not reflecting:
yarn start --reset-cache
```

### 7. Native Module Not Found

```bash
# iOS: Install pods
cd ios && pod install

# Android: Clean build
cd android && ./gradlew clean
```

### 8. Expo Prebuild Required

```bash
# After adding plugin or changing config
npx expo prebuild --clean
```

### 9. Multiple StreamVideo Providers

```tsx
// ❌ WRONG - multiple providers will conflict
<StreamVideo client={client1}>
  <StreamVideo client={client2}> {/* DON'T DO THIS */}
  </StreamVideo>
</StreamVideo>

// ✅ CORRECT - one provider at app root
<StreamVideo client={client}>
  <App />
</StreamVideo>
```

### 10. Platform-Specific Imports

```tsx
// ✅ CORRECT - Use platform-specific file extensions
// myModule.android.ts — Android-specific code
// myModule.ts — iOS/default code
// Metro resolves the correct file per platform automatically
```

## Dependencies

**Core Dependencies:**

- `@stream-io/video-client` - Core WebRTC client (workspace)
- `@stream-io/video-react-bindings` - React hooks layer (workspace)
- `@stream-io/react-native-webrtc` - WebRTC for React Native
- `react-native-svg` - SVG rendering
- `react-native-reanimated` - Animations
- `react-native-gesture-handler` - Gesture handling

**Internal Dependencies (workspace):**

- `@stream-io/react-native-callingx` - CallKit (iOS) and Telecom (Android) integration for ringing calls

**Optional Peer Dependencies:**

- `@react-native-firebase/app` + `@react-native-firebase/messaging` - Android push for ringing calls
- `@react-native-community/netinfo` - Network status
- `@stream-io/video-filters-react-native` - Video filters (background blur)
- `@stream-io/noise-cancellation-react-native` - Noise cancellation
- `expo`, `expo-notifications`, `expo-build-properties` - Expo support

**Not part of the SDK (app-level for non-ringing notifications):**

- `@notifee/react-native`, `@react-native-community/push-notification-ios`, `expo-notifications` — used in sample apps for non-ringing notification display, but not SDK dependencies

## Sample Applications

Located in `sample-apps/react-native/`:

- **dogfood/** - Full-featured internal testing app
- **expo-video-sample/** - Expo example
- **ringing-tutorial/** - Push notification tutorial

## Build System

- **React Native Builder Bob** for bundling (see `package.json`)
- Produces 3 outputs:
  - `dist/commonjs/` - CommonJS build
  - `dist/module/` - ESM build
  - `dist/typescript/` - Type definitions
- Expo plugin built separately: `yarn build:expo-plugin`
- Version auto-generated: `yarn copy-version` creates `src/version.ts`

## Cross-Package Development

When making changes that affect multiple packages:

1. **Client changes** → rebuild bindings → rebuild react-native-sdk

   ```bash
   yarn build:client && yarn build:react:bindings && yarn build:react-native:sdk
   ```

2. **Bindings changes** → rebuild react-native-sdk

   ```bash
   yarn build:react:bindings && yarn build:react-native:sdk
   ```

3. **Test in sample app:**
   ```bash
   cd sample-apps/react-native/dogfood
   yarn ios  # or yarn android
   ```

## Related Documentation

- Client architecture: `../client/CLAUDE.md`
- React bindings: `@stream-io/video-react-bindings` package
- React SDK: `../react-sdk/CLAUDE.md`
- Monorepo practices: `../../AGENTS.md`
- Public docs: https://getstream.io/video/docs/react-native/
