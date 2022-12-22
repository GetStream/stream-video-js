import React from 'react';
import {IncomingCallView} from '@stream-io/video-react-native-sdk';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavigationStackParamsList} from '../types';

type Props = NativeStackScreenProps<
  NavigationStackParamsList,
  'IncomingCallScreen'
>;

const IncomingCallScreen = ({navigation}: Props) => {
  const onAnswerCall = () => {
    navigation.navigate('ActiveCallScreen');
  };

  const onRejectCall = () => {
    navigation.navigate('ChannelScreen');
  };

  return (
    <IncomingCallView onAnswerCall={onAnswerCall} onRejectCall={onRejectCall} />
  );
};

export default IncomingCallScreen;
