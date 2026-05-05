# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is the **React Native dogfood app** — an internal testing app for the `@stream-io/video-react-native-sdk`. It exercises all major SDK features: video calls, audio rooms, livestreaming, ringing/push notifications, and chat integration.

## Parent instructions

This app lives inside the `stream-video-js` monorepo. Always follow the root-level instructions:
@../../../AGENTS.md

## Commands

All commands should be run from this directory (`sample-apps/react-native/dogfood`).

| Action                         | Command                                                                    |
| ------------------------------ | -------------------------------------------------------------------------- |
| First-time setup               | `yarn setup` (installs deps, builds RN SDK dependencies, runs pod-install) |
| Start Metro (with cache reset) | `yarn start`                                                               |
| Run on iOS simulator           | `yarn ios`                                                                 |
| Run on iOS device              | `yarn ios-device`                                                          |
| Run on Android emulator        | `yarn android`                                                             |
| Type-check                     | `yarn build` (runs `tsc`)                                                  |
| Reinstall iOS pods             | `cd ios && bundle exec pod install`                                        |

Before running the app, the workspace SDK packages must be built first:

```bash
# From monorepo root
yarn build:all
# Or just the RN dependencies
yarn build:react-native:deps
```

If Metro has module resolution issues, always start with `yarn start` (which includes `--reset-cache`).

## Architecture

### App modes

The app has four distinct modes, selectable from the `ChooseAppModeScreen`:

- **Meeting** — standard video calls with lobby, join/create flows, guest mode, in-call chat
- **Call** — ringing calls (1:1 and group) with CallKit/ConnectionService integration
- **Audio-Room** — audio-only rooms with speaker request/grant flow
- **LiveStream** — host or viewer livestream with QR code joining and chat overlay

Mode selection is stored in `AppContext` and drives which navigator stack renders in `App.tsx`.

### Key wrappers (render order in App.tsx)

1. `SafeAreaProvider` + `AppGlobalContextProvider` (MMKV-backed global state)
2. `NavigationContainer` (React Navigation)
3. `VideoWrapper` — creates `StreamVideoClient` with token auth, provides `<StreamVideo>` context
4. `RingingWatcher` — monitors incoming ringing calls and switches to Call mode
5. `ChatWrapper` — creates Stream Chat client for in-call messaging
6. Mode-specific navigator (`Meeting`, `Call`, `LiveStream`, `AudioRoom`)

### Navigation flows

Each mode has its own navigator stack defined in `src/navigators/`:

```
Meeting:  JoinMeetingScreen → MeetingScreen → ChatScreen (optional)
                             → GuestModeScreen → GuestMeetingScreen
Call:     JoinCallScreen → [RingingCallContent overlay for incoming calls]
AudioRoom: RoomList ↔ Room (state-based, not stack-based)
LiveStream: LiveStreamChooseScreen → JoinLiveStream → HostLiveStream | ViewerLiveStream
                                                     → QRScanner
```

`StaticNavigationService` (`src/utils/staticNavigationUtils.ts`) provides navigation access outside React components — it polls until the navigation ref is ready and auth info is set. Used by push notification handlers and deep links.

### State management

Global app state uses a custom atomic store built on MMKV (`src/contexts/createStoreContext.tsx`). The store provides `useAppGlobalStoreValue(selector)` for reads and `useAppGlobalStoreSetState()` for writes. Persisted keys include: userId, userName, userImageUrl, appEnvironment, callId, appMode, themeMode, devMode.

A separate `LayoutContext` manages grid/spotlight layout selection within active calls.

### Authentication and token flow

1. User logs in via `LoginScreen` (sets userId/userName/userImageUrl in MMKV store)
2. `VideoWrapper` calls `createToken({ user_id }, appEnvironment)` against `https://pronto.getstream.io/api/auth/create-token`
3. Returns `{ apiKey, token }` — token expires in 4 hours, a `tokenProvider` callback handles refresh
4. `StreamVideoClient.getOrCreateInstance()` initializes the SDK client
5. `useChatClient` hook does the same for Stream Chat

Guest/anonymous users get a separate `StreamVideoClient` instance created in `GuestMeetingScreen`.

### Push notifications

Push config is set in `src/utils/setPushConfig.ts` and **must run at app startup** (before any React rendering) because the app can be opened from a dead state via push. Uses:

