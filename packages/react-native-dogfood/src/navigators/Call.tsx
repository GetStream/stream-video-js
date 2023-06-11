import React, { useCallback, useEffect, useState } from 'react';
import JoinCallScreen from '../screens/Call/JoinCallScreen';

import {
  IncomingCallView,
  OutgoingCallView,
  StreamCall,
  theme,
  useCalls,
} from '@stream-io/video-react-native-sdk';
import { VideoWrapper } from '../components/VideoWrapper';
import { Alert, StyleSheet, View } from 'react-native';
import { ActiveCallComponent } from '../components/ActiveCallComponent';

type ScreenTypes = 'incoming' | 'outgoing' | 'active-call' | 'none';

const CallPanel = ({ show }: { show: ScreenTypes }) => {
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
          <ActiveCallComponent />
        </View>
      );
    default:
      return null;
  }
};

const Calls = () => {
  const [show, setShow] = useState<ScreenTypes>('none');
  const calls = useCalls();

  const handleMoreCalls = useCallback(async () => {
    const lastCallCreatedBy = calls[1].data?.created_by;
    Alert.alert(
      `Incoming call from ${
        lastCallCreatedBy?.name ?? lastCallCreatedBy?.id
      }, only 1 call at a time is supported`,
    );
  }, [calls]);

  // Reset the state of the show variable when there are no calls.
  useEffect(() => {
    if (!calls.length) {
      setShow('none');
    }
    if (calls.length > 1) {
      handleMoreCalls();
    }
  }, [calls.length, handleMoreCalls]);

  const onCallJoined = React.useCallback(() => {
    setShow('active-call');
  }, [setShow]);

  const onCallIncoming = React.useCallback(() => {
    setShow('incoming');
  }, [setShow]);

  const onCallOutgoing = React.useCallback(() => {
    setShow('outgoing');
  }, [setShow]);

  const onCallHungUp = React.useCallback(() => {
    setShow('none');
  }, [setShow]);

  const onCallRejected = React.useCallback(() => {
    setShow('none');
  }, [setShow]);

  const callCycleHandlers = React.useMemo(() => {
    return {
      onCallJoined,
      onCallIncoming,
      onCallOutgoing,
      onCallHungUp,
      onCallRejected,
    };
  }, [
    onCallJoined,
    onCallIncoming,
    onCallOutgoing,
    onCallHungUp,
    onCallRejected,
  ]);

  const firstCall = calls[0];

  if (!firstCall) {
    return null;
  }

  return (
    <StreamCall call={calls[0]} callCycleHandlers={callCycleHandlers}>
      <CallPanel show={show} />
    </StreamCall>
  );
};

export const Call = () => {
  return (
    <VideoWrapper>
      <JoinCallScreen />
      <Calls />
    </VideoWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.light.static_grey,
  },
});
