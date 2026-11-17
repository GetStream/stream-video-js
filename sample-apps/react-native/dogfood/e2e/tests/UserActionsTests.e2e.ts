import { describe, it } from '@jest/globals';

import { UserControls } from '../robots';
import { allureId, step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

const { DISABLE, ENABLE } = UserControls;

describe('UserActionsTests', () => {
  const testCase = setUpStreamTestCase();

  it('testUserMicrophone', async () => {
    allureId(12969);
    const { userRobot, participantRobot, callId } = testCase;

    await step('GIVEN user starts a call', () =>
      userRobot.joinCall().microphone(DISABLE, true),
    );
    await step('AND participant joins the call', async () => {
      await participantRobot.joinCall(callId);
      await userRobot.waitForParticipantsOnCall();
    });
    await step('WHEN user enables microphone', () =>
      userRobot.microphone(ENABLE),
    );
    await step("THEN user observes that user's microphone is enabled", () =>
      userRobot.assertUserMicrophone(true),
    );
    await step('WHEN user disables microphone', () =>
      userRobot.microphone(DISABLE),
    );
    await step("THEN user observes that user's microphone is disabled", () =>
      userRobot.assertUserMicrophone(false),
    );
  });
});
