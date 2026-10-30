import { expect as jestExpect } from '@jest/globals';

import { UserRobot } from './UserRobot';

import { LobbyPage } from '../pages/LobbyPage';
import {
  isDisplayed,
  waitForExistence,
  waitToAppear,
} from '../support/Element';

declare module './UserRobot' {
  interface UserRobot {
    assertLobby(state: { microphone: boolean; camera: boolean }): this;
    assertParticipantsCountInLobby(count: number): this;
  }
}

/** Android: `robots/UserRobotLobbyAsserts.kt`. */

UserRobot.prototype.assertLobby = function ({ microphone, camera }) {
  return this.perform(async () => {
    await waitToAppear(LobbyPage.closeButton);
    jestExpect(await isDisplayed(LobbyPage.joinCallButton)).toBe(true);

    const microphoneToggle = microphone
      ? LobbyPage.microphoneEnabledToggle
      : LobbyPage.microphoneDisabledToggle;
    const microphoneIcon = microphone
      ? LobbyPage.microphoneEnabledIcon
      : LobbyPage.microphoneDisabledIcon;
    await waitToAppear(microphoneToggle);
    jestExpect(await isDisplayed(microphoneToggle)).toBe(true);
    jestExpect(await waitForExistence(microphoneIcon)).toBe(true);

    const cameraToggle = camera
      ? LobbyPage.cameraEnabledToggle
      : LobbyPage.cameraDisabledToggle;
    // The preview is a native camera view, empty until frames arrive: assert presence, not pixels.
    const cameraView = camera
      ? LobbyPage.cameraEnabledView
      : LobbyPage.cameraDisabledView;
    await waitToAppear(cameraToggle);
    jestExpect(await isDisplayed(cameraToggle)).toBe(true);
    jestExpect(await waitForExistence(cameraView)).toBe(true);
  });
};

UserRobot.prototype.assertParticipantsCountInLobby = function (count) {
  return this.perform(async () => {
    await waitToAppear(LobbyPage.callParticipantsCount(count));
    jestExpect(await isDisplayed(LobbyPage.callParticipantsCount(count))).toBe(
      true,
    );
  });
};
