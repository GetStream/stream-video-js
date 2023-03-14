import {
  StreamCallProvider,
  StreamVideo as StreamVideoProvider,
  StreamVideoProps,
  useActiveCall,
} from '@stream-io/video-react-bindings';
import React, { PropsWithChildren } from 'react';
import { Provider } from '../contexts/StreamVideoContext';
import { MediaDevicesProvider } from '../contexts/MediaDevicesContext';
import { CallCycleHandlersType, CallCycleProvider } from '../contexts';

const StreamCallWrapper = ({ children }: PropsWithChildren) => {
  const activeCall = useActiveCall();
  if (!activeCall) return <>{children}</>;

  return <StreamCallProvider call={activeCall}>{children}</StreamCallProvider>;
};

export const StreamVideo = (
  props: PropsWithChildren<
    StreamVideoProps & { callCycleHandlers?: CallCycleHandlersType }
  >,
) => {
  const { callCycleHandlers = {}, client, children } = props;

  return (
    <StreamVideoProvider client={client}>
      <StreamCallWrapper>
        <CallCycleProvider callCycleHandlers={callCycleHandlers}>
          <MediaDevicesProvider>
            <Provider>{children}</Provider>
          </MediaDevicesProvider>
        </CallCycleProvider>
      </StreamCallWrapper>
    </StreamVideoProvider>
  );
};
