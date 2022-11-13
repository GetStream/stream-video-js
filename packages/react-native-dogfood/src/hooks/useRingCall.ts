import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import InCallManager from 'react-native-incall-manager';
import { useCallKeep } from '../hooks/useCallKeep';

export const useRingCall = () => {
  const videoClient = useAppGlobalStoreValue((store) => store.videoClient);
  const username = useAppGlobalStoreValue((store) => store.username);
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );

  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'IncomingCallScreen'>
    >();
  const setState = useAppGlobalStoreSetState();
  const { startCall } = useCallKeep();

  const route = useRoute<RouteProp<RootStackParamList, 'IncomingCallScreen'>>();
  const { params } = route;

  const answerCall = async () => {
    if (videoClient) {
      const call = await videoClient.joinCall({
        id: params.id,
        type: 'default',
        datacenterId: '',
      });
      if (!call) {
        throw new Error(`Failed to join a call with id: ${params.id}`);
      } else {
        InCallManager.start({ media: 'video' });
        InCallManager.setForceSpeakerphoneOn(true);
        await call.join(localMediaStream, localMediaStream);
        await call.publish(localMediaStream, localMediaStream);
        await videoClient.answerCall(params.callCid);
        setState({ activeCall: params, call: call });
        startCall({
          callID: params.id,
          createdByUserId: username,
        });
        navigation.navigate('ActiveCall');
      }
    }
  };

  const rejectCall = async () => {
    if (videoClient) {
      await videoClient.rejectCall(params.callCid);
      await navigation.navigate('HomeScreen');
    }
  };

  return { answerCall, rejectCall };
};
