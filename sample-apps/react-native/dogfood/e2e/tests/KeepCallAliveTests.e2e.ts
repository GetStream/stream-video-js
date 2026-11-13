import { afterEach, describe, it } from '@jest/globals';

import {
  E2E_NO_PIP_USER_PREFIX,
  E2E_ONGOING_CALLS_USER_PREFIX,
  E2E_USER_PREFIX,
} from '../../src/constants/e2e';
import {
  E2E_RING_FROM_PUSH_USER_PREFIX,
  RING_BY_PUSH,
} from '../../src/utils/ignoreRingEventsFromWebSocket';
import {
  answerCallFromNotification,
  type KeepAliveBackend,
  pressHome,
  unlockScreen,
  waitForKeepAliveBackend,
} from '../support/Adb';
import { seconds } from '../support/Element';
import {
  assertJsKeptRunning,
  assertStayedOnCall,
  type AwayMode,
  type AwayReport,
  awayDurationMs,
  stayAwayFromTheApp,
} from '../support/KeepAliveWatcher';
import { ringUser } from '../support/ringUser';
import { waitForUserOnCall } from '../support/StreamCallApi';
import { step } from '../support/step';
import { relaunchApp, setUpStreamTestCase } from '../support/StreamTestCase';

/**
 * Android keeps a call alive in the background with a foreground service and a headless JS task
 * (`keepCallAliveController.ts` in the SDK). Without them, React Native stops JS timers when the
 * app leaves the foreground, and the user is soon dropped from the call.
 *
 * Who keeps the call alive:
 * - a regular call: the SDK's own service, or callingx's when `enableOngoingCalls` is on;
 * - a ringing call: always callingx.
 *
 * Each test puts the app away (locks the screen or goes home) for `E2E_AWAY_SECONDS` (60 by
 * default) and checks, from outside the app:
 * - the server sees the user on the call the whole time, in the same session (not dropped and
 *   joined again);
 * - the app's JS heartbeat (`src/utils/e2eJsHeartbeat.ts`) keeps coming in logcat, so JS timers
 *   keep running;
 * - the expected foreground service holds the call.
 *
 * Android only. The screen lock on the device must be "Swipe" or "None", so the test can unlock it.
 */
