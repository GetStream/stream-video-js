/**
 * The SDK's `Lobby` in the dogfood app's `src/components/LobbyViewComponent.tsx`. The toggles and
 * status icons are the SDK's testIDs (`packages/react-native-sdk/src/constants/TestIds.ts`); the
 * participant count belongs to the app (`src/constants/TestIds.ts`). No ancestor scoping: Fabric
 * flattens the SDK's container views, and only one status label is on screen in the lobby anyway.
 */
export const LobbyPage = {
  get joinCallButton() {
    return by.id('stream-join-call-button');
  },
  get cameraEnabledToggle() {
    return by.id('stream-camera-toggle-enabled');
  },
  get cameraDisabledToggle() {
    return by.id('stream-camera-toggle-disabled');
  },
  get microphoneEnabledToggle() {
    return by.id('stream-microphone-toggle-enabled');
  },
  get microphoneDisabledToggle() {
    return by.id('stream-microphone-toggle-disabled');
  },
  get microphoneEnabledIcon() {
    return by.id('stream-speech-indicator');
  },
  get microphoneDisabledIcon() {
    return by.id('stream-muted-microphone-icon');
  },
  get cameraEnabledView() {
    return by.id('stream-lobby-camera-preview');
  },
  get cameraDisabledView() {
    return by.id('stream-participant-avatar');
  },
  callParticipantsCount(count: number) {
    return by.id(`lobby-participants-count-${count}`);
  },
};
