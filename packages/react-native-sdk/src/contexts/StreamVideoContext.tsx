import createStoreContext from './createStoreContext';
import {
  StreamVideo as StreamVideoProvider,
  StreamVideoProps,
} from '@stream-io/video-react-bindings';
import React, { PropsWithChildren } from 'react';
import { CallKeepOptions } from '../types';
import { MediaDevicesProvider } from './MediaDevicesContext';

interface SDKStreamVideoStore {
  cameraBackFacingMode: boolean;
  isVideoMuted: boolean;
  callKeepOptions: CallKeepOptions | undefined;
}

const { Provider, useStoreValue, useStoreSetState } =
  createStoreContext<SDKStreamVideoStore>({
    cameraBackFacingMode: false,
    isVideoMuted: false,
    callKeepOptions: undefined,
  });

export const useStreamVideoStoreValue = useStoreValue;
export const useStreamVideoStoreSetState = useStoreSetState;

export const StreamVideo: React.FC<
  StreamVideoProps & {
    callKeepOptions: CallKeepOptions;
  }
> = (
  props: PropsWithChildren<StreamVideoProps> & {
    callKeepOptions: CallKeepOptions;
  },
) => {
  const { client, ...rest } = props;
  return (
    <StreamVideoProvider client={client}>
      <MediaDevicesProvider>
        <Provider {...rest} />
      </MediaDevicesProvider>
    </StreamVideoProvider>
  );
};
