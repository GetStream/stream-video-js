import {
  StreamVideo as StreamVideoProvider,
  StreamVideoProps,
} from '@stream-io/video-react-bindings';
import React, { PropsWithChildren } from 'react';
import { CallKeepOptions } from '../types';
import { MediaDevicesProvider } from './MediaDevicesContext';
import { StreamCall } from './StreamCall';
import {
  useStoreValue,
  useStoreSetState,
  Provider,
} from './StreamVideoContext';

export const StreamVideo = (
  props: PropsWithChildren<
    StreamVideoProps & {
      callKeepOptions: CallKeepOptions;
    }
  >,
) => {
  // FIXME: callKeepOptions is not used
  const { client, children } = props;
  return (
    <StreamVideoProvider client={client}>
      {/* <StreamCall /> */}
      <MediaDevicesProvider>
        <Provider>
          <StreamCall>{children}</StreamCall>
        </Provider>
      </MediaDevicesProvider>
    </StreamVideoProvider>
  );
};

// FIXME: these two hooks should not be exported out, rather we must export individual hooks
export const useStreamVideoStoreValue = useStoreValue;
export const useStreamVideoStoreSetState = useStoreSetState;
