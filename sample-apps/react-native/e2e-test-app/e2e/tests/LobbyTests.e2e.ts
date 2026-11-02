import { describe, it } from '@jest/globals';

import { UserControls } from '../robots';
import { allureId, step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

describe('LobbyTests', () => {
  const testCase = setUpStreamTestCase();

  it('testLobbyWithTwoParticipants', async () => {
    allureId(12968);
    const { userRobot, participantRobot, callId } = testCase;
    const participants = 2;

    await step(`GIVEN ${participants} participants are on call`, async () => {
      await userRobot.joinCall();
      await participantRobot.setUserCount(participants).joinCall(callId);
      await userRobot.waitForParticipantsOnCall(participants).endCall();
    });
    await step('WHEN user enters lobby', () =>
      userRobot
        .enterLobby(callId)
        .camera(UserControls.ENABLE, true)
        .microphone(UserControls.ENABLE, true),
    );
    await step('THEN all required elements are on the screen', () =>
      userRobot.assertLobby({ microphone: true, camera: true }),
    );
    await step('AND user observes the number of participants on call', () =>
      userRobot.assertParticipantsCountInLobby(participants),
    );
    await step('WHEN user joins the call', () => userRobot.joinCallFromLobby());
    await step(`THEN there are ${participants} participants on the call`, () =>
      userRobot.assertParticipantsCountOnCall(participants),
    );
  });
});