- iOS: APNs via `react-native-voip-push-notification` + `PushNotificationIOS` (provider: `rn-apn-video`)
- Android: FCM via `@react-native-firebase/messaging` + Notifee for notification display (provider: `rn-fcm-video`)

`createStreamVideoClient` in `setPushConfig.ts` creates a video client from persisted MMKV credentials when handling push in the background.

Firebase listeners are platform-split: `setFirebaseListeners.android.ts` (handles background/foreground FCM messages) vs `setFirebaseListeners.ts` (no-op on iOS).

### Deep links

`useDeepLinkEffect` hook parses URLs matching `/(join|video/demos/join)/<callId>/` and publishes the call ID via an RxJS `BehaviorSubject` (`deeplinkCallId$`). The `StackNavigator` subscribes and switches to Meeting mode on receipt.

### Call UI architecture

The active call screen (`MeetingUI` → `ActiveCall`) is the most complex component tree:

- **MeetingUI** — state machine managing: lobby → loading → active-call → error screens
- **ActiveCall** — composes the call layout with:
  - `TopControls` — layout switcher, camera flip, call timer/recording badge, hang-up
  - Video layout (grid or spotlight via `LayoutContext`)
  - `BottomControls` — mic/camera/screenshare toggles, record button, participants/chat buttons, closed captions
  - `MoreActionsButton` — drawer with: feedback, call stats, theme toggle, screenshot, audio route picker, noise cancellation, closed captions toggle, emoji reactions, raise hand, video filters

### Video effects

`src/components/VideoEffects/` provides a horizontal filter picker: grayscale (custom native module via `VideoEffectsModule`), background blur (SDK built-in), and background images. Effects are applied via `mediaStream.video.track._setVideoEffect()`.

### Call controls patterns

Custom call control buttons follow a consistent pattern:

- Use `useCallStateHooks()` for reactive state (participants, microphone, camera, calling state)
- Check `OwnCapability` for permission-gated actions (mute others, block, grant/revoke permissions)
- Use `useCall()` for direct call object access (recording, feedback, moderation)
- Platform-specific branches for iOS/Android (audio route picker, device selector)

### Audio rooms

Audio rooms use a state-based (not navigation-based) flow:

- `RoomList` queries `audio_room` calls with watch mode for real-time updates, supports pagination via cursor
- `Room` renders: description panel, participants grid (3-column), permission requests panel, and controls
- `ControlsPanel` handles the live/backstage lifecycle and audio permission request flow

### Chat integration

Two chat patterns:

- **Meeting mode**: navigates to a dedicated `ChatScreen` with `stream-chat-react-native` Channel/MessageList/MessageInput (channel type: `videocall`)
- **LiveStream mode**: `BottomSheetChatWrapper` using `@gorhom/bottom-sheet` with snap points (channel type: `livestream`)

Both use `useChatClient` hook for client lifecycle and `useUnreadCount` for badge indicators.

### Environment configuration

`AppEnvironment` type: `'pronto' | 'pronto-staging' | 'demo' | 'video-moderation' | 'stream-benchmark'`. Environment is selectable in dev mode (enabled by 3-tap secret on login screen). Local SFU support overrides SFU URLs via Axios response transformer in `VideoWrapper`.

### Constants and known users

- `src/constants/index.ts` — UI dimensions (BUTTON_HEIGHT, INPUT_HEIGHT, AVATAR_SIZE, Z_INDEX)
- `src/constants/KnownUsers.ts` — hardcoded test users (vishal, khushal, santhosh, oliver, zita, kristian) with Slack CDN avatar URLs
- `src/constants/TestIds.ts` — test identifier enums for buttons/components

### Translations

`src/translations/en.json` contains 72 English strings with `{{ placeholder }}` templating. Merged with SDK translations in `src/translations/index.ts` — app strings override SDK defaults.

### Metro configuration

`metro.config.js` uses `@rnx-kit/metro-config` and `@rnx-kit/metro-resolver-symlinks` to handle yarn workspace symlinks. Watch folders include the workspace SDK packages (`client`, `react-bindings`, `react-native-sdk`, `video-filters-react-native`, `noise-cancellation-react-native`).

### Babel

Uses React Compiler (`babel-plugin-react-compiler`), `react-native-dotenv` for environment variables, and `react-native-worklets/plugin` for vision camera worklets.
