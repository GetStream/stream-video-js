import React from 'react';
import { LobbyView } from '@stream-io/video-react-native-sdk';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MeetingStackParamList } from '../../../types';
import { ScrollView } from 'react-native';

type LobbyViewScreenProps = NativeStackScreenProps<
  MeetingStackParamList,
  'LobbyViewScreen'
>;

export const LobbyViewScreen = (props: LobbyViewScreenProps) => {
  const { route } = props;

  return (
    <ScrollView>
      <LobbyView callID={route.params.callID} />
    </ScrollView>
  );
};
