import createStoreContext from './createStoreContext';

export interface SDKStreamVideoStore {
  cameraBackFacingMode: boolean;
  isVideoMuted: boolean;
  isAudioMuted: boolean;
}

export const {
  Provider,
  useStoreValue: useStreamVideoStoreValue,
  useStoreSetState: useStreamVideoStoreSetState,
} = createStoreContext<SDKStreamVideoStore>({
  cameraBackFacingMode: false,
  isVideoMuted: false,
  isAudioMuted: false,
});
