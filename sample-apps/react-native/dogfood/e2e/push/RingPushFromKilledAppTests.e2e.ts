import { afterEach, beforeAll, describe, expect, it } from '@jest/globals';

import { E2E_RING_BY_PUSH_ONLY_USER_PREFIX } from '../../src/utils/ignoreRingEventsFromWebSocket';
import {
  answerCallFromNotification,
  appPid,
  byResourceId,
  byText,
  CALLINGX_CALL_SERVICE,
  forceStopApp,
  foregroundServices,
  killAppInBackground,
  launchAppFromLauncher,
  replaceFocusedText,
  waitAndTapUiNode,
  waitForUiNode,
} from '../support/Adb';
import {
  appStartedForRingPush,
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
import { ringUser } from '../support/ringUser';
import { waitForPushDevice, waitForUserOnCall } from '../support/StreamCallApi';
import { step } from '../support/step';

/**
 * A ring that reaches a killed app by push. Android starts the app's process for callingx's
 * `StreamMessagingReceiver`, which shows the incoming call natively before any JS runs.
 *
 * Runs without Detox (see `jest.config.js` here), on a device with Google Play services, with a
 * debug build of the dogfood app installed and opened once. Local only:
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

describe('RingPushFromKilledAppTests', () => {
  let logs: ReturnType<typeof collectDeviceLogs> | undefined;

  beforeAll(() => {
    if (!hasGooglePlayServices()) {
      throw new Error(
        'This device has no Google Play services, so it can not receive pushes. Use a real device or a Google Play emulator image.',
      );
    }
  });

  afterEach(async () => {
    logs?.stop();
    logs = undefined;
    await resetAppMessagingService().catch(() => {});
    // Ends the call. Tapping hang-up isn't possible: `uiautomator dump` can't read the call
    // screen, which never goes idle.
    await forceStopApp().catch(() => {});
  });

  /**
   * Signs in, lets Android kill the app, rings, and answers from the notification.
   *
   * @param withAppMessagingService turns on the debug build's `E2EAppMessagingService` first. It
   * wins Firebase messages over callingx's `StreamMessagingService` and doesn't forward them, like
   * an app with its own service.
   */
  const ringAKilledAppAndAnswer = async ({
    withAppMessagingService = false,
  } = {}) => {
    const userId = `${E2E_RING_BY_PUSH_ONLY_USER_PREFIX}killed_${Math.random().toString(36).slice(2, 10)}`;
    let callId = '';

    await step('GIVEN user is signed in and registered for push', async () => {
      await signIn(userId);
      await waitForPushDevice(userId);
    });
    if (withAppMessagingService) {
      await step(
        "AND the app's own Firebase service gets messages instead of Stream's",
        async () => {
          await enableAppMessagingService();
          await assertAppMessagingServiceWins();
        },
      );
    }
    await step('AND Android has killed the app', killAppInBackground);

    await step('WHEN someone rings the user', async () => {
      logs = collectDeviceLogs(RING_PUSH_LOG_PATTERN);
      callId = await ringUser(userId, { byPush: true });
    });
    await step(
      "THEN Android starts the app to deliver the push to callingx's receiver",
      async () => {
        const deadline = Date.now() + 30_000;
        while (!appStartedForRingPush(logs!.lines)) {
          if (Date.now() > deadline) {
            throw new Error(
              `Android did not start the app for StreamMessagingReceiver within 30s (app running: ${Boolean(await appPid())})`,
            );
          }
          await sleep(1_000);
        }
      },
    );
    await step('AND one incoming call notification shows', () =>
      waitForOneIncomingCallNotification(30_000),
    );
    await step('AND the call service runs in the foreground', async () => {
      expect(await foregroundServices()).toContain(CALLINGX_CALL_SERVICE);
    });
    await step('AND the push started the incoming call once', () =>
      assertRingPushHandledOnce(logs!),
    );
    if (withAppMessagingService) {
      await step(
        "AND the app's own service got the push, not Stream's",
        async () => assertAppMessagingServiceGotTheRingPush(logs!),
      );
    }

    await step(
      'WHEN user answers from the notification',
      answerCallFromNotification,
    );
    await step('THEN user joins the call', () =>
      waitForUserOnCall(callId, userId, 60_000),
    );
  };

  it('testIncomingCallFromAPushStartsAKilledAppAndCanBeAnswered', () =>
    ringAKilledAppAndAnswer());

  it('testIncomingCallFromAPushStartsAKilledAppWhenTheAppHasItsOwnFirebaseService', () =>
    ringAKilledAppAndAnswer({ withAppMessagingService: true }));
});
