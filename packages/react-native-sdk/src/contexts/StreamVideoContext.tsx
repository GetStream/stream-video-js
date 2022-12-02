import createStoreContext from './createStoreContext';
import { MediaStream } from 'react-native-webrtc';
import {
  StreamVideo as StreamVideoProvider,
  StreamVideoProps,
} from '@stream-io/video-react-bindings';
import React, { PropsWithChildren } from 'react';

export interface SDKStreamVideoStore {
  cameraBackFacingMode: boolean;
  localMediaStream: MediaStream | undefined;
}

export const {
  Provider,
  useStoreValue: useStreamVideoStoreValue,
  useStoreSetState: useStreamVideoStoreSetState,
} = createStoreContext<SDKStreamVideoStore>({
  cameraBackFacingMode: false,
  localMediaStream: undefined,
});

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
