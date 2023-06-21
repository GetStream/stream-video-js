import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Call,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  User,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList, ScreenTypes } from '../../../types';
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
  const apiKey = process.env.STREAM_API_KEY as string;
  const {
    params: { guestUserId, callId, mode },
  } = props.route;
  const callType = 'default';

  const [show, setShow] = useState<ScreenTypes>('lobby');
  const { navigation } = props;

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
    });
    setVideoClient(_videoClient);

    return () => {
      _videoClient?.disconnectUser();
      setVideoClient(undefined);
    };
  }, [tokenProvider, userToConnect, apiKey, mode]);

  const call = useMemo<Call | undefined>(
    () => (videoClient ? videoClient.call(callType, callId) : undefined),
    [callId, callType, videoClient],
  );

  const onJoin = () => {
    setShow('active-call');
  };

  const onLeave = () => {
    setShow('lobby');
    navigation.goBack();
  };

  if (!videoClient || !call) {
    return null;
  }

  return (
    <StreamVideo client={videoClient}>
      <StreamCall
        call={call}
        callCycleHandlers={{
          onCallJoined: onJoin,
          onCallHungUp: onLeave,
        }}
      >
        <MeetingUI show={show} setShow={setShow} callId={callId} {...props} />
      </StreamCall>
    </StreamVideo>
  );
};
