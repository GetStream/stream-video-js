import React, { useMemo } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Call,
  StreamCall,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList } from '../../../types';
import { MeetingUI } from '../../components/MeetingUI';

type Props = NativeStackScreenProps<MeetingStackParamList, 'MeetingScreen'>;

export const MeetingScreen = (props: Props) => {
  const { route } = props;
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

  if (!call) {
    return null;
  }

  return (
    <StreamCall call={call} callCycleHandlers={{}}>
      <MeetingUI callId={callId} {...props} />
    </StreamCall>
  );
};
