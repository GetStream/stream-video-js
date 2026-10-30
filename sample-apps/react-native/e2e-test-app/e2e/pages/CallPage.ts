import { LobbyPage } from './LobbyPage';

/**
 * Android: `pages/CallPage.kt`. Only the selectors the ported tests need so far; the Android page
 * also covers settings, layouts, recording, screen sharing and the participants menu, which the
 * e2e app does not render yet.
 */
// No ancestor scoping: Fabric flattens the SDK's container views (the participant view, the
// floating local one), so `withAncestor` doesn't match them on iOS.
export const CallPage = {
  get cameraEnabledToggle() {
    return LobbyPage.cameraEnabledToggle;
  },
  get cameraDisabledToggle() {
    return LobbyPage.cameraDisabledToggle;
  },
  get microphoneEnabledToggle() {
    return LobbyPage.microphoneEnabledToggle;
  },
  get microphoneDisabledToggle() {
    return LobbyPage.microphoneDisabledToggle;
  },
  get hangUpButton() {
    return by.id('hang-up-call');
  },
  get participantsCountBadge() {
    return by.id('participants-count-badge');
  },
  get cornerDraggableView() {
    return by.id('local-participant');
  },

  ParticipantView: {
    get videoView() {
      return by.id(/^participant-.+-is-(not-)?speaking$/);
    },
    get microphoneEnabledIcon() {
      return by.id('speech-indicator');
    },
    get microphoneDisabledIcon() {
      return by.id('muted-microphone-icon');
    },
  },
};
