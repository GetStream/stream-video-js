import React, { useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Call,
  StreamCall,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList, ScreenTypes } from '../../../types';
import { MeetingUI } from '../../components/MeetingUI';
import { useAppGlobalStoreSetState } from '../../contexts/AppContext';

type Props = NativeStackScreenProps<MeetingStackParamList, 'MeetingScreen'>;

export const MeetingScreen = (props: Props) => {
  const [show, setShow] = useState<ScreenTypes>('lobby');
  const { navigation, route } = props;
  const appStoreSetState = useAppGlobalStoreSetState();
  const client = useStreamVideoClient();
  const callType = 'default';
  const {
    params: { callId },
  } = route;
  const call = useMemo<Call | undefined>(() => {
    if (!client) {
      return undefined;
    }
    return client.call(callType, callId);
  }, [callId, callType, client]);

  const onJoin = () => {
    setShow('active-call');
    appStoreSetState({ chatLabelNoted: false });
  };

  const onLeave = () => {
    setShow('lobby');
    navigation.goBack();
  };

  if (!call) {
    return;
  }

  return (
    <StreamCall
      call={call}
      callCycleHandlers={{
        onCallJoined: onJoin,
        onCallHungUp: onLeave,
      }}
    >
      <MeetingUI show={show} setShow={setShow} callId={callId} {...props} />
    </StreamCall>
  );
};
