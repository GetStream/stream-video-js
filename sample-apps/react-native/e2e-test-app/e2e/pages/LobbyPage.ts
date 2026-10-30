/**
 * Android: `pages/LobbyPage.kt`. The toggles and status icons are the SDK's testIDs
 * (`packages/react-native-sdk/src/constants/TestIds.ts`); the rest belong to the app's lobby screen.
 * No ancestor scoping: Fabric flattens the SDK's container views, and only one status label is on
 * screen in the lobby anyway.
 */
export const LobbyPage = {
  get closeButton() {
    return by.id('lobby-close-button');
  },
  get joinCallButton() {
    return by.id('join-call-button');
  },
  get cameraEnabledToggle() {
    return by.id('camera-toggle-enabled');
  },
  get cameraDisabledToggle() {
    return by.id('camera-toggle-disabled');
  },
  get microphoneEnabledToggle() {
    return by.id('microphone-toggle-enabled');
  },
  get microphoneDisabledToggle() {
    return by.id('microphone-toggle-disabled');
  },
  get microphoneEnabledIcon() {
    return by.id('speech-indicator');
  },
  get microphoneDisabledIcon() {
    return by.id('muted-microphone-icon');
  },
  get cameraEnabledView() {
    return by.id('lobby-camera-preview');
  },
  get cameraDisabledView() {
    return by.id('participant-avatar');
  },
  callParticipantsCount(count: number) {
    return by.id(`participants-count-${count}`);
  },
};
