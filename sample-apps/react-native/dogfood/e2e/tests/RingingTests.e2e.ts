import { afterEach, describe, it } from '@jest/globals';

import {
  E2E_RING_FROM_PUSH_USER_PREFIX,
  RING_BY_PUSH,
} from '../../src/utils/ignoreRingEventsFromWebSocket';
import { seconds } from '../support/Element';
import {
  assertAndroidLocked,
  declineFromAndroidLockScreen,
  lockAndroidScreen,
  unlockAndroidScreen,
} from '../support/AndroidLockScreen';
import { step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

// FCM is unavailable on CI's AOSP emulator. This test is local opt-in only.
const runLockScreenE2E =
  process.env.RUN_LOCK_SCREEN_E2E === '1' && !process.env.CI;

describe('RingingTests', () => {
  const testCase = setUpStreamTestCase();

  // A ringing call switches the app to its Call mode, and the app keeps that mode across launches.
  // Signing out sends it back to the login screen, so the next test signs in to Meeting mode.
  afterEach(async () => {
    if (runLockScreenE2E) await unlockAndroidScreen();
    // A fresh launch also closes an incoming call screen that's still showing.
    await device.launchApp({
      newInstance: true,
      launchArgs: { detoxEnableSynchronization: 0 },
    });
    await device.disableSynchronization();
    await testCase.userRobot.logout();
  });

  const lockedScreenTest = runLockScreenE2E ? it : it.skip;
  lockedScreenTest(
    'testSubsequentIncomingCallsCanBeDeclinedWhileLocked',
    async () => {
      if (!RING_BY_PUSH) {
        throw new Error(
          'Enable RING_BY_PUSH in ignoreRingEventsFromWebSocket.ts and rebuild for this test',
        );
      }
      const { userRobot, participantRobot } = testCase;
      const userId = `${E2E_RING_FROM_PUSH_USER_PREFIX}${Math.random().toString(36).slice(2, 10)}`;
      await userRobot.logout().login(userId);
      await device.sendToHome();
      await lockAndroidScreen();

      // No app relaunch or unlock between rings: stale Telecom state must not block the next call.
      for (let attempt = 1; attempt <= 3; attempt++) {
        await step(
          `GIVEN screen is asleep and locked before call ${attempt}`,
          lockAndroidScreen,
        );
        await step(`WHEN incoming call ${attempt} arrives while locked`, () =>
          participantRobot.ringUserAndDisappear(userId, { byPush: true }),
        );
        await step(
          `AND user declines call ${attempt} from the lock screen`,
          declineFromAndroidLockScreen,
        );
        await step(`THEN call ${attempt} is rejected on the server`, () =>
          participantRobot.assertLastRingingCallRejected(userId),
        );
        await step(`AND call ${attempt}'s native notification is removed`, () =>
          participantRobot.assertLastRingingCallNotificationRemoved(),
        );
        await assertAndroidLocked();
      }
    },
  );

  // The call settings normally arrive with `call.created`, before `call.ring`. An app in the
  // background can miss `call.created`, and the call then starts ringing before its settings
  // arrive. The user signs in with an id that makes the app ignore `call.created` from the
  // WebSocket (and `call.ring` too, with `RING_BY_PUSH`), to put the app in that state. See
  // `src/utils/ignoreRingEventsFromWebSocket.ts` for why, and for how to test the push path locally.
  //
  // The caller disappears right after ringing, so no cancel or reject reaches the user, and the
  // server only sends `call.missed`, which doesn't end the call. Only the user's own ring timeout
  // (`incoming_call_timeout_ms`, 25s for the `default` call type) can end it.
  it('testIncomingCallEndsAfterTheRingTimeoutWhenTheSettingsArriveLate', async () => {
    const { userRobot, participantRobot } = testCase;
    const userId = `${E2E_RING_FROM_PUSH_USER_PREFIX}${Math.random().toString(36).slice(2, 10)}`;

    await step('GIVEN user is signed in and the app misses call.created', () =>
      userRobot.logout().login(userId),
    );
    await step(
      'WHEN participant rings the user and disappears without hanging up',
      () =>
        participantRobot.ringUserAndDisappear(userId, { byPush: RING_BY_PUSH }),
    );
    await step('THEN user receives an incoming call', () =>
      userRobot.assertIncomingCall(true, seconds(30)),
    );
    await step('AND the incoming call ends after the ring timeout', () =>
      userRobot.assertIncomingCall(false, seconds(45)),
    );
  });
});
