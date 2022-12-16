import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RingingStackParamList } from '../../../types';

import {
  OutgoingCallView,
  useActiveCall,
} from '@stream-io/video-react-native-sdk';
import { ActivityIndicator, StyleSheet } from 'react-native';

type Props = NativeStackScreenProps<
  RingingStackParamList,
  'OutgoingCallScreen'
>;

const OutgoingCallScreen = ({ navigation }: Props) => {
  const activeCall = useActiveCall();

  const onHangupCall = () => {
    navigation.navigate('JoinCallScreen');
  };

  if (!activeCall) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }
  return <OutgoingCallView onHangupCall={onHangupCall} />;
};

export default OutgoingCallScreen;
