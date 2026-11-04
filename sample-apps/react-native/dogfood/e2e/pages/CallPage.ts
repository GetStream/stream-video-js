import { LobbyPage } from './LobbyPage';

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
    return by.id('stream-hang-up-call');
  },
  get participantsCountBadge() {
    return by.id('participants-count-badge');
  },
  get cornerDraggableView() {
    return by.id('stream-local-participant');
  },

  ParticipantView: {
    get videoView() {
      return by.id(/^stream-participant-.+-is-(not-)?speaking$/);
    },
    get microphoneEnabledIcon() {
      return by.id('stream-speech-indicator');
    },
    get microphoneDisabledIcon() {
      return by.id('stream-muted-microphone-icon');
    },
  },
};
