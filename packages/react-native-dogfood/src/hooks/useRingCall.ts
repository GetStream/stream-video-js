import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import InCallManager from 'react-native-incall-manager';
import { useStore } from './useStore';
import { useObservableValue } from './useObservable';

export const useRingCall = () => {
  const videoClient = useAppGlobalStoreValue((store) => store.videoClient);
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );
  const { incomingRingCalls$, activeRingCall$ } = useStore();
  const incomingRingCalls = useObservableValue(incomingRingCalls$);
  const activeRingCall = useObservableValue(activeRingCall$);

  const currentIncomingRingCall =
    incomingRingCalls[incomingRingCalls.length - 1];

  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'IncomingCallScreen'>
    >();

  const answerCall = async () => {
    if (videoClient) {
      const call = await videoClient.joinCall({
        id: currentIncomingRingCall.id,
        type: 'default',
        datacenterId: '',
      });
      if (!call) {
        throw new Error(
          `Failed to join a call with id: ${currentIncomingRingCall.id}`,
        );
      } else {
        InCallManager.start({ media: 'video' });
        InCallManager.setForceSpeakerphoneOn(true);
        await call.join(localMediaStream, localMediaStream);
        await call.publish(localMediaStream, localMediaStream);
        await videoClient.answerCall(currentIncomingRingCall.callCid);
        navigation.navigate('ActiveCall');
      }
    }
  };

  const rejectCall = async () => {
    if (videoClient) {
      await videoClient.rejectCall(currentIncomingRingCall.callCid);
      await navigation.navigate('HomeScreen');
    }
  };

  const cancelCall = async () => {
    if (videoClient && activeRingCall) {
      await videoClient.cancelCall(activeRingCall.callCid);
      await navigation.navigate('HomeScreen');
    }
  };

  return { answerCall, cancelCall, rejectCall };
};
