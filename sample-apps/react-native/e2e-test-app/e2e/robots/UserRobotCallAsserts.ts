import { expect as jestExpect } from '@jest/globals';

import { UserRobot } from './UserRobot';

import { CallPage } from '../pages/CallPage';
import {
  defaultTimeout,
  isDisplayed,
  waitForExistence,
  waitForText,
  waitToAppear,
  waitToDisappear,
} from '../support/Element';

declare module './UserRobot' {
  interface UserRobot {
    assertVideoCallControls(state: {
      microphone: boolean;
      camera: boolean;
    }): this;
    assertThatCallIsEnded(): this;
    /**
     * Checks the toggle. Android also checks the icon in the participant view; the RN SDK shows the
     * user in the floating view while one or two others are on the call, and that view has no label
     * (`FloatingParticipantView` passes `ParticipantLabel: null`), so there is no icon to check.
     */
    assertUserMicrophone(isEnabled: boolean): this;
    assertUserCamera(isEnabled: boolean): this;
    assertParticipantsCountOnCall(count: number, timeout?: number): this;
    assertParticipantMicrophone(isEnabled: boolean): this;
  }
}

/** Android: `robots/UserRobotCallAsserts.kt`. */

UserRobot.prototype.assertVideoCallControls = function ({
  microphone,
  camera,
}) {
  return this.perform(async () => {
    await waitToAppear(CallPage.hangUpButton);
    jestExpect(await isDisplayed(CallPage.hangUpButton)).toBe(true);
  })
    .assertUserMicrophone(microphone)
    .assertUserCamera(camera);
};

UserRobot.prototype.assertThatCallIsEnded = function () {
  return this.perform(async () => {
    await waitToDisappear(CallPage.hangUpButton);
    jestExpect(await isDisplayed(CallPage.hangUpButton)).toBe(false);
  });
};

UserRobot.prototype.assertUserMicrophone = function (isEnabled) {
  return this.perform(async () => {
    const toggle = isEnabled
      ? CallPage.microphoneEnabledToggle
      : CallPage.microphoneDisabledToggle;
    await waitToAppear(toggle);
    jestExpect(await isDisplayed(toggle)).toBe(true);
  });
};

UserRobot.prototype.assertUserCamera = function (isEnabled) {
  return this.perform(async () => {
    const toggle = isEnabled
      ? CallPage.cameraEnabledToggle
      : CallPage.cameraDisabledToggle;
    await waitToAppear(toggle);
    jestExpect(await isDisplayed(toggle)).toBe(true);
  });
};

UserRobot.prototype.assertParticipantsCountOnCall = function (
  count,
  timeout = defaultTimeout,
) {
  return this.perform(async () => {
    const user = 1;
    const participants = String(user + count);
    await waitToAppear(CallPage.participantsCountBadge);
    const actualCount = await waitForText(
      CallPage.participantsCountBadge,
      participants,
      {
        timeout,
      },
    );
    jestExpect(actualCount).toBe(participants);
  });
};

UserRobot.prototype.assertParticipantMicrophone = function (isEnabled) {
  return this.perform(async () => {
    const icon = isEnabled
      ? CallPage.ParticipantView.microphoneEnabledIcon
      : CallPage.ParticipantView.microphoneDisabledIcon;
    jestExpect(await waitForExistence(icon, { index: 0 })).toBe(true);
  });
};
