import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { ActiveCall } from '@stream-io/video-react-native-sdk';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveCallScreen'>;

export default (props: Props) => {
  const { navigation } = props;

  const onHangupCall = () => {
    navigation.navigate('HomeScreen');
  };

  return <ActiveCall onHangupCall={onHangupCall} />;
};
