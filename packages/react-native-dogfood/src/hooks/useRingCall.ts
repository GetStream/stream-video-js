import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useCallback } from 'react';
import {
  useActiveRingCall,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';

export const useRingCall = () => {
  const videoClient = useStreamVideoClient();
  const activeRingCallMeta = useActiveRingCall();

  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'IncomingCallScreen'>
    >();

  const cancelCall = useCallback(async () => {
    if (videoClient && activeRingCallMeta) {
      await videoClient.cancelCall(activeRingCallMeta.callCid);
      await navigation.navigate('HomeScreen');
    }
  }, [activeRingCallMeta, navigation, videoClient]);

  return { cancelCall };
};
