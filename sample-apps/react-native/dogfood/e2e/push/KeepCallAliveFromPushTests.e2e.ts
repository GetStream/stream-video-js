import { afterEach, beforeAll, describe, it } from '@jest/globals';

import { E2E_USER_PREFIX } from '../../src/constants/e2e';
import { ParticipantRobot } from '../robots/ParticipantRobot';
import {
  adb,
  answerCallFromNotification,
  forceStopApp,
  waitForAppInForeground,
  appPid,
  byResourceId,
  byText,
  killAppInBackground,
  launchAppFromLauncher,
  replaceFocusedText,
  unlockScreen,
  waitAndTapUiNode,
  waitForKeepAliveBackend,
  waitForUiNode,
} from '../support/Adb';
import {
  assertJsKeptRunning,
  assertStayedOnCall,
  type AwayReport,
  awayDurationMs,
  collectHeartbeats,
  stayAwayFromTheApp,
} from '../support/KeepAliveWatcher';
import { ringUser } from '../support/ringUser';
import {
  getSessionParticipants,
  waitForPushDevice,
  waitForUserOnCall,
} from '../support/StreamCallApi';
import { step } from '../support/step';

/**
 * A ringing call that starts the app from a killed state by push, and must then stay alive with
 * the screen locked. callingx's headless task runs the JS that handles the push; once the user
 * accepts, the same task must go on keeping the call alive, with no gap.
 *
 * Runs without Detox (see `jest.config.js` here), on a device with Google Play services, with the
 * dogfood app installed and opened once. Local only:
 *
 *   yarn e2e:test:push
 *
 * testIDs are found through `uiautomator dump`: React Native puts them in `resource-id`.
 */
const testIds = {
  loginUserNameInput: 'login-user-name-input',
  loginButton: 'login-button',
  logOutButton: 'log-out',
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Opens the app from the launcher and signs in as `userId`, signing out first if needed. */
const signIn = async (userId: string) => {
  await forceStopApp();
  await launchAppFromLauncher();
  const first = await waitForUiNode(
    (node) =>
      byResourceId(testIds.loginUserNameInput)(node) ||
      byResourceId(testIds.logOutButton)(node),
    30_000,
  );
  if (!first) {
    throw new Error(
      'The app showed neither the login screen nor the sign-out button',
    );
  }
  if (byResourceId(testIds.logOutButton)(first)) {
    await waitAndTapUiNode(
      byResourceId(testIds.logOutButton),
      'The sign-out button',
    );
    await waitAndTapUiNode(byText(/^OK$/i), 'The sign-out confirmation');
  }
  await waitAndTapUiNode(
    byResourceId(testIds.loginUserNameInput),
    'The user name field',
    30_000,
  );
  await replaceFocusedText(userId);
  await waitAndTapUiNode(
    byResourceId(testIds.loginButton),
    'The sign-in button',
  );
  const signedIn = await waitForUiNode(
    byResourceId(testIds.logOutButton),
    30_000,
  );
  if (!signedIn) {
    throw new Error(`Signing in as ${userId} did not finish`);
  }
};

describe('KeepCallAliveFromPushTests', () => {
  const buddyCallSeconds = Math.ceil(awayDurationMs / 1000) + 180;

  beforeAll(async () => {
    const gms = await adb(
      'shell',
      'pm',
      'path',
      'com.google.android.gms',
    ).catch(() => '');
    if (!gms.trim()) {
      throw new Error(
        'This device has no Google Play services, so it can not receive pushes. Use a real device or a Google Play emulator image.',
      );
    }
  });

  afterEach(async () => {
    await unlockScreen().catch(() => {});
    // Ends the call. Tapping hang-up isn't possible: `uiautomator dump` can't read the call
    // screen, which never goes idle.
    await forceStopApp().catch(() => {});
  });

  it('testRingingCallFromAKilledAppStaysAliveWhileTheScreenIsLocked', async () => {
    const userId = `${E2E_USER_PREFIX}killed_${Math.random().toString(36).slice(2, 10)}`;
    const participantRobot = new ParticipantRobot(
      'testRingingCallFromAKilledAppStaysAliveWhileTheScreenIsLocked',
    );
    let callId = '';
    let report: AwayReport | undefined;
    let heartbeatsWhileRinging:
      ReturnType<typeof collectHeartbeats> | undefined;

    await step('GIVEN user is signed in and registered for push', async () => {
      await signIn(userId);
      await waitForPushDevice(userId);
    });
    await step('AND Android has killed the app', killAppInBackground);

    await step('WHEN someone rings the user', async () => {
      heartbeatsWhileRinging = collectHeartbeats();
      callId = await ringUser(userId, { byPush: true });
    });
    await step(
      'THEN the push starts the app, and callingx shows the incoming call',
      async () => {
        const deadline = Date.now() + 30_000;
        while (!(await appPid())) {
          if (Date.now() > deadline) {
            throw new Error('The push did not start the app within 30s');
          }
          await sleep(1_000);
        }
        await waitForKeepAliveBackend('callingx', 30_000);
      },
    );
    await step(
      'AND JS runs in the background while the call rings',
      async () => {
        // Stop at the first background heartbeat: the ring times out after 25s, and the user
        // still has to answer it.
        const fromBackground = () =>
          (heartbeatsWhileRinging?.lines ?? []).filter(
            (line) => !/appState=active/.test(line.message),
          );
        const deadline = Date.now() + 12_000;
        while (fromBackground().length === 0 && Date.now() < deadline) {
          await sleep(500);
        }
        heartbeatsWhileRinging?.stop();
        if (fromBackground().length === 0) {
          throw new Error(
            'No JS heartbeat from the background while the call rang: the push did not keep JS running',
          );
        }
      },
    );

    await step(
      'WHEN user answers from the notification',
      answerCallFromNotification,
    );
    await step('THEN user joins the call and the app opens', async () => {
      await waitForUserOnCall(callId, userId, 60_000);
      await waitForAppInForeground(30_000);
    });
    await step('AND a participant joins the call', async () => {
      await participantRobot.setCallDuration(buddyCallSeconds).joinCall(callId);
      const deadline = Date.now() + 100_000;
      while ((await getSessionParticipants(callId, userId)).length < 2) {
        if (Date.now() > deadline) {
          throw new Error('The participant did not join within 100s');
        }
        await sleep(2_000);
      }
    });
    await step('AND callingx keeps the call alive', () =>
      waitForKeepAliveBackend('callingx'),
    );

    await step(
      `WHEN the user locks the screen for ${awayDurationMs / 1000}s`,
      async () => {
        report = await stayAwayFromTheApp({
          mode: 'screen locked',
          userId,
          callIds: [callId],
        });
      },
    );
    await step('THEN the user stays on the call the whole time', async () =>
      assertStayedOnCall(report!),
    );
    await step('AND the app keeps running JS timers the whole time', async () =>
      assertJsKeptRunning(report!),
    );
    await step(
      'AND the app shows again after unlocking, with the user still on the call',
      async () => {
        await unlockScreen();
        await waitForAppInForeground(20_000);
        await waitForUserOnCall(callId, userId, 5_000);
      },
    );
  });
});
