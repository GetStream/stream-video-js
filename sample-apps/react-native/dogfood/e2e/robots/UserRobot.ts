import { Robot } from './Robot';

import { CallDetailsPage } from '../pages/CallDetailsPage';
import { CallPage } from '../pages/CallPage';
import { LobbyPage } from '../pages/LobbyPage';
import { LoginPage } from '../pages/LoginPage';
import {
  exists,
  seconds,
  waitForText,
  waitToAppear,
  waitToAppearAndClick,
  waitUntil,
} from '../support/Element';

export enum UserControls {
  ENABLE = 'enable',
  DISABLE = 'disable',
}

const randomUserId = () => `e2e_${Math.random().toString(36).slice(2, 10)}`;

const signIn = async (userId: string) => {
  const inputField = await waitToAppear(LoginPage.userNameInputField);
  await inputField.replaceText(userId);
  await waitToAppearAndClick(LoginPage.loginButton);
  await waitToAppear(CallDetailsPage.callIdInputField, {
    timeout: seconds(30),
  });
};

/**
 * Taps the toggle until it shows `enable`. Retries rather than tapping once: the dogfood app loads
 * the call while the lobby is already open, and the call's settings can flip a toggle between
 * reading its state and tapping it.
 */
const setToggle = async (
  enable: boolean,
  enabledToggle: Detox.NativeMatcher,
  disabledToggle: Detox.NativeMatcher,
) => {
  const settled = await waitUntil(
    async () => {
      const isEnabled = await exists(enabledToggle);
      if (isEnabled === enable) {
        return true;
      }
      await element(isEnabled ? enabledToggle : disabledToggle)
        .tap()
        .catch(() => {
          // Gone or not hittable yet: the next poll reads the state again.
        });
      return false;
    },
    seconds(20),
    seconds(1),
  );
  if (!settled) {
    throw new Error(`The toggle did not turn ${enable ? 'on' : 'off'}`);
  }
};

/** Drives the app as the signed-in user; the asserts live in the `UserRobot*Asserts` extensions. */
export class UserRobot extends Robot {
  /** The test's call, used when `joinCall`/`enterLobby` get no call id. Set by `StreamTestCase`. */
  callId?: string;

  pressBack(): this {
    return this.perform(() => device.pressBack());
  }

  login(userId: string): this {
    return this.perform(() => signIn(userId));
  }

  loginAsRandomUser(): this {
    return this.login(randomUserId());
  }

  /**
   * The app keeps the signed-in user across launches, so only a fresh install shows the login
   * screen. Signs in as a random user there, like the native demo app does on every launch.
   */
  loginIfNeeded(): this {
    return this.perform(async () => {
      let loginScreen = false;
      const settled = await waitUntil(async () => {
        loginScreen = await exists(LoginPage.userNameInputField);
        return loginScreen || (await exists(CallDetailsPage.callIdInputField));
      }, seconds(30));
      if (!settled) {
        throw new Error('The app showed neither the login nor the call screen');
      }
      if (loginScreen) {
        await signIn(randomUserId());
      }
    });
  }

  logout(): this {
    return this.perform(async () => {
      await waitToAppearAndClick(CallDetailsPage.logOutButton, {
        timeout: seconds(20),
      });
      await waitToAppearAndClick(CallDetailsPage.logOutConfirmButton);
      await waitToAppear(LoginPage.userNameInputField);
    });
  }

  joinCall(
    callId?: string,
    {
      camera,
      microphone,
    }: { camera?: UserControls; microphone?: UserControls } = {},
  ): this {
    this.enterLobby(callId);
    if (camera !== undefined) {
      this.camera(camera, true);
    }
    if (microphone !== undefined) {
      this.microphone(microphone, true);
    }
    return this.joinCallFromLobby();
  }

  enterLobby(callId = this.callId): this {
    return this.perform(async () => {
      if (callId === undefined) {
        await waitToAppearAndClick(CallDetailsPage.startNewCallButton);
        return;
      }
      const inputField = await waitToAppear(CallDetailsPage.callIdInputField);
      await inputField.replaceText(callId);
      await waitToAppearAndClick(CallDetailsPage.joinCallButton);
    }).waitForLobbyToOpen();
  }

  joinCallFromLobby(): this {
    return this.perform(() =>
      waitToAppearAndClick(LobbyPage.joinCallButton),
    ).waitForCallToStart();
  }

  private waitForLobbyToOpen(): this {
    return this.perform(() =>
      waitToAppear(LobbyPage.joinCallButton, { timeout: seconds(30) }),
    );
  }

  /** @param hard toggles back and forth, so the server state is in sync with the UI. */
  camera(action: UserControls, hard = false): this {
    return this.toggle(
      action,
      hard,
      CallPage.cameraEnabledToggle,
      CallPage.cameraDisabledToggle,
    );
  }

  /** @param hard toggles back and forth, so the server state is in sync with the UI. */
  microphone(action: UserControls, hard = false): this {
    return this.toggle(
      action,
      hard,
      CallPage.microphoneEnabledToggle,
      CallPage.microphoneDisabledToggle,
    );
  }

  endCall(): this {
    return this.perform(() => waitToAppearAndClick(CallPage.hangUpButton));
  }

  waitForParticipantsOnCall(count = 1, timeout = seconds(100)): this {
    const user = 1;
    const expected = String(user + count);
    return this.perform(async () => {
      const actual = await waitForText(
        CallPage.participantsCountBadge,
        expected,
        { timeout },
      );
      if (actual !== expected) {
        throw new Error(
          `Expected ${expected} people on the call, the badge shows "${actual}"`,
        );
      }
    });
  }

  // The first join of a launch also builds the call's media engine, which takes a while on a
  // software-rendered CI emulator.
  private waitForCallToStart(): this {
    return this.perform(() =>
      waitToAppear(CallPage.hangUpButton, { timeout: seconds(60) }),
    );
  }

  private toggle(
    action: UserControls,
    hard: boolean,
    enabledToggle: Detox.NativeMatcher,
    disabledToggle: Detox.NativeMatcher,
  ): this {
    return this.perform(async () => {
      // Lobby and call toggles both render after their screen opens.
      await waitToAppear(
        by.id(/^stream-(camera|microphone)-toggle-(enabled|disabled)$/),
        { index: 0 },
      );
      const enable = action === UserControls.ENABLE;
      if (hard) {
        await setToggle(
          !(await exists(enabledToggle)),
          enabledToggle,
          disabledToggle,
        );
      }
      await setToggle(enable, enabledToggle, disabledToggle);
    });
  }
}
