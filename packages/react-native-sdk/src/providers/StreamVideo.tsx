import {
  StreamVideo as StreamVideoProvider,
  StreamVideoProps,
} from '@stream-io/video-react-bindings';
import React, { PropsWithChildren } from 'react';
import { Provider } from '../contexts/StreamVideoContext';
import { MediaDevicesProvider } from '../contexts/MediaDevicesContext';
import {
  CallCycleProvider,
  CallCycleHandlersType,
} from '../providers/CallCycle';

export const StreamVideo = (
  props: PropsWithChildren<
    StreamVideoProps & { callCycleHandlers?: CallCycleHandlersType }
  >,
) => {
  const { callCycleHandlers = {}, client, children } = props;

  return (
    <StreamVideoProvider client={client}>
      <CallCycleProvider callCycleHandlers={callCycleHandlers}>
        <MediaDevicesProvider>
          <Provider>{children}</Provider>
        </MediaDevicesProvider>
      </CallCycleProvider>
    </StreamVideoProvider>
  );
};
