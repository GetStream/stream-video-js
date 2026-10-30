import { describe, it } from '@jest/globals';

import { step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

/** Android: `tests/CallLifecycleTests.kt`. */
describe('CallLifecycleTests', () => {
  const testCase = setUpStreamTestCase();

  // AllureId 6942
  it('testUserLeavesTheCallAfterConnection', async () => {
    const { userRobot, participantRobot, callId } = testCase;

    await step('GIVEN user starts a call', () => userRobot.joinCall());
    await step('WHEN participant joins the call', async () => {
      await participantRobot.joinCall(callId);
      await userRobot.waitForParticipantsOnCall(1);
    });
    await step('AND user leaves the call', () => userRobot.endCall());
    await step('THEN call is ended for the user', () =>
      userRobot.assertThatCallIsEnded(),
    );
  });
});
