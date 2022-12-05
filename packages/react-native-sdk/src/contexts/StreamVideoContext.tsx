import createStoreContext from './createStoreContext';
import { MediaStream } from 'react-native-webrtc';
import {
  StreamVideo as StreamVideoProvider,
  StreamVideoProps,
} from '@stream-io/video-react-bindings';
import React, { PropsWithChildren } from 'react';

export interface SDKStreamVideoStore {
  cameraBackFacingMode: boolean;
  isVideoMuted: boolean;
  localMediaStream: MediaStream | undefined;
}

const { Provider, useStoreValue, useStoreSetState } =
  createStoreContext<SDKStreamVideoStore>({
    cameraBackFacingMode: false,
    isVideoMuted: false,
    localMediaStream: undefined,
  });

export const useStreamVideoStoreValue = useStoreValue;
export const useStreamVideoStoreSetState = useStoreSetState;

export const StreamVideo: React.FC<StreamVideoProps> = (
  props: PropsWithChildren<StreamVideoProps>,
) => {
  const { client, ...rest } = props;
  return (
    <StreamVideoProvider client={client}>
      <Provider {...rest} />
    </StreamVideoProvider>
  );
};
