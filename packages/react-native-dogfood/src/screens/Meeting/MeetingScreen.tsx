import React, { useCallback, useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  StreamCall,
  StreamVideo,
  useCall,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList } from '../../../types';
import {
  startForegroundService,
  stopForegroundService,
} from '../../modules/push/android';
import { MeetingUI } from '../../components/MeetingUI';
import { createToken } from '../../modules/helpers/jwt';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';
import translations from '../../translations';

type Props = NativeStackScreenProps<MeetingStackParamList, 'MeetingScreen'>;

export const MeetingScreen = (props: Props) => {
  const username = useAppGlobalStoreValue((store) => store.username);
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const apiKey = process.env.STREAM_API_KEY as string;
  const apiSecret = process.env.STREAM_API_SECRET as string;
  const {
    params: { callId },
  } = props.route;

  const user = {
    id: username,
    name: username,
    role: 'admin',
    teams: ['team-1, team-2'],
    image: userImageUrl,
  };

  const tokenOrProvider = useCallback(async () => {
    const token = await createToken(username, apiSecret);
    return token;
  }, [apiSecret, username]);

  const client = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: tokenOrProvider,
    user,
  });

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
    <StreamVideo client={client} translationsOverrides={translations}>
      <StreamCall callId={callId} callType={'default'} callCycleHandlers={{}}>
        <MeetingUI {...props} />
      </StreamCall>
    </StreamVideo>
  );
};
