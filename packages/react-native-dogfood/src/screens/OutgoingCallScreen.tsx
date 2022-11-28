import React, { useEffect } from 'react';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

import {
  OutgoingCallView,
  useRemoteParticipants,
} from '@stream-io/video-react-native-sdk';

type Props = NativeStackScreenProps<RootStackParamList, 'OutgoingCallScreen'>;

const OutgoingCallScreen = ({ navigation }: Props) => {
  const loopbackMyVideo = useAppGlobalStoreValue(
    (store) => store.loopbackMyVideo,
  );
  const remoteParticipants = useRemoteParticipants();

  const filteredParticipants = loopbackMyVideo
    ? remoteParticipants
    : remoteParticipants.filter((p) => !p.isLoggedInUser);

  useEffect(() => {
    if (filteredParticipants.length > 0) {
      navigation.navigate('ActiveCall');
    }
  }, [filteredParticipants, navigation]);

  return <OutgoingCallView />;
};

export default OutgoingCallScreen;
