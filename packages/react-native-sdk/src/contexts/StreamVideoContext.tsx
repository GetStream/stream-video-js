import createStoreContext from './createStoreContext';

export interface SDKStreamVideoStore {
  cameraBackFacingMode: boolean;
  isVideoMuted: boolean;
}

export const { Provider, useStoreValue, useStoreSetState } =
  createStoreContext<SDKStreamVideoStore>({
    cameraBackFacingMode: false,
    isVideoMuted: false,
  });
