import createStoreContext from './createStoreContext';

/**
 * Exclude types from documentaiton site, but we should still add doc comments
 * @internal
 */
export interface SDKStreamVideoStore {
  isCameraOnFrontFacingMode: boolean;
  isVideoMuted: boolean;
  isAudioMuted: boolean;
}

export const {
  Provider: StoreProvider,
  useStoreValue: useStreamVideoStoreValue,
  useStoreSetState: useStreamVideoStoreSetState,
} = createStoreContext<SDKStreamVideoStore>({
  isCameraOnFrontFacingMode: false,
  isVideoMuted: false,
  isAudioMuted: false,
});
