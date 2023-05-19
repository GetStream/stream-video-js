import React, {useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  StreamCall,
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-native-sdk';

import {MeetingUI} from '../components/MeetingUI';
import {useAppContext} from '../context/AppContext';
import {NavigationStackParamsList, ScreenTypes} from '../types';

type Props = NativeStackScreenProps<NavigationStackParamsList, 'MeetingScreen'>;

export const MeetingScreen = (props: Props) => {
  const apiKey = process.env.STREAM_API_KEY as string;
  const [show, setShow] = useState<ScreenTypes>('lobby');
  const {navigation, route} = props;
  const {user: loggedInUser} = useAppContext();

  const {
    params: {callId},
  } = route;

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
    id: loggedInUser?.id!!,
    name: loggedInUser?.name,
    role: 'admin',
    teams: ['team-1, team-2'],
    image: loggedInUser?.image,
  };

  const client = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: loggedInUser?.custom && loggedInUser?.custom.token,
    user,
  });

  return (
    <StreamVideo client={client}>
      <StreamCall
        callId={callId}
        callType={'default'}
        callCycleHandlers={{
          onCallJoined: onJoin,
          onCallJoining: onJoining,
          onCallHungUp: onLeave,
        }}>
        <MeetingUI show={show} setShow={setShow} callId={callId} {...props} />
      </StreamCall>
    </StreamVideo>
  );
};
