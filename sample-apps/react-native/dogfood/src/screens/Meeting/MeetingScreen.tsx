import React, { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StreamCall, useCall } from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList, ScreenTypes } from '../../../types';
import {
  startForegroundService,
  stopForegroundService,
} from '../../modules/push/android';
import { MeetingUI } from '../../components/MeetingUI';

type Props = NativeStackScreenProps<MeetingStackParamList, 'MeetingScreen'>;

export const MeetingScreen = (props: Props) => {
  const [show, setShow] = useState<ScreenTypes>('lobby');
  const { navigation, route } = props;

  const {
    params: { callId },
  } = route;

  const activeCall = useCall();

  const onJoin = () => {
    setShow('active-call');
  };

  const onLeave = () => {
    setShow('lobby');
    navigation.goBack();
  };

  useEffect(() => {
    if (!activeCall) {
      return;
    }
    startForegroundService();
    return () => {
      stopForegroundService();
    };
  }, [activeCall]);

  return (
    <StreamCall
      callId={callId}
      callType={'default'}
      callCycleHandlers={{
        onCallJoined: onJoin,
        onCallHungUp: onLeave,
      }}
    >
      <MeetingUI show={show} setShow={setShow} callId={callId} {...props} />
    </StreamCall>
  );
};
