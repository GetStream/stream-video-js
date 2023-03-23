import React from 'react';
import {ScrollView} from 'react-native';
import {LobbyView} from '@stream-io/video-react-native-sdk';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavigationStackParamsList} from '../types';
import {theme} from '@stream-io/video-react-native-sdk/dist/src/theme';

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
    <ScrollView
      style={{backgroundColor: theme.light.static_grey}}
      contentContainerStyle={styles.contentContainerStyle}>
      <LobbyView callID={callId} />
    </ScrollView>
  );
};

const styles = {
  contentContainerStyle: {
    paddingVertical: 16,
  },
};
