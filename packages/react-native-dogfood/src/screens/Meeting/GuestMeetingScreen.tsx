import React, { useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  StreamCall,
  StreamVideo,
  TokenOrProvider,
  User,
  useCreateStreamVideoClient,
  usePushRegisterEffect,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList, ScreenTypes } from '../../../types';
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

  const [tokenToUse, setTokenToUse] = useState<TokenOrProvider>(undefined);
  const [show, setShow] = useState<ScreenTypes>('lobby');
  const { navigation } = props;

  const userToConnect: User = useMemo(
    () =>
      mode === 'guest'
        ? {
            id: guestUserId,
            name: guestUserId,
            type: 'guest',
          }
        : {
            id: '!anon',
            type: 'anonymous',
          },
    [mode, guestUserId],
  );

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
  });

  usePushRegisterEffect(client);

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
