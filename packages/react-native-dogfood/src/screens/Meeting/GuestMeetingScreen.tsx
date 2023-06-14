import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  User,
  useCall,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList, ScreenTypes } from '../../../types';
import {
  startForegroundService,
  stopForegroundService,
} from '../../modules/push/android';
import { MeetingUI } from '../../components/MeetingUI';
import { createToken } from '../../modules/helpers/createToken';

type Props = NativeStackScreenProps<
  MeetingStackParamList,
  'GuestMeetingScreen'
>;

export const GuestMeetingScreen = (props: Props) => {
  const apiKey = process.env.STREAM_API_KEY as string;
  const {
    params: { guestUserId, callId, mode },
  } = props.route;
  const callType = 'default';

  const [show, setShow] = useState<ScreenTypes>('lobby');
  const { navigation } = props;
  const activeCall = useCall();

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

  const tokenOrProvider = useCallback(async () => {
    const token = await createToken({
      user_id: '!anon',
      call_cids: `${callType}:${callId}`,
    });
    return token;
  }, [callId, callType]);

  const [videoClient] = useState<StreamVideoClient>(
    () =>
      new StreamVideoClient({
        apiKey,
        user: userToConnect,
        tokenProvider: mode === 'anonymous' ? tokenOrProvider : undefined,
      }),
  );

  useEffect(() => {
    if (!activeCall) {
      return;
    }
    startForegroundService();
    return () => {
      stopForegroundService();
    };
  }, [activeCall]);

  const onJoin = () => {
    setShow('active-call');
  };

  const onLeave = () => {
    setShow('lobby');
    navigation.goBack();
  };

  return (
    <StreamVideo client={videoClient}>
      <StreamCall
        callId={callId}
        callType={callType}
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
