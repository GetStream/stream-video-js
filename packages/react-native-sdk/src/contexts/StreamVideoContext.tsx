import createStoreContext from './createStoreContext';
import {
  StreamVideo as StreamVideoProvider,
  StreamVideoProps,
} from '@stream-io/video-react-bindings';
import React, { PropsWithChildren } from 'react';
import { CallKeepOptions } from '../types';
import { StreamCall } from './StreamCall';
import { MediaDevicesProvider } from './MediaDevicesContext';

interface SDKStreamVideoStore {
  cameraBackFacingMode: boolean;
  isVideoMuted: boolean;
  leaveOnLeftAlone: boolean;
  callKeepOptions: CallKeepOptions | undefined;
}

const { Provider, useStoreValue, useStoreSetState } =
  createStoreContext<SDKStreamVideoStore>({
    cameraBackFacingMode: false,
    isVideoMuted: false,
    leaveOnLeftAlone: false, // true on ringing, false on meeting
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
  // FIXME: callKeepOptions is not used
  const { client, children } = props;
  return (
    <StreamVideoProvider client={client}>
      <StreamCall />
      <MediaDevicesProvider>
        <Provider>
          <StreamCall />
          {children}
        </Provider>
      </MediaDevicesProvider>
    </StreamVideoProvider>
  );
};
