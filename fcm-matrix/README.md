# FCM device matrix

Local scripts for verifying Stream ring pushes on Android across API levels and app states.
Not part of the SDK: they live in a separate `chore(wip)` commit on `fcm-broadcast-receiver`
(together with the dogfood `debuggableVariants = []` tweak). Drop that commit before opening the PR.
See `PROPOSAL.md` for the design being verified.

Every result comes from logcat (plus `dumpsys` for the notification and `CallService`), using a
**debug** dogfood build with the JS bundled in, so callingx's `debugLog` lines are present and
cold starts don't depend on Metro.

## Setup (fresh clone)

```bash
nvm use 24                       # matches .nvmrc
yarn install
yarn build:react-native:deps     # dogfood's Metro bundle needs the workspace packages' dist/
```

`build.sh` sets `ANDROID_HOME` (default `~/Library/Android/sdk`) and uses Android Studio's JBR,
so no `local.properties` is needed.

## Steps

1. Build the variants:
   ```bash
   fcm-matrix/build.sh baseline                  # main's callingx (service-only)
   fcm-matrix/build.sh baseline --rnfb-service   # main's callingx + rn-firebase's service competing
   fcm-matrix/build.sh prototype                 # this branch (broadcast receiver)
   fcm-matrix/build.sh prototype --rnfb-service
   ```
2. Install on a device and log in as a guest (checks the token reached Stream):
   ```bash
   fcm-matrix/install.sh <serial> prototype
   ```
3. Run the states (set `RING_CMD` first; the callee id is appended to it):
   ```bash
   RING_CMD='node /path/to/ring.mjs --callee' fcm-matrix/run-device.sh <serial> prototype <guest-user-id>
   ```
   Pass state names after the user id to run a subset, e.g. `killed reboot`.

Results go to `results/<build>.md`, one row per case, with each case's log in `results/logs/`.

## States

| State         | How                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------- |
| foreground    | App launched and visible                                                                 |
| background    | Launched, then Home                                                                      |
| swiped        | Launched, then swiped away in recents (best effort; "App before ring" shows the outcome) |
| killed        | Background, then `am kill`                                                               |
| doze          | Background, screen off, `dumpsys deviceidle force-idle`                                  |
| reboot        | `adb reboot`, wait for boot and FCM reconnect, app never opened                          |
| reboot_locked | Emulators only: PIN set, reboot, ring before the first unlock                            |
| force_stopped | `am force-stop`; Android delivers nothing, expected                                      |

## Log signals

| Column          | Log line                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Receiver        | `[Callingx] StreamMessagingReceiver … onReceive messageId=…`                                                                          |
| Service         | `[Callingx] StreamMessagingService … onMessageReceived`                                                                               |
| Ring started    | `[Callingx] CallService … startIncomingCallFromPush: Starting incoming call from push`                                                |
| Blocked         | `Failed to start service`, `ForegroundServiceStartNotAllowed`, `startForegroundService() not allowed`, `Not allowed to start service` |
| Deduped         | `[Callingx] StreamMessagingHelper … already handled, skipping`                                                                        |
| rn-firebase rcv | `RNFirebaseMsgReceiver … broadcast received for message`                                                                              |
| GMS cancelled   | `GCM … broadcast intent callback: result=CANCELLED` (app force-stopped)                                                               |
