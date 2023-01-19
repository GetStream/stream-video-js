import {
  StreamVideo as StreamVideoProvider,
  StreamVideoProps,
} from '@stream-io/video-react-bindings';
import React, { PropsWithChildren } from 'react';
import {
  useStoreValue,
  useStoreSetState,
  Provider,
} from './StreamVideoContext';
import { MediaDevicesProvider } from './MediaDevicesContext';

export const StreamVideo = (props: PropsWithChildren<StreamVideoProps>) => {
  const { client, children } = props;
  return (
    <StreamVideoProvider client={client}>
      <MediaDevicesProvider>
        <Provider>{children}</Provider>
      </MediaDevicesProvider>
    </StreamVideoProvider>
  );
};

// FIXME: these two hooks should not be exported out, rather we must export individual hooks
export const useStreamVideoStoreValue = useStoreValue;
export const useStreamVideoStoreSetState = useStoreSetState;
