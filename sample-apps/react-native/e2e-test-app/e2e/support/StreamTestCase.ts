import { beforeAll, beforeEach, expect as jestExpect } from '@jest/globals';

import { dismissAnrDialog } from './AndroidSystemDialogs';
import { grantAppPermissions } from './Permissions';

import { ParticipantRobot, UserRobot } from '../robots';

/**
 * Android: `UUID.randomUUID().toString().split("-").first()`, prefixed: launch arguments reach JS
 * through a parser that turns an all-digit or `5e123456`-like hex id into a number.
 */
export const generateCallId = () =>
  `e2e-${Math.floor(Math.random() * 0x100000000)
    .toString(16)
    .padStart(8, '0')}`;

/**
 * Per-test fixture, the counterpart of the Android `StreamTestCase`: before each test it picks a new
 * call id, points a fresh `ParticipantRobot` (stream-video-buddy) at the test, and relaunches the
 * app with that call id prefilled.
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

export const setUpStreamTestCase = (): StreamTestCase => {
  const testCase = new StreamTestCase();

  beforeAll(() => {
    grantAppPermissions();
  });

  beforeEach(async () => {
    testCase.participantRobot = new ParticipantRobot(currentTestName());
    testCase.callId = generateCallId();
    if (device.getPlatform() === 'android') {
      dismissAnrDialog();
    }
    await device.launchApp({
      newInstance: true,
      launchArgs: {
        CALL_ID: testCase.callId,
        ...(process.env.E2E_LOG_LEVEL && {
          LOG_LEVEL: process.env.E2E_LOG_LEVEL,
        }),
        // A call never goes idle (the duration timer, speech indicator animations, WebRTC), so
        // Detox's synchronization would wait forever. Every robot action and assert waits
        // explicitly instead, like the native suites.
        detoxEnableSynchronization: 0,
      },
    });
    await device.disableSynchronization();
  });

  return testCase;
};
