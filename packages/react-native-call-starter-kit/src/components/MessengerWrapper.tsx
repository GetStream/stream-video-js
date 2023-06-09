import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActiveCall,
  CallingState,
  IncomingCallView,
  OutgoingCallView,
  StreamCall,
  theme,
  useCalls,
} from '@stream-io/video-react-native-sdk';

import {STREAM_API_KEY} from 'react-native-dotenv';
import {ChatWrapper} from './ChatWrapper';
import {VideoWrapper} from './VideoWrapper';
import {AuthProgressLoader} from './AuthProgressLoader';
import {Alert, StyleSheet, View} from 'react-native';

console.log('STREAM_API_KEY', STREAM_API_KEY);

const CallPanel = ({show}: {show: ScreenTypes}) => {
  switch (show) {
    case 'incoming':
      return <IncomingCallView />;
    case 'outgoing':
      return (
        <View style={styles.container}>
          <OutgoingCallView />
        </View>
      );
    case 'active-call':
      return (
        <View style={styles.container}>
          <ActiveCall />
        </View>
      );
    case 'joining':
      return (
        <View style={styles.container}>
          <AuthProgressLoader />
        </View>
      );
    case 'none':
      return null;
    default:
      return null;
  }
};

type ScreenTypes = 'incoming' | 'outgoing' | 'active-call' | 'joining' | 'none';

export const Calls = () => {
  const calls = useCalls();
  const [show, setShow] = useState<ScreenTypes>('none');

  const handleMoreCalls = useCallback(async () => {
    const lastCallCreatedBy = calls[1].data?.created_by;
    Alert.alert(
      `Incoming call from ${
        lastCallCreatedBy?.name ?? lastCallCreatedBy?.id
      }, only 1 call at a time is supported`,
    );
  }, [calls]);

  useEffect(() => {
    const activeCalls = calls.filter(
      call => call.state.callingState !== CallingState.LEFT,
    );
    // Trigger an alert for more than one active calls
    if (activeCalls.length > 1) {
      handleMoreCalls();
    }
  }, [calls, handleMoreCalls]);

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
            key={call.cid}
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

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.light.static_grey,
  },
});
