# E2E tests (Detox)

End-to-end tests for the React Native Video SDK, driving `sample-apps/react-native/e2e-test-app` with
[Detox](https://wix.github.io/Detox/). The other participants are played by
[`stream-video-buddy`](https://github.com/GetStream/stream-video-buddy), which joins the call from a headless browser.
The suite is a port of the Android Video SDK's e2e tests (`demo-app/src/androidTestE2etestingDebug`), and its setup
matches the React Native Chat SDK's (`examples/E2ETestApp`), so tests can be ported almost line by line:

| Path                                        | What                                                                  | Native counterpart                           |
| ------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------- |
| `robots/ParticipantRobot.ts`                | the other participants: stream-video-buddy's `/join` and `/ring`      | `ParticipantRobot`                           |
| `robots/UserRobot.ts` + `UserRobot*Asserts` | UI actions as the app user + assert extensions                        | `UserRobot` + `UserRobot*Asserts.kt`         |
| `pages/`                                    | page objects: `LoginPage`, `CallDetailsPage`, `LobbyPage`, `CallPage` | `pages/*Page.kt`                             |
| `support/`                                  | `setUpStreamTestCase()`, `step()`, uiautomator-like `Element` helpers | `StreamTestCase`, `step {}`, `uiautomator/*` |
| `tests/*.e2e.ts`                            | the tests, same class, test and step names as on Android              | `tests/*Tests.kt`                            |

Robots are fluent like the native ones; every call is queued and the chain runs when awaited:

```ts
await step('GIVEN user starts a call', () => userRobot.joinCall());
await step('WHEN participant joins the call', () =>
  participantRobot.joinCall(callId),
);
await step('THEN there is one participant', () =>
  userRobot.assertParticipantsCountOnCall(1),
);
```

Selectors are testIDs: the SDK's in `packages/react-native-sdk/src/constants/TestIds.ts`, the app's in `src/testIds.ts`.

## The app

`sample-apps/react-native/e2e-test-app` exists only for this suite. It has the SDK and its required peer dependencies,
and nothing else: no Firebase, chat, navigation or camera library. Its flow is the Android demo app's: login → call
details → lobby (the SDK's `Lobby`) → call (the SDK's `CallContent`), one screen at a time (`App.tsx`). A fresh launch
signs in as a random user; an explicit sign-out stays on the login screen.

There is no mock server: the app talks to the real `demo` environment (tokens from `pronto.getstream.io`), the one
stream-video-buddy joins through `getstream.io/video/demos`, so both end up on the same call. `setUpStreamTestCase()`
picks a new call id per test and relaunches the app with the launch argument `CALL_ID` (the Android suite's
`EXTRA_CALL_ID`), read in `src/config.ts` via `react-native-launch-arguments`. The suite runs on the host, so
`ParticipantRobot` reaches the buddy server on `localhost` on both platforms.

## Running

The fastlane lanes live with the repo's other React Native lanes in `sample-apps/react-native/dogfood/fastlane` (run
them from `sample-apps/react-native/dogfood`). The e2e app has no Gemfile of its own; `e2e_pod_install` installs its pods
with that bundle.

```bash
yarn install && yarn build:react-native:deps            # from the repo root
bundle exec fastlane e2e_pod_install                     # once, and after native dependency changes
# Everything: starts stream-video-buddy, builds, tests, stops the buddy
bundle exec fastlane test_e2e platform:ios
bundle exec fastlane test_e2e platform:android          # AVD from DETOX_AVD_NAME (default Pixel_API_37)
# Options: configuration:debug, skip_build:true, device:att (a booted emulator, DETOX_ADB_NAME),
#          test:e2e/tests/LobbyTests.e2e.ts

# Or by hand (yarn commands in sample-apps/react-native/e2e-test-app)
bundle exec fastlane start_video_buddy                   # server on VIDEO_BUDDY_PORT (default 5678)
yarn e2e:build -c ios.sim.release                        # or android.emu.release
VIDEO_BUDDY_PORT=5678 yarn e2e:test -c ios.sim.release
bundle exec fastlane stop_video_buddy
```

Android builds only the `arm64-v8a` and `x86_64` ABIs (emulators); set `ORG_GRADLE_PROJECT_reactNativeArchitectures` to
narrow it further.

Release configurations bundle the JS, so no Metro is needed. Debug configurations need `yarn start`. Android builds need
JDK 17 or 21 (`JAVA_HOME`). `E2E_LOG_LEVEL=debug yarn e2e:test ...` passes the client's log level to the app (read it
with `adb logcat -s ReactNativeJS:V`).

## CI

