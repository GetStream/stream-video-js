import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { customSentryLogger } from '../../utils/logger';

type Props = NativeStackScreenProps<
  MeetingStackParamList,
  'GuestMeetingScreen'
>;

export const GuestMeetingScreen = (props: Props) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient | undefined>(
    undefined,
  );
  const apiKey = process.env.STREAM_API_KEY as string;
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

  const tokenProvider = useCallback(async () => {
    const token = await createToken({
      user_id: '!anon',
      call_cids: `${callType}:${callId}`,
    });
    return token;
  }, [callId, callType]);

  useEffect(() => {
    const _videoClient = new StreamVideoClient({
      apiKey,
      user: userToConnect,
      tokenProvider: mode === 'anonymous' ? tokenProvider : undefined,
      options: { logger: customSentryLogger, logLevel: 'warn' },
    });
    setVideoClient(_videoClient);

    return () => {
      _videoClient?.disconnectUser();
      setVideoClient(undefined);
    };
  }, [tokenProvider, userToConnect, apiKey, mode]);

  const call = useMemo<Call | undefined>(() => {
    if (!videoClient) {
      return undefined;
    }
    return videoClient.call(callType, callId);
  }, [callId, callType, videoClient]);

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
