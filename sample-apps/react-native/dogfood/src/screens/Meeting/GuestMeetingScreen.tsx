import React, { useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Call,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  User,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList } from '../../../types';
import { MeetingUI } from '../../components/MeetingUI';
import { createToken } from '../../modules/helpers/createToken';

type Props = NativeStackScreenProps<
  MeetingStackParamList,
  'GuestMeetingScreen'
>;

export const GuestMeetingScreen = (props: Props) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient | undefined>(
    undefined,
  );
  const {
    params: { guestUserId, callId, mode },
  } = props.route;
  const callType = 'default';

  const userToConnect: User = useMemo(
    () =>
      mode === 'guest'
        ? {
            id: guestUserId,
            type: 'guest',
          }
        : {
            type: 'anonymous',
          },
    [mode, guestUserId],
  );

  useEffect(() => {
    let _videoClient: StreamVideoClient | undefined;
    const run = async () => {
      const { token, apiKey } = await createToken({
        user_id: userToConnect.id ?? '!anon',
        call_cids: mode === 'anonymous' ? `${callType}:${callId}` : undefined,
      });
      _videoClient = new StreamVideoClient({
        apiKey,
        user: userToConnect,
        token,
        options: { logLevel: 'warn' },
      });
      setVideoClient(_videoClient);
    };

    run();

    return () => {
      _videoClient?.disconnectUser();
      setVideoClient(undefined);
    };
  }, [userToConnect, mode, callId]);

  const call = useMemo<Call | undefined>(() => {
    if (!videoClient) {
      return undefined;
    }
    return videoClient.call(callType, callId);
  }, [callId, callType, videoClient]);

  useEffect(() => {
    call?.getOrCreate().catch((err) => {
      console.error('Failed to get or create call', err);
    });
  }, [call]);

  if (!videoClient || !call) {
    return null;
  }

  return (
    <StreamVideo client={videoClient}>
      <StreamCall call={call}>
        <MeetingUI callId={callId} {...props} />
      </StreamCall>
    </StreamVideo>
  );
};
