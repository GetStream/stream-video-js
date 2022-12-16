import React from 'react';
import { ActiveCall, useActiveCall } from '@stream-io/video-react-native-sdk';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RingingStackParamList } from '../../../types';
import { ActivityIndicator, StyleSheet } from 'react-native';

type Props = NativeStackScreenProps<RingingStackParamList, 'CallScreen'>;

export const CallScreen = ({ navigation }: Props) => {
  const activeCall = useActiveCall();

  return activeCall ? (
    <ActiveCall onHangupCall={() => navigation.navigate('JoinCallScreen')} />
  ) : (
    <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />
  );
};
