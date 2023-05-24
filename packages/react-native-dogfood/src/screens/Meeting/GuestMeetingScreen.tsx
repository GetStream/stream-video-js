import React, { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  StreamCall,
  StreamVideo,
  TokenOrProvider,
  UserResponse,
  useCall,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList, ScreenTypes } from '../../../types';
import {
  startForegroundService,
  stopForegroundService,
} from '../../modules/push/android';
import { MeetingUI } from '../../components/MeetingUI';

type Props = NativeStackScreenProps<
  MeetingStackParamList,
  'GuestMeetingScreen'
>;

export const GuestMeetingScreen = (props: Props) => {
  const apiKey = process.env.STREAM_API_KEY as string;
  const {
    params: { guestUserId, guestCallId, mode },
  } = props.route;
  const guestCallType = 'default';

  const user: UserResponse = {
    id: `anonymous-${Math.random().toString(36).substring(2, 15)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    role: 'guest',
    teams: [],
    custom: {},
  };

  const [userToConnect, setUserToConnect] = useState(user);
  const [tokenToUse, setTokenToUse] = useState<TokenOrProvider>(undefined);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [show, setShow] = useState<ScreenTypes>('lobby');
  const { navigation } = props;

  const onJoin = () => {
    setShow('active-call');
  };

  const onLeave = () => {
    setShow('lobby');
    navigation.goBack();
  };

  const onJoining = () => {
    setShow('loading');
  };

  useEffect(() => {
    const intitializeToken = async () => {
      const { token } = await fetch(
        'https://stream-calls-dogfood.vercel.app/api/auth/create-token?' +
          new URLSearchParams({
            api_key: apiKey,
            user_id: '!anon',
            call_cids: `${guestCallType}:${guestCallType}`,
          }),
        {},
      ).then((response) => response.json());
      setTokenToUse(token);
    };

    intitializeToken();
  }, [apiKey, guestCallId, guestCallType]);

  const client = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: tokenToUse,
    user: userToConnect,
    isAnonymous: isAnonymous,
  });

  useEffect(() => {
    if (mode !== 'guest' || !guestUserId) {
      return;
    }
    client
      .createGuestUser({
        user: {
          id: guestUserId,
          name: guestUserId,
          role: 'guest',
        },
      })
      .then((guestUser) => {
        console.log(guestUser);
        setUserToConnect(guestUser.user);
        setTokenToUse(guestUser.access_token);
        setIsAnonymous(false);
      })
      .catch((err) => {
        console.error('Error creating guest user', err);
      });
  }, [client, guestUserId, mode]);

  const activeCall = useCall();
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
    <StreamVideo client={client}>
      <StreamCall
        callId={guestCallId}
        callType={guestCallType}
        callCycleHandlers={{
          onCallJoined: onJoin,
          onCallHungUp: onLeave,
          onCallJoining: onJoining,
        }}
      >
        <MeetingUI
          show={show}
          setShow={setShow}
          callId={guestCallId}
          {...props}
        />
      </StreamCall>
    </StreamVideo>
  );
};
