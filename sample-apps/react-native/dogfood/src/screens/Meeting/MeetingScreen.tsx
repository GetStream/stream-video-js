import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StreamCall } from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList, ScreenTypes } from '../../../types';
import { MeetingUI } from '../../components/MeetingUI';
import { useAppGlobalStoreSetState } from '../../contexts/AppContext';

type Props = NativeStackScreenProps<MeetingStackParamList, 'MeetingScreen'>;

export const MeetingScreen = (props: Props) => {
  const [show, setShow] = useState<ScreenTypes>('lobby');
  const { navigation, route } = props;
  const appStoreSetState = useAppGlobalStoreSetState();

  const {
    params: { callId },
  } = route;

  const onJoin = () => {
    setShow('active-call');
    appStoreSetState({ chatLabelNoted: false });
  };

  const onLeave = () => {
    setShow('lobby');
    navigation.goBack();
  };

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
