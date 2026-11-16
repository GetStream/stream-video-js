import { afterEach, describe, expect as jestExpect, it } from '@jest/globals';

import { E2E_RING_BY_PUSH_ONLY_USER_PREFIX } from '../../src/utils/ignoreRingEventsFromWebSocket';
import { CALLINGX_CALL_SERVICE, foregroundServices } from '../support/Adb';
import { seconds } from '../support/Element';
import {
  assertAppMessagingServiceGotTheRingPush,
  assertAppMessagingServiceWins,
  assertRingPushHandledOnce,
  collectDeviceLogs,
  enableAppMessagingService,
  hasGooglePlayServices,
  resetAppMessagingService,
  RING_PUSH_LOG_PATTERN,
  waitForOneIncomingCallNotification,
} from '../support/RingPush';
import { step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

/**
 * A ring that reaches the app only by push, handled by callingx's `StreamMessagingReceiver`. The
 * user signs in with an id that makes the app ignore `call.created` and `call.ring` from the
 * WebSocket (`src/utils/ignoreRingEventsFromWebSocket.ts`), so the push is the only way the ring
 * can arrive.
 *
 * Pushes need Google Play services, which CI's emulator image doesn't have, so these tests skip
 * themselves there. CI's batching (`e2e_test_ids` in the Fastfile) only counts `it(` calls, so it
 * never schedules them either. Run them on a device or emulator with Google Play, with a debug
 * build: "handled once" is read from callingx's debug logs.
 *
 * The killed-app cases can't run under Detox; they are in `e2e/push/RingPushFromKilledAppTests.e2e.ts`.
 *
 * The `…WhenTheAppHasItsOwnFirebaseService` test turns on the debug build's
 * `E2EAppMessagingService`, which wins Firebase messages over callingx's `StreamMessagingService`
 * and doesn't forward them, like an app with its own service.
 */
const itWithPush = hasGooglePlayServices() ? it : it.skip;

const pushOnlyUserId = () =>
  `${E2E_RING_BY_PUSH_ONLY_USER_PREFIX}${Math.random().toString(36).slice(2, 10)}`;

describe('RingPushTests', () => {
  const testCase = setUpStreamTestCase();
  let logs: ReturnType<typeof collectDeviceLogs> | undefined;

  // A ringing call switches the app to its Call mode, and the app keeps that mode across launches.
  // Signing out sends it back to the login screen, so the next test signs in to Meeting mode.
  afterEach(async () => {
    logs?.stop();
    logs = undefined;
    await resetAppMessagingService();
    // A fresh launch also closes an incoming call screen that's still showing.
    await device.launchApp({
      newInstance: true,
      launchArgs: { detoxEnableSynchronization: 0 },
    });
    await device.disableSynchronization();
    await testCase.userRobot.logout();
  });

  itWithPush('testIncomingCallFromAPushShowsWhileTheAppIsOpen', async () => {
    const { userRobot, participantRobot } = testCase;
    const userId = pushOnlyUserId();

    await step('GIVEN user is signed in and gets rings only by push', () =>
      userRobot.logout().login(userId),
    );
    await step('WHEN participant rings the user', async () => {
      logs = collectDeviceLogs(RING_PUSH_LOG_PATTERN);
      await participantRobot.ringUserAndDisappear(userId, { byPush: true });
    });
    await step('THEN the app shows the incoming call', () =>
      userRobot.assertIncomingCall(true, seconds(30)),
    );
    await step('AND the push started the incoming call once', () =>
      assertRingPushHandledOnce(logs!),
    );
  });

  itWithPush(
    'testIncomingCallFromAPushShowsWhileTheAppIsInTheBackground',
    async () => {
      const { userRobot, participantRobot } = testCase;
      const userId = pushOnlyUserId();

      await step('GIVEN user is signed in and gets rings only by push', () =>
        userRobot.logout().login(userId),
      );
      await step('AND the app is in the background', () => device.sendToHome());
      await step('WHEN participant rings the user', async () => {
        logs = collectDeviceLogs(RING_PUSH_LOG_PATTERN);
        await participantRobot.ringUserAndDisappear(userId, { byPush: true });
      });
      await step('THEN one incoming call notification shows', () =>
        waitForOneIncomingCallNotification(seconds(30)),
      );
      await step('AND the call service runs in the foreground', async () => {
        jestExpect(await foregroundServices()).toContain(CALLINGX_CALL_SERVICE);
      });
      await step('AND the push started the incoming call once', () =>
        assertRingPushHandledOnce(logs!),
      );
      await step(
        'WHEN user opens the app THEN it shows the incoming call',
        async () => {
          await device.launchApp({ newInstance: false });
          await userRobot.assertIncomingCall(true, seconds(15));
        },
      );
    },
  );

  itWithPush(
    'testIncomingCallFromAPushShowsInTheBackgroundWhenTheAppHasItsOwnFirebaseService',
    async () => {
      const { userRobot, participantRobot } = testCase;
      const userId = pushOnlyUserId();

      await step('GIVEN user is signed in and gets rings only by push', () =>
        userRobot.logout().login(userId),
      );
      await step(
        "AND the app's own Firebase service gets messages instead of Stream's",
        async () => {
          await enableAppMessagingService();
          await assertAppMessagingServiceWins();
        },
      );
      await step('AND the app is in the background', () => device.sendToHome());
      await step('WHEN participant rings the user', async () => {
        logs = collectDeviceLogs(RING_PUSH_LOG_PATTERN);
        await participantRobot.ringUserAndDisappear(userId, { byPush: true });
      });
      await step('THEN one incoming call notification shows', () =>
        waitForOneIncomingCallNotification(seconds(30)),
      );
      await step('AND the call service runs in the foreground', async () => {
        jestExpect(await foregroundServices()).toContain(CALLINGX_CALL_SERVICE);
      });
      await step('AND the push started the incoming call once', () =>
        assertRingPushHandledOnce(logs!),
      );
      await step(
        "AND the app's own service got the push, not Stream's",
        async () => assertAppMessagingServiceGotTheRingPush(logs!),
      );
    },
  );
});
