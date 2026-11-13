import { expect as jestExpect } from '@jest/globals';

import { UserRobot } from './UserRobot';

import { RingingPage } from '../pages/RingingPage';
import {
  defaultTimeout,
  isDisplayed,
  waitToAppear,
  waitToDisappear,
} from '../support/Element';

declare module './UserRobot' {
  interface UserRobot {
    assertIncomingCall(isDisplayed: boolean, timeout?: number): this;
  }
}

UserRobot.prototype.assertIncomingCall = function (
  shouldBeDisplayed,
  timeout = defaultTimeout,
) {
  return this.perform(async () => {
    if (shouldBeDisplayed) {
      await waitToAppear(RingingPage.incomingCallTitle, { timeout });
    } else {
      await waitToDisappear(RingingPage.incomingCallTitle, { timeout });
    }
    jestExpect(await isDisplayed(RingingPage.incomingCallTitle)).toBe(
      shouldBeDisplayed,
    );
  });
};
