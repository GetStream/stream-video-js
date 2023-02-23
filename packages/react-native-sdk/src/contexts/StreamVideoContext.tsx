import createStoreContext from './createStoreContext';

export interface SDKStreamVideoStore {
  isCameraOnFrontFacingMode: boolean;
  isVideoMuted: boolean;
  isAudioMuted: boolean;
}

export const { Provider, useStoreValue, useStoreSetState } =
  createStoreContext<SDKStreamVideoStore>({
    isCameraOnFrontFacingMode: true,
    isVideoMuted: false,
    isAudioMuted: false,
  });
