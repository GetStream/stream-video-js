import React, { useCallback, useEffect, useState } from 'react';
import JoinCallScreen from '../screens/Call/JoinCallScreen';

import {
  CallingState,
  IncomingCallView,
  OutgoingCallView,
  StreamCall,
  useCall,
  useCallCallingState,
  useCalls,
} from '@stream-io/video-react-native-sdk';
import { Alert, StyleSheet, View } from 'react-native';
import { ActiveCall } from '../components/ActiveCall';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CallStackParamList } from '../../types';
import { NavigationHeader } from '../components/NavigationHeader';
import { appTheme } from '../theme';

const CallStack = createNativeStackNavigator<CallStackParamList>();

type ScreenTypes = 'incoming' | 'outgoing' | 'active-call' | 'none';

const CallPanel = ({
  show,
  setShow,
}: {
  show: ScreenTypes;
  setShow: React.Dispatch<React.SetStateAction<ScreenTypes>>;
}) => {
  const call = useCall();
  const callingState = useCallCallingState();

  const onCallHungUpHandler = React.useCallback(async () => {
    try {
      if (callingState === CallingState.LEFT) {
        return;
      }
      await call?.leave();
      setShow('none');
    } catch (error) {
      console.log('Error leaving Call', error);
    }
  }, [call, callingState, setShow]);

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
          <ActiveCall
            hangUpCallButton={{ onPressHandler: onCallHungUpHandler }}
          />
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
      <CallPanel show={show} setShow={setShow} />
    </StreamCall>
  );
};

export const Call = () => {
  return (
    <>
      <CallStack.Navigator>
        <CallStack.Screen
          name="JoinCallScreen"
          component={JoinCallScreen}
          options={{ header: NavigationHeader }}
        />
      </CallStack.Navigator>
      <Calls />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: appTheme.colors.static_grey,
  },
});
