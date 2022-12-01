import React from 'react';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

import { OutgoingCallView } from '@stream-io/video-react-native-sdk';

type Props = NativeStackScreenProps<RootStackParamList, 'OutgoingCallScreen'>;

const OutgoingCallScreen = ({ navigation }: Props) => {
  const loopbackMyVideo = useAppGlobalStoreValue(
    (store) => store.loopbackMyVideo,
  );

  const onHangupCall = () => {
    navigation.navigate('HomeScreen');
  };

  const onCallAccepted = () => {
    navigation.navigate('ActiveCall');
  };

  return (
    <OutgoingCallView
      onCallAccepted={onCallAccepted}
      onHangupCall={onHangupCall}
      loopBackMyVideo={loopbackMyVideo}
    />
  );
};

export default OutgoingCallScreen;