describe('KeepCallAliveTests', () => {
  const testCase = setUpStreamTestCase();

  // stream-video-buddy leaves after this many seconds; it must outlast the time the app is away.
  const buddyCallSeconds = Math.ceil(awayDurationMs / 1000) + 180;

  const newUserId = (prefix = `${E2E_USER_PREFIX}keepalive_`) =>
    `${prefix}${Math.random().toString(36).slice(2, 10)}`;

  afterEach(async () => {
    // A failed test can leave the screen locked.
    await unlockScreen().catch(() => {});
    // A fresh launch ends the call. Signing out sends the app back to the login screen, so the next
    // test signs in to Meeting mode, and a user with the ongoing-calls prefix doesn't carry over.
    await relaunchApp();
    await testCase.userRobot.logout();
  });

  /** The away steps shared by every test, with their GIVEN/WHEN/THEN wording. */
  const stayAwayAndCheck = async ({
    mode,
    userId,
    callId,
    backend,
  }: {
    mode: AwayMode;
    userId: string;
    callId: string;
    backend: KeepAliveBackend;
  }) => {
    const { userRobot } = testCase;
    let report: AwayReport | undefined;

    await step(`AND the ${backend} service keeps the call alive`, () =>
      waitForKeepAliveBackend(backend),
    );
    await step(
      `WHEN the user leaves the app with the ${mode} for ${awayDurationMs / 1000}s`,
      async () => {
        report = await stayAwayFromTheApp({ mode, userId, callIds: [callId] });
      },
    );
    await step('THEN the user stays on the call the whole time', async () =>
      assertStayedOnCall(report!),
    );
    await step('AND the app keeps running JS timers the whole time', async () =>
      assertJsKeptRunning(report!),
    );
    await step(
      'AND the call is still on screen when the user comes back',
      async () => {
        if (mode === 'screen locked') {
          await unlockScreen();
        } else {
          await userRobot.openAppFromBackground();
        }
        await userRobot.assertParticipantsCountOnCall(1, seconds(20));
      },
    );
  };

  // Regular call, `enableOngoingCalls` off: the SDK's own service keeps it alive.
  it('testRegularCallStaysAliveWhileTheScreenIsLocked', async () => {
    const { userRobot, participantRobot, callId } = testCase;
    const userId = newUserId();

    await step('GIVEN user is signed in', () =>
      userRobot.logout().login(userId),
    );
    await step('AND user is on a call with a participant', async () => {
      await userRobot.joinCall();
      await participantRobot.setCallDuration(buddyCallSeconds).joinCall(callId);
      await userRobot.waitForParticipantsOnCall(1);
    });
    await stayAwayAndCheck({
      mode: 'screen locked',
      userId,
      callId,
      backend: 'sdk',
    });
  });

  // Picture-in-picture is off for this user: with it on, Home shrinks the call into a
  // picture-in-picture window and the app stays in the foreground.
  it('testRegularCallStaysAliveWhileTheAppIsInTheBackground', async () => {
    const { userRobot, participantRobot, callId } = testCase;
    const userId = newUserId(E2E_NO_PIP_USER_PREFIX);

    await step('GIVEN user is signed in', () =>
      userRobot.logout().login(userId),
    );
    await step('AND user is on a call with a participant', async () => {
      await userRobot.joinCall();
      await participantRobot.setCallDuration(buddyCallSeconds).joinCall(callId);
      await userRobot.waitForParticipantsOnCall(1);
    });
    await stayAwayAndCheck({
      mode: 'app in the background',
      userId,
      callId,
      backend: 'sdk',
    });
  });

  // Regular call, `enableOngoingCalls` on: callingx keeps it alive instead of the SDK.
  it('testRegularCallStaysAliveWhileTheScreenIsLockedWhenCallingxManagesOngoingCalls', async () => {
    const { userRobot, participantRobot, callId } = testCase;
    const userId = newUserId(E2E_ONGOING_CALLS_USER_PREFIX);

    await step(
      'GIVEN user is signed in with ongoing calls turned on',
      async () => {
        await userRobot.logout().login(userId);
        // The push config, which turns ongoing calls on for this user, is set when the app starts.
        await relaunchApp();
      },
    );
    await step('AND user is on a call with a participant', async () => {
      await userRobot.joinCall();
      await participantRobot.setCallDuration(buddyCallSeconds).joinCall(callId);
      await userRobot.waitForParticipantsOnCall(1);
    });
    await stayAwayAndCheck({
      mode: 'screen locked',
      userId,
      callId,
      backend: 'callingx',
    });
  });

  // Ringing call accepted in the app: callingx keeps it alive.
  it('testRingingCallStaysAliveWhileTheScreenIsLocked', async () => {
    const { userRobot, participantRobot } = testCase;
    const userId = newUserId();
    let callId = '';

    await step('GIVEN user is signed in', () =>
      userRobot.logout().login(userId),
    );
    await step('WHEN someone rings the user', async () => {
      callId = await ringUser(userId);
    });
    await step('AND user accepts the call', async () => {
      await userRobot.assertIncomingCall(true, seconds(30));
      await userRobot.acceptIncomingCall();
    });
    await step('AND a participant joins the call', async () => {
      await participantRobot.setCallDuration(buddyCallSeconds).joinCall(callId);
      await userRobot.waitForParticipantsOnCall(1);
    });
    await stayAwayAndCheck({
      mode: 'screen locked',
      userId,
      callId,
      backend: 'callingx',
    });
  });

  // The ring arrives while the app is in the background. The app handles it there (callingx shows
  // the incoming call) and must hand over from that to keeping the accepted call alive.
  // With `RING_BY_PUSH` on (local runs on a device with Google Play services), the ring arrives by
  // push; otherwise over the WebSocket, which stays connected for a while in the background.
  // The test opens the app and accepts there; the switching test and the killed-app test
  // (`e2e/push/`) answer from the notification instead.
  it('testRingingCallReceivedInTheBackgroundStaysAliveWhileTheScreenIsLocked', async () => {
    const { userRobot, participantRobot } = testCase;
    const userId = newUserId(
      RING_BY_PUSH ? E2E_RING_FROM_PUSH_USER_PREFIX : undefined,
    );
    let callId = '';

    await step(
      'GIVEN user is signed in and the app is in the background',
      async () => {
        await userRobot.logout().login(userId);
        await pressHome();
      },
    );
    await step('WHEN someone rings the user', async () => {
      callId = await ringUser(userId, { byPush: RING_BY_PUSH });
    });
    await step(
      'THEN callingx shows the incoming call while the app is in the background',
      () => waitForKeepAliveBackend('callingx', seconds(30)),
    );
    await step('WHEN user opens the app and accepts the call', async () => {
      await userRobot.openAppFromBackground();
      await userRobot.assertIncomingCall(true, seconds(30));
      await userRobot.acceptIncomingCall();
    });
    await step('AND a participant joins the call', async () => {
      await participantRobot.setCallDuration(buddyCallSeconds).joinCall(callId);
      await userRobot.waitForParticipantsOnCall(1);
    });
    await stayAwayAndCheck({
      mode: 'screen locked',
      userId,
      callId,
      backend: 'callingx',
    });
  });

  // User is on ringing call A, then answers ringing call B. B must stay alive in the background
  // too. While on A, the dogfood app keeps showing A, and callingx shows B as a call-waiting
  // notification, so the user answers B from there.
  it('testRingingCallStaysAliveAfterSwitchingToAnotherRingingCall', async () => {
    const { userRobot, participantRobot } = testCase;
    const userId = newUserId();
    let callA = '';
    let callB = '';

    await step('GIVEN user is signed in', () =>
      userRobot.logout().login(userId),
    );
    await step(
      'AND user accepts ringing call A, and a participant joins it',
      async () => {
        callA = await ringUser(userId);
        await userRobot.assertIncomingCall(true, seconds(30));
        await userRobot.acceptIncomingCall();
        await participantRobot
          .setCallDuration(2 * buddyCallSeconds)
          .joinCall(callA);
        await userRobot.waitForParticipantsOnCall(1);
      },
    );
    await stayAwayAndCheck({
      mode: 'screen locked',
      userId,
      callId: callA,
      backend: 'callingx',
    });

    await step(
      'WHEN someone rings the user with call B, and the user answers it from the notification',
      async () => {
        callB = await ringUser(userId);
        // The app keeps showing call A; call B rings as a call-waiting notification.
        await answerCallFromNotification();
        await waitForUserOnCall(callB, userId);
      },
    );
    await step('AND a participant joins call B', async () => {
      await participantRobot.setCallDuration(buddyCallSeconds).joinCall(callB);
      await userRobot.waitForParticipantsOnCall(1);
    });
    await stayAwayAndCheck({
      mode: 'screen locked',
      userId,
      callId: callB,
      backend: 'callingx',
    });
  });
});
