import { afterEach, describe, it } from '@jest/globals';

import {
  E2E_RING_FROM_PUSH_USER_PREFIX,
  RING_BY_PUSH,
} from '../../src/utils/ignoreRingEventsFromWebSocket';
import { seconds } from '../support/Element';
import { closeNotificationShade } from '../support/NotificationShade';
import { step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

/**
 * The incoming call notification only comes from a push, and CI's emulator image has no Google
 * Play services, so no push can arrive there. Set `E2E_DEVICE_HAS_PUSH=true` to run the tests that
 * need it, on a device or emulator with Google Play services.
 */
const itNeedsPush = process.env.E2E_DEVICE_HAS_PUSH === 'true' ? it : it.skip;

describe('RingingTests', () => {
  const testCase = setUpStreamTestCase();

  // A ringing call switches the app to its Call mode, and the app keeps that mode across launches.
  // Signing out sends it back to the login screen, so the next test signs in to Meeting mode.
  afterEach(async () => {
    // A test that failed while the notification shade was open would leave it open, and the
    // shade would then keep the app's window from getting focus in the next test.
    closeNotificationShade();
    // A fresh launch also closes an incoming call screen that's still showing.
    await device.launchApp({
      newInstance: true,
      launchArgs: { detoxEnableSynchronization: 0 },
    });
    await device.disableSynchronization();
    await testCase.userRobot.logout();
  });

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

  // On Android 13+, Decline on the notification opens a see-through screen in its own task. When
  // that screen closes, Android removes the task and stops CallService (`stopWithTask`). The call
  // must still be hung up in Telecom. If it isn't, Telecom keeps it ringing for 2 minutes and turns
  // down every new incoming call from the app (`CallException` code 5), so no notification shows.
  //
  // Both callers disappear right after ringing, so nothing but the user's Decline ends the first
  // call. The second call must ring well within those 2 minutes.
  itNeedsPush(
    'testNextIncomingCallRingsAfterDecliningFromTheNotification',
    async () => {
      const { userRobot, participantRobot } = testCase;
      const userId = `e2e_${Math.random().toString(36).slice(2, 10)}`;

      await step(
        'GIVEN user is signed in and the app is in the background',
        () =>
          userRobot
            .logout()
            .login(userId)
            .perform(() => device.sendToHome()),
      );
      await step('WHEN participant rings the user and disappears', () =>
        participantRobot.ringUserAndDisappear(userId, { byPush: true }),
      );
      await step('THEN user sees the incoming call notification', () =>
        userRobot.assertIncomingCallNotification(true, seconds(30)),
      );
      await step('WHEN user declines the call from the notification', () =>
        userRobot.declineIncomingCallFromNotification(),
      );
      await step('THEN the incoming call notification goes away', () =>
        userRobot.assertIncomingCallNotification(false, seconds(10)),
      );
      await step('AND the call service stops', () =>
        userRobot.assertCallServiceRunning(false, seconds(15)),
      );
      await step('WHEN participant rings the user again', () =>
        participantRobot.ringUserAndDisappear(userId, { byPush: true }),
      );
      await step('THEN user sees the incoming call notification again', () =>
        userRobot.assertIncomingCallNotification(true, seconds(30)),
      );
      await step('AND the notification keeps showing', () =>
        userRobot.assertIncomingCallNotificationStaysShown(seconds(5)),
      );
    },
  );
});
