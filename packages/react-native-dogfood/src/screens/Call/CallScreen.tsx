import React from 'react';
import { ActiveCall, useActiveCall } from '@stream-io/video-react-native-sdk';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RingingStackParamList } from '../../../types';
import { ActivityIndicator, StyleSheet } from 'react-native';

type Props = NativeStackScreenProps<RingingStackParamList, 'CallScreen'>;

export const CallScreen = ({ navigation }: Props) => {
  const activeCall = useActiveCall();

  if (!activeCall) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }
  return (
    <ActiveCall onHangupCall={() => navigation.navigate('JoinCallScreen')} />
  );
};
