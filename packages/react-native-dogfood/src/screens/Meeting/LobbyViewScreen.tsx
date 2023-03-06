import React from 'react';
import { LobbyView } from '@stream-io/video-react-native-sdk';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MeetingStackParamList } from '../../../types';

type LobbyViewScreenProps = NativeStackScreenProps<
  MeetingStackParamList,
  'LobbyViewScreen'
>;

export const LobbyViewScreen = (props: LobbyViewScreenProps) => {
  const { navigation, route } = props;

  const onActiveCall = () => {
    navigation.navigate('MeetingScreen');
  };

  return <LobbyView callID={route.params.callID} onActiveCall={onActiveCall} />;
};
