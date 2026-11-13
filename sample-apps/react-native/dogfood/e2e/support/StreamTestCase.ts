import { beforeEach, expect as jestExpect } from '@jest/globals';

import { dismissAnrDialog } from './AndroidSystemDialogs';

import { ParticipantRobot, UserRobot } from '../robots';

/** Prefixed, so the suite's calls are easy to tell apart on the dashboard. */
export const generateCallId = () =>
  `e2e-${Math.floor(Math.random() * 0x100000000)
    .toString(16)
    .padStart(8, '0')}`;

/**
 * Per-test fixture: before each test it picks a new call id for `userRobot` to join, points a
 * fresh `ParticipantRobot` (stream-video-buddy) at the test, relaunches the app and signs in if the
 * app shows the login screen.
 *
 *   describe('LobbyTests', () => {
 *     const testCase = setUpStreamTestCase();
 *     it('testLobbyWithTwoParticipants', async () => {
 *       const { userRobot, participantRobot, callId } = testCase;
 *       ...
 *     });
 *   });
 *
 * `participantRobot` and `callId` change per test, so read them inside the test, not in `describe`.
 */
export class StreamTestCase {
  readonly userRobot = new UserRobot();
  participantRobot!: ParticipantRobot;
  callId!: string;
}

/** `describe` + `it` names `LobbyTests testX` → `testX`, which names the buddy's logs. */
const currentTestName = () =>
  (jestExpect.getState().currentTestName ?? 'unknown')
    .split(' ')
    .pop()!
    .replace(/[^\w-]/g, '_');

/** Kills the app and starts it again. The app keeps the signed-in user. */
export const relaunchApp = async () => {
  await device.launchApp({
    newInstance: true,
    launchArgs: {
      // A call never goes idle (the duration timer, speech indicator animations, WebRTC), so
      // Detox's synchronization would wait forever. Every robot action and assert waits
      // explicitly instead.
      detoxEnableSynchronization: 0,
    },
  });
  await device.disableSynchronization();
};

export const setUpStreamTestCase = (): StreamTestCase => {
  const testCase = new StreamTestCase();

  beforeEach(async () => {
    testCase.participantRobot = new ParticipantRobot(currentTestName());
    testCase.callId = generateCallId();
    testCase.userRobot.callId = testCase.callId;
    dismissAnrDialog();
    await relaunchApp();
    await testCase.userRobot.loginIfNeeded();
  });

  return testCase;
};