`.github/workflows/react-native-e2e-test.yml` runs on pull requests and on demand (`workflow_dispatch`, with iOS/Android
toggles). A cheap `Check E2E Required` job first runs `fastlane e2e_check_required` (`is_check_required` over the `e2e`
sources in the dogfood Fastfile's `impact_analysis`). The simulator/emulator jobs run only when the PR touches those
sources, or when the last change to them hasn't passed yet. `Test E2E Result` is the job to require in branch
protection: it passes when the e2e jobs pass or are skipped as not required.

iOS runs on demand only, on the `xcode-27` runner (Xcode 27.1, iPhone 18 Pro, `ios.sim.release`). Android runs on
`ubuntu-latest` with KVM and an API 36 x86_64 emulator without a camera (`android.att.release`). Both call
`fastlane test_e2e skip_build:true`, which on CI adds `--retries 2 --headless` and keeps failure logs and screenshots in
`artifacts/`. Those and the buddy's logs and recordings are uploaded when a job fails.

What CI caches. GitHub only lets a PR restore caches from its own branch or the base branch, and this workflow doesn't
run on `main`, so each PR fills its own: its first run builds cold, and later pushes to it reuse the caches.

- **The built app** (`.app`; release + test `.apk`), keyed on the app and SDK sources. A change that only touches
  `e2e/` reuses the binary and skips building the SDK packages, pods, Gradle and Xcode entirely.
- iOS: CocoaPods, ccache (the RN ccache wrappers need `CCACHE_BINARY` in the environment, which the workflow sets), the
  Detox framework.
- Android: Gradle (`gradle/actions/setup-gradle` with `cache-read-only: false`, `org.gradle.caching`), a single ABI
  (`x86_64`). The emulator matches the native Android SDK's e2e jobs (API 36 AOSP image, `pixel` profile, no snapshot,
  no camera).
- stream-video-buddy's Playwright browser, keyed on the Playwright version.

## Gotchas

- Detox's idle synchronization is off on both platforms (`StreamTestCase.ts`): a call never goes idle (the duration
  timer, the speech indicator, WebRTC), so Detox would wait forever. Robots wait explicitly instead, and taps retry while
  the target is not hittable yet. (The Chat suite keeps it on for Android.)
- Don't pass `permissions` to `device.launchApp`: on iOS Detox applies each with `applesimutils --restartSB`, which
  restarts SpringBoard on every launch. Camera and microphone are granted once with `simctl privacy`
  (`support/Permissions.ts`); on Android, Detox installs the app with `adb install -g`.
- CI boots the simulator at the start of the job and pins it with `DETOX_IOS_UDID` (`.detoxrc.js`), so the boot
  overlaps with setup instead of delaying the first test.
- A freshly booted CI emulator can show "Quickstep isn't responding" (a launcher ANR). The `test_e2e` lane hides error
  dialogs and waits up to 60s for the emulator to settle, and `StreamTestCase` dismisses any ANR dialog before each
  Android launch (`support/AndroidSystemDialogs.ts`).
- `detox test --reuse` does not reinstall the app. After rebuilding, run without it, or you test the old binary.
- Yarn's `enableScripts: false` skips Detox's postinstall; run `yarn detox build-framework-cache` once on a new machine.
- Don't commit `ios/VideoE2ETestApp.xcodeproj` after `USE_CCACHE=1 pod install`: it writes machine-specific ccache paths
  into it.
- Detox replaces Jest's global `expect`. Use it for element expectations and `expect as jestExpect` from
  `@jest/globals` for values.
- Fabric flattens the SDK's container views (the lobby root, participant views, the floating local view), so
  `withAncestor` scopes on them match nothing on iOS. The page objects select unscoped testIDs.
- The camera preview and the speech indicator are asserted by existence, not visibility: Detox's visibility check needs
  rendered pixels.
- The emulator has no camera, like in the native Android suite. With an emulated one, `call.join()` sometimes never
  resolves: the calling state is already `JOINED`, but the camera `getUserMedia` after the lobby preview hands over
  never completes.
- iOS simulator: there is no camera, and toggling the microphone can abort the app inside WebRTC's audio device module
  (`AVAudioEngine stop` → `ReportXPCTimeout`). That's why iOS isn't part of the PR checks yet.
- stream-video-buddy's browser must match its Playwright version (`install_video_buddy` installs it with
  `playwright@1.52.0`); with another build it fails to launch, and the participant never joins.
- The buddy server handles join requests one at a time: a stuck request delays every later one.
- Call ids start with `e2e-`: `react-native-launch-arguments` turns an all-digit or `5e123456`-like hex id into a number.
- A ported test keeps the native expectation. If the SDK disagrees, fix the SDK or skip the test against a ticket.
