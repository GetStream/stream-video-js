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
  const {navigation, route} = props;
  const {
    params: {callId},
  } = route;

  const onActiveCall = () => {
    navigation.navigate('ActiveCallScreen');
  };

  return (
    <ScrollView>
      <LobbyView callID={callId} onActiveCall={onActiveCall} />
    </ScrollView>
  );
};
