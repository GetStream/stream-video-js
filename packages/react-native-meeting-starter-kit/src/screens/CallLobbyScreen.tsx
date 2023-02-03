import React from 'react';
import {CallLobby} from '@stream-io/video-react-native-sdk';
import {meetingId} from '../utils/meetingId';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavigationStackParamsList} from '../types';

type CallLobbyScreenProps = NativeStackScreenProps<
  NavigationStackParamsList,
  'CallLobbyScreen'
>;

export const CallLobbyScreen = (props: CallLobbyScreenProps) => {
  const {navigation} = props;

  const meetingCallID = meetingId();

  const onActiveCall = () => {
    navigation.navigate('ActiveCallScreen');
  };

  return <CallLobby callID={meetingCallID} onActiveCall={onActiveCall} />;
};
