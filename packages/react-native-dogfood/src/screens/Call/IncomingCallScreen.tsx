import React from 'react';
import { IncomingCallView } from '@stream-io/video-react-native-sdk';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RingingStackParamList } from '../../../types';

type Props = NativeStackScreenProps<
  RingingStackParamList,
  'IncomingCallScreen'
>;

const IncomingCallScreen = ({ navigation }: Props) => {
  const onAnswerCall = () => {
    navigation.navigate('CallScreen');
  };

  const onRejectCall = () => {
    navigation.navigate('JoinCallScreen');
  };

  return (
    <IncomingCallView onAnswerCall={onAnswerCall} onRejectCall={onRejectCall} />
  );
};

export default IncomingCallScreen;
