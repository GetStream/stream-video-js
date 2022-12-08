import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

import { OutgoingCallView } from '@stream-io/video-react-native-sdk';

type Props = NativeStackScreenProps<RootStackParamList, 'OutgoingCallScreen'>;

const OutgoingCallScreen = ({ navigation }: Props) => {
  const onHangupCall = () => {
    navigation.navigate('HomeScreen');
  };

  const onCallAccepted = () => {
    navigation.navigate('ActiveCallScreen');
  };

  return (
    <OutgoingCallView
      onCallAccepted={onCallAccepted}
      onHangupCall={onHangupCall}
    />
  );
};

export default OutgoingCallScreen;
