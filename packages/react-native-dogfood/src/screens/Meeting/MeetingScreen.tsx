import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActiveCall, useActiveCall } from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList } from '../../../types';
import { ActivityIndicator, StyleSheet } from 'react-native';

type Props = NativeStackScreenProps<MeetingStackParamList, 'MeetingScreen'>;

export const MeetingScreen = ({ navigation }: Props) => {
  const activeCall = useActiveCall();

  return activeCall ? (
    <ActiveCall onHangupCall={() => navigation.navigate('JoinMeetingScreen')} />
  ) : (
    <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />
  );
};
