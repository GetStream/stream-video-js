import React from 'react';
import {ActiveCall, useActiveCall} from '@stream-io/video-react-native-sdk';
import {ActivityIndicator, StyleSheet} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavigationStackParamsList} from '../types';
import {useAppContext} from '../context/AppContext';

type Props = NativeStackScreenProps<
  NavigationStackParamsList,
  'ActiveCallScreen'
>;

export const ActiveCallScreen = ({navigation}: Props) => {
  const activeCall = useActiveCall();
  const {channel} = useAppContext();

  const onHangupCall = () => {
    if (!channel) {
      navigation.navigate('ChannelListScreen');
    } else {
      navigation.navigate('ChannelScreen');
    }
  };

  const onOpenCallParticipantsInfoViewHandler = () => {
    navigation.navigate('CallParticipantsInfoScreen');
  };

  if (!activeCall) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }
  return (
    <ActiveCall
      onHangupCall={onHangupCall}
      onOpenCallParticipantsInfoView={onOpenCallParticipantsInfoViewHandler}
    />
  );
};
