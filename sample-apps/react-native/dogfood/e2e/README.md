# E2E tests (Detox)

End-to-end tests for the React Native Video SDK, driving the dogfood app (`sample-apps/react-native/dogfood`) with
[Detox](https://wix.github.io/Detox/). The other participants are played by
[`stream-video-buddy`](https://github.com/GetStream/stream-video-buddy), which joins the call from a headless browser.
The suite is a port of the Android Video SDK's e2e tests (`demo-app/src/androidTestE2etestingDebug`), and its setup
matches the React Native Chat SDK's (`examples/E2ETestApp`), so tests can be ported almost line by line. It runs on
Android only for now; iOS is RN-476.

| Path                                        | What                                                                                                                                      | Native counterpart                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `robots/ParticipantRobot.ts`                | the other participants: stream-video-buddy's `/join` and `/ring`, and a caller that rings and disappears (`support/ringAndDisappear.mjs`) | `ParticipantRobot`                           |
| `robots/UserRobot.ts` + `UserRobot*Asserts` | UI actions as the app user + assert extensions                                                                                            | `UserRobot` + `UserRobot*Asserts.kt`         |
| `pages/`                                    | page objects: `LoginPage`, `CallDetailsPage`, `LobbyPage`, `CallPage`, `RingingPage`                                                      | `pages/*Page.kt`                             |
| `support/`                                  | `setUpStreamTestCase()`, `step()`, uiautomator-like `Element` helpers                                                                     | `StreamTestCase`, `step {}`, `uiautomator/*` |
| `tests/*.e2e.ts`                            | the tests, same class, test and step names as on Android                                                                                  | `tests/*Tests.kt`                            |

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

Selectors are testIDs: the SDK's in `packages/react-native-sdk/src/constants/TestIds.ts`, the app's in
`src/constants/TestIds.ts`.

## The app

The suite drives the real dogfood app, push notifications, ringing and chat included, so it can cover the flows
integrators build on. A release build talks to the `demo` environment (tokens from `pronto.getstream.io`), the one
stream-video-buddy joins through `getstream.io/video/demos`, so both end up on the same call. There is no mock server.

The flow is the Meeting mode: login (`LoginPage`) → `JoinMeetingScreen` (`CallDetailsPage`) → the SDK's `Lobby`
(`LobbyPage`) → the call (`CallPage`). The app keeps the signed-in user across launches, so `setUpStreamTestCase()`
relaunches it before each test and signs in as a random user only when it shows the login screen (a fresh install).
It also picks a new call id per test, which the `UserRobot` types into the call id field. The suite runs on the host,
so `ParticipantRobot` reaches the buddy server on `localhost` (the emulator's traffic goes through `adb reverse`).

Detox needs a few things in the app: the instrumentation runner (`android/app/src/androidTest/.../DetoxTest.kt`), its
Gradle setup (`testBuildType`, `androidTestImplementation 'com.wix:detox:+'`, the `Detox-android` repository in
`android/build.gradle`), and cleartext traffic to `localhost` in release builds
(`android/app/src/release/res/xml/network_security_config.xml`).

## Running

The fastlane lanes live in `fastlane/Fastfile` and `fastlane/Allurefile`; run them from
`sample-apps/react-native/dogfood`.

```bash
yarn install && yarn build:react-native:deps            # from the repo root
# Everything: starts stream-video-buddy, builds, tests, stops the buddy
bundle exec fastlane test_e2e                            # AVD from DETOX_AVD_NAME (default Pixel_API_37)
# Options: configuration:debug, skip_build:true, device:att (a booted emulator, DETOX_ADB_NAME),
#          test:e2e/tests/LobbyTests.e2e.ts, batch:0 batch_count:3 (every 3rd test, from the first)

# Or by hand
bundle exec fastlane start_video_buddy                   # server on VIDEO_BUDDY_PORT (default 5678)
yarn e2e:build -c android.emu.release
VIDEO_BUDDY_PORT=5678 yarn e2e:test -c android.emu.release
bundle exec fastlane stop_video_buddy
```

Android builds only the `arm64-v8a` and `x86_64` ABIs (emulators); set `ORG_GRADLE_PROJECT_reactNativeArchitectures` to
narrow it further.

Release configurations bundle the JS, so no Metro is needed. Debug configurations need `yarn start`. Android builds need
JDK 17 or 21 (`JAVA_HOME`). The app logs at `debug` level; read it with `adb logcat -s ReactNativeJS:V`.

## CI

`.github/workflows/react-native-e2e-test.yml` runs on pull requests and on demand (`workflow_dispatch`). A cheap
`Check E2E Required` job first runs `fastlane e2e_check_required` (`is_check_required` over the `e2e` sources in the
dogfood Fastfile's `impact_analysis`). The emulator job runs only when the PR touches those
sources, or when the last change to them hasn't passed yet. `Test E2E Result` is the job to require in branch
protection: it passes when the e2e jobs pass or are skipped as not required.

The PR workflow splits the tests like the native Android SDK: `Build Android` builds (or restores) the APKs once and
uploads them, and `Test Android` runs a matrix of up to 8 batches (`e2e_batches` from `e2e_check_required`: one per
test when there are fewer than 8). Each batch runs `test_e2e batch:<n> batch_count:<total>`, every `total`-th test,
round-robin, which `e2e/jest.config.js` reads from `E2E_SELECTION`.

Both workflows report to Allure TestOps (project 168, `stream-video-react-native`). On PRs, `Launch Allure TestOps
(Android)` opens one launch for every batch; the nightly opens one per emulator job (`fastlane allure_launch`, named
after the PR; `cron:true` on the nightly). Each job uploads `allure-results/`
(`allure_upload`), and deletes the launch when cancelled (`allure_launch_removal`). These lanes live in
`sample-apps/react-native/dogfood/fastlane/Allurefile`, which the dogfood Fastfile imports, as on iOS. PRs from forks
and Dependabot get no `ALLURE_TOKEN`, so they run without Allure.

`react-native-e2e-test-cron.yml` runs everything on weeknights (01:00 UTC) and on demand, on Android API 36, 34, 31
and 28. A failed scheduled run posts to Slack (`SLACK_WEBHOOK_NIGHTLY_CHECKS`).
Both workflows build through the same composite actions (`.github/actions/rn-e2e-*`), so they share cache keys, and
the nightly run fills the default branch's caches that PRs restore from.

Allure results come from `jest-allure2-reporter` (`e2e/jest.config.js`). Every `step()` is an Allure step, and
`allureId(N)` links a test to its case in project 168. Create the case first (`fastlane allure_testcase` with
`ALLURE_TOKEN` set, the TestOps UI, or the API): cases that an upload creates on its own are not durable.

The jobs run on `ubuntu-24.04` (stream-video-buddy's Playwright 1.52.0 can't install Chromium on 26.04) with KVM and an x86_64 emulator without a camera (`android.att.release`), and call
`fastlane test_e2e device:att skip_build:true`, which on CI adds `--retries 2` and keeps failure logs and screenshots in
`artifacts/`. Those and the buddy's logs and recordings are uploaded when a job fails.

What CI caches. GitHub only lets a PR restore caches from its own branch or the base branch. The nightly run fills
`main`'s, so a PR's first run starts from them, and later pushes to the PR reuse its own.

- **The built app** (release + test `.apk`), keyed on the app and SDK sources. A change that only touches `e2e/` reuses
  the binary and skips building the SDK packages and Gradle entirely.
- Gradle (`gradle/actions/setup-gradle` with `cache-read-only: false`, `org.gradle.caching`), a single ABI
  (`x86_64`). The emulator matches the native Android SDK's e2e jobs (API 36 AOSP image, `pixel` profile, no snapshot,
  no camera).
- stream-video-buddy's Playwright browser, keyed on the Playwright version.

## Gotchas

- Detox's idle synchronization is off (`StreamTestCase.ts`): a call never goes idle (the duration
  timer, the speech indicator, WebRTC), so Detox would wait forever. Robots wait explicitly instead, and taps retry while
  the target is not hittable yet. (The Chat suite keeps it on for Android.)
- Camera and microphone need no grant step: Detox installs the app with `adb install -g`, which grants every runtime
  permission in the manifest.
- A freshly booted CI emulator can show "Quickstep isn't responding" (a launcher ANR). The `test_e2e` lane hides error
  dialogs and waits up to 60s for the emulator to settle, and `StreamTestCase` dismisses any ANR dialog before each
  launch (`support/AndroidSystemDialogs.ts`).
- `detox test --reuse` does not reinstall the app. After rebuilding, run without it, or you test the old binary.
- Detox replaces Jest's global `expect`. Use it for element expectations and `expect as jestExpect` from
  `@jest/globals` for values.
- Fabric flattens the SDK's container views (the lobby root, participant views, the floating local view), so
  `withAncestor` scopes on them match nothing on iOS. The page objects select unscoped testIDs.
- The camera preview and the speech indicator are asserted by existence, not visibility: Detox's visibility check needs
  rendered pixels.
- The emulator has no camera, like in the native Android suite. With an emulated one, `call.join()` can hang when the
  call isn't loaded yet when Join is tapped: the SDK then opens the camera during the join while the preview still
  holds it (RN-474). `MeetingScreen` loads the call in an effect while the lobby opens, so a fast tap can race it.
- stream-video-buddy's browser must match its Playwright version (`install_video_buddy` installs it with
  `playwright@1.52.0`); with another build it fails to launch, and the participant never joins.
- The buddy server handles join requests one at a time: a stuck request delays every later one.
- Call ids start with `e2e-` and users with `e2e_`, so the suite's calls and users are easy to tell apart.
- A ringing call switches the app to its Call mode, and the app keeps that mode across launches. Call mode has no call id
  field, so a ringing test signs out afterwards (`RingingTests`' `afterEach`), and the next test signs in to Meeting mode.
- To test the user's own ring timeout, the caller must not hang up first. stream-video-buddy's browser hangs up after the
  call type's `auto_cancel_timeout_ms` (25s for `default`, the same as `incoming_call_timeout_ms`), so
  `ParticipantRobot.ringUserAndDisappear` rings from `support/ringAndDisappear.mjs` instead: a Node script that rings over
  the API and exits, as if the caller's app was killed. The server then only sends `call.missed`, which doesn't end the
  call. The script runs in its own process because Jest's test environment doesn't expose Node's `WebSocket`.
- A ring can't be tested with the app killed: Detox's runner lives in the app's process, so when that process dies
  Android force-stops the app, and then drops its pushes. `RingingTests` signs in with an id starting with `e2e_ring_`
  instead, and the app then ignores `call.created` from the WebSocket (`src/utils/ignoreRingEventsFromWebSocket.ts`, app
  code, not SDK code), the event an app in the background misses. `call.ring` then starts ringing before the call's
  settings arrive. CI's emulator image has no Google Play services, so no push can arrive there. To test the push path
  locally on a device with Google Play services, set `RING_BY_PUSH` to `true` in that file: the app then also ignores
  `call.ring`, and the ring arrives by push.
- The sign-out confirmation is a native alert: `CallDetailsPage.logOutConfirmButton` selects its `OK` button by text.
- A ported test keeps the native expectation. If the SDK disagrees, fix the SDK or skip the test against a ticket.
  Exception: `assertUserMicrophone` checks only the toggle. Android also checks the mic icon on the user's own video,
  but the RN SDK shows the user in the floating view while one or two others are on the call, and that view has no
  label (`FloatingParticipantView` passes `ParticipantLabel: null`). That's the SDK's design, not a bug.
