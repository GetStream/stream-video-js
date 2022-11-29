import React, { useEffect } from 'react';
import {
  IncomingCallView,
  useActiveCall,
  useIncomingRingCalls,
  useTerminatedRingCall,
} from '@stream-io/video-react-native-sdk';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'IncomingCallScreen'>;

const IncomingCallScreen = ({ navigation }: Props) => {
  const incomingRingCalls = useIncomingRingCalls();
  const terminatedRingCall = useTerminatedRingCall();
  const activeCall = useActiveCall();

  useEffect(() => {
    if (activeCall) {
      navigation.navigate('ActiveCall');
    } else {
      if (!incomingRingCalls.length || terminatedRingCall) {
        navigation.navigate('HomeScreen');
      }
    }
  }, [activeCall, incomingRingCalls, terminatedRingCall, navigation]);

  return <IncomingCallView />;
};

export default IncomingCallScreen;
