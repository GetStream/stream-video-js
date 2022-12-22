import React from 'react';
import {
  OutgoingCallView,
  useActiveCall,
} from '@stream-io/video-react-native-sdk';
import {ActivityIndicator, StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavigationStackParamsList} from '../types';

type Props = NativeStackScreenProps<
  NavigationStackParamsList,
  'OutgoingCallScreen'
>;

const OutgoingCallScreen = ({navigation}: Props) => {
  const activeCall = useActiveCall();

  const onHangupCall = () => {
    navigation.navigate('ChannelScreen');
  };

  if (!activeCall) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }
  return <OutgoingCallView onHangupCall={onHangupCall} />;
};

export default OutgoingCallScreen;
