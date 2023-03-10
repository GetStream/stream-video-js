import React from 'react';
import {ScrollView} from 'react-native';
import {LobbyView} from '@stream-io/video-react-native-sdk';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavigationStackParamsList} from '../types';

type CallLobbyScreenProps = NativeStackScreenProps<
  NavigationStackParamsList,
  'CallLobbyScreen'
>;

export const LobbyViewScreen = (props: CallLobbyScreenProps) => {
  const {route} = props;
  const {
    params: {callId},
  } = route;

  return (
    <ScrollView>
      <LobbyView callID={callId} />
    </ScrollView>
  );
};
