import React from 'react';
import {
  OutgoingCallView,
  useActiveCall,
} from '@stream-io/video-react-native-sdk';
import {ActivityIndicator, StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavigationStackParamsList} from '../types';
import {useStreamChatContext} from '../context/StreamChatContext';

type Props = NativeStackScreenProps<
  NavigationStackParamsList,
  'OutgoingCallScreen'
>;

const OutgoingCallScreen = ({navigation}: Props) => {
  const activeCall = useActiveCall();
  const {channel} = useStreamChatContext();

  const onHangupCall = () => {
    if (!channel) {
      navigation.navigate('ChannelListScreen');
    } else {
      navigation.navigate('ChannelScreen');
    }
  };

  if (!activeCall) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }
  return <OutgoingCallView onHangupCall={onHangupCall} />;
};

export default OutgoingCallScreen;
