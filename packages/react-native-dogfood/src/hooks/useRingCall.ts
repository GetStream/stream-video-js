import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import InCallManager from 'react-native-incall-manager';
import { useStore } from './useStore';
import { useObservableValue } from './useObservable';
import { useCallback } from 'react';
import { useStreamVideoClient } from '@stream-io/video-react-native-sdk';

export const useRingCall = () => {
  const videoClient = useStreamVideoClient();
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );
  const { incomingRingCalls$, activeRingCallMeta$ } = useStore();
  const incomingRingCalls = useObservableValue(incomingRingCalls$);
  const activeRingCallMeta = useObservableValue(activeRingCallMeta$);

  const currentIncomingRingCall =
    incomingRingCalls[incomingRingCalls.length - 1];

  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'IncomingCallScreen'>
    >();

  const answerCall = useCallback(async () => {
    if (!videoClient) {
      return;
    }
    const call = await videoClient.joinCall({
      id: currentIncomingRingCall.id,
      type: 'default',
      datacenterId: '',
      input: {
        ring: true,
        members: [],
      },
    });
    if (!call) {
      throw new Error(
        `Failed to join a call with id: ${currentIncomingRingCall.id}`,
      );
    } else {
      InCallManager.start({ media: 'video' });
      InCallManager.setForceSpeakerphoneOn(true);
      await call.join(localMediaStream, localMediaStream);
      await call.publishMediaStreams(localMediaStream, localMediaStream);
      await videoClient.acceptCall(currentIncomingRingCall.callCid);
      navigation.navigate('ActiveCall');
    }
  }, [currentIncomingRingCall, navigation, localMediaStream, videoClient]);

  const rejectCall = useCallback(async () => {
    if (!videoClient) {
      return;
    }
    await videoClient.rejectCall(currentIncomingRingCall.callCid);
    await navigation.navigate('HomeScreen');
  }, [currentIncomingRingCall, videoClient, navigation]);

  const cancelCall = useCallback(async () => {
    if (videoClient && activeRingCallMeta) {
      await videoClient.cancelCall(activeRingCallMeta.callCid);
      await navigation.navigate('HomeScreen');
    }
  }, [activeRingCallMeta, navigation, videoClient]);

  return { answerCall, cancelCall, rejectCall };
};
