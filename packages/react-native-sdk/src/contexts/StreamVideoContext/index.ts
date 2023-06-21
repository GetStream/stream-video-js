import createStoreContext from './createStoreContext';

export type MediaDeviceInfo = {
  deviceId: string;
  facing?: 'environment' | 'front';
  groupId: string;
  kind: 'videoinput' | 'audioinput';
  label: string;
};

/**
 * Exclude types from documentation site, but we should still add doc comments
 * @internal
 */
export interface SDKStreamVideoStore {
  isCameraOnFrontFacingMode: boolean;
  isVideoMuted: boolean;
  isAudioMuted: boolean;
  currentAudioDevice?: MediaDeviceInfo;
  currentVideoDevice?: MediaDeviceInfo;
  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
}

export const {
  Provider: StreamVideoStoreProvider,
  useStoreValue: useStreamVideoStoreValue,
  useStoreSetState: useStreamVideoStoreSetState,
} = createStoreContext<SDKStreamVideoStore>({
  isCameraOnFrontFacingMode: true,
  isVideoMuted: false,
  isAudioMuted: false,
  videoDevices: [],
  audioDevices: [],
  currentVideoDevice: undefined,
  currentAudioDevice: undefined,
});
