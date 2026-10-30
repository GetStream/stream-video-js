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
} from '../support/Element';

export enum UserControls {
  ENABLE = 'enable',
  DISABLE = 'disable',
}

/**
 * Android: `robots/UserRobot.kt`. Drives the app as the signed-in user; the asserts live in the
 * `UserRobot*Asserts` extensions. Only the actions the e2e app has UI for are ported so far (no
 * settings menu, layouts, ringing, recording or screen sharing yet).
 */
export class UserRobot extends Robot {
  // Common actions

  pressBack(): this {
    return this.perform(() => device.pressBack());
  }

  // LoginPage actions

  loginWithEmail(email: string): this {
    return this.perform(async () => {
      await waitToAppearAndClick(LoginPage.emailSignIn);
      const inputField = await waitToAppear(LoginPage.emailInputField);
      await inputField.replaceText(email);
      await waitToAppearAndClick(LoginPage.loginButton);
    });
  }

  loginAsRandomUser(): this {
    return this.perform(() =>
      waitToAppearAndClick(LoginPage.randomUserSignInButton),
    );
  }

  // CallDetailsPage actions

  logout(): this {
    return this.perform(async () => {
      await waitToAppearAndClick(CallDetailsPage.wheelIcon, {
        timeout: seconds(20),
      });
      await waitToAppearAndClick(CallDetailsPage.signOutButton);
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

  enterLobby(callId?: string): this {
    return this.perform(async () => {
      if (callId !== undefined) {
        const inputField = await waitToAppear(CallDetailsPage.callIdInputField);
        await inputField.replaceText(callId);
      }
      await waitToAppearAndClick(CallDetailsPage.joinCallButton);
    }).waitForLobbyToOpen();
  }

  // LobbyPage actions

  joinCallFromLobby(): this {
    return this.perform(() =>
      waitToAppearAndClick(LobbyPage.joinCallButton),
    ).waitForCallToStart();
  }

  private waitForLobbyToOpen(): this {
    return this.perform(() => waitToAppear(LobbyPage.closeButton));
  }

  // CallPage actions

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
    return this.perform(() =>
      waitForText(CallPage.participantsCountBadge, String(user + count), {
        timeout,
      }),
    );
  }

  // Android uses 15s. The first join of a launch also builds the call's media engine, which takes
  // longer than that on a software-rendered CI emulator.
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
        by.id(/^(camera|microphone)-toggle-(enabled|disabled)$/),
        { index: 0 },
      );
      const isEnabled = await exists(enabledToggle);
      const enable = action === UserControls.ENABLE;
      if (hard) {
        if (isEnabled) {
          await waitToAppearAndClick(enabledToggle);
          if (enable) await waitToAppearAndClick(disabledToggle);
        } else {
          await waitToAppearAndClick(disabledToggle);
          if (!enable) await waitToAppearAndClick(enabledToggle);
        }
      } else if (enable && !isEnabled) {
        await waitToAppearAndClick(disabledToggle);
      } else if (!enable && isEnabled) {
        await waitToAppearAndClick(enabledToggle);
      }
    });
  }
}
