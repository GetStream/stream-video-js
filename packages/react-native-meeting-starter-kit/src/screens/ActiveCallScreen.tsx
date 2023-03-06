import React, {useCallback} from 'react';
import {ActiveCall, useActiveCall} from '@stream-io/video-react-native-sdk';
import {ActivityIndicator, StyleSheet} from 'react-native';
import {NavigationStackParamsList} from '../types';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

type ActiveCallScreenProps = NativeStackScreenProps<
  NavigationStackParamsList,
  'ActiveCallScreen'
>;

export function ActiveCallScreen({navigation}: ActiveCallScreenProps) {
  const activeCall = useActiveCall();

  const onOpenCallParticipantsInfoViewHandler = useCallback(() => {
    navigation.navigate('CallParticipantsInfoScreen');
  }, [navigation]);

  if (!activeCall) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }
  return (
    <ActiveCall
      onOpenCallParticipantsInfoView={onOpenCallParticipantsInfoViewHandler}
    />
  );
}
