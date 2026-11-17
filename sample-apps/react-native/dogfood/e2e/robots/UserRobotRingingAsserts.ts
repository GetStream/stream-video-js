import { expect as jestExpect } from '@jest/globals';

import { UserRobot } from './UserRobot';

import { RingingPage } from '../pages/RingingPage';
import {
  defaultTimeout,
  isDisplayed,
  seconds,
  waitToAppear,
  waitToDisappear,
  waitUntil,
} from '../support/Element';
import {
  closeNotificationShade,
  isIncomingCallNotificationPosted,
} from '../support/NotificationShade';

declare module './UserRobot' {
  interface UserRobot {
    assertIncomingCall(isDisplayed: boolean, timeout?: number): this;
    assertIncomingCallNotification(isShown: boolean, timeout?: number): this;
    assertIncomingCallNotificationStaysShown(duration: number): this;
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

const isIncomingCallNotificationShown = async () =>
  isIncomingCallNotificationPosted();

/**
 * Waits until the app's incoming call notification (with its Answer and Decline buttons) is
 * posted, or is gone.
 */
UserRobot.prototype.assertIncomingCallNotification = function (
  shouldBeShown,
  timeout = defaultTimeout,
) {
  return this.perform(async () => {
    let shown = !shouldBeShown;
    await waitUntil(
      async () => {
        shown = await isIncomingCallNotificationShown();
        return shown === shouldBeShown;
      },
      timeout,
      seconds(1),
    );
    closeNotificationShade();
    jestExpect(shown).toBe(shouldBeShown);
  });
};

/**
 * Checks every second, for `duration`, that the incoming call notification is still showing.
 *
 * Seeing it once isn't enough: when the call can't be registered with Telecom, callingx posts the
 * notification, then takes it away a moment later.
 */
UserRobot.prototype.assertIncomingCallNotificationStaysShown = function (
  duration,
) {
  return this.perform(async () => {
    const start = Date.now();
    while (Date.now() - start < duration) {
      if (!(await isIncomingCallNotificationShown())) {
        closeNotificationShade();
        const after = Math.floor((Date.now() - start) / 1000);
        throw new Error(
          `The incoming call notification went away ${after}s after it showed`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, seconds(1)));
    }
    closeNotificationShade();
  });
};
