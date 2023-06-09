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
import { createToken } from '../../modules/helpers/createToken';

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

  const [userToConnect, setUserToConnect] = useState<UserResponse>({
    id: `anonymous-${Math.random().toString(36).substring(2, 15)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    role: 'guest',
    teams: [],
    custom: {},
  });
  const [tokenToUse, setTokenToUse] = useState<TokenOrProvider>(undefined);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [show, setShow] = useState<ScreenTypes>('lobby');
  const { navigation } = props;
  const activeCall = useCall();

  const onJoin = () => {
    setShow('active-call');
  };

  const onLeave = () => {
    setShow('lobby');
    navigation.goBack();
  };

  useEffect(() => {
    const intitializeToken = async () => {
      const token = await createToken({
        user_id: '!anon',
        call_cids: `${guestCallType}:${guestCallId}`,
      });
      setTokenToUse(token);
    };

    intitializeToken();
  }, [guestCallId, guestCallType]);

  const client = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: tokenToUse,
    user: userToConnect,
    isAnonymous: isAnonymous,
  });

  useEffect(() => {
    if (mode !== 'guest') {
      return;
    }
    const setGuestUserDetails = async () => {
      if (!guestUserId) {
        return;
      }
      try {
        const response = await client.createGuestUser({
          user: {
            id: guestUserId,
            name: guestUserId,
            role: 'guest',
          },
        });
        const { user, access_token } = response;
        setUserToConnect(user);
        setTokenToUse(access_token);
        setIsAnonymous(false);
      } catch (error) {
        console.log('Error setting guest user credentials:', error);
      }
    };

    setGuestUserDetails();
  }, [client, guestUserId, mode]);

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
