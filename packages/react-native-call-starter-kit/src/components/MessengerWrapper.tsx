import React, {PropsWithChildren, useCallback, useMemo, useState} from 'react';
import {
  ActiveCall,
  IncomingCallView,
  OutgoingCallView,
  StreamCall,
  useCalls,
} from '@stream-io/video-react-native-sdk';

import {STREAM_API_KEY} from 'react-native-dotenv';
import {ChatWrapper} from './ChatWrapper';
import {VideoWrapper} from './VideoWrapper';
import {AuthProgressLoader} from './AuthProgressLoader';

console.log('STREAM_API_KEY', STREAM_API_KEY);

const CallPanel = ({show}: {show: ScreenTypes}) => {
  if (show === 'incoming') {
    return <IncomingCallView />;
  } else if (show === 'outgoing') {
    return <OutgoingCallView />;
  } else if (show === 'active-call') {
    return <ActiveCall />;
  } else if (show === 'joining') {
    return <AuthProgressLoader />;
  }

  return null;
};

type ScreenTypes = 'incoming' | 'outgoing' | 'active-call' | 'joining' | 'none';

export const Calls = () => {
  const calls = useCalls();
  const [show, setShow] = useState<ScreenTypes>('none');

  const onCallJoined = useCallback(() => {
    setShow('active-call');
  }, [setShow]);

  const onCallIncoming = useCallback(() => {
    setShow('incoming');
  }, [setShow]);

  const onCallOutgoing = useCallback(() => {
    setShow('outgoing');
  }, [setShow]);

  const onCallJoining = useCallback(() => {
    setShow('joining');
  }, [setShow]);

  const onCallHungUp = useCallback(() => {
    setShow('none');
  }, [setShow]);

  const onCallRejected = useCallback(() => {
    setShow('none');
  }, [setShow]);

  const callCycleHandlers = useMemo(() => {
    return {
      onCallJoined,
      onCallIncoming,
      onCallOutgoing,
      onCallHungUp,
      onCallRejected,
      onCallJoining,
    };
  }, [
    onCallJoined,
    onCallIncoming,
    onCallOutgoing,
    onCallHungUp,
    onCallRejected,
    onCallJoining,
  ]);

  return (
    <>
      {calls.map(call => {
        return (
          <StreamCall
            key={call.id}
            call={call}
            callCycleHandlers={callCycleHandlers}>
            <CallPanel show={show} />
          </StreamCall>
        );
      })}
    </>
  );
};

export const MessengerWrapper = ({children}: PropsWithChildren<{}>) => {
  return (
    <ChatWrapper>
      <VideoWrapper>
        {children}
        <Calls />
      </VideoWrapper>
    </ChatWrapper>
  );
};
