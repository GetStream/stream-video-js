import { afterEach, describe, it } from '@jest/globals';

import {
  E2E_RING_FROM_PUSH_USER_PREFIX,
  RING_BY_PUSH,
} from '../../src/utils/ignoreRingEventsFromWebSocket';
import { seconds } from '../support/Element';
import { step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

describe('RingingTests', () => {
  const testCase = setUpStreamTestCase();

  // A ringing call switches the app to its Call mode, and the app keeps that mode across launches.
  // Signing out sends it back to the login screen, so the next test signs in to Meeting mode.
  afterEach(async () => {
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
});
