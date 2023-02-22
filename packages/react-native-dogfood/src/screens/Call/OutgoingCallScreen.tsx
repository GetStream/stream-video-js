import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RingingStackParamList } from '../../../types';

import { OutgoingCallView } from '@stream-io/video-react-native-sdk';

type Props = NativeStackScreenProps<
  RingingStackParamList,
  'OutgoingCallScreen'
>;

const OutgoingCallScreen = ({ navigation }: Props) => {
  const onHangupCall = () => {
    navigation.navigate('JoinCallScreen');
  };

  return <OutgoingCallView onHangupCall={onHangupCall} />;
};

export default OutgoingCallScreen;
