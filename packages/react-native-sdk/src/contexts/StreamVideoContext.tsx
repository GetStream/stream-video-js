import createStoreContext from './createStoreContext';

export interface SDKStreamVideoStore {
  isCameraOnFrontFacingMode: boolean;
  isVideoMuted: boolean;
  isAudioMuted: boolean;
}

export const {
  Provider,
  useStoreValue: useStreamVideoStoreValue,
  useStoreSetState: useStreamVideoStoreSetState,
} = createStoreContext<SDKStreamVideoStore>({
  isCameraOnFrontFacingMode: false,
  isVideoMuted: false,
  isAudioMuted: false,
});
