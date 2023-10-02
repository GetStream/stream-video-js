import React, { useEffect, useMemo } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Call,
  StreamCall,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList } from '../../../types';
import { MeetingUI } from '../../components/MeetingUI';
import { KnownUsers } from '../../constants/KnownUsers';

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

  useEffect(() => {
    const getOrCreateCall = async () => {
      try {
        const members = KnownUsers.map((u) => ({
          user_id: u.id,
        }));
        await call?.getOrCreate({
          notify: true,
          data: {
            members,
          },
        });
      } catch (error) {
        console.error('Failed to get or create call', error);
      }
    };

    getOrCreateCall();
  }, [call]);

  if (!call) {
    return null;
  }

  return (
    <StreamCall
      call={call}
      mediaDeviceInitialState={{
        initialAudioEnabled: false,
        initialVideoEnabled: false,
      }}
    >
      <MeetingUI callId={callId} {...props} />
    </StreamCall>
  );
};
