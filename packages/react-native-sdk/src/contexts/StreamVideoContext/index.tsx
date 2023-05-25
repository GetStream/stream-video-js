import { PropsWithChildren } from 'react';
import createStoreContext from './createStoreContext';
import { MediaDevicesContextAPI } from './types';
import { MediaDevices } from './MediaDevices';

/**
 * Exclude types from documentaiton site, but we should still add doc comments
 * @internal
 */
export interface SDKStreamVideoStore extends MediaDevicesContextAPI {
  isCameraOnFrontFacingMode: boolean;
  isVideoMuted: boolean;
  isAudioMuted: boolean;
}

const { Provider, useStoreValue, useStoreSetState } =
  createStoreContext<SDKStreamVideoStore>({
    isCameraOnFrontFacingMode: false,
    isVideoMuted: false,
    isAudioMuted: false,
    videoDevices: [],
    audioDevices: [],
    currentVideoDevice: undefined,
    currentAudioDevice: undefined,
  });

export const StreamVideoStoreProvider = (props: PropsWithChildren<{}>) => {
  return (
    <Provider>
      <MediaDevices />
      {props.children}
    </Provider>
  );
};

export const useStreamVideoStoreValue = useStoreValue;
export const useStreamVideoStoreSetState = useStoreSetState;
