import React from 'react';
import { IncomingCallView } from '@stream-io/video-react-native-sdk';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'IncomingCallScreen'>;

const IncomingCallScreen = ({ navigation }: Props) => {
  const onAnswerCall = () => {
    navigation.navigate('ActiveCall');
  };

  const onRejectCall = () => {
    navigation.navigate('HomeScreen');
  };

  return (
    <IncomingCallView onAnswerCall={onAnswerCall} onRejectCall={onRejectCall} />
  );
};

export default IncomingCallScreen;
