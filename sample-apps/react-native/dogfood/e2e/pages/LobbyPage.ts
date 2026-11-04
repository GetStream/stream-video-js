/**
 * The SDK's `Lobby` in the dogfood app's `src/components/LobbyViewComponent.tsx`. The toggles and
 * status icons are the SDK's testIDs (`packages/react-native-sdk/src/constants/TestIds.ts`); the
 * participant count belongs to the app (`src/constants/TestIds.ts`). No ancestor scoping: Fabric
 * flattens the SDK's container views, and only one status label is on screen in the lobby anyway.
 */
export const LobbyPage = {
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
    return by.id(`lobby-participants-count-${count}`);
  },
};
