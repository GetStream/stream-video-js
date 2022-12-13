import React from 'react';
import {
  IncomingCallView,
  StreamCall,
  useIncomingCalls,
} from '@stream-io/video-react-native-sdk';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RingingStackParamList } from '../../../types';

type Props = NativeStackScreenProps<RingingStackParamList, 'CallScreen'>;

export const CallScreen = ({ navigation }: Props) => {
  const username = useAppGlobalStoreValue((store) => store.username);
  const ringingCallID = useAppGlobalStoreValue((store) => store.ringingCallID);
  const ringingUsers = useAppGlobalStoreValue((store) => store.ringingUsers);

  const incomingCalls = useIncomingCalls();

  const onAnswerCall = () => {
    navigation.navigate('CallScreen');
  };

  const onRejectCall = () => {
    navigation.navigate('JoinCallScreen');
  };

  let content;
  if (incomingCalls.length > 0) {
    content = (
      <IncomingCallView
        onAnswerCall={onAnswerCall}
        onRejectCall={onRejectCall}
      />
    );
  }

  return (
    <StreamCall
      currentUser={username}
      callId={ringingCallID}
      callType={'default'}
      autoJoin={true}
      input={{ ring: true, members: ringingUsers }}
    >
      {content}
    </StreamCall>
  );
};
