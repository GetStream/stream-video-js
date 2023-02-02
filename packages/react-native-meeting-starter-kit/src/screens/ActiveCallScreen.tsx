import React, {useCallback} from 'react';
import {ActiveCall, useActiveCall} from '@stream-io/video-react-native-sdk';
import {ActivityIndicator, StyleSheet} from 'react-native';
import {NavigationStackParamsList} from '../types';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAppContext} from '../context/AppContext';

type Props = NativeStackScreenProps<
  NavigationStackParamsList,
  'ActiveCallScreen'
>;

export function ActiveCallScreen({navigation}: Props) {
  const activeCall = useActiveCall();
  const {setCallId} = useAppContext();

  const onHangupCall = useCallback(() => {
    navigation.navigate('CallLobbyScreen');
    setCallId(undefined);
  }, [navigation, setCallId]);

  const onOpenCallParticipantsInfoViewHandler = useCallback(() => {
    navigation.navigate('CallParticipantsInfoScreen');
  }, [navigation]);

  if (!activeCall) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }
  return (
    <ActiveCall
      onHangupCall={onHangupCall}
      onOpenCallParticipantsInfoView={onOpenCallParticipantsInfoViewHandler}
    />
  );
}
