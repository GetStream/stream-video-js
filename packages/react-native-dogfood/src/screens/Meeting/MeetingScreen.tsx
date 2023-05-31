import React, { useCallback, useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  StreamCall,
  StreamVideo,
  useCall,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList, ScreenTypes } from '../../../types';
import {
  startForegroundService,
  stopForegroundService,
} from '../../modules/push/android';
import { MeetingUI } from '../../components/MeetingUI';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';
import translations from '../../translations';
import { createToken } from '../../modules/helpers/createToken';

type Props = NativeStackScreenProps<MeetingStackParamList, 'MeetingScreen'>;

export const MeetingScreen = (props: Props) => {
  const username = useAppGlobalStoreValue((store) => store.username);
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const apiKey = process.env.STREAM_API_KEY as string;
  const [show, setShow] = useState<ScreenTypes>('lobby');
  const { navigation, route } = props;

  const {
    params: { callId },
  } = route;

  const activeCall = useCall();

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

  const user = {
    id: username,
    name: username,
    role: 'admin',
    teams: ['team-1, team-2'],
    image: userImageUrl,
  };

  const tokenOrProvider = useCallback(async () => {
    const token = await createToken({ user_id: username });
    return token;
  }, [username]);

  const client = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: tokenOrProvider,
    user,
  });

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
    <StreamVideo client={client} translationsOverrides={translations}>
      <StreamCall
        callId={callId}
        callType={'default'}
        callCycleHandlers={{
          onCallJoined: onJoin,
          onCallJoining: onJoining,
          onCallHungUp: onLeave,
        }}
      >
        <MeetingUI show={show} setShow={setShow} callId={callId} {...props} />
      </StreamCall>
    </StreamVideo>
  );
};
